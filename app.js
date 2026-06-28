/**
 * app.js — Goal Organizer application logic
 * Handles: rendering, edit mode, localStorage persistence,
 *          import/export, and dynamic add/delete of items.
 */

// ── STATE ──────────────────────────────────────────────
const STORAGE_KEY = 'goal-organizer-v1';
let appData = null;
let isEditMode = false;
let pendingModalCallback = null;

// ── INIT ───────────────────────────────────────────────
function init() {
  appData = loadData();
  renderAll();
  bindInlineEditors();
}

// ── DATA PERSISTENCE ───────────────────────────────────
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch(e) { console.warn('Could not load saved data', e); }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));  // deep clone default
}

function saveData() {
  // Harvest inline-edited text back into appData
  harvestInlineEdits();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    showToast('Saved! ✅');
  } catch(e) { showToast('Save failed ❌'); }
}

function resetData() {
  if (!confirm('Reset ALL content to default? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  renderAll();
  bindInlineEditors();
  showToast('Reset to defaults 🔄');
}

// ── EXPORT / IMPORT ────────────────────────────────────
function exportJSON() {
  harvestInlineEdits();
  const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'goal-organizer-data.json';
  a.click();
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      appData = JSON.parse(e.target.result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
      renderAll();
      bindInlineEditors();
      showToast('Imported! ✅');
    } catch(err) { showToast('Invalid JSON file ❌'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ── RENDER ENGINE ──────────────────────────────────────
function renderAll() {
  renderHero();
  renderCards();
  renderWeek();
  renderBlocks();
  renderExec();
  renderGoalList('longterm');
  renderGoalList('shortterm');
  renderRules();
}

function renderHero() {
  setEditable('hero.badge',  appData.hero.badge);
  setEditable('hero.title',  appData.hero.title);
  setEditable('hero.sub1',   appData.hero.sub1);
  setEditable('hero.sub2',   appData.hero.sub2);
}

function renderCards() {
  appData.cards.forEach((c, i) => {
    setEditable(`cards.${i}.label`, c.label);
    setEditable(`cards.${i}.title`, c.title);
    setEditable(`cards.${i}.desc`,  c.desc);
  });
}

function renderWeek() {
  setEditable('week.title', appData.week.title);
  setEditable('week.sub',   appData.week.sub);

  const grid = document.getElementById('week-grid');
  grid.innerHTML = '';
  appData.week.days.forEach((day, idx) => {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.dataset.dayIdx = idx;
    card.innerHTML = `
      <div class="day-header" style="background:${day.color}">${escHtml(day.name)}</div>
      <div class="day-body">
        <div class="day-section-label" style="color:${day.color}">FOCUS</div>
        <div class="day-section-text" data-daykey="${idx}.focus" data-editable="text">${escHtml(day.focus)}</div>
        <div class="day-section-label" style="color:${day.color}">BUILD</div>
        <div class="day-section-text" data-daykey="${idx}.build" data-editable="text">${escHtml(day.build)}</div>
        <div class="day-section-label" style="color:${day.color}">THEORY</div>
        <div class="day-section-text" data-daykey="${idx}.theory" data-editable="text">${escHtml(day.theory)}</div>
        <div class="day-section-label" style="color:${day.color}">DSA</div>
        <div class="day-section-text" data-daykey="${idx}.dsa" data-editable="text">${escHtml(day.dsa)}</div>
        <div class="day-deliverable" data-daykey="${idx}.deliverable" data-editable="text">Deliverable: ${escHtml(day.deliverable)}</div>
      </div>`;
    grid.appendChild(card);
  });
  if (isEditMode) activateDayEditors();
}

function renderBlocks() {
  setEditable('daily.title', appData.daily.title);
  setEditable('daily.sub',   appData.daily.sub);

  const tbody = document.getElementById('blocks-body');
  tbody.innerHTML = '';
  appData.daily.blocks.forEach((b, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="block-time" data-blkey="${idx}.time"  data-editable="text">${escHtml(b.time)}</td>
      <td class="block-name" data-blkey="${idx}.name"  data-editable="text">${escHtml(b.name)}</td>
      <td class="block-what" data-blkey="${idx}.what"  data-editable="text">${escHtml(b.what)}</td>
      <td class="block-out"  data-blkey="${idx}.output" data-editable="text">${escHtml(b.output)}</td>`;
    tbody.appendChild(tr);
  });
  if (isEditMode) activateBlockEditors();
}

function renderExec() {
  setEditable('exec.title', appData.exec.title);
  setEditable('exec.sub',   appData.exec.sub);

  const grid = document.getElementById('exec-grid');
  grid.innerHTML = '';
  appData.exec.weeks.forEach((w, idx) => {
    const card = document.createElement('div');
    card.className = 'exec-card';
    card.innerHTML = `
      <div class="exec-header" style="border-bottom-color:${w.color}">
        <div class="exec-week" style="color:${w.color}" data-exkey="${idx}.week" data-editable="text">${escHtml(w.week)}</div>
        <div class="exec-name" data-exkey="${idx}.name" data-editable="text">${escHtml(w.name)}</div>
      </div>
      <div class="exec-body">
        <div class="exec-desc"  data-exkey="${idx}.desc"  data-editable="text">${escHtml(w.desc)}</div>
        <div class="exec-proof" data-exkey="${idx}.proof" data-editable="text">${escHtml(w.proof)}</div>
      </div>`;
    grid.appendChild(card);
  });
  if (isEditMode) activateExecEditors();
}

function renderGoalList(type) {
  const key    = type; // 'longterm' or 'shortterm'
  const listEl = document.getElementById(`${type}-list`);
  const items  = appData[key].items;

  setEditable(`${key}.title`, appData[key].title);
  setEditable(`${key}.sub`,   appData[key].sub);

  listEl.innerHTML = '';
  items.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'goal-item';
    el.dataset.type = type;
    el.dataset.idx  = idx;
    el.innerHTML = `
      <div class="goal-icon">${escHtml(item.icon)}</div>
      <div class="goal-content">
        <div class="goal-item-title" data-goalkey="${type}.${idx}.title" data-editable="text">${escHtml(item.title)}</div>
        <div class="goal-item-desc"  data-goalkey="${type}.${idx}.desc"  data-editable="text">${escHtml(item.desc)}</div>
        <div class="goal-progress">
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width:${item.progress}%"></div>
          </div>
          <span class="progress-pct">${item.progress}%</span>
        </div>
      </div>
      <button class="goal-delete" onclick="deleteGoal('${type}', ${idx})" title="Delete">✕</button>`;
    listEl.appendChild(el);
  });
  if (isEditMode) activateGoalEditors(type);
}

function renderRules() {
  setEditable('rules.title', appData.rules.title);
  setEditable('rules.body',  appData.rules.body);
}

// ── INLINE EDITOR BINDING ──────────────────────────────
function bindInlineEditors() {
  // Static elements with data-key
  document.querySelectorAll('[data-key][data-editable]').forEach(el => {
    el.addEventListener('input', () => {
      setByPath(appData, el.dataset.key, el.textContent.trim());
    });
  });
}

function activateDayEditors() {
  document.querySelectorAll('[data-daykey][data-editable]').forEach(el => {
    if (el._dayBound) return;
    el._dayBound = true;
    el.addEventListener('input', () => {
      const [idx, field] = el.dataset.daykey.split('.');
      if (field === 'deliverable') {
        appData.week.days[idx].deliverable = el.textContent.replace(/^Deliverable:\s*/,'').trim();
      } else {
        appData.week.days[idx][field] = el.textContent.trim();
      }
    });
  });
}

function activateBlockEditors() {
  document.querySelectorAll('[data-blkey][data-editable]').forEach(el => {
    if (el._blBound) return;
    el._blBound = true;
    el.addEventListener('input', () => {
      const [idx, field] = el.dataset.blkey.split('.');
      appData.daily.blocks[idx][field] = el.textContent.trim();
    });
  });
}

function activateExecEditors() {
  document.querySelectorAll('[data-exkey][data-editable]').forEach(el => {
    if (el._exBound) return;
    el._exBound = true;
    el.addEventListener('input', () => {
      const [idx, field] = el.dataset.exkey.split('.');
      appData.exec.weeks[idx][field] = el.textContent.trim();
    });
  });
}

function activateGoalEditors(type) {
  document.querySelectorAll(`[data-goalkey^="${type}."][data-editable]`).forEach(el => {
    if (el._goalBound) return;
    el._goalBound = true;
    el.addEventListener('input', () => {
      const parts = el.dataset.goalkey.split('.');
      const idx   = parseInt(parts[1]);
      const field = parts[2];
      appData[type].items[idx][field] = el.textContent.trim();
    });
  });
}

// ── HARVEST all inline edits → appData ─────────────────
function harvestInlineEdits() {
  document.querySelectorAll('[data-key][data-editable]').forEach(el => {
    setByPath(appData, el.dataset.key, el.textContent.trim());
  });
  document.querySelectorAll('[data-daykey]').forEach(el => {
    const [idx, field] = el.dataset.daykey.split('.');
    if (field === 'deliverable') {
      appData.week.days[idx].deliverable = el.textContent.replace(/^Deliverable:\s*/,'').trim();
    } else {
      appData.week.days[idx][field] = el.textContent.trim();
    }
  });
  document.querySelectorAll('[data-blkey]').forEach(el => {
    const [idx, field] = el.dataset.blkey.split('.');
    appData.daily.blocks[idx][field] = el.textContent.trim();
  });
  document.querySelectorAll('[data-exkey]').forEach(el => {
    const [idx, field] = el.dataset.exkey.split('.');
    appData.exec.weeks[idx][field] = el.textContent.trim();
  });
  document.querySelectorAll('[data-goalkey]').forEach(el => {
    const parts = el.dataset.goalkey.split('.');
    const type  = parts[0];
    const idx   = parseInt(parts[1]);
    const field = parts[2];
    appData[type].items[idx][field] = el.textContent.trim();
  });
}

// ── TOGGLE EDIT MODE ───────────────────────────────────
function toggleEdit() {
  isEditMode = !isEditMode;
  document.body.classList.toggle('edit-mode', isEditMode);

  const btnEdit  = document.getElementById('btn-edit');
  const btnSave  = document.getElementById('btn-save');
  const btnReset = document.getElementById('btn-reset');
  const btnAddL  = document.getElementById('btn-add-long');
  const btnAddS  = document.getElementById('btn-add-short');

  if (isEditMode) {
    btnEdit.textContent = '👁️ View Mode';
    btnSave.classList.remove('hidden');
    btnReset.classList.remove('hidden');
    btnAddL.style.display = '';
    btnAddS.style.display = '';

    // Make static elements contenteditable
    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'true';
    });
    activateDayEditors();
    activateBlockEditors();
    activateExecEditors();
    activateGoalEditors('longterm');
    activateGoalEditors('shortterm');
    showToast('Edit Mode ON — click any text to edit ✏️');
  } else {
    btnEdit.textContent = '✏️ Edit Mode';
    btnSave.classList.add('hidden');
    btnReset.classList.add('hidden');
    btnAddL.style.display = 'none';
    btnAddS.style.display = 'none';

    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'false';
    });
    showToast('View Mode — edits are live until page reload');
  }
}

// ── ADD / DELETE GOALS ─────────────────────────────────
function addGoal(type) {
  const title = document.getElementById('modal-title');
  const body  = document.getElementById('modal-body');
  title.textContent = type === 'long' ? 'Add Long-Term Goal' : 'Add Short-Term Goal';
  body.innerHTML = `
    <input id="m-icon"  type="text"     placeholder="Icon emoji (e.g. 🎯)" maxlength="4" />
    <input id="m-title" type="text"     placeholder="Goal title" />
    <textarea id="m-desc"              placeholder="Short description"></textarea>
    <label style="font-size:.82rem;color:var(--text-muted)">Progress %</label>
    <input id="m-prog"  type="number"  min="0" max="100" value="0" />`;

  pendingModalCallback = () => {
    const key = type === 'long' ? 'longterm' : 'shortterm';
    appData[key].items.push({
      icon:     document.getElementById('m-icon').value  || '🎯',
      title:    document.getElementById('m-title').value || 'New Goal',
      desc:     document.getElementById('m-desc').value  || '',
      progress: parseInt(document.getElementById('m-prog').value) || 0
    });
    renderGoalList(key);
    bindInlineEditors();
    if (isEditMode) {
      document.querySelectorAll('[data-editable]').forEach(el => { el.contentEditable = 'true'; });
      activateGoalEditors(key);
    }
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function deleteGoal(type, idx) {
  if (!isEditMode) return;
  appData[type].items.splice(idx, 1);
  renderGoalList(type);
  if (isEditMode) {
    document.querySelectorAll('[data-editable]').forEach(el => { el.contentEditable = 'true'; });
    activateGoalEditors(type);
  }
}

// ── MODAL ──────────────────────────────────────────────
function confirmModal() {
  if (pendingModalCallback) pendingModalCallback();
  pendingModalCallback = null;
  closeModalDirect();
}

function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModalDirect();
}

function closeModalDirect() {
  document.getElementById('modal-overlay').classList.add('hidden');
  pendingModalCallback = null;
}

// ── UTILS ──────────────────────────────────────────────
function setEditable(key, value) {
  const el = document.querySelector(`[data-key="${key}"]`);
  if (el) el.textContent = value;
}

function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = isNaN(parts[i]) ? parts[i] : parseInt(parts[i]);
    cur = cur[k];
  }
  const last = isNaN(parts[parts.length-1]) ? parts[parts.length-1] : parseInt(parts[parts.length-1]);
  cur[last] = value;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    Object.assign(toast.style, {
      position:'fixed', bottom:'24px', right:'24px',
      background:'#1e3a5f', color:'#fff',
      padding:'12px 20px', borderRadius:'10px',
      fontWeight:'600', fontSize:'.88rem',
      boxShadow:'0 4px 20px rgba(0,0,0,.3)',
      zIndex:'9999', transition:'opacity .3s',
      fontFamily: "'Inter',sans-serif"
    });
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ── START ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
