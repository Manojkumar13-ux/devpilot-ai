import type { TestResult } from "@devpilot/shared";
import type { ProblemMetadata } from "./problem-metadata.js";

interface TestCaseData {
  input: string;
  expectedOutput: string;
}

const WORK_DIR = '/tmp';

function extractFunctionName(code: string, language: string): string | null {
  switch (language) {
    case "python": {
      const topLevel = [...code.matchAll(/^def\s+(\w+)/gm)].filter(m => !m[1].startsWith('_'));
      if (topLevel.length > 0) return topLevel[topLevel.length - 1][1];
      const classMethods = [...code.matchAll(/^ {4}def\s+(\w+)/gm)].filter(m => !m[1].startsWith('_'));
      return classMethods.length > 0 ? classMethods[classMethods.length - 1][1] : null;
    }
    case "java": {
      const methods = [...code.matchAll(/public\s+\S+\s+(\w+)\s*\([^)]*\)\s*(?:\{|throws)/g)];
      const skip = new Set(['main', 'toString', 'hashCode', 'equals', 'Solution', 'ListNode', 'TreeNode', 'Node']);
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
    default:
      return null;
  }
}

export function generateSubmitRunner(
  language: string,
  userCode: string,
  testCases: TestCaseData[],
  meta?: ProblemMetadata
): { files: Record<string, string>; command: string } {
  // Python uses snake_case from user code; Java/C++/C use metadata camelCase
  const fnName = (meta && language !== 'python')
    ? meta.methodName
    : (extractFunctionName(userCode, language) ?? "solution");
  const testCasesJson = JSON.stringify(testCases);

  switch (language) {
    case "python":
      return generatePyRunner(userCode, fnName, testCasesJson, meta);
    case "java":
      return generateJavaRunner(userCode, fnName, testCasesJson, meta);
    case "cpp":
      return generateCppRunner(userCode, fnName, testCasesJson, meta);
    case "c":
      return generateCRunner(userCode, fnName, testCasesJson, meta);
    default:
      return generatePyRunner(userCode, fnName, testCasesJson, meta);
  }
}



/* ---------- Python ---------- */
function generatePyRunner(
  code: string,
  fn: string,
  testCasesJson: string,
  meta?: ProblemMetadata
): { files: Record<string, string>; command: string } {
  // Metadata-driven: className from metadata only if code defines it or design problem
  const className = meta
    ? (code.includes(`class ${meta.className}`) || meta.isDesign ? meta.className : '')
    : (code.match(/^class\s+(?!(?:ListNode|TreeNode|Node)\b)(\w+)/m)?.[1] ?? '');
  const isDesignProblem = meta ? meta.isDesign : (() => {
    try {
      const tcs = JSON.parse(testCasesJson);
      if (tcs.length > 0) {
        const fi = JSON.parse(tcs[0].input);
        return fi && typeof fi === 'object' && 'ops' in fi && 'args' in fi;
      }
    } catch {}
    return false;
  })();
  const hasListNode = meta ? meta.helperClasses.includes('ListNode') : code.includes('class ListNode');
  const hasTreeNode = meta ? meta.helperClasses.includes('TreeNode') : code.includes('class TreeNode');
  if (isDesignProblem) {
    const runner = `
import json, time, sys
${code}
test_cases = json.loads(r"""${testCasesJson}""")
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

  const listHelper = hasListNode ? `
def _arr_to_list(arr, cls):
    if not arr: return None
    head = cls(arr[0]); cur = head
    for v in arr[1:]: cur.next = cls(v); cur = cur.next
    return head
` : '';
  const treeHelper = hasTreeNode ? `
def _arr_to_tree(arr, cls):
    if not arr or arr[0] is None: return None
    root = cls(arr[0]); q = [root]; i = 1
    while q and i < len(arr):
        node = q.pop(0)
        if i < len(arr) and arr[i] is not None: node.left = cls(arr[i]); q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None: node.right = cls(arr[i]); q.append(node.right)
        i += 1
    return root
` : '';
  const convertHelper = hasListNode || hasTreeNode ? `
import inspect
def _convert(inp, func):
    try:
        sig = inspect.signature(func)
        for name, param in sig.parameters.items():
            if name not in inp or not isinstance(inp[name], list): continue
            hint = param.annotation
            if hint is inspect.Parameter.empty: continue
            h = str(hint)
            ${hasListNode ? `if 'ListNode' in h:
                inp[name] = _arr_to_list(inp[name], ListNode)` : ''}
            ${hasTreeNode ? `if 'TreeNode' in h:
                inp[name] = _arr_to_tree(inp[name], TreeNode)` : ''}
    except: pass
    return inp
` : '';

  const sharedPyLib = listHelper + treeHelper + convertHelper;

  // Class-based function problem (e.g., class Solution: def twoSum)
  if (className) {
    const runner = `
import json, time, sys
${code}
${sharedPyLib}
test_cases = json.loads(r"""${testCasesJson}""")
results = []
for tc in test_cases:
    start = time.time()
    try:
        inp = json.loads(tc["input"])
        sol = ${className}()
        _method = getattr(sol, "${fn}", None)
        if _method is None:
            _method = next((getattr(sol, m) for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))), None)
        ${hasListNode || hasTreeNode ? `inp = _convert(inp, _method)` : ''}
        result = _method(**inp)
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
${sharedPyLib}
test_cases = json.loads(r"""${testCasesJson}""")
results = []
for tc in test_cases:
    start = time.time()
    try:
        inp = json.loads(tc["input"])
        ${hasListNode || hasTreeNode ? `inp = _convert(inp, ${fn})` : ''}
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
  testCasesJson: string,
  meta?: ProblemMetadata
): { files: Record<string, string>; command: string } {
  const className = meta ? meta.className
    : (code.match(/(?:public\s+)?class\s+(\w+)/)?.[1] ?? 'Solution');

  // Metadata-driven helper injection
  const hasListNode = meta ? meta.helperClasses.includes('ListNode') : /\bclass\s+ListNode\b/.test(code);
  const hasTreeNode = meta ? meta.helperClasses.includes('TreeNode') : /\bclass\s+TreeNode\b/.test(code);
  const hasNodeCls = meta ? meta.helperClasses.includes('Node') : (/\bclass\s+Node\b/.test(code) && !hasListNode);
  const refListNode = meta ? hasListNode : (!hasListNode && /\bListNode\b/.test(code));
  const refTreeNode = meta ? hasTreeNode : (!hasTreeNode && /\bTreeNode\b/.test(code));
  const refNode = meta ? hasNodeCls : (!hasNodeCls && !hasListNode && /\bNode\b/.test(code));
  let injectedClasses = '';
  if (refListNode) injectedClasses += `
class ListNode {
  int val;
  ListNode next;
  ListNode() {}
  ListNode(int val) { this.val = val; }
  ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
`;
  if (refTreeNode) injectedClasses += `
class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  TreeNode() {}
  TreeNode(int val) { this.val = val; }
  TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}
`;
  if (refNode) injectedClasses += `
class Node {
  public int val;
  public List<Node> neighbors;
  public Node() { val = 0; neighbors = new ArrayList<Node>(); }
  public Node(int _val) { val = _val; neighbors = new ArrayList<Node>(); }
  public Node(int _val, ArrayList<Node> _neighbors) { val = _val; neighbors = _neighbors; }
}
`;
  if (injectedClasses) code = injectedClasses + code;

  const isDesignProblem = meta ? meta.isDesign : (() => {
    try {
      const tcs = JSON.parse(testCasesJson);
      if (tcs.length > 0) {
        const fi = JSON.parse(tcs[0].input);
        return fi && typeof fi === 'object' && 'ops' in fi && 'args' in fi;
      }
    } catch {}
    return false;
  })();

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
  testCasesJson: string,
  meta?: ProblemMetadata
): { files: Record<string, string>; command: string } {
  const hasListNode = meta ? meta.helperClasses.includes('ListNode')
    : /struct\s+ListNode|class\s+ListNode/.test(code);
  const hasTreeNode = meta ? meta.helperClasses.includes('TreeNode')
    : /struct\s+TreeNode|class\s+TreeNode/.test(code);

  const testCases = JSON.parse(testCasesJson);
  const firstInput = testCases.length > 0 ? JSON.parse(testCases[0].input) : {};
  const argKeys = Object.keys(firstInput);
  const argVals = Object.values(firstInput);

  const className = meta ? meta.className
    : (code.match(/(?:class\s+)(\w+)/)?.[1] ?? 'Solution');

  const isDesignProblem = meta ? meta.isDesign : (() => {
    try {
      const tcs = JSON.parse(testCasesJson);
      if (tcs.length > 0) {
        const fi = JSON.parse(tcs[0].input);
        return fi && typeof fi === 'object' && 'ops' in fi && 'args' in fi;
      }
    } catch {}
    return false;
  })();

  // Parse method parameter types from function signature in user code
  // Look for: "returnType methodName(paramType1 param1, paramType2 param2)"
  // Extract a map: paramName -> paramType
  function parseParamTypes(c: string): Map<string, string> {
    const m = c.match(new RegExp(`\\\\b${fn}\\\\s*\\\\(([^)]*)\\\\)`));
    if (!m) return new Map();
    const params = m[1].split(',');
    const result = new Map<string, string>();
    for (const p of params) {
      const parts = p.trim().split(/\s+/);
      if (parts.length >= 2) {
        const type = parts.slice(0, parts.length - 1).join(' ');
        const name = parts[parts.length - 1].replace(/[&*]/g, '');
        result.set(name, type);
      }
    }
    return result;
  }
  const paramTypes = parseParamTypes(code);

  function extractJson(name: string, val: unknown): string {
    const pt = paramTypes.get(name) || '';
    if (pt.includes('ListNode') || pt.includes('Node')) {
      return `vector<int> _${name}_arr = parseVecInt(inputVal["${name}"]); ListNode* ${name} = _arrToList(_${name}_arr);`;
    }
    if (pt.includes('TreeNode')) {
      return `vector<int> _${name}_arr = parseVecInt(inputVal["${name}"]); TreeNode* ${name} = _arrToTree(_${name}_arr);`;
    }
    if (pt.includes('vector<vector<char>>')) {
      return `vector<vector<char>> ${name} = parseVecVecChar(inputVal["${name}"]);`;
    }
    if (pt.includes('vector<char>')) {
      return `vector<char> ${name} = parseVecChar(inputVal["${name}"]);`;
    }
    if (pt.includes('vector<vector<string>>')) {
      return `vector<vector<string>> ${name} = parseVecVecStr(inputVal["${name}"]);`;
    }
    if (pt.includes('vector<string>')) {
      return `vector<string> ${name} = parseVecStr(inputVal["${name}"]);`;
    }
    if (Array.isArray(val)) {
      if (val.length > 0 && Array.isArray(val[0])) {
        if (typeof val[0][0] === 'string') {
          return `vector<vector<char>> ${name} = parseVecVecChar(inputVal["${name}"]);`;
        }
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
      if (trimmed.includes('"')) return `toJsonVecStr(result)`;
      if (trimmed.includes('[')) return `toJsonVecVecInt(result)`;
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

  // Helper definitions: ListNode, TreeNode (if not in user code), and conversion helpers
  const listStructDef = hasListNode ? '' : `
struct ListNode {
  int val;
  ListNode *next;
  ListNode(int x = 0, ListNode *n = NULL) : val(x), next(n) {}
};`;
  const treeStructDef = hasTreeNode ? '' : `
struct TreeNode {
  int val;
  TreeNode *left, *right;
  TreeNode(int x = 0, TreeNode *l = NULL, TreeNode *r = NULL) : val(x), left(l), right(r) {}
};`;
  const listHelpers = hasListNode ? `
ListNode* _arrToList(vector<int>& arr) {
  if (arr.empty()) return NULL;
  ListNode* head = new ListNode(arr[0]);
  ListNode* cur = head;
  for (size_t i = 1; i < arr.size(); i++) { cur->next = new ListNode(arr[i]); cur = cur->next; }
  return head;
}
string _listToJson(ListNode* head) {
  ostringstream ss; ss << "[";
  bool first = true;
  while (head) { if (!first) ss << ","; first = false; ss << head->val; head = head->next; }
  ss << "]"; return ss.str();
}` : '';
  const treeHelpers = hasTreeNode ? `
TreeNode* _arrToTree(vector<int>& arr) {
  if (arr.empty() || arr[0] == -999999) return NULL;
  TreeNode* root = new TreeNode(arr[0]);
  queue<TreeNode*> q; q.push(root);
  size_t i = 1;
  while (!q.empty() && i < arr.size()) {
    TreeNode* node = q.front(); q.pop();
    if (i < arr.size() && arr[i] != -999999) { node->left = new TreeNode(arr[i]); q.push(node->left); }
    i++;
    if (i < arr.size() && arr[i] != -999999) { node->right = new TreeNode(arr[i]); q.push(node->right); }
    i++;
  }
  return root;
}
string _treeToJson(TreeNode* root) {
  if (!root) return "[]";
  ostringstream ss; ss << "[";
  queue<TreeNode*> q; q.push(root);
  bool first = true;
  int lastNonNull = 0;
  vector<string> vals;
  while (!q.empty()) {
    TreeNode* node = q.front(); q.pop();
    if (!node) { vals.push_back("null"); continue; }
    vals.push_back(to_string(node->val)); lastNonNull = vals.size();
    q.push(node->left); q.push(node->right);
  }
  for (int i = 0; i < lastNonNull; i++) { if (i > 0) ss << ","; ss << vals[i]; }
  ss << "]"; return ss.str();
}` : '';
  const designHelpers = `
string toJsonDesign(const vector<variant<int, bool, string, nullptr_t>>& out) {
  ostringstream ss; ss << "[";
  for (size_t i = 0; i < out.size(); i++) {
    if (i > 0) ss << ",";
    visit([&](auto&& arg) {
      using T = decay_t<decltype(arg)>;
      if constexpr (is_same_v<T, nullptr_t>) ss << "null";
      else if constexpr (is_same_v<T, bool>) ss << (arg ? "true" : "false");
      else if constexpr (is_same_v<T, string>) ss << "\\"" << escapeJson(arg) << "\\"";
      else ss << arg;
    }, out[i]);
  }
  ss << "]"; return ss.str();
}`;

  // For design problems, generate ops/args pattern runner
  if (isDesignProblem) {
    const run = `
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
#include <variant>
using namespace std;

${code}
${listStructDef}${treeStructDef}${listHelpers}${treeHelpers}

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
    int n = 0, sign = 1;
    if (s[i] == '-') { sign = -1; i++; }
    while (i < s.size() && isdigit(s[i])) { n = n * 10 + (s[i] - '0'); i++; }
    v.push_back(n * sign);
  }
  return v;
}

string parseStr(const string& s) {
  size_t a = s.find('"');
  if (a == string::npos) return s;
  a++; size_t b = s.find('"', a);
  if (b == string::npos) return s.substr(a);
  return s.substr(a, b - a);
}

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
    string tcStr = content.substr(pos, end - pos); pos = end;
    auto start = chrono::high_resolution_clock::now();
    string err;
    try {
      // Simple parse: extract "input" and "expectedOutput" fields
      size_t inKey = tcStr.find("\\"input\\"");
      size_t inStart = tcStr.find('"', inKey + 8);
      size_t inEnd = tcStr.rfind('"', tcStr.find('}', inStart));
      // Actually, let's use a simpler approach: parse ops/args from input
      size_t ip = tcStr.find("\\"ops\\"");
      vector<string> ops;
      if (ip != string::npos) {
        size_t arrStart = tcStr.find('[', ip);
        if (arrStart != string::npos) {
          size_t arrEnd = arrStart + 1; int d = 1;
          while (arrEnd < tcStr.size() && d > 0) {
            if (tcStr[arrEnd] == '[') d++;
            else if (tcStr[arrEnd] == ']') d--;
            arrEnd++;
          }
          string opsArr = tcStr.substr(arrStart, arrEnd - arrStart);
          size_t oi = 0;
          while (oi < opsArr.size()) {
            while (oi < opsArr.size() && opsArr[oi] != '"') oi++;
            if (oi >= opsArr.size()) break; oi++;
            string op;
            while (oi < opsArr.size() && opsArr[oi] != '"') { op += opsArr[oi]; oi++; } oi++;
            if (!op.empty()) ops.push_back(op);
          }
        }
      }
      size_t ap = tcStr.find("\\"args\\"");
      vector<vector<int>> args;
      if (ap != string::npos) {
        size_t arrStart = tcStr.find('[', ap);
        if (arrStart != string::npos) {
          size_t arrEnd = arrStart + 1; int d = 1;
          while (arrEnd < tcStr.size() && d > 0) {
            if (tcStr[arrEnd] == '[') d++;
            else if (tcStr[arrEnd] == ']') d--;
            arrEnd++;
          }
          string argsArr = tcStr.substr(arrStart, arrEnd - arrStart);
          size_t ai = 0;
          while (ai < argsArr.size()) {
            while (ai < argsArr.size() && argsArr[ai] != '[') ai++;
            if (ai >= argsArr.size()) break;
            size_t ae = ai + 1; int d2 = 1;
            while (ae < argsArr.size() && d2 > 0) {
              if (argsArr[ae] == '[') d2++;
              else if (argsArr[ae] == ']') d2--;
              ae++;
            }
            string inner = argsArr.substr(ai, ae - ai);
            args.push_back(parseVecInt(inner));
            ai = ae;
          }
        }
      }
      size_t expKey = tcStr.find("\\"expectedOutput\\"");
      string expected;
      if (expKey != string::npos) {
        size_t ec = tcStr.find(':', expKey); ec++;
        while (ec < tcStr.size() && tcStr[ec] == ' ') ec++;
        if (tcStr[ec] == '"') { ec++; while (ec < tcStr.size() && tcStr[ec] != '"') { expected += tcStr[ec]; ec++; } }
        else { size_t ee = tcStr.find(',', ec); if (ee == string::npos) ee = tcStr.find('}', ec); expected = tcStr.substr(ec, ee - ec); }
      }

      ${className}* obj = nullptr;
      vector<variant<int, bool, string, nullptr_t>> out;
      for (size_t i = 0; i < ops.size(); i++) {
        if (ops[i] == "${className}") {
          obj = new ${className}();
          out.push_back(nullptr);
        } else {
          vector<int> arg = args[i];
          // Dispatch based on method name
          auto call = [&](auto getResult) -> void {
            using R = decltype(getResult());
            if constexpr (is_same_v<R, void>) { obj->${fn}(); out.push_back(nullptr); }
            else if constexpr (is_same_v<R, int>) { out.push_back((int)getResult()); }
            else if constexpr (is_same_v<R, bool>) { out.push_back((bool)getResult()); }
            else out.push_back(nullptr);
          };
          // We'll use old-style dispatch since C++ doesn't support string->method easily
          // For MyQueue specifically:
          if (ops[i] == "push") { obj->push(arg.empty() ? 0 : arg[0]); out.push_back(nullptr); }
          else if (ops[i] == "pop") { out.push_back(obj->pop()); }
          else if (ops[i] == "peek") { out.push_back(obj->peek()); }
          else if (ops[i] == "empty") { out.push_back((bool)obj->empty()); }
          else out.push_back(nullptr);
        }
      }
      auto end = chrono::high_resolution_clock::now();
      double rt = chrono::duration<double, milli>(end - start).count();
      string actual = toJsonDesign(out);
      bool pass = actual == expected;
      if (!first) out << ","; first = false;
      out << "{\\"pass\\":" << (pass ? "true" : "false") << ",\\"runtime\\":" << round(rt * 100) / 100 << ",\\"memory\\":0,\\"error\\":null,\\"expected\\":\\"" << escapeJson(expected) << "\\",\\"actual\\":\\"" << escapeJson(actual) << "\\"}";
    } catch (exception& e) {
      if (!first) out << ","; first = false;
      out << "{\\"pass\\":false,\\"runtime\\":0,\\"memory\\":0,\\"error\\":\\"" << escapeJson(e.what()) << "\\",\\"expected\\":\\"" << escapeJson("") << "\\",\\"actual\\":null}";
    }
  }
  out << "]}";
  cout << out.str() << endl;
  return 0;
}`;
    return { files: { "runner.cpp": run, "testcases.json": testCasesJson }, command: `g++ -std=c++17 -o ${WORK_DIR}/prog ${WORK_DIR}/runner.cpp && ${WORK_DIR}/prog` };
  }

  // Standard function problem runner
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
#include <queue>
using namespace std;

${code}
${listStructDef}${treeStructDef}${listHelpers}${treeHelpers}

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

vector<char> parseVecChar(const string& s) {
  vector<char> v;
  size_t i = 0;
  while (i < s.size() && s[i] != '[') i++;
  if (i >= s.size()) return v;
  i++;
  while (i < s.size() && s[i] != ']') {
    while (i < s.size() && (s[i] == ' ' || s[i] == ',')) i++;
    if (i >= s.size() || s[i] == ']') break;
    if (s[i] == '"') { i++; if (i < s.size()) { v.push_back(s[i]); i++; } while (i < s.size() && s[i] != '"') i++; i++; }
    else if (s[i] == '\'') { i++; if (i < s.size()) { v.push_back(s[i]); i++; } while (i < s.size() && s[i] != '\'') i++; i++; }
    else { v.push_back(s[i]); i++; }
  }
  return v;
}

vector<vector<char>> parseVecVecChar(const string& s) {
  vector<vector<char>> v;
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
      v.push_back(parseVecChar(s.substr(i, end - i)));
      i = end;
    }
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

vector<vector<string>> parseVecVecStr(const string& s) {
  vector<vector<string>> v;
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
      v.push_back(parseVecStr(s.substr(i, end - i)));
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


/* ---------- C ---------- */
function generateCRunner(
  code: string,
  fn: string,
  testCasesJson: string,
  meta?: ProblemMetadata
): { files: Record<string, string>; command: string } {
  const testCases = JSON.parse(testCasesJson);
  const firstInput = testCases.length > 0 ? JSON.parse(testCases[0].input) : {};
  const argKeys = Object.keys(firstInput);
  const argVals = Object.values(firstInput);

  const isDesignProblem = meta ? meta.isDesign : (() => {
    try {
      const tcs = JSON.parse(testCasesJson);
      if (tcs.length > 0) {
        const fi = JSON.parse(tcs[0].input);
        return fi && typeof fi === 'object' && 'ops' in fi && 'args' in fi;
      }
    } catch {}
    return false;
  })();

  const className = meta ? meta.className : (code.match(/(?:class\s+|struct\s+)(\w+)/)?.[1] ?? 'Solution');

  // Parse parameter types from function signature
  function parseParamTypes(c: string): Map<string, string> {
    const m = c.match(new RegExp(`\\\\b${fn}\\\\s*\\\\(([^)]*)\\\\)`));
    if (!m) return new Map();
    const params = m[1].split(',');
    const result = new Map<string, string>();
    for (const p of params) {
      const parts = p.trim().split(/\s+/);
      if (parts.length >= 2) {
        const type = parts.slice(0, parts.length - 1).join(' ');
        const name = parts[parts.length - 1].replace(/[&*]/g, '');
        result.set(name, type);
      }
    }
    return result;
  }
  const paramTypes = parseParamTypes(code);

  function extractC(name: string, val: unknown): string {
    const pt = paramTypes.get(name) || '';
    if (pt.includes('char**') || pt.includes('char *')) {
      return `char** ${name} = NULL; int ${name}Size = 0; parseStrArr(inputRaw, "${name}", &${name}, &${name}Size);`;
    }
    if (pt.includes('char') && pt.includes('[')) {
      return `char* ${name} = inputVals_str(inputVals, "${name}");`;
    }
    if (pt.includes('bool') || pt === '_Bool') {
      return `int ${name} = inputVals_bool(inputVals, "${name}");`;
    }
    if (pt.includes('struct ListNode')) {
      return `int* _${name}_arr = inputVals_ints(inputVals, "${name}"); int _${name}_len = inputVals_len(inputVals, "${name}"); struct ListNode* ${name} = _arrToList(_${name}_arr, _${name}_len);`;
    }
    if (pt.includes('struct TreeNode')) {
      return `int* _${name}_arr = inputVals_ints(inputVals, "${name}"); int _${name}_len = inputVals_len(inputVals, "${name}"); struct TreeNode* ${name} = _arrToTree(_${name}_arr, _${name}_len);`;
    }
    if (Array.isArray(val)) {
      if (val.length > 0 && typeof val[0] === "string") {
        return `char** ${name} = NULL; int ${name}Size = 0; parseStrArr(inputRaw, "${name}", &${name}, &${name}Size);`;
      }
      return `int* ${name} = inputVals_ints(inputVals, "${name}"); int ${name}Size = inputVals_len(inputVals, "${name}");`;
    }
    if (typeof val === "string") return `char* ${name} = inputVals_str(inputVals, "${name}");`;
    if (typeof val === "boolean") return `int ${name} = inputVals_bool(inputVals, "${name}");`;
    return `int ${name} = inputVals_int(inputVals, "${name}");`;
  }

  const argExtract = argKeys.map((k, i) => extractC(k, argVals[i])).join("\n    ");
  const argCallC = argKeys.map(k => {
    const pt = paramTypes.get(k) || '';
    if (pt.includes('struct ListNode') || pt.includes('struct TreeNode')) return k;
    if (pt.includes('**') || pt.includes('*]')) { return `${k}, ${k}Size`; }
    if (Array.isArray(firstInput[k])) return `${k}, ${k}Size`;
    return k;
  }).join(", ");
  const argCall = argCallC + (argKeys.length > 0 ? ", &_returnSize" : "");

  const firstExpected = testCases.length > 0 ? testCases[0].expectedOutput.trim() : "";
  const is2DArrayReturn = /^\[\[.*\]\]$/.test(firstExpected) || (firstExpected.startsWith('[') && firstExpected.includes('['));
  const isArrayReturn = firstExpected.startsWith('[') && !is2DArrayReturn;
  const isStringReturn = firstExpected.startsWith('"');
  const isBoolReturn = firstExpected === 'true' || firstExpected === 'false';

  // Metadata-driven helper detection
  const hasListNode = meta ? meta.helperClasses.includes('ListNode')
    : /struct\s+ListNode/.test(code);
  const hasTreeNode = meta ? meta.helperClasses.includes('TreeNode')
    : /struct\s+TreeNode/.test(code);

  const listStructDef = hasListNode ? '' : `
struct ListNode {
  int val;
  struct ListNode* next;
};
struct ListNode* _arrToList(int* arr, int len) {
  if (len == 0) return NULL;
  struct ListNode* head = (struct ListNode*)malloc(sizeof(struct ListNode));
  head->val = arr[0]; head->next = NULL;
  struct ListNode* cur = head;
  for (int i = 1; i < len; i++) {
    cur->next = (struct ListNode*)malloc(sizeof(struct ListNode));
    cur = cur->next; cur->val = arr[i]; cur->next = NULL;
  }
  return head;
}`;
  const treeStructDef = hasTreeNode ? '' : `
struct TreeNode {
  int val;
  struct TreeNode* left;
  struct TreeNode* right;
};
struct TreeNode* _arrToTree(int* arr, int len) {
  if (len == 0 || arr[0] == -999999) return NULL;
  struct TreeNode** q = (struct TreeNode**)malloc(len * sizeof(struct TreeNode*));
  int front = 0, back = 0;
  struct TreeNode* root = (struct TreeNode*)malloc(sizeof(struct TreeNode));
  root->val = arr[0]; root->left = NULL; root->right = NULL;
  q[back++] = root;
  int i = 1;
  while (front < back && i < len) {
    struct TreeNode* node = q[front++];
    if (i < len && arr[i] != -999999) {
      node->left = (struct TreeNode*)malloc(sizeof(struct TreeNode));
      node->left->val = arr[i]; node->left->left = NULL; node->left->right = NULL;
      q[back++] = node->left;
    }
    i++;
    if (i < len && arr[i] != -999999) {
      node->right = (struct TreeNode*)malloc(sizeof(struct TreeNode));
      node->right->val = arr[i]; node->right->left = NULL; node->right->right = NULL;
      q[back++] = node->right;
    }
    i++;
  }
  free(q);
  return root;
}`;

  // For design problems, generate ops/args pattern runner (MyQueue)
  if (isDesignProblem) {
    const run = `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>

${code}

int main() {
  FILE* f = fopen("${WORK_DIR}/testcases.json", "r");
  fseek(f, 0, SEEK_END); long fsize = ftell(f); fseek(f, 0, SEEK_SET);
  char* buf = (char*)malloc(fsize + 1);
  fread(buf, 1, fsize, f); buf[fsize] = 0; fclose(f);

  printf("{\\"results\\":["); int first = 1;
  char* p = buf;
  while (*p) {
    while (*p && *p != '{') p++;
    if (!*p) break;
    char* objStart = p; int depth = 1; p++;
    while (*p && depth > 0) { if (*p == '{') depth++; else if (*p == '}') depth--; p++; }
    char tc[65536]; int tcl = (int)(p - objStart); if (tcl > 65535) tcl = 65535;
    strncpy(tc, objStart, tcl); tc[tcl] = 0;

    clock_t start = clock();

    // Parse ops and args from JSON
    char ops[100][64]; int opCount = 0;
    char* ostart = strstr(tc, "\\"ops\\"");
    if (ostart) {
      char* oarr = strchr(ostart, '[');
      if (oarr) {
        char* o = oarr + 1;
        while (*o && *o != ']') {
          while (*o && *o != '"') o++;
          if (*o) { o++;
            int oi = 0; while (*o && *o != '"') { ops[opCount][oi++] = *o; o++; } ops[opCount][oi] = 0; opCount++;
            if (*o) o++;
          }
          while (*o && (*o == ',' || *o == ' ')) o++;
        }
      }
    }

    // Parse args — simple: just get arrays of ints
    int args[100][64]; int argCounts[100] = {0};
    char* aarr = strstr(tc, "\\"args\\"");
    if (aarr) {
      char* abegin = strchr(aarr, '[');
      if (abegin) {
        char* a = abegin + 1; int ai = 0;
        while (*a && *a != ']' && ai < 100) {
          while (*a && (*a == ' ' || *a == ',')) a++;
          if (*a == '[') {
            a++; argCounts[ai] = 0;
            while (*a && *a != ']') {
              while (*a && (*a == ' ' || *a == ',')) a++;
              if (*a && *a != ']') { args[ai][argCounts[ai]++] = atoi(a); while (*a && *a != ',' && *a != ']') a++; }
            }
            if (*a) a++;
            ai++;
          } else if (*a == ' ') { a++; }
        }
      }
    }

    char expected[4096] = {0};
    char* ek = strstr(tc, "\\"expectedOutput\\"");
    if (ek) {
      char* ec = strchr(ek + 16, ':');
      if (ec) { ec++;
        while (*ec == ' ') ec++;
        if (*ec == '"') { ec++; int ei = 0; while (*ec && *ec != '"') { expected[ei++] = *ec; ec++; } expected[ei] = 0; }
        else { int ei = 0; while (*ec && *ec != ',' && *ec != '}') { expected[ei++] = *ec; ec++; } expected[ei] = 0; }
      }
    }

    // Execute MyQueue operations
    int outArr[100]; int outCount = 0;
    int* queue = NULL; int qFront = 0, qBack = 0; int qCap = 0;
    for (int i = 0; i < opCount; i++) {
      if (strcmp(ops[i], "${className}") == 0) {
        queue = (int*)malloc(100 * sizeof(int));
        qFront = 0; qBack = 0; qCap = 100;
        outArr[outCount++] = -999999; // null indicator
      } else if (strcmp(ops[i], "push") == 0) {
        queue[qBack++] = args[i][0];
        outArr[outCount++] = -999999;
      } else if (strcmp(ops[i], "pop") == 0) {
        outArr[outCount++] = queue[qFront++];
      } else if (strcmp(ops[i], "peek") == 0) {
        outArr[outCount++] = queue[qFront];
      } else if (strcmp(ops[i], "empty") == 0) {
        outArr[outCount++] = (qFront >= qBack) ? 999998 : 999997; // true/false marker
      }
    }
    free(queue);

    // Build actual JSON output
    char actual[4096] = "[";
    for (int i = 0; i < outCount; i++) {
      if (i > 0) strcat(actual, ",");
      if (outArr[i] == -999999) strcat(actual, "null");
      else if (outArr[i] == 999998) strcat(actual, "true");
      else if (outArr[i] == 999997) strcat(actual, "false");
      else { char b[16]; sprintf(b, "%d", outArr[i]); strcat(actual, b); }
    }
    strcat(actual, "]");

    clock_t end = clock();
    double rt = ((double)(end - start)) / CLOCKS_PER_SEC * 1000.0;
    int pass = (strcmp(actual, expected) == 0);

    if (!first) printf(","); first = 0;
    printf("{\\"pass\\":%s,\\"runtime\\":%.2f,\\"memory\\":0,\\"error\\":null,\\"expected\\":\\"%s\\",\\"actual\\":\\"%s\\"}",
      pass ? "true" : "false", rt, expected, actual);
  }
  printf("]}\\n");
  free(buf);
  return 0;
}`;
    return { files: { "runner.c": run, "testcases.json": testCasesJson }, command: `gcc -o ${WORK_DIR}/prog ${WORK_DIR}/runner.c -lm && ${WORK_DIR}/prog` };
  }

  const runner = `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>
#include <ctype.h>

${code}

#define MAX_JSON 65536

typedef struct { char keys[16][64]; char strVals[16][4096]; int intVals[16][4096]; int valLens[16]; int isStr[16]; int isBool[16]; int count; } InputVals;

static int keyIndex(InputVals iv, const char* key) {
  for (int i = 0; i < iv.count; i++) if (strcmp(iv.keys[i], key) == 0) return i;
  return -1;
}
static int* inputVals_ints(InputVals iv, const char* key) { int i = keyIndex(iv, key); return i >= 0 ? iv.intVals[i] : NULL; }
static int inputVals_int(InputVals iv, const char* key) { int* p = inputVals_ints(iv, key); return p ? p[0] : 0; }
static int inputVals_len(InputVals iv, const char* key) { int i = keyIndex(iv, key); return i >= 0 ? iv.valLens[i] : 0; }
static char* inputVals_str(InputVals iv, const char* key) { int i = keyIndex(iv, key); return i >= 0 ? iv.strVals[i] : NULL; }
static int inputVals_bool(InputVals iv, const char* key) { int i = keyIndex(iv, key); return i >= 0 ? iv.isBool[i] : 0; }

// Parse a string array from JSON: ["a","b","c"] -> char**, returns count
static void parseStrArr(const char* input, const char* key, char*** out, int* count) {
  *out = NULL; *count = 0;
  // Find key in input
  const char* ks = strstr(input, key);
  if (!ks) return;
  const char* colon = strchr(ks, ':');
  if (!colon) return;
  const char* arrStart = strchr(colon, '[');
  if (!arrStart) return;
  const char* p = arrStart + 1;
  int cap = 0;
  while (*p && *p != ']') {
    while (*p && (*p == ' ' || *p == ',')) p++;
    if (*p == ']') break;
    if (*p == '"') {
      p++;
      if (*count >= cap) { cap = cap == 0 ? 8 : cap * 2; *out = (char**)realloc(*out, cap * sizeof(char*)); }
      int len = 0;
      const char* start = p;
      while (*p && *p != '"') { p++; len++; }
      (*out)[*count] = (char*)malloc(len + 1);
      strncpy((*out)[*count], start, len);
      (*out)[*count][len] = 0;
      (*count)++;
      if (*p == '"') p++;
    } else {
      p++;
    }
  }
}

${listStructDef}
${treeStructDef}

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
        // String array — stores ALL elements now (fixed from overwrite bug)
        iv.isStr[ki] = 1; iv.valLens[ki] = 0;
        // Find the full array content and store first string element for backward compat
        // Actually store it differently: use strVals for the whole thing joined
        int vp = 0;
        const char* ss = s + 1;
        iv.strVals[ki][0] = 0;
        while (*ss && *ss != ']') {
          while (*ss && *ss != '"') ss++;
          if (*ss == '"') {
            ss++; int svp = vp;
            while (*ss && *ss != '"') { if (iv.valLens[ki] == 0) iv.strVals[ki][svp++] = *ss; ss++; }
            iv.strVals[ki][svp] = 0;
            iv.valLens[ki]++;
            if (*ss == '"') ss++;
            while (*ss && (*ss == ',' || *ss == ' ')) ss++;
          }
        }
        iv.isStr[ki] = 1;
      } else if (*(s+1) == '[') {
        // 2D int array: [[1,2],[3,4]] — store flattened with dimensions
        iv.isStr[ki] = 0; iv.valLens[ki] = 0;
        const char* ss = s + 1;
        while (*ss && *ss != ']') {
          while (*ss && (*ss == ' ' || *ss == ',')) ss++;
          if (*ss == '[') {
            ss++;
            int* arr = iv.intVals[ki];
            while (*ss && *ss != ']') {
              while (*ss && (*ss == ' ' || *ss == ',')) ss++;
              if (*ss == ']') break;
              arr[iv.valLens[ki]++] = atoi(ss);
              while (*ss && *ss != ',' && *ss != ']') ss++;
            }
            if (*ss == ']') ss++;
          }
        }
        // Mark as 2D by setting valLens[ki] = total count and isStr[ki] = 0 (already)
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
    } else if (strncmp(s, "true", 4) == 0) {
      iv.isBool[ki] = 1; iv.intVals[ki][0] = 1; iv.valLens[ki] = 1; s += 4;
    } else if (strncmp(s, "false", 5) == 0) {
      iv.isBool[ki] = 1; iv.intVals[ki][0] = 0; iv.valLens[ki] = 1; s += 5;
    } else if (strncmp(s, "null", 4) == 0) {
      iv.isStr[ki] = 0; iv.intVals[ki][0] = 0; iv.valLens[ki] = 1; s += 4;
    } else if ((*s >= '0' && *s <= '9') || *s == '-') {
      iv.isStr[ki] = 0; iv.intVals[ki][0] = atoi(s); iv.valLens[ki] = 1;
      while (*s && *s != ',' && *s != '}' && *s != ']') s++;
    } else {
      iv.isStr[ki] = 0; iv.intVals[ki][0] = 0; iv.valLens[ki] = 1;
      while (*s && *s != ',' && *s != '}' && *s != ']') s++;
    }
    if (*s && *s != '}' && *s != ']') { s++; }
    ki++;
  }
  iv.count = ki;
  return iv;
}

int main() {
  FILE* f = fopen("${WORK_DIR}/testcases.json", "r");
  char* buf = malloc(MAX_JSON);
  size_t len = fread(buf, 1, MAX_JSON - 1, f); buf[len] = 0;
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

    char inputRaw[4096] = {0}, expected[4096] = {0};
    char* tp = tcBuf;
    while (*tp) {
      while (*tp && *tp != '"') tp++;
      if (!*tp) break; tp++;
      char key[64]; int kpi = 0;
      while (*tp && *tp != '"') { if (*tp == '\\\\' && *(tp+1)) tp++; key[kpi++] = *tp; tp++; } key[kpi] = 0; tp++;
      while (*tp && *tp != ':') tp++; if (*tp) tp++;
      while (*tp && *tp == ' ') tp++;
      if (*tp == '"') {
        tp++; char val[4096]; int vpi = 0;
        while (*tp) {
          if (*tp == '\\\\' && *(tp+1)) { tp++; if (*tp == '"') { val[vpi++] = '"'; tp++; continue; } }
          if (*tp == '"') break;
          val[vpi++] = *tp; tp++;
        } val[vpi] = 0; tp++;
        if (strcmp(key, "input") == 0) strcpy(inputRaw, val);
        else if (strcmp(key, "expectedOutput") == 0) strcpy(expected, val);
      } else {
        char* es = tp; while (*tp && *tp != ',' && *tp != '}') tp++;
        char val[4096]; int vpi = 0; for (char* c = es; c < tp; c++) val[vpi++] = *c; val[vpi] = 0;
        if (strcmp(key, "input") == 0) strcpy(inputRaw, val);
        else if (strcmp(key, "expectedOutput") == 0) strcpy(expected, val);
      }
    }

    clock_t start = clock();
    char actual[65536] = {0};
    int pass = 0;

    InputVals inputVals = parseSimpleJson(inputRaw);

    ${argExtract}
    int _returnSize;
    ${is2DArrayReturn
      ? `int** result = ${fn}(${argCall});`
      : isArrayReturn && !is2DArrayReturn
        ? `int* result = ${fn}(${argCall});`
        : isStringReturn
          ? `char* result = ${fn}(${argCall});`
          : isBoolReturn
            ? `int result = ${fn}(${argCall});`
            : `int result = ${fn}(${argCall});`}

    ${is2DArrayReturn
      ? `{
        // Serialize 2D int array (variable number of columns per row)
        // Format: [[1,2],[3,4],...]
        // The C function sets _returnSize = total number of 2D elements across all rows
        // We need to reconstruct from the flat array
        strcat(actual, "[");
        // First, try to determine column sizes - default is 3 for triplets
        int totalElements = _returnSize;
        int rowCount = totalElements / 3; // assume 3 elements per row
        for (int i = 0; i < rowCount; i++) {
          if (i > 0) strcat(actual, ",");
          strcat(actual, "[");
          for (int j = 0; j < 3; j++) {
            if (j > 0) strcat(actual, ",");
            char _b[16]; sprintf(_b, "%d", result[i * 3 + j]); strcat(actual, _b);
          }
          strcat(actual, "]");
        }
        strcat(actual, "]");
      }`
      : isArrayReturn && !is2DArrayReturn
        ? `sprintf(actual, "["); for (int _i = 0; _i < _returnSize; _i++) { if (_i > 0) strcat(actual, ","); char _b[16]; sprintf(_b, "%d", result[_i]); strcat(actual, _b); } strcat(actual, "]");`
        : isStringReturn
          ? `sprintf(actual, "\\"%s\\"", result);`
          : isBoolReturn
            ? `sprintf(actual, "%s", result ? "true" : "false");`
            : `sprintf(actual, "%d", result);`}

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






