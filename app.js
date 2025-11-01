// Simple PWA logic for Service L90
const storageKey = 'service_l90_data_v1';

let data = {
  car: { name: 'L90', plate: '', km: 12000 },
  services: []
};

function load(){
  try{
    const raw = localStorage.getItem(storageKey);
    if(raw) data = JSON.parse(raw);
  }catch(e){ console.error(e); }
  renderCar();
  renderServices();
  renderDashboard();
}
function save(){ localStorage.setItem(storageKey, JSON.stringify(data)); }

function renderCar(){
  document.getElementById('carName').value = data.car.name || '';
  document.getElementById('carPlate').value = data.car.plate || '';
  document.getElementById('carKm').value = data.car.km || 0;
}
function renderServices(){
  const el = document.getElementById('serviceList'); el.innerHTML='';
  data.services.forEach((s, idx) => {
    const div = document.createElement('div'); div.className='svc';
    div.innerHTML = `<div><strong>${s.title}</strong><div class="small">${s.date||''} ${s.km? ' - ' + s.km + ' km':''}</div></div>
      <div>
        <button onclick="markDone(${idx})">${s.done? '✔️' : '⭕'}</button>
        <button onclick="removeSvc(${idx})">🗑️</button>
      </div>`;
    el.appendChild(div);
  });
}

function renderDashboard(){
  const el = document.getElementById('dashboard'); el.innerHTML='';
  const upcoming = data.services.filter(s => !s.done && (
    (s.date && daysUntil(s.date) <= 7 && daysUntil(s.date) >=0) ||
    (s.km && (s.km - (data.car.km||0)) <= 500 && (s.km - (data.car.km||0))>=0)
  ));
  if(upcoming.length===0){ el.innerHTML='<p class="small">سرویسی نزدیک نیست.</p>'; return; }
  upcoming.forEach(s=>{
    const d = document.createElement('div'); d.className='svc';
    d.innerHTML = `<div><strong>${s.title}</strong><div class="small">${s.date||''} ${s.km? ' - ' + s.km + ' km':''}</div></div>`;
    el.appendChild(d);
  });
}

// Helpers
function daysUntil(dateStr){
  if(!dateStr) return 9999;
  const d = new Date(dateStr); const diff = (d - new Date())/(1000*60*60*24); return Math.ceil(diff);
}

// Actions
document.getElementById('saveCar').addEventListener('click', ()=>{
  data.car.name = document.getElementById('carName').value||'L90';
  data.car.plate = document.getElementById('carPlate').value||'';
  data.car.km = parseInt(document.getElementById('carKm').value||0);
  save(); renderCar(); alert('اطلاعات خودرو ذخیره شد');
});
document.getElementById('addSvc').addEventListener('click', ()=>{
  const s = {
    title: document.getElementById('svcTitle').value||'',
    date: document.getElementById('svcDate').value||'',
    km: document.getElementById('svcKm').value? parseInt(document.getElementById('svcKm').value):null,
    notes: document.getElementById('svcNotes').value||'',
    done: false, doneDate:null, doneKm:null
  };
  if(!s.title){ alert('عنوان سرویس را وارد کنید'); return; }
  data.services.push(s); save(); renderServices(); renderDashboard();
  scheduleNotificationFor(s);
  document.getElementById('svcTitle').value=''; document.getElementById('svcDate').value=''; document.getElementById('svcKm').value=''; document.getElementById('svcNotes').value='';
});

function markDone(i){
  data.services[i].done = !data.services[i].done;
  if(data.services[i].done){ data.services[i].doneDate = new Date().toISOString(); data.services[i].doneKm = data.car.km; }
  save(); renderServices(); renderDashboard();
}
function removeSvc(i){ if(confirm('آیا حذف شود؟')){ data.services.splice(i,1); save(); renderServices(); renderDashboard(); } }
document.getElementById('clearData').addEventListener('click', ()=>{ if(confirm('همه داده‌ها حذف شود؟')){ data = {car:{name:'L90',plate:'',km:12000}, services:[]}; save(); load(); } });

// Export CSV
document.getElementById('exportCsv').addEventListener('click', ()=>{
  const rows = [['عنوان','تاریخ برنامه','کیلومتر برنامه','انجام شده','تاریخ انجام','کیلومتر انجام','یادداشت']];
  data.services.forEach(s=> rows.push([s.title, s.date||'', s.km||'', s.done? 'True':'False', s.doneDate||'', s.doneKm||'', s.notes||'']));
  const csv = rows.map(r=> r.map(c=> '\"'+String(c).replace(/\"/g,'\"\"')+'\"').join(',')).join('\\n');
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${data.car.name}_services.csv`; a.click();
});

// Export PDF using print dialog
document.getElementById('exportPdf').addEventListener('click', ()=>{
  const w = window.open('', '_blank');
  const title = `<h2>گزارش سرویس - ${data.car.name}</h2>`;
  let html = '<table border="1" cellpadding="6" style="border-collapse:collapse; width:100%"><tr><th>عنوان</th><th>تاریخ</th><th>کیلومتر</th><th>انجام شده</th><th>تاریخ انجام</th><th>کیلومتر انجام</th><th>یادداشت</th></tr>';
  data.services.forEach(s=> html += `<tr><td>${s.title}</td><td>${s.date||''}</td><td>${s.km||''}</td><td>${s.done? 'بله':'خیر'}</td><td>${s.doneDate||''}</td><td>${s.doneKm||''}</td><td>${s.notes||''}</td></tr>`);
  html += '</table>';
  w.document.write(`<html><head><meta charset="utf-8"><title>گزارش</title></head><body>${title}${html}</body></html>`);
  w.document.close();
  w.print();
});

// Theme toggle and init
document.getElementById('themeBtn').addEventListener('click', ()=>{
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark')? 'dark':'light');
});
window.addEventListener('load', ()=>{
  const t = localStorage.getItem('theme')||'light'; if(t==='dark') document.body.classList.add('dark');
  load();
});

// Notifications (limited on iOS Safari)
function scheduleNotificationFor(s){
  if(!('Notification' in window)) return;
  if(Notification.permission === 'default') Notification.requestPermission();
  if(Notification.permission !== 'granted') return;
  if(s.date){
    const when = new Date(s.date).getTime() - (3*24*60*60*1000);
    const delay = when - Date.now();
    if(delay>0 && delay < 2147483647){
      setTimeout(()=> new Notification('یادآوری سرویس', { body: `${s.title} در سه روز آینده است.` }), delay);
    }
  }
}
