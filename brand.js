// Simple client-side storage + UI for Brands, Types, Qualities
// Stores data in localStorage keys: brands, types, qualities

function getData(key){
  try{ return JSON.parse(localStorage.getItem(key)) || []; }catch(e){return []}
}
function setData(key, arr){ localStorage.setItem(key, JSON.stringify(arr)); }

// IDs use timestamp to keep unique
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

// Render lists
function render(){
  renderList('brands','brandList', renderBrandItem);
  renderList('types','typeList', renderTypeItem);
  renderList('qualities','qualityList', renderQualityItem);
}

function renderList(key, ulId, itemRenderer){
  const ul = document.getElementById(ulId);
  ul.innerHTML = '';
  const q = document.getElementById('brandSearch')?.value?.toLowerCase?.() || '';
  getData(key).filter(it => !q || (it.name && it.name.toLowerCase().includes(q))).forEach(item => {
    ul.appendChild(itemRenderer(item));
  });
  if(!ul.children.length){ ul.innerHTML = '<div class="empty">No entries yet</div>'; }
}

function renderBrandItem(item){
  const li = document.createElement('li');
  const meta = document.createElement('div'); meta.className='meta';
  const title = document.createElement('div'); title.innerHTML = `<strong>${escapeHtml(item.name)}</strong><div class='small-muted'>${escapeHtml(item.description||'')}</div>`;
  meta.appendChild(title);

  const btns = document.createElement('div'); btns.className='btns';
  const e = el('button','action edit','Edit'); e.onclick = ()=>editItem('brands', item.id);
  const d = el('button','action del','Del'); d.onclick = ()=>deleteItem('brands', item.id);
  btns.appendChild(e); btns.appendChild(d);

  li.appendChild(meta); li.appendChild(btns);
  return li;
}

function renderTypeItem(item){
  const li = document.createElement('li');
  const meta = document.createElement('div'); meta.className='meta';
  const dot = document.createElement('div'); dot.className='color-dot'; dot.style.background = item.color || '#ddd';
  const title = document.createElement('div'); title.innerHTML = `<strong>${escapeHtml(item.name)}</strong><div class='small-muted'>Brand: ${escapeHtml(item.brandName || '-')}</div>`;
  meta.appendChild(dot); meta.appendChild(title);

  const btns = document.createElement('div'); btns.className='btns';
  const e = el('button','action edit','Edit'); e.onclick = ()=>editItem('types', item.id);
  const d = el('button','action del','Del'); d.onclick = ()=>deleteItem('types', item.id);
  btns.appendChild(e); btns.appendChild(d);

  li.appendChild(meta); li.appendChild(btns);
  return li;
}

function renderQualityItem(item){
  const li = document.createElement('li');
  const meta = document.createElement('div'); meta.className='meta';
  const title = document.createElement('div'); title.innerHTML = `<strong>${escapeHtml(item.label)}</strong><div class='small-muted'>Score: ${escapeHtml(item.score||'')}</div>`;
  meta.appendChild(title);

  const btns = document.createElement('div'); btns.className='btns';
  const e = el('button','action edit','Edit'); e.onclick = ()=>editItem('qualities', item.id);
  const d = el('button','action del','Del'); d.onclick = ()=>deleteItem('qualities', item.id);
  btns.appendChild(e); btns.appendChild(d);

  li.appendChild(meta); li.appendChild(btns);
  return li;
}

function el(tag, cls, txt){ const n = document.createElement(tag); n.className = cls; n.textContent = txt; return n; }

function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

// Add / Edit handlers
function submitForm(kind){
  const data = getData(kind);
  if(kind==='brands'){
    const name = document.getElementById('brandName').value.trim();
    const desc = document.getElementById('brandDesc').value.trim();
    const editId = document.getElementById('brandId').value;
    if(!name){ alert('Brand name required'); return; }
    if(editId){
      const it = data.find(x=>x.id===editId); if(it){ it.name=name; it.description=desc; }
    } else { data.unshift({id:uid(),name,description:desc,created:Date.now()}); }
    setData('brands',data); clearBrandForm(); render();
  }
  if(kind==='types'){
    const name = document.getElementById('typeName').value.trim();
    const color = document.getElementById('typeColor').value;
    const brandId = document.getElementById('typeBrand').value;
    const editId = document.getElementById('typeId').value;
    const brandName = (getData('brands').find(b=>b.id===brandId) || {}).name || '';
    if(!name){ alert('Type name required'); return; }
    if(editId){ const it=data.find(x=>x.id===editId); if(it){ it.name=name; it.color=color; it.brandId=brandId; it.brandName=brandName; } }
    else { data.unshift({id:uid(),name,color,brandId,brandName,created:Date.now()}); }
    setData('types',data); clearTypeForm(); render();
  }
  if(kind==='qualities'){
    const label = document.getElementById('qualityLabel').value.trim();
    const score = document.getElementById('qualityScore').value.trim();
    const editId = document.getElementById('qualityId').value;
    if(!label){ alert('Quality label required'); return; }
    if(editId){ const it=data.find(x=>x.id===editId); if(it){ it.label=label; it.score=score; } }
    else { data.unshift({id:uid(),label,score,created:Date.now()}); }
    setData('qualities',data); clearQualityForm(); render();
  }
}

function editItem(kind,id){
  const arr = getData(kind);
  const it = arr.find(x=>x.id===id); if(!it) return;
  if(kind==='brands'){ document.getElementById('brandId').value=it.id; document.getElementById('brandName').value=it.name; document.getElementById('brandDesc').value=it.description||''; }
  if(kind==='types'){ document.getElementById('typeId').value=it.id; document.getElementById('typeName').value=it.name; document.getElementById('typeColor').value=it.color||'#cccccc'; document.getElementById('typeBrand').value=it.brandId||''; }
  if(kind==='qualities'){ document.getElementById('qualityId').value=it.id; document.getElementById('qualityLabel').value=it.label; document.getElementById('qualityScore').value=it.score||''; }
  window.scrollTo({top:0,behavior:'smooth'});
}

function deleteItem(kind,id){
  if(!confirm('Delete this item?')) return;
  const arr = getData(kind).filter(x=>x.id!==id); setData(kind,arr); render();
}

function clearBrandForm(){ document.getElementById('brandId').value=''; document.getElementById('brandName').value=''; document.getElementById('brandDesc').value=''; }
function clearTypeForm(){ document.getElementById('typeId').value=''; document.getElementById('typeName').value=''; document.getElementById('typeColor').value='#ffb400'; document.getElementById('typeBrand').value=''; }
function clearQualityForm(){ document.getElementById('qualityId').value=''; document.getElementById('qualityLabel').value=''; document.getElementById('qualityScore').value=''; }

function populateBrandSelect(){
  const sel = document.getElementById('typeBrand'); sel.innerHTML = '<option value="">-- select brand --</option>';
  getData('brands').forEach(b=>{ const o=document.createElement('option'); o.value=b.id; o.textContent=b.name; sel.appendChild(o); });
}

// Search
function liveSearch(){ render(); }

// Init
window.addEventListener('DOMContentLoaded', ()=>{
  populateBrandSelect(); render();
  document.getElementById('brandForm')?.addEventListener('submit', e=>{ e.preventDefault(); submitForm('brands'); populateBrandSelect(); });
  document.getElementById('typeForm')?.addEventListener('submit', e=>{ e.preventDefault(); submitForm('types'); });
  document.getElementById('qualityForm')?.addEventListener('submit', e=>{ e.preventDefault(); submitForm('qualities'); });
  document.getElementById('brandSearch')?.addEventListener('input', liveSearch);
});
