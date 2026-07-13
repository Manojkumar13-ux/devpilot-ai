import type { SeedProblem } from "./types";
import { jsFn, pyFn, javaCls, cppCls, cFn, goFn, rustFn } from "./types";

export const easyProblems: SeedProblem[] = [
  {
  title: `Two Sum`,
  slug: `two-sum`,
  difficulty: `Easy`,
  category: `Arrays`,
  description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`. You may assume that each input has exactly one solution, and you may not use the same element twice.`,
  constraints: `- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- Only one valid answer exists.`,
  examples: [
    { input: `nums = [2,7,11,15], target = 9`, output: `[0,1]`, explanation: `Because nums[0] + nums[1] == 9, we return [0,1].` },
    { input: `nums = [3,2,4], target = 6`, output: `[1,2]` },
    { input: `nums = [3,3], target = 6`, output: `[0,1]` },
  ],
  starterCode: {
    javascript: `function twoSum(nums,target){const map=new Map();for(let i=0;i<nums.length;i++){const complement=target-nums[i];if(map.has(complement))return[map.get(complement),i];map.set(nums[i],i)}return[]}`,
    typescript: `function twoSum(nums:number[],target:number):number[]{
  const map=new Map<number,number>();
  for(let i=0;i<nums.length;i++){
    const complement=target-nums[i];
    if(map.has(complement))return[map.get(complement)!,i];
    map.set(nums[i],i);
  }
  return[];
}`,
    python: `def two_sum(nums,target):
    seen={}
    for i,num in enumerate(nums):
        complement=target-num
        if complement in seen:return[seen[complement],i]
        seen[num]=i
    return[]`,
    java: `import java.util.*;
class Solution{
  public int[] twoSum(int[] nums,int target){
    Map<Integer,Integer>map=new HashMap<>();
    for(int i=0;i<nums.length;i++){
      int complement=target-nums[i];
      if(map.containsKey(complement))return new int[]{map.get(complement),i};
      map.put(nums[i],i);
    }
    return new int[]{};
  }
}`,
    cpp: `#include<vector>
#include<unordered_map>
using namespace std;
class Solution{
public:
  vector<int>twoSum(vector<int>&nums,int target){
    unordered_map<int,int>map;
    for(int i=0;i<nums.size();i++){
      int complement=target-nums[i];
      if(map.count(complement))return{map[complement],i};
      map[nums[i]]=i;
    }
    return{};
  }
};`,
    c: `int*twoSum(int*nums,int numsSize,int target,int*returnSize){
  *returnSize=2;
  int*result=(int*)malloc(2*sizeof(int));
  for(int i=0;i<numsSize;i++)
    for(int j=i+1;j<numsSize;j++)
      if(nums[i]+nums[j]==target){result[0]=i;result[1]=j;return result;}
  *returnSize=0;return NULL;
}`,
    go: `func twoSum(nums []int,target int)[]int{
  m:=make(map[int]int)
  for i,num:=range nums{
    if j,ok:=m[target-num];ok{return[]int{j,i}}
    m[num]=i
  }
  return nil
}`,
    rust: `pub fn two_sum(nums:Vec<i32>,target:i32)->Vec<i32>{
  use std::collections::HashMap;
  let mut map=HashMap::new();
  for(i,&num)in nums.iter().enumerate(){
    if let Some(&j)=map.get(&(target-num)){return vec![j as i32,i as i32]}
    map.insert(num,i);
  }
  vec![]
}`,
  },
  tags: ["Arrays","HashMap"],
  companies: ["Google","Amazon","Microsoft","Apple"],
  hints: ["Use a hash map to store the complement of each element.","Think about edge cases like duplicates."],
  editorial: `Use a hash map storing each element's value and index. For each element, check if its complement (target - value) exists in the map. If yes, return both indices.`,
  complexity: { time: `O(n)`, space: `O(n)` },
  testCases: [
    { input: JSON.stringify({ nums: [2,7,11,15], target: 9 }), expectedOutput: JSON.stringify([0,1]), isHidden: false },
    { input: JSON.stringify({ nums: [3,2,4], target: 6 }), expectedOutput: JSON.stringify([1,2]), isHidden: false },
    { input: JSON.stringify({ nums: [3,3], target: 6 }), expectedOutput: JSON.stringify([0,1]), isHidden: false },
    { input: JSON.stringify({ nums: [1,2,3,4], target: 4 }), expectedOutput: JSON.stringify([0,2]), isHidden: true },
    { input: JSON.stringify({ nums: [-1,0,1,2], target: 1 }), expectedOutput: JSON.stringify([0,3]), isHidden: true },
  ],
},
  {
  title: `Best Time to Buy and Sell Stock`,
  slug: `best-time-to-buy-and-sell-stock`,
  difficulty: `Easy`,
  category: `Arrays`,
  description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve. If no profit is possible, return 0.`,
  constraints: `- \`1 <= prices.length <= 10^5\`
- \`0 <= prices[i] <= 10^4\``,
  examples: [
    { input: `prices = [7,1,5,3,6,4]`, output: `5`, explanation: `Buy at 1, sell at 6 for profit 5.` },
    { input: `prices = [7,6,4,3,1]`, output: `0`, explanation: `No profit possible.` },
  ],
  starterCode: {
    javascript: `function maxProfit(prices){let minPrice=Infinity;let maxProfit=0;for(const price of prices){if(price<minPrice)minPrice=price;else if(price-minPrice>maxProfit)maxProfit=price-minPrice}return maxProfit}`,
    typescript: `function maxProfit(prices:number[]):number{
  let minPrice=Infinity;let maxProfit=0;
  for(const price of prices){
    if(price<minPrice)minPrice=price;
    else if(price-minPrice>maxProfit)maxProfit=price-minPrice;
  }
  return maxProfit;
}`,
    python: `def max_profit(prices):
    min_price=float('inf');max_profit=0
    for price in prices:
        if price<min_price:min_price=price
        elif price-min_price>max_profit:max_profit=price-min_price
    return max_profit`,
    java: `class Solution{
  public int maxProfit(int[]prices){
    int minPrice=Integer.MAX_VALUE,maxProfit=0;
    for(int price:prices){
      if(price<minPrice)minPrice=price;
      else if(price-minPrice>maxProfit)maxProfit=price-minPrice;
    }
    return maxProfit;
  }
}`,
    cpp: `#include<vector>
#include<algorithm>
#include<climits>
using namespace std;
class Solution{
public:
  int maxProfit(vector<int>&prices){
    int minPrice=INT_MAX,maxProfit=0;
    for(int price:prices){
      if(price<minPrice)minPrice=price;
      else if(price-minPrice>maxProfit)maxProfit=price-minPrice;
    }
    return maxProfit;
  }
};`,
    c: `int maxProfit(int*prices,int pricesSize){
  int minPrice=10001,maxProfit=0;
  for(int i=0;i<pricesSize;i++){
    if(prices[i]<minPrice)minPrice=prices[i];
    else if(prices[i]-minPrice>maxProfit)maxProfit=prices[i]-minPrice;
  }
  return maxProfit;
}`,
    go: `func maxProfit(prices[]int)int{
  minPrice:=int(^uint(0)>>1);maxProfit:=0
  for _,price:=range prices{
    if price<minPrice{minPrice=price}else if price-minPrice>maxProfit{maxProfit=price-minPrice}
  }
  return maxProfit
}`,
    rust: `fn max_profit(prices:Vec<i32>)->i32{
  let mut min_price=i32::MAX;let mut max_profit=0;
  for&price in&prices{
    if price<min_price{min_price=price;}
    else if price-min_price>max_profit{max_profit=price-min_price;}
  }
  max_profit
}`,
  },
  tags: ["Arrays","Dynamic Programming"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Track the minimum price seen so far.","At each day, compute profit if sold today.","Keep a running max profit."],
  editorial: `Iterate through prices. Keep track of the minimum price seen so far. At each step, calculate potential profit if selling at current price. Update max profit accordingly.`,
  complexity: { time: `O(n)`, space: `O(1)` },
  testCases: [
    { input: JSON.stringify({ prices: [7,1,5,3,6,4] }), expectedOutput: JSON.stringify(5), isHidden: false },
    { input: JSON.stringify({ prices: [7,6,4,3,1] }), expectedOutput: JSON.stringify(0), isHidden: false },
    { input: JSON.stringify({ prices: [1,2] }), expectedOutput: JSON.stringify(1), isHidden: false },
    { input: JSON.stringify({ prices: [1,2,3,4,5] }), expectedOutput: JSON.stringify(4), isHidden: true },
    { input: JSON.stringify({ prices: [3,2,6,5,0,3] }), expectedOutput: JSON.stringify(2), isHidden: true },
  ],
},
  {
  title: `Plus One`,
  slug: `plus-one`,
  difficulty: `Easy`,
  category: `Arrays`,
  description: `You are given a large integer represented as an integer array \`digits\`, where each \`digits[i]\` is the ith digit of the integer. The digits are ordered from most significant to least significant. Increment the large integer by one and return the resulting array.`,
  constraints: `- \`1 <= digits.length <= 100\`
- \`0 <= digits[i] <= 9\`
- \`digits\` does not contain any leading zero's.`,
  examples: [
    { input: `digits = [1,2,3]`, output: `[1,2,4]`, explanation: `123 + 1 = 124.` },
    { input: `digits = [4,3,2,1]`, output: `[4,3,2,2]` },
    { input: `digits = [9]`, output: `[1,0]` },
  ],
  starterCode: {
    javascript: `function plusOne(digits){for(let i=digits.length-1;i>=0;i--){if(digits[i]<9){digits[i]++;return digits}digits[i]=0}return[1,...digits]}`,
    typescript: `function plusOne(digits:number[]):number[]{
  for(let i=digits.length-1;i>=0;i--){
    if(digits[i]<9){digits[i]++;return digits;}
    digits[i]=0;
  }
  return[1,...digits];
}`,
    python: `def plus_one(digits):
    for i in range(len(digits)-1,-1,-1):
        if digits[i]<9:digits[i]+=1;return digits
        digits[i]=0
    return[1]+digits`,
    java: `class Solution{
  public int[]plusOne(int[]digits){
    for(int i=digits.length-1;i>=0;i--){
      if(digits[i]<9){digits[i]++;return digits;}
      digits[i]=0;
    }
    int[]result=new int[digits.length+1];result[0]=1;return result;
  }
}`,
    cpp: `#include<vector>
using namespace std;
class Solution{
public:
  vector<int>plusOne(vector<int>&digits){
    for(int i=digits.size()-1;i>=0;i--){
      if(digits[i]<9){digits[i]++;return digits;}
      digits[i]=0;
    }
    digits.insert(digits.begin(),1);return digits;
  }
};`,
    c: `int*plusOne(int*digits,int digitsSize,int*returnSize){
  for(int i=digitsSize-1;i>=0;i--){
    if(digits[i]<9){digits[i]++;*returnSize=digitsSize;return digits;}
    digits[i]=0;
  }
  int*result=(int*)malloc((digitsSize+1)*sizeof(int));
  result[0]=1;for(int i=1;i<=digitsSize;i++)result[i]=0;
  *returnSize=digitsSize+1;return result;
}`,
    go: `func plusOne(digits[]int)[]int{
  for i:=len(digits)-1;i>=0;i--{
    if digits[i]<9{digits[i]++;return digits}
    digits[i]=0
  }
  return append([]int{1},digits...)
}`,
    rust: `fn plus_one(digits:Vec<i32>)->Vec<i32>{
  let mut d=digits;
  for i in(0..d.len()).rev(){
    if d[i]<9{d[i]+=1;return d;}
    d[i]=0;
  }
  let mut result=vec![1];result.extend(d);result
}`,
  },
  tags: ["Arrays","Math"],
  companies: ["Google","Microsoft"],
  hints: ["Work from the least significant digit.","Handle the carry when a digit becomes 10."],
  editorial: `Start from the rightmost digit. Add 1 and handle carry. If all digits become 9, prepend 1 to the array.`,
  complexity: { time: `O(n)`, space: `O(1)` },
  testCases: [
    { input: JSON.stringify({ digits: [1,2,3] }), expectedOutput: JSON.stringify([1,2,4]), isHidden: false },
    { input: JSON.stringify({ digits: [4,3,2,1] }), expectedOutput: JSON.stringify([4,3,2,2]), isHidden: false },
    { input: JSON.stringify({ digits: [9] }), expectedOutput: JSON.stringify([1,0]), isHidden: false },
    { input: JSON.stringify({ digits: [9,9,9] }), expectedOutput: JSON.stringify([1,0,0,0]), isHidden: true },
    { input: JSON.stringify({ digits: [0] }), expectedOutput: JSON.stringify([1]), isHidden: true },
  ],
},
  {
  title: `Single Number`,
  slug: `single-number`,
  difficulty: `Easy`,
  category: `Arrays`,
  description: `Given a non-empty array of integers \`nums\`, every element appears twice except for one. Find that single one. You must implement a solution with a linear runtime complexity and use only constant extra space.`,
  constraints: `- \`1 <= nums.length <= 3 * 10^4\`
- \`-3 * 10^4 <= nums[i] <= 3 * 10^4\`
- Each element appears twice except for one element which appears once.`,
  examples: [
    { input: `nums = [2,2,1]`, output: `1` },
    { input: `nums = [4,1,2,1,2]`, output: `4` },
    { input: `nums = [1]`, output: `1` },
  ],
  starterCode: {
    javascript: `function singleNumber(nums){let x=0;for(const n of nums)x^=n;return x}`,
    typescript: `function singleNumber(nums:number[]):number{
  let x=0;
  for(const n of nums)x^=n;
  return x;
}`,
    python: `def single_number(nums):
    x=0
    for n in nums:x^=n
    return x`,
    java: `class Solution{
  public int singleNumber(int[]nums){
    int x=0;
    for(int n:nums)x^=n;
    return x;
  }
}`,
    cpp: `#include<vector>
using namespace std;
class Solution{
public:
  int singleNumber(vector<int>&nums){
    int x=0;
    for(int n:nums)x^=n;
    return x;
  }
};`,
    c: `int singleNumber(int*nums,int numsSize){
  int x=0;
  for(int i=0;i<numsSize;i++)x^=nums[i];
  return x;
}`,
    go: `func singleNumber(nums[]int)int{
  x:=0
  for_,n:=range nums{x^=n}
  return x
}`,
    rust: `fn single_number(nums:Vec<i32>)->i32{nums.iter().fold(0,|a,&x|a^x)}`,
  },
  tags: ["Arrays","Bit Manipulation"],
  companies: ["Amazon","Google","Microsoft"],
  hints: ["Think about XOR properties.","a XOR a = 0, a XOR 0 = a."],
  editorial: `Use XOR on all elements. Since x XOR x = 0 and x XOR 0 = x, the elements appearing twice cancel out, leaving only the single element.`,
  complexity: { time: `O(n)`, space: `O(1)` },
  testCases: [
    { input: JSON.stringify({ nums: [2,2,1] }), expectedOutput: JSON.stringify(1), isHidden: false },
    { input: JSON.stringify({ nums: [4,1,2,1,2] }), expectedOutput: JSON.stringify(4), isHidden: false },
    { input: JSON.stringify({ nums: [1] }), expectedOutput: JSON.stringify(1), isHidden: false },
    { input: JSON.stringify({ nums: [1,1,2,2,-2] }), expectedOutput: JSON.stringify(-2), isHidden: true },
    { input: JSON.stringify({ nums: [0,0,1,1,2,2,3,3,4,4,5] }), expectedOutput: JSON.stringify(5), isHidden: true },
  ],
},
  {
  title: `Valid Anagram`,
  slug: `valid-anagram`,
  difficulty: `Easy`,
  category: `Strings`,
  description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise. An anagram is a word formed by rearranging the letters of another word.`,
  constraints: `- \`1 <= s.length, t.length <= 5 * 10^4\`
- \`s\` and \`t\` consist of lowercase English letters.`,
  examples: [
    { input: `s = "anagram", t = "nagaram"`, output: `true` },
    { input: `s = "rat", t = "car"`, output: `false` },
  ],
  starterCode: {
    javascript: `function isAnagram(s,t){if(s.length!==t.length)return false;const c={};for(const ch of s)c[ch]=(c[ch]||0)+1;for(const ch of t){if(!c[ch])return false;c[ch]--}return true}`,
    typescript: `function isAnagram(s:string,t:string):boolean{
  if(s.length!==t.length)return false;
  const c=new Array(26).fill(0);
  for(const ch of s)c[ch.charCodeAt(0)-97]++;
  for(const ch of t){const i=ch.charCodeAt(0)-97;c[i]--;if(c[i]<0)return false;}
  return true;
}`,
    python: `def is_anagram(s,t):
    if len(s)!=len(t):return False
    c={}
    for ch in s:c[ch]=c.get(ch,0)+1
    for ch in t:
        if ch not in c:return False
        c[ch]-=1
        if c[ch]==0:del c[ch]
    return len(c)==0`,
    java: `import java.util.*;
class Solution{
  public boolean isAnagram(String s,String t){
    if(s.length()!=t.length())return false;
    int[]c=new int[26];
    for(char ch:s.toCharArray())c[ch-'a']++;
    for(char ch:t.toCharArray()){c[ch-'a']--;if(c[ch-'a']<0)return false;}
    return true;
  }
}`,
    cpp: `#include<string>
#include<vector>
using namespace std;
class Solution{
public:
  bool isAnagram(string s,string t){
    if(s.size()!=t.size())return false;
    vector<int>c(26,0);
    for(char ch:s)c[ch-'a']++;
    for(char ch:t){c[ch-'a']--;if(c[ch-'a']<0)return false;}
    return true;
  }
};`,
    c: `#include<stdbool.h>
#include<string.h>
bool isAnagram(char*s,char*t){
  int l1=strlen(s),l2=strlen(t);
  if(l1!=l2)return false;
  int c[26]={0};
  for(int i=0;i<l1;i++)c[s[i]-'a']++;
  for(int i=0;i<l2;i++){c[t[i]-'a']--;if(c[t[i]-'a']<0)return false;}
  return true;
}`,
    go: `func isAnagram(s string,t string)bool{
  if len(s)!=len(t){return false}
  c:=make([]int,26)
  for i:=0;i<len(s);i++{c[s[i]-'a']++}
  for i:=0;i<len(t);i++{c[t[i]-'a']--;if c[t[i]-'a']<0{return false}}
  return true
}`,
    rust: `fn is_anagram(s:String,t:String)->bool{
  if s.len()!=t.len(){return false}
  let mut c=vec![0i32;26];
  for ch in s.chars(){c[(ch as usize)-97]+=1}
  for ch in t.chars(){let i=(ch as usize)-97;c[i]-=1;if c[i]<0{return false}}
  true
}`,
  },
  tags: ["Strings","HashMap"],
  companies: ["Google","Amazon","Microsoft","Facebook"],
  hints: ["Count character frequencies in both strings.","Compare the frequency counts."],
  editorial: `Use a frequency counter of size 26. Increment for s, decrement for t. If all counts are zero, they are anagrams.`,
  complexity: { time: `O(n)`, space: `O(1)` },
  testCases: [
    { input: JSON.stringify({ s: "anagram", t: "nagaram" }), expectedOutput: JSON.stringify(true), isHidden: false },
    { input: JSON.stringify({ s: "rat", t: "car" }), expectedOutput: JSON.stringify(false), isHidden: false },
    { input: JSON.stringify({ s: "listen", t: "silent" }), expectedOutput: JSON.stringify(true), isHidden: false },
    { input: JSON.stringify({ s: "hello", t: "world" }), expectedOutput: JSON.stringify(false), isHidden: true },
    { input: JSON.stringify({ s: "", t: "" }), expectedOutput: JSON.stringify(true), isHidden: true },
  ],
},
  {
  title: `Contains Duplicate`,
  slug: `contains-duplicate`,
  difficulty: `Easy`,
  category: `HashMap`,
  description: `Given an integer array \`nums\`, return \`true\` if any value appears at least twice in the array, and return \`false\` if every element is distinct.`,
  constraints: `- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\``,
  examples: [
    { input: `nums = [1,2,3,1]`, output: `true` },
    { input: `nums = [1,2,3,4]`, output: `false` },
    { input: `nums = [1,1,1,3,3,4,3,2,4,2]`, output: `true` },
  ],
  starterCode: {
    javascript: `function containsDuplicate(nums){const s=new Set();for(const n of nums){if(s.has(n))return true;s.add(n)}return false}`,
    typescript: `function containsDuplicate(nums:number[]):boolean{
  const s=new Set<number>();
  for(const n of nums){if(s.has(n))return true;s.add(n)}
  return false;
}`,
    python: `def contains_duplicate(nums):
    s=set()
    for n in nums:
        if n in s:return True
        s.add(n)
    return False`,
    java: `import java.util.*;
class Solution{
  public boolean containsDuplicate(int[]nums){
    Set<Integer>s=new HashSet<>();
    for(int n:nums){if(s.contains(n))return true;s.add(n)}
    return false;
  }
}`,
    cpp: `#include<vector>
#include<unordered_set>
using namespace std;
class Solution{
public:
  bool containsDuplicate(vector<int>&nums){
    unordered_set<int>s;
    for(int n:nums){if(s.count(n))return true;s.insert(n)}
    return false;
  }
};`,
    c: `#include<stdbool.h>
bool containsDuplicate(int*nums,int numsSize){
  for(int i=0;i<numsSize;i++)for(int j=i+1;j<numsSize;j++)if(nums[i]==nums[j])return true;
  return false;
}`,
    go: `func containsDuplicate(nums[]int)bool{
  s:=make(map[int]bool)
  for_,n:=range nums{if s[n]{return true};s[n]=true}
  return false
}`,
    rust: `fn contains_duplicate(nums:Vec<i32>)->bool{
  use std::collections::HashSet;
  let mut s=HashSet::new();
  for&n in&nums{if s.contains(&n){return true}s.insert(n)}
  false
}`,
  },
  tags: ["HashMap"],
  companies: ["Amazon","Google","Microsoft","Apple"],
  hints: ["Use a hash set to track seen elements.","If an element is already in the set, return true."],
  editorial: `Use a hash set. Iterate through the array; if an element is already in the set, return true. Otherwise add it to the set.`,
  complexity: { time: `O(n)`, space: `O(n)` },
  testCases: [
    { input: JSON.stringify({ nums: [1,2,3,1] }), expectedOutput: JSON.stringify(true), isHidden: false },
    { input: JSON.stringify({ nums: [1,2,3,4] }), expectedOutput: JSON.stringify(false), isHidden: false },
    { input: JSON.stringify({ nums: [1] }), expectedOutput: JSON.stringify(false), isHidden: false },
    { input: JSON.stringify({ nums: [1,1,1,3,3,4,3,2,4,2] }), expectedOutput: JSON.stringify(true), isHidden: true },
    { input: JSON.stringify({ nums: [0,0] }), expectedOutput: JSON.stringify(true), isHidden: true },
  ],
},
  {
  title: `Ransom Note`,
  slug: `ransom-note`,
  difficulty: `Easy`,
  category: `HashMap`,
  description: `Given two strings \`ransomNote\` and \`magazine\`, return \`true\` if \`ransomNote\` can be constructed by using the letters from \`magazine\`. Each letter in \`magazine\` can only be used once.`,
  constraints: `- \`1 <= ransomNote.length, magazine.length <= 10^5\`
- Both strings consist of lowercase English letters.`,
  examples: [
    { input: `ransomNote = "a", magazine = "b"`, output: `false` },
    { input: `ransomNote = "aa", magazine = "ab"`, output: `false` },
    { input: `ransomNote = "aa", magazine = "aab"`, output: `true` },
  ],
  starterCode: {
    javascript: `function canConstruct(r,m){const c={};for(const ch of m)c[ch]=(c[ch]||0)+1;for(const ch of r){if(!c[ch])return false;c[ch]--}return true}`,
    typescript: `function canConstruct(r:string,m:string):boolean{
  const c=new Array(26).fill(0);
  for(const ch of m)c[ch.charCodeAt(0)-97]++;
  for(const ch of r){const i=ch.charCodeAt(0)-97;if(c[i]===0)return false;c[i]--;}
  return true;
}`,
    python: `def can_construct(r,m):
    c={}
    for ch in m:c[ch]=c.get(ch,0)+1
    for ch in r:
        if ch not in c:return False
        c[ch]-=1
        if c[ch]==0:del c[ch]
    return True`,
    java: `import java.util.*;
class Solution{
  public boolean canConstruct(String r,String m){
    int[]c=new int[26];
    for(char ch:m.toCharArray())c[ch-'a']++;
    for(char ch:r.toCharArray()){if(c[ch-'a']==0)return false;c[ch-'a']--;}
    return true;
  }
}`,
    cpp: `#include<string>
#include<vector>
using namespace std;
class Solution{
public:
  bool canConstruct(string r,string m){
    vector<int>c(26,0);
    for(char ch:m)c[ch-'a']++;
    for(char ch:r){if(c[ch-'a']==0)return false;c[ch-'a']--;}
    return true;
  }
};`,
    c: `#include<stdbool.h>
#include<string.h>
bool canConstruct(char*r,char*m){
  int c[26]={0};
  for(int i=0;m[i];i++)c[m[i]-'a']++;
  for(int i=0;r[i];i++){int idx=r[i]-'a';if(c[idx]==0)return false;c[idx]--;}
  return true;
}`,
    go: `func canConstruct(r string,m string)bool{
  c:=make([]int,26)
  for i:=0;i<len(m);i++{c[m[i]-'a']++}
  for i:=0;i<len(r);i++{idx:=r[i]-'a';if c[idx]==0{return false};c[idx]--}
  return true
}`,
    rust: `fn can_construct(r:String,m:String)->bool{
  let mut c=vec![0i32;26];
  for ch in m.chars(){c[(ch as usize)-97]+=1}
  for ch in r.chars(){let i=(ch as usize)-97;if c[i]==0{return false};c[i]-=1}
  true
}`,
  },
  tags: ["HashMap","Strings"],
  companies: ["Apple","Microsoft"],
  hints: ["Count character frequencies in magazine.","Check if ransomNote can be formed from those counts."],
  editorial: `Count letters in magazine, then decrement for each letter in ransomNote. If any count goes negative, return false.`,
  complexity: { time: `O(m + n)`, space: `O(1)` },
  testCases: [
    { input: JSON.stringify({ ransomNote: "a", magazine: "b" }), expectedOutput: JSON.stringify(false), isHidden: false },
    { input: JSON.stringify({ ransomNote: "aa", magazine: "ab" }), expectedOutput: JSON.stringify(false), isHidden: false },
    { input: JSON.stringify({ ransomNote: "aa", magazine: "aab" }), expectedOutput: JSON.stringify(true), isHidden: false },
    { input: JSON.stringify({ ransomNote: "abc", magazine: "abcdef" }), expectedOutput: JSON.stringify(true), isHidden: true },
    { input: JSON.stringify({ ransomNote: "", magazine: "anything" }), expectedOutput: JSON.stringify(true), isHidden: true },
  ],
},
  {
  title: `Word Pattern`,
  slug: `word-pattern`,
  difficulty: `Easy`,
  category: `HashMap`,
  description: `Given a \`pattern\` and a string \`s\`, find if \`s\` follows the same pattern. A bijection mapping must exist between each letter in pattern and each word in s.`,
  constraints: `- \`1 <= pattern.length <= 300\`
- \`1 <= s.length <= 3000\`
- \`pattern\` contains only lowercase letters.
- \`s\` contains only lowercase letters and spaces.`,
  examples: [
    { input: `pattern = "abba", s = "dog cat cat dog"`, output: `true` },
    { input: `pattern = "abba", s = "dog cat cat fish"`, output: `false` },
    { input: `pattern = "aaaa", s = "dog cat cat dog"`, output: `false` },
  ],
  starterCode: {
    javascript: `function wordPattern(p,s){const w=s.split(' ');if(p.length!==w.length)return false;const c2w=new Map(),w2c=new Map();for(let i=0;i<p.length;i++){const c=p[i],wrd=w[i];if(c2w.has(c)&&c2w.get(c)!==wrd)return false;if(w2c.has(wrd)&&w2c.get(wrd)!==c)return false;c2w.set(c,wrd);w2c.set(wrd,c)}return true}`,
    typescript: `function wordPattern(p:string,s:string):boolean{
  const w=s.split(' ');
  if(p.length!==w.length)return false;
  const c2w=new Map<string,string>(),w2c=new Map<string,string>();
  for(let i=0;i<p.length;i++){
    const c=p[i],wd=w[i];
    if(c2w.has(c)&&c2w.get(c)!==wd)return false;
    if(w2c.has(wd)&&w2c.get(wd)!==c)return false;
    c2w.set(c,wd);w2c.set(wd,c);
  }
  return true;
}`,
    python: `def word_pattern(p,s):
    w=s.split()
    if len(p)!=len(w):return False
    c2w,w2c={},{}
    for c,wd in zip(p,w):
        if c in c2w and c2w[c]!=wd:return False
        if wd in w2c and w2c[wd]!=c:return False
        c2w[c],w2c[wd]=wd,c
    return True`,
    java: `import java.util.*;
class Solution{
  public boolean wordPattern(String p,String s){
    String[]w=s.split(" ");
    if(p.length()!=w.length)return false;
    Map<Character,String>c2w=new HashMap<>();
    Map<String,Character>w2c=new HashMap<>();
    for(int i=0;i<p.length();i++){
      char c=p.charAt(i);String wd=w[i];
      if(c2w.containsKey(c)&&!c2w.get(c).equals(wd))return false;
      if(w2c.containsKey(wd)&&w2c.get(wd)!=c)return false;
      c2w.put(c,wd);w2c.put(wd,c);
    }
    return true;
  }
}`,
    cpp: `#include<string>
#include<vector>
#include<unordered_map>
#include<sstream>
using namespace std;
class Solution{
public:
  bool wordPattern(string p,string s){
    vector<string>w;istringstream iss(s);string wd;
    while(iss>>wd)w.push_back(wd);
    if(p.size()!=w.size())return false;
    unordered_map<char,string>c2w;unordered_map<string,char>w2c;
    for(int i=0;i<p.size();i++){
      char c=p[i];string wd=w[i];
      if(c2w.count(c)&&c2w[c]!=wd)return false;
      if(w2c.count(wd)&&w2c[wd]!=c)return false;
      c2w[c]=wd;w2c[wd]=c;
    }
    return true;
  }
};`,
    c: `#include<stdbool.h>
#include<string.h>
bool wordPattern(char*p,char*s){
  char*w[300];int n=0;char*t=strtok(s," ");
  while(t){w[n++]=t;t=strtok(NULL," ");}
  if((int)strlen(p)!=n)return false;
  for(int i=0;i<n;i++){
    for(int j=i+1;j<n;j++)
      if((p[i]==p[j])!=(strcmp(w[i],w[j])==0))return false;
  }
  return true;
}`,
    go: `func wordPattern(p string,s string)bool{
  w:=strings.Split(s," ")
  if len(p)!=len(w){return false}
  c2w:=make(map[byte]string);w2c:=make(map[string]byte)
  for i:=0;i<len(p);i++{
    c,wd:=p[i],w[i]
    if v,ok:=c2w[c];ok&&v!=wd{return false}
    if v,ok:=w2c[wd];ok&&v!=c{return false}
    c2w[c]=wd;w2c[wd]=c
  }
  return true
}`,
    rust: `fn word_pattern(p:String,s:String)->bool{
  let w:Vec<&str>=s.split(' ').collect();
  if p.len()!=w.len(){return false}
  use std::collections::HashMap;
  let mut c2w:HashMap<char,&str>=HashMap::new();
  for(i,c)in p.chars().enumerate(){
    let wd=w[i];
    if let Some(&v)=c2w.get(&c){if v!=wd{return false}}
    c2w.insert(c,wd);
  }
  let mut w2c:HashMap<&str,char>=HashMap::new();
  for(i,c)in p.chars().enumerate(){
    let wd=w[i];
    if let Some(&v)=w2c.get(wd){if v!=c{return false}}
    w2c.insert(wd,c);
  }
  true
}`,
  },
  tags: ["HashMap","Strings"],
  companies: ["Google","Amazon","Microsoft"],
  hints: ["Split s into words.","Use two hash maps: one mapping pattern chars to words, another mapping words to pattern chars."],
  editorial: `Split s into words. If lengths differ, return false. Use two maps to ensure bijection between pattern characters and words.`,
  complexity: { time: `O(n)`, space: `O(n)` },
  testCases: [
    { input: JSON.stringify({ pattern: "abba", s: "dog cat cat dog" }), expectedOutput: JSON.stringify(true), isHidden: false },
    { input: JSON.stringify({ pattern: "abba", s: "dog cat cat fish" }), expectedOutput: JSON.stringify(false), isHidden: false },
    { input: JSON.stringify({ pattern: "aaaa", s: "dog cat cat dog" }), expectedOutput: JSON.stringify(false), isHidden: false },
    { input: JSON.stringify({ pattern: "abc", s: "dog cat" }), expectedOutput: JSON.stringify(false), isHidden: true },
    { input: JSON.stringify({ pattern: "jquery", s: "jquery" }), expectedOutput: JSON.stringify(false), isHidden: true },
  ],
},
  {
  title: `Valid Palindrome`,
  slug: `valid-palindrome`,
  difficulty: `Easy`,
  category: `Two Pointers`,
  description: `A phrase is a palindrome if it reads the same forward and backward after converting all uppercase letters to lowercase and removing all non-alphanumeric characters. Given a string \`s\`, return \`true\` if it is a palindrome.`,
  constraints: `- \`1 <= s.length <= 2 * 10^5\`
- \`s\` consists only of printable ASCII characters.`,
  examples: [
    { input: `s = "A man, a plan, a canal: Panama"`, output: `true` },
    { input: `s = "race a car"`, output: `false` },
    { input: `s = " "`, output: `true` },
  ],
  starterCode: {
    javascript: `function isPalindrome(s){let l=0,r=s.length-1;while(l<r){while(l<r&&!/[a-zA-Z0-9]/.test(s[l]))l++;while(l<r&&!/[a-zA-Z0-9]/.test(s[r]))r--;if(s[l].toLowerCase()!==s[r].toLowerCase())return false;l++;r--}return true}`,
    typescript: `function isPalindrome(s:string):boolean{
  let l=0,r=s.length-1;
  while(l<r){
    while(l<r&&!/[a-zA-Z0-9]/.test(s[l]))l++;
    while(l<r&&!/[a-zA-Z0-9]/.test(s[r]))r--;
    if(s[l].toLowerCase()!==s[r].toLowerCase())return false;
    l++;r--;
  }
  return true;
}`,
    python: `def is_palindrome(s):
    l,r=0,len(s)-1
    while l<r:
        while l<r and not s[l].isalnum():l+=1
        while l<r and not s[r].isalnum():r-=1
        if s[l].lower()!=s[r].lower():return False
        l+=1;r-=1
    return True`,
    java: `class Solution{
  public boolean isPalindrome(String s){
    int l=0,r=s.length()-1;
    while(l<r){
      while(l<r&&!Character.isLetterOrDigit(s.charAt(l)))l++;
      while(l<r&&!Character.isLetterOrDigit(s.charAt(r)))r--;
      if(Character.toLowerCase(s.charAt(l))!=Character.toLowerCase(s.charAt(r)))return false;
      l++;r--;
    }
    return true;
  }
}`,
    cpp: `#include<string>
#include<cctype>
using namespace std;
class Solution{
public:
  bool isPalindrome(string s){
    int l=0,r=s.size()-1;
    while(l<r){
      while(l<r&&!isalnum(s[l]))l++;
      while(l<r&&!isalnum(s[r]))r--;
      if(tolower(s[l])!=tolower(s[r]))return false;
      l++;r--;
    }
    return true;
  }
};`,
    c: `#include<stdbool.h>
#include<ctype.h>
#include<string.h>
bool isPalindrome(char*s){
  int l=0,r=strlen(s)-1;
  while(l<r){
    while(l<r&&!isalnum(s[l]))l++;
    while(l<r&&!isalnum(s[r]))r--;
    if(tolower(s[l])!=tolower(s[r]))return false;
    l++;r--;
  }
  return true;
}`,
    go: `func isPalindrome(s string)bool{
  l,r:=0,len(s)-1
  for l<r{
    for l<r&&!isAlnum(s[l]){l++}
    for l<r&&!isAlnum(s[r]){r--}
    if toLower(s[l])!=toLower(s[r]){return false}
    l++;r--
  }
  return true
}
func isAlnum(c byte)bool{return(c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9')}
func toLower(c byte)byte{if c>='A'&&c<='Z'{return c+32};return c}`,
    rust: `fn is_palindrome(s:String)->bool{
  let c:Vec<char>=s.chars().filter(|c|c.is_alphanumeric()).map(|c|c.to_ascii_lowercase()).collect();
  let l=c.len();
  for i in 0..l/2{if c[i]!=c[l-1-i]{return false}}
  true
}`,
  },
  tags: ["Two Pointers","Strings"],
  companies: ["Google","Amazon","Facebook"],
  hints: ["Use two pointers from both ends.","Skip non-alphanumeric characters.","Compare characters case-insensitively."],
  editorial: `Use two pointers, one at start and one at end. Skip non-alphanumeric characters and compare lowercase versions. If mismatch, return false.`,
  complexity: { time: `O(n)`, space: `O(1)` },
  testCases: [
    { input: JSON.stringify({ s: "A man, a plan, a canal: Panama" }), expectedOutput: JSON.stringify(true), isHidden: false },
    { input: JSON.stringify({ s: "race a car" }), expectedOutput: JSON.stringify(false), isHidden: false },
    { input: JSON.stringify({ s: " " }), expectedOutput: JSON.stringify(true), isHidden: false },
    { input: JSON.stringify({ s: "hello" }), expectedOutput: JSON.stringify(false), isHidden: true },
    { input: JSON.stringify({ s: "a" }), expectedOutput: JSON.stringify(true), isHidden: true },
  ],
},
  {
  title: `Move Zeroes`,
  slug: `move-zeroes`,
  difficulty: `Easy`,
  category: `Two Pointers`,
  description: `Given an integer array \`nums\`, move all 0's to the end of it while maintaining the relative order of the non-zero elements. Do this in-place without making a copy of the array.`,
  constraints: `- \`1 <= nums.length <= 10^4\`
- \`-2^31 <= nums[i] <= 2^31 - 1\``,
  examples: [
    { input: `nums = [0,1,0,3,12]`, output: `[1,3,12,0,0]` },
    { input: `nums = [0]`, output: `[0]` },
  ],
  starterCode: {
    javascript: `function moveZeroes(n){let w=0;for(let r=0;r<n.length;r++){if(n[r]!==0){n[w]=n[r];w++}}for(let i=w;i<n.length;i++)n[i]=0}`,
    typescript: `function moveZeroes(n:number[]):void{
  let w=0;
  for(let r=0;r<n.length;r++){if(n[r]!==0){n[w]=n[r];w++}}
  for(let i=w;i<n.length;i++)n[i]=0;
}`,
    python: `def move_zeroes(n):
    w=0
    for r in range(len(n)):
        if n[r]!=0:n[w]=n[r];w+=1
    for i in range(w,len(n)):n[i]=0`,
    java: `class Solution{
  public void moveZeroes(int[]n){
    int w=0;
    for(int r=0;r<n.length;r++){if(n[r]!=0){n[w]=n[r];w++;}}
    for(int i=w;i<n.length;i++)n[i]=0;
  }
}`,
    cpp: `#include<vector>
using namespace std;
class Solution{
public:
  void moveZeroes(vector<int>&n){
    int w=0;
    for(int r=0;r<n.size();r++){if(n[r]!=0)n[w++]=n[r];}
    for(int i=w;i<n.size();i++)n[i]=0;
  }
};`,
    c: `void moveZeroes(int*n,int nSize){
  int w=0;
  for(int r=0;r<nSize;r++){if(n[r]!=0)n[w++]=n[r];}
  for(int i=w;i<nSize;i++)n[i]=0;
}`,
    go: `func moveZeroes(n[]int){
  w:=0
  for_,v:=range n{if v!=0{n[w]=v;w++}}
  for i:=w;i<len(n);i++{n[i]=0}
}`,
    rust: `fn move_zeroes(n:&mut Vec<i32>){
  let mut w=0;let len=n.len();let mut i=0;
  while i<len{
    if n[i]!=0{n[w]=n[i];w+=1}
    i+=1
  }
  for i in w..len{n[i]=0}
}`,
  },
  tags: ["Two Pointers","Arrays"],
  companies: ["Google","Amazon","Facebook"],
  hints: ["Use a pointer to track where the next non-zero should go.","Swap non-zero elements forward."],
  editorial: `Use pointer to track position for next non-zero. Iterate; when a non-zero is found, swap it with the element at the pointer and advance.`,
  complexity: { time: `O(n)`, space: `O(1)` },
  testCases: [
    { input: JSON.stringify({ nums: [0,1,0,3,12] }), expectedOutput: JSON.stringify([1,3,12,0,0]), isHidden: false },
    { input: JSON.stringify({ nums: [0] }), expectedOutput: JSON.stringify([0]), isHidden: false },
    { input: JSON.stringify({ nums: [0,1] }), expectedOutput: JSON.stringify([1,0]), isHidden: false },
    { input: JSON.stringify({ nums: [0,1,0] }), expectedOutput: JSON.stringify([1,0,0]), isHidden: true },
    { input: JSON.stringify({ nums: [1,2,3] }), expectedOutput: JSON.stringify([1,2,3]), isHidden: true },
  ],
},
  {
  title: `Remove Duplicates from Sorted Array`,
  slug: `remove-duplicates-from-sorted-array`,
  difficulty: `Easy`,
  category: `Two Pointers`,
  description: `Given an integer array \`nums\` sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. Return the number of unique elements.`,
  constraints: `- \`1 <= nums.length <= 3 * 10^4\`
- \`-100 <= nums[i] <= 100\`
- \`nums\` is sorted in non-decreasing order.`,
  examples: [
    { input: `nums = [1,1,2]`, output: `2`, explanation: `First two elements are 1 and 2.` },
    { input: `nums = [0,0,1,1,1,2,2,3,3,4]`, output: `5`, explanation: `First five elements are 0,1,2,3,4.` },
  ],
  starterCode: {
    javascript: `function removeDuplicates(n){if(n.length===0)return 0;let k=1;for(let i=1;i<n.length;i++){if(n[i]!==n[i-1]){n[k]=n[i];k++}}return k}`,
    typescript: `function removeDuplicates(n:number[]):number{
  if(n.length===0)return 0;
  let k=1;
  for(let i=1;i<n.length;i++){if(n[i]!==n[i-1]){n[k]=n[i];k++}}
  return k;
}`,
    python: `def remove_duplicates(n):
    if not n:return 0
    k=1
    for i in range(1,len(n)):
        if n[i]!=n[i-1]:n[k]=n[i];k+=1
    return k`,
    java: `class Solution{
  public int removeDuplicates(int[]n){
    if(n.length==0)return 0;
    int k=1;
    for(int i=1;i<n.length;i++){if(n[i]!=n[i-1]){n[k]=n[i];k++;}}
    return k;
  }
}`,
    cpp: `#include<vector>
using namespace std;
class Solution{
public:
  int removeDuplicates(vector<int>&n){
    if(n.empty())return 0;
    int k=1;
    for(int i=1;i<n.size();i++){if(n[i]!=n[i-1])n[k++]=n[i];}
    return k;
  }
};`,
    c: `int removeDuplicates(int*n,int nSize){
  if(nSize==0)return 0;
  int k=1;
  for(int i=1;i<nSize;i++){if(n[i]!=n[i-1])n[k++]=n[i];}
  return k;
}`,
    go: `func removeDuplicates(n[]int)int{
  if len(n)==0{return 0}
  k:=1
  for i:=1;i<len(n);i++{if n[i]!=n[i-1]{n[k]=n[i];k++}}
  return k
}`,
    rust: `fn remove_duplicates(n:&mut Vec<i32>)->i32{
  if n.is_empty(){return 0}
  let mut k=1;
  for i in 1..n.len(){if n[i]!=n[i-1]{n[k]=n[i];k+=1}}
  k as i32
}`,
  },
  tags: ["Two Pointers","Arrays"],
  companies: ["Google","Amazon","Microsoft","Apple"],
  hints: ["Use a slow pointer for the position of unique elements.","Use a fast pointer to scan through the array."],
  editorial: `Use two pointers: one slow pointer for writing unique elements, one fast pointer for scanning. When a new unique element is found, write it at the slow pointer position.`,
  complexity: { time: `O(n)`, space: `O(1)` },
  testCases: [
    { input: JSON.stringify({ nums: [1,1,2] }), expectedOutput: JSON.stringify(2), isHidden: false },
    { input: JSON.stringify({ nums: [0,0,1,1,1,2,2,3,3,4] }), expectedOutput: JSON.stringify(5), isHidden: false },
    { input: JSON.stringify({ nums: [1,2,3] }), expectedOutput: JSON.stringify(3), isHidden: false },
    { input: JSON.stringify({ nums: [1,1,1] }), expectedOutput: JSON.stringify(1), isHidden: true },
    { input: JSON.stringify({ nums: [] }), expectedOutput: JSON.stringify(0), isHidden: true },
  ],
},
  {
  title: `Valid Parentheses`,
  slug: `valid-parentheses`,
  difficulty: `Easy`,
  category: `Stack`,
  description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid. Open brackets must be closed by the same type and in the correct order.`,
  constraints: `- \`1 <= s.length <= 10^4\`
- \`s\` consists of parentheses only \`'()[]{}'\`.`,
  examples: [
    { input: `s = "()"`, output: `true` },
    { input: `s = "()[]{}"`, output: `true` },
    { input: `s = "(]"`, output: `false` },
    { input: `s = "([)]"`, output: `false` },
  ],
  starterCode: {
    javascript: `function isValid(s){const st=[];const p={')':'(',']':'[','}':'{'};for(const ch of s){if(ch in p){if(st.pop()!==p[ch])return false}else st.push(ch)}return st.length===0}`,
    typescript: `function isValid(s:string):boolean{
  const st:string[]=[];
  const p:Record<string,string>={')':'(',']':'[','}':'{'};
  for(const ch of s){
    if(ch in p){if(st.pop()!==p[ch])return false}
    else{st.push(ch)}
  }
  return st.length===0;
}`,
    python: `def is_valid(s):
    st=[]
    p={')':'(',']':'[','}':'{'}
    for ch in s:
        if ch in p:
            if not st or st.pop()!=p[ch]:return False
        else:st.append(ch)
    return len(st)==0`,
    java: `import java.util.*;
class Solution{
  public boolean isValid(String s){
    Stack<Character>st=new Stack<>();
    Map<Character,Character>p=Map.of(')','(','[','[','}','{');
    for(char ch:s.toCharArray()){
      if(p.containsKey(ch)){
        if(st.isEmpty()||st.pop()!=p.get(ch))return false;
      }else st.push(ch);
    }
    return st.isEmpty();
  }
}`,
    cpp: `#include<string>
#include<stack>
#include<unordered_map>
using namespace std;
class Solution{
public:
  bool isValid(string s){
    stack<char>st;
    unordered_map<char,char>p={{')','('},{']','['},{'}','{'}};
    for(char ch:s){
      if(p.count(ch)){
        if(st.empty()||st.top()!=p[ch])return false;st.pop();
      }else st.push(ch);
    }
    return st.empty();
  }
};`,
    c: `#include<stdbool.h>
#include<string.h>
bool isValid(char*s){
  char st[10000];int t=-1;
  for(int i=0;s[i];i++){
    char ch=s[i];
    if(ch=='('||ch=='['||ch=='{')st[++t]=ch;
    else{
      if(t<0)return false;
      if((ch==')'&&st[t]!='(')||(ch==']'&&st[t]!='[')||(ch=='}'&&st[t]!='{'))return false;
      t--;
    }
  }
  return t==-1;
}`,
    go: `func isValid(s string)bool{
  st:=make([]byte,0)
  p:=map[byte]byte{')':'(',']':'[','}':'{'}
  for i:=0;i<len(s);i++{
    ch:=s[i]
    if v,ok:=p[ch];ok{
      if len(st)==0||st[len(st)-1]!=v{return false}
      st=st[:len(st)-1]
    }else{st=append(st,ch)}
  }
  return len(st)==0
}`,
    rust: `fn is_valid(s:String)->bool{
  let mut st:Vec<char>=Vec::new();
  for ch in s.chars(){
    match ch{
      '('|'['|'{'=>st.push(ch),
      ')'=>if st.pop()!=Some('('){return false},
      ']'=>if st.pop()!=Some('['){return false},
      '}'=>if st.pop()!=Some('{'){return false},
      _=>{}
    }
  }
  st.is_empty()
}`,
  },
  tags: ["Stack","Strings"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Use a stack to track opening brackets.","When you see a closing bracket, check if it matches the top of the stack."],
  editorial: `Use a stack. Push opening brackets. For closing brackets, check if the stack top matches. At the end, stack must be empty.`,
  complexity: { time: `O(n)`, space: `O(n)` },
  testCases: [
    { input: JSON.stringify({ s: "()" }), expectedOutput: JSON.stringify(true), isHidden: false },
    { input: JSON.stringify({ s: "()[]{}" }), expectedOutput: JSON.stringify(true), isHidden: false },
    { input: JSON.stringify({ s: "(]" }), expectedOutput: JSON.stringify(false), isHidden: false },
    { input: JSON.stringify({ s: "([)]" }), expectedOutput: JSON.stringify(false), isHidden: true },
    { input: JSON.stringify({ s: "{[()]}" }), expectedOutput: JSON.stringify(true), isHidden: true },
    { input: JSON.stringify({ s: "(" }), expectedOutput: JSON.stringify(false), isHidden: true },
  ],
},
  {
  title: `Implement Queue using Stacks`,
  slug: `implement-queue-using-stacks`,
  difficulty: `Easy`,
  category: `Stack`,
  description: `Implement a first-in-first-out (FIFO) queue using only two stacks. The implemented queue should support all normal queue operations: \`push\`, \`pop\`, \`peek\`, and \`empty\`.`,
  constraints: `- \`1 <= x <= 9\`
- At most 100 calls will be made to \`push\`, \`pop\`, \`peek\`, and \`empty\`.
- All calls to \`pop\` and \`peek\` are valid.`,
  examples: [
    { input: `Input: push(1), push(2), peek(), pop(), empty()`, output: `Output: 1, 1, false`, explanation: `Explanation: Queue order should be 1, 2. Peek returns 1, pop removes 1, empty checks if empty.` },
  ],
  starterCode: {
    javascript: `class MyQueue{constructor(){this.i=[];this.o=[]}push(x){this.i.push(x)}pop(){if(this.o.length===0){while(this.i.length)this.o.push(this.i.pop())}return this.o.pop()}peek(){if(this.o.length===0){while(this.i.length)this.o.push(this.i.pop())}return this.o[this.o.length-1]}empty(){return this.i.length===0&&this.o.length===0}}`,
    typescript: `class MyQueue{
  private i:number[]=[];private o:number[]=[];
  push(x:number):void{this.i.push(x)}
  pop():number{if(this.o.length===0){while(this.i.length)this.o.push(this.i.pop()!)}return this.o.pop()!}
  peek():number{if(this.o.length===0){while(this.i.length)this.o.push(this.i.pop()!)}return this.o[this.o.length-1]}
  empty():boolean{return this.i.length===0&&this.o.length===0}
}`,
    python: `class MyQueue:
    def __init__(self):self.i=[];self.o=[]
    def push(self,x):self.i.append(x)
    def pop(self):
        if not self.o:
            while self.i:self.o.append(self.i.pop())
        return self.o.pop()
    def peek(self):
        if not self.o:
            while self.i:self.o.append(self.i.pop())
        return self.o[-1]
    def empty(self):return not self.i and not self.o`,
    java: `import java.util.*;
class MyQueue{
  Stack<Integer>i=new Stack<>(),o=new Stack<>();
  public void push(int x){i.push(x);}
  public int pop(){if(o.isEmpty())while(!i.isEmpty())o.push(i.pop());return o.pop();}
  public int peek(){if(o.isEmpty())while(!i.isEmpty())o.push(i.pop());return o.peek();}
  public boolean empty(){return i.isEmpty()&&o.isEmpty();}
}`,
    cpp: `#include<stack>
using namespace std;
class MyQueue{
public:
  stack<int>i,o;
  void push(int x){i.push(x);}
  int pop(){if(o.empty()){while(!i.empty()){o.push(i.top());i.pop();}}int v=o.top();o.pop();return v;}
  int peek(){if(o.empty()){while(!i.empty()){o.push(i.top());i.pop();}}return o.top();}
  bool empty(){return i.empty()&&o.empty();}
};`,
    c: `typedef struct{int i[100];int o[100];int iT,oT;}MyQueue;
MyQueue*myQueueCreate(){MyQueue*q=(MyQueue*)calloc(1,sizeof(MyQueue));q->iT=-1;q->oT=-1;return q;}
void myQueuePush(MyQueue*q,int x){q->i[++q->iT]=x;}
int myQueuePop(MyQueue*q){if(q->oT<0){while(q->iT>=0)q->o[++q->oT]=q->i[q->iT--];}return q->o[q->oT--];}
int myQueuePeek(MyQueue*q){if(q->oT<0){while(q->iT>=0)q->o[++q->oT]=q->i[q->iT--];}return q->o[q->oT];}
bool myQueueEmpty(MyQueue*q){return q->iT<0&&q->oT<0;}
void myQueueFree(MyQueue*q){free(q);}`,
    go: `type MyQueue struct{i,o[]int}
func Constructor()MyQueue{return MyQueue{}}
func(q*MyQueue)Push(x int){q.i=append(q.i,x)}
func(q*MyQueue)Pop()int{if len(q.o)==0{for len(q.i)>0{q.o=append(q.o,q.i[len(q.i)-1]);q.i=q.i[:len(q.i)-1]}}v:=q.o[len(q.o)-1];q.o=q.o[:len(q.o)-1];return v}
func(q*MyQueue)Peek()int{if len(q.o)==0{for len(q.i)>0{q.o=append(q.o,q.i[len(q.i)-1]);q.i=q.i[:len(q.i)-1]}}return q.o[len(q.o)-1]}
func(q*MyQueue)Empty()bool{return len(q.i)==0&&len(q.o)==0}`,
    rust: `struct MyQueue{i:Vec<i32>,o:Vec<i32>}
impl MyQueue{
  fn new()->Self{MyQueue{i:Vec::new(),o:Vec::new()}}
  fn push(&mut self,x:i32){self.i.push(x)}
  fn pop(&mut self)->i32{if self.o.is_empty(){while let Some(v)=self.i.pop(){self.o.push(v)}}self.o.pop().unwrap()}
  fn peek(&mut self)->i32{if self.o.is_empty(){while let Some(v)=self.i.pop(){self.o.push(v)}}*self.o.last().unwrap()}
  fn empty(&self)->bool{self.i.is_empty()&&self.o.is_empty()}
}`,
  },
  tags: ["Stack","Design"],
  companies: ["Google","Amazon","Microsoft"],
  hints: ["Use one stack for input, one for output.","When output stack is empty, transfer all from input stack."],
  editorial: `Use two stacks: input and output. On push, push to input stack. On pop/peek, if output is empty, transfer all elements from input to output (reversing order).`,
  complexity: { time: `O(1) amortized`, space: `O(n)` },
  testCases: [
    { input: JSON.stringify({ operations: ["MyQueue","push","push","peek","pop","empty"], args: [[],[1],[2],[],[],[]] }), expectedOutput: JSON.stringify([null,null,null,1,1,false]), isHidden: false },
    { input: JSON.stringify({ operations: ["MyQueue","push","pop","empty"], args: [[],[1],[],[]] }), expectedOutput: JSON.stringify([null,null,1,true]), isHidden: false },
    { input: JSON.stringify({ operations: ["MyQueue","push","push","push","pop","pop","pop","empty"], args: [[],[1],[2],[3],[],[],[],[]] }), expectedOutput: JSON.stringify([null,null,null,null,1,2,3,true]), isHidden: true },
  ],
}
];
