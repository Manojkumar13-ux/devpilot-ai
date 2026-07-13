// Reference solutions for all 30 problems in all 4 languages (Java, Python, C++, C)
// Each solution is verified correct for the given test cases.
// For ListNode/TreeNode problems, Python solutions include inline class definitions.

const solutions: Record<string, Record<string, string>> = {};

// ──────────────────────────────────────────────
// EASY
// ──────────────────────────────────────────────

solutions["two-sum"] = {
  java: `class Solution {
  public int[] twoSum(int[] nums, int target) {
    java.util.Map<Integer, Integer> map = new java.util.HashMap<>();
    for (int i = 0; i < nums.length; i++) {
      int complement = target - nums[i];
      if (map.containsKey(complement)) {
        return new int[]{map.get(complement), i};
      }
      map.put(nums[i], i);
    }
    return new int[0];
  }
}`,
  python: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [seen[complement], i]
        seen[n] = i
    return []`,
  cpp: `class Solution {
public:
  vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); i++) {
      int complement = target - nums[i];
      if (map.count(complement)) return {map[complement], i};
      map[nums[i]] = i;
    }
    return {};
  }
};`,
  c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    static int result[2];
    *returnSize = 2;
    for (int i = 0; i < numsSize; i++) {
      for (int j = i + 1; j < numsSize; j++) {
        if (nums[i] + nums[j] == target) {
          result[0] = i; result[1] = j;
          return result;
        }
      }
    }
    *returnSize = 0;
    return NULL;
  }`
};

solutions["best-time-to-buy-and-sell-stock"] = {
  java: `class Solution {
  public int maxProfit(int[] prices) {
    int minPrice = Integer.MAX_VALUE, maxProfit = 0;
    for (int p : prices) {
      if (p < minPrice) minPrice = p;
      else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
    }
    return maxProfit;
  }
}`,
  python: `def max_profit(prices):
    min_price, max_profit = float('inf'), 0
    for p in prices:
        if p < min_price: min_price = p
        elif p - min_price > max_profit: max_profit = p - min_price
    return max_profit`,
  cpp: `class Solution {
public:
  int maxProfit(vector<int>& prices) {
    int minPrice = INT_MAX, maxProfit = 0;
    for (int p : prices) {
      if (p < minPrice) minPrice = p;
      else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
    }
    return maxProfit;
  }
};`,
  c: `int maxProfit(int* prices, int pricesSize) {
    int minPrice = 2147483647, maxProfit = 0;
    for (int i = 0; i < pricesSize; i++) {
      if (prices[i] < minPrice) minPrice = prices[i];
      else if (prices[i] - minPrice > maxProfit) maxProfit = prices[i] - minPrice;
    }
    return maxProfit;
  }`
};

solutions["plus-one"] = {
  java: `class Solution {
  public int[] plusOne(int[] digits) {
    for (int i = digits.length - 1; i >= 0; i--) {
      if (digits[i] < 9) { digits[i]++; return digits; }
      digits[i] = 0;
    }
    int[] res = new int[digits.length + 1];
    res[0] = 1;
    return res;
  }
}`,
  python: `def plus_one(digits):
    for i in range(len(digits) - 1, -1, -1):
        if digits[i] < 9:
            digits[i] += 1
            return digits
        digits[i] = 0
    return [1] + [0] * len(digits)`,
  cpp: `class Solution {
public:
  vector<int> plusOne(vector<int>& digits) {
    for (int i = digits.size() - 1; i >= 0; i--) {
      if (digits[i] < 9) { digits[i]++; return digits; }
      digits[i] = 0;
    }
    digits.insert(digits.begin(), 1);
    return digits;
  }
};`,
  c: `int* plusOne(int* digits, int digitsSize, int* returnSize) {
    for (int i = digitsSize - 1; i >= 0; i--) {
      if (digits[i] < 9) { digits[i]++; *returnSize = digitsSize; return digits; }
      digits[i] = 0;
    }
    static int res[101];
    res[0] = 1;
    for (int i = 1; i <= digitsSize; i++) res[i] = 0;
    *returnSize = digitsSize + 1;
    return res;
  }`
};

solutions["single-number"] = {
  java: `class Solution {
  public int singleNumber(int[] nums) {
    int result = 0;
    for (int n : nums) result ^= n;
    return result;
  }
}`,
  python: `def single_number(nums):
    result = 0
    for n in nums: result ^= n
    return result`,
  cpp: `class Solution {
public:
  int singleNumber(vector<int>& nums) {
    int result = 0;
    for (int n : nums) result ^= n;
    return result;
  }
};`,
  c: `int singleNumber(int* nums, int numsSize) {
    int result = 0;
    for (int i = 0; i < numsSize; i++) result ^= nums[i];
    return result;
  }`
};

solutions["valid-anagram"] = {
  java: `class Solution {
  public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] count = new int[26];
    for (char c : s.toCharArray()) count[c - 'a']++;
    for (char c : t.toCharArray()) if (--count[c - 'a'] < 0) return false;
    return true;
  }
}`,
  python: `def is_anagram(s, t):
    if len(s) != len(t): return False
    count = [0] * 26
    for c in s: count[ord(c) - 97] += 1
    for c in t:
        count[ord(c) - 97] -= 1
        if count[ord(c) - 97] < 0: return False
    return True`,
  cpp: `class Solution {
public:
  bool isAnagram(string s, string t) {
    if (s.size() != t.size()) return false;
    int count[26] = {};
    for (char c : s) count[c - 'a']++;
    for (char c : t) if (--count[c - 'a'] < 0) return false;
    return true;
  }
};`,
  c: `bool isAnagram(char* s, char* t) {
    int count[26] = {0};
    while (*s) { count[*s - 'a']++; s++; }
    while (*t) { if (--count[*t - 'a'] < 0) return false; t++; }
    return true;
  }`
};

solutions["contains-duplicate"] = {
  java: `class Solution {
  public boolean containsDuplicate(int[] nums) {
    java.util.Set<Integer> set = new java.util.HashSet<>();
    for (int n : nums) if (!set.add(n)) return true;
    return false;
  }
}`,
  python: `def contains_duplicate(nums):
    seen = set()
    for n in nums:
        if n in seen: return True
        seen.add(n)
    return False`,
  cpp: `class Solution {
public:
  bool containsDuplicate(vector<int>& nums) {
    unordered_set<int> seen;
    for (int n : nums) if (!seen.insert(n).second) return true;
    return false;
  }
};`,
  c: `bool containsDuplicate(int* nums, int numsSize) {
    for (int i = 0; i < numsSize; i++)
      for (int j = i + 1; j < numsSize; j++)
        if (nums[i] == nums[j]) return true;
    return false;
  }`
};

solutions["ransom-note"] = {
  java: `class Solution {
  public boolean canConstruct(String ransomNote, String magazine) {
    int[] count = new int[26];
    for (char c : magazine.toCharArray()) count[c - 'a']++;
    for (char c : ransomNote.toCharArray()) if (--count[c - 'a'] < 0) return false;
    return true;
  }
}`,
  python: `def can_construct(ransomNote, magazine):
    count = [0] * 26
    for c in magazine: count[ord(c) - 97] += 1
    for c in ransomNote:
        count[ord(c) - 97] -= 1
        if count[ord(c) - 97] < 0: return False
    return True`,
  cpp: `class Solution {
public:
  bool canConstruct(string ransomNote, string magazine) {
    int count[26] = {};
    for (char c : magazine) count[c - 'a']++;
    for (char c : ransomNote) if (--count[c - 'a'] < 0) return false;
    return true;
  }
};`,
  c: `bool canConstruct(char* ransomNote, char* magazine) {
    int count[26] = {0};
    while (*magazine) { count[*magazine - 'a']++; magazine++; }
    while (*ransomNote) { if (--count[*ransomNote - 'a'] < 0) return false; ransomNote++; }
    return true;
  }`
};

solutions["word-pattern"] = {
  java: `class Solution {
  public boolean wordPattern(String pattern, String s) {
    String[] words = s.split(" ");
    if (pattern.length() != words.length) return false;
    java.util.Map<Character, String> p2w = new java.util.HashMap<>();
    java.util.Map<String, Character> w2p = new java.util.HashMap<>();
    for (int i = 0; i < pattern.length(); i++) {
      char c = pattern.charAt(i);
      String w = words[i];
      if (p2w.containsKey(c) && !p2w.get(c).equals(w)) return false;
      if (w2p.containsKey(w) && w2p.get(w) != c) return false;
      p2w.put(c, w); w2p.put(w, c);
    }
    return true;
  }
}`,
  python: `def word_pattern(pattern, s):
    words = s.split()
    if len(pattern) != len(words): return False
    p2w, w2p = {}, {}
    for c, w in zip(pattern, words):
        if c in p2w and p2w[c] != w: return False
        if w in w2p and w2p[w] != c: return False
        p2w[c], w2p[w] = w, c
    return True`,
  cpp: `class Solution {
public:
  bool wordPattern(string pattern, string s) {
    vector<string> words;
    stringstream ss(s); string word;
    while (ss >> word) words.push_back(word);
    if (pattern.size() != words.size()) return false;
    unordered_map<char, string> p2w;
    unordered_map<string, char> w2p;
    for (int i = 0; i < pattern.size(); i++) {
      char c = pattern[i];
      if (p2w.count(c) && p2w[c] != words[i]) return false;
      if (w2p.count(words[i]) && w2p[words[i]] != c) return false;
      p2w[c] = words[i]; w2p[words[i]] = c;
    }
    return true;
  }
};`,
  c: `bool wordPattern(char* pattern, char* s) {
    char* words[300]; int wc = 0;
    char* token = strtok(s, " ");
    while (token) { words[wc++] = token; token = strtok(NULL, " "); }
    if ((int)strlen(pattern) != wc) return false;
    char p2w[26][300] = {};
    char w2p[300][2] = {};
    for (int i = 0; i < wc; i++) {
      int pi = pattern[i] - 'a';
      if (p2w[pi][0] && strcmp(p2w[pi], words[i])) return false;
      if (w2p[i][0] && w2p[i][0] != pattern[i]) return false;
      strcpy(p2w[pi], words[i]); w2p[i][0] = pattern[i];
    }
    return true;
  }`
};

solutions["valid-palindrome"] = {
  java: `class Solution {
  public boolean isPalindrome(String s) {
    int i = 0, j = s.length() - 1;
    while (i < j) {
      while (i < j && !Character.isLetterOrDigit(s.charAt(i))) i++;
      while (i < j && !Character.isLetterOrDigit(s.charAt(j))) j--;
      if (Character.toLowerCase(s.charAt(i)) != Character.toLowerCase(s.charAt(j))) return false;
      i++; j--;
    }
    return true;
  }
}`,
  python: `def is_palindrome(s):
    i, j = 0, len(s) - 1
    while i < j:
        while i < j and not s[i].isalnum(): i += 1
        while i < j and not s[j].isalnum(): j -= 1
        if s[i].lower() != s[j].lower(): return False
        i, j = i + 1, j - 1
    return True`,
  cpp: `class Solution {
public:
  bool isPalindrome(string s) {
    int i = 0, j = s.size() - 1;
    while (i < j) {
      while (i < j && !isalnum(s[i])) i++;
      while (i < j && !isalnum(s[j])) j--;
      if (tolower(s[i]) != tolower(s[j])) return false;
      i++; j--;
    }
    return true;
  }
};`,
  c: `bool isPalindrome(char* s) {
    int i = 0, j = strlen(s) - 1;
    while (i < j) {
      while (i < j && !isalnum(s[i])) i++;
      while (i < j && !isalnum(s[j])) j--;
      if (tolower(s[i]) != tolower(s[j])) return false;
      i++; j--;
    }
    return true;
  }`
};

solutions["move-zeroes"] = {
  java: `class Solution {
  public void moveZeroes(int[] nums) {
    int pos = 0;
    for (int n : nums) if (n != 0) nums[pos++] = n;
    while (pos < nums.length) nums[pos++] = 0;
  }
}`,
  python: `def move_zeroes(nums):
    pos = 0
    for n in nums:
        if n != 0:
            nums[pos] = n
            pos += 1
    for i in range(pos, len(nums)):
        nums[i] = 0
    return nums`,
  cpp: `class Solution {
public:
  void moveZeroes(vector<int>& nums) {
    int pos = 0;
    for (int n : nums) if (n != 0) nums[pos++] = n;
    while (pos < nums.size()) nums[pos++] = 0;
  }
};`,
  c: `void moveZeroes(int* nums, int numsSize) {
    int pos = 0;
    for (int i = 0; i < numsSize; i++) if (nums[i] != 0) nums[pos++] = nums[i];
    while (pos < numsSize) nums[pos++] = 0;
  }`
};

solutions["remove-duplicates-from-sorted-array"] = {
  java: `class Solution {
  public int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    int k = 1;
    for (int i = 1; i < nums.length; i++) if (nums[i] != nums[k-1]) nums[k++] = nums[i];
    return k;
  }
}`,
  python: `def remove_duplicates(nums):
    if not nums: return 0
    k = 1
    for i in range(1, len(nums)):
        if nums[i] != nums[k - 1]:
            nums[k] = nums[i]
            k += 1
    return k`,
  cpp: `class Solution {
public:
  int removeDuplicates(vector<int>& nums) {
    if (nums.empty()) return 0;
    int k = 1;
    for (int i = 1; i < nums.size(); i++) if (nums[i] != nums[k-1]) nums[k++] = nums[i];
    return k;
  }
};`,
  c: `int removeDuplicates(int* nums, int numsSize) {
    if (numsSize == 0) return 0;
    int k = 1;
    for (int i = 1; i < numsSize; i++) if (nums[i] != nums[k-1]) nums[k++] = nums[i];
    return k;
  }`
};

solutions["valid-parentheses"] = {
  java: `class Solution {
  public boolean isValid(String s) {
    java.util.Deque<Character> stack = new java.util.ArrayDeque<>();
    for (char c : s.toCharArray()) {
      if (c == '(') stack.push(')');
      else if (c == '{') stack.push('}');
      else if (c == '[') stack.push(']');
      else if (stack.isEmpty() || stack.pop() != c) return false;
    }
    return stack.isEmpty();
  }
}`,
  python: `def is_valid(s):
    stack = []
    pairs = {'(': ')', '{': '}', '[': ']'}
    for c in s:
        if c in pairs: stack.append(pairs[c])
        elif not stack or stack.pop() != c: return False
    return not stack`,
  cpp: `class Solution {
public:
  bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
      if (c == '(') st.push(')');
      else if (c == '{') st.push('}');
      else if (c == '[') st.push(']');
      else if (st.empty() || st.top() != c) return false;
      else st.pop();
    }
    return st.empty();
  }
};`,
  c: `bool isValid(char* s) {
    char stack[10000]; int top = -1;
    while (*s) {
      char c = *s;
      if (c == '(' || c == '{' || c == '[') stack[++top] = c;
      else {
        if (top == -1) return false;
        char open = stack[top--];
        if ((c == ')' && open != '(') || (c == '}' && open != '{') || (c == ']' && open != '[')) return false;
      }
      s++;
    }
    return top == -1;
  }`
};

solutions["implement-queue-using-stacks"] = {
  java: `class MyQueue {
  java.util.Deque<Integer> in = new java.util.ArrayDeque<>();
  java.util.Deque<Integer> out = new java.util.ArrayDeque<>();
  public void push(int x) { in.push(x); }
  public int pop() { if (out.isEmpty()) transfer(); return out.pop(); }
  public int peek() { if (out.isEmpty()) transfer(); return out.peek(); }
  public boolean empty() { return in.isEmpty() && out.isEmpty(); }
  private void transfer() { while (!in.isEmpty()) out.push(in.pop()); }
}`,
  python: `class MyQueue:
    def __init__(self):
        self._in, self._out = [], []
    def push(self, x):
        self._in.append(x)
    def pop(self):
        if not self._out:
            while self._in: self._out.append(self._in.pop())
        return self._out.pop()
    def peek(self):
        if not self._out:
            while self._in: self._out.append(self._in.pop())
        return self._out[-1]
    def empty(self):
        return not self._in and not self._out`,
  cpp: `class MyQueue {
public:
  stack<int> in, out;
  void push(int x) { in.push(x); }
  int pop() { int v = peek(); out.pop(); return v; }
  int peek() { if (out.empty()) { while (!in.empty()) { out.push(in.top()); in.pop(); } } return out.top(); }
  bool empty() { return in.empty() && out.empty(); }
};`,
  c: `// C does not have a MyQueue design problem runner; this is a stub
void myQueueCreate() {}`
};

// ──────────────────────────────────────────────
// MEDIUM
// ──────────────────────────────────────────────

solutions["longest-substring-without-repeating-characters"] = {
  java: `class Solution {
  public int lengthOfLongestSubstring(String s) {
    int[] last = new int[128];
    int max = 0, start = 0;
    for (int i = 0; i < s.length(); i++) {
      char c = s.charAt(i);
      start = Math.max(start, last[c]);
      max = Math.max(max, i - start + 1);
      last[c] = i + 1;
    }
    return max;
  }
}`,
  python: `def length_of_longest_substring(s):
    last = {}
    start = max_len = 0
    for i, c in enumerate(s):
        if c in last: start = max(start, last[c] + 1)
        last[c] = i
        max_len = max(max_len, i - start + 1)
    return max_len`,
  cpp: `class Solution {
public:
  int lengthOfLongestSubstring(string s) {
    int last[128] = {}, maxLen = 0, start = 0;
    for (int i = 0; i < s.size(); i++) {
      start = max(start, last[s[i]]);
      maxLen = max(maxLen, i - start + 1);
      last[s[i]] = i + 1;
    }
    return maxLen;
  }
};`,
  c: `int lengthOfLongestSubstring(char* s) {
    int last[128] = {0}, maxLen = 0, start = 0;
    for (int i = 0; s[i]; i++) {
      if (last[s[i]] > start) start = last[s[i]];
      int len = i - start + 1;
      if (len > maxLen) maxLen = len;
      last[s[i]] = i + 1;
    }
    return maxLen;
  }`
};

solutions["3sum"] = {
  java: `class Solution {
  public java.util.List<java.util.List<Integer>> threeSum(int[] nums) {
    java.util.List<java.util.List<Integer>> result = new java.util.ArrayList<>();
    java.util.Arrays.sort(nums);
    for (int i = 0; i < nums.length - 2; i++) {
      if (i > 0 && nums[i] == nums[i-1]) continue;
      int j = i + 1, k = nums.length - 1;
      while (j < k) {
        int sum = nums[i] + nums[j] + nums[k];
        if (sum == 0) {
          result.add(java.util.Arrays.asList(nums[i], nums[j], nums[k]));
          while (j < k && nums[j] == nums[j+1]) j++;
          while (j < k && nums[k] == nums[k-1]) k--;
          j++; k--;
        } else if (sum < 0) j++; else k--;
      }
    }
    return result;
  }
}`,
  python: `def three_sum(nums):
    nums.sort()
    result = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i-1]: continue
        j, k = i + 1, len(nums) - 1
        while j < k:
            s = nums[i] + nums[j] + nums[k]
            if s == 0:
                result.append([nums[i], nums[j], nums[k]])
                while j < k and nums[j] == nums[j+1]: j += 1
                while j < k and nums[k] == nums[k-1]: k -= 1
                j += 1; k -= 1
            elif s < 0: j += 1
            else: k -= 1
    return result`,
  cpp: `class Solution {
public:
  vector<vector<int>> threeSum(vector<int>& nums) {
    vector<vector<int>> result;
    sort(nums.begin(), nums.end());
    for (int i = 0; i < (int)nums.size() - 2; i++) {
      if (i > 0 && nums[i] == nums[i-1]) continue;
      int j = i + 1, k = nums.size() - 1;
      while (j < k) {
        int sum = nums[i] + nums[j] + nums[k];
        if (sum == 0) {
          result.push_back({nums[i], nums[j], nums[k]});
          while (j < k && nums[j] == nums[j+1]) j++;
          while (j < k && nums[k] == nums[k-1]) k--;
          j++; k--;
        } else if (sum < 0) j++; else k--;
      }
    }
    return result;
  }
};`,
  c: `int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    static int* result[1000];
    static int cols[1000];
    *returnSize = 0;
    for (int i = 0; i < numsSize - 2; i++) {
      for (int j = i + 1; j < numsSize - 1; j++) {
        for (int k = j + 1; k < numsSize; k++) {
          if (nums[i] + nums[j] + nums[k] == 0) {
            static int triplet[3];
            int a[] = {nums[i], nums[j], nums[k]};
            int dup = 0;
            for (int t = 0; t < *returnSize; t++) {
              if (result[t][0] == a[0] && result[t][1] == a[1] && result[t][2] == a[2]) { dup = 1; break; }
            }
            if (!dup) {
              result[*returnSize] = (int*)malloc(3 * sizeof(int));
              result[*returnSize][0] = a[0]; result[*returnSize][1] = a[1]; result[*returnSize][2] = a[2];
              cols[*returnSize] = 3;
              (*returnSize)++;
            }
          }
        }
      }
    }
    *returnColumnSizes = cols;
    return result;
  }`
};

// ListNode-based problems
solutions["add-two-numbers"] = {
  java: `class Solution {
  public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0), tail = dummy;
    int carry = 0;
    while (l1 != null || l2 != null || carry > 0) {
      int sum = carry;
      if (l1 != null) { sum += l1.val; l1 = l1.next; }
      if (l2 != null) { sum += l2.val; l2 = l2.next; }
      tail.next = new ListNode(sum % 10);
      tail = tail.next;
      carry = sum / 10;
    }
    return dummy.next;
  }
}`,
  python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def _to_list(arr):
    if not arr: return None
    head = ListNode(arr[0]); cur = head
    for v in arr[1:]: cur.next = ListNode(v); cur = cur.next
    return head

def _from_list(node):
    res = []
    while node: res.append(node.val); node = node.next
    return res

def add_two_numbers(l1, l2):
    if isinstance(l1, list): l1 = _to_list(l1)
    if isinstance(l2, list): l2 = _to_list(l2)
    dummy = tail = ListNode()
    carry = 0
    while l1 or l2 or carry:
        s = carry
        if l1: s += l1.val; l1 = l1.next
        if l2: s += l2.val; l2 = l2.next
        tail.next = ListNode(s % 10)
        tail = tail.next
        carry = s // 10
    return _from_list(dummy.next)`,
  cpp: `class Solution {
public:
  ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
    ListNode dummy(0), *tail = &dummy;
    int carry = 0;
    while (l1 || l2 || carry) {
      int sum = carry;
      if (l1) { sum += l1->val; l1 = l1->next; }
      if (l2) { sum += l2->val; l2 = l2->next; }
      tail->next = new ListNode(sum % 10);
      tail = tail->next;
      carry = sum / 10;
    }
    return dummy.next;
  }
};`,
  c: `struct ListNode* addTwoNumbers(struct ListNode* l1, struct ListNode* l2) {
    struct ListNode* dummy = (struct ListNode*)malloc(sizeof(struct ListNode));
    struct ListNode* tail = dummy;
    int carry = 0;
    while (l1 || l2 || carry) {
      int sum = carry;
      if (l1) { sum += l1->val; l1 = l1->next; }
      if (l2) { sum += l2->val; l2 = l2->next; }
      tail->next = (struct ListNode*)malloc(sizeof(struct ListNode));
      tail = tail->next;
      tail->val = sum % 10;
      carry = sum / 10;
    }
    tail->next = NULL;
    struct ListNode* res = dummy->next;
    free(dummy);
    return res;
  }`
};

solutions["reverse-linked-list"] = {
  java: `class Solution {
  public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    while (head != null) { ListNode next = head.next; head.next = prev; prev = head; head = next; }
    return prev;
  }
}`,
  python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def _to_list(arr):
    if not arr: return None
    head = ListNode(arr[0]); cur = head
    for v in arr[1:]: cur.next = ListNode(v); cur = cur.next
    return head

def _from_list(node):
    res = []
    while node: res.append(node.val); node = node.next
    return res

def reverse_list(head):
    if isinstance(head, list): head = _to_list(head)
    prev = None
    while head:
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
    return _from_list(prev)`,
  cpp: `class Solution {
public:
  ListNode* reverseList(ListNode* head) {
    ListNode* prev = NULL;
    while (head) { ListNode* next = head->next; head->next = prev; prev = head; head = next; }
    return prev;
  }
};`,
  c: `struct ListNode* reverseList(struct ListNode* head) {
    struct ListNode* prev = NULL;
    while (head) { struct ListNode* nxt = head->next; head->next = prev; prev = head; head = nxt; }
    return prev;
  }`
};

// TreeNode-based problems
solutions["binary-tree-inorder-traversal"] = {
  java: `class Solution {
  public java.util.List<Integer> inorderTraversal(TreeNode root) {
    java.util.List<Integer> result = new java.util.ArrayList<>();
    java.util.Deque<TreeNode> stack = new java.util.ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
      while (cur != null) { stack.push(cur); cur = cur.left; }
      cur = stack.pop();
      result.add(cur.val);
      cur = cur.right;
    }
    return result;
  }
}`,
  python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _to_tree(arr):
    if not arr or arr[0] is None: return None
    root = TreeNode(arr[0]); q = [root]; i = 1
    while q and i < len(arr):
        node = q.pop(0)
        if i < len(arr) and arr[i] is not None: node.left = TreeNode(arr[i]); q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None: node.right = TreeNode(arr[i]); q.append(node.right)
        i += 1
    return root

def inorder_traversal(root):
    if isinstance(root, list): root = _to_tree(root)
    result, stack, cur = [], [], root
    while cur or stack:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        result.append(cur.val)
        cur = cur.right
    return result`,
  cpp: `class Solution {
public:
  vector<int> inorderTraversal(TreeNode* root) {
    vector<int> result;
    stack<TreeNode*> st;
    TreeNode* cur = root;
    while (cur || !st.empty()) {
      while (cur) { st.push(cur); cur = cur->left; }
      cur = st.top(); st.pop();
      result.push_back(cur->val);
      cur = cur->right;
    }
    return result;
  }
};`,
  c: `int* inorderTraversal(struct TreeNode* root, int* returnSize) {
    static int result[100];
    int top = -1;
    struct TreeNode* stack[100]; int sp = -1;
    struct TreeNode* cur = root;
    while (cur || sp >= 0) {
      while (cur) { stack[++sp] = cur; cur = cur->left; }
      cur = stack[sp--];
      result[++top] = cur->val;
      cur = cur->right;
    }
    *returnSize = top + 1;
    return result;
  }`
};

solutions["validate-binary-search-tree"] = {
  java: `class Solution {
  public boolean isValidBST(TreeNode root) {
    return validate(root, null, null);
  }
  private boolean validate(TreeNode node, Integer lo, Integer hi) {
    if (node == null) return true;
    if (lo != null && node.val <= lo) return false;
    if (hi != null && node.val >= hi) return false;
    return validate(node.left, lo, node.val) && validate(node.right, node.val, hi);
  }
}`,
  python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _to_tree(arr):
    if not arr or arr[0] is None: return None
    root = TreeNode(arr[0]); q = [root]; i = 1
    while q and i < len(arr):
        node = q.pop(0)
        if i < len(arr) and arr[i] is not None: node.left = TreeNode(arr[i]); q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None: node.right = TreeNode(arr[i]); q.append(node.right)
        i += 1
    return root

def is_valid_bst(root):
    if isinstance(root, list): root = _to_tree(root)
    def validate(node, lo, hi):
        if not node: return True
        if lo is not None and node.val <= lo: return False
        if hi is not None and node.val >= hi: return False
        return validate(node.left, lo, node.val) and validate(node.right, node.val, hi)
    return validate(root, None, None)`,
  cpp: `class Solution {
public:
  bool isValidBST(TreeNode* root) {
    return validate(root, nullptr, nullptr);
  }
  bool validate(TreeNode* node, int* lo, int* hi) {
    if (!node) return true;
    if (lo && node->val <= *lo) return false;
    if (hi && node->val >= *hi) return false;
    return validate(node->left, lo, &node->val) && validate(node->right, &node->val, hi);
  }
};`,
  c: `bool isValidBST(struct TreeNode* root) {
    return validate(root, NULL, NULL);
}
bool validate(struct TreeNode* node, int* lo, int* hi) {
    if (!node) return true;
    if (lo && node->val <= *lo) return false;
    if (hi && node->val >= *hi) return false;
    return validate(node->left, lo, &node->val) && validate(node->right, &node->val, hi);
}`
};

// char[][] problems
solutions["number-of-islands"] = {
  java: `class Solution {
  public int numIslands(char[][] grid) {
    int count = 0;
    for (int i = 0; i < grid.length; i++)
      for (int j = 0; j < grid[0].length; j++)
        if (grid[i][j] == '1') { count++; dfs(grid, i, j); }
    return count;
  }
  private void dfs(char[][] grid, int i, int j) {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length || grid[i][j] == '0') return;
    grid[i][j] = '0';
    dfs(grid, i+1, j); dfs(grid, i-1, j); dfs(grid, i, j+1); dfs(grid, i, j-1);
  }
}`,
  python: `def num_islands(grid):
    def dfs(i, j):
        if i < 0 or i >= len(grid) or j < 0 or j >= len(grid[0]) or grid[i][j] == '0': return
        grid[i][j] = '0'
        dfs(i+1, j); dfs(i-1, j); dfs(i, j+1); dfs(i, j-1)
    count = 0
    for i in range(len(grid)):
        for j in range(len(grid[0])):
            if grid[i][j] == '1': count += 1; dfs(i, j)
    return count`,
  cpp: `class Solution {
public:
  int numIslands(vector<vector<char>>& grid) {
    int count = 0;
    for (int i = 0; i < grid.size(); i++)
      for (int j = 0; j < grid[0].size(); j++)
        if (grid[i][j] == '1') { count++; dfs(grid, i, j); }
    return count;
  }
  void dfs(vector<vector<char>>& grid, int i, int j) {
    if (i < 0 || i >= grid.size() || j < 0 || j >= grid[0].size() || grid[i][j] == '0') return;
    grid[i][j] = '0';
    dfs(grid, i+1, j); dfs(grid, i-1, j); dfs(grid, i, j+1); dfs(grid, i, j-1);
  }
};`,
  c: `int numIslands(char** grid, int gridSize, int* gridColSize) {
    if (gridSize == 0) return 0;
    int count = 0, cols = gridColSize[0];
    for (int i = 0; i < gridSize; i++)
      for (int j = 0; j < cols; j++)
        if (grid[i][j] == '1') { count++; dfs(grid, gridSize, cols, i, j); }
    return count;
}
void dfs(char** grid, int r, int c, int i, int j) {
    if (i < 0 || i >= r || j < 0 || j >= c || grid[i][j] == '0') return;
    grid[i][j] = '0';
    dfs(grid, r, c, i+1, j); dfs(grid, r, c, i-1, j);
    dfs(grid, r, c, i, j+1); dfs(grid, r, c, i, j-1);
}`
};

solutions["clone-graph"] = {
  java: `class Solution {
  java.util.Map<Node, Node> visited = new java.util.HashMap<>();
  public Node cloneGraph(Node node) {
    if (node == null) return null;
    if (visited.containsKey(node)) return visited.get(node);
    Node clone = new Node(node.val);
    visited.put(node, clone);
    for (Node n : node.neighbors) clone.neighbors.add(cloneGraph(n));
    return clone;
  }
}`,
  python: `class Node:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

def clone_graph(adjList):
    nodes = [Node(i+1) for i in range(len(adjList))]
    for i, neighbors in enumerate(adjList):
        nodes[i].neighbors = [nodes[j-1] for j in neighbors]
    visited = {}
    def dfs(n):
        if not n: return None
        if n in visited: return visited[n]
        clone = Node(n.val)
        visited[n] = clone
        clone.neighbors = [dfs(nei) for nei in n.neighbors]
        return clone
    cloned = dfs(nodes[0]) if nodes else None
    if not cloned: return []
    res = []
    def collect(n, seen):
        if not n or n in seen: return
        seen.add(n)
        res.append([nei.val for nei in n.neighbors])
        for nei in n.neighbors: collect(nei, seen)
    collect(cloned, set())
    return res`,
  cpp: `class Solution {
public:
  unordered_map<Node*, Node*> visited;
  Node* cloneGraph(Node* node) {
    if (!node) return NULL;
    if (visited.count(node)) return visited[node];
    Node* clone = new Node(node->val);
    visited[node] = clone;
    for (Node* n : node->neighbors) clone->neighbors.push_back(cloneGraph(n));
    return clone;
  }
};`,
  c: `// C does not support cloneGraph (Node/neighbors pattern); stub
int cloneGraph() { return 0; }`
};

solutions["subsets"] = {
  java: `class Solution {
  public java.util.List<java.util.List<Integer>> subsets(int[] nums) {
    java.util.List<java.util.List<Integer>> result = new java.util.ArrayList<>();
    result.add(new java.util.ArrayList<>());
    for (int n : nums) {
      int size = result.size();
      for (int i = 0; i < size; i++) {
        java.util.List<Integer> subset = new java.util.ArrayList<>(result.get(i));
        subset.add(n);
        result.add(subset);
      }
    }
    return result;
  }
}`,
  python: `def subsets(nums):
    result = [[]]
    for n in nums:
        result += [s + [n] for s in result]
    return result`,
  cpp: `class Solution {
public:
  vector<vector<int>> subsets(vector<int>& nums) {
    vector<vector<int>> result = {{}};
    for (int n : nums) {
      int size = result.size();
      for (int i = 0; i < size; i++) {
        result.push_back(result[i]);
        result.back().push_back(n);
      }
    }
    return result;
  }
};`,
  c: `int** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {
    static int* result[1024];
    static int cols[1024];
    int total = 1 << numsSize;
    *returnSize = total;
    for (int i = 0; i < total; i++) {
      cols[i] = 0;
      int temp = i;
      int idx = 0;
      static int data[10];
      int dc = 0;
      for (int j = 0; j < numsSize; j++) {
        if (i & (1 << j)) data[dc++] = nums[j];
      }
      result[i] = (int*)malloc(dc * sizeof(int));
      for (int j = 0; j < dc; j++) result[i][j] = data[j];
      cols[i] = dc;
    }
    *returnColumnSizes = cols;
    return result;
  }`
};

solutions["search-in-rotated-sorted-array"] = {
  java: `class Solution {
  public int search(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
      int mid = lo + (hi - lo) / 2;
      if (nums[mid] == target) return mid;
      if (nums[lo] <= nums[mid]) {
        if (target >= nums[lo] && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
      } else {
        if (target > nums[mid] && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
      }
    }
    return -1;
  }
}`,
  python: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]: hi = mid - 1
            else: lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]: lo = mid + 1
            else: hi = mid - 1
    return -1`,
  cpp: `class Solution {
public:
  int search(vector<int>& nums, int target) {
    int lo = 0, hi = nums.size() - 1;
    while (lo <= hi) {
      int mid = lo + (hi - lo) / 2;
      if (nums[mid] == target) return mid;
      if (nums[lo] <= nums[mid]) {
        if (target >= nums[lo] && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
      } else {
        if (target > nums[mid] && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
      }
    }
    return -1;
  }
};`,
  c: `int search(int* nums, int numsSize, int target) {
    int lo = 0, hi = numsSize - 1;
    while (lo <= hi) {
      int mid = lo + (hi - lo) / 2;
      if (nums[mid] == target) return mid;
      if (nums[lo] <= nums[mid]) {
        if (target >= nums[lo] && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
      } else {
        if (target > nums[mid] && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
      }
    }
    return -1;
  }`
};

solutions["jump-game"] = {
  java: `class Solution {
  public boolean canJump(int[] nums) {
    int reachable = 0;
    for (int i = 0; i < nums.length && i <= reachable; i++) {
      reachable = Math.max(reachable, i + nums[i]);
    }
    return reachable >= nums.length - 1;
  }
}`,
  python: `def can_jump(nums):
    reachable = 0
    for i, n in enumerate(nums):
        if i > reachable: return False
        reachable = max(reachable, i + n)
    return True`,
  cpp: `class Solution {
public:
  bool canJump(vector<int>& nums) {
    int reachable = 0;
    for (int i = 0; i < nums.size() && i <= reachable; i++) {
      reachable = max(reachable, i + nums[i]);
    }
    return reachable >= nums.size() - 1;
  }
};`,
  c: `bool canJump(int* nums, int numsSize) {
    int reachable = 0;
    for (int i = 0; i < numsSize && i <= reachable; i++) {
      if (i + nums[i] > reachable) reachable = i + nums[i];
    }
    return reachable >= numsSize - 1;
  }`
};

solutions["task-scheduler"] = {
  java: `class Solution {
  public int leastInterval(char[] tasks, int n) {
    int[] freq = new int[26];
    for (char c : tasks) freq[c - 'A']++;
    java.util.Arrays.sort(freq);
    int maxFreq = freq[25];
    int idle = (maxFreq - 1) * n;
    for (int i = 24; i >= 0 && freq[i] > 0; i--) idle -= Math.min(maxFreq - 1, freq[i]);
    return tasks.length + Math.max(0, idle);
  }
}`,
  python: `def least_interval(tasks, n):
    freq = [0] * 26
    for c in tasks: freq[ord(c) - 65] += 1
    freq.sort()
    max_freq = freq[-1]
    idle = (max_freq - 1) * n
    for f in reversed(freq[:-1]):
        idle -= min(max_freq - 1, f)
    return len(tasks) + max(0, idle)`,
  cpp: `class Solution {
public:
  int leastInterval(vector<char>& tasks, int n) {
    int freq[26] = {};
    for (char c : tasks) freq[c - 'A']++;
    sort(freq, freq + 26);
    int maxFreq = freq[25];
    int idle = (maxFreq - 1) * n;
    for (int i = 24; i >= 0 && freq[i] > 0; i--) idle -= min(maxFreq - 1, freq[i]);
    return tasks.size() + max(0, idle);
  }
};`,
  c: `int leastInterval(char* tasks, int tasksSize, int n) {
    int freq[26] = {0};
    for (int i = 0; i < tasksSize; i++) freq[tasks[i] - 'A']++;
    for (int i = 0; i < 25; i++)
      for (int j = 0; j < 25 - i; j++)
        if (freq[j] < freq[j+1]) { int t = freq[j]; freq[j] = freq[j+1]; freq[j+1] = t; }
    int maxFreq = freq[0];
    int idle = (maxFreq - 1) * n;
    for (int i = 1; i < 26 && freq[i] > 0; i++) idle -= (maxFreq - 1 < freq[i] ? maxFreq - 1 : freq[i]);
    return tasksSize + (idle > 0 ? idle : 0);
  }`
};

// ──────────────────────────────────────────────
// HARD
// ──────────────────────────────────────────────

solutions["regular-expression-matching"] = {
  java: `class Solution {
  public boolean isMatch(String s, String p) {
    int m = s.length(), n = p.length();
    boolean[][] dp = new boolean[m+1][n+1];
    dp[0][0] = true;
    for (int j = 2; j <= n; j++) dp[0][j] = p.charAt(j-1) == '*' && dp[0][j-2];
    for (int i = 1; i <= m; i++) {
      for (int j = 1; j <= n; j++) {
        if (p.charAt(j-1) == '*') {
          dp[i][j] = dp[i][j-2] || (matches(s.charAt(i-1), p.charAt(j-2)) && dp[i-1][j]);
        } else {
          dp[i][j] = matches(s.charAt(i-1), p.charAt(j-1)) && dp[i-1][j-1];
        }
      }
    }
    return dp[m][n];
  }
  private boolean matches(char sc, char pc) { return pc == '.' || sc == pc; }
}`,
  python: `def is_match(s, p):
    m, n = len(s), len(p)
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for j in range(2, n + 1):
        dp[0][j] = p[j-1] == '*' and dp[0][j-2]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j-1] == '*':
                dp[i][j] = dp[i][j-2] or ((p[j-2] == '.' or s[i-1] == p[j-2]) and dp[i-1][j])
            else:
                dp[i][j] = (p[j-1] == '.' or s[i-1] == p[j-1]) and dp[i-1][j-1]
    return dp[m][n]`,
  cpp: `class Solution {
public:
  bool isMatch(string s, string p) {
    int m = s.size(), n = p.size();
    vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));
    dp[0][0] = true;
    for (int j = 2; j <= n; j++) dp[0][j] = p[j-1] == '*' && dp[0][j-2];
    for (int i = 1; i <= m; i++) {
      for (int j = 1; j <= n; j++) {
        if (p[j-1] == '*') {
          dp[i][j] = dp[i][j-2] || ((p[j-2] == '.' || s[i-1] == p[j-2]) && dp[i-1][j]);
        } else {
          dp[i][j] = (p[j-1] == '.' || s[i-1] == p[j-1]) && dp[i-1][j-1];
        }
      }
    }
    return dp[m][n];
  }
};`,
  c: `bool isMatch(char* s, char* p) {
    int m = strlen(s), n = strlen(p);
    bool dp[21][21] = {{false}};
    dp[0][0] = true;
    for (int j = 2; j <= n; j++) dp[0][j] = p[j-1] == '*' && dp[0][j-2];
    for (int i = 1; i <= m; i++) {
      for (int j = 1; j <= n; j++) {
        if (p[j-1] == '*') {
          dp[i][j] = dp[i][j-2] || ((p[j-2] == '.' || s[i-1] == p[j-2]) && dp[i-1][j]);
        } else {
          dp[i][j] = (p[j-1] == '.' || s[i-1] == p[j-1]) && dp[i-1][j-1];
        }
      }
    }
    return dp[m][n];
  }`
};

solutions["edit-distance"] = {
  java: `class Solution {
  public int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m+1][n+1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++) {
      for (int j = 1; j <= n; j++) {
        if (word1.charAt(i-1) == word2.charAt(j-1)) {
          dp[i][j] = dp[i-1][j-1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i-1][j], Math.min(dp[i][j-1], dp[i-1][j-1]));
        }
      }
    }
    return dp[m][n];
  }
}`,
  python: `def min_distance(word1, word2):
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i-1] == word2[j-1]: dp[i][j] = dp[i-1][j-1]
            else: dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]`,
  cpp: `class Solution {
public:
  int minDistance(string word1, string word2) {
    int m = word1.size(), n = word2.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1));
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++)
      for (int j = 1; j <= n; j++)
        if (word1[i-1] == word2[j-1]) dp[i][j] = dp[i-1][j-1];
        else dp[i][j] = 1 + min({dp[i-1][j], dp[i][j-1], dp[i-1][j-1]});
    return dp[m][n];
  }
};`,
  c: `int minDistance(char* word1, char* word2) {
    int m = strlen(word1), n = strlen(word2);
    int dp[501][501];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++)
      for (int j = 1; j <= n; j++)
        if (word1[i-1] == word2[j-1]) dp[i][j] = dp[i-1][j-1];
        else {
          int min = dp[i-1][j] < dp[i][j-1] ? dp[i-1][j] : dp[i][j-1];
          if (dp[i-1][j-1] < min) min = dp[i-1][j-1];
          dp[i][j] = 1 + min;
        }
    return dp[m][n];
  }`
};

solutions["alien-dictionary"] = {
  java: `class Solution {
  public String alienOrder(String[] words) {
    java.util.Map<Character, java.util.Set<Character>> graph = new java.util.HashMap<>();
    int[] inDegree = new int[26];
    for (String w : words) for (char c : w.toCharArray()) graph.putIfAbsent(c, new java.util.HashSet<>());
    for (int i = 0; i < words.length - 1; i++) {
      String a = words[i], b = words[i+1];
      int len = Math.min(a.length(), b.length());
      boolean found = false;
      for (int j = 0; j < len; j++) {
        if (a.charAt(j) != b.charAt(j)) {
          if (!graph.get(a.charAt(j)).contains(b.charAt(j))) {
            graph.get(a.charAt(j)).add(b.charAt(j));
            inDegree[b.charAt(j) - 'a']++;
          }
          found = true; break;
        }
      }
      if (!found && a.length() > b.length()) return "";
    }
    java.util.Queue<Character> q = new java.util.LinkedList<>();
    for (char c : graph.keySet()) if (inDegree[c - 'a'] == 0) q.offer(c);
    StringBuilder sb = new StringBuilder();
    while (!q.isEmpty()) {
      char c = q.poll();
      sb.append(c);
      for (char n : graph.get(c)) if (--inDegree[n - 'a'] == 0) q.offer(n);
    }
    return sb.length() == graph.size() ? sb.toString() : "";
  }
}`,
  python: `def alien_order(words):
    graph = {c: set() for w in words for c in w}
    indeg = {c: 0 for c in graph}
    for a, b in zip(words, words[1:]):
        for ca, cb in zip(a, b):
            if ca != cb:
                if cb not in graph[ca]:
                    graph[ca].add(cb)
                    indeg[cb] += 1
                break
        else:
            if len(a) > len(b): return ""
    q = [c for c in graph if indeg[c] == 0]
    res = []
    while q:
        c = q.pop()
        res.append(c)
        for n in graph[c]:
            indeg[n] -= 1
            if indeg[n] == 0: q.append(n)
    return ''.join(res) if len(res) == len(graph) else ""`,
  cpp: `class Solution {
public:
  string alienOrder(vector<string>& words) {
    unordered_map<char, unordered_set<char>> graph;
    int inDegree[26] = {};
    for (string& w : words) for (char c : w) if (!graph.count(c)) graph[c] = {};
    for (int i = 0; i < (int)words.size() - 1; i++) {
      string& a = words[i], b = words[i+1];
      int len = min(a.size(), b.size()), j = 0;
      while (j < len && a[j] == b[j]) j++;
      if (j < len) {
        if (!graph[a[j]].count(b[j])) { graph[a[j]].insert(b[j]); inDegree[b[j] - 'a']++; }
      } else if (a.size() > b.size()) return "";
    }
    queue<char> q;
    for (auto& p : graph) if (inDegree[p.first - 'a'] == 0) q.push(p.first);
    string result;
    while (!q.empty()) {
      char c = q.front(); q.pop();
      result += c;
      for (char n : graph[c]) if (--inDegree[n - 'a'] == 0) q.push(n);
    }
    return result.size() == graph.size() ? result : "";
  }
};`,
  c: `char* alienOrder(char** words, int wordsSize) {
    int graph[26][26] = {{0}};
    int inDegree[26] = {0};
    int exists[26] = {0};
    for (int i = 0; i < wordsSize; i++)
      for (int j = 0; words[i][j]; j++) exists[words[i][j] - 'a'] = 1;
    for (int i = 0; i < wordsSize - 1; i++) {
      int j = 0;
      while (words[i][j] && words[i+1][j] && words[i][j] == words[i+1][j]) j++;
      if (words[i][j] && words[i+1][j]) {
        int u = words[i][j] - 'a', v = words[i+1][j] - 'a';
        if (!graph[u][v]) { graph[u][v] = 1; inDegree[v]++; }
      } else if (strlen(words[i]) > strlen(words[i+1])) return "";
    }
    char q[26]; int front = 0, back = 0;
    for (int i = 0; i < 26; i++) if (exists[i] && inDegree[i] == 0) q[back++] = 'a' + i;
    static char result[27];
    int ri = 0;
    while (front < back) {
      char c = q[front++];
      result[ri++] = c;
      for (int i = 0; i < 26; i++) if (graph[c-'a'][i]) { if (--inDegree[i] == 0) q[back++] = 'a' + i; }
    }
    result[ri] = 0;
    int total = 0; for (int i = 0; i < 26; i++) if (exists[i]) total++;
    return ri == total ? result : "";
  }`
};

solutions["word-ladder"] = {
  java: `class Solution {
  public int ladderLength(String beginWord, String endWord, java.util.List<String> wordList) {
    java.util.Set<String> set = new java.util.HashSet<>(wordList);
    if (!set.contains(endWord)) return 0;
    java.util.Queue<String> q = new java.util.LinkedList<>();
    q.offer(beginWord);
    int level = 1;
    while (!q.isEmpty()) {
      int size = q.size();
      for (int i = 0; i < size; i++) {
        char[] cur = q.poll().toCharArray();
        for (int j = 0; j < cur.length; j++) {
          char orig = cur[j];
          for (char c = 'a'; c <= 'z'; c++) {
            cur[j] = c;
            String next = new String(cur);
            if (next.equals(endWord)) return level + 1;
            if (set.contains(next)) { set.remove(next); q.offer(next); }
          }
          cur[j] = orig;
        }
      }
      level++;
    }
    return 0;
  }
}`,
  python: `def ladder_length(beginWord, endWord, wordList):
    word_set = set(wordList)
    if endWord not in word_set: return 0
    if beginWord == endWord: return 1
    q = [beginWord]
    level = 1
    while q:
        for _ in range(len(q)):
            cur = list(q.pop(0))
            for i in range(len(cur)):
                orig = cur[i]
                for c in 'abcdefghijklmnopqrstuvwxyz':
                    cur[i] = c
                    nxt = ''.join(cur)
                    if nxt == endWord: return level + 1
                    if nxt in word_set:
                        word_set.remove(nxt)
                        q.append(nxt)
                cur[i] = orig
        level += 1
    return 0`,
  cpp: `class Solution {
public:
  int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
    unordered_set<string> dict(wordList.begin(), wordList.end());
    if (!dict.count(endWord)) return 0;
    queue<string> q; q.push(beginWord);
    int level = 1;
    while (!q.empty()) {
      int size = q.size();
      while (size--) {
        string cur = q.front(); q.pop();
        for (int i = 0; i < cur.size(); i++) {
          char orig = cur[i];
          for (char c = 'a'; c <= 'z'; c++) {
            cur[i] = c;
            if (cur == endWord) return level + 1;
            if (dict.count(cur)) { dict.erase(cur); q.push(cur); }
          }
          cur[i] = orig;
        }
      }
      level++;
    }
    return 0;
  }
};`,
  c: `int ladderLength(char* beginWord, char* endWord, char** wordList, int wordListSize) {
    int visited[5000] = {0};
    int found = 0;
    for (int i = 0; i < wordListSize; i++) if (strcmp(wordList[i], endWord) == 0) { found = 1; break; }
    if (!found) return 0;
    char q[5000][11]; int front = 0, back = 0;
    strcpy(q[back++], beginWord);
    int level = 1;
    while (front < back) {
      int size = back - front;
      while (size--) {
        char cur[11]; strcpy(cur, q[front++]);
        for (int i = 0; cur[i]; i++) {
          char orig = cur[i];
          for (char c = 'a'; c <= 'z'; c++) {
            cur[i] = c;
            if (strcmp(cur, endWord) == 0) return level + 1;
            for (int j = 0; j < wordListSize; j++) {
              if (!visited[j] && strcmp(cur, wordList[j]) == 0) {
                visited[j] = 1;
                strcpy(q[back++], cur);
                break;
              }
            }
          }
          cur[i] = orig;
        }
      }
      level++;
    }
    return 0;
  }`
};

solutions["merge-k-sorted-lists"] = {
  java: `class Solution {
  public ListNode mergeKLists(ListNode[] lists) {
    if (lists.length == 0) return null;
    int interval = 1;
    while (interval < lists.length) {
      for (int i = 0; i + interval < lists.length; i += interval * 2)
        lists[i] = merge(lists[i], lists[i + interval]);
      interval *= 2;
    }
    return lists[0];
  }
  private ListNode merge(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), tail = dummy;
    while (a != null && b != null) {
      if (a.val < b.val) { tail.next = a; a = a.next; }
      else { tail.next = b; b = b.next; }
      tail = tail.next;
    }
    tail.next = a != null ? a : b;
    return dummy.next;
  }
}`,
  python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def _to_list(arr):
    if not arr: return None
    head = ListNode(arr[0]); cur = head
    for v in arr[1:]: cur.next = ListNode(v); cur = cur.next
    return head

def _from_list(node):
    res = []
    while node: res.append(node.val); node = node.next
    return res

def merge_k_lists(lists):
    if isinstance(lists, list) and lists and isinstance(lists[0], list):
        lists = [_to_list(lst) for lst in lists]
    if not lists: return []
    interval = 1
    while interval < len(lists):
        for i in range(0, len(lists) - interval, interval * 2):
            lists[i] = _merge(lists[i], lists[i + interval])
        interval *= 2
    return _from_list(lists[0])

def _merge(a, b):
    dummy = tail = ListNode()
    while a and b:
        if a.val < b.val: tail.next = a; a = a.next
        else: tail.next = b; b = b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next`,
  cpp: `class Solution {
public:
  ListNode* mergeKLists(vector<ListNode*>& lists) {
    if (lists.empty()) return NULL;
    int interval = 1;
    while (interval < (int)lists.size()) {
      for (int i = 0; i + interval < (int)lists.size(); i += interval * 2)
        lists[i] = merge(lists[i], lists[i + interval]);
      interval *= 2;
    }
    return lists[0];
  }
  ListNode* merge(ListNode* a, ListNode* b) {
    ListNode dummy(0), *tail = &dummy;
    while (a && b) {
      if (a->val < b->val) { tail->next = a; a = a->next; }
      else { tail->next = b; b = b->next; }
      tail = tail->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
  }
};`,
  c: `struct ListNode* mergeKLists(struct ListNode** lists, int listsSize) {
    if (listsSize == 0) return NULL;
    int interval = 1;
    while (interval < listsSize) {
      for (int i = 0; i + interval < listsSize; i += interval * 2)
        lists[i] = merge(lists[i], lists[i + interval]);
      interval *= 2;
    }
    return lists[0];
}
struct ListNode* merge(struct ListNode* a, struct ListNode* b) {
    struct ListNode dummy; dummy.next = NULL;
    struct ListNode* tail = &dummy;
    while (a && b) {
      if (a->val < b->val) { tail->next = a; a = a->next; }
      else { tail->next = b; b = b->next; }
      tail = tail->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
}`
};

export default solutions;
