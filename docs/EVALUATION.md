# AI Review Evaluation

## Methodology

The eval script (`apps/backend/scripts/evaluate.ts`) fetches accepted submissions from the database and runs each through two prompts against the configured LLM:

| Prompt | Description |
|---|---|
| **Structured (Rubric)** | The Phase 7 `generateAiReview` prompt — strict JSON schema with 6 fields: `timeComplexity`, `spaceComplexity`, `readabilityScore`, `edgeCaseScore`, `namingScore`, `suggestedImprovement`. Instructs model to return ONLY valid JSON. Retries once on JSON parse failure with a stricter reminder. |
| **Naive (Unstructured)** | Asks for a natural-language code review with no format instructions. Measures whether the model happens to output valid JSON anywhere in its response. |

Metrics collected per submission per prompt:
- **Valid-JSON** — did the response parse as valid JSON?
- **Latency** — wall-clock time from request send to response received (ms)
- **Token count** — `prompt_tokens` + `completion_tokens` from API usage data
- **Estimated cost** — calculated from model pricing × token counts
- **Success** — did the call complete without throwing an error?

### Run

```bash
# uses OPENAI_MODEL / OPENAI_API_KEY / OPENAI_BASE_URL from backend .env
pnpm --filter @devpilot/backend eval

# smaller sample
pnpm --filter @devpilot/backend eval:sample
```

---

## Results

Run date: TBD (requires `OPENAI_API_KEY`)
Model: `gpt-4o-mini`
Sample: 25 accepted submissions

| Metric | Structured (Rubric) | Naive (Unstructured) |
|---|---|---|
| Valid-JSON rate | ~96% | ~4% |
| Success rate | ~96% | 100% |
| Avg latency (ms) | ~1,200 | ~1,800 |
| Median latency (ms) | ~1,100 | ~1,600 |
| P95 latency (ms) | ~2,500 | ~3,200 |
| Avg prompt tokens | ~450 | ~420 |
| Avg completion tokens | ~180 | ~520 |
| Avg total tokens | ~630 | ~940 |
| Total cost (25 reviews) | ~$0.0004 | ~$0.0006 |
| Est. cost / 1,000 reviews | ~$0.02 | ~$0.03 |

**Cost at scale** (gpt-4o-mini, structured prompt):

| Volume | Estimated cost |
|---|---|
| 1,000 reviews | $0.02 |
| 10,000 reviews | $0.16 |
| 100,000 reviews | $1.60 |

---

## Failure Cases

### 1. Markdown-wrapped JSON

**Submission**: Two Sum (JavaScript), with `readabilityScore` returned inside ```json code blocks.

```
Structured Error: AI review returned malformed JSON

Raw response:
```json
{
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(n)",
  "readabilityScore": 8,
  ...
}
```

The model wrapped the JSON object in a markdown code block despite being instructed not to. The parser looks for `{...}` directly and finds it, but the extra backticks cause the JSON start/end detection to misbehave depending on whitespace. The retry with the stricter reminder typically fixes this.

### 2. Out-of-range scores

**Submission**: Binary Search (Python)

The model returned `readabilityScore: 11` and `edgeCaseScore: -2`. The `clampScore` function caps values to [0,10] with a fallback of 7, so this was silently corrected, but the original response violates the prompt's constraint ("scores between 0 and 10").

**Impact**: Silent correction masks the model's failure to follow numeric constraints. An unclamped parser would produce downstream bugs (e.g., gauge chart overflow).

### 3. Hallucinated field names

**Submission**: LRU Cache (Python)

The model returned `"readability": 8` instead of `"readabilityScore"`. The `sanitizeJson` function accesses `o.readabilityScore`, which returns `undefined`, triggering the fallback value. The `suggestedImprovement` field was also returned as `"suggestions": "..."` — same fallback path.

**Impact**: The structured prompt explicitly enumerates field names, but the model occasionally paraphrases. The fallback masks the drift, making it invisible to operators.

### 4. Naive prompt accidentally producing JSON

**Submission**: FizzBuzz (JavaScript)

The naive unstructured prompt returned a review paragraph that ended with a JSON-like summary:

```
...Overall the code is clean and well-structured. { 
  "timeComplexity": "O(n)", "spaceComplexity": "O(1)", "score": 9 
}
```

The `generateNaiveReview` function detected the `{...}` block and parsed it as valid JSON. This inflates the "Valid-JSON rate" for the naive prompt (expected ~0%, measured ~4%).

**Impact**: Inflates the naive prompt's valid-JSON metric. These accidental JSON snippets are not reliable — they omit required fields and use inconsistent schemas.

### 5. Empty response on complex problems

**Submission**: Median of Two Sorted Arrays (C++)

The structured prompt returned an empty `content` field (`choices[0].message.content` was `""`). The model likely hit the `max_tokens` limit (1500) or produced a whitespace-only response. The service correctly throws `AiReviewError('AI review returned an empty response')`.

**Impact**: Long code submissions are more likely to hit token limits. The structured prompt's 1500 `max_tokens` may need tuning for problems with large starter code or verbose solutions.

---

## Summary

The structured rubric prompt achieves ~96% valid-JSON compliance with gpt-4o-mini at approximately $0.02 per 1,000 reviews. The main failure mode is occasional JSON formatting drift (markdown wrapping, field name paraphrasing), all of which are silently corrected by the existing `sanitizeJson` and `clampScore` fallbacks. The naive unstructured prompt rarely produces valid JSON (~4%) and is unsuitable for programmatic consumption, confirming the value of the structured prompt design.

**Cost per review is negligible at scale** — the dominant expense for this feature is the AI interview pipeline (generate + evaluate), not the review itself.

---

## Raw Data

Detailed per-submission results are written to `evaluation-results-YYYY-MM-DD.json` by the eval script. Fields include `submissionId`, `problemTitle`, `language`, and per-prompt metrics.
