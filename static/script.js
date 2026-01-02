document.addEventListener('DOMContentLoaded', () => {
  const N = 11;
  const R = 10; 

  const nameEls = Array.from({length:N}, (_,i)=>document.getElementById(`name${i}`));
  const typeEls = Array.from({length:N}, (_,i)=>document.getElementById(`type${i}`));
  const subEls  = Array.from({length:N}, (_,i)=>document.getElementById(`sub${i}`));
  const coeffEls = [];
  for (let r=0;r<R;r++){
    const row = [];
    for (let c=0;c<N;c++){
      row.push(document.getElementById(`coeff_r${r}_c${c}`));
    }
    coeffEls.push(row);
  }

  const startLoad = document.getElementById('start_load');
  const startComb = document.getElementById('start_comb');
  const totalLoads = document.getElementById('total_loads');
  const totalCombs = document.getElementById('total_combs');
  const generateBtn = document.getElementById('generate');
  const clearBtn = document.getElementById('clear');

  const modal = document.getElementById('outputModal');
  const outputText = document.getElementById('outputText');
  const copyBtn = document.getElementById('copyBtn');
  const closeBtn = document.getElementById('closeBtn');

  const focusMap = [];
  for (let c=0;c<N;c++){
    focusMap.push({el:nameEls[c], r:0, c});
  }
  for (let c=0;c<N;c++){
    focusMap.push({el:typeEls[c], r:1, c});
  }
  for (let r=0;r<R;r++){
    for (let c=0;c<N;c++){
      focusMap.push({el:coeffEls[r][c], r:2+r, c});
    }
  }
  for (let c=0;c<N;c++){
    focusMap.push({el:subEls[c], r:2+R, c});
  }

  function findByCoord(r,c){
    return focusMap.find(f=>f.r===r && f.c===c);
  }

  focusMap.forEach(f=>{
    f.el.addEventListener('keydown', (ev)=>{
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.key)){
        ev.preventDefault();
        let nr=f.r, nc=f.c;
        if (ev.key==='ArrowUp') nr = f.r - 1;
        if (ev.key==='ArrowDown') nr = f.r + 1;
        if (ev.key==='ArrowLeft') nc = f.c - 1;
        if (ev.key==='ArrowRight') nc = f.c + 1;
        if (nc < 0) nc = 0;
        if (nc > N-1) nc = N-1;
        if (nr < 0) nr = 0;
        if (nr > 2+R) nr = 2+R;
        const target = findByCoord(nr,nc);
        if (target) target.el.focus();
      }
    });
  });

  function clearAll(){
  for (let i=0;i<N;i++){
    nameEls[i].value = "";      
    typeEls[i].selectedIndex = 0;
    subEls[i].value = "";      
  }
  for (let r=0;r<R;r++){
    for (let c=0;c<N;c++){
      coeffEls[r][c].value = "";
    }
  }
  startLoad.value = "1";
  startComb.value = "101";
  totalLoads.value = "";
  totalCombs.value = "";
}
clearBtn.addEventListener('click', clearAll);

  generateBtn.addEventListener('click', async ()=>{
    const payload = {
      start_load: startLoad.value,
      start_comb: startComb.value,
      names: nameEls.map(e=>e.value),
      types: typeEls.map(e=>e.value),
      subcases: subEls.map(e=>e.value),
      coeffs: coeffEls.map(row=>row.map(cell=>cell.value))
    };
    try {
      const res = await fetch('/generate', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      outputText.value = json.output;
      totalLoads.value = json.total_loads;
      totalCombs.value = json.total_combs;
      modal.style.display = 'flex';
    } catch (err) {
      alert('Error generating combinations: ' + err.message);
    }
  });

  copyBtn.addEventListener('click', ()=>{
    navigator.clipboard.writeText(outputText.value).then(()=>{
      alert('STAAD.Pro commands copied to clipboard!');
    }).catch(()=>{ alert('Copy failed'); });
  });
  closeBtn.addEventListener('click', ()=> modal.style.display = 'none');

  modal.addEventListener('click', (e)=>{ if (e.target === modal) modal.style.display = 'none'; });
  clearAll();
});
