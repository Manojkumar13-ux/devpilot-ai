import type { SeedProblem } from "./types";
import { jsFn, pyFn, javaCls, cppCls, cFn, goFn, rustFn } from "./types";

export const hardProblems: SeedProblem[] = [
  {
  title: `Regular Expression Matching`,
  slug: `regular-expression-matching`,
  difficulty: `Hard`,
  category: `DP`,
  description: `Implement regular expression matching with support for '.' (matches any single character) and '*' (matches zero or more of the preceding element). The matching must cover the entire input string.`,
  constraints: `- \`1 <= s.length <= 20\`
- \`1 <= p.length <= 20\`
- \`s\` contains only lowercase letters.
- \`p\` contains only lowercase letters, '.' and '*'.
- It is guaranteed for each '*' that there is a preceding character.`,
  examples: [
    { input: `s = "aa", p = "a"`, output: `false` },
    { input: `s = "aa", p = "a*"`, output: `true` },
    { input: `s = "ab", p = ".*"`, output: `true` },
  ],
  starterCode: {
    javascript: `function isMatch(s,p){const m=s.length,n=p.length;const dp=Array.from({length:m+1},()=>Array(n+1).fill(false));dp[0][0]=true;for(let j=2;j<=n;j++)if(p[j-1]==="*")dp[0][j]=dp[0][j-2];for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){if(p[j-1]==="."||p[j-1]===s[i-1])dp[i][j]=dp[i-1][j-1];else if(p[j-1]==="*"){dp[i][j]=dp[i][j-2];if(p[j-2]==="."||p[j-2]===s[i-1])dp[i][j]=dp[i][j]||dp[i-1][j]}}}return dp[m][n]}`,
    typescript: `function isMatch(s:string,p:string):boolean{
  const m=s.length,n=p.length;
  const dp:boolean[][]=Array.from({length:m+1},()=>Array(n+1).fill(false));
  dp[0][0]=true;
  for(let j=2;j<=n;j++)if(p[j-1]==='*')dp[0][j]=dp[0][j-2];
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      if(p[j-1]==='.'||p[j-1]===s[i-1])dp[i][j]=dp[i-1][j-1];
      else if(p[j-1]==='*'){
        dp[i][j]=dp[i][j-2];
        if(p[j-2]==='.'||p[j-2]===s[i-1])dp[i][j]=dp[i][j]||dp[i-1][j];
      }
    }
  }
  return dp[m][n];
}`,
    python: `def is_match(s,p):
    m,n=len(s),len(p)
    dp=[[False]*(n+1)for _ in range(m+1)]
    dp[0][0]=True
    for j in range(2,n+1):
        if p[j-1]=='*':dp[0][j]=dp[0][j-2]
    for i in range(1,m+1):
        for j in range(1,n+1):
            if p[j-1]=='.'or p[j-1]==s[i-1]:dp[i][j]=dp[i-1][j-1]
            elif p[j-1]=='*':
                dp[i][j]=dp[i][j-2]
                if p[j-2]=='.'or p[j-2]==s[i-1]:dp[i][j]=dp[i][j]or dp[i-1][j]
    return dp[m][n]`,
    java: `class Solution{
  public boolean isMatch(String s,String p){
    int m=s.length(),n=p.length();
    boolean[][]dp=new boolean[m+1][n+1];dp[0][0]=true;
    for(int j=2;j<=n;j++)if(p.charAt(j-1)=='*')dp[0][j]=dp[0][j-2];
    for(int i=1;i<=m;i++){
      for(int j=1;j<=n;j++){
        if(p.charAt(j-1)=='.'||p.charAt(j-1)==s.charAt(i-1))dp[i][j]=dp[i-1][j-1];
        else if(p.charAt(j-1)=='*'){
          dp[i][j]=dp[i][j-2];
          if(p.charAt(j-2)=='.'||p.charAt(j-2)==s.charAt(i-1))dp[i][j]=dp[i][j]||dp[i-1][j];
        }
      }
    }
    return dp[m][n];
  }
}`,
    cpp: `#include<string>
#include<vector>
using namespace std;
class Solution{
public:
  bool isMatch(string s,string p){
    int m=s.size(),n=p.size();
    vector<vector<bool>>dp(m+1,vector<bool>(n+1,false));dp[0][0]=true;
    for(int j=2;j<=n;j++)if(p[j-1]=='*')dp[0][j]=dp[0][j-2];
    for(int i=1;i<=m;i++){
      for(int j=1;j<=n;j++){
        if(p[j-1]=='.'||p[j-1]==s[i-1])dp[i][j]=dp[i-1][j-1];
        else if(p[j-1]=='*'){
          dp[i][j]=dp[i][j-2];
          if(p[j-2]=='.'||p[j-2]==s[i-1])dp[i][j]=dp[i][j]||dp[i-1][j];
        }
      }
    }
    return dp[m][n];
  }
};`,
    c: `#include<stdbool.h>
#include<string.h>
bool isMatch(char*s,char*p){
  int m=strlen(s),n=strlen(p);
  bool dp[21][21]={false};dp[0][0]=true;
  for(int j=2;j<=n;j++)if(p[j-1]=='*')dp[0][j]=dp[0][j-2];
  for(int i=1;i<=m;i++){
    for(int j=1;j<=n;j++){
      if(p[j-1]=='.'||p[j-1]==s[i-1])dp[i][j]=dp[i-1][j-1];
      else if(p[j-1]=='*'){
        dp[i][j]=dp[i][j-2];
        if(p[j-2]=='.'||p[j-2]==s[i-1])dp[i][j]=dp[i][j]||dp[i-1][j];
      }
    }
  }
  return dp[m][n];
}`,
    go: `func isMatch(s string,p string)bool{
  m,n:=len(s),len(p)
  dp:=make([][]bool,m+1)
  for i:=range dp{dp[i]=make([]bool,n+1)}
  dp[0][0]=true
  for j:=2;j<=n;j++{if p[j-1]=='*'{dp[0][j]=dp[0][j-2]}}
  for i:=1;i<=m;i++{
    for j:=1;j<=n;j++{
      if p[j-1]=='.'||p[j-1]==s[i-1]{dp[i][j]=dp[i-1][j-1]}else if p[j-1]=='*'{
        dp[i][j]=dp[i][j-2]
        if p[j-2]=='.'||p[j-2]==s[i-1]{dp[i][j]=dp[i][j]||dp[i-1][j]}
      }
    }
  }
  return dp[m][n]
}`,
    rust: `fn is_match(s:String,p:String)->bool{
  let(m,n)=(s.len(),p.len());
  let mut dp=vec![vec![false;n+1];m+1];dp[0][0]=true;
  let s=s.as_bytes();let p=p.as_bytes();
  for j in 2..=n{if p[j-1]==b'*'{dp[0][j]=dp[0][j-2]}}
  for i in 1..=m{for j in 1..=n{
    if p[j-1]==b'.'||p[j-1]==s[i-1]{dp[i][j]=dp[i-1][j-1]}
    else if p[j-1]==b'*'{
      dp[i][j]=dp[i][j-2];
      if p[j-2]==b'.'||p[j-2]==s[i-1]{dp[i][j]=dp[i][j]||dp[i-1][j]}
    }
  }}
  dp[m][n]
}`,
  },
  tags: ["DP","Strings"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Use DP table where dp[i][j] means s[0..i-1] matches p[0..j-1].","The '*' can match zero or more of the preceding character."],
  editorial: `Use 2D DP. dp[0][0] = true. Handle '*' matching zero (dp[i][j-2]) or more (dp[i-1][j] if char matches) preceding elements.`,
  complexity: { time: `O(m*n)`, space: `O(m*n)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `false`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `true`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `true`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `true`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `false`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `false`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `true`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `true`, isHidden: true },
  ],
},
  {
  title: `Edit Distance`,
  slug: `edit-distance`,
  difficulty: `Hard`,
  category: `DP`,
  description: `Given two strings \`word1\` and \`word2\`, return the minimum number of operations (insert, delete, replace) required to convert \`word1\` to \`word2\`.`,
  constraints: `- \`0 <= word1.length, word2.length <= 500\`
- Both strings consist of lowercase English letters.`,
  examples: [
    { input: `word1 = "horse", word2 = "ros"`, output: `3`, explanation: `horse -> rorse (replace h->r), rorse -> rose (remove r), rose -> ros (remove e).` },
    { input: `word1 = "intention", word2 = "execution"`, output: `5` },
  ],
  starterCode: {
    javascript: `function minDistance(w1,w2){const m=w1.length,n=w2.length;const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));for(let i=0;i<=m;i++)dp[i][0]=i;for(let j=0;j<=n;j++)dp[0][j]=j;for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){if(w1[i-1]===w2[j-1])dp[i][j]=dp[i-1][j-1];else dp[i][j]=1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])}}return dp[m][n]}`,
    typescript: `function minDistance(w1:string,w2:string):number{
  const m=w1.length,n=w2.length;
  const dp:number[][]=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++)dp[i][0]=i;
  for(let j=0;j<=n;j++)dp[0][j]=j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      if(w1[i-1]===w2[j-1])dp[i][j]=dp[i-1][j-1];
      else dp[i][j]=1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}`,
    python: `def min_distance(w1,w2):
    m,n=len(w1),len(w2)
    dp=[[0]*(n+1)for _ in range(m+1)]
    for i in range(m+1):dp[i][0]=i
    for j in range(n+1):dp[0][j]=j
    for i in range(1,m+1):
        for j in range(1,n+1):
            if w1[i-1]==w2[j-1]:dp[i][j]=dp[i-1][j-1]
            else:dp[i][j]=1+min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])
    return dp[m][n]`,
    java: `class Solution{
  public int minDistance(String w1,String w2){
    int m=w1.length(),n=w2.length();
    int[][]dp=new int[m+1][n+1];
    for(int i=0;i<=m;i++)dp[i][0]=i;
    for(int j=0;j<=n;j++)dp[0][j]=j;
    for(int i=1;i<=m;i++){
      for(int j=1;j<=n;j++){
        if(w1.charAt(i-1)==w2.charAt(j-1))dp[i][j]=dp[i-1][j-1];
        else dp[i][j]=1+Math.min(dp[i-1][j],Math.min(dp[i][j-1],dp[i-1][j-1]));
      }
    }
    return dp[m][n];
  }
}`,
    cpp: `#include<string>
#include<vector>
#include<algorithm>
using namespace std;
class Solution{
public:
  int minDistance(string w1,string w2){
    int m=w1.size(),n=w2.size();
    vector<vector<int>>dp(m+1,vector<int>(n+1,0));
    for(int i=0;i<=m;i++)dp[i][0]=i;
    for(int j=0;j<=n;j++)dp[0][j]=j;
    for(int i=1;i<=m;i++){
      for(int j=1;j<=n;j++){
        if(w1[i-1]==w2[j-1])dp[i][j]=dp[i-1][j-1];
        else dp[i][j]=1+min({dp[i-1][j],dp[i][j-1],dp[i-1][j-1]});
      }
    }
    return dp[m][n];
  }
};`,
    c: `int minDistance(char*w1,char*w2){
  int m=strlen(w1),n=strlen(w2);
  int dp[501][501];
  for(int i=0;i<=m;i++)dp[i][0]=i;
  for(int j=0;j<=n;j++)dp[0][j]=j;
  for(int i=1;i<=m;i++){
    for(int j=1;j<=n;j++){
      if(w1[i-1]==w2[j-1])dp[i][j]=dp[i-1][j-1];
      else{int mn=dp[i-1][j];if(dp[i][j-1]<mn)mn=dp[i][j-1];if(dp[i-1][j-1]<mn)mn=dp[i-1][j-1];dp[i][j]=1+mn;}
    }
  }
  return dp[m][n];
}`,
    go: `func minDistance(w1 string,w2 string)int{
  m,n:=len(w1),len(w2)
  dp:=make([][]int,m+1)
  for i:=range dp{dp[i]=make([]int,n+1);dp[i][0]=i}
  for j:=0;j<=n;j++{dp[0][j]=j}
  for i:=1;i<=m;i++{
    for j:=1;j<=n;j++{
      if w1[i-1]==w2[j-1]{dp[i][j]=dp[i-1][j-1]}else{
        dp[i][j]=1+min(dp[i-1][j],min(dp[i][j-1],dp[i-1][j-1]))
      }
    }
  }
  return dp[m][n]
}
func min(a,b int)int{if a<b{return a};return b}`,
    rust: `fn min_distance(w1:String,w2:String)->i32{
  let(m,n)=(w1.len(),w2.len());
  let w1=w1.as_bytes();let w2=w2.as_bytes();
  let mut dp=vec![vec![0i32;n+1];m+1];
  for i in 0..=m{dp[i][0]=i as i32}
  for j in 0..=n{dp[0][j]=j as i32}
  for i in 1..=m{for j in 1..=n{
    if w1[i-1]==w2[j-1]{dp[i][j]=dp[i-1][j-1]}else{
      dp[i][j]=1+dp[i-1][j].min(dp[i][j-1]).min(dp[i-1][j-1]);
    }
  }}
  dp[m][n]
}`,
  },
  tags: ["DP","Strings"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Use DP where dp[i][j] is edit distance between first i chars of word1 and first j chars of word2.","If chars match, dp[i][j] = dp[i-1][j-1]; else 1 + min(insert, delete, replace)."],
  editorial: `Use 2D DP table. Initialize first row/col with lengths. For each cell, if chars match take diagonal; else 1 + min of three neighboring cells.`,
  complexity: { time: `O(m*n)`, space: `O(m*n)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `3`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `5`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `1`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `0`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `0`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `2`, isHidden: true },
  ],
},
  {
  title: `Alien Dictionary`,
  slug: `alien-dictionary`,
  difficulty: `Hard`,
  category: `Graphs`,
  description: `Given a sorted dictionary of an alien language, find the order of characters in the alien language. The input is an array of words sorted lexicographically according to the alien alphabet.`,
  constraints: `- \`1 <= words.length <= 100\`
- \`1 <= words[i].length <= 100\`
- \`words[i]\` consists of only lowercase English letters.`,
  examples: [
    { input: `words = ["wrt","wrf","er","ett","rftt"]`, output: `wertf` },
    { input: `words = ["z","x"]`, output: `zx` },
    { input: `words = ["z","x","z"]`, output: ``, explanation: `Invalid: cycle detected.` },
  ],
  starterCode: {
    javascript: `function alienOrder(w){const adj={};const inDeg={};for(const x of w){for(const c of x){if(!adj[c])adj[c]=new Set();if(!(c in inDeg))inDeg[c]=0}}for(let i=0;i<w.length-1;i++){const a=w[i],b=w[i+1];let j=0;while(j<a.length&&j<b.length&&a[j]===b[j])j++;if(j<a.length&&j<b.length){const c1=a[j],c2=b[j];if(!adj[c1].has(c2)){adj[c1].add(c2);inDeg[c2]=(inDeg[c2]||0)+1}}}const q=[];for(const c in inDeg){if(inDeg[c]===0)q.push(c)}let res='';while(q.length){const c=q.shift();res+=c;for(const nei of adj[c]){inDeg[nei]--;if(inDeg[nei]===0)q.push(nei)}}return res.length===Object.keys(inDeg).length?res:''}`,
    typescript: `function alienOrder(w:string[]):string{
  const adj=new Map<string,Set<string>>();
  const inDeg=new Map<string,number>();
  for(const x of w){for(const c of x){if(!adj.has(c))adj.set(c,new Set());if(!inDeg.has(c))inDeg.set(c,0)}}
  for(let i=0;i<w.length-1;i++){
    const a=w[i],b=w[i+1];let j=0;
    while(j<a.length&&j<b.length&&a[j]===b[j])j++;
    if(j<a.length&&j<b.length){
      const c1=a[j],c2=b[j];
      if(!adj.get(c1)!.has(c2)){adj.get(c1)!.add(c2);inDeg.set(c2,(inDeg.get(c2)||0)+1)}
    }
  }
  const q:string[]=[];
  for(const[c,d]of inDeg)if(d===0)q.push(c);
  let res='';
  while(q.length){
    const c=q.shift()!;res+=c;
    for(const nei of adj.get(c)!){inDeg.set(nei,inDeg.get(nei)!-1);if(inDeg.get(nei)===0)q.push(nei)}
  }
  return res.length===adj.size?res:'';
}`,
    python: `def alien_order(w):
    adj={c:set()for x in w for c in x}
    in_deg={c:0 for c in adj}
    for i in range(len(w)-1):
        a,b=w[i],w[i+1]
        j=0
        while j<len(a)and j<len(b)and a[j]==b[j]:j+=1
        if j<len(a)and j<len(b):
            if b[j]not in adj[a[j]]:
                adj[a[j]].add(b[j]);in_deg[b[j]]+=1
    q=[c for c in in_deg if in_deg[c]==0]
    res=[]
    while q:
        c=q.pop(0);res.append(c)
        for nei in adj[c]:
            in_deg[nei]-=1
            if in_deg[nei]==0:q.append(nei)
    return''.join(res)if len(res)==len(adj)else''`,
    java: `import java.util.*;
class Solution{
  public String alienOrder(String[]w){
    Map<Character,Set<Character>>adj=new HashMap<>();
    Map<Character,Integer>inDeg=new HashMap<>();
    for(String x:w){for(char c:x.toCharArray()){adj.putIfAbsent(c,new HashSet<>());inDeg.putIfAbsent(c,0);}}
    for(int i=0;i<w.length-1;i++){
      String a=w[i],b=w[i+1];int j=0;
      while(j<a.length()&&j<b.length()&&a.charAt(j)==b.charAt(j))j++;
      if(j<a.length()&&j<b.length()){
        char c1=a.charAt(j),c2=b.charAt(j);
        if(!adj.get(c1).contains(c2)){adj.get(c1).add(c2);inDeg.put(c2,inDeg.get(c2)+1);}
      }
    }
    Queue<Character>q=new LinkedList<>();
    for(char c:inDeg.keySet())if(inDeg.get(c)==0)q.offer(c);
    StringBuilder sb=new StringBuilder();
    while(!q.isEmpty()){
      char c=q.poll();sb.append(c);
      for(char nei:adj.get(c)){inDeg.put(nei,inDeg.get(nei)-1);if(inDeg.get(nei)==0)q.offer(nei);}
    }
    return sb.length()==adj.size()?sb.toString():"";
  }
}`,
    cpp: `#include<string>
#include<vector>
#include<unordered_map>
#include<unordered_set>
#include<queue>
using namespace std;
class Solution{
public:
  string alienOrder(vector<string>&w){
    unordered_map<char,unordered_set<char>>adj;
    unordered_map<char,int>inDeg;
    for(auto&x:w)for(char c:x){adj[c];inDeg[c];}
    for(int i=0;i<(int)w.size()-1;i++){
      string a=w[i],b=w[i+1];int j=0;
      while(j<a.size()&&j<b.size()&&a[j]==b[j])j++;
      if(j<a.size()&&j<b.size()){if(!adj[a[j]].count(b[j])){adj[a[j]].insert(b[j]);inDeg[b[j]]++;}}
    }
    queue<char>q;
    for(auto&p:inDeg)if(p.second==0)q.push(p.first);
    string res;
    while(!q.empty()){
      char c=q.front();q.pop();res+=c;
      for(char nei:adj[c]){if(--inDeg[nei]==0)q.push(nei);}
    }
    return res.size()==adj.size()?res:"";
  }
};`,
    c: `char*alienOrder(char**w,int wSiz){
  int adj[26][26]={0};int inDeg[26]={0};int seen[26]={0};int cnt=0;
  for(int i=0;i<wSiz;i++)for(int j=0;w[i][j];j++){int c=w[i][j]-'a';if(!seen[c]){seen[c]=1;cnt++;}}
  for(int i=0;i<wSiz-1;i++){
    int j=0;
    while(w[i][j]&&w[i+1][j]&&w[i][j]==w[i+1][j])j++;
    if(w[i][j]&&w[i+1][j]){int c1=w[i][j]-'a',c2=w[i+1][j]-'a';if(!adj[c1][c2]){adj[c1][c2]=1;inDeg[c2]++;}}
  }
  int q[26],f=0,r=0;
  for(int i=0;i<26;i++)if(seen[i]&&inDeg[i]==0)q[r++]=i;
  char*res=malloc((cnt+1)*sizeof(char));int idx=0;
  while(f<r){
    int c=q[f++];res[idx++]=c+'a';
    for(int nei=0;nei<26;nei++)if(adj[c][nei]){inDeg[nei]--;if(inDeg[nei]==0)q[r++]=nei;}
  }
  res[idx]=0;
  if(idx==cnt)return res;free(res);return strdup("");
}`,
    go: `func alienOrder(w[]string)string{
  adj:=make(map[byte]map[byte]bool)
  inDeg:=make(map[byte]int)
  for_,x:=range w{for i:=0;i<len(x);i++{c:=x[i];if adj[c]==nil{adj[c]=make(map[byte]bool)};inDeg[c]+=0}}
  for i:=0;i<len(w)-1;i++{
    a,b:=w[i],w[i+1];j:=0
    for j<len(a)&&j<len(b)&&a[j]==b[j]{j++}
    if j<len(a)&&j<len(b){
      c1,c2:=a[j],b[j]
      if!adj[c1][c2]{adj[c1][c2]=true;inDeg[c2]++}
    }
  }
  q:=[]byte{}
  for c:=range inDeg{if inDeg[c]==0{q=append(q,c)}}
  res:=[]byte{}
  for len(q)>0{
    c:=q[0];q=q[1:];res=append(res,c)
    for nei:=range adj[c]{inDeg[nei]--;if inDeg[nei]==0{q=append(q,nei)}}
  }
  if len(res)==len(inDeg){return string(res)};return""
}`,
    rust: `fn alien_order(w:Vec<String>)->String{
  use std::collections::{HashMap,HashSet,VecDeque};
  let mut adj:HashMap<char,HashSet<char>>=HashMap::new();
  let mut in_deg:HashMap<char,i32>=HashMap::new();
  for x in&w{for c in x.chars(){adj.entry(c).or_default();in_deg.entry(c).or_insert(0);}}
  for i in 0..w.len()-1{
    let a=w[i].as_bytes();let b=w[i+1].as_bytes();
    let mut j=0;
    while j<a.len()&&j<b.len()&&a[j]==b[j]{j+=1}
    if j<a.len()&&j<b.len(){
      let c1=a[j]as char;let c2=b[j]as char;
      if adj.get(&c1).map_or(true,|s|!s.contains(&c2)){adj.get_mut(&c1).unwrap().insert(c2);*in_deg.get_mut(&c2).unwrap()+=1;}
    }
  }
  let mut q:VecDeque<char>=VecDeque::new();
  for(&c,&d)in&in_deg{if d==0{q.push_back(c)}}
  let mut res=String::new();
  while let Some(c)=q.pop_front(){res.push(c);
    if let Some(neighbors)=adj.get(&c){for&nei in neighbors{let d=in_deg.get_mut(&nei).unwrap();*d-=1;if*d==0{q.push_back(nei);}}}
  }
  if res.len()==adj.len(){res}else{String::new()}
}`,
  },
  tags: ["Graphs","Topological Sort"],
  companies: ["Google","Amazon","Facebook","Microsoft"],
  hints: ["Build a graph from pairwise character comparisons.","Use topological sort (Kahn's algorithm).","Detect cycles."],
  editorial: `Compare adjacent words to find edges. Build adjacency list and in-degree map. Use BFS (Kahn's) for topological sort. If result length != unique chars, return empty string.`,
  complexity: { time: `O(C)`, space: `O(1)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `wertf`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `zx`, isHidden: false },
    { input: `[object Object]`, expectedOutput: ``, isHidden: false },
    { input: `[object Object]`, expectedOutput: `abc`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `abcd`, isHidden: true },
  ],
},
  {
  title: `Word Ladder`,
  slug: `word-ladder`,
  difficulty: `Hard`,
  category: `Graphs`,
  description: `Given two words \`beginWord\` and \`endWord\`, and a dictionary \`wordList\`, return the length of the shortest transformation sequence from beginWord to endWord. Each transformation changes exactly one letter.`,
  constraints: `- \`1 <= beginWord.length <= 10\`
- \`endWord.length == beginWord.length\`
- \`1 <= wordList.length <= 5000\`
- All words consist of lowercase English letters.`,
  examples: [
    { input: `beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]`, output: `5`, explanation: `hit -> hot -> dot -> dog -> cog.` },
    { input: `beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]`, output: `0`, explanation: `endWord not in list.` },
  ],
  starterCode: {
    javascript: `function ladderLength(b,e,wl){const s=new Set(wl);if(!s.has(e))return 0;let q=[b];let l=1;while(q.length){const nxt=[];for(const w of q){for(let i=0;i<w.length;i++){for(let ch=97;ch<=122;ch++){const c=String.fromCharCode(ch);if(c===w[i])continue;const nw=w.slice(0,i)+c+w.slice(i+1);if(nw===e)return l+1;if(s.has(nw)){s.delete(nw);nxt.push(nw)}}}}q=nxt;l++}return 0}`,
    typescript: `function ladderLength(b:string,e:string,wl:string[]):number{
  const s=new Set(wl);
  if(!s.has(e))return 0;
  let q=[b];let l=1;
  while(q.length){
    const nxt:string[]=[];
    for(const w of q){
      for(let i=0;i<w.length;i++){
        for(let ch=97;ch<=122;ch++){
          const c=String.fromCharCode(ch);
          if(c===w[i])continue;
          const nw=w.slice(0,i)+c+w.slice(i+1);
          if(nw===e)return l+1;
          if(s.has(nw)){s.delete(nw);nxt.push(nw)}
        }
      }
    }
    q=nxt;l++;
  }
  return 0;
}`,
    python: `def ladder_length(b,e,wl):
    s=set(wl)
    if e not in s:return 0
    q=[b];l=1
    while q:
        nxt=[]
        for w in q:
            for i in range(len(w)):
                for ch in[chr(ord('a')+x)for x in range(26)]:
                    if ch==w[i]:continue
                    nw=w[:i]+ch+w[i+1:]
                    if nw==e:return l+1
                    if nw in s:s.remove(nw);nxt.append(nw)
        q=nxt;l+=1
    return 0`,
    java: `import java.util.*;
class Solution{
  public int ladderLength(String b,String e,List<String>wl){
    Set<String>s=new HashSet<>(wl);
    if(!s.contains(e))return 0;
    Queue<String>q=new LinkedList<>();q.offer(b);int l=1;
    while(!q.isEmpty()){
      int sz=q.size();
      for(int k=0;k<sz;k++){
        char[]w=q.poll().toCharArray();
        for(int i=0;i<w.length;i++){
          char orig=w[i];
          for(char ch='a';ch<='z';ch++){
            if(ch==orig)continue;
            w[i]=ch;String nw=new String(w);
            if(nw.equals(e))return l+1;
            if(s.contains(nw)){s.remove(nw);q.offer(nw);}
          }
          w[i]=orig;
        }
      }
      l++;
    }
    return 0;
  }
}`,
    cpp: `#include<string>
#include<vector>
#include<unordered_set>
#include<queue>
using namespace std;
class Solution{
public:
  int ladderLength(string b,string e,vector<string>&wl){
    unordered_set<string>s(wl.begin(),wl.end());
    if(!s.count(e))return 0;
    queue<string>q;q.push(b);int l=1;
    while(!q.empty()){
      int sz=q.size();
      for(int k=0;k<sz;k++){
        string w=q.front();q.pop();
        for(int i=0;i<w.size();i++){
          char orig=w[i];
          for(char ch='a';ch<='z';ch++){
            if(ch==orig)continue;
            w[i]=ch;
            if(w==e)return l+1;
            if(s.count(w)){s.erase(w);q.push(w);}
          }
          w[i]=orig;
        }
      }
      l++;
    }
    return 0;
  }
};`,
    c: `int ladderLength(char*b,char*e,char**wl,int wSiz){
  int s[5000]={0};int eIdx=-1;
  for(int i=0;i<wSiz;i++){s[i]=1;if(strcmp(wl[i],e)==0)eIdx=i;}
  if(eIdx<0)return 0;
  char*q[5000];int f=0,r=0;q[r++]=b;int l=1;
  while(f<r){
    int sz=r-f;
    for(int k=0;k<sz;k++){
      char*w=q[f++];int len=strlen(w);
      char tmp[11];strcpy(tmp,w);
      for(int i=0;i<len;i++){
        char orig=tmp[i];
        for(char ch='a';ch<='z';ch++){
          if(ch==orig)continue;
          tmp[i]=ch;
          if(strcmp(tmp,e)==0)return l+1;
          for(int j=0;j<wSiz;j++){if(s[j]&&strcmp(tmp,wl[j])==0){s[j]=0;q[r++]=wl[j];break;}}
        }
        tmp[i]=orig;
      }
    }
    l++;
  }
  return 0;
}`,
    go: `func ladderLength(b string,e string,wl[]string)int{
  s:=make(map[string]bool)
  for_,w:=range wl{s[w]=true}
  if!s[e]{return 0}
  q:=[]string{b};l:=1
  for len(q)>0{
    var nxt[]string
    for_,w:=range q{
      for i:=0;i<len(w);i++{
        for ch:=byte('a');ch<='z';ch++{
          if ch==w[i]{continue}
          nw:=w[:i]+string(ch)+w[i+1:]
          if nw==e{return l+1}
          if s[nw]{delete(s,nw);nxt=append(nxt,nw)}
        }
      }
    }
    q=nxt;l++
  }
  return 0
}`,
    rust: `fn ladder_length(b:String,e:String,wl:Vec<String>)->i32{
  use std::collections::{HashSet,VecDeque};
  let mut s:HashSet<String>=wl.into_iter().collect();
  if!s.contains(&e){return 0}
  let mut q:VecDeque<String>=VecDeque::new();q.push_back(b);let mut l=1;
  while!q.is_empty(){
    let sz=q.len();
    for _ in 0..sz{
      let w=q.pop_front().unwrap();let bytes=w.as_bytes();
      for i in 0..bytes.len(){
        for ch in b'a'..=b'z'{
          if ch==bytes[i]{continue}
          let mut nw=w.clone().into_bytes();nw[i]=ch;
          let nws=unsafe{String::from_utf8_unchecked(nw)};
          if nws==e{return l+1}
          if s.contains(&nws){s.remove(&nws);q.push_back(nws)}
        }
      }
    }
    l+=1;
  }
  0
}`,
  },
  tags: ["Graphs","BFS"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Treat each word as a node with edges to words differing by one letter.","Use BFS to find shortest path."],
  editorial: `Use BFS from beginWord. For each word, try changing each character to 'a'-'z'. If the new word is in the set and not visited, add to queue. Return level when endWord is reached.`,
  complexity: { time: `O(m^2 * n)`, space: `O(m * n)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `5`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `0`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `2`, isHidden: false },
    { input: `[object Object]`, expectedOutput: `0`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `1`, isHidden: true },
  ],
},
  {
  title: `Merge k Sorted Lists`,
  slug: `merge-k-sorted-lists`,
  difficulty: `Hard`,
  category: `Heap/PQ`,
  description: `You are given an array of k linked-lists, each sorted in ascending order. Merge all the linked-lists into one sorted list and return its head.`,
  constraints: `- \`k == lists.length\`
- \`0 <= k <= 10^4\`
- \`0 <= lists[i].length <= 500\`
- \`-10^4 <= Node.val <= 10^4\`
- Each list is sorted in ascending order.`,
  examples: [
    { input: `lists = [[1,4,5],[1,3,4],[2,6]]`, output: `[1,1,2,3,4,4,5,6]` },
    { input: `lists = []`, output: `[]` },
    { input: `lists = [[]]`, output: `[]` },
  ],
  starterCode: {
    javascript: `function ListNode(v,n){this.val=v===undefined?0:v;this.next=n===undefined?null:n}
function mergeKLists(l){const pq=[];for(const x of l){if(x)pq.push(x)}pq.sort((a,b)=>a.val-b.val);const d=new ListNode(0);let c=d;while(pq.length){const n=pq.shift();c.next=n;c=c.next;if(n.next){pq.push(n.next);pq.sort((a,b)=>a.val-b.val)}}return d.next}`,
    typescript: `class ListNode{val:number;next:ListNode|null;constructor(v?:number,n?:ListNode|null){this.val=v??0;this.next=n??null}}
function mergeKLists(l:(ListNode|null)[]):ListNode|null{
  const pq:ListNode[]=[];
  for(const x of l){if(x)pq.push(x)}
  pq.sort((a,b)=>a.val-b.val);
  const d=new ListNode(0);let c=d;
  while(pq.length){
    const n=pq.shift()!;c.next=n;c=c.next;
    if(n.next){pq.push(n.next);pq.sort((a,b)=>a.val-b.val)}
  }
  return d.next;
}`,
    python: `class ListNode:def __init__(self,v=0,n=None):self.val=v;self.next=n
import heapq
def merge_k_lists(l):
    heap=[]
    for i,li in enumerate(l):
        if li:heapq.heappush(heap,(li.val,i,li))
    d=ListNode(0);c=d
    while heap:
        v,i,n=heapq.heappop(heap)
        c.next=ListNode(v);c=c.next
        if n.next:heapq.heappush(heap,(n.next.val,i,n.next))
    return d.next`,
    java: `import java.util.*;
class ListNode{int val;ListNode next;ListNode(){}ListNode(int v){this.val=v;}ListNode(int v,ListNode n){this.val=v;this.next=n;}}
class Solution{
  public ListNode mergeKLists(ListNode[]l){
    PriorityQueue<ListNode>pq=new PriorityQueue<>((a,b)->a.val-b.val);
    for(ListNode x:l)if(x!=null)pq.offer(x);
    ListNode d=new ListNode(0),c=d;
    while(!pq.isEmpty()){
      ListNode n=pq.poll();c.next=n;c=c.next;
      if(n.next!=null)pq.offer(n.next);
    }
    return d.next;
  }
}`,
    cpp: `#include<vector>
#include<queue>
using namespace std;
struct ListNode{int val;ListNode*next;ListNode():val(0),next(nullptr){}ListNode(int x):val(x),next(nullptr){}ListNode(int x,ListNode*n):val(x),next(n){}};
class Solution{
public:
  ListNode*mergeKLists(vector<ListNode*>&l){
    auto cmp=[](ListNode*a,ListNode*b){return a->val>b->val;};
    priority_queue<ListNode*,vector<ListNode*>,decltype(cmp)>pq(cmp);
    for(auto*x:l)if(x)pq.push(x);
    ListNode*d=new ListNode(0);ListNode*c=d;
    while(!pq.empty()){
      auto*n=pq.top();pq.pop();c->next=n;c=c->next;
      if(n->next)pq.push(n->next);
    }
    return d->next;
  }
};`,
    c: `struct ListNode{int val;struct ListNode*next;};
struct ListNode*mergeKLists(struct ListNode**l,int lSiz){
  struct ListNode*d=malloc(sizeof(struct ListNode));d->next=NULL;
  struct ListNode*c=d;
  int act=1;
  while(act){
    act=0;int mIdx=-1;
    for(int i=0;i<lSiz;i++){
      if(l[i]){act=1;if(mIdx<0||l[i]->val<l[mIdx]->val)mIdx=i;}
    }
    if(mIdx>=0){c->next=l[mIdx];c=c->next;l[mIdx]=l[mIdx]->next;}
  }
  return d->next;
}`,
    go: `type ListNode struct{Val int;Next*ListNode}
func mergeKLists(l[]*ListNode)*ListNode{
  var h minHeap
  for_,x:=range l{if x!=nil{heap.Push(&h,x)}}
  d:=&ListNode{};c:=d
  for h.Len()>0{
    n:=heap.Pop(&h).(*ListNode);c.Next=n;c=c.Next
    if n.Next!=nil{heap.Push(&h,n.Next)}
  }
  return d.Next
}
type minHeap[]*ListNode
func(h minHeap)Len()int{return len(h)}
func(h minHeap)Less(i,j int)bool{return h[i].Val<h[j].Val}
func(h minHeap)Swap(i,j int){h[i],h[j]=h[j],h[i]}
func(h*minHeap)Push(x interface{}){*h=append(*h,x.(*ListNode))}
func(h*minHeap)Pop()interface{}{old:=*h;n:=len(old);x:=old[n-1];*h=old[:n-1];return x}`,
    rust: `fn merge_k_lists(l:Vec<Option<Box<ListNode>>>)->Option<Box<ListNode>>{
  use std::collections::BinaryHeap;use std::cmp::Reverse;
  let mut heap=BinaryHeap::new();
  for x in l{if let Some(node)=x{heap.push(Reverse((node.val,node)))}}
  let mut d=Box::new(ListNode::new(0));let mut c=&mut d;
  while let Some(Reverse((_,mut node)))=heap.pop(){
    if let Some(next)=node.next.take(){heap.push(Reverse((next.val,next)))}
    c.next=Some(node);c=c.next.as_mut().unwrap();
  }
  d.next
}`,
  },
  tags: ["Heap/PQ","Linked List"],
  companies: ["Amazon","Google","Microsoft","Facebook"],
  hints: ["Use a min-heap to always get the smallest current node.","Pop from heap, add to result, push the next node from that list."],
  editorial: `Use a priority queue (min-heap) of list heads. Pop smallest, append to result, push the next node from that list. Continue until heap is empty.`,
  complexity: { time: `O(n log k)`, space: `O(k)` },
  testCases: [
    { input: `[object Object]`, expectedOutput: `1,1,2,3,4,4,5,6`, isHidden: false },
    { input: `[object Object]`, expectedOutput: ``, isHidden: false },
    { input: `[object Object]`, expectedOutput: ``, isHidden: false },
    { input: `[object Object]`, expectedOutput: `1`, isHidden: true },
    { input: `[object Object]`, expectedOutput: `1,2,3,4,5`, isHidden: true },
  ],
}
];
