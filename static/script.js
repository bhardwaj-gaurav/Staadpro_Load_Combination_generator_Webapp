// Mirror the Tkinter behavior: keyboard navigation, generate/clear, AJAX to backend, modal copy
document.addEventListener('DOMContentLoaded', () => {
  const N = 11; // number of cases
  const R = 10; // number of combinations rows

  // Helper to get elements
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

  // Keyboard navigation: arrow keys move focus in grid
  const focusMap = []; // list of focusable elements with grid coords
  // Row 0: names (rowIndex 0), Row1: types (1), Comb rows 2..11 (2..11), Subcase row 12 (12)
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
        // clamp
        if (nc < 0) nc = 0;
        if (nc > N-1) nc = N-1;
        if (nr < 0) nr = 0;
        if (nr > 2+R) nr = 2+R;
        const target = findByCoord(nr,nc);
        if (target) target.el.focus();
      }
    });
  });

  // Clear function: reset to defaults
  function clearAll(){
  for (let i=0;i<N;i++){
    nameEls[i].value = "";        // keep name inputs empty
    typeEls[i].selectedIndex = 0;
    subEls[i].value = "";         // keep subcase inputs empty
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

  // Generate: collect data, POST to /generate, show modal
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

  // Modal actions
  copyBtn.addEventListener('click', ()=>{
    navigator.clipboard.writeText(outputText.value).then(()=>{
      alert('STAAD.Pro commands copied to clipboard!');
    }).catch(()=>{ alert('Copy failed'); });
  });
  closeBtn.addEventListener('click', ()=> modal.style.display = 'none');

  // Close modal on outside click
  modal.addEventListener('click', (e)=>{ if (e.target === modal) modal.style.display = 'none'; });

  // initialize
  clearAll();
});
