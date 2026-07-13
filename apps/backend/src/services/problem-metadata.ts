// Metadata-driven problem registry
// Each problem's metadata drives wrapper generation — no regex discovery from user code.

export interface ParamInfo {
  name: string;
  type: string; // canonical type: int, long, double, boolean, char, String, int[], int[][], char[], char[][], String[], ListNode, ListNode[], TreeNode, Node, List<List<Integer>>, void
}

export interface ProblemMetadata {
  slug: string;
  className: string;
  methodName: string;
  returnType: string;
  params: ParamInfo[];
  isDesign: boolean;
  designOps?: string[];
  helperClasses: string[]; // ["ListNode"], ["TreeNode"], ["Node"], or empty
}

const METADATA: Record<string, ProblemMetadata> = {
  // ─── EASY ───
  "two-sum": {
    slug: "two-sum", className: "Solution", methodName: "twoSum",
    returnType: "int[]",
    params: [{ name: "nums", type: "int[]" }, { name: "target", type: "int" }],
    isDesign: false, helperClasses: [],
  },
  "best-time-to-buy-and-sell-stock": {
    slug: "best-time-to-buy-and-sell-stock", className: "Solution", methodName: "maxProfit",
    returnType: "int",
    params: [{ name: "prices", type: "int[]" }],
    isDesign: false, helperClasses: [],
  },
  "plus-one": {
    slug: "plus-one", className: "Solution", methodName: "plusOne",
    returnType: "int[]",
    params: [{ name: "digits", type: "int[]" }],
    isDesign: false, helperClasses: [],
  },
  "single-number": {
    slug: "single-number", className: "Solution", methodName: "singleNumber",
    returnType: "int",
    params: [{ name: "nums", type: "int[]" }],
    isDesign: false, helperClasses: [],
  },
  "valid-anagram": {
    slug: "valid-anagram", className: "Solution", methodName: "isAnagram",
    returnType: "boolean",
    params: [{ name: "s", type: "String" }, { name: "t", type: "String" }],
    isDesign: false, helperClasses: [],
  },
  "contains-duplicate": {
    slug: "contains-duplicate", className: "Solution", methodName: "containsDuplicate",
    returnType: "boolean",
    params: [{ name: "nums", type: "int[]" }],
    isDesign: false, helperClasses: [],
  },
  "ransom-note": {
    slug: "ransom-note", className: "Solution", methodName: "canConstruct",
    returnType: "boolean",
    params: [{ name: "ransomNote", type: "String" }, { name: "magazine", type: "String" }],
    isDesign: false, helperClasses: [],
  },
  "word-pattern": {
    slug: "word-pattern", className: "Solution", methodName: "wordPattern",
    returnType: "boolean",
    params: [{ name: "pattern", type: "String" }, { name: "s", type: "String" }],
    isDesign: false, helperClasses: [],
  },
  "valid-palindrome": {
    slug: "valid-palindrome", className: "Solution", methodName: "isPalindrome",
    returnType: "boolean",
    params: [{ name: "s", type: "String" }],
    isDesign: false, helperClasses: [],
  },
  "move-zeroes": {
    slug: "move-zeroes", className: "Solution", methodName: "moveZeroes",
    returnType: "void",
    params: [{ name: "nums", type: "int[]" }],
    isDesign: false, helperClasses: [],
  },
  "remove-duplicates-from-sorted-array": {
    slug: "remove-duplicates-from-sorted-array", className: "Solution", methodName: "removeDuplicates",
    returnType: "int",
    params: [{ name: "nums", type: "int[]" }],
    isDesign: false, helperClasses: [],
  },
  "valid-parentheses": {
    slug: "valid-parentheses", className: "Solution", methodName: "isValid",
    returnType: "boolean",
    params: [{ name: "s", type: "String" }],
    isDesign: false, helperClasses: [],
  },
  "implement-queue-using-stacks": {
    slug: "implement-queue-using-stacks", className: "MyQueue", methodName: "",
    returnType: "void",
    params: [],
    isDesign: true, designOps: ["MyQueue", "push", "pop", "peek", "empty"], helperClasses: [],
  },

  // ─── MEDIUM ───
  "longest-substring-without-repeating-characters": {
    slug: "longest-substring-without-repeating-characters", className: "Solution", methodName: "lengthOfLongestSubstring",
    returnType: "int",
    params: [{ name: "s", type: "String" }],
    isDesign: false, helperClasses: [],
  },
  "3sum": {
    slug: "3sum", className: "Solution", methodName: "threeSum",
    returnType: "int[][]",
    params: [{ name: "nums", type: "int[]" }],
    isDesign: false, helperClasses: [],
  },
  "add-two-numbers": {
    slug: "add-two-numbers", className: "Solution", methodName: "addTwoNumbers",
    returnType: "ListNode",
    params: [{ name: "l1", type: "ListNode" }, { name: "l2", type: "ListNode" }],
    isDesign: false, helperClasses: ["ListNode"],
  },
  "reverse-linked-list": {
    slug: "reverse-linked-list", className: "Solution", methodName: "reverseList",
    returnType: "ListNode",
    params: [{ name: "head", type: "ListNode" }],
    isDesign: false, helperClasses: ["ListNode"],
  },
  "binary-tree-inorder-traversal": {
    slug: "binary-tree-inorder-traversal", className: "Solution", methodName: "inorderTraversal",
    returnType: "int[]",
    params: [{ name: "root", type: "TreeNode" }],
    isDesign: false, helperClasses: ["TreeNode"],
  },
  "validate-binary-search-tree": {
    slug: "validate-binary-search-tree", className: "Solution", methodName: "isValidBST",
    returnType: "boolean",
    params: [{ name: "root", type: "TreeNode" }],
    isDesign: false, helperClasses: ["TreeNode"],
  },
  "number-of-islands": {
    slug: "number-of-islands", className: "Solution", methodName: "numIslands",
    returnType: "int",
    params: [{ name: "grid", type: "char[][]" }],
    isDesign: false, helperClasses: [],
  },
  "clone-graph": {
    slug: "clone-graph", className: "Solution", methodName: "cloneGraph",
    returnType: "Node",
    params: [{ name: "node", type: "Node" }],
    isDesign: false, helperClasses: ["Node"],
  },
  "subsets": {
    slug: "subsets", className: "Solution", methodName: "subsets",
    returnType: "int[][]",
    params: [{ name: "nums", type: "int[]" }],
    isDesign: false, helperClasses: [],
  },
  "search-in-rotated-sorted-array": {
    slug: "search-in-rotated-sorted-array", className: "Solution", methodName: "search",
    returnType: "int",
    params: [{ name: "nums", type: "int[]" }, { name: "target", type: "int" }],
    isDesign: false, helperClasses: [],
  },
  "jump-game": {
    slug: "jump-game", className: "Solution", methodName: "canJump",
    returnType: "boolean",
    params: [{ name: "nums", type: "int[]" }],
    isDesign: false, helperClasses: [],
  },
  "task-scheduler": {
    slug: "task-scheduler", className: "Solution", methodName: "leastInterval",
    returnType: "int",
    params: [{ name: "tasks", type: "char[]" }, { name: "n", type: "int" }],
    isDesign: false, helperClasses: [],
  },

  // ─── HARD ───
  "regular-expression-matching": {
    slug: "regular-expression-matching", className: "Solution", methodName: "isMatch",
    returnType: "boolean",
    params: [{ name: "s", type: "String" }, { name: "p", type: "String" }],
    isDesign: false, helperClasses: [],
  },
  "edit-distance": {
    slug: "edit-distance", className: "Solution", methodName: "minDistance",
    returnType: "int",
    params: [{ name: "word1", type: "String" }, { name: "word2", type: "String" }],
    isDesign: false, helperClasses: [],
  },
  "alien-dictionary": {
    slug: "alien-dictionary", className: "Solution", methodName: "alienOrder",
    returnType: "String",
    params: [{ name: "words", type: "String[]" }],
    isDesign: false, helperClasses: [],
  },
  "word-ladder": {
    slug: "word-ladder", className: "Solution", methodName: "ladderLength",
    returnType: "int",
    params: [
      { name: "beginWord", type: "String" },
      { name: "endWord", type: "String" },
      { name: "wordList", type: "String[]" },
    ],
    isDesign: false, helperClasses: [],
  },
  "merge-k-sorted-lists": {
    slug: "merge-k-sorted-lists", className: "Solution", methodName: "mergeKLists",
    returnType: "ListNode",
    params: [{ name: "lists", type: "ListNode[]" }],
    isDesign: false, helperClasses: ["ListNode"],
  },
};

export function getProblemMetadata(slug: string): ProblemMetadata | undefined {
  return METADATA[slug];
}

export function getAllSlugs(): string[] {
  return Object.keys(METADATA);
}
