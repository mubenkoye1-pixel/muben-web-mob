// brand.js - کۆدی تەواوکراو بە مۆدالی دەستکاریکردن

// --- Shared Storage Utilities ---
function getData(key){
  try{ return JSON.parse(localStorage.getItem(key)) || []; }catch(e){return []}
}
function setData(key, arr){ localStorage.setItem(key, JSON.stringify(arr)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function getBrandName(brandId) { return (getData('brands').find(b => b.id === brandId) || {}).name; }
function el(tag, cls, txt){ const n = document.createElement(tag); n.className = cls; if(txt) n.textContent = txt; return n; }

// --- Component Name Utility ---
function getKindName(kind) {
  switch(kind) {
    case 'models': return 'مۆدێل';
    case 'categories': return 'جۆر';
    case 'qualities': return 'کوالێتی';
    case 'brands': return 'براند';
    default: return 'ئایتم';
  }
}
function getKindKey(kind) { // بۆ وەرگرتنی ناوی سەرەکی کێڵگە
    if (kind === 'qualities') return 'label';
    return 'name';
}


// -------------------------------------------
// 🎨 فەنکشنەکانی دروستکردنی UI (Rendering)
// -------------------------------------------
function render(){
  renderList('models', '.body-model', renderModelItem, '.search-model');
  renderList('categories', '.body-catagore', renderCategoryItem, '.search-catagore');
  renderList('qualities', '.body-quality', renderQualityItem, '.search-quality');
  renderList('brands', '.body-brand', renderBrandItem, '.search-brand');
}

function renderList(key, containerSelector, itemRenderer, searchSelector){
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const searchInput = document.querySelector(searchSelector);
  const query = searchInput ? searchInput.value.toLowerCase() : '';

  // پاراستنی ئەو فۆرمەی کە لەوانەیە کراوە بێت بۆ زیادکردن
  const existingNewForm = container.querySelector('.new-item-form');
  container.innerHTML = '';
  if(existingNewForm) container.appendChild(existingNewForm); // گەڕاندنەوەی فۆرمی کراوە

  const filteredData = getData(key).filter(it => {
      const nameKey = getKindKey(key);
      return !query || (it[nameKey] && it[nameKey].toLowerCase().includes(query));
  });

  if(filteredData.length === 0 && !existingNewForm){
    container.innerHTML = '<div class="empty" style="padding:15px; text-align:center; color:var(--muted);">هیچ تۆمارێک نییە</div>';
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'item-list';

  // زیادکردنی ئایتمە نوێکان لەسەرەوە (لە Local Storage)
  filteredData.sort((a, b) => b.created - a.created); 

  filteredData.forEach(item => {
    ul.appendChild(itemRenderer(item, key));
  });
  container.appendChild(ul);
}

// ⚙️ فەنکشنەکانی دروستکردنی ئایتم (Item Renderers)
function renderModelItem(item, key){ return createListItem(item, key, item.name, `براند: ${getBrandName(item.brandId) || '-'}`); }
function renderCategoryItem(item, key){ return createListItem(item, key, item.name, `براند: ${getBrandName(item.brandId) || '-'}`, item.color); }
function renderQualityItem(item, key){ return createListItem(item, key, item.label, `نمرە: ${item.score || '-'}`); }
function renderBrandItem(item, key){ return createListItem(item, key, item.name, item.description || ''); }


/**
 * دروستکردنی شێوازی لیست بۆ ئایتمەکان.
 */
function createListItem(item, kind, title, subtitle, color = null){
  const li = document.createElement('li');
  li.className = 'list-item';
  li.dataset.itemId = item.id;
  li.dataset.kind = kind;

  const meta = document.createElement('div'); meta.className='meta item-view';
  if (color) {
    const dot = el('div','color-dot'); dot.style.background = color;
    meta.appendChild(dot);
  }
  const titleDiv = document.createElement('div'); titleDiv.innerHTML = `<strong>${escapeHtml(title)}</strong><div class='small-muted'>${escapeHtml(subtitle)}</div>`;
  meta.appendChild(titleDiv);

  const btns = el('div','btns');
  const e = el('button','action edit','🖋️'); e.onclick = ()=>openEditModal(item, kind); // 🆕 بانگکردنی مۆدال
  const d = el('button','action del','🗑️'); d.onclick = ()=>deleteItem(kind, item.id);
  btns.appendChild(e); btns.appendChild(d);

  li.appendChild(meta);
  li.appendChild(btns);

  return li;
}

// -------------------------------------------
// ➕➖ فەنکشنەکانی زیادکردن و سڕینەوە
// -------------------------------------------

/**
 * دروستکردن و پاشکەوتکردنی ئایتمێکی نوێ لە ڕیزی ناوخۆیی (Inline Row)
 */
function addNewItemInput(kind) {
  // لۆژیکی پێشووی زیادکردن وەک خۆی دەمێنێتەوە
  const containerSelector = {
    'models': '.body-model', 'categories': '.body-catagore',
    'qualities': '.body-quality', 'brands': '.body-brand'
  }[kind];
  const container = document.querySelector(containerSelector);
  if (!container) return;

  if (container.querySelector('.new-item-form')) return;

  const form = el('div', 'list-item new-item-form');

  const input = el('input', 'new-item-input');
  input.type = 'text';
  input.placeholder = `ناوی نوێی ${getKindName(kind)} بنووسە...`;
  input.dir = 'rtl';

  const saveBtn = el('button', 'action save-new', '✅');
  saveBtn.onclick = () => saveNewItem(kind, input.value, form);

  const cancelBtn = el('button', 'action cancel-new', '❌');
  cancelBtn.onclick = () => form.remove();

  form.appendChild(input);
  form.appendChild(saveBtn);
  form.appendChild(cancelBtn);

  if (container.querySelector('.empty')) {
    container.innerHTML = '';
  }
  container.prepend(form);
  input.focus();
}

// --- Data CRUD Utilities (بۆ ئەوەی پشکنینی دووبارەبوونەوەی تێدا بەکار بهێنین) ---
function getKindKey(kind) { // بۆ وەرگرتنی ناوی سەرەکی کێڵگە
    if (kind === 'qualities') return 'label';
    return 'name';
}

// -------------------------------------------
// ➕ فەنکشنی زیادکردنی ئایتمی نوێ (چاککراو بۆ پشکنینی دووبارەبوونەوە)
// -------------------------------------------

function saveNewItem(kind, value, formElement) {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        alert(`تکایە ناوی ${getKindName(kind)} بنووسە.`);
        return;
    }

    const data = getData(kind);
    const nameKey = getKindKey(kind);

    // 🛑 پشکنینی دووبارەبوونەوە (Case-Insensitive)
    const isDuplicate = data.some(item => 
        item[nameKey] && String(item[nameKey]).toLowerCase() === trimmedValue.toLowerCase()
    );

    if (isDuplicate) {
        alert(`ناوی ${getKindName(kind)} ("${trimmedValue}") پێشتر تۆمار کراوە!`);
        return; // ڕێگە لە زیادکردنی دووبارە دەگرێت
    }

    // دروستکردنی ئۆبجێکتی نوێ
    let newItem = {};
    if (kind === 'brands') {
        newItem = { [nameKey]: trimmedValue, description: '' };
    } else if (kind === 'qualities') {
        newItem = { [nameKey]: trimmedValue, score: '' }; // [nameKey] لێرە واتە label
    } else {
        newItem = { [nameKey]: trimmedValue, brandId: '' }; // بۆ مۆدێل و جۆر
    }

    saveItem(kind, newItem);
    formElement.remove(); 
}

// --- Data CRUD ---
function saveItem(kind, item){
  const data = getData(kind);
  const existingIndex = item.id ? data.findIndex(x=>x.id===item.id) : -1;

  if (existingIndex > -1) {
    // دەستکاریکردن
    data[existingIndex] = {...data[existingIndex], ...item};
    alert(`${getKindName(kind)}ەکە نوێکرایەوە.`);
  } else {
    // زیادکردن
    data.unshift({id:uid(), ...item, created:Date.now()});
    alert(`${getKindName(kind)}ی نوێ زیاد کرا.`);
  }

  setData(kind, data);
  render();
}

function deleteItem(kind, id){
  if(!confirm(`ئایا دڵنیای لە سڕینەوەی ئەم ${getKindName(kind)}ـە؟`)) return;
  const arr = getData(kind).filter(x=>x.id!==id);
  setData(kind,arr);
  render();
}

// -------------------------------------------
// 📝 فەنکشنەکانی دەستکاریکردنی مۆدال (Modal Edit Functions)
// -------------------------------------------
let currentEditingItem = null; // بۆ هەڵگرتنی داتای ئایتمی دەستکاریکراو

/**
 * کردنەوەی مۆدالی دەستکاریکردن و پڕکردنەوەی خانەکان.
 */
/**
 * کردنەوەی مۆدالی دەستکاریکردن و پڕکردنەوەی خانەکان.
 */
function openEditModal(item, kind) {
    currentEditingItem = { ...item, kind: kind }; // داتای هەنوکەیی پاشەکەوت بکە

    // 🛑 چەسپێنەرە سەلامەتییەکان بۆ توخمە سەرەکییەکان
    const modalTitleEl = document.getElementById('editModalTitle');
    const modalKindEl = document.getElementById('modalKind');
    const formBody = document.getElementById('editFormBody');
    const editModal = document.getElementById('editModal');

    // دڵنیابوون لەوەی کە هەموو توخمەکانی ناو مۆدالەکە بوونیان هەیە
    if (!modalTitleEl || !modalKindEl || !formBody || !editModal) {
        console.error('توخمە سەرەکییەکانی مۆدالی دەستکاریکردن نەدۆزرانەوە (editModalTitle, modalKind, editFormBody, or editModal). تکایە HTML بپشکنە.');
        return; 
    }

    // پڕکردنەوەی بەها سەرەکییەکان
    modalTitleEl.textContent = `دەستکاریکردنی ${getKindName(kind)}: ${item[getKindKey(kind)]}`;
    modalKindEl.value = kind;
    
    // لابردنی هەموو خانەکانی پێشوو
    formBody.innerHTML = '';
    
    // کێڵگەی ناوی سەرەکی
    const nameKey = getKindKey(kind);
    formBody.appendChild(createInputField(nameKey, `${getKindName(kind)}`, item[nameKey] || '', 'text', true));

    // دروستکردنی کێڵگە تایبەتەکان بە پێی جۆر
    if (kind === 'brands') {
        formBody.appendChild(createInputField('description', 'تێبینی', item.description || '', 'textarea', false));
    } else if (kind === 'qualities') {
        formBody.appendChild(createInputField('score', 'نمرە', item.score || '', 'number', false));
    } else if (kind === 'models' || kind === 'categories') {
        // زیادکردنی کێڵگەی هەڵبژاردنی براند
        formBody.appendChild(createBrandSelect('brandId', 'براند', item.brandId || ''));
        if (kind === 'categories') {
            formBody.appendChild(createInputField('color', 'ڕەنگ', item.color || '#007bff', 'color', true));
        }
    }
    
    // نیشاندانی مۆدالەکە
    editModal.style.display = 'flex';
}

/**
 * دروستکردنی کێڵگەیەکی نووسین/ژمارە بۆ مۆدال
 */
function createInputField(id, label, value, type = 'text', required = false) {
    const div = el('div', 'form-group');
        
    const lbl = el('label');
    lbl.setAttribute('for', 'edit-' + id);
    lbl.textContent = label;
    div.appendChild(lbl);
    
    const input = el(type === 'textarea' ? 'textarea' : 'input', 'edit-input');
    input.id = 'edit-' + id;
    if (type !== 'textarea') input.type = type;
    input.value = value;
    input.dir = 'rtl';
    if(required) input.required = true;
    
    div.appendChild(input);
    return div;
}

/**
 * دروستکردنی کێڵگەی سێلێکت بۆ براندەکان
 */
function createBrandSelect(id, label, selectedId) {
    const div = el('div', 'form-group');
        
    const lbl = el('label');
    lbl.setAttribute('for', 'edit-' + id);
    lbl.textContent = label;
    div.appendChild(lbl);
    
    const select = el('select', 'edit-input');
    select.id = 'edit-' + id;
    select.dir = 'rtl';
    
    const brands = getData('brands');
    
    let defaultOpt = el('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '— هەڵبژێرە —';
    select.appendChild(defaultOpt);
    
    brands.forEach(brand => {
        const option = el('option');
        option.value = brand.id;
        option.textContent = brand.name;
        if (brand.id === selectedId) option.selected = true;
        select.appendChild(option);
    });
    
    div.appendChild(select);
    return div;
}

/**
 * پاشکەوتکردنی گۆڕانکارییەکان لە مۆدال.
 */
function saveEditForm(event) {
    event.preventDefault();
    
    if (!currentEditingItem) return;

    const kind = currentEditingItem.kind;
    const nameKey = getKindKey(kind);
    
    // وەرگرتنی بەهای سەرەکی و پشکنین
    const mainValue = document.getElementById('edit-' + nameKey)?.value.trim();
    if (!mainValue) {
        alert(`تکایە ناوی ${getKindName(kind)} بنووسە.`);
        return;
    }
    
    // دروستکردنی ئۆبجێکتی نوێ
    let updatedItem = {
        id: currentEditingItem.id,
        [nameKey]: mainValue
    };
    
    // زیادکردنی کێڵگە تایبەتەکان
    if (kind === 'brands') {
        updatedItem.description = document.getElementById('edit-description').value.trim();
    } else if (kind === 'qualities') {
        updatedItem.score = parseInt(document.getElementById('edit-score').value) || 0;
    } else if (kind === 'models' || kind === 'categories') {
        updatedItem.brandId = document.getElementById('edit-brandId').value;
        if (kind === 'categories') {
            updatedItem.color = document.getElementById('edit-color').value;
        }
    }
    
    // پاشکەوتکردن و داخستن
    saveItem(kind, updatedItem);
    closeEditModal();
}

/**
 * داخستنی مۆدالی دەستکاریکردن.
 */
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditingItem = null;
}

// -------------------------------------------
// 🎬 کارکردنی دەستپێکردن و ڕووداوەکان
// -------------------------------------------

window.addEventListener('DOMContentLoaded', ()=>{
  render();

  // 🔗 بەستنەوەی دوگمەکانی زیادکردن (+) بۆ کردنەوەی ڕیزی Input
  document.querySelector('.add-model')?.addEventListener('click', () => addNewItemInput('models'));
  document.querySelector('.add-catagore')?.addEventListener('click', () => addNewItemInput('categories'));
  document.querySelector('.add-quality')?.addEventListener('click', () => addNewItemInput('qualities'));
  document.querySelector('.add-brand')?.addEventListener('click', () => addNewItemInput('brands'));

  // 🔎 بەستنەوەی فۆرمی گەڕان
  document.querySelector('.search-model')?.addEventListener('input', render);
  document.querySelector('.search-catagore')?.addEventListener('input', render);
  document.querySelector('.search-quality')?.addEventListener('input', render);
  document.querySelector('.search-brand')?.addEventListener('input', render);
  
  // 🆕 بەستنەوەی دوگمەکانی مۆدال
  const editForm = document.getElementById('editForm');
  if(editForm) editForm.addEventListener('submit', saveEditForm);
  
  const closeModalBtn = document.querySelector('.close-modal');
  if(closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);
});