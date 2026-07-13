import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const q = s => '`' + s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\n/g, '\\n') + '`';

const sc = (py, java, cpp, c) =>
  `sc(\n    ${[py,java,cpp,c].map(s => q(s)).join(',\n    ')}\n  )`;

const tc = (input, expected, hidden = false) =>
  hidden
    ? `tc(${JSON.stringify(input)}, ${JSON.stringify(expected)}, true)`
    : `tc(${JSON.stringify(input)}, ${JSON.stringify(expected)})`;

// Problem metadata: [slug, title, difficulty, category, description]
const problemMeta = [
  // Easy
  ["two-sum","Two Sum","Easy","Arrays",
    "Given an array of integers `nums` and an integer `target`, return indices of the two numbers that add up to `target`.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice.\n\n**Example 1:**\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\n\n**Example 2:**\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]\n\n**Constraints:**\n- 2 ≤ nums.length ≤ 10⁴\n- -10⁹ ≤ nums[i] ≤ 10⁹\n- Only one valid answer exists."],
  ["best-time-to-buy-and-sell-stock","Best Time to Buy and Sell Stock","Easy","Arrays",
    "You are given an array `prices` where `prices[i]` is the price of a given stock on the i-th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve. If no profit is possible, return 0.\n\n**Example 1:**\nInput: prices = [7,1,5,3,6,4]\nOutput: 5\n\n**Example 2:**\nInput: prices = [7,6,4,3,1]\nOutput: 0\n\n**Constraints:**\n- 1 ≤ prices.length ≤ 10⁵\n- 0 ≤ prices[i] ≤ 10⁴"],
  ["plus-one","Plus One","Easy","Arrays",
    "You are given a large integer represented as an integer array `digits`, where each `digits[i]` is the i-th digit. The digits are ordered from most significant to least significant.\n\nIncrement the large integer by one and return the resulting array.\n\n**Example 1:**\nInput: digits = [1,2,3]\nOutput: [1,2,4]\n\n**Example 2:**\nInput: digits = [4,3,2,1]\nOutput: [4,3,2,2]\n\n**Constraints:**\n- 1 ≤ digits.length ≤ 100\n- 0 ≤ digits[i] ≤ 9"],
  ["single-number","Single Number","Easy","Arrays",
    "Given a non-empty array of integers `nums`, every element appears twice except for one. Find that single one.\n\nYou must implement a solution with linear runtime and constant extra space.\n\n**Example 1:**\nInput: nums = [2,2,1]\nOutput: 1\n\n**Example 2:**\nInput: nums = [4,1,2,1,2]\nOutput: 4\n\n**Constraints:**\n- 1 ≤ nums.length ≤ 3·10⁴\n- -3·10⁴ ≤ nums[i] ≤ 3·10⁴"],
  ["valid-anagram","Valid Anagram","Easy","Strings",
    "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn anagram is a word formed by rearranging the letters of another word.\n\n**Example 1:**\nInput: s = \"anagram\", t = \"nagaram\"\nOutput: true\n\n**Example 2:**\nInput: s = \"rat\", t = \"car\"\nOutput: false\n\n**Constraints:**\n- 1 ≤ s.length, t.length ≤ 5·10⁴\n- s and t consist of lowercase English letters"],
  ["contains-duplicate","Contains Duplicate","Easy","HashMap",
    "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and `false` if every element is distinct.\n\n**Example 1:**\nInput: nums = [1,2,3,1]\nOutput: true\n\n**Example 2:**\nInput: nums = [1,2,3,4]\nOutput: false\n\n**Constraints:**\n- 1 ≤ nums.length ≤ 10⁵\n- -10⁹ ≤ nums[i] ≤ 10⁹"],
  ["ransom-note","Ransom Note","Easy","HashMap",
    "Given two strings `ransomNote` and `magazine`, return `true` if `ransomNote` can be constructed by using the letters from `magazine`. Each letter in `magazine` can only be used once.\n\n**Example 1:**\nInput: ransomNote = \"a\", magazine = \"b\"\nOutput: false\n\n**Example 2:**\nInput: ransomNote = \"aa\", magazine = \"ab\"\nOutput: false\n\n**Constraints:**\n- 1 ≤ ransomNote.length, magazine.length ≤ 10⁵\n- Both strings consist of lowercase English letters"],
  ["word-pattern","Word Pattern","Easy","HashMap",
    "Given a `pattern` and a string `s`, find if `s` follows the same pattern. A bijection must exist between each letter in pattern and each word in s.\n\n**Example 1:**\nInput: pattern = \"abba\", s = \"dog cat cat dog\"\nOutput: true\n\n**Example 2:**\nInput: pattern = \"abba\", s = \"dog cat cat fish\"\nOutput: false\n\n**Constraints:**\n- 1 ≤ pattern.length ≤ 300\n- 1 ≤ s.length ≤ 3000\n- pattern and s contain only lowercase letters and spaces"],
  ["valid-palindrome","Valid Palindrome","Easy","Two Pointers",
    "A phrase is a palindrome if it reads the same forward and backward after converting all uppercase letters to lowercase and removing all non-alphanumeric characters.\n\n**Example 1:**\nInput: s = \"A man, a plan, a canal: Panama\"\nOutput: true\n\n**Example 2:**\nInput: s = \"race a car\"\nOutput: false\n\n**Constraints:**\n- 1 ≤ s.length ≤ 2·10⁵\n- s consists of printable ASCII characters"],
  ["move-zeroes","Move Zeroes","Easy","Two Pointers",
    "Given an integer array `nums`, move all 0's to the end while maintaining the relative order of non-zero elements. Do this in-place.\n\n**Example 1:**\nInput: nums = [0,1,0,3,12]\nOutput: [1,3,12,0,0]\n\n**Example 2:**\nInput: nums = [0]\nOutput: [0]\n\n**Constraints:**\n- 1 ≤ nums.length ≤ 10⁴"],
  ["remove-duplicates-from-sorted-array","Remove Duplicates from Sorted Array","Easy","Two Pointers",
    "Given a sorted array `nums`, remove duplicates in-place so each unique element appears once. Return the number of unique elements.\n\n**Example 1:**\nInput: nums = [1,1,2]\nOutput: 2\n\n**Example 2:**\nInput: nums = [0,0,1,1,1,2,2,3,3,4]\nOutput: 5\n\n**Constraints:**\n- 1 ≤ nums.length ≤ 3·10⁴\n- nums is sorted in non-decreasing order"],
  ["valid-parentheses","Valid Parentheses","Easy","Stack",
    "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid. Open brackets must be closed by the same type in the correct order.\n\n**Example 1:**\nInput: s = \"()\"\nOutput: true\n\n**Example 2:**\nInput: s = \"()[]{}\"\nOutput: true\n\n**Constraints:**\n- 1 ≤ s.length ≤ 10⁴\n- s consists of parentheses only '()[]{}'"],
  ["implement-queue-using-stacks","Implement Queue using Stacks","Easy","Stack",
    "Implement a FIFO queue using only two stacks. The queue should support `push`, `pop`, `peek`, and `empty`.\n\n**Example 1:**\nInput: push(1), push(2), peek(), pop(), empty()\nOutput: 1, 1, false\n\n**Constraints:**\n- 1 ≤ x ≤ 9\n- At most 100 calls will be made."],
  // Medium
  ["longest-substring-without-repeating-characters","Longest Substring Without Repeating Characters","Medium","Sliding Window",
    "Given a string `s`, find the length of the longest substring without repeating characters.\n\n**Example 1:**\nInput: s = \"abcabcbb\"\nOutput: 3\n\n**Example 2:**\nInput: s = \"bbbbb\"\nOutput: 1\n\n**Constraints:**\n- 0 ≤ s.length ≤ 5·10⁴"],
  ["3sum","3Sum","Medium","Two Pointers",
    "Given an integer array `nums`, return all unique triplets `[nums[i], nums[j], nums[k]]` such that i, j, k are distinct and sum to 0.\n\n**Example 1:**\nInput: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]\n\n**Example 2:**\nInput: nums = [0,1,1]\nOutput: []\n\n**Constraints:**\n- 3 ≤ nums.length ≤ 3000\n- -10⁵ ≤ nums[i] ≤ 10⁵"],
  ["add-two-numbers","Add Two Numbers","Medium","Linked List",
    "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order. Add the two numbers and return the sum as a linked list.\n\n**Example 1:**\nInput: l1 = [2,4,3], l2 = [5,6,4]\nOutput: [7,0,8]\n\n**Constraints:**\n- Number of nodes in each list is in [1, 100]\n- 0 ≤ Node.val ≤ 9"],
  ["reverse-linked-list","Reverse Linked List","Medium","Linked List",
    "Given the head of a singly linked list, reverse the list and return the reversed list.\n\n**Example 1:**\nInput: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]\n\n**Constraints:**\n- Number of nodes in [0, 5000]\n- -5000 ≤ Node.val ≤ 5000"],
  ["binary-tree-inorder-traversal","Binary Tree Inorder Traversal","Medium","Trees",
    "Given the root of a binary tree, return the inorder traversal of its nodes' values.\n\n**Example 1:**\nInput: root = [1,null,2,3]\nOutput: [1,3,2]\n\n**Constraints:**\n- Number of nodes in [0, 100]\n- -100 ≤ Node.val ≤ 100"],
  ["validate-binary-search-tree","Validate Binary Search Tree","Medium","BST",
    "Given the root of a binary tree, determine if it is a valid BST. A BST is valid if the left subtree contains only nodes with values less than the root, and the right subtree contains only values greater than the root.\n\n**Example 1:**\nInput: root = [2,1,3]\nOutput: true\n\n**Example 2:**\nInput: root = [5,1,4,null,null,3,6]\nOutput: false\n\n**Constraints:**\n- Number of nodes in [1, 10⁴]\n- -2³¹ ≤ Node.val ≤ 2³¹-1"],
  ["number-of-islands","Number of Islands","Medium","Graphs/DFS-BFS",
    "Given an m x n 2D binary grid `grid` containing '1's (land) and '0's (water), count the number of islands. An island is surrounded by water and formed by connecting adjacent lands horizontally or vertically.\n\n**Example 1:**\nInput: grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]\nOutput: 1\n\n**Constraints:**\n- m == grid.length, n == grid[i].length\n- 1 ≤ m, n ≤ 300"],
  ["clone-graph","Clone Graph","Medium","Graphs/DFS-BFS",
    "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node contains a value and a list of neighbors.\n\n**Example 1:**\nInput: adjList = [[2,4],[1,3],[2,4],[1,3]]\nOutput: [[2,4],[1,3],[2,4],[1,3]]\n\n**Constraints:**\n- Number of nodes in [0, 100]\n- 1 ≤ Node.val ≤ 100"],
  ["subsets","Subsets","Medium","Backtracking",
    "Given an integer array `nums` of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets.\n\n**Example 1:**\nInput: nums = [1,2,3]\nOutput: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]\n\n**Constraints:**\n- 1 ≤ nums.length ≤ 10\n- -10 ≤ nums[i] ≤ 10"],
  ["search-in-rotated-sorted-array","Search in Rotated Sorted Array","Medium","Binary Search",
    "There is a sorted array `nums` that is rotated at an unknown pivot. Given `target`, return its index if found, else -1. Must run in O(log n) time.\n\n**Example 1:**\nInput: nums = [4,5,6,7,0,1,2], target = 0\nOutput: 4\n\n**Constraints:**\n- 1 ≤ nums.length ≤ 5000\n- All values are unique"],
  ["jump-game","Jump Game","Medium","Greedy",
    "You are given an array `nums` where each element is your maximum jump length at that position. Return `true` if you can reach the last index starting from index 0.\n\n**Example 1:**\nInput: nums = [2,3,1,1,4]\nOutput: true\n\n**Example 2:**\nInput: nums = [3,2,1,0,4]\nOutput: false\n\n**Constraints:**\n- 1 ≤ nums.length ≤ 10⁴\n- 0 ≤ nums[i] ≤ 10⁵"],
  ["task-scheduler","Task Scheduler","Medium","Greedy",
    "Given a characters array `tasks` (letters A-Z) and an integer `n` representing the cooldown period between two same tasks, return the least number of CPU units to finish all tasks.\n\n**Example 1:**\nInput: tasks = [\"A\",\"A\",\"A\",\"B\",\"B\",\"B\"], n = 2\nOutput: 8\n\n**Constraints:**\n- 1 ≤ tasks.length ≤ 10⁴\n- 0 ≤ n ≤ 100"],
  // Hard
  ["regular-expression-matching","Regular Expression Matching","Hard","DP",
    "Implement regular expression matching with support for '.' (any single character) and '*' (zero or more of the preceding element). The matching must cover the entire input string.\n\n**Example 1:**\nInput: s = \"aa\", p = \"a\"\nOutput: false\n\n**Example 2:**\nInput: s = \"aa\", p = \"a*\"\nOutput: true\n\n**Constraints:**\n- 1 ≤ s.length, p.length ≤ 20"],
  ["edit-distance","Edit Distance","Hard","DP",
    "Given two strings `word1` and `word2`, return the minimum number of operations (insert, delete, replace) required to convert `word1` to `word2`.\n\n**Example 1:**\nInput: word1 = \"horse\", word2 = \"ros\"\nOutput: 3\n\n**Constraints:**\n- 0 ≤ word1.length, word2.length ≤ 500"],
  ["alien-dictionary","Alien Dictionary","Hard","Graphs",
    "Given a sorted dictionary of an alien language, find the order of characters. The input is an array of words sorted lexicographically according to the alien alphabet.\n\n**Example 1:**\nInput: words = [\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]\nOutput: \"wertf\"\n\n**Constraints:**\n- 1 ≤ words.length ≤ 100\n- 1 ≤ words[i].length ≤ 100"],
  ["word-ladder","Word Ladder","Hard","Graphs",
    "Given `beginWord`, `endWord`, and a dictionary `wordList`, return the length of the shortest transformation sequence from beginWord to endWord. Each transformation changes exactly one letter.\n\n**Example 1:**\nInput: beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]\nOutput: 5\n\n**Constraints:**\n- 1 ≤ beginWord.length ≤ 10\n- 1 ≤ wordList.length ≤ 5000"],
  ["merge-k-sorted-lists","Merge k Sorted Lists","Hard","Heap/PQ",
    "You are given an array of k linked-lists, each sorted in ascending order. Merge all the linked-lists into one sorted list and return its head.\n\n**Example 1:**\nInput: lists = [[1,4,5],[1,3,4],[2,6]]\nOutput: [1,1,2,3,4,4,5,6]\n\n**Constraints:**\n- k == lists.length\n- 0 ≤ k ≤ 10⁴\n- Each list is sorted in ascending order"],
];

// Starter code signatures for each problem (per language)
const sigMap = {
  // Easy
  "two-sum":                         ["twoSum(nums, target)", "two_sum(nums, target)", "public int[] twoSum(int[] nums, int target)", "vector<int> twoSum(vector<int>& nums, int target)", "twoSum(nums []int, target int) []int", "twoSum(nums: number[], target: number): number[]", "int* twoSum(int* nums, int numsSize, int target, int* returnSize)", "two_sum(nums: Vec<i32>, target: i32) -> Vec<i32>"],
  "best-time-to-buy-and-sell-stock": ["maxProfit(prices)", "max_profit(prices)", "public int maxProfit(int[] prices)", "int maxProfit(vector<int>& prices)", "maxProfit(prices []int) int", "maxProfit(prices: number[]): number", "int maxProfit(int* prices, int pricesSize)", "max_profit(prices: Vec<i32>) -> i32"],
  "plus-one":                        ["plusOne(digits)", "plus_one(digits)", "public int[] plusOne(int[] digits)", "vector<int> plusOne(vector<int>& digits)", "plusOne(digits []int) []int", "plusOne(digits: number[]): number[]", "int* plusOne(int* digits, int digitsSize, int* returnSize)", "plus_one(digits: Vec<i32>) -> Vec<i32>"],
  "single-number":                   ["singleNumber(nums)", "single_number(nums)", "public int singleNumber(int[] nums)", "int singleNumber(vector<int>& nums)", "singleNumber(nums []int) int", "singleNumber(nums: number[]): number", "int singleNumber(int* nums, int numsSize)", "single_number(nums: Vec<i32>) -> i32"],
  "valid-anagram":                   ["isAnagram(s, t)", "is_anagram(s, t)", "public boolean isAnagram(String s, String t)", "bool isAnagram(string s, string t)", "isAnagram(s string, t string) bool", "isAnagram(s: string, t: string): boolean", "bool isAnagram(char* s, char* t)", "is_anagram(s: String, t: String) -> bool"],
  "contains-duplicate":              ["containsDuplicate(nums)", "contains_duplicate(nums)", "public boolean containsDuplicate(int[] nums)", "bool containsDuplicate(vector<int>& nums)", "containsDuplicate(nums []int) bool", "containsDuplicate(nums: number[]): boolean", "bool containsDuplicate(int* nums, int numsSize)", "contains_duplicate(nums: Vec<i32>) -> bool"],
  "ransom-note":                     ["canConstruct(ransomNote, magazine)", "can_construct(ransom_note, magazine)", "public boolean canConstruct(String ransomNote, String magazine)", "bool canConstruct(string ransomNote, string magazine)", "canConstruct(ransomNote string, magazine string) bool", "canConstruct(ransomNote: string, magazine: string): boolean", "bool canConstruct(char* ransomNote, char* magazine)", "can_construct(ransom_note: String, magazine: String) -> bool"],
  "word-pattern":                    ["wordPattern(pattern, s)", "word_pattern(pattern, s)", "public boolean wordPattern(String pattern, String s)", "bool wordPattern(string pattern, string s)", "wordPattern(pattern string, s string) bool", "wordPattern(pattern: string, s: string): boolean", "bool wordPattern(char* pattern, char* s)", "word_pattern(pattern: String, s: String) -> bool"],
  "valid-palindrome":                ["isPalindrome(s)", "is_palindrome(s)", "public boolean isPalindrome(String s)", "bool isPalindrome(string s)", "isPalindrome(s string) bool", "isPalindrome(s: string): boolean", "bool isPalindrome(char* s)", "is_palindrome(s: String) -> bool"],
  "move-zeroes":                     ["moveZeroes(nums)", "move_zeroes(nums)", "public void moveZeroes(int[] nums)", "void moveZeroes(vector<int>& nums)", "moveZeroes(nums []int)", "moveZeroes(nums: number[]): void", "void moveZeroes(int* nums, int numsSize)", "move_zeroes(nums: &mut Vec<i32>)"],
  "remove-duplicates-from-sorted-array": ["removeDuplicates(nums)", "remove_duplicates(nums)", "public int removeDuplicates(int[] nums)", "int removeDuplicates(vector<int>& nums)", "removeDuplicates(nums []int) int", "removeDuplicates(nums: number[]): number", "int removeDuplicates(int* nums, int numsSize)", "remove_duplicates(nums: &mut Vec<i32>) -> i32"],
  "valid-parentheses":               ["isValid(s)", "is_valid(s)", "public boolean isValid(String s)", "bool isValid(string s)", "isValid(s string) bool", "isValid(s: string): boolean", "bool isValid(char* s)", "is_valid(s: String) -> bool"],
  "implement-queue-using-stacks":    ["MyQueue()", "MyQueue()", "public MyQueue()", "MyQueue()", "Constructor()", "constructor()", "myQueueCreate()", "new() -> Self"],
  // Medium
  "longest-substring-without-repeating-characters": ["lengthOfLongestSubstring(s)", "length_of_longest_substring(s)", "public int lengthOfLongestSubstring(String s)", "int lengthOfLongestSubstring(string s)", "lengthOfLongestSubstring(s string) int", "lengthOfLongestSubstring(s: string): number", "int lengthOfLongestSubstring(char* s)", "length_of_longest_substring(s: String) -> i32"],
  "3sum":                            ["threeSum(nums)", "three_sum(nums)", "public List<List<Integer>> threeSum(int[] nums)", "vector<vector<int>> threeSum(vector<int>& nums)", "threeSum(nums []int) [][]int", "threeSum(nums: number[]): number[][]", "int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes)", "three_sum(nums: Vec<i32>) -> Vec<Vec<i32>>"],
  "add-two-numbers":                 ["addTwoNumbers(l1, l2)", "add_two_numbers(l1, l2)", "public ListNode addTwoNumbers(ListNode l1, ListNode l2)", "ListNode* addTwoNumbers(ListNode* l1, ListNode* l2)", "addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode", "addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null", "struct ListNode* addTwoNumbers(struct ListNode* l1, struct ListNode* l2)", "add_two_numbers(l1: Option<Box<ListNode>>, l2: Option<Box<ListNode>>) -> Option<Box<ListNode>>"],
  "reverse-linked-list":             ["reverseList(head)", "reverse_list(head)", "public ListNode reverseList(ListNode head)", "ListNode* reverseList(ListNode* head)", "reverseList(head *ListNode) *ListNode", "reverseList(head: ListNode | null): ListNode | null", "struct ListNode* reverseList(struct ListNode* head)", "reverse_list(head: Option<Box<ListNode>>) -> Option<Box<ListNode>>"],
  "binary-tree-inorder-traversal":   ["inorderTraversal(root)", "inorder_traversal(root)", "public List<Integer> inorderTraversal(TreeNode root)", "vector<int> inorderTraversal(TreeNode* root)", "inorderTraversal(root *TreeNode) []int", "inorderTraversal(root: TreeNode | null): number[]", "int* inorderTraversal(struct TreeNode* root, int* returnSize)", "inorder_traversal(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<i32>"],
  "validate-binary-search-tree":     ["isValidBST(root)", "is_valid_bst(root)", "public boolean isValidBST(TreeNode root)", "bool isValidBST(TreeNode* root)", "isValidBST(root *TreeNode) bool", "isValidBST(root: TreeNode | null): boolean", "bool isValidBST(struct TreeNode* root)", "is_valid_bst(root: Option<Rc<RefCell<TreeNode>>>) -> bool"],
  "number-of-islands":               ["numIslands(grid)", "num_islands(grid)", "public int numIslands(char[][] grid)", "int numIslands(vector<vector<char>>& grid)", "numIslands(grid [][]byte) int", "numIslands(grid: string[][]): number", "int numIslands(char** grid, int gridSize, int* gridColSize)", "num_islands(grid: Vec<Vec<char>>) -> i32"],
  "clone-graph":                     ["cloneGraph(node)", "clone_graph(node)", "public Node cloneGraph(Node node)", "Node* cloneGraph(Node* node)", "cloneGraph(node *Node) *Node", "cloneGraph(node: Node | null): Node | null", "struct Node* cloneGraph(struct Node* node)", "clone_graph(node: Option<Rc<RefCell<Node>>>) -> Option<Rc<RefCell<Node>>>"],
  "subsets":                         ["subsets(nums)", "subsets(nums)", "public List<List<Integer>> subsets(int[] nums)", "vector<vector<int>> subsets(vector<int>& nums)", "subsets(nums []int) [][]int", "subsets(nums: number[]): number[][]", "int** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes)", "subsets(nums: Vec<i32>) -> Vec<Vec<i32>>"],
  "search-in-rotated-sorted-array":  ["search(nums, target)", "search(nums, target)", "public int search(int[] nums, int target)", "int search(vector<int>& nums, int target)", "search(nums []int, target int) int", "search(nums: number[], target: number): number", "int search(int* nums, int numsSize, int target)", "search(nums: Vec<i32>, target: i32) -> i32"],
  "jump-game":                       ["canJump(nums)", "can_jump(nums)", "public boolean canJump(int[] nums)", "bool canJump(vector<int>& nums)", "canJump(nums []int) bool", "canJump(nums: number[]): boolean", "bool canJump(int* nums, int numsSize)", "can_jump(nums: Vec<i32>) -> bool"],
  "task-scheduler":                  ["leastInterval(tasks, n)", "least_interval(tasks, n)", "public int leastInterval(char[] tasks, int n)", "int leastInterval(vector<char>& tasks, int n)", "leastInterval(tasks []byte, n int) int", "leastInterval(tasks: string[], n: number): number", "int leastInterval(char* tasks, int tasksSize, int n)", "least_interval(tasks: Vec<char>, n: i32) -> i32"],
  // Hard
  "regular-expression-matching":     ["isMatch(s, p)", "is_match(s, p)", "public boolean isMatch(String s, String p)", "bool isMatch(string s, string p)", "isMatch(s string, p string) bool", "isMatch(s: string, p: string): boolean", "bool isMatch(char* s, char* p)", "is_match(s: String, p: String) -> bool"],
  "edit-distance":                   ["minDistance(word1, word2)", "min_distance(word1, word2)", "public int minDistance(String word1, String word2)", "int minDistance(string word1, string word2)", "minDistance(word1 string, word2 string) int", "minDistance(word1: string, word2: string): number", "int minDistance(char* word1, char* word2)", "min_distance(word1: String, word2: String) -> i32"],
  "alien-dictionary":                ["alienOrder(words)", "alien_order(words)", "public String alienOrder(String[] words)", "string alienOrder(vector<string>& words)", "alienOrder(words []string) string", "alienOrder(words: string[]): string", "char* alienOrder(char** words, int wordsSize)", "alien_order(words: Vec<String>) -> String"],
  "word-ladder":                     ["ladderLength(beginWord, endWord, wordList)", "ladder_length(begin_word, end_word, word_list)", "public int ladderLength(String beginWord, String endWord, List<String> wordList)", "int ladderLength(string beginWord, string endWord, vector<string>& wordList)", "ladderLength(beginWord string, endWord string, wordList []string) int", "ladderLength(beginWord: string, endWord: string, wordList: string[]): number", "int ladderLength(char* beginWord, char* endWord, char** wordList, int wordListSize)", "ladder_length(begin_word: String, end_word: String, word_list: Vec<String>) -> i32"],
  "merge-k-sorted-lists":            ["mergeKLists(lists)", "merge_k_lists(lists)", "public ListNode mergeKLists(ListNode[] lists)", "ListNode* mergeKLists(vector<ListNode*>& lists)", "mergeKLists(lists []*ListNode) *ListNode", "mergeKLists(lists: (ListNode | null)[]): ListNode | null", "struct ListNode* mergeKLists(struct ListNode** lists, int listsSize)", "merge_k_lists(lists: Vec<Option<Box<ListNode>>>) -> Option<Box<ListNode>>"],
};

// Test cases for each problem
const testData = {
  "two-sum":                         [[{nums:[2,7,11,15],target:9},[0,1]],[{nums:[3,2,4],target:6},[1,2]],[{nums:[3,3],target:6},[0,1]],[{nums:[-3,4,3,90],target:0},[0,2],true],[{nums:[0,4,3,0],target:0},[0,3],true]],
  "best-time-to-buy-and-sell-stock": [[{prices:[7,1,5,3,6,4]},5],[{prices:[7,6,4,3,1]},0],[{prices:[1,2]},1],[{prices:[2,4,1]},2,true],[{prices:[1]},0,true]],
  "plus-one":                        [[{digits:[1,2,3]},[1,2,4]],[{digits:[4,3,2,1]},[4,3,2,2]],[{digits:[9]},[1,0]],[{digits:[9,9]},[1,0,0],true],[{digits:[0]},[1],true]],
  "single-number":                   [[{nums:[2,2,1]},1],[{nums:[4,1,2,1,2]},4],[{nums:[1]},1],[{nums:[-1,-1,-2]},-2,true],[{nums:[0,1,0,1,2]},2,true]],
  "valid-anagram":                   [[{s:"anagram",t:"nagaram"},true],[{s:"rat",t:"car"},false],[{s:"a",t:"a"},true,true],[{s:"a",t:"b"},false,true],[{s:"ab",t:"a"},false,true]],
  "contains-duplicate":              [[{nums:[1,2,3,1]},true],[{nums:[1,2,3,4]},false],[{nums:[1,1,1,3,3,4,3,2,4,2]},true],[{nums:[]},false,true],[{nums:[1]},false,true]],
  "ransom-note":                     [[{ransomNote:"a",magazine:"b"},false],[{ransomNote:"aa",magazine:"ab"},false],[{ransomNote:"aa",magazine:"aab"},true],[{ransomNote:"aab",magazine:"baa"},true,true],[{ransomNote:"abc",magazine:"ab"},false,true]],
  "word-pattern":                    [[{pattern:"abba",s:"dog cat cat dog"},true],[{pattern:"abba",s:"dog cat cat fish"},false],[{pattern:"aaaa",s:"dog cat cat dog"},false],[{pattern:"abba",s:"dog dog dog dog"},false,true],[{pattern:"abc",s:"dog cat dog"},false,true]],
  "valid-palindrome":                [[{s:"A man, a plan, a canal: Panama"},true],[{s:"race a car"},false],[{s:" "},true],[{s:".,"},true,true],[{s:"0P"},false,true]],
  "move-zeroes":                     [[{nums:[0,1,0,3,12]},[1,3,12,0,0]],[{nums:[0]},[0]],[{nums:[1,0]},[1,0]],[{nums:[0,0,1]},[1,0,0],true],[{nums:[1,2,3]},[1,2,3],true]],
  "remove-duplicates-from-sorted-array": [[{nums:[1,1,2]},2],[{nums:[0,0,1,1,1,2,2,3,3,4]},5],[{nums:[1,2,3]},3,true],[{nums:[1,1,1]},1,true],[{nums:[]},0,true]],
  "valid-parentheses":               [[{s:"()"},true],[{s:"()[]{}"},true],[{s:"(]"},false],[{s:"([)]"},false],[{s:"({[]})"},true,true],[{s:"("},false,true]],
  "implement-queue-using-stacks":    [[{ops:["MyQueue","push","push","peek","pop","empty"],args:[[],[1],[2],[],[],[]]},[null,null,null,1,1,false]],[{ops:["MyQueue","push","pop","empty"],args:[[],[1],[],[]]},[null,null,1,true],true],[{ops:["MyQueue","push","push","push","pop","pop","pop","empty"],args:[[],[1],[2],[3],[],[],[],[]]},[null,null,null,null,1,2,3,true],true]],
  "longest-substring-without-repeating-characters": [[{s:"abcabcbb"},3],[{s:"bbbbb"},1],[{s:"pwwkew"},3],[{s:""},0,true],[{s:"au"},2,true],[{s:"dvdf"},3,true]],
  "3sum":                            [[{nums:[-1,0,1,2,-1,-4]},[[-1,-1,2],[-1,0,1]]],[{nums:[0,1,1]},[]],[{nums:[0,0,0]},[[0,0,0]]],[{nums:[-2,0,0,2,2]},[[-2,0,2]],true],[{nums:[1,2,-2,-1]},[],true]],
  "add-two-numbers":                 [[{l1:[2,4,3],l2:[5,6,4]},[7,0,8]],[{l1:[0],l2:[0]},[0]],[{l1:[9,9,9,9,9,9,9],l2:[9,9,9,9]},[8,9,9,9,0,0,0,1]],[{l1:[1,8],l2:[0]},[1,8],true],[{l1:[5],l2:[5]},[0,1],true]],
  "reverse-linked-list":             [[{head:[1,2,3,4,5]},[5,4,3,2,1]],[{head:[1,2]},[2,1]],[{head:[]},[]],[{head:[1]},[1],true],[{head:[1,2,3]},[3,2,1],true]],
  "binary-tree-inorder-traversal":   [[{root:[1,null,2,3]},[1,3,2]],[{root:[]},[]],[{root:[1]},[1]],[{root:[1,2]},[2,1],true],[{root:[1,null,3,2]},[1,2,3],true]],
  "validate-binary-search-tree":     [[{root:[2,1,3]},true],[{root:[5,1,4,null,null,3,6]},false],[{root:[1]},true],[{root:[2,2,2]},false,true],[{root:[5,4,6,null,null,3,7]},false,true]],
  "number-of-islands":               [[{grid:[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]},1],[{grid:[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]},3],[{grid:[["1"]]},1],[{grid:[["0"]]},0,true],[{grid:[["1","0","1"],["0","1","0"]]},3,true]],
  "clone-graph":                     [[{adjList:[[2,4],[1,3],[2,4],[1,3]]},[[2,4],[1,3],[2,4],[1,3]]],[{adjList:[[]]},[[]]],[{adjList:[]},[]],[{adjList:[[2],[1]]},[[2],[1]],true]],
  "subsets":                         [[{nums:[1,2,3]},[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]],[{nums:[0]},[[],[0]]],[{nums:[1]},[[],[1]]],[{nums:[1,2]},[[],[1],[2],[1,2]],true]],
  "search-in-rotated-sorted-array":  [[{nums:[4,5,6,7,0,1,2],target:0},4],[{nums:[4,5,6,7,0,1,2],target:3},-1],[{nums:[1],target:0},-1],[{nums:[1,3],target:3},1,true],[{nums:[5,1,3],target:5},0,true],[{nums:[3,1],target:1},1,true]],
  "jump-game":                       [[{nums:[2,3,1,1,4]},true],[{nums:[3,2,1,0,4]},false],[{nums:[0]},true],[{nums:[2,0,0]},true,true],[{nums:[1,0,1,0]},false,true]],
  "task-scheduler":                  [[{tasks:["A","A","A","B","B","B"],n:2},8],[{tasks:["A","C","A","B","D","B"],n:1},6],[{tasks:["A","A","A","B","B","B"],n:0},6],[{tasks:["A","A","A","A","A","A"],n:2},16,true],[{tasks:["A","B","C","D","E","F"],n:2},6,true]],
  "regular-expression-matching":     [[{s:"aa",p:"a"},false],[{s:"aa",p:"a*"},true],[{s:"ab",p:".*"},true],[{s:"aab",p:"c*a*b"},true,true],[{s:"mississippi",p:"mis*is*p*."},false,true],[{s:"ab",p:".*c"},false,true],[{s:"aaa",p:"a*a"},true,true],[{s:"",p:".*"},true,true]],
  "edit-distance":                   [[{word1:"horse",word2:"ros"},3],[{word1:"intention",word2:"execution"},5],[{word1:"",word2:"a"},1],[{word1:"a",word2:"a"},0,true],[{word1:"abc",word2:"abc"},0,true],[{word1:"ab",word2:"bc"},2,true]],
  "alien-dictionary":                [[{words:["wrt","wrf","er","ett","rftt"]},"wertf"],[{words:["z","x"]},"zx"],[{words:["z","x","z"]},""],[{words:["a","b","c"]},"abc",true],[{words:["ab","adc"]},"abcd",true]],
  "word-ladder":                     [[{beginWord:"hit",endWord:"cog",wordList:["hot","dot","dog","lot","log","cog"]},5],[{beginWord:"hit",endWord:"cog",wordList:["hot","dot","dog","lot","log"]},0],[{beginWord:"a",endWord:"c",wordList:["a","b","c"]},2],[{beginWord:"hot",endWord:"dog",wordList:["hot","dog"]},0,true],[{beginWord:"hot",endWord:"hot",wordList:["hot"]},1,true]],
  "merge-k-sorted-lists":            [[{lists:[[1,4,5],[1,3,4],[2,6]]},[1,1,2,3,4,4,5,6]],[{lists:[]},[]],[{lists:[[]]},[]],[{lists:[[1]]},[1],true],[{lists:[[1,2],[3,4],[5]]},[1,2,3,4,5],true]],
};

// Generate seed.ts
const header = `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sc = (py: string, java: string, cpp: string, c: string) => ({
  python: py.trim(),
  java: java.trim(),
  cpp: cpp.trim(),
  c: c.trim(),
});

const tc = (input: unknown, expected: unknown, hidden = false) => ({
  input: JSON.stringify(input),
  expectedOutput: JSON.stringify(expected),
  isHidden: hidden,
});

const problems: Array<{
  slug: string; title: string; difficulty: string; category: string;
  description: string; constraints: string; examples: any[]; tags: string[]; companies: string[];
  hints: string[]; editorial: string; complexity: any; acceptanceRate: number; submissionCount: number;
  isPublished: boolean; starterCode: Record<string, string>;
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
}> = [
`;

const footer = [
  '];',
  '',
  'async function main() {',
  '  console.log("Seeding database...");',
  '',
  '  // Clear existing problems (cascades to test cases)',
  '  await prisma.testCase.deleteMany();',
  '  await prisma.problem.deleteMany();',
  '  console.log("  Cleared existing problems.\\n");',
  '',
  '  for (const problem of problems) {',
  '    const { testCases, ...problemData } = problem;',
  '    const created = await prisma.problem.create({',
  '      data: {',
  '        ...problemData,',
  '        testCases: {',
  '          create: testCases.map(tc => ({',
  '            input: tc.input,',
  '            expectedOutput: tc.expectedOutput,',
  '            isHidden: tc.isHidden,',
  '          })),',
  '        },',
  '      },',
  '    });',
  '    console.log("  Created: " + created.title + " (" + created.difficulty + ")");',
  '  }',
  '',
  '  console.log("\\nSeeded " + problems.length + " problems.");',
  '}',
  '',
  'main()',
  '  .catch((e) => {',
  '    console.error(e);',
  '    process.exit(1);',
  '  })',
  '  .finally(() => prisma.$disconnect());',
].join('\n');

// sigMap order: [js(0), py(1), java(2), cpp(3), go(4), ts(5), c(6), rust(7)]
function genProblem(p) {
  const [slug, title, difficulty, category, description, ...extras] = p;
  const constraints = extras[0] || description.split('\n**Constraints:**\n')[1] || '';
  const tags = extras[1] || [];
  const companies = extras[2] || [];
  const hints = extras[3] || [];
  const editorial = extras[4] || '';
  const complexity = extras[5] || { time: '', space: '' };

  const sigs = sigMap[slug];
  const tests = testData[slug];

  const pySig = sigs[1];
  const javaMethod = sigs[2];
  const cppMethod = sigs[3];
  const cSig = sigs[6];

  // Python stub
  const pyStub = `def ${pySig}:\n    # TODO: implement\n    pass`;

  // Java stub — detect return type from the full signature (may start with 'public ')
  const jm = javaMethod; // e.g. "public int[] twoSum(int[] nums, int target)"
  const jmBody = jm.replace('public ', '');
  const javaRet =
    /^int\[\]/.test(jmBody) ? 'return new int[0]' :
    /^int\b/.test(jmBody) ? 'return 0' :
    /^boolean/.test(jmBody) ? 'return false' :
    /^void/.test(jmBody) ? '' :
    /^char\[\]/.test(jmBody) || /^String\[\]/.test(jmBody) ? 'return null' :
    /^char\b/.test(jmBody) ? 'return \'\\0\'' :
    /^String\b/.test(jmBody) ? 'return ""' :
    /^List/.test(jmBody) ? 'return new ArrayList<>()' :
    /^ListNode/.test(jmBody) ? 'return null' :
    /^TreeNode/.test(jmBody) ? 'return null' :
    /^double/.test(jmBody) ? 'return 0.0' :
    'return 0';
  const javaStub = `class Solution {\n  ${javaMethod} {\n    // TODO: implement\n    ${javaRet};\n  }\n}`;

  // C++ stub
  const cppType =
    /^int\b/.test(cppMethod) ? 'int' :
    /^bool\b/.test(cppMethod) ? 'bool' :
    /^string\b/.test(cppMethod) ? 'string' :
    /^vector/.test(cppMethod) ? 'vector' :
    /^ListNode/.test(cppMethod) || /^TreeNode/.test(cppMethod) || /^Node/.test(cppMethod) ? 'ptr' :
    /^void/.test(cppMethod) ? 'void' :
    /^char\b/.test(cppMethod) ? 'char' :
    /^double\b/.test(cppMethod) ? 'double' :
    'auto';
  const cppRet =
    cppType === 'int' ? 'return 0' :
    cppType === 'bool' ? 'return false' :
    cppType === 'string' ? 'return ""' :
    cppType === 'vector' ? 'return {}' :
    cppType === 'ptr' ? 'return nullptr' :
    cppType === 'void' ? '' :
    cppType === 'char' ? 'return \'\\0\'' :
    cppType === 'double' ? 'return 0.0' :
    'return {}';
  const cppStub = `class Solution {\npublic:\n  ${cppMethod} {\n    // TODO: implement\n    ${cppRet};\n  }\n};`;

  // C stub
  const cRet =
    /^int\b(?!\*)/.test(cSig) ? 'return 0' :
    /^int\*/.test(cSig) ? 'return NULL' :
    /^char\*/.test(cSig) ? 'return NULL' :
    /^bool\b/.test(cSig) ? 'return false' :
    /^void/.test(cSig) ? '' :
    /^char\b/.test(cSig) ? 'return \'\\0\'' :
    /^double\b/.test(cSig) ? 'return 0.0' :
    /^struct ListNode/.test(cSig) ? 'return NULL' :
    /^struct TreeNode/.test(cSig) ? 'return NULL' :
    'return 0';
  const cStub = `${cSig} {\n  // TODO: implement\n  ${cRet};\n}`;

  return `  {
    slug: ${q(slug)},
    title: ${q(title)},
    difficulty: ${q(difficulty)},
    category: ${q(category)},
    description: ${q(description)},
    constraints: ${q(constraints)},
    examples: [],
    tags: ${JSON.stringify(tags)},
    companies: ${JSON.stringify(companies)},
    hints: ${JSON.stringify(hints)},
    editorial: ${q(editorial)},
    complexity: ${JSON.stringify(complexity)},
    acceptanceRate: 0,
    submissionCount: 0,
    isPublished: true,
    starterCode: sc(
      ${q(pyStub)},
      ${q(javaStub)},
      ${q(cppStub)},
      ${q(cStub)},
    ),
    testCases: [
      ${tests.map(t => tc(t[0], t[1], t[2])).join(',\n      ')},
    ],
  },`;
}

const body = problemMeta.map(p => genProblem(p)).join('\n');

const result = header + body + '\n' + footer;

fs.writeFileSync(path.join(__dirname, 'seed.ts'), result);
console.log(`Generated seed.ts with ${problemMeta.length} problems`);
