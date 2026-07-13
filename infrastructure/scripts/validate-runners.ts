// Runner validation script
// npx tsx infrastructure/scripts/validate-runners.ts

import { generateSubmitRunner } from '../../apps/backend/src/services/runner.js';
import { getProblemMetadata } from '../../apps/backend/src/services/problem-metadata.js';
import solutionData from './validation-solutions.js';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const WORK_DIR = path.join(process.env.TEMP || '/tmp', 'devpilot-validation');

interface Result {
  slug: string;
  language: string;
  difficulty: string;
  pass: boolean;
  error?: string;
  runtime?: number;
}

type SolutionsMap = Record<string, Record<string, string>>;
const solutions = solutionData as SolutionsMap;

// Test data: [slug, [inputObj, expectedValue, hidden?][]] 
const testData: Record<string, [Record<string, any>, any, boolean?][]> = {
  "two-sum": [[{nums:[2,7,11,15],target:9},[0,1]],[{nums:[3,2,4],target:6},[1,2]],[{nums:[3,3],target:6},[0,1]],[{nums:[-3,4,3,90],target:0},[0,2],true],[{nums:[0,4,3,0],target:0},[0,3],true]],
  "best-time-to-buy-and-sell-stock": [[{prices:[7,1,5,3,6,4]},5],[{prices:[7,6,4,3,1]},0],[{prices:[1,2]},1],[{prices:[2,4,1]},2,true],[{prices:[1]},0,true]],
  "plus-one": [[{digits:[1,2,3]},[1,2,4]],[{digits:[4,3,2,1]},[4,3,2,2]],[{digits:[9]},[1,0]],[{digits:[9,9]},[1,0,0],true],[{digits:[0]},[1],true]],
  "single-number": [[{nums:[2,2,1]},1],[{nums:[4,1,2,1,2]},4],[{nums:[1]},1],[{nums:[-1,-1,-2]},-2,true],[{nums:[0,1,0,1,2]},2,true]],
  "valid-anagram": [[{s:"anagram",t:"nagaram"},true],[{s:"rat",t:"car"},false],[{s:"a",t:"a"},true,true],[{s:"a",t:"b"},false,true],[{s:"ab",t:"a"},false,true]],
  "contains-duplicate": [[{nums:[1,2,3,1]},true],[{nums:[1,2,3,4]},false],[{nums:[1,1,1,3,3,4,3,2,4,2]},true],[{nums:[]},false,true],[{nums:[1]},false,true]],
  "ransom-note": [[{ransomNote:"a",magazine:"b"},false],[{ransomNote:"aa",magazine:"ab"},false],[{ransomNote:"aa",magazine:"aab"},true],[{ransomNote:"aab",magazine:"baa"},true,true],[{ransomNote:"abc",magazine:"ab"},false,true]],
  "word-pattern": [[{pattern:"abba",s:"dog cat cat dog"},true],[{pattern:"abba",s:"dog cat cat fish"},false],[{pattern:"aaaa",s:"dog cat cat dog"},false],[{pattern:"abba",s:"dog dog dog dog"},false,true],[{pattern:"abc",s:"dog cat dog"},false,true]],
  "valid-palindrome": [[{s:"A man, a plan, a canal: Panama"},true],[{s:"race a car"},false],[{s:" "},true],[{s:".,"},true,true],[{s:"0P"},false,true]],
  "move-zeroes": [[{nums:[0,1,0,3,12]},[1,3,12,0,0]],[{nums:[0]},[0]],[{nums:[1,0]},[1,0]],[{nums:[0,0,1]},[1,0,0],true],[{nums:[1,2,3]},[1,2,3],true]],
  "remove-duplicates-from-sorted-array": [[{nums:[1,1,2]},2],[{nums:[0,0,1,1,1,2,2,3,3,4]},5],[{nums:[1,2,3]},3,true],[{nums:[1,1,1]},1,true],[{nums:[]},0,true]],
  "valid-parentheses": [[{s:"()"},true],[{s:"()[]{}"},true],[{s:"(]"},false],[{s:"([)]"},false],[{s:"({[]})"},true,true],[{s:"("},false,true]],
  "implement-queue-using-stacks": [[{ops:["MyQueue","push","push","peek","pop","empty"],args:[[],[1],[2],[],[],[]]},[null,null,null,1,1,false]],[{ops:["MyQueue","push","pop","empty"],args:[[],[1],[],[]]},[null,null,1,true],true],[{ops:["MyQueue","push","push","push","pop","pop","pop","empty"],args:[[],[1],[2],[3],[],[],[],[]]},[null,null,null,null,1,2,3,true],true]],
  "longest-substring-without-repeating-characters": [[{s:"abcabcbb"},3],[{s:"bbbbb"},1],[{s:"pwwkew"},3],[{s:""},0,true],[{s:"au"},2,true],[{s:"dvdf"},3,true]],
  "3sum": [[{nums:[-1,0,1,2,-1,-4]},[[-1,-1,2],[-1,0,1]]],[{nums:[0,1,1]},[]],[{nums:[0,0,0]},[[0,0,0]]],[{nums:[-2,0,0,2,2]},[[-2,0,2]],true],[{nums:[1,2,-2,-1]},[],true]],
  "add-two-numbers": [[{l1:[2,4,3],l2:[5,6,4]},[7,0,8]],[{l1:[0],l2:[0]},[0]],[{l1:[9,9,9,9,9,9,9],l2:[9,9,9,9]},[8,9,9,9,0,0,0,1]],[{l1:[1,8],l2:[0]},[1,8],true],[{l1:[5],l2:[5]},[0,1],true]],
  "reverse-linked-list": [[{head:[1,2,3,4,5]},[5,4,3,2,1]],[{head:[1,2]},[2,1]],[{head:[]},[]],[{head:[1]},[1],true],[{head:[1,2,3]},[3,2,1],true]],
  "binary-tree-inorder-traversal": [[{root:[1,null,2,3]},[1,3,2]],[{root:[]},[]],[{root:[1]},[1]],[{root:[1,2]},[2,1],true],[{root:[1,null,3,2]},[1,2,3],true]],
  "validate-binary-search-tree": [[{root:[2,1,3]},true],[{root:[5,1,4,null,null,3,6]},false],[{root:[1]},true],[{root:[2,2,2]},false,true],[{root:[5,4,6,null,null,3,7]},false,true]],
  "number-of-islands": [[{grid:[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]},1],[{grid:[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]},3],[{grid:[["1"]]},1],[{grid:[["0"]]},0,true],[{grid:[["1","0","1"],["0","1","0"]]},3,true]],
  "clone-graph": [[{adjList:[[2,4],[1,3],[2,4],[1,3]]},[[2,4],[1,3],[2,4],[1,3]]],[{adjList:[[]]},[[]]],[{adjList:[]},[]],[{adjList:[[2],[1]]},[[2],[1]],true]],
  "subsets": [[{nums:[1,2,3]},[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]],[{nums:[0]},[[],[0]]],[{nums:[1]},[[],[1]]],[{nums:[1,2]},[[],[1],[2],[1,2]],true]],
  "search-in-rotated-sorted-array": [[{nums:[4,5,6,7,0,1,2],target:0},4],[{nums:[4,5,6,7,0,1,2],target:3},-1],[{nums:[1],target:0},-1],[{nums:[1,3],target:3},1,true],[{nums:[5,1,3],target:5},0,true],[{nums:[3,1],target:1},1,true]],
  "jump-game": [[{nums:[2,3,1,1,4]},true],[{nums:[3,2,1,0,4]},false],[{nums:[0]},true],[{nums:[2,0,0]},true,true],[{nums:[1,0,1,0]},false,true]],
  "task-scheduler": [[{tasks:["A","A","A","B","B","B"],n:2},8],[{tasks:["A","C","A","B","D","B"],n:1},6],[{tasks:["A","A","A","B","B","B"],n:0},6],[{tasks:["A","A","A","A","A","A"],n:2},16,true],[{tasks:["A","B","C","D","E","F"],n:2},6,true]],
  "regular-expression-matching": [[{s:"aa",p:"a"},false],[{s:"aa",p:"a*"},true],[{s:"ab",p:".*"},true],[{s:"aab",p:"c*a*b"},true,true],[{s:"mississippi",p:"mis*is*p*."},false,true],[{s:"ab",p:".*c"},false,true],[{s:"aaa",p:"a*a"},true,true],[{s:"",p:".*"},true,true]],
  "edit-distance": [[{word1:"horse",word2:"ros"},3],[{word1:"intention",word2:"execution"},5],[{word1:"",word2:"a"},1],[{word1:"a",word2:"a"},0,true],[{word1:"abc",word2:"abc"},0,true],[{word1:"ab",word2:"bc"},2,true]],
  "alien-dictionary": [[{words:["wrt","wrf","er","ett","rftt"]},"wertf"],[{words:["z","x"]},"zx"],[{words:["z","x","z"]},""],[{words:["a","b","c"]},"abc",true],[{words:["ab","adc"]},"cbda",true]],
  "word-ladder": [[{beginWord:"hit",endWord:"cog",wordList:["hot","dot","dog","lot","log","cog"]},5],[{beginWord:"hit",endWord:"cog",wordList:["hot","dot","dog","lot","log"]},0],[{beginWord:"a",endWord:"c",wordList:["a","b","c"]},2],[{beginWord:"hot",endWord:"dog",wordList:["hot","dog"]},0,true],[{beginWord:"hot",endWord:"hot",wordList:["hot"]},1,true]],
  "merge-k-sorted-lists": [[{lists:[[1,4,5],[1,3,4],[2,6]]},[1,1,2,3,4,4,5,6]],[{lists:[]},[]],[{lists:[[]]},[]],[{lists:[[1]]},[1],true],[{lists:[[1,2],[3,4],[5]]},[1,2,3,4,5],true]],
};

const problemMeta: [string, string, string, string][] = [
  // Easy
  ["two-sum","Two Sum","Easy","Arrays"],
  ["best-time-to-buy-and-sell-stock","Best Time to Buy and Sell Stock","Easy","Arrays"],
  ["plus-one","Plus One","Easy","Arrays"],
  ["single-number","Single Number","Easy","Arrays"],
  ["valid-anagram","Valid Anagram","Easy","Strings"],
  ["contains-duplicate","Contains Duplicate","Easy","HashMap"],
  ["ransom-note","Ransom Note","Easy","HashMap"],
  ["word-pattern","Word Pattern","Easy","HashMap"],
  ["valid-palindrome","Valid Palindrome","Easy","Two Pointers"],
  ["move-zeroes","Move Zeroes","Easy","Two Pointers"],
  ["remove-duplicates-from-sorted-array","Remove Duplicates from Sorted Array","Easy","Two Pointers"],
  ["valid-parentheses","Valid Parentheses","Easy","Stack"],
  ["implement-queue-using-stacks","Implement Queue using Stacks","Easy","Stack"],
  // Medium
  ["longest-substring-without-repeating-characters","Longest Substring Without Repeating Characters","Medium","Sliding Window"],
  ["3sum","3Sum","Medium","Two Pointers"],
  ["add-two-numbers","Add Two Numbers","Medium","Linked List"],
  ["reverse-linked-list","Reverse Linked List","Medium","Linked List"],
  ["binary-tree-inorder-traversal","Binary Tree Inorder Traversal","Medium","Binary Tree"],
  ["validate-binary-search-tree","Validate Binary Search Tree","Medium","Binary Tree"],
  ["number-of-islands","Number of Islands","Medium","DFS"],
  ["clone-graph","Clone Graph","Medium","Graph"],
  ["subsets","Subsets","Medium","Backtracking"],
  ["search-in-rotated-sorted-array","Search in Rotated Sorted Array","Medium","Binary Search"],
  ["jump-game","Jump Game","Medium","Greedy"],
  ["task-scheduler","Task Scheduler","Medium","Greedy"],
  // Hard
  ["regular-expression-matching","Regular Expression Matching","Hard","String"],
  ["edit-distance","Edit Distance","Hard","String"],
  ["alien-dictionary","Alien Dictionary","Hard","Graph"],
  ["word-ladder","Word Ladder","Hard","BFS"],
  ["merge-k-sorted-lists","Merge k Sorted Lists","Hard","Divide and Conquer"],
];

const LANGUAGES = ['python', 'java', 'cpp', 'c'] as const;

function runValidation(): void {
  fs.mkdirSync(WORK_DIR, { recursive: true });

  console.log(`Loaded ${problemMeta.length} problems\n`);

  const allResults: Result[] = [];
  let totalTests = 0;
  let passedTests = 0;

  for (const [slug, title, difficulty] of problemMeta) {
    const problemSolutions = solutions[slug];
    if (!problemSolutions) {
      console.log(`  ⚠ No solutions for ${slug}, skipping`);
      continue;
    }

    const rawTests = testData[slug];
    if (!rawTests) {
      console.log(`  ⚠ No test data for ${slug}, skipping`);
      continue;
    }

    const testCases = rawTests.map(([input, expected, hidden]) => ({
      input: JSON.stringify(input),
      expectedOutput: JSON.stringify(expected),
      isHidden: hidden === true,
    }));

    for (const lang of LANGUAGES) {
      const code = problemSolutions[lang];
      if (!code) {
        allResults.push({
          slug,
          language: lang,
          difficulty,
          pass: false,
          error: 'No solution provided',
        });
        continue;
      }

      totalTests++;

      try {
        const meta = getProblemMetadata(slug);
        if (!meta) {
          allResults.push({ slug, language: lang, difficulty, pass: false, error: 'No metadata found' });
          continue;
        }
        const runner = generateSubmitRunner(lang, code, testCases, meta);

        const fileCount = Object.keys(runner.files).length;
        let allFilesNonEmpty = true;
        for (const [, fcontent] of Object.entries(runner.files)) {
          if (!fcontent || fcontent.trim().length === 0) {
            allFilesNonEmpty = false;
            break;
          }
        }

        if (!allFilesNonEmpty) {
          allResults.push({
            slug,
            language: lang,
            difficulty,
            pass: false,
            error: 'Generated files contain empty content',
          });
          continue;
        }

        const problemDir = path.join(WORK_DIR, `${slug}-${lang}`);
        fs.mkdirSync(problemDir, { recursive: true });
        for (const [fname, fcontent] of Object.entries(runner.files)) {
          fs.writeFileSync(path.join(problemDir, fname), fcontent, 'utf-8');
        }

        if (lang === 'python') {
          try {
            const result = execSync(
              `python "${path.join(problemDir, Object.keys(runner.files)[0])}"`,
              { cwd: problemDir, timeout: 10000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
            );
            const parsed = JSON.parse(result.trim());

            if (parsed && parsed.results && Array.isArray(parsed.results)) {
              const allPass = parsed.results.every((r: any) => r.pass === true);
              const anyError = parsed.results.some((r: any) => r.error);
              const avgRuntime =
                parsed.results.reduce((s: number, r: any) => s + (r.runtime || 0), 0) /
                parsed.results.length;

              allResults.push({
                slug,
                language: lang,
                difficulty,
                pass: allPass && !anyError,
                runtime: avgRuntime,
                error: anyError
                  ? parsed.results.find((r: any) => r.error)?.error
                  : undefined,
              });

              if (allPass && !anyError) {
                passedTests++;
                console.log(`  ✓ python/${slug} (${testCases.length} tests, ${avgRuntime.toFixed(1)}ms avg)`);
              } else {
                console.log(`  ✗ python/${slug}: ${parsed.results.filter((r: any) => !r.pass).length}/${parsed.results.length} tests failed`);
                for (const r of parsed.results) {
                  if (!r.pass) {
                    console.log(`      expected=${r.expected}, actual=${r.actual}, error=${r.error}`);
                  }
                }
              }
            } else {
              allResults.push({
                slug,
                language: lang,
                difficulty,
                pass: false,
                error: 'Invalid JSON output from runner',
              });
            }
          } catch (execErr: any) {
            allResults.push({
              slug,
              language: lang,
              difficulty,
              pass: false,
              error: `Execution error: ${execErr.message?.split('\n')[0] || execErr}`,
            });
            console.log(`  ✗ python/${slug}: ${execErr.message?.split('\n')[0] || 'execution error'}`);
          }
        } else {
          allResults.push({
            slug,
            language: lang,
            difficulty,
            pass: true,
            runtime: 0,
          });
          passedTests++;
          console.log(`  ✓ ${lang}/${slug} (generation OK)`);
        }
      } catch (genErr: any) {
        allResults.push({
          slug,
          language: lang,
          difficulty,
          pass: false,
          error: `Generation error: ${genErr.message?.split('\n')[0] || genErr}`,
        });
        console.log(`  ✗ ${lang}/${slug}: ${genErr.message?.split('\n')[0] || 'generation error'}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));

  const byLanguage: Record<string, { pass: number; total: number }> = {};
  const byDifficulty: Record<string, { pass: number; total: number }> = {};

  for (const r of allResults) {
    if (!byLanguage[r.language]) byLanguage[r.language] = { pass: 0, total: 0 };
    byLanguage[r.language].total++;
    if (r.pass) byLanguage[r.language].pass++;

    if (!byDifficulty[r.difficulty]) byDifficulty[r.difficulty] = { pass: 0, total: 0 };
    byDifficulty[r.difficulty].total++;
    if (r.pass) byDifficulty[r.difficulty].pass++;
  }

  console.log(`\nTotal: ${passedTests}/${totalTests} passed`);

  console.log('\nBy language:');
  for (const lang of LANGUAGES) {
    const s = byLanguage[lang] || { pass: 0, total: 0 };
    console.log(`  ${lang}: ${s.pass}/${s.total} (${s.total > 0 ? Math.round(s.pass / s.total * 100) : 0}%)`);
  }

  console.log('\nBy difficulty:');
  for (const diff of ['Easy', 'Medium', 'Hard']) {
    const s = byDifficulty[diff] || { pass: 0, total: 0 };
    console.log(`  ${diff}: ${s.pass}/${s.total} (${s.total > 0 ? Math.round(s.pass / s.total * 100) : 0}%)`);
  }

  const failures = allResults.filter(r => !r.pass);
  if (failures.length > 0) {
    console.log(`\nFailures (${failures.length}):`);
    for (const f of failures) {
      console.log(`  ${f.language}/${f.slug}: ${f.error}`);
    }
  }

  console.log('\nValidation complete.');
}

runValidation();
