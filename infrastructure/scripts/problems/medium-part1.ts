import type { SeedProblem } from "./types";
import { jsFn, pyFn, javaCls, cppCls, cFn, goFn, rustFn } from "./types";

export const mediumProblemsPart1: SeedProblem[] = [
  {
  title: `Longest Substring Without Repeating Characters`,
  slug: `longest-substring-without-repeating-characters`,
  difficulty: `Medium`,
  category: `Sliding Window`,
  description: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
  constraints: `- \`0 <= s.length <= 5 * 10^4\`
- \`s\` consists of English letters, digits, symbols and spaces.`,
  examples: [
    { input: `s = "abcabcbb"`, output: `3`, explanation: `Longest substring is "abc" with length 3.` },
    { input: `s = "bbbbb"`, output: `1`, explanation: `Longest substring is "b".` },
    { input: `s = "pwwkew"`, output: `3`, explanation: `Longest substring is "wke".` },
  ],
  starterCode: {
    javascript: `function lengthOfLongestSubstring(s){let l=0,best=0;const last=new Map();for(let r=0;r<s.length;r++){const ch=s[r];if(last.has(ch)&&last.get(ch)>=l)l=last.get(ch)+1;last.set(ch,r);best=Math.max(best,r-l+1)}return best}`,
    typescript: `function lengthOfLongestSubstring(s:string):number{
  let l=0,best=0;const last=new Map<string,number>();
  for(let r=0;r<s.length;r++){
    const ch=s[r];
    if(last.has(ch)&&last.get(ch)!>=l)l=last.get(ch)!+1;
    last.set(ch,r);best=Math.max(best,r-l+1);
  }
  return best;
}`,
    python: `def length_of_longest_substring(s):
    l=best=0;last={}
    for r,ch in enumerate(s):
        if ch in last and last[ch]>=l:l=last[ch]+1
        last[ch]=r;best=max(best,r-l+1)
    return best`,
    java: `import java.util.*;
class Solution{
  public int lengthOfLongestSubstring(String s){
    int l=0,best=0;Map<Character,Integer>last=new HashMap<>();
    for(int r=0;r<s.length();r++){
      char ch=s.charAt(r);
      if(last.containsKey(ch)&&last.get(ch)>=l)l=last.get(ch)+1;
      last.put(ch,r);best=Math.max(best,r-l+1);
    }
    return best;
  }
}`,
    cpp: `#include<string>
#include<unordered_map>
#include<algorithm>
using namespace std;
class Solution{
public:
  int lengthOfLongestSubstring(string s){
    int l=0,best=0;unordered_map<char,int>last;
    for(int r=0;r<s.size();r++){
      char ch=s[r];
      if(last.count(ch)&&last[ch]>=l)l=last[ch]+1;
      last[ch]=r;best=max(best,r-l+1);
    }
    return best;
  }
};`,
    c: `int lengthOfLongestSubstring(char*s){
  int last[128];for(int i=0;i<128;i++)last[i]=-1;
  int l=0,best=0;
  for(int r=0;s[r];r++){
    unsigned char ch=(unsigned char)s[r];
    if(last[ch]>=l)l=last[ch]+1;
    last[ch]=r;if(r-l+1>best)best=r-l+1;
  }
  return best;
}`,
    go: `func lengthOfLongestSubstring(s string)int{
  l,best:=0,0;last:=make(map[byte]int)
  for r:=0;r<len(s);r++{
    ch:=s[r]
    if v,ok:=last[ch];ok&&v>=l{l=v+1}
    last[ch]=r;if r-l+1>best{best=r-l+1}
  }
  return best
}`,
    rust: `fn length_of_longest_substring(s:String)->i32{
  use std::collections::HashMap;
  let mut l:usize=0;let mut best=0;let mut last:HashMap<char,usize>=HashMap::new();
  for(r,ch)in s.chars().enumerate(){
    if let Some(&prev)=last.get(&ch){if prev>=l{l=prev+1}}
    last.insert(ch,r);best=best.max(r-l+1);
  }
  best as i32
}`,
  },
  tags: ["Sliding Window","Strings"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Use a sliding window with a hash map tracking character positions.","When you see a repeat, move the left pointer past the previous occurrence."],
  editorial: `Use sliding window with two pointers and a hash map tracking each character's last seen position. Expand right pointer; when a repeat is found, move left pointer past the previous occurrence.`,
  complexity: { time: `O(n)`, space: `O(min(n, m))` },
  testCases: [
    { input: JSON.stringify({ s: "abcabcbb" }), expectedOutput: JSON.stringify(3), isHidden: false },
    { input: JSON.stringify({ s: "bbbbb" }), expectedOutput: JSON.stringify(1), isHidden: false },
    { input: JSON.stringify({ s: "pwwkew" }), expectedOutput: JSON.stringify(3), isHidden: false },
    { input: JSON.stringify({ s: "au" }), expectedOutput: JSON.stringify(2), isHidden: true },
    { input: JSON.stringify({ s: "" }), expectedOutput: JSON.stringify(0), isHidden: true },
    { input: JSON.stringify({ s: "dvdf" }), expectedOutput: JSON.stringify(3), isHidden: true },
  ],
},
  {
  title: `3Sum`,
  slug: `3sum`,
  difficulty: `Medium`,
  category: `Two Pointers`,
  description: `Given an integer array \`nums\`, return all triplets \`[nums[i], nums[j], nums[k]]\` such that i, j, k are distinct and nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets.`,
  constraints: `- \`3 <= nums.length <= 3000\`
- \`-10^5 <= nums[i] <= 10^5\``,
  examples: [
    { input: `nums = [-1,0,1,2,-1,-4]`, output: `[[-1,-1,2],[-1,0,1]]` },
    { input: `nums = [0,1,1]`, output: `[]` },
    { input: `nums = [0,0,0]`, output: `[[0,0,0]]` },
  ],
  starterCode: {
    javascript: `function threeSum(n){n.sort((a,b)=>a-b);const r=[];for(let i=0;i<n.length-2;i++){if(n[i]>0)break;if(i>0&&n[i]===n[i-1])continue;let l=i+1,r=n.length-1;while(l<r){const s=n[i]+n[l]+n[r];if(s===0){r.push([n[i],n[l],n[r]]);while(l<r&&n[l]===n[l+1])l++;while(l<r&&n[r]===n[r-1])r--;l++;r--}else if(s<0)l++;else r--}}return r}`,
    typescript: `function threeSum(n:number[]):number[][]{
  n.sort((a,b)=>a-b);const r:number[][]=[];
  for(let i=0;i<n.length-2;i++){
    if(n[i]>0)break;
    if(i>0&&n[i]===n[i-1])continue;
    let l=i+1,r=n.length-1;
    while(l<r){
      const s=n[i]+n[l]+n[r];
      if(s===0){
        r.push([n[i],n[l],n[r]]);
        while(l<r&&n[l]===n[l+1])l++;
        while(l<r&&n[r]===n[r-1])r--;
        l++;r--;
      }else if(s<0)l++;else r--;
    }
  }
  return r;
}`,
    python: `def three_sum(n):
    n.sort();r=[]
    for i in range(len(n)-2):
        if n[i]>0:break
        if i>0 and n[i]==n[i-1]:continue
        l,r=i+1,len(n)-1
        while l<r:
            s=n[i]+n[l]+n[r]
            if s==0:
                r.append([n[i],n[l],n[r]])
                while l<r and n[l]==n[l+1]:l+=1
                while l<r and n[r]==n[r-1]:r-=1
                l+=1;r-=1
            elif s<0:l+=1
            else:r-=1
    return r`,
    java: `import java.util.*;
class Solution{
  public List<List<Integer>>threeSum(int[]n){
    Arrays.sort(n);List<List<Integer>>r=new ArrayList<>();
    for(int i=0;i<n.length-2;i++){
      if(n[i]>0)break;
      if(i>0&&n[i]==n[i-1])continue;
      int l=i+1,r=n.length-1;
      while(l<r){
        int s=n[i]+n[l]+n[r];
        if(s==0){
          r.add(Arrays.asList(n[i],n[l],n[r]));
          while(l<r&&n[l]==n[l+1])l++;
          while(l<r&&n[r]==n[r-1])r--;
          l++;r--;
        }else if(s<0)l++;else r--;
      }
    }
    return r;
  }
}`,
    cpp: `#include<vector>
#include<algorithm>
using namespace std;
class Solution{
public:
  vector<vector<int>>threeSum(vector<int>&n){
    sort(n.begin(),n.end());vector<vector<int>>r;
    for(int i=0;i<(int)n.size()-2;i++){
      if(n[i]>0)break;
      if(i>0&&n[i]==n[i-1])continue;
      int l=i+1,r=n.size()-1;
      while(l<r){
        int s=n[i]+n[l]+n[r];
        if(s==0){
          r.push_back({n[i],n[l],n[r]});
          while(l<r&&n[l]==n[l+1])l++;
          while(l<r&&n[r]==n[r-1])r--;
          l++;r--;
        }else if(s<0)l++;else r--;
      }
    }
    return r;
  }
};`,
    c: `int**threeSum(int*n,int nSiz,int*retSize,int**retColSiz){*retSize=0;return NULL;}`,
    go: `import"sort"
func threeSum(n[]int)[][]int{
  sort.Ints(n);r:=[][]int{}
  for i:=0;i<len(n)-2;i++{
    if n[i]>0{break}
    if i>0&&n[i]==n[i-1]{continue}
    l,r:=i+1,len(n)-1
    for l<r{
      s:=n[i]+n[l]+n[r]
      if s==0{
        r=append(r,[]int{n[i],n[l],n[r]})
        for l<r&&n[l]==n[l+1]{l++}
        for l<r&&n[r]==n[r-1]{r--}
        l++;r--
      }else if s<0{l++}else{r--}
    }
  }
  return r
}`,
    rust: `fn three_sum(n:Vec<i32>)->Vec<Vec<i32>>{
  let mut m=n;m.sort();let len=m.len();let mut r:Vec<Vec<i32>>=Vec::new();
  for i in 0..len{
    if i>0&&m[i]==m[i-1]{continue}
    let mut l=i+1;let mut r=len-1;
    while l<r{
      let s=m[i]+m[l]+m[r];
      if s==0{
        r.push(vec![m[i],m[l],m[r]]);
        while l<r&&m[l]==m[l+1]{l+=1}
        while l<r&&m[r]==m[r-1]{r-=1}
        l+=1;r-=1;
      }else if s<0{l+=1}else{r-=1}
    }
  }
  r
}`,
  },
  tags: ["Two Pointers","Arrays"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Sort the array first.","Fix one element, then use two pointers for the remaining two."],
  editorial: `Sort the array. For each element, use two pointers to find pairs that sum to the negation. Skip duplicates to avoid duplicate triplets.`,
  complexity: { time: `O(n^2)`, space: `O(1) or O(n)` },
  testCases: [
    { input: JSON.stringify({ nums: [-1,0,1,2,-1,-4] }), expectedOutput: JSON.stringify([[-1,-1,2],[-1,0,1]]), isHidden: false },
    { input: JSON.stringify({ nums: [0,1,1] }), expectedOutput: JSON.stringify([]), isHidden: false },
    { input: JSON.stringify({ nums: [0,0,0] }), expectedOutput: JSON.stringify([[0,0,0]]), isHidden: false },
    { input: JSON.stringify({ nums: [-2,0,0,2,2] }), expectedOutput: JSON.stringify([[-2,0,2]]), isHidden: true },
    { input: JSON.stringify({ nums: [1,2,-2,-1] }), expectedOutput: JSON.stringify([]), isHidden: true },
  ],
},
  {
  title: `Add Two Numbers`,
  slug: `add-two-numbers`,
  difficulty: `Medium`,
  category: `Linked List`,
  description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each node contains a single digit. Add the two numbers and return the sum as a linked list.`,
  constraints: `- The number of nodes in each list is in the range \`[1, 100]\`.
- \`0 <= Node.val <= 9\`
- The input is guaranteed to represent a valid non-negative integer.`,
  examples: [
    { input: `l1 = [2,4,3], l2 = [5,6,4]`, output: `[7,0,8]`, explanation: `342 + 465 = 807.` },
    { input: `l1 = [0], l2 = [0]`, output: `[0]` },
    { input: `l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]`, output: `[8,9,9,9,0,0,0,1]` },
  ],
  starterCode: {
    javascript: `function ListNode(v,n){this.val=v===undefined?0:v;this.next=n===undefined?null:n}
function addTwoNumbers(l1,l2){let d=new ListNode(0);let c=d;let carry=0;while(l1||l2||carry){let s=(l1?l1.val:0)+(l2?l2.val:0)+carry;carry=Math.floor(s/10);c.next=new ListNode(s%10);c=c.next;if(l1)l1=l1.next;if(l2)l2=l2.next}return d.next}`,
    typescript: `class ListNode{val:number;next:ListNode|null;constructor(v?:number,n?:ListNode|null){this.val=v??0;this.next=n??null}}
function addTwoNumbers(l1:ListNode|null,l2:ListNode|null):ListNode|null{
  const d=new ListNode(0);let c=d;let carry=0;
  while(l1||l2||carry){
    const s=(l1?.val??0)+(l2?.val??0)+carry;
    carry=Math.floor(s/10);c.next=new ListNode(s%10);c=c.next;
    if(l1)l1=l1.next;if(l2)l2=l2.next;
  }
  return d.next;
}`,
    python: `class ListNode:def __init__(self,v=0,n=None):self.val=v;self.next=n
def add_two_numbers(l1,l2):
    d=ListNode(0);c=d;carry=0
    while l1 or l2 or carry:
        s=(l1.val if l1 else 0)+(l2.val if l2 else 0)+carry
        carry=s//10;c.next=ListNode(s%10);c=c.next
        if l1:l1=l1.next;if l2:l2=l2.next
    return d.next`,
    java: `class ListNode{int val;ListNode next;ListNode(){}ListNode(int v){this.val=v;}ListNode(int v,ListNode n){this.val=v;this.next=n;}}
class Solution{
  public ListNode addTwoNumbers(ListNode l1,ListNode l2){
    ListNode d=new ListNode(0),c=d;int carry=0;
    while(l1!=null||l2!=null||carry!=0){
      int s=(l1!=null?l1.val:0)+(l2!=null?l2.val:0)+carry;
      carry=s/10;c.next=new ListNode(s%10);c=c.next;
      if(l1!=null)l1=l1.next;if(l2!=null)l2=l2.next;
    }
    return d.next;
  }
}`,
    cpp: `struct ListNode{int val;ListNode*next;ListNode():val(0),next(nullptr){}ListNode(int x):val(x),next(nullptr){}ListNode(int x,ListNode*n):val(x),next(n){}};
class Solution{
public:
  ListNode*addTwoNumbers(ListNode*l1,ListNode*l2){
    auto*d=new ListNode(0);auto*c=d;int carry=0;
    while(l1||l2||carry){
      int s=(l1?l1->val:0)+(l2?l2->val:0)+carry;
      carry=s/10;c->next=new ListNode(s%10);c=c->next;
      if(l1)l1=l1->next;if(l2)l2=l2->next;
    }
    return d->next;
  }
};`,
    c: `struct ListNode{int val;struct ListNode*next;};
struct ListNode*addTwoNumbers(struct ListNode*l1,struct ListNode*l2){
  struct ListNode*d=malloc(sizeof(struct ListNode));d->next=NULL;
  struct ListNode*c=d;int carry=0;
  while(l1||l2||carry){
    int s=(l1?l1->val:0)+(l2?l2->val:0)+carry;
    carry=s/10;c->next=malloc(sizeof(struct ListNode));
    c=c->next;c->val=s%10;c->next=NULL;
    if(l1)l1=l1->next;if(l2)l2=l2->next;
  }
  return d->next;
}`,
    go: `type ListNode struct{Val int;Next*ListNode}
func addTwoNumbers(l1*ListNode,l2*ListNode)*ListNode{
  d:=&ListNode{};c:=d;carry:=0
  for l1!=nil||l2!=nil||carry>0{
    s:=carry
    if l1!=nil{s+=l1.Val;l1=l1.Next}
    if l2!=nil{s+=l2.Val;l2=l2.Next}
    carry=s/10;c.Next=&ListNode{Val:s%10};c=c.Next
  }
  return d.Next
}`,
    rust: `fn add_two_numbers(l1:Option<Box<ListNode>>,l2:Option<Box<ListNode>>)->Option<Box<ListNode>>{
  let mut p=l1;let mut q=l2;let mut carry=0;
  std::iter::from_fn(move||{
    let v1=p.as_ref().map_or(0,|n|n.val);let v2=q.as_ref().map_or(0,|n|n.val);
    let s=v1+v2+carry;carry=s/10;
    p=p.and_then(|n|n.next);q=q.and_then(|n|n.next);
    if s==0&&p.is_none()&&q.is_none()&&carry==0{None}else{Some(s%10)}
  }).collect()
}`,
  },
  tags: ["Linked List","Math"],
  companies: ["Amazon","Google","Microsoft","Apple"],
  hints: ["Traverse both lists simultaneously, adding digit by digit.","Keep track of carry."],
  editorial: `Traverse both lists. Sum corresponding digits plus carry. Create a new node with the digit value and carry the tens place.`,
  complexity: { time: `O(max(m,n))`, space: `O(max(m,n))` },
  testCases: [
    { input: JSON.stringify({ l1: [2,4,3], l2: [5,6,4] }), expectedOutput: JSON.stringify([7,0,8]), isHidden: false },
    { input: JSON.stringify({ l1: [0], l2: [0] }), expectedOutput: JSON.stringify([0]), isHidden: false },
    { input: JSON.stringify({ l1: [9,9,9,9,9,9,9], l2: [9,9,9,9] }), expectedOutput: JSON.stringify([8,9,9,9,0,0,0,1]), isHidden: false },
    { input: JSON.stringify({ l1: [1,8], l2: [0] }), expectedOutput: JSON.stringify([1,8]), isHidden: true },
    { input: JSON.stringify({ l1: [5], l2: [5] }), expectedOutput: JSON.stringify([0,1]), isHidden: true },
  ],
},
  {
  title: `Reverse Linked List`,
  slug: `reverse-linked-list`,
  difficulty: `Medium`,
  category: `Linked List`,
  description: `Given the head of a singly linked list, reverse the list and return the reversed list.`,
  constraints: `- The number of nodes is in the range \`[0, 5000]\`.
- \`-5000 <= Node.val <= 5000\``,
  examples: [
    { input: `head = [1,2,3,4,5]`, output: `[5,4,3,2,1]` },
    { input: `head = [1,2]`, output: `[2,1]` },
    { input: `head = []`, output: `[]` },
  ],
  starterCode: {
    javascript: `function ListNode(v,n){this.val=v===undefined?0:v;this.next=n===undefined?null:n}
function reverseList(h){let p=null;let c=h;while(c){let n=c.next;c.next=p;p=c;c=n}return p}`,
    typescript: `class ListNode{val:number;next:ListNode|null;constructor(v?:number,n?:ListNode|null){this.val=v??0;this.next=n??null}}
function reverseList(h:ListNode|null):ListNode|null{
  let p:ListNode|null=null;let c=h;
  while(c){const n=c.next;c.next=p;p=c;c=n}
  return p;
}`,
    python: `class ListNode:def __init__(self,v=0,n=None):self.val=v;self.next=n
def reverse_list(h):
    p,c=None,h
    while c:c.next,p,c=p,c,c.next
    return p`,
    java: `class ListNode{int val;ListNode next;ListNode(){}ListNode(int v){this.val=v;}ListNode(int v,ListNode n){this.val=v;this.next=n;}}
class Solution{
  public ListNode reverseList(ListNode h){
    ListNode p=null,c=h;
    while(c!=null){ListNode n=c.next;c.next=p;p=c;c=n;}
    return p;
  }
}`,
    cpp: `struct ListNode{int val;ListNode*next;ListNode():val(0),next(nullptr){}ListNode(int x):val(x),next(nullptr){}ListNode(int x,ListNode*n):val(x),next(n){}};
class Solution{
public:
  ListNode*reverseList(ListNode*h){
    ListNode*p=nullptr,*c=h;
    while(c){ListNode*n=c->next;c->next=p;p=c;c=n;}
    return p;
  }
};`,
    c: `struct ListNode{int val;struct ListNode*next;};
struct ListNode*reverseList(struct ListNode*h){
  struct ListNode*p=NULL,*c=h;
  while(c){struct ListNode*n=c->next;c->next=p;p=c;c=n;}
  return p;
}`,
    go: `type ListNode struct{Val int;Next*ListNode}
func reverseList(h*ListNode)*ListNode{
  var p*ListNode;c:=h
  for c!=nil{n:=c.Next;c.Next=p;p=c;c=n}
  return p
}`,
    rust: `fn reverse_list(h:Option<Box<ListNode>>)->Option<Box<ListNode>>{
  let mut p:Option<Box<ListNode>>=None;let mut c=h;
  while let Some(mut node)=c{c=node.next;node.next=p;p=Some(node);}
  p
}`,
  },
  tags: ["Linked List"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Use three pointers: prev, current, next.","Iteratively reverse the links.","Alternatively, use recursion."],
  editorial: `Use three pointers (prev, curr, next). Iterate through the list, reversing each node's next pointer to point to the previous node.`,
  complexity: { time: `O(n)`, space: `O(1)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `5,4,3,2,1`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `2,1`, isHidden: false },
    { input: `[object Object]`, expectedOutput: ``, isHidden: false },
    { input: `[object Object]`, expectedOutput: `1`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `3,2,1`, isHidden: true },
  ],
},
  {
  title: `Binary Tree Inorder Traversal`,
  slug: `binary-tree-inorder-traversal`,
  difficulty: `Medium`,
  category: `Trees`,
  description: `Given the root of a binary tree, return the inorder traversal of its nodes' values.`,
  constraints: `- The number of nodes in the tree is in the range \`[0, 100]\`.
- \`-100 <= Node.val <= 100\``,
  examples: [
    { input: `root = [1,null,2,3]`, output: `[1,3,2]` },
    { input: `root = []`, output: `[]` },
    { input: `root = [1]`, output: `[1]` },
  ],
  starterCode: {
    javascript: `function TreeNode(v,l,r){this.val=v===undefined?0:v;this.left=l===undefined?null:l;this.right=r===undefined?null:r}
function inorderTraversal(r){const res=[];const st=[];let c=r;while(c||st.length){while(c){st.push(c);c=c.left}c=st.pop();res.push(c.val);c=c.right}return res}`,
    typescript: `class TreeNode{val:number;left:TreeNode|null;right:TreeNode|null;constructor(v?:number,l?:TreeNode|null,r?:TreeNode|null){this.val=v??0;this.left=l??null;this.right=r??null}}
function inorderTraversal(r:TreeNode|null):number[]{
  const res:number[]=[];const st:TreeNode[]=[];let c=r;
  while(c||st.length){
    while(c){st.push(c);c=c.left}
    c=st.pop()!;res.push(c.val);c=c.right;
  }
  return res;
}`,
    python: `class TreeNode:def __init__(self,v=0,l=None,r=None):self.val=v;self.left=l;self.right=r
def inorder_traversal(r):
    res,st,c=[],[],r
    while c or st:
        while c:st.append(c);c=c.left
        c=st.pop();res.append(c.val);c=c.right
    return res`,
    java: `import java.util.*;
class TreeNode{int val;TreeNode left;TreeNode right;TreeNode(){}TreeNode(int v){this.val=v;}TreeNode(int v,TreeNode l,TreeNode r){this.val=v;this.left=l;this.right=r;}}
class Solution{
  public List<Integer>inorderTraversal(TreeNode r){
    List<Integer>res=new ArrayList<>();Stack<TreeNode>st=new Stack<>();TreeNode c=r;
    while(c!=null||!st.isEmpty()){
      while(c!=null){st.push(c);c=c.left;}
      c=st.pop();res.add(c.val);c=c.right;
    }
    return res;
  }
}`,
    cpp: `#include<vector>
#include<stack>
using namespace std;
struct TreeNode{int val;TreeNode*left;TreeNode*right;TreeNode():val(0),left(nullptr),right(nullptr){}TreeNode(int x):val(x),left(nullptr),right(nullptr){}TreeNode(int x,TreeNode*l,TreeNode*r):val(x),left(l),right(r){}};
class Solution{
public:
  vector<int>inorderTraversal(TreeNode*r){
    vector<int>res;stack<TreeNode*>st;TreeNode*c=r;
    while(c||!st.empty()){
      while(c){st.push(c);c=c->left;}
      c=st.top();st.pop();res.push_back(c->val);c=c->right;
    }
    return res;
  }
};`,
    c: `struct TreeNode{int val;struct TreeNode*left;struct TreeNode*right;};
int*inorderTraversal(struct TreeNode*r,int*retSize){
  int*res=malloc(100*sizeof(int));*retSize=0;
  struct TreeNode*st[100];int t=-1;struct TreeNode*c=r;
  while(c||t>=0){
    while(c){st[++t]=c;c=c->left;}
    c=st[t--];res[(*retSize)++]=c->val;c=c->right;
  }
  return res;
}`,
    go: `type TreeNode struct{Val int;Left*TreeNode;Right*TreeNode}
func inorderTraversal(r*TreeNode)[]int{
  res:=[]int{};st:=[]*TreeNode{};c:=r
  for c!=nil||len(st)>0{
    for c!=nil{st=append(st,c);c=c.Left}
    c=st[len(st)-1];st=st[:len(st)-1]
    res=append(res,c.Val);c=c.Right
  }
  return res
}`,
    rust: `fn inorder_traversal(r:Option<Rc<RefCell<TreeNode>>>)->Vec<i32>{
  let mut res=vec![];let mut st=vec![];let mut c=r;
  while c.is_some()||!st.is_empty(){
    while let Some(node)=c{st.push(Some(node.clone()));c=node.borrow().left.clone();}
    if let Some(Some(node))=st.pop(){res.push(node.borrow().val);c=node.borrow().right.clone();}
  }
  res
}`,
  },
  tags: ["Trees","Stack"],
  companies: ["Amazon","Google","Microsoft"],
  hints: ["Inorder: left subtree, root, right subtree.","Use recursion or an explicit stack."],
  editorial: `Recursively visit left subtree, then root, then right subtree. Or use an explicit stack to simulate the recursion.`,
  complexity: { time: `O(n)`, space: `O(n)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `1,3,2`, isHidden: false },
    { input: `[object Object]`, expectedOutput: ``, isHidden: false },
    { input: `[object Object]`, expectedOutput: `1`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `2,1`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `1,2`, isHidden: true },
  ],
},
  {
  title: `Validate Binary Search Tree`,
  slug: `validate-binary-search-tree`,
  difficulty: `Medium`,
  category: `BST`,
  description: `Given the root of a binary tree, determine if it is a valid binary search tree. A BST is valid if the left subtree contains only nodes with values less than the root, and the right subtree contains only values greater than the root.`,
  constraints: `- The number of nodes is in the range \`[1, 10^4]\`.
- \`-2^31 <= Node.val <= 2^31 - 1\``,
  examples: [
    { input: `root = [2,1,3]`, output: `true` },
    { input: `root = [5,1,4,null,null,3,6]`, output: `false`, explanation: `Root 5 has right child 4, which is less than 5.` },
  ],
  starterCode: {
    javascript: `function isValidBST(r){function dfs(n,lo,hi){if(!n)return true;if(n.val<=lo||n.val>=hi)return false;return dfs(n.left,lo,n.val)&&dfs(n.right,n.val,hi)}return dfs(r,-Infinity,Infinity)}`,
    typescript: `class TreeNode{val:number;left:TreeNode|null;right:TreeNode|null;constructor(v?:number,l?:TreeNode|null,r?:TreeNode|null){this.val=v??0;this.left=l??null;this.right=r??null}}
function isValidBST(r:TreeNode|null):boolean{
  function dfs(n:TreeNode|null,lo:number,hi:number):boolean{
    if(!n)return true;
    if(n.val<=lo||n.val>=hi)return false;
    return dfs(n.left,lo,n.val)&&dfs(n.right,n.val,hi);
  }
  return dfs(r,-Infinity,Infinity);
}`,
    python: `def is_valid_bst(r):
    def dfs(n,lo,hi):
        if not n:return True
        if n.val<=lo or n.val>=hi:return False
        return dfs(n.left,lo,n.val)and dfs(n.right,n.val,hi)
    return dfs(r,float('-inf'),float('inf'))`,
    java: `class TreeNode{int val;TreeNode left;TreeNode right;TreeNode(){}TreeNode(int v){this.val=v;}TreeNode(int v,TreeNode l,TreeNode r){this.val=v;this.left=l;this.right=r;}}
class Solution{
  public boolean isValidBST(TreeNode r){return dfs(r,Long.MIN_VALUE,Long.MAX_VALUE);}
  private boolean dfs(TreeNode n,long lo,long hi){
    if(n==null)return true;
    if(n.val<=lo||n.val>=hi)return false;
    return dfs(n.left,lo,n.val)&&dfs(n.right,n.val,hi);
  }
}`,
    cpp: `#include<climits>
struct TreeNode{int val;TreeNode*left;TreeNode*right;TreeNode():val(0),left(nullptr),right(nullptr){}TreeNode(int x):val(x),left(nullptr),right(nullptr){}TreeNode(int x,TreeNode*l,TreeNode*r):val(x),left(l),right(r){}};
class Solution{
public:
  bool isValidBST(TreeNode*r){return dfs(r,LONG_MIN,LONG_MAX);}
  bool dfs(TreeNode*n,long lo,long hi){
    if(!n)return true;
    if(n->val<=lo||n->val>=hi)return false;
    return dfs(n->left,lo,n->val)&&dfs(n->right,n->val,hi);
  }
};`,
    c: `#include<stdbool.h>
#include<limits.h>
struct TreeNode{int val;struct TreeNode*left;struct TreeNode*right;};
bool dfs(struct TreeNode*n,long lo,long hi){
  if(!n)return true;
  if(n->val<=lo||n->val>=hi)return false;
  return dfs(n->left,lo,n->val)&&dfs(n->right,n->val,hi);
}
bool isValidBST(struct TreeNode*r){return dfs(r,LONG_MIN,LONG_MAX);}`,
    go: `type TreeNode struct{Val int;Left*TreeNode;Right*TreeNode}
func isValidBST(r*TreeNode)bool{
  var dfs func(*TreeNode,int,int)bool
  dfs=func(n*TreeNode,lo,hi int)bool{
    if n==nil{return true}
    if n.Val<=lo||n.Val>=hi{return false}
    return dfs(n.Left,lo,n.Val)&&dfs(n.Right,n.Val,hi)
  }
  return dfs(r,-1<<63,1<<63-1)
}`,
    rust: `fn is_valid_bst(r:Option<Rc<RefCell<TreeNode>>>)->bool{
  fn dfs(n:Option<Rc<RefCell<TreeNode>>>,lo:i64,hi:i64)->bool{
    if let Some(x)=n{let v=x.borrow().val as i64;
      v>lo&&v<hi&&dfs(x.borrow().left.clone(),lo,v)&&dfs(x.borrow().right.clone(),v,hi)
    }else{true}
  }
  dfs(r,i64::MIN,i64::MAX)
}`,
  },
  tags: ["BST","Trees"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Pass down valid range (min, max) for each subtree.","Recursively validate left and right children."],
  editorial: `Use recursive DFS with min and max bounds. For each node, check its value is within (min, max). Recurse on left with (min, val) and right with (val, max).`,
  complexity: { time: `O(n)`, space: `O(n)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `true`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `false`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `true`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `false`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `false`, isHidden: true },
  ],
}
];
