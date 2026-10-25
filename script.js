const COLORS=['#e8a33d','#3dc2a0','#6e8efb','#e8603d','#c792ea','#58c4dc'];
function $(s,el=document){return el.querySelector(s)}
function $all(s,el=document){return [...el.querySelectorAll(s)]}

// theme toggle
const root=document.documentElement;
$('#themeBtn').onclick=()=>{
  const cur=root.getAttribute('data-theme');
  const next = cur==='dark' ? 'light' : (cur==='light' ? 'dark' : (matchMedia('(prefers-color-scheme: dark)').matches?'light':'dark'));
  root.setAttribute('data-theme', next);
};

// tabs
$all('#tabs button').forEach(b=>b.onclick=()=>{
  $all('#tabs button').forEach(x=>x.classList.remove('active'));
  $all('.panel').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); $('#panel-'+b.dataset.tab).classList.add('active');
});

/* ---------- CPU SCHEDULING (Round Robin) ---------- */
let cpuTasks=[{name:'Payment-A',arrival:0,burst:6},{name:'Inventory-B',arrival:1,burst:4},{name:'Invoice-C',arrival:2,burst:8},{name:'Delivery-D',arrival:3,burst:3}];
function renderCpuTable(){
  const tb=$('#cpuTable tbody'); tb.innerHTML='';
  cpuTasks.forEach((t,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><input value="${t.name}" data-i="${i}" data-f="name"></td>
      <td><input type="number" value="${t.arrival}" data-i="${i}" data-f="arrival" style="width:60px"></td>
      <td><input type="number" value="${t.burst}" data-i="${i}" data-f="burst" style="width:60px"></td>
      <td><button class="btn ghost" data-del="${i}" style="padding:3px 8px">×</button></td>`;
    tb.appendChild(tr);
  });
  tb.onchange=e=>{
    const i=e.target.dataset.i,f=e.target.dataset.f;
    if(i!==undefined){cpuTasks[i][f]= f==='name'?e.target.value:+e.target.value;}
  };
  tb.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{cpuTasks.splice(+b.dataset.del,1); renderCpuTable();});
}
$('#cpuAdd').onclick=()=>{cpuTasks.push({name:'Task-'+(cpuTasks.length+1),arrival:0,burst:5}); renderCpuTable();};
function runRR(){
  const q=+$('#quantum').value||3;
  const procs=cpuTasks.map((t,i)=>({...t,rem:t.burst,color:COLORS[i%COLORS.length],finish:0}));
  const queue=[]; const segs=[]; let time=0; const arrived=new Set();
  procs.sort((a,b)=>a.arrival-b.arrival);
  function admit(){procs.forEach(p=>{if(!arrived.has(p.name)&&p.arrival<=time){arrived.add(p.name);queue.push(p);}})}
  admit();
  let guard=0;
  while(queue.length && guard<2000){
    guard++;
    const p=queue.shift();
    const run=Math.min(q,p.rem);
    segs.push({name:p.name,start:time,end:time+run,color:p.color});
    time+=run; p.rem-=run;
    admit();
    if(p.rem>0) queue.push(p); else p.finish=time;
  }
  // gantt
  const g=$('#gantt'); g.innerHTML=''; const scale=$('#ganttScale'); scale.innerHTML='';
  const total=time||1;
  segs.forEach(s=>{
    const w=((s.end-s.start)/total*100);
    const d=document.createElement('div'); d.className='seg'; d.style.background=s.color; d.style.width=w+'%';
    d.textContent=s.name.split('-')[0]; g.appendChild(d);
  });
  scale.innerHTML=`<span>0</span><span style="margin-left:auto">${time}</span>`;
  const leg=$('#legend'); leg.innerHTML=procs.map(p=>`<span><span class="sw" style="background:${p.color}"></span>${p.name}</span>`).join('');
  // stats
  const rb=$('#cpuResult tbody'); rb.innerHTML='';
  let totW=0,totT=0;
  procs.forEach(p=>{
    const tat=p.finish-p.arrival, wt=tat-p.burst;
    totW+=wt; totT+=tat;
    rb.innerHTML+=`<tr><td>${p.name}</td><td>${wt}</td><td>${tat}</td></tr>`;
  });
  $('#cpuStats').innerHTML=`<div><div class="stat">${(totW/procs.length).toFixed(2)}</div><div class="stat-label">Avg waiting</div></div>
   <div><div class="stat">${(totT/procs.length).toFixed(2)}</div><div class="stat-label">Avg turnaround</div></div>
   <div><div class="stat">${time}</div><div class="stat-label">Total time</div></div>`;
}
$('#cpuRun').onclick=runRR;
renderCpuTable(); runRR();

/* ---------- PRODUCER-CONSUMER ---------- */
let buf=[], bufCap=6, orderN=1;
function pcLog(msg,cls){const l=$('#pcLog'); const d=document.createElement('div'); d.className=cls||''; d.textContent=msg; l.appendChild(d); l.scrollTop=l.scrollHeight;}
function renderBuffer(){
  bufCap=+$('#bufSize').value||6;
  const bv=$('#bufferView'); bv.innerHTML='';
  for(let i=0;i<bufCap;i++){
    const s=document.createElement('div'); s.className='slot'+(i<buf.length?' full':'');
    s.textContent = i<buf.length ? buf[i] : '';
    bv.appendChild(s);
  }
  $('#semView').innerHTML=`<div>mutex: <b>${1}</b></div><div>empty: <b>${bufCap-buf.length}</b></div><div>full: <b>${buf.length}</b></div>`;
}
$('#bufSize').onchange=renderBuffer;
$('#produceBtn').onclick=()=>{
  if(buf.length>=bufCap){pcLog('⛔ Producer blocked — buffer full, wait(empty) fails','c');return;}
  const id='Order#'+(orderN++);
  buf.push(id);
  pcLog(`🛒 Producer: ${id} placed → wait(empty), wait(mutex), enqueue, signal(mutex), signal(full)`,'p');
  renderBuffer();
};
$('#consumeBtn').onclick=()=>{
  if(buf.length===0){pcLog('⛔ Consumer blocked — buffer empty, wait(full) fails','c');return;}
  const id=buf.shift();
  pcLog(`📦 Consumer: ${id} fulfilled → wait(full), wait(mutex), dequeue, signal(mutex), signal(empty)`,'c');
  renderBuffer();
};
$('#pcReset').onclick=()=>{buf=[];orderN=1;$('#pcLog').innerHTML='';renderBuffer();};
renderBuffer();

/* ---------- BANKER'S ALGORITHM ---------- */
const resNames=['Inventory','Payment GW','DB Conn'];
let bankRows=[
  {name:'Checkout-T0', alloc:[0,1,0], max:[7,5,3]},
  {name:'Invoice-T1',  alloc:[2,0,0], max:[3,2,2]},
  {name:'Refund-T2',   alloc:[3,0,2], max:[9,0,2]},
  {name:'Shipping-T3', alloc:[2,1,1], max:[2,2,2]},
  {name:'Fraud-T4',    alloc:[0,0,2], max:[4,3,3]},
];
let bankAvail=[3,3,2];
function renderBankTable(){
  let h=`<thead><tr><th>Task</th>${resNames.map(r=>`<th colspan="2">${r}</th>`).join('')}</tr>
  <tr><th></th>${resNames.map(()=>'<th>Alloc</th><th>Max</th>').join('')}</tr></thead><tbody>`;
  bankRows.forEach((r,i)=>{
    h+=`<tr><td><input data-ri="${i}" data-rf="name" value="${r.name}"></td>`;
    resNames.forEach((_,j)=>{
      h+=`<td><input type="number" style="width:50px" data-ri="${i}" data-rf="alloc${j}" value="${r.alloc[j]}"></td>`;
      h+=`<td><input type="number" style="width:50px" data-ri="${i}" data-rf="max${j}" value="${r.max[j]}"></td>`;
    });
    h+='</tr>';
  });
  h+=`<tr><td style="color:var(--sub)">Available</td>${resNames.map((_,j)=>`<td colspan="2"><input type="number" style="width:50px" data-avail="${j}" value="${bankAvail[j]}"></td>`).join('')}</tr>`;
  h+='</tbody>';
  const t=$('#bankTable'); t.innerHTML=h;
  t.onchange=e=>{
    const d=e.target.dataset;
    if(d.avail!==undefined){bankAvail[+d.avail]=+e.target.value; return;}
    if(d.ri!==undefined){
      const i=+d.ri, f=d.rf;
      if(f==='name') bankRows[i].name=e.target.value;
      else if(f.startsWith('alloc')) bankRows[i].alloc[+f.slice(5)]=+e.target.value;
      else if(f.startsWith('max')) bankRows[i].max[+f.slice(3)]=+e.target.value;
    }
  };
}
$('#bankAddRow').onclick=()=>{bankRows.push({name:'Task-'+(bankRows.length), alloc:[0,0,0], max:[1,1,1]}); renderBankTable();};
function runBankers(){
  const n=bankRows.length, m=resNames.length;
  const need=bankRows.map(r=>r.max.map((mx,j)=>mx-r.alloc[j]));
  let work=[...bankAvail]; let finish=Array(n).fill(false); let seq=[];
  let changed=true;
  while(changed){
    changed=false;
    for(let i=0;i<n;i++){
      if(!finish[i] && need[i].every((nv,j)=>nv<=work[j])){
        work=work.map((w,j)=>w+bankRows[i].alloc[j]);
        finish[i]=true; seq.push(bankRows[i].name); changed=true;
      }
    }
  }
  const safe=finish.every(f=>f);
  let needHtml=`<div class="matrix-wrap"><table><thead><tr><th>Task</th>${resNames.map(r=>`<th>${r}</th>`).join('')}</tr></thead><tbody>`+
    bankRows.map((r,i)=>`<tr><td>${r.name}</td>${need[i].map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')+'</tbody></table></div>';
  $('#bankResult').innerHTML = `
    <div class="badge ${safe?'safe':'unsafe'}">${safe? 'SAFE STATE' : 'UNSAFE — potential deadlock'}</div>
    <p class="note">${safe ? 'Safe sequence: '+seq.join(' → ') : 'No ordering of tasks lets every task finish with current allocation — granting further requests risks deadlock on these services.'}</p>
    <h3 style="margin-top:14px"><span class="dot"></span>Need matrix (Max − Allocation)</h3>
    ${needHtml}`;
}
$('#bankRun').onclick=runBankers;
renderBankTable(); runBankers();

/* ---------- MEMORY MANAGEMENT ---------- */
let heap=[{start:0,size:1000,free:true}];
let memTasks=[]; let memTaskN=1;
function memTotal(){return +$('#memTotal').value||1000}
function resetHeap(){heap=[{start:0,size:memTotal(),free:true}]; memTasks=[]; memTaskN=1; renderMem();}
$('#memReset').onclick=resetHeap;
$('#memTotal').onchange=resetHeap;
function allocate(size){
  const strat=$('#memStrategy').value;
  let idx=-1;
  if(strat==='first'){
    idx=heap.findIndex(b=>b.free && b.size>=size);
  } else {
    let best=-1;
    heap.forEach((b,i)=>{if(b.free && b.size>=size && (best===-1 || b.size<heap[best].size)) best=i;});
    idx=best;
  }
  if(idx===-1){pcMemNote('⛔ No free block big enough ('+size+' KB) — allocation failed.'); return;}
  const b=heap[idx];
  const name='Task-'+(memTaskN++);
  const allocBlock={start:b.start,size,free:false,name};
  const rest=b.size-size;
  const newBlocks=[allocBlock];
  if(rest>0) newBlocks.push({start:b.start+size,size:rest,free:true});
  heap.splice(idx,1,...newBlocks);
  memTasks.push({name,size,start:b.start});
  renderMem();
}
function freeOldest(){
  if(!memTasks.length){pcMemNote('No tasks to free.');return;}
  const t=memTasks.shift();
  const bi=heap.findIndex(b=>!b.free && b.start===t.start && b.name===t.name);
  if(bi>-1) heap[bi].free=true;
  // merge adjacent free
  heap.sort((a,b)=>a.start-b.start);
  for(let i=0;i<heap.length-1;i++){
    if(heap[i].free && heap[i+1].free){ heap[i].size+=heap[i+1].size; heap.splice(i+1,1); i--; }
  }
  renderMem();
}
function pcMemNote(msg){$('#memFragNote').textContent=msg;}
function renderMem(){
  const total=memTotal();
  const bar=$('#memBar'); bar.innerHTML='';
  heap.forEach((b,i)=>{
    const w=(b.size/total*100);
    const d=document.createElement('div'); d.className='blk'+(b.free?' free':'');
    d.style.width=w+'%';
    if(!b.free) d.style.background=COLORS[i%COLORS.length];
    d.innerHTML=`<span>${b.free?'free':b.name}</span><span>${b.size}KB</span>`;
    bar.appendChild(d);
  });
  const tb=$('#memTable tbody'); tb.innerHTML='';
  memTasks.forEach(t=>tb.innerHTML+=`<tr><td>${t.name}</td><td>${t.size}KB</td><td>${t.start}</td></tr>`);
  const freeBlocks=heap.filter(b=>b.free);
  const freeTotal=freeBlocks.reduce((s,b)=>s+b.size,0);
  const largest=freeBlocks.length?Math.max(...freeBlocks.map(b=>b.size)):0;
  const frag = freeTotal>0 ? (100*(1-largest/freeTotal)).toFixed(0) : 0;
  pcMemNote(`Free: ${freeTotal} KB across ${freeBlocks.length} hole(s) · largest hole ${largest} KB · external fragmentation ≈ ${frag}%`);
}
$('#memAlloc').onclick=()=>allocate(+$('#memReqSize').value||100);
$('#memFreeLast').onclick=freeOldest;
resetHeap();
