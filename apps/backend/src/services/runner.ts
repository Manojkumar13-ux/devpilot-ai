import type { TestResult } from "@devpilot/shared";

interface TestCaseData {
  input: string;
  expectedOutput: string;
}

const WORK_DIR = '/tmp';

const JS_RESERVED = new Set([
  'var','let','const','function','class','return','if','else','for','while','do',
  'switch','case','break','continue','new','this','typeof','instanceof','void',
  'delete','try','catch','finally','throw','async','await','yield','import','export',
  'from','of','in','true','false','null','undefined'
]);

function extractFunctionName(code: string, language: string): string | null {
  switch (language) {
    case "javascript":
    case "typescript": {
      const patterns = [
        /function\s+(\w+)/g,
        /(?:var|let|const)\s+(\w+)\s*=\s*(?:function|\(|async)/g,
        /(\w+)\s*=\s*\([^)]*\)\s*=>/g,
        /(\w+)\s*\([^)]*\)\s*\{/g,
      ];
      const candidates: { name: string; index: number }[] = [];
      for (const re of patterns) {
        let m: RegExpExecArray | null;
        while ((m = re.exec(code)) !== null) {
          if (m[1] && !JS_RESERVED.has(m[1])) {
            candidates.push({ name: m[1], index: m.index });
          }
        }
      }
      if (candidates.length === 0) return null;
      candidates.sort((a, b) => b.index - a.index);
      return candidates[0].name;
    }
    case "python":
      return code.match(/def\s+(\w+)/)?.[1] ?? null;
    case "java": {
      const skip = new Set(['main', 'toString', 'hashCode', 'equals', 'Solution']);
      const methods = [...code.matchAll(/(?:public\s+\S+\s+)?(\w+)\s*\([^)]*\)\s*(?:\{|throws)/g)];
      const candidates = methods.filter(m => !skip.has(m[1]));
      if (candidates.length > 0) return candidates[candidates.length - 1][1];
      const fallback = code.match(/(\w+)\s*\([^)]*\)\s*\{/);
      return fallback?.[1] ?? null;
    }
    case "cpp": {
      const skip = new Set(['main']);
      const methods = [...code.matchAll(/(\w+)\s*\([^)]*\)\s*(?:\{|const)/g)];
      const candidates = methods.filter(m => !skip.has(m[1]));
      if (candidates.length > 0) return candidates[candidates.length - 1][1];
      return code.match(/auto\s+(\w+)\s*=/)?.[1] ?? null;
    }
    case "c": {
      const m = code.match(/(\w+)\s*\([^)]*\)\s*\{/);
      return m?.[1] ?? null;
    }
    case "go":
      return code.match(/func\s+(\w+)/)?.[1] ?? null;
    case "rust":
      return code.match(/fn\s+(\w+)/)?.[1] ?? null;
    default:
      return null;
  }
}

export function generateSubmitRunner(
  language: string,
  userCode: string,
  testCases: TestCaseData[]
): { files: Record<string, string>; command: string } {
  const fnName = extractFunctionName(userCode, language) ?? "solution";
  const testCasesJson = JSON.stringify(testCases);

  switch (language) {
    case "javascript":
      return generateJsRunner(userCode, fnName, testCasesJson);
    case "typescript":
      return generateTsRunner(userCode, fnName, testCasesJson);
    case "python":
      return generatePyRunner(userCode, fnName, testCasesJson);
    case "java":
      return generateJavaRunner(userCode, fnName, testCasesJson);
    case "cpp":
      return generateCppRunner(userCode, fnName, testCasesJson);
    case "c":
      return generateCRunner(userCode, fnName, testCasesJson);
    case "go":
      return generateGoRunner(userCode, fnName, testCasesJson);
    case "rust":
      return generateRustRunner(userCode, fnName, testCasesJson);
    default:
      return generateJsRunner(userCode, fnName, testCasesJson);
  }
}

/* ---------- JavaScript ---------- */
function generateJsRunner(
  code: string,
  fn: string,
  testCasesJson: string
): { files: Record<string, string>; command: string } {
  let isDesignProblem = false;
  let className = '';
  try {
    const tcs = JSON.parse(testCasesJson);
    if (tcs.length > 0) {
      const firstInput = JSON.parse(tcs[0].input);
      isDesignProblem = firstInput && typeof firstInput === 'object' && 'ops' in firstInput && 'args' in firstInput;
    }
    const classMatch = code.match(/(?:class\s+(\w+))/);
    if (classMatch) className = classMatch[1];
  } catch {}

  if (isDesignProblem) {
    const runner = `
const fs = require('fs');
${code}
const testCases = ${testCasesJson};
const deepEq = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEq(v, b[i]));
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every(k => deepEq(a[k], b[k]));
  }
  return false;
};
const results = [];
for (const tc of testCases) {
  const start = process.hrtime.bigint();
  try {
    const inp = JSON.parse(tc.input);
    const ops = inp.ops;
    const argsList = inp.args;
    let obj = null;
    const out = [];
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const arg = argsList[i];
      if (op === "${className}") {
        obj = new ${className}(...arg);
        out.push(null);
      } else {
        const val = obj[op](...arg);
        out.push(val !== undefined ? val : null);
      }
    }
    const end = process.hrtime.bigint();
    const rt = Number(end - start) / 1e6;
    const pass = deepEq(out, JSON.parse(tc.expectedOutput));
    results.push({ pass, runtime: Math.round(rt * 100) / 100, memory: 0, error: null, expected: tc.expectedOutput, actual: JSON.stringify(out) });
  } catch (e) {
    results.push({ pass: false, runtime: 0, memory: 0, error: e.message || String(e), expected: tc.expectedOutput, actual: null });
  }
}
process.stdout.write(JSON.stringify({ results }));
`;
    return { files: { "runner.js": runner }, command: `node ${WORK_DIR}/runner.js` };
  }

  if (className) {
    const runner = `
const fs = require('fs');
${code}
const testCases = ${testCasesJson};
const deepEq = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEq(v, b[i]));
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every(k => deepEq(a[k], b[k]));
  }
  return false;
};
const results = [];
for (const tc of testCases) {
  const start = process.hrtime.bigint();
  try {
    const args = Object.values(JSON.parse(tc.input));
    const sol = new ${className}();
    const result = sol.${fn}(...args);
    const end = process.hrtime.bigint();
    const rt = Number(end - start) / 1e6;
    const pass = deepEq(result, JSON.parse(tc.expectedOutput));
    results.push({ pass, runtime: Math.round(rt * 100) / 100, memory: 0, error: null, expected: tc.expectedOutput, actual: JSON.stringify(result) });
  } catch (e) {
    results.push({ pass: false, runtime: 0, memory: 0, error: e.message || String(e), expected: tc.expectedOutput, actual: null });
  }
}
process.stdout.write(JSON.stringify({ results }));
`;
    return { files: { "runner.js": runner }, command: `node ${WORK_DIR}/runner.js` };
  }

  const runner = `
const fs = require('fs');
${code}
const testCases = ${testCasesJson};
const deepEq = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEq(v, b[i]));
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every(k => deepEq(a[k], b[k]));
  }
  return false;
};
const results = [];
for (const tc of testCases) {
  const start = process.hrtime.bigint();
  try {
    const args = Object.values(JSON.parse(tc.input));
    const result = ${fn}(...args);
    const end = process.hrtime.bigint();
    const rt = Number(end - start) / 1e6;
    const pass = deepEq(result, JSON.parse(tc.expectedOutput));
    results.push({ pass, runtime: Math.round(rt * 100) / 100, memory: 0, error: null, expected: tc.expectedOutput, actual: JSON.stringify(result) });
  } catch (e) {
    results.push({ pass: false, runtime: 0, memory: 0, error: e.message || String(e), expected: tc.expectedOutput, actual: null });
  }
}
process.stdout.write(JSON.stringify({ results }));
`;
  return { files: { "runner.js": runner }, command: `node ${WORK_DIR}/runner.js` };
}

/* ---------- Python ---------- */
function generatePyRunner(
  code: string,
  fn: string,
  testCasesJson: string
): { files: Record<string, string>; command: string } {
  const classMatch = code.match(/^class\s+(\w+)/m);
  const className = classMatch ? classMatch[1] : '';

  // Detect design problem: test case input has ops/args format
  let isDesignProblem = false;
  try {
    const tcs = JSON.parse(testCasesJson);
    if (tcs.length > 0) {
      const firstInput = JSON.parse(tcs[0].input);
      isDesignProblem = firstInput && typeof firstInput === 'object' && 'ops' in firstInput && 'args' in firstInput;
    }
  } catch {}

  // Design/class problems (LRU Cache, Min Stack, MyQueue, etc.) — ops/args pattern
  if (isDesignProblem) {
    const runner = `
import json, time, sys
${code}
test_cases = ${testCasesJson}
results = []
for tc in test_cases:
    start = time.time()
    try:
        inp = json.loads(tc["input"])
        ops = inp["ops"]
        args_list = inp["args"]
        obj = None
        out = []
        for op, arg in zip(ops, args_list):
            if op == "${className}":
                obj = ${className}(*arg)
                out.append(None)
            else:
                method = getattr(obj, op)
                val = method(*arg)
                out.append(val)
        result = out
        elapsed = (time.time() - start) * 1000
        pass_val = json.dumps(result, default=str) == json.dumps(json.loads(tc["expectedOutput"]), default=str)
        results.append({"pass": pass_val, "runtime": round(elapsed, 2), "memory": 0, "error": None, "expected": tc["expectedOutput"], "actual": json.dumps(result, default=str)})
    except Exception as e:
        results.append({"pass": False, "runtime": 0, "memory": 0, "error": str(e), "expected": tc["expectedOutput"], "actual": None})
print(json.dumps({"results": results}))
`;
    return { files: { "runner.py": runner }, command: `python3 ${WORK_DIR}/runner.py` };
  }

  // Class-based function problem (e.g., class Solution: def twoSum)
  if (className) {
    const runner = `
import json, time, sys
${code}
test_cases = ${testCasesJson}
results = []
for tc in test_cases:
    start = time.time()
    try:
        inp = json.loads(tc["input"])
        sol = ${className}()
        result = sol.${fn}(**inp)
        elapsed = (time.time() - start) * 1000
        pass_val = json.dumps(result, default=str) == json.dumps(json.loads(tc["expectedOutput"]), default=str)
        results.append({"pass": pass_val, "runtime": round(elapsed, 2), "memory": 0, "error": None, "expected": tc["expectedOutput"], "actual": json.dumps(result, default=str)})
    except Exception as e:
        results.append({"pass": False, "runtime": 0, "memory": 0, "error": str(e), "expected": tc["expectedOutput"], "actual": None})
print(json.dumps({"results": results}))
`;
    return { files: { "runner.py": runner }, command: `python3 ${WORK_DIR}/runner.py` };
  }

  // Bare function (no class) — e.g. from custom problems
  const runner = `
import json, time, sys
${code}
test_cases = ${testCasesJson}
results = []
for tc in test_cases:
    start = time.time()
    try:
        inp = json.loads(tc["input"])
        result = ${fn}(**inp)
        elapsed = (time.time() - start) * 1000
        pass_val = json.dumps(result, default=str) == json.dumps(json.loads(tc["expectedOutput"]), default=str)
        results.append({"pass": pass_val, "runtime": round(elapsed, 2), "memory": 0, "error": None, "expected": tc["expectedOutput"], "actual": json.dumps(result, default=str)})
    except Exception as e:
        results.append({"pass": False, "runtime": 0, "memory": 0, "error": str(e), "expected": tc["expectedOutput"], "actual": None})
print(json.dumps({"results": results}))
`;
  return { files: { "runner.py": runner }, command: `python3 ${WORK_DIR}/runner.py` };
}

/* ---------- Java ---------- */
function generateJavaRunner(
  code: string,
  fn: string,
  testCasesJson: string
): { files: Record<string, string>; command: string } {
  const classMatch = code.match(/(?:public\s+)?class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'Solution';

  let isDesignProblem = false;
  try {
    const tcs = JSON.parse(testCasesJson);
    if (tcs.length > 0) {
      const firstInput = JSON.parse(tcs[0].input);
      isDesignProblem = firstInput && typeof firstInput === 'object' && 'ops' in firstInput && 'args' in firstInput;
    }
  } catch {}

  // ---- Shared Helpers (injected into every Java runner) ----
  const sharedHelpers = `
  static Object convert(Object val, Class<?> target) {
    if (val == null) return null;
    if (target == int.class || target == Integer.class) return ((Number) val).intValue();
    if (target == long.class || target == Long.class) return ((Number) val).longValue();
    if (target == double.class || target == Double.class) return ((Number) val).doubleValue();
    if (target == float.class || target == Float.class) return ((Number) val).floatValue();
    if (target == String.class) return val instanceof String ? val : val.toString();
    if (target == boolean.class || target == Boolean.class) return val instanceof Boolean ? val : Boolean.valueOf(val.toString());
    if (target == int[].class) {
      List<?> list = (List<?>) val; int[] arr = new int[list.size()];
      for (int i = 0; i < list.size(); i++) arr[i] = ((Number) list.get(i)).intValue(); return arr;
    }
    if (target == int[][].class) {
      List<List<?>> list = (List<List<?>>) val; int[][] arr = new int[list.size()][];
      for (int i = 0; i < list.size(); i++) { List<?> inner = list.get(i); arr[i] = new int[inner.size()]; for (int j = 0; j < inner.size(); j++) arr[i][j] = ((Number) inner.get(j)).intValue(); } return arr;
    }
    if (target == long[].class) {
      List<?> list = (List<?>) val; long[] arr = new long[list.size()];
      for (int i = 0; i < list.size(); i++) arr[i] = ((Number) list.get(i)).longValue(); return arr;
    }
    if (target == double[].class) {
      List<?> list = (List<?>) val; double[] arr = new double[list.size()];
      for (int i = 0; i < list.size(); i++) arr[i] = ((Number) list.get(i)).doubleValue(); return arr;
    }
    if (target == String[].class) { List<?> list = (List<?>) val; return list.toArray(new String[0]); }
    if (target == char[].class) {
      List<?> list = (List<?>) val; char[] arr = new char[list.size()];
      for (int i = 0; i < list.size(); i++) arr[i] = list.get(i) instanceof String ? ((String)list.get(i)).charAt(0) : (char)list.get(i); return arr;
    }
    if (target == char[][].class) {
      List<List<?>> list = (List<List<?>>) val; char[][] arr = new char[list.size()][];
      for (int i = 0; i < list.size(); i++) { List<?> inner = list.get(i); arr[i] = new char[inner.size()]; for (int j = 0; j < inner.size(); j++) arr[i][j] = inner.get(j) instanceof String ? ((String)inner.get(j)).charAt(0) : (char)inner.get(j); } return arr;
    }
    String simpleName = target.getSimpleName();
    if ((simpleName.equals("ListNode") || simpleName.equals("Node")) && val instanceof List) {
      List<?> list = (List<?>) val;
      try {
        Constructor<?> ctor = target.getDeclaredConstructor(int.class);
        Field valField = target.getDeclaredField("val");
        Field nextField = target.getDeclaredField("next");
        Object head = null, prev = null;
        for (Object item : list) {
          Object node = ctor.newInstance(((Number) item).intValue());
          if (head == null) head = node;
          if (prev != null) nextField.set(prev, node);
          prev = node;
        }
        return head;
      } catch (Exception e) { return val; }
    }
    if (simpleName.equals("TreeNode") && val instanceof List) {
      List<?> list = (List<?>) val;
      try {
        Constructor<?> ctor = target.getDeclaredConstructor(int.class);
        Field leftField = target.getDeclaredField("left");
        Field rightField = target.getDeclaredField("right");
        if (list.isEmpty() || list.get(0) == null) return null;
        Object root = ctor.newInstance(((Number) list.get(0)).intValue());
        Queue<Object> q = new LinkedList<>(); q.offer(root);
        int i = 1;
        while (!q.isEmpty() && i < list.size()) {
          Object node = q.poll();
          if (list.get(i) != null) { Object left = ctor.newInstance(((Number) list.get(i)).intValue()); leftField.set(node, left); q.offer(left); }
          i++;
          if (i < list.size() && list.get(i) != null) { Object right = ctor.newInstance(((Number) list.get(i)).intValue()); rightField.set(node, right); q.offer(right); }
          i++;
        }
        return root;
      } catch (Exception e) { return val; }
    }
    if (val instanceof List) return val;
    return val;
  }

  static String escape(String s) { return s.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\""); }
  static List<Integer> toList(int[] arr) { List<Integer> list = new ArrayList<>(); for (int v : arr) list.add(v); return list; }

  static List<Map<String, Object>> parseTests(String json) {
    List<Map<String, Object>> result = new ArrayList<>();
    json = json.trim();
    if (!json.startsWith("[")) return result;
    json = json.substring(1, json.length() - 1).trim();
    int depth = 0; int start = 0; boolean inStr = false;
    for (int i = 0; i < json.length(); i++) {
      char c = json.charAt(i);
      if (c == '"' && (i == 0 || json.charAt(i-1) != '\\\\')) inStr = !inStr;
      if (inStr) continue;
      if (c == '{' || c == '[') depth++;
      else if (c == '}' || c == ']') depth--;
      else if (c == ',' && depth == 0) { result.add(parseObj(json.substring(start, i))); start = i + 1; }
    }
    if (start < json.length()) result.add(parseObj(json.substring(start)));
    return result;
  }

  static Map<String, Object> parseObj(String s) {
    Map<String, Object> map = new LinkedHashMap<>();
    s = s.trim();
    if (!s.startsWith("{")) return map;
    s = s.substring(1, s.length() - 1).trim();
    int i = 0;
    while (i < s.length()) {
      while (i < s.length() && s.charAt(i) == ' ') i++;
      if (i >= s.length()) break;
      if (s.charAt(i) == '"') {
        i++; StringBuilder key = new StringBuilder();
        while (i < s.length() && s.charAt(i) != '"') {
          if (s.charAt(i) == '\\\\' && i + 1 < s.length()) { key.append(s.charAt(i+1)); i += 2; }
          else { key.append(s.charAt(i)); i++; }
        }
        i++;
        while (i < s.length() && s.charAt(i) != ':') i++;
        i++;
        while (i < s.length() && s.charAt(i) == ' ') i++;
        ParseResult val = parseValue(s, i);
        map.put(key.toString(), val.value);
        i = val.end;
      }
      while (i < s.length() && s.charAt(i) != ',' && s.charAt(i) != '}') i++;
      if (i < s.length() && s.charAt(i) == ',') i++;
    }
    return map;
  }

  static class ParseResult { Object value; int end; ParseResult(Object v, int e) { value = v; end = e; } }

  static ParseResult parseValue(String s, int i) {
    while (i < s.length() && s.charAt(i) == ' ') i++;
    if (i >= s.length()) return new ParseResult(null, i);
    char c = s.charAt(i);
    if (c == '"') {
      i++; StringBuilder sb = new StringBuilder();
      while (i < s.length() && s.charAt(i) != '"') {
        if (s.charAt(i) == '\\\\' && i + 1 < s.length()) { sb.append(s.charAt(i+1)); i += 2; }
        else { sb.append(s.charAt(i)); i++; }
      }
      return new ParseResult(sb.toString(), i + 1);
    }
    if (c == '[') {
      List<Object> list = new ArrayList<>(); i++;
      while (i < s.length() && s.charAt(i) != ']') {
        while (i < s.length() && (s.charAt(i) == ',' || s.charAt(i) == ' ')) i++;
        if (i >= s.length() || s.charAt(i) == ']') break;
        int prev = i;
        ParseResult pr = parseValue(s, i);
        list.add(pr.value);
        i = pr.end;
        if (i == prev) i++;
      }
      return new ParseResult(list, i + 1);
    }
    if (c == '{') { int end = findMatching(s, i); return new ParseResult(parseObj(s.substring(i, end + 1)), end + 1); }
    if (c == 'n') { i += 4; return new ParseResult(null, i); }
    if (c == 't') { i += 4; return new ParseResult(true, i); }
    if (c == 'f') { i += 5; return new ParseResult(false, i); }
    StringBuilder num = new StringBuilder();
    if (c == '-' || c == '+' || Character.isDigit(c)) {
      if (c == '-' || c == '+') { num.append(c); i++; }
      while (i < s.length() && Character.isDigit(s.charAt(i))) { num.append(s.charAt(i)); i++; }
      if (i < s.length() && s.charAt(i) == '.') {
        num.append('.'); i++;
        while (i < s.length() && Character.isDigit(s.charAt(i))) { num.append(s.charAt(i)); i++; }
        String ns = num.toString();
        if (ns.equals("-.") || ns.equals("+.") || ns.equals(".")) return new ParseResult(0, i);
        return new ParseResult(Double.parseDouble(ns), i);
      }
      String ns = num.toString();
      if (ns.equals("-") || ns.equals("+") || ns.isEmpty()) return new ParseResult(0, i);
      try { return new ParseResult(Integer.parseInt(ns), i); } catch (NumberFormatException e) { return new ParseResult(0, i); }
    }
    return new ParseResult(null, i);
  }

  static int findMatching(String s, int i) {
    char open = s.charAt(i); char close = open == '{' ? '}' : ']';
    int depth = 1; i++; boolean inStr = false;
    while (i < s.length() && depth > 0) {
      char c = s.charAt(i);
      if (c == '"' && (i == 0 || s.charAt(i-1) != '\\\\')) inStr = !inStr;
      if (!inStr) { if (c == open) depth++; else if (c == close) depth--; }
      i++;
    }
    return i - 1;
  }

  static String toJson(Object o) {
    if (o == null) return "null";
    if (o instanceof String) return "\\"" + escape((String) o) + "\\"";
    if (o instanceof Boolean || o instanceof Number) return o.toString();
    String cn = o.getClass().getSimpleName();
    if ((cn.equals("ListNode") || cn.equals("Node"))) {
      try {
        List<Object> list = new ArrayList<>();
        Field valField = o.getClass().getDeclaredField("val");
        Field nextField = o.getClass().getDeclaredField("next");
        Object curr = o;
        while (curr != null) {
          list.add(valField.get(curr));
          curr = nextField.get(curr);
        }
        return toJson(list);
      } catch (Exception e) { return o.toString(); }
    }
    if (cn.equals("TreeNode")) {
      try {
        List<Object> list = new ArrayList<>();
        Field valField = o.getClass().getDeclaredField("val");
        Field leftField = o.getClass().getDeclaredField("left");
        Field rightField = o.getClass().getDeclaredField("right");
        Queue<Object> q = new LinkedList<>(); q.offer(o);
        while (!q.isEmpty()) {
          Object node = q.poll();
          if (node == null) { list.add(null); continue; }
          list.add(valField.get(node)); q.offer(leftField.get(node)); q.offer(rightField.get(node));
        }
        int last = list.size() - 1;
        while (last >= 0 && list.get(last) == null) last--;
        return toJson(last >= 0 ? list.subList(0, last + 1) : new ArrayList<>());
      } catch (Exception e) { return o.toString(); }
    }
    if (o instanceof List) {
      StringBuilder sb = new StringBuilder("[");
      for (Object v : (List<?>) o) { if (sb.length() > 1) sb.append(","); sb.append(toJson(v)); }
      sb.append("]"); return sb.toString();
    }
    if (o instanceof Map) {
      StringBuilder sb = new StringBuilder("{");
      for (Map.Entry<?, ?> e : ((Map<?, ?>) o).entrySet()) {
        if (sb.length() > 1) sb.append(",");
        sb.append("\\"").append(e.getKey()).append("\\":").append(toJson(e.getValue()));
      }
      sb.append("}"); return sb.toString();
    }
    if (o instanceof int[]) return toJson(toList((int[]) o));
    if (o instanceof long[]) { List<Long> list = new ArrayList<>(); for (long v : (long[])o) list.add(v); return toJson(list); }
    if (o instanceof double[]) { List<Double> list = new ArrayList<>(); for (double v : (double[])o) list.add(v); return toJson(list); }
    if (o instanceof char[]) return toJson(new String((char[]) o));
    return o.toString();
  }

  static String normalizeJson(String s) {
    s = s.trim();
    try {
      ParseResult pr = parseValue(s, 0);
      if (pr.end >= s.length()) {
        return toJson(pr.value);
      }
    } catch (Exception e) { /* fall through to return s unchanged */ }
    return s;
  }
`;

  if (isDesignProblem) {
    const harness = `
import java.util.*;
import java.io.*;
import java.nio.file.*;
import java.lang.reflect.*;

public class Runner {
  private static final String TD = "${WORK_DIR}";

  public static void main(String[] args) throws Exception {
    String content = new String(Files.readAllBytes(Paths.get(TD + "/testcases.json")));
    List<Map<String, Object>> testCases = parseTests(content);
    List<Map<String, Object>> results = new ArrayList<>();
    for (Map<String, Object> tc : testCases) {
      long start = System.nanoTime();
      try {
        String inputJson = (String) tc.get("input");
        Map<String, Object> parsed = parseObj(inputJson);
        @SuppressWarnings("unchecked")
        List<String> ops = (List<String>) parsed.get("ops");
        @SuppressWarnings("unchecked")
        List<List<Object>> argsList = (List<List<Object>>) parsed.get("args");
        Object obj = null;
        List<Object> out = new ArrayList<>();
        for (int i = 0; i < ops.size(); i++) {
          String op = ops.get(i);
          List<Object> arg = argsList.get(i);
          if (op.equals("${className}")) {
            Constructor<?>[] ctors = ${className}.class.getDeclaredConstructors();
            Constructor<?> ctor = ctors[0];
            Class<?>[] paramTypes = ctor.getParameterTypes();
            Object[] convertedArgs = new Object[arg.size()];
            for (int j = 0; j < arg.size(); j++) convertedArgs[j] = convert(arg.get(j), paramTypes[j]);
            obj = ctor.newInstance(convertedArgs);
            out.add(null);
          } else {
            Method method = findMethod(obj.getClass(), op);
            if (method != null) {
              Class<?>[] paramTypes = method.getParameterTypes();
              Object[] convertedArgs = new Object[arg.size()];
              for (int j = 0; j < arg.size(); j++) convertedArgs[j] = convert(arg.get(j), paramTypes[j]);
              Object result = method.invoke(obj, convertedArgs);
              out.add(result);
            } else {
              out.add(null);
            }
          }
        }
        long end = System.nanoTime();
        double rt = (end - start) / 1_000_000.0;
        String expected = normalizeJson((String) tc.get("expectedOutput"));
        String actual = toJson(out);
        boolean pass = actual.equals(expected);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("pass", pass); r.put("runtime", Math.round(rt * 100) / 100.0);
        r.put("memory", 0); r.put("error", null);
        r.put("expected", expected); r.put("actual", actual);
        results.add(r);
      } catch (Exception e) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("pass", false); r.put("runtime", 0); r.put("memory", 0);
        r.put("error", e.getMessage() == null ? "Runtime error" : e.getMessage());
        r.put("expected", tc.get("expectedOutput")); r.put("actual", null);
        results.add(r);
      }
    }
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("results", results);
    System.out.println(toJson(out));
  }

  static Method findMethod(Class<?> clazz, String name) {
    for (Method m : clazz.getMethods()) {
      if (m.getName().equals(name)) return m;
    }
    return null;
  }

${sharedHelpers}
}
`;
    return {
      files: {
        "Solution.java": code.replace(/\bpublic\s+class\s+\w+/g, "class " + className),
        "Runner.java": harness,
        "testcases.json": testCasesJson,
      },
      command: `javac -d ${WORK_DIR} ${WORK_DIR}/Solution.java ${WORK_DIR}/Runner.java && java -cp ${WORK_DIR} Runner`,
    };
  }

  // ---- Function problem runner ----
  const harness = `
import java.util.*;
import java.io.*;
import java.nio.file.*;
import java.lang.reflect.*;

public class Runner {
  private static final String TD = "${WORK_DIR}";

  public static void main(String[] args) throws Exception {
    ${className} sol = new ${className}();
    Method solutionMethod = null;
    for (Method m : sol.getClass().getDeclaredMethods()) {
      if (m.getName().equals("${fn}")) {
        solutionMethod = m;
        break;
      }
    }
    if (solutionMethod == null) throw new NoSuchMethodException("${fn}");
    Class<?>[] paramTypes = solutionMethod.getParameterTypes();

    String content = new String(Files.readAllBytes(Paths.get(TD + "/testcases.json")));
    List<Map<String, Object>> testCases = parseTests(content);
    List<Map<String, Object>> results = new ArrayList<>();
    for (Map<String, Object> tc : testCases) {
      long start = System.nanoTime();
      try {
        Object rawInput = tc.get("input");
        Map<String, Object> input;
        if (rawInput instanceof String) {
          Map<String, Object> parsed = parseObj((String) rawInput);
          input = parsed.isEmpty() ? parseTests((String) rawInput).get(0) : parsed;
        } else {
          input = (Map<String, Object>) rawInput;
        }
        Object[] invokeArgs = new Object[paramTypes.length];
        int idx = 0;
        for (Map.Entry<String, Object> e : input.entrySet()) {
          invokeArgs[idx] = convert(e.getValue(), paramTypes[idx]);
          idx++;
        }
        Object result = solutionMethod.invoke(sol, invokeArgs);
        long end = System.nanoTime();
        double rt = (end - start) / 1_000_000.0;
        String expected = normalizeJson((String) tc.get("expectedOutput"));
        String actual = toJson(result);
        boolean pass = actual.equals(expected);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("pass", pass); r.put("runtime", Math.round(rt * 100) / 100.0);
        r.put("memory", 0); r.put("error", null);
        r.put("expected", expected); r.put("actual", actual);
        results.add(r);
      } catch (Exception e) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("pass", false); r.put("runtime", 0); r.put("memory", 0);
        r.put("error", e.getMessage() == null ? "Runtime error" : e.getMessage());
        r.put("expected", tc.get("expectedOutput")); r.put("actual", null);
        results.add(r);
      }
    }
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("results", results);
    System.out.println(toJson(out));
  }

${sharedHelpers}
}
`;
  return {
    files: {
      "Solution.java": code.replace(/\bpublic\s+class\s+\w+/g, "class " + className),
      "Runner.java": harness,
      "testcases.json": testCasesJson,
    },
    command: `javac -d ${WORK_DIR} ${WORK_DIR}/Solution.java ${WORK_DIR}/Runner.java && java -cp ${WORK_DIR} Runner`,
  };
}

/* ---------- C++ ---------- */
function generateCppRunner(
  code: string,
  fn: string,
  testCasesJson: string
): { files: Record<string, string>; command: string } {
  const testCases = JSON.parse(testCasesJson);
  const firstInput = testCases.length > 0 ? JSON.parse(testCases[0].input) : {};
  const argKeys = Object.keys(firstInput);
  const argVals = Object.values(firstInput);

  const classMatch = code.match(/(?:class\s+)(\w+)/);
  const className = classMatch ? classMatch[1] : 'Solution';

  function extractJson(name: string, val: unknown): string {
    if (Array.isArray(val)) {
      if (val.length > 0 && Array.isArray(val[0])) {
        return `vector<vector<int>> ${name} = parseVecVecInt(inputVal["${name}"]);`;
      }
      if (val.length > 0 && typeof val[0] === "string") {
        return `vector<string> ${name} = parseVecStr(inputVal["${name}"]);`;
      }
      return `vector<int> ${name} = parseVecInt(inputVal["${name}"]);`;
    }
    if (typeof val === "string") return `string ${name} = inputVal["${name}"];`;
    if (typeof val === "boolean") return `bool ${name} = inputVal["${name}"] == "true";`;
    if (val === null) return `int ${name} = 0;`;
    return `int ${name} = inputVal["${name}"].empty() || inputVal["${name}"] == "null" ? 0 : stoi(inputVal["${name}"]);`;
  }

  function serResultFromExpected(expected: string): string {
    const trimmed = expected.trim();
    if (trimmed.startsWith('[')) {
      if (trimmed.includes('[')) return `toJsonVecVecInt(result)`;
      if (trimmed.includes('"') || trimmed.includes("\\\\")) return `toJsonVecStr(result)`;
      return `toJsonVecInt(result)`;
    }
    if (trimmed.startsWith('"')) return `"\\"" + escapeJson(result) + "\\""`;
    if (trimmed === 'true' || trimmed === 'false' || trimmed === 'null') return `result ? "true" : "false"`;
    if (trimmed.includes('.')) return `to_string(result)`;
    return `to_string(result)`;
  }

  const argExtract = argKeys.map((k, i) => extractJson(k, argVals[i])).join("\n      ");
  const argCall = argKeys.join(", ");
  const firstExpected = testCases.length > 0 ? testCases[0].expectedOutput : "";
  const serCode = firstExpected ? serResultFromExpected(firstExpected) : "to_string(result)";

  const runner = `
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <map>
#include <chrono>
#include <cstring>
#include <algorithm>
#include <cmath>
using namespace std;

${code}

string escapeJson(const string& s) {
  string r;
  for (char c : s) {
    if (c == '"') r += "\\\\\\"";
    else if (c == '\\\\') r += "\\\\\\\\";
    else r += c;
  }
  return r;
}

string readFile(const string& path) {
  ifstream f(path);
  stringstream ss;
  ss << f.rdbuf();
  return ss.str();
}

vector<int> parseVecInt(const string& s) {
  vector<int> v;
  size_t i = 0;
  while (i < s.size() && s[i] != '[') i++;
  if (i >= s.size()) return v;
  i++;
  while (i < s.size() && s[i] != ']') {
    while (i < s.size() && (s[i] == ' ' || s[i] == ',')) i++;
    if (i >= s.size() || s[i] == ']') break;
    int sign = 1;
    if (s[i] == '-') { sign = -1; i++; }
    int n = 0;
    while (i < s.size() && isdigit(s[i])) { n = n * 10 + (s[i] - '0'); i++; }
    v.push_back(n * sign);
  }
  return v;
}

vector<string> parseVecStr(const string& s) {
  vector<string> v;
  size_t i = 0;
  while (i < s.size() && s[i] != '[') i++;
  if (i >= s.size()) return v;
  i++;
  while (i < s.size() && s[i] != ']') {
    while (i < s.size() && (s[i] == ' ' || s[i] == ',')) i++;
    if (i >= s.size() || s[i] == ']') break;
    if (s[i] == '"') { i++; string t; while (i < s.size() && s[i] != '"') { t += s[i]; i++; } i++; v.push_back(t); }
    else { string t; while (i < s.size() && s[i] != ',' && s[i] != ']') { t += s[i]; i++; } v.push_back(t); }
  }
  return v;
}

vector<vector<int>> parseVecVecInt(const string& s) {
  vector<vector<int>> v;
  size_t i = 0;
  while (i < s.size() && s[i] != '[') i++;
  if (i >= s.size()) return v;
  i++;
  while (i < s.size()) {
    while (i < s.size() && (s[i] == ' ' || s[i] == ',')) i++;
    if (i >= s.size() || s[i] == ']') break;
    if (s[i] == '[') {
      size_t end = i + 1; int depth = 1;
      while (end < s.size() && depth > 0) {
        if (s[end] == '[') depth++;
        else if (s[end] == ']') depth--;
        end++;
      }
      v.push_back(parseVecInt(s.substr(i, end - i)));
      i = end;
    }
  }
  return v;
}

string toJsonVecInt(const vector<int>& vec) {
  ostringstream ss; ss << "[";
  for (size_t i = 0; i < vec.size(); i++) { if (i > 0) ss << ","; ss << vec[i]; }
  ss << "]"; return ss.str();
}

string toJsonVecStr(const vector<string>& vec) {
  ostringstream ss; ss << "[";
  for (size_t i = 0; i < vec.size(); i++) { if (i > 0) ss << ","; ss << "\\"" << escapeJson(vec[i]) << "\\""; }
  ss << "]"; return ss.str();
}

string toJsonVecVecInt(const vector<vector<int>>& vec) {
  ostringstream ss; ss << "[";
  for (size_t i = 0; i < vec.size(); i++) { if (i > 0) ss << ","; ss << toJsonVecInt(vec[i]); }
  ss << "]"; return ss.str();
}

string toJsonBool(bool b) { return b ? "true" : "false"; }

int main() {
  string content = readFile("${WORK_DIR}/testcases.json");
  ostringstream out;
  out << "{\\"results\\":[";
  size_t pos = 0;
  bool first = true;

  while (pos < content.size()) {
    while (pos < content.size() && content[pos] != '{') pos++;
    if (pos >= content.size()) break;
    size_t end = pos + 1; int depth = 1;
    while (end < content.size() && depth > 0) {
      if (content[end] == '{') depth++;
      else if (content[end] == '}') depth--;
      end++;
    }
    string tcStr = content.substr(pos, end - pos);
    pos = end;

    // Parse simple JSON object for this test case
    map<string, string> kv;
    size_t p = 0;
    while (p < tcStr.size()) {
      while (p < tcStr.size() && tcStr[p] != '"') p++;
      if (p >= tcStr.size()) break;
      p++; string key; while (p < tcStr.size() && tcStr[p] != '"') { if (tcStr[p] == '\\\\' && p + 1 < tcStr.size()) p++; key += tcStr[p]; p++; } p++;
      while (p < tcStr.size() && tcStr[p] != ':') p++; p++;
      while (p < tcStr.size() && tcStr[p] == ' ') p++;
      if (p >= tcStr.size()) break;
      if (tcStr[p] == '"') {
        p++; string val;
        while (p < tcStr.size()) {
          if (tcStr[p] == '\\\\' && p + 1 < tcStr.size()) { p++; if (tcStr[p] == '"') { val += '"'; p++; continue; } }
          if (tcStr[p] == '"') break;
          val += tcStr[p]; p++;
        } p++;
        kv[key] = val;
      } else {
        size_t sv = p;
        while (p < tcStr.size() && tcStr[p] != ',' && tcStr[p] != '}') p++;
        kv[key] = tcStr.substr(sv, p - sv);
      }
    }

    string inputRaw = kv["input"];
    string expected = kv["expectedOutput"];

    auto start = chrono::high_resolution_clock::now();
    string actual;
    string err;
    bool pass = false;
    double rt = 0;

    try {
      // Parse inputVal as a simple JSON object with string values
      map<string, string> inputVal;
      size_t ip = 0;
      while (ip < inputRaw.size()) {
        while (ip < inputRaw.size() && inputRaw[ip] != '"') ip++;
        if (ip >= inputRaw.size()) break;
        ip++; string k; while (ip < inputRaw.size() && inputRaw[ip] != '"') { if (inputRaw[ip] == '\\\\' && ip + 1 < inputRaw.size()) ip++; k += inputRaw[ip]; ip++; } ip++;
        while (ip < inputRaw.size() && inputRaw[ip] != ':') ip++; ip++;
        while (ip < inputRaw.size() && inputRaw[ip] == ' ') ip++;
        if (ip >= inputRaw.size()) break;
        if (inputRaw[ip] == '"') {
          ip++; string v;
          while (ip < inputRaw.size()) {
            if (inputRaw[ip] == '\\\\' && ip + 1 < inputRaw.size()) { ip++; if (inputRaw[ip] == '"') { v += '"'; ip++; continue; } }
            if (inputRaw[ip] == '"') break;
            v += inputRaw[ip]; ip++;
          } ip++;
          inputVal[k] = v;
        } else if (inputRaw[ip] == '[') {
          size_t sv = ip; int depth = 0;
          while (ip < inputRaw.size()) {
            if (inputRaw[ip] == '[') depth++;
            else if (inputRaw[ip] == ']') { depth--; if (depth == 0) { ip++; break; } }
            ip++;
          }
          inputVal[k] = inputRaw.substr(sv, ip - sv);
        } else {
          size_t sv = ip;
          while (ip < inputRaw.size() && inputRaw[ip] != ',' && inputRaw[ip] != '}') ip++;
          inputVal[k] = inputRaw.substr(sv, ip - sv);
        }
      }

      ${argExtract}
      ${className} sol;
      auto result = sol.${fn}(${argCall});
      actual = ${serCode};
      auto end = chrono::high_resolution_clock::now();
      rt = chrono::duration<double, milli>(end - start).count();
      pass = (actual == expected);
    } catch (const exception& e) {
      err = e.what();
    } catch (...) {
      err = "Unknown error";
    }

    if (!first) out << ","; first = false;
    out << "{";
    out << "\\"pass\\":" << (pass ? "true" : "false") << ",";
    out << "\\"runtime\\":" << rt << ",";
    out << "\\"memory\\":0,";
    out << "\\"error\\":" << (err.empty() ? "null" : "\\"" + escapeJson(err) + "\\"") << ",";
    out << "\\"expected\\":\\"" << escapeJson(expected) << "\\",";
    out << "\\"actual\\":" << (actual.empty() && err.empty() ? "null" : "\\"" + escapeJson(actual) + "\\"");
    out << "}";
  }

  out << "]}" << endl;
  cout << out.str();
  return 0;
}
`;
  return {
    files: { "runner.cpp": runner, "testcases.json": testCasesJson },
    command: `g++ -o ${WORK_DIR}/prog ${WORK_DIR}/runner.cpp -std=c++17 && ${WORK_DIR}/prog`,
  };
}

/* ---------- Go ---------- */
function generateGoRunner(
  code: string,
  fn: string,
  testCasesJson: string
): { files: Record<string, string>; command: string } {
  const runner = `
package main

import (
  "encoding/json"
  "fmt"
  "os"
  "reflect"
  "time"
)

type TestCase struct {
  Input          string \`json:"input"\`
  ExpectedOutput string \`json:"expectedOutput"\`
}

type TestResult struct {
  Pass     bool    \`json:"pass"\`
  Runtime  float64 \`json:"runtime"\`
  Memory   int     \`json:"memory"\`
  Error    *string \`json:"error"\`
  Expected string  \`json:"expected"\`
  Actual   *string \`json:"actual"\`
}

type Output struct {
  Results []TestResult \`json:"results"\`
}

func deepEqual(a, b interface{}) bool {
  if a == nil && b == nil { return true }
  if a == nil || b == nil { return false }
  va, vb := reflect.ValueOf(a), reflect.ValueOf(b)
  if va.Kind() != vb.Kind() { return false }
  switch va.Kind() {
  case reflect.Slice:
    if va.Len() != vb.Len() { return false }
    for i := 0; i < va.Len(); i++ {
      if !deepEqual(va.Index(i).Interface(), vb.Index(i).Interface()) { return false }
    }
    return true
  case reflect.Map:
    if va.Len() != vb.Len() { return false }
    for _, k := range va.MapKeys() {
      vaVal := va.MapIndex(k).Interface()
      vbVal := vb.MapIndex(k)
      if !vbVal.IsValid() || !deepEqual(vaVal, vbVal.Interface()) { return false }
    }
    return true
  }
  return reflect.DeepEqual(a, b)
}

func main() {
  data, err := os.ReadFile("${WORK_DIR}/testcases.json")
  if err != nil {
    fmt.Printf("{\\"results\\":[{\\"pass\\":false,\\"runtime\\":0,\\"memory\\":0,\\"error\\":\\"read error\\",\\"expected\\":\\"\\",\\"actual\\":null}]}")
    return
  }
  var testCases []TestCase
  if err := json.Unmarshal(data, &testCases); err != nil {
    fmt.Printf("{\\"results\\":[{\\"pass\\":false,\\"runtime\\":0,\\"memory\\":0,\\"error\\":\\"parse error\\",\\"expected\\":\\"\\",\\"actual\\":null}]}")
    return
  }

  output := Output{Results: make([]TestResult, 0)}
  for _, tc := range testCases {
    start := time.Now()
    var inputMap map[string]interface{}
    json.Unmarshal([]byte(tc.Input), &inputMap)

    var expectedVal interface{}
    json.Unmarshal([]byte(tc.ExpectedOutput), &expectedVal)
    expectedVal = convertGoValue(expectedVal)

    var actualVal interface{}
    errStr := ""
    func() {
      defer func() {
        if r := recover(); r != nil {
          errStr = fmt.Sprintf("%v", r)
        }
      }()
      actualVal = callFunction(inputMap)
    }()

    elapsed := float64(time.Since(start).Microseconds()) / 1000.0

    if errStr != "" {
      e := errStr
      output.Results = append(output.Results, TestResult{Pass: false, Runtime: elapsed, Memory: 0, Error: &e, Expected: tc.ExpectedOutput, Actual: nil})
    } else {
      actualJson, _ := json.Marshal(actualVal)
      actualStr := string(actualJson)
      pass := deepEqual(actualVal, expectedVal)
      output.Results = append(output.Results, TestResult{Pass: pass, Runtime: elapsed, Memory: 0, Error: nil, Expected: tc.ExpectedOutput, Actual: &actualStr})
    }
  }

  outJson, _ := json.Marshal(output)
  fmt.Println(string(outJson))
}

func callFunction(input map[string]interface{}) interface{} {
  // The generated code will be inserted here with the specific call
  // Since Go doesn't have reflection-based calling easily, we import the solution package
  // and call the function with specific argument types
  return callUserFunc(input)
}
`;
  const mainGo = `
package main

import (
  "reflect"
)

func callUserFunc(input map[string]interface{}) interface{} {
  args := make([]reflect.Value, 0)
  for _, v := range input {
    args = append(args, reflect.ValueOf(convertGoValue(v)))
  }
  fn := reflect.ValueOf(${fn})
  results := fn.Call(args)
  if len(results) > 0 {
    return results[0].Interface()
  }
  return nil
}

func convertGoValue(v interface{}) interface{} {
  switch val := v.(type) {
  case float64:
    if val == float64(int(val)) {
      return int(val)
    }
    return val
  case []interface{}:
    if len(val) == 0 { return val }
    switch val[0].(type) {
    case float64:
      arr := make([]int, len(val))
      for i, x := range val {
        arr[i] = int(x.(float64))
      }
      return arr
    case []interface{}:
      outer := make([][]int, len(val))
      for i, inner := range val {
        innerArr := inner.([]interface{})
        outer[i] = make([]int, len(innerArr))
        for j, x := range innerArr {
          outer[i][j] = int(x.(float64))
        }
      }
      return outer
    case string:
      arr := make([]string, len(val))
      for i, x := range val {
        arr[i] = x.(string)
      }
      return arr
    }
    return val
  case string:
    return val
  case bool:
    return val
  case nil:
    return nil
  }
  return v
}
`;
  return {
    files: {
      "solution.go": `package main

${code}`,
      "runner.go": runner,
      "main.go": mainGo,
      "testcases.json": testCasesJson,
    },
    command: `GOCACHE=${WORK_DIR}/gocache GOPATH=${WORK_DIR}/gopath go build -o ${WORK_DIR}/prog ${WORK_DIR}/main.go ${WORK_DIR}/runner.go ${WORK_DIR}/solution.go && ${WORK_DIR}/prog`,
  };
}

/* ---------- TypeScript ---------- */
function generateTsRunner(
  code: string,
  fn: string,
  testCasesJson: string
): { files: Record<string, string>; command: string } {
  // Strip TypeScript type annotations to produce valid JS.
  // Order matters: more specific patterns must come before generic ones.
  // CRITICAL: never use a bare /<[^>]+>/g — it breaks comparison operators like "i < n".
  const stripTypes = (ts: string): string =>
    ts
      .replace(/export\s+(default\s+)?class/g, 'class')
      .replace(/export\s+(default\s+)?function/g, 'function')
      .replace(/export\s+(default\s+)?const/g, 'const')
      .replace(/export\s+(default\s+)?let/g, 'let')
      .replace(/export\s+(default\s+)?var/g, 'var')
      .replace(/:\s*(?:ReadonlyArray|Array|Map|Set|Promise|Record|Partial|Required|Readonly|Pick|Omit)\s*<[^>]+>/gi, '')
      .replace(/:?\s*:\s*\w+\s*\[\s*\]/g, '')
      .replace(/:?\s*:\s*\w+/g, '')
      .replace(/^(\s*)public\s+/gm, '$1')
      .replace(/^(\s*)private\s+/gm, '$1')
      .replace(/^(\s*)protected\s+/gm, '$1')
      .replace(/^(\s*)readonly\s+/gm, '$1')
      .replace(/\s+as\s+\w+/g, '')
      .replace(/\s*\|\s*(?:null|undefined)\b/g, '')
      .replace(/<[A-Z]\w*(?:\s*,\s*[A-Z]\w*)*\s*>\s*\(/g, '(')
      .replace(/(\w+)\s*<\s*\w+\s*>\s*\(/g, '$1(');

  const cleaned = stripTypes(code);

  let isDesignProblem = false;
  let className = '';
  try {
    const tcs = JSON.parse(testCasesJson);
    if (tcs.length > 0) {
      const firstInput = JSON.parse(tcs[0].input);
      isDesignProblem = firstInput && typeof firstInput === 'object' && 'ops' in firstInput && 'args' in firstInput;
    }
    const classMatch = cleaned.match(/(?:class\s+(\w+))/);
    if (classMatch) className = classMatch[1];
  } catch {}

  if (isDesignProblem) {
    const runner = `
const fs = require('fs');
${cleaned}
const testCases = ${testCasesJson};
const deepEq = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEq(v, b[i]));
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every(k => deepEq(a[k], b[k]));
  }
  return false;
};
const results = [];
for (const tc of testCases) {
  const start = process.hrtime.bigint();
  try {
    const inp = JSON.parse(tc.input);
    const ops = inp.ops;
    const argsList = inp.args;
    let obj = null;
    const out = [];
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const arg = argsList[i];
      if (op === "${className}") {
        obj = new ${className}(...arg);
        out.push(null);
      } else {
        const val = obj[op](...arg);
        out.push(val !== undefined ? val : null);
      }
    }
    const end = process.hrtime.bigint();
    const rt = Number(end - start) / 1e6;
    const pass = deepEq(out, JSON.parse(tc.expectedOutput));
    results.push({ pass, runtime: Math.round(rt * 100) / 100, memory: 0, error: null, expected: tc.expectedOutput, actual: JSON.stringify(out) });
  } catch (e) {
    results.push({ pass: false, runtime: 0, memory: 0, error: e.message || String(e), expected: tc.expectedOutput, actual: null });
  }
}
process.stdout.write(JSON.stringify({ results }));
`;
    return { files: { "runner.js": runner }, command: `node ${WORK_DIR}/runner.js` };
  }

  if (className) {
    const runner = `
const fs = require('fs');
${cleaned}
const testCases = ${testCasesJson};
const deepEq = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEq(v, b[i]));
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every(k => deepEq(a[k], b[k]));
  }
  return false;
};
const results = [];
for (const tc of testCases) {
  const start = process.hrtime.bigint();
  try {
    const args = Object.values(JSON.parse(tc.input));
    const sol = new ${className}();
    const result = sol.${fn}(...args);
    const end = process.hrtime.bigint();
    const rt = Number(end - start) / 1e6;
    const pass = deepEq(result, JSON.parse(tc.expectedOutput));
    results.push({ pass, runtime: Math.round(rt * 100) / 100, memory: 0, error: null, expected: tc.expectedOutput, actual: JSON.stringify(result) });
  } catch (e) {
    results.push({ pass: false, runtime: 0, memory: 0, error: e.message || String(e), expected: tc.expectedOutput, actual: null });
  }
}
process.stdout.write(JSON.stringify({ results }));
`;
    return { files: { "runner.js": runner }, command: `node ${WORK_DIR}/runner.js` };
  }

  const runner = `
const fs = require('fs');
${cleaned}
const testCases = ${testCasesJson};
const deepEq = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEq(v, b[i]));
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every(k => deepEq(a[k], b[k]));
  }
  return false;
};
const results = [];
for (const tc of testCases) {
  const start = process.hrtime.bigint();
  try {
    const args = Object.values(JSON.parse(tc.input));
    const result = ${fn}(...args);
    const end = process.hrtime.bigint();
    const rt = Number(end - start) / 1e6;
    const pass = deepEq(result, JSON.parse(tc.expectedOutput));
    results.push({ pass, runtime: Math.round(rt * 100) / 100, memory: 0, error: null, expected: tc.expectedOutput, actual: JSON.stringify(result) });
  } catch (e) {
    results.push({ pass: false, runtime: 0, memory: 0, error: e.message || String(e), expected: tc.expectedOutput, actual: null });
  }
}
process.stdout.write(JSON.stringify({ results }));
`;
  return { files: { "runner.js": runner }, command: `node ${WORK_DIR}/runner.js` };
}

/* ---------- C ---------- */
function generateCRunner(
  code: string,
  fn: string,
  testCasesJson: string
): { files: Record<string, string>; command: string } {
  const testCases = JSON.parse(testCasesJson);
  const firstInput = testCases.length > 0 ? JSON.parse(testCases[0].input) : {};
  const argKeys = Object.keys(firstInput);
  const argVals = Object.values(firstInput);

  function extractC(name: string, val: unknown): string {
    if (Array.isArray(val)) {
      return `int* ${name} = inputVals_ints(inputVals, "${name}"); int ${name}Size = inputVals_len(inputVals, "${name}");`;
    }
    if (typeof val === "string") return `char* ${name} = inputVals_str(inputVals, "${name}");`;
    return `int ${name} = inputVals_int(inputVals, "${name}");`;
  }

  const argExtract = argKeys.map((k, i) => extractC(k, argVals[i])).join("\n    ");
  const argCall = argKeys.map((k, i) => Array.isArray(argVals[i]) ? `${k}, ${k}Size` : k).join(", ") + (argKeys.length > 0 ? ", &_returnSize" : "");
  const firstExpected = testCases.length > 0 ? testCases[0].expectedOutput.trim() : "";
  const isArrayReturn = firstExpected.startsWith('[');
  const isStringReturn = firstExpected.startsWith('"');
  const isBoolReturn = firstExpected === 'true' || firstExpected === 'false';

  const runner = `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>

${code}

#define MAX_JSON 65536
#define MAX_INPUT_STR 4096

typedef struct { char keys[16][64]; char strVals[16][4096]; int intVals[16][4096]; int valLens[16]; int isStr[16]; int count; } InputVals;

static int keyIndex(InputVals iv, const char* key) {
  for (int i = 0; i < iv.count; i++) if (strcmp(iv.keys[i], key) == 0) return i;
  return -1;
}
static int* inputVals_ints(InputVals iv, const char* key) { int i = keyIndex(iv, key); return i >= 0 ? iv.intVals[i] : NULL; }
static int inputVals_int(InputVals iv, const char* key) { int* p = inputVals_ints(iv, key); return p ? p[0] : 0; }
static int inputVals_len(InputVals iv, const char* key) { int i = keyIndex(iv, key); return i >= 0 ? iv.valLens[i] : 0; }
static char* inputVals_str(InputVals iv, const char* key) { int i = keyIndex(iv, key); return i >= 0 ? iv.strVals[i] : NULL; }

InputVals parseSimpleJson(const char* s) {
  InputVals iv = {0};
  int ki = 0;
  while (*s) {
    while (*s && *s != '"') s++;
    if (!*s) break; s++;
    int kp = 0; while (*s && *s != '"') { if (*s == '\\\\' && *(s+1)) s++; iv.keys[ki][kp++] = *s; s++; } iv.keys[ki][kp] = 0; s++;
    while (*s && *s != ':') s++; if (*s) s++;
    while (*s && *s == ' ') s++;
    if (*s == '"') {
      s++; int vp = 0;
      while (*s) { if (*s == '\\\\' && *(s+1)) { s++; if (*s == '"') { iv.strVals[ki][vp++] = '"'; s++; continue; } } if (*s == '"') break; iv.strVals[ki][vp++] = *s; s++; }
      iv.strVals[ki][vp] = 0; iv.isStr[ki] = 1; s++;
    } else if (*s == '[') {
      if (*(s+1) == '"') {
        // String array — stores first element (string array as input is uncommon in C)
        s++; iv.isStr[ki] = 1; iv.valLens[ki] = 0;
        while (*s && *s != ']') {
          while (*s && *s != '"') s++;
          if (*s == '"') {
            s++; int vp = 0;
            while (*s && *s != '"') { if (*s == '\\\\' && *(s+1)) s++; iv.strVals[ki][vp++] = *s; s++; }
            iv.strVals[ki][vp] = 0;
            if (*s == '"') s++;
            iv.valLens[ki]++;
            while (*s && (*s == ',' || *s == ' ')) s++;
          }
        }
      } else {
        // Integer array
        iv.isStr[ki] = 0; iv.valLens[ki] = 0; int* arr = iv.intVals[ki];
        while (*s && *s != ']') {
          while (*s && (*s == ' ' || *s == ',')) s++;
          if (*s == ']') break;
          if (*s == '-' || (*s >= '0' && *s <= '9')) {
            arr[iv.valLens[ki]++] = atoi(s);
            while (*s && *s != ',' && *s != ']') s++;
          } else {
            s++;
          }
        }
      }
    } else if (*s == '"') {
      s++; int vp = 0;
      while (*s && *s != '"') { if (*s == '\\\\' && *(s+1)) s++; iv.strVals[ki][vp++] = *s; s++; }
      iv.strVals[ki][vp] = 0; iv.isStr[ki] = 1;
      if (*s == '"') s++;
    } else if ((*s >= '0' && *s <= '9') || *s == '-') {
      iv.isStr[ki] = 0; iv.intVals[ki][0] = atoi(s); iv.valLens[ki] = 1;
      while (*s && *s != ',' && *s != '}' && *s != ']') s++;
    } else {
      // Skip unrecognized value (null, true, false, etc.)
      iv.isStr[ki] = 0; iv.intVals[ki][0] = 0; iv.valLens[ki] = 1;
      while (*s && *s != ',' && *s != '}' && *s != ']') s++;
    }
    ki++;
  }
  iv.count = ki;
  return iv;
}

int main() {
  FILE* f = fopen("${WORK_DIR}/testcases.json", "r");
  char* buf = malloc(MAX_JSON);
  size_t len = fread(buf, 1, MAX_JSON, f); buf[len] = 0;
  fclose(f);

  printf("{\\"results\\":[");
  char* p = buf;
  int first = 1;
  while (*p) {
    while (*p && *p != '{') p++;
    if (!*p) break;
    int depth = 1; char* objStart = p; p++;
    while (*p && depth > 0) { if (*p == '{') depth++; else if (*p == '}') depth--; p++; }
    char tcBuf[4096]; int tcl = (int)(p - objStart); if (tcl > 4095) tcl = 4095;
    strncpy(tcBuf, objStart, tcl); tcBuf[tcl] = 0;

    char inputRaw[2048] = {0}, expected[2048] = {0};
    char* tp = tcBuf;
    while (*tp) {
      while (*tp && *tp != '"') tp++;
      if (!*tp) break; tp++;
      char key[64]; int kpi = 0;
      while (*tp && *tp != '"') { if (*tp == '\\\\' && *(tp+1)) tp++; key[kpi++] = *tp; tp++; } key[kpi] = 0; tp++;
      while (*tp && *tp != ':') tp++; if (*tp) tp++;
      while (*tp && *tp == ' ') tp++;
      if (*tp == '"') {
        tp++; char val[2048]; int vpi = 0;
        while (*tp) {
          if (*tp == '\\\\' && *(tp+1)) { tp++; if (*tp == '"') { val[vpi++] = '"'; tp++; continue; } }
          if (*tp == '"') break;
          val[vpi++] = *tp; tp++;
        } val[vpi] = 0; tp++;
        if (strcmp(key, "input") == 0) strcpy(inputRaw, val);
        else if (strcmp(key, "expectedOutput") == 0) strcpy(expected, val);
      } else {
        char* es = tp; while (*tp && *tp != ',' && *tp != '}') tp++;
        char val[2048]; int vpi = 0; for (char* c = es; c < tp; c++) val[vpi++] = *c; val[vpi] = 0;
        if (strcmp(key, "input") == 0) strcpy(inputRaw, val);
        else if (strcmp(key, "expectedOutput") == 0) strcpy(expected, val);
      }
    }

    clock_t start = clock();
    char actual[2048] = {0};
    char err[512] = {0};
    int pass = 0;

    InputVals inputVals = parseSimpleJson(inputRaw);

    ${argExtract}
    int _returnSize;
    ${isStringReturn
      ? `char* result = ${fn}(${argCall}); sprintf(actual, "\\"%s\\"", result);`
      : isBoolReturn
        ? `bool result = ${fn}(${argCall}); sprintf(actual, "%s", result ? "true" : "false");`
        : isArrayReturn
          ? `int* result = ${fn}(${argCall});`
          : `int result = ${fn}(${argCall}); sprintf(actual, "%d", result);`}
    ${isStringReturn || isBoolReturn ? `` : isArrayReturn
      ? `sprintf(actual, "["); for (int _i = 0; _i < _returnSize; _i++) { if (_i > 0) strcat(actual, ","); char _b[16]; sprintf(_b, "%d", result[_i]); strcat(actual, _b); } strcat(actual, "]");`
      : ``}

    clock_t end = clock();
    double rt = ((double)(end - start)) / CLOCKS_PER_SEC * 1000.0;
    pass = (strcmp(actual, expected) == 0);

    if (!first) printf(","); first = 0;
    printf("{\\"pass\\":%s,\\"runtime\\":%.2f,\\"memory\\":0,\\"error\\":null,\\"expected\\":\\"%s\\",\\"actual\\":\\"%s\\"}", pass ? "true" : "false", rt, expected, actual);
  }
  printf("]}\\n");
  free(buf);
  return 0;
}
`;
  return { files: { "runner.c": runner, "testcases.json": testCasesJson }, command: `gcc -o ${WORK_DIR}/prog ${WORK_DIR}/runner.c -lm && ${WORK_DIR}/prog` };
}

/* ---------- Rust ---------- */
function generateRustRunner(
  code: string,
  fn: string,
  testCasesJson: string
): { files: Record<string, string>; command: string } {
  const testCases = JSON.parse(testCasesJson);
  const firstInput = testCases.length > 0 ? JSON.parse(testCases[0].input) : {};
  const argKeys = Object.keys(firstInput);
  const argVals = Object.values(firstInput);

  function rustType(val: unknown): string {
    if (Array.isArray(val)) {
      if (val.length > 0 && Array.isArray(val[0])) return "Vec<Vec<i32>>";
      return "Vec<i32>";
    }
    if (typeof val === "string") return "String";
    return "i32";
  }

  function extractRust(name: string, val: unknown): string {
    if (Array.isArray(val)) {
      if ((val as any[]).length > 0 && Array.isArray((val as any[])[0])) {
        return `let ${name}: Vec<Vec<i32>> = parse_json_vecvec(&input_map["${name}"]);`;
      }
      return `let ${name}: Vec<i32> = parse_json_vec(&input_map["${name}"]);`;
    }
    if (typeof val === "string") return `let ${name}: String = input_map["${name}"].clone();`;
    return `let ${name}: i32 = input_map["${name}"].parse().unwrap_or(0);`;
  }

  const argExtract = argKeys.map((k, i) => "    " + extractRust(k, argVals[i])).join("\n");
  const argCall = argKeys.join(", ");

  const runner = `
use std::collections::HashMap;
use std::fs;
use std::time::Instant;

${code.replace(/pub\s+fn/g, 'fn')}

fn trim(s: &str) -> &str { s.trim_start_matches(' ').trim_end_matches(' ') }

fn parse_str(s: &str, i: &mut usize) -> String {
    let mut res = String::new();
    *i += 1;
    let bytes = s.as_bytes();
    while *i < s.len() {
        if bytes[*i] == b'\\\\' && *i + 1 < s.len() && bytes[*i + 1] == b'"' {
            res.push('"'); *i += 2; continue;
        }
        if bytes[*i] == b'"' { break; }
        res.push(bytes[*i] as char);
        *i += 1;
    }
    *i += 1;
    res
}

fn parse_num(s: &str, i: &mut usize) -> String {
    let start = *i;
    while *i < s.len() && (s.as_bytes()[*i].is_ascii_digit() || s.as_bytes()[*i] == b'-' || s.as_bytes()[*i] == b'.') {
        *i += 1;
    }
    s[start..*i].to_string()
}

fn skip_ws(s: &str, i: &mut usize) { while *i < s.len() && s.as_bytes()[*i] == b' ' { *i += 1; } }

fn parse_value(s: &str, i: &mut usize, depth: usize) -> String {
    skip_ws(s, i);
    if *i >= s.len() { return "null".to_string(); }
    let c = s.as_bytes()[*i];
    if c == b'"' { return parse_str(s, i); }
    if c == b'n' { *i += 4; return "null".to_string(); }
    if c == b't' { *i += 4; return "true".to_string(); }
    if c == b'f' { *i += 5; return "false".to_string(); }
    if c == b'[' {
        let start = *i;
        let mut in_str = false;
        *i += 1;
        let mut br = 1;
        while *i < s.len() && br > 0 {
            if s.as_bytes()[*i] == b'"' && (*i == 0 || s.as_bytes()[*i-1] != b'\\\\') { in_str = !in_str; }
            if !in_str {
                if s.as_bytes()[*i] == b'[' { br += 1; }
                else if s.as_bytes()[*i] == b']' { br -= 1; }
            }
            *i += 1;
        }
        return s[start..*i].to_string();
    }
    if c == b'{' {
        let start = *i;
        let mut in_str = false;
        *i += 1;
        let mut br = 1;
        while *i < s.len() && br > 0 {
            if s.as_bytes()[*i] == b'"' && (*i == 0 || s.as_bytes()[*i-1] != b'\\\\') { in_str = !in_str; }
            if !in_str {
                if s.as_bytes()[*i] == b'{' { br += 1; }
                else if s.as_bytes()[*i] == b'}' { br -= 1; }
            }
            *i += 1;
        }
        return s[start..*i].to_string();
    }
    parse_num(s, i)
}

fn parse_obj(s: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    let s = s.trim();
    if !s.starts_with('{') { return map; }
    let inner = &s[1..s.len()-1];
    let mut i = 0;
    while i < inner.len() {
        skip_ws(inner, &mut i);
        if i >= inner.len() || inner.as_bytes()[i] != b'"' { break; }
        let key = parse_str(inner, &mut i);
        while i < inner.len() && inner.as_bytes()[i] != b':' { i += 1; }
        i += 1;
        let val = parse_value(inner, &mut i, 0);
        map.insert(key, val);
        while i < inner.len() && (inner.as_bytes()[i] == b',' || inner.as_bytes()[i] == b' ') { i += 1; }
    }
    map
}

fn parse_tests(s: &str) -> Vec<HashMap<String, String>> {
    let mut result = Vec::new();
    let s = s.trim();
    if !s.starts_with('[') { return result; }
    let mut i = 0;
    let mut depth = 0;
    let start = 1;
    let mut obj_start: Option<usize> = None;
    let mut in_str = false;
    let bytes = s.as_bytes();
    for pos in 1..s.len() {
        if bytes[pos] == b'"' && bytes[pos-1] != b'\\\\' { in_str = !in_str; }
        if in_str { continue; }
        if bytes[pos] == b'{' { if depth == 0 { obj_start = Some(pos); } depth += 1; }
        else if bytes[pos] == b'}' { depth -= 1; if depth == 0 { if let Some(os) = obj_start { result.push(parse_obj(&s[os..=pos])); } } }
    }
    result
}

fn parse_json_vec(s: &str) -> Vec<i32> {
    let s = s.trim();
    if !s.starts_with('[') { return vec![]; }
    if s.len() < 2 { return vec![]; }
    let inner = s[1..s.len()-1].trim();
    if inner.is_empty() { return vec![]; }
    inner.split(',').map(|x| x.trim().parse().unwrap_or(0)).collect()
}

fn parse_json_vecvec(s: &str) -> Vec<Vec<i32>> {
    let s = s.trim();
    if !s.starts_with('[') { return vec![]; }
    if s.len() < 2 { return vec![]; }
    let inner = s[1..s.len()-1].trim();
    if inner.is_empty() { return vec![]; }
    let mut result = vec![];
    let mut depth = 0;
    let mut start = 0;
    for (i, c) in inner.char_indices() {
        if c == '[' { depth += 1; }
        else if c == ']' { depth -= 1; }
        else if c == ',' && depth == 0 {
            result.push(parse_json_vec(&inner[start..i]));
            start = i + 1;
        }
    }
    if start < inner.len() { result.push(parse_json_vec(&inner[start..])); }
    result
}

fn main() {
    let content = fs::read_to_string("${WORK_DIR}/testcases.json").unwrap_or_default();
    let test_cases = parse_tests(&content);

    print!("{{\\"results\\":[");
    let mut first = true;

    for tc in &test_cases {
        let input_raw = tc.get("input").cloned().unwrap_or_default();
        let expected = tc.get("expectedOutput").cloned().unwrap_or_default();
        let input_map = parse_obj(&input_raw);

        let start = Instant::now();
        let result = std::panic::catch_unwind(|| {
            ${argExtract}
            ${fn}(${argCall})
        });
        let duration = start.elapsed().as_micros() as f64 / 1000.0;

        let (pass, actual) = match result {
            Ok(val) => {
                let actual_str = format!("{:?}", val);
                let normalized = actual_str.replace(" ", "");
                (normalized == expected, actual_str)
            }
            Err(_) => (false, String::new()),
        };

        if !first { print!(","); } first = false;
        print!("{{\\"pass\\":{},\\"runtime\\":{:.2},\\"memory\\":0,\\"error\\":null,\\"expected\\":\\"{}\\",\\"actual\\":\\"{}\\"}}",
            if pass { "true" } else { "false" }, duration, expected, actual);
    }
    println!("]}}");
}
`;
  return { files: { "runner.rs": runner, "testcases.json": testCasesJson }, command: `rustc -o ${WORK_DIR}/prog ${WORK_DIR}/runner.rs && ${WORK_DIR}/prog` };
}
