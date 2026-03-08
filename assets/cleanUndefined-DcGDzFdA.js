const t=e=>Array.isArray(e)?e.map(t):e instanceof Date?e:e!==null&&typeof e=="object"?Object.fromEntries(Object.entries(e).filter(([n,r])=>r!==void 0).map(([n,r])=>[n,t(r)])):e;export{t as c};
