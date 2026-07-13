import type { SeedProblem } from "./types";
import { jsFn, pyFn, javaCls, cppCls, cFn, goFn, rustFn } from "./types";

export const mediumProblemsPart2: SeedProblem[] = [
  {
  title: `Number of Islands`,
  slug: `number-of-islands`,
  difficulty: `Medium`,
  category: `Graphs/DFS-BFS`,
  description: `Given an m x n 2D binary grid \`grid\` which contains '1's (land) and '0's (water), count the number of islands. An island is surrounded by water and formed by connecting adjacent lands horizontally or vertically.`,
  constraints: `- \`m == grid.length\`
- \`n == grid[i].length\`
- \`1 <= m, n <= 300\`
- \`grid[i][j]\` is '0' or '1'.`,
  examples: [
    { input: `grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]`, output: `1` },
    { input: `grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]`, output: `3` },
  ],
  starterCode: {
    javascript: `function numIslands(g){let c=0;for(let i=0;i<g.length;i++){for(let j=0;j<g[0].length;j++){if(g[i][j]==='1'){c++;dfs(g,i,j)}}}return c;function dfs(g,i,j){if(i<0||i>=g.length||j<0||j>=g[0].length||g[i][j]==='0')return;g[i][j]='0';dfs(g,i-1,j);dfs(g,i+1,j);dfs(g,i,j-1);dfs(g,i,j+1)}}`,
    typescript: `function numIslands(g:string[][]):number{
  let c=0;
  for(let i=0;i<g.length;i++)
    for(let j=0;j<g[0].length;j++)
      if(g[i][j]==='1'){c++;dfs(g,i,j);}
  return c;
  function dfs(g:string[][],i:number,j:number){
    if(i<0||i>=g.length||j<0||j>=g[0].length||g[i][j]==='0')return;
    g[i][j]='0';dfs(g,i-1,j);dfs(g,i+1,j);dfs(g,i,j-1);dfs(g,i,j+1);
  }
}`,
    python: `def num_islands(g):
    def dfs(g,i,j):
        if i<0 or i>=len(g)or j<0 or j>=len(g[0])or g[i][j]=='0':return
        g[i][j]='0'
        dfs(g,i-1,j);dfs(g,i+1,j);dfs(g,i,j-1);dfs(g,i,j+1)
    c=0
    for i in range(len(g)):
        for j in range(len(g[0])):
            if g[i][j]=='1':c+=1;dfs(g,i,j)
    return c`,
    java: `class Solution{
  public int numIslands(char[][]g){
    int c=0;
    for(int i=0;i<g.length;i++)
      for(int j=0;j<g[0].length;j++)
        if(g[i][j]=='1'){c++;dfs(g,i,j);}
    return c;
  }
  void dfs(char[][]g,int i,int j){
    if(i<0||i>=g.length||j<0||j>=g[0].length||g[i][j]=='0')return;
    g[i][j]='0';dfs(g,i-1,j);dfs(g,i+1,j);dfs(g,i,j-1);dfs(g,i,j+1);
  }
}`,
    cpp: `#include<vector>
using namespace std;
class Solution{
public:
  int numIslands(vector<vector<char>>&g){
    int c=0;
    for(int i=0;i<g.size();i++)
      for(int j=0;j<g[0].size();j++)
        if(g[i][j]=='1'){c++;dfs(g,i,j);}
    return c;
  }
  void dfs(vector<vector<char>>&g,int i,int j){
    if(i<0||i>=g.size()||j<0||j>=g[0].size()||g[i][j]=='0')return;
    g[i][j]='0';dfs(g,i-1,j);dfs(g,i+1,j);dfs(g,i,j-1);dfs(g,i,j+1);
  }
};`,
    c: `void dfs(char**g,int r,int c,int i,int j){
  if(i<0||i>=r||j<0||j>=c||g[i][j]=='0')return;
  g[i][j]='0';dfs(g,r,c,i-1,j);dfs(g,r,c,i+1,j);dfs(g,r,c,i,j-1);dfs(g,r,c,i,j+1);
}
int numIslands(char**g,int gSiz,int*gCol){
  int c=0;
  for(int i=0;i<gSiz;i++)
    for(int j=0;j<gCol[i];j++)
      if(g[i][j]=='1'){c++;dfs(g,gSiz,gCol[i],i,j);}
  return c;
}`,
    go: `func numIslands(g[][]byte)int{
  c:=0
  for i:=0;i<len(g);i++{
    for j:=0;j<len(g[0]);j++{
      if g[i][j]=='1'{c++;dfs(g,i,j)}
    }
  }
  return c
}
func dfs(g[][]byte,i,j int){
  if i<0||i>=len(g)||j<0||j>=len(g[0])||g[i][j]=='0'{return}
  g[i][j]='0';dfs(g,i-1,j);dfs(g,i+1,j);dfs(g,i,j-1);dfs(g,i,j+1)
}`,
    rust: `fn num_islands(g:Vec<Vec<char>>)->i32{
  let mut gr=g;let mut c=0;
  for i in 0..gr.len(){for j in 0..gr[0].len(){if gr[i][j]=='1'{c+=1;dfs(&mut gr,i as i32,j as i32)}}}
  c
}
fn dfs(g:&mut Vec<Vec<char>>,i:i32,j:i32){
  if i<0||i>=g.len()as i32||j<0||j>=g[0].len()as i32||g[i as usize][j as usize]=='0'{return}
  g[i as usize][j as usize]='0';
  dfs(g,i-1,j);dfs(g,i+1,j);dfs(g,i,j-1);dfs(g,i,j+1);
}`,
  },
  tags: ["Graphs","DFS-BFS"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Use DFS to sink connected land cells.","Iterate through every cell; when you find '1', increment count and DFS to mark all connected land as visited."],
  editorial: `Iterate through the grid. When '1' is found, increment counter and DFS (or BFS) to mark all adjacent land cells as '0'. Continue until all cells are visited.`,
  complexity: { time: `O(m*n)`, space: `O(m*n)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `1`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `3`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `1`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `0`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `5`, isHidden: true },
  ],
},
  {
  title: `Clone Graph`,
  slug: `clone-graph`,
  difficulty: `Medium`,
  category: `Graphs/DFS-BFS`,
  description: `Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node contains a value and a list of neighbors.`,
  constraints: `- The number of nodes is in the range \`[0, 100]\`.
- \`1 <= Node.val <= 100\`
- Node.val is unique.
- The graph is connected.`,
  examples: [
    { input: `adjList = [[2,4],[1,3],[2,4],[1,3]]`, output: `[[2,4],[1,3],[2,4],[1,3]]` },
    { input: `adjList = [[]]`, output: `[[]]` },
    { input: `adjList = []`, output: `[]` },
  ],
  starterCode: {
    javascript: `function Node(v,n){this.val=v===undefined?0:v;this.neighbors=n===undefined?[]:n}
function cloneGraph(node){if(!node)return null;const m=new Map();function dfs(n){if(m.has(n))return m.get(n);const c=new Node(n.val);m.set(n,c);for(const nei of n.neighbors)c.neighbors.push(dfs(nei));return c}return dfs(node)}`,
    typescript: `class Node{val:number;neighbors:Node[];constructor(v?:number,n?:Node[]){this.val=v??0;this.neighbors=n??[]}}
function cloneGraph(node:Node|null):Node|null{
  if(!node)return null;const m=new Map<Node,Node>();
  function dfs(n:Node):Node{
    if(m.has(n))return m.get(n)!;
    const c=new Node(n.val);m.set(n,c);
    for(const nei of n.neighbors)c.neighbors.push(dfs(nei));
    return c;
  }
  return dfs(node);
}`,
    python: `class Node:def __init__(self,v=0,n=None):self.val=v;self.neighbors=n if n is not None else []
def clone_graph(node):
    if not node:return None
    m={}
    def dfs(n):
        if n in m:return m[n]
        c=Node(n.val)
        m[n]=c
        for nei in n.neighbors:c.neighbors.append(dfs(nei))
        return c
    return dfs(node)`,
    java: `import java.util.*;
class Node{public int val;public List<Node>neighbors;public Node(){val=0;neighbors=new ArrayList<>();}public Node(int v){val=v;neighbors=new ArrayList<>();}public Node(int v,List<Node>n){val=v;neighbors=n;}}
class Solution{
  Map<Node,Node>m=new HashMap<>();
  public Node cloneGraph(Node node){
    if(node==null)return null;
    if(m.containsKey(node))return m.get(node);
    Node c=new Node(node.val);m.put(node,c);
    for(Node nei:node.neighbors)c.neighbors.add(cloneGraph(nei));
    return c;
  }
}`,
    cpp: `#include<vector>
#include<unordered_map>
using namespace std;
class Node{public:int val;vector<Node*>neighbors;Node(){val=0;}Node(int v){val=v;}Node(int v,vector<Node*>n){val=v;neighbors=n;}};
class Solution{
public:
  unordered_map<Node*,Node*>m;
  Node*cloneGraph(Node*node){
    if(!node)return nullptr;
    if(m.count(node))return m[node];
    Node*c=new Node(node->val);m[node]=c;
    for(Node*nei:node->neighbors)c->neighbors.push_back(cloneGraph(nei));
    return c;
  }
};`,
    c: `struct Node{int val;struct Node**neighbors;int numNeighbors;};
struct Node*cloneGraph(struct Node*s){
  if(!s)return NULL;
  struct Node*c=malloc(sizeof(struct Node));c->val=s->val;
  c->neighbors=malloc(s->numNeighbors*sizeof(struct Node*));c->numNeighbors=s->numNeighbors;
  for(int i=0;i<s->numNeighbors;i++)c->neighbors[i]=cloneGraph(s->neighbors[i]);
  return c;
}`,
    go: `type Node struct{Val int;Neighbors[]*Node}
var m=map[*Node]*Node{}
func cloneGraph(node*Node)*Node{
  if node==nil{return nil}
  if c,ok:=m[node];ok{return c}
  c:=&Node{Val:node.Val};m[node]=c
  for_,nei:=range node.Neighbors{c.Neighbors=append(c.Neighbors,cloneGraph(nei))}
  return c
}`,
    rust: `fn cloneGraph(node:Option<Rc<RefCell<Node>>>)->Option<Rc<RefCell<Node>>>{
  use std::rc::Rc;use std::cell::RefCell;
  fn dfs(n:Option<Rc<RefCell<Node>>>,m:&mut std::collections::HashMap<i32,Option<Rc<RefCell<Node>>>>)->Option<Rc<RefCell<Node>>>{
    if let Some(x)=n{
      if let Some(c)=m.get(&x.borrow().val){return c.clone()}
      let c=Rc::new(RefCell::new(Node{val:x.borrow().val,neighbors:vec![]}));
      m.insert(x.borrow().val,Some(c.clone()));
      for nei in&x.borrow().neighbors{c.borrow_mut().neighbors.push(dfs(Some(nei.clone()),m));}
      Some(c)
    }else{None}
  }
  dfs(node,&mut std::collections::HashMap::new())
}`,
  },
  tags: ["Graphs","DFS-BFS"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Use a hash map from original node to cloned node.","Use DFS or BFS to traverse and clone."],
  editorial: `Use DFS with a hash map to track visited/cloned nodes. For each node, create a clone and recursively clone its neighbors.`,
  complexity: { time: `O(V+E)`, space: `O(V)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `2,4,1,3,2,4,1,3`, isHidden: false },
    { input: `[object Object]`, expectedOutput: ``, isHidden: false },
    { input: `[object Object]`, expectedOutput: ``, isHidden: false },
    { input: `[object Object]`, expectedOutput: `2,1`, isHidden: true },
  ],
},
  {
  title: `Subsets`,
  slug: `subsets`,
  difficulty: `Medium`,
  category: `Backtracking`,
  description: `Given an integer array \`nums\` of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets.`,
  constraints: `- \`1 <= nums.length <= 10\`
- \`-10 <= nums[i] <= 10\`
- All elements are unique.`,
  examples: [
    { input: `nums = [1,2,3]`, output: `[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]` },
    { input: `nums = [0]`, output: `[[],[0]]` },
  ],
  starterCode: {
    javascript: `function subsets(n){const r=[];function bt(s,p){r.push([...p]);for(let i=s;i<n.length;i++){p.push(n[i]);bt(i+1,p);p.pop()}}bt(0,[]);return r}`,
    typescript: `function subsets(n:number[]):number[][]{
  const r:number[][]=[];
  function bt(s:number,p:number[]){
    r.push([...p]);
    for(let i=s;i<n.length;i++){p.push(n[i]);bt(i+1,p);p.pop()}
  }
  bt(0,[]);return r;
}`,
    python: `def subsets(n):
    r=[]
    def bt(s,p):
        r.append(p[:])
        for i in range(s,len(n)):
            p.append(n[i]);bt(i+1,p);p.pop()
    bt(0,[])
    return r`,
    java: `import java.util.*;
class Solution{
  public List<List<Integer>>subsets(int[]n){
    List<List<Integer>>r=new ArrayList<>();
    bt(r,new ArrayList<>(),n,0);
    return r;
  }
  void bt(List<List<Integer>>r,List<Integer>p,int[]n,int s){
    r.add(new ArrayList<>(p));
    for(int i=s;i<n.length;i++){p.add(n[i]);bt(r,p,n,i+1);p.remove(p.size()-1);}
  }
}`,
    cpp: `#include<vector>
using namespace std;
class Solution{
public:
  vector<vector<int>>subsets(vector<int>&n){
    vector<vector<int>>r;vector<int>p;
    bt(r,p,n,0);return r;
  }
  void bt(vector<vector<int>>&r,vector<int>&p,vector<int>&n,int s){
    r.push_back(p);
    for(int i=s;i<n.size();i++){p.push_back(n[i]);bt(r,p,n,i+1);p.pop_back();}
  }
};`,
    c: `int**subsets(int*n,int nSiz,int*retSize,int**retCol){
  int t=1<<nSiz;
  int**r=malloc(t*sizeof(int*));
  *retCol=malloc(t*sizeof(int));
  *retSize=0;
  for(int m=0;m<t;m++){
    int cnt=0;for(int b=m;b;b>>=1)if(b&1)cnt++;
    r[*retSize]=malloc(cnt*sizeof(int));
    int idx=0;
    for(int i=0;i<nSiz;i++)if(m&(1<<i))r[*retSize][idx++]=n[i];
    (*retCol)[*retSize]=cnt;
    (*retSize)++;
  }
  return r;
}`,
    go: `func subsets(n[]int)[][]int{
  r:=[][]int{};p:=[]int{}
  var bt func(int)
  bt=func(s int){
    t:=make([]int,len(p));copy(t,p);r=append(r,t)
    for i:=s;i<len(n);i++{p=append(p,n[i]);bt(i+1);p=p[:len(p)-1]}
  }
  bt(0);return r
}`,
    rust: `fn subsets(n:Vec<i32>)->Vec<Vec<i32>>{
  let mut r=vec![];
  for m in 0..(1<<n.len()){
    let mut s=vec![];
    for i in 0..n.len(){if m&(1<<i)!=0{s.push(n[i])}}
    r.push(s);
  }
  r
}`,
  },
  tags: ["Backtracking","Arrays"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Use backtracking to build all combinations.","At each step, include or exclude the current element."],
  editorial: `Use backtracking. For each element, make a recursive call including it and another excluding it. Add each path to the result.`,
  complexity: { time: `O(n * 2^n)`, space: `O(n)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `,1,2,1,2,3,1,3,2,3,1,2,3`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `,0`, isHidden: false },
    { input: `[object Object]`, expectedOutput: ``, isHidden: false },
    { input: `[object Object]`, expectedOutput: `,1,2,1,2`, isHidden: true },
  ],
},
  {
  title: `Search in Rotated Sorted Array`,
  slug: `search-in-rotated-sorted-array`,
  difficulty: `Medium`,
  category: `Binary Search`,
  description: `There is an integer array \`nums\` sorted in ascending order that is rotated at an unknown pivot. Given \`target\`, return its index if found, or -1 otherwise. Your algorithm must run in O(log n) time.`,
  constraints: `- \`1 <= nums.length <= 5000\`
- \`-10^4 <= nums[i], target <= 10^4\`
- All values are unique.
- \`nums\` is rotated at some pivot.`,
  examples: [
    { input: `nums = [4,5,6,7,0,1,2], target = 0`, output: `4` },
    { input: `nums = [4,5,6,7,0,1,2], target = 3`, output: `-1` },
    { input: `nums = [1], target = 0`, output: `-1` },
  ],
  starterCode: {
    javascript: `function search(n,t){let l=0,r=n.length-1;while(l<=r){const m=(l+r)>>1;if(n[m]===t)return m;if(n[l]<=n[m]){if(t>=n[l]&&t<n[m])r=m-1;else l=m+1}else{if(t>n[m]&&t<=n[r])l=m+1;else r=m-1}}return -1}`,
    typescript: `function search(n:number[],t:number):number{
  let l=0,r=n.length-1;
  while(l<=r){
    const m=(l+r)>>>1;
    if(n[m]===t)return m;
    if(n[l]<=n[m]){if(t>=n[l]&&t<n[m])r=m-1;else l=m+1;}
    else{if(t>n[m]&&t<=n[r])l=m+1;else r=m-1;}
  }
  return -1;
}`,
    python: `def search(n,t):
    l,r=0,len(n)-1
    while l<=r:
        m=(l+r)//2
        if n[m]==t:return m
        if n[l]<=n[m]:
            if n[l]<=t<n[m]:r=m-1
            else:l=m+1
        else:
            if n[m]<t<=n[r]:l=m+1
            else:r=m-1
    return -1`,
    java: `class Solution{
  public int search(int[]n,int t){
    int l=0,r=n.length-1;
    while(l<=r){
      int m=(l+r)>>>1;
      if(n[m]==t)return m;
      if(n[l]<=n[m]){if(t>=n[l]&&t<n[m])r=m-1;else l=m+1;}
      else{if(t>n[m]&&t<=n[r])l=m+1;else r=m-1;}
    }
    return -1;
  }
}`,
    cpp: `#include<vector>
using namespace std;
class Solution{
public:
  int search(vector<int>&n,int t){
    int l=0,r=n.size()-1;
    while(l<=r){
      int m=(l+r)/2;
      if(n[m]==t)return m;
      if(n[l]<=n[m]){if(t>=n[l]&&t<n[m])r=m-1;else l=m+1;}
      else{if(t>n[m]&&t<=n[r])l=m+1;else r=m-1;}
    }
    return -1;
  }
};`,
    c: `int search(int*n,int nSiz,int t){
  int l=0,r=nSiz-1;
  while(l<=r){
    int m=(l+r)/2;
    if(n[m]==t)return m;
    if(n[l]<=n[m]){if(t>=n[l]&&t<n[m])r=m-1;else l=m+1;}
    else{if(t>n[m]&&t<=n[r])l=m+1;else r=m-1;}
  }
  return -1;
}`,
    go: `func search(n[]int,t int)int{
  l,r:=0,len(n)-1
  for l<=r{
    m:=(l+r)/2
    if n[m]==t{return m}
    if n[l]<=n[m]{
      if t>=n[l]&&t<n[m]{r=m-1}else{l=m+1}
    }else{
      if t>n[m]&&t<=n[r]{l=m+1}else{r=m-1}
    }
  }
  return -1
}`,
    rust: `fn search(n:Vec<i32>,t:i32)->i32{
  let mut l:i32=0;let mut r:i32=n.len()as i32-1;
  while l<=r{let m=(l+r)/2;
    if n[m as usize]==t{return m}
    if n[l as usize]<=n[m as usize]{
      if t>=n[l as usize]&&t<n[m as usize]{r=m-1}else{l=m+1}
    }else{
      if t>n[m as usize]&&t<=n[r as usize]{l=m+1}else{r=m-1}
    }
  }
  -1
}`,
  },
  tags: ["Binary Search","Arrays"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Find which half is sorted.","Check if target lies in the sorted half."],
  editorial: `Modified binary search. Find mid; determine if left or right half is sorted. Check if target falls within the sorted range and adjust pointers accordingly.`,
  complexity: { time: `O(log n)`, space: `O(1)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `4`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `-1`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `-1`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `0`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `1`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `0`, isHidden: true },
  ],
},
  {
  title: `Jump Game`,
  slug: `jump-game`,
  difficulty: `Medium`,
  category: `Greedy`,
  description: `You are given an integer array \`nums\` where each element represents your maximum jump length at that position. Return \`true\` if you can reach the last index, starting from index 0.`,
  constraints: `- \`1 <= nums.length <= 10^4\`
- \`0 <= nums[i] <= 10^5\``,
  examples: [
    { input: `nums = [2,3,1,1,4]`, output: `true`, explanation: `Jump 1 step to index 1, then 3 steps to the end.` },
    { input: `nums = [3,2,1,0,4]`, output: `false`, explanation: `Stuck at index 3.` },
  ],
  starterCode: {
    javascript: `function canJump(n){let m=0;for(let i=0;i<n.length;i++){if(i>m)return false;m=Math.max(m,i+n[i])}return true}`,
    typescript: `function canJump(n:number[]):boolean{
  let m=0;
  for(let i=0;i<n.length;i++){
    if(i>m)return false;
    m=Math.max(m,i+n[i]);
  }
  return true;
}`,
    python: `def can_jump(n):
    m=0
    for i,x in enumerate(n):
        if i>m:return False
        m=max(m,i+x)
    return True`,
    java: `class Solution{
  public boolean canJump(int[]n){
    int m=0;
    for(int i=0;i<n.length;i++){
      if(i>m)return false;
      m=Math.max(m,i+n[i]);
    }
    return true;
  }
}`,
    cpp: `#include<vector>
#include<algorithm>
using namespace std;
class Solution{
public:
  bool canJump(vector<int>&n){
    int m=0;
    for(int i=0;i<n.size();i++){
      if(i>m)return false;
      m=max(m,i+n[i]);
    }
    return true;
  }
};`,
    c: `#include<stdbool.h>
bool canJump(int*n,int nSiz){
  int m=0;
  for(int i=0;i<nSiz;i++){
    if(i>m)return false;
    if(i+n[i]>m)m=i+n[i];
  }
  return true;
}`,
    go: `func canJump(n[]int)bool{
  m:=0
  for i,x:=range n{
    if i>m{return false}
    if i+x>m{m=i+x}
  }
  return true
}`,
    rust: `fn can_jump(n:Vec<i32>)->bool{
  let mut m:usize=0;
  for(i,&x)in n.iter().enumerate(){if i>m{return false};m=m.max(i+x as usize);}
  true
}`,
  },
  tags: ["Greedy","Arrays"],
  companies: ["Amazon","Google","Microsoft"],
  hints: ["Track the furthest reachable index.","If current index exceeds furthest reachable, return false."],
  editorial: `Iterate through the array, tracking the furthest reachable index. If at any point the current index exceeds the furthest reachable, return false.`,
  complexity: { time: `O(n)`, space: `O(1)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `true`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `false`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `true`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `true`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `false`, isHidden: true },
  ],
},
  {
  title: `Task Scheduler`,
  slug: `task-scheduler`,
  difficulty: `Medium`,
  category: `Greedy`,
  description: `Given a characters array \`tasks\` representing CPU tasks (letters A-Z) and an integer \`n\` representing the cooldown period between two same tasks, return the least number of units of time to finish all tasks.`,
  constraints: `- \`1 <= tasks.length <= 10^4\`
- \`tasks[i]\` is an uppercase English letter.
- \`0 <= n <= 100\``,
  examples: [
    { input: `tasks = ["A","A","A","B","B","B"], n = 2`, output: `8`, explanation: `A -> B -> idle -> A -> B -> idle -> A -> B.` },
    { input: `tasks = ["A","C","A","B","D","B"], n = 1`, output: `6` },
    { input: `tasks = ["A","A","A","B","B","B"], n = 3`, output: `10` },
  ],
  starterCode: {
    javascript: `function leastInterval(t,n){const f={};for(const x of t)f[x]=(f[x]||0)+1;const v=Object.values(f);const m=Math.max(...v);const c=v.filter(x=>x===m).length;return Math.max(t.length,(m-1)*(n+1)+c)}`,
    typescript: `function leastInterval(t:string[],n:number):number{
  const f:number[]=new Array(26).fill(0);
  for(const x of t)f[x.charCodeAt(0)-65]++;
  const m=Math.max(...f);
  const c=f.filter(x=>x===m).length;
  return Math.max(t.length,(m-1)*(n+1)+c);
}`,
    python: `def least_interval(t,n):
    f={}
    for x in t:f[x]=f.get(x,0)+1
    m=max(f.values())
    c=sum(1 for v in f.values()if v==m)
    return max(len(t),(m-1)*(n+1)+c)`,
    java: `import java.util.*;
class Solution{
  public int leastInterval(char[]t,int n){
    int[]f=new int[26];
    for(char x:t)f[x-'A']++;
    int m=0;for(int x:f)m=Math.max(m,x);
    int c=0;for(int x:f)if(x==m)c++;
    return Math.max(t.length,(m-1)*(n+1)+c);
  }
}`,
    cpp: `#include<vector>
#include<algorithm>
#include<numeric>
using namespace std;
class Solution{
public:
  int leastInterval(vector<char>&t,int n){
    vector<int>f(26,0);
    for(char x:t)f[x-'A']++;
    int m=*max_element(f.begin(),f.end());
    int c=count(f.begin(),f.end(),m);
    return max((int)t.size(),(m-1)*(n+1)+c);
  }
};`,
    c: `int leastInterval(char*t,int tSiz,int n){
  int f[26]={0};
  for(int i=0;i<tSiz;i++)f[t[i]-'A']++;
  int m=0;for(int i=0;i<26;i++)if(f[i]>m)m=f[i];
  int c=0;for(int i=0;i<26;i++)if(f[i]==m)c++;
  int cand=(m-1)*(n+1)+c;
  return cand>tSiz?cand:tSiz;
}`,
    go: `func leastInterval(t[]byte,n int)int{
  f:=make([]int,26)
  for_,x:=range t{f[x-'A']++}
  m:=0;for_,x:=range f{if x>m{m=x}}
  c:=0;for_,x:=range f{if x==m{c++}}
  if r:=(m-1)*(n+1)+c;r>len(t){return r};return len(t)
}`,
    rust: `fn least_interval(t:Vec<char>,n:i32)->i32{
  let mut f=vec![0i32;26];
  for&x in&t{f[(x as u8-b'A')as usize]+=1}
  let m=*f.iter().max().unwrap();
  let c=f.iter().filter(|&&x|x==m).count()as i32;
  std::cmp::max(t.len()as i32,(m-1)*(n+1)+c)
}`,
  },
  tags: ["Greedy","Heap/PQ"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["The optimal schedule is determined by the most frequent task.","Formula: (maxFreq - 1) * (n + 1) + count of tasks with max frequency."],
  editorial: `Count task frequencies. Find max frequency m and count of tasks with that frequency. Result is max(tasks.length, (m-1)*(n+1)+c).`,
  complexity: { time: `O(n)`, space: `O(1)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `8`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `6`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `6`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `16`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `6`, isHidden: true },
  ],
}
];
