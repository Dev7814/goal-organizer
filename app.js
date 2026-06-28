/**
 * app.js — Goal Organizer v3
 * Clean architecture: edit controls always in DOM, toggled via CSS + contenteditable
 */

// ── STATE ──────────────────────────────────────────────────
const STORAGE_KEY = 'goal-organizer-v3';
let appData    = null;
let isEditMode = false;
let pendingModalCb = null;

// ── INIT ───────────────────────────────────────────────────
function init() {
  appData = loadData();
  applyDarkPref();
  renderAll();
}

// ── PERSISTENCE ────────────────────────────────────────────
function loadData() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch(e) { console.warn(e); }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData() {
  harvestAll();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    toast('Saved ✅');
  } catch(e) { toast('Save failed ❌'); }
}

function resetData() {
  if (!confirm('Reset ALL content to defaults? Cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  renderAll();
  if (isEditMode) applyEditableState(true);
  toast('Reset ↩');
}

// ── IMPORT / EXPORT ────────────────────────────────────────
function exportJSON() {
  harvestAll();
  const b = new Blob([JSON.stringify(appData, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'goal-organizer.json';
  a.click();
}

function importJSON(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      appData = JSON.parse(ev.target.result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
      renderAll();
      if (isEditMode) applyEditableState(true);
      toast('Imported ✅');
    } catch { toast('Invalid JSON ❌'); }
  };
  r.readAsText(f);
  e.target.value = '';
}

// ── DARK MODE ──────────────────────────────────────────────
function applyDarkPref() {
  const isDark = localStorage.getItem('dark') === '1';
  document.documentElement.dataset.dark = isDark;
  document.getElementById('btn-dark').textContent = isDark ? '☀️' : '🌙';
}

function toggleDark() {
  const isDark = document.documentElement.dataset.dark !== 'true';
  document.documentElement.dataset.dark = isDark;
  localStorage.setItem('dark', isDark ? '1' : '0');
  document.getElementById('btn-dark').textContent = isDark ? '☀️' : '🌙';
}

// ── RENDER ALL ─────────────────────────────────────────────
function renderAll() {
  renderHero();
  renderCards();
  renderWeek();
  renderBlocks();   // ← generates always-in-DOM edit controls
  renderExec();
  renderGoalList('longterm');
  renderGoalList('shortterm');
  renderRules();
}

// ── HERO ───────────────────────────────────────────────────
function renderHero() {
  setTxt('hero.badge', appData.hero.badge);
  setTxt('hero.title', appData.hero.title);
  setTxt('hero.sub1',  appData.hero.sub1);
  setTxt('hero.sub2',  appData.hero.sub2);
}

// ── GOAL CARDS ─────────────────────────────────────────────
function renderCards() {
  appData.cards.forEach((c, i) => {
    setTxt(`cards.${i}.label`, c.label);
    setTxt(`cards.${i}.title`, c.title);
    setTxt(`cards.${i}.desc`,  c.desc);
  });
}

// ── WEEKLY GRID ────────────────────────────────────────────
function renderWeek() {
  setTxt('week.title', appData.week.title);
  setTxt('week.sub',   appData.week.sub);
  const grid = document.getElementById('week-grid');
  grid.innerHTML = '';
  appData.week.days.forEach((d, i) => {
    const el = document.createElement('div');
    el.className = 'day-card';
    el.innerHTML = `
      <div class="day-header" style="background:${d.color}">${esc(d.name)}</div>
      <div class="day-body">
        <div class="day-label" style="color:${d.color}">FOCUS</div>
        <div class="day-text"  data-daykey="${i}.focus"      data-editable="text">${esc(d.focus)}</div>
        <div class="day-label" style="color:${d.color}">BUILD</div>
        <div class="day-text"  data-daykey="${i}.build"      data-editable="text">${esc(d.build)}</div>
        <div class="day-label" style="color:${d.color}">THEORY</div>
        <div class="day-text"  data-daykey="${i}.theory"     data-editable="text">${esc(d.theory)}</div>
        <div class="day-label" style="color:${d.color}">DSA</div>
        <div class="day-text"  data-daykey="${i}.dsa"        data-editable="text">${esc(d.dsa)}</div>
        <div class="day-deliver" data-daykey="${i}.deliverable" data-editable="text">
          Deliverable: ${esc(d.deliverable)}
        </div>
      </div>`;
    grid.appendChild(el);
  });
  if (isEditMode) bindDayEditors();
}

// ── EXEC MAP ───────────────────────────────────────────────
function renderExec() {
  setTxt('exec.title', appData.exec.title);
  setTxt('exec.sub',   appData.exec.sub);
  const grid = document.getElementById('exec-grid');
  grid.innerHTML = '';
  appData.exec.weeks.forEach((w, i) => {
    const el = document.createElement('div');
    el.className = 'exec-card';
    el.innerHTML = `
      <div class="exec-header" style="border-bottom-color:${w.color}">
        <div class="exec-week"  style="color:${w.color}" data-exkey="${i}.week"  data-editable="text">${esc(w.week)}</div>
        <div class="exec-name"  data-exkey="${i}.name"  data-editable="text">${esc(w.name)}</div>
      </div>
      <div class="exec-body">
        <div class="exec-desc"  data-exkey="${i}.desc"  data-editable="text">${esc(w.desc)}</div>
        <div class="exec-proof" data-exkey="${i}.proof" data-editable="text">${esc(w.proof)}</div>
      </div>`;
    grid.appendChild(el);
  });
  if (isEditMode) bindExecEditors();
}

// ── GOALS ──────────────────────────────────────────────────
function renderGoalList(type) {
  setTxt(`${type}.title`, appData[type].title);
  setTxt(`${type}.sub`,   appData[type].sub);
  const el = document.getElementById(`${type}-list`);
  el.innerHTML = '';
  appData[type].items.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'goal-item';
    div.innerHTML = `
      <div class="goal-icon">${esc(item.icon)}</div>
      <div class="goal-content">
        <div class="goal-item-title" data-goalkey="${type}.${i}.title" data-editable="text">${esc(item.title)}</div>
        <div class="goal-item-desc"  data-goalkey="${type}.${i}.desc"  data-editable="text">${esc(item.desc)}</div>
        <div class="goal-progress">
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width:${item.progress}%"></div>
          </div>
          <span class="progress-pct">${item.progress}%</span>
        </div>
      </div>
      <button class="goal-delete" onclick="deleteGoal('${type}',${i})" title="Delete">✕</button>`;
    el.appendChild(div);
  });
  if (isEditMode) bindGoalEditors(type);
}

// ── RULES ──────────────────────────────────────────────────
function renderRules() {
  setTxt('rules.title', appData.rules.title);
  setTxt('rules.body',  appData.rules.body);
}

/* ════════════════════════════════════════════════════════════
   BLOCKS TABLE — fully dynamic rows + columns
   Always renders ALL controls (add/del row, add/del col, drag).
   CSS class ec-* controls visibility based on body.edit-mode.
   contenteditable is toggled by applyEditableState().
   ════════════════════════════════════════════════════════════ */

function renderBlocks() {
  setTxt('daily.title', appData.daily.title);
  setTxt('daily.sub',   appData.daily.sub);

  const wrap = document.querySelector('.table-wrap');
  if (!wrap) return;
  const { columns: cols, rows } = appData.daily;

  // ── HEADER ──
  const thCells = cols.map((col, ci) => `
    <th style="position:relative" data-ci="${ci}">
      <span class="th-label" data-ci="${ci}" contenteditable="false">${esc(col)}</span>
      ${cols.length > 1
        ? `<button class="th-del-col ec-flex" onclick="delCol(${ci})" title="Remove column">×</button>`
        : ''}
    </th>`).join('');

  // ── BODY ROWS ──
  const tRows = rows.map((row, ri) => `
    <tr class="brow" data-ri="${ri}" draggable="false">
      <td class="td-drag ec-cell" data-ri="${ri}">
        <span class="drag-icon" title="Drag to reorder">⠿</span>
      </td>
      ${cols.map((_, ci) => `
        <td class="bcell" data-ri="${ri}" data-ci="${ci}"
            contenteditable="false">${esc(row[ci] ?? '')}</td>`).join('')}
      <td class="td-del-r ec-cell">
        <button class="btn-del-row ec-flex" onclick="delRow(${ri})" title="Delete row">✕</button>
      </td>
    </tr>`).join('');

  wrap.innerHTML = `
    <table class="blocks-table" id="btable">
      <thead>
        <tr>
          <th class="th-drag ec-cell"></th>
          ${thCells}
          <th class="th-del-r ec-cell"></th>
        </tr>
      </thead>
      <tbody id="btbody">${tRows}</tbody>
    </table>`;

  // Now apply current edit state to the newly rendered elements
  applyTableEditableState();
  if (isEditMode) setupDragDrop();
}

// Set contenteditable + drag on table elements based on current isEditMode
function applyTableEditableState() {
  const ce = isEditMode ? 'true' : 'false';
  document.querySelectorAll('.th-label, .bcell').forEach(el => {
    el.contentEditable = ce;
  });
  document.querySelectorAll('.brow').forEach(row => {
    row.draggable = isEditMode;
  });
  if (isEditMode) {
    // Bind live input handlers
    document.querySelectorAll('.th-label[contenteditable="true"]').forEach(span => {
      span.oninput = () => {
        appData.daily.columns[+span.dataset.ci] = span.innerText.trim();
      };
    });
    document.querySelectorAll('.bcell[contenteditable="true"]').forEach(td => {
      td.oninput = () => {
        const ri = +td.dataset.ri, ci = +td.dataset.ci;
        appData.daily.rows[ri][ci] = td.innerText.trim();
      };
    });
  }
}

// Drag-to-reorder rows
function setupDragDrop() {
  let src = null;
  document.querySelectorAll('.brow').forEach(row => {
    row.ondragstart = e => {
      src = +row.dataset.ri;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    };
    row.ondragend = () => {
      row.classList.remove('dragging');
      document.querySelectorAll('.brow').forEach(r => r.classList.remove('drag-over'));
    };
    row.ondragover = e => {
      e.preventDefault();
      document.querySelectorAll('.brow').forEach(r => r.classList.remove('drag-over'));
      row.classList.add('drag-over');
    };
    row.ondrop = e => {
      e.preventDefault();
      row.classList.remove('drag-over');
      const dest = +row.dataset.ri;
      if (src !== null && src !== dest) {
        const moved = appData.daily.rows.splice(src, 1)[0];
        appData.daily.rows.splice(dest, 0, moved);
        renderBlocks();
        if (isEditMode) setupDragDrop();
      }
      src = null;
    };
  });
}

// ── ROW / COLUMN CRUD ──────────────────────────────────────

// Add a new empty row
function addRow() {
  appData.daily.rows.push(Array(appData.daily.columns.length).fill(''));
  renderBlocks();
  setTimeout(() => {
    const last = document.querySelector('#btbody .brow:last-child');
    if (last) {
      last.classList.add('new-row');
      const c = last.querySelector('.bcell');
      if (c) c.focus();
    }
  }, 30);
  toast('Row added ✓');
}

// Delete a row by index
function delRow(ri) {
  if (appData.daily.rows.length <= 1) { toast('Need at least one row 😌'); return; }
  appData.daily.rows.splice(ri, 1);
  renderBlocks();
  toast('Row removed');
}

// Open modal to add a column
function addCol() {
  document.getElementById('modal-title').textContent = 'Add Column';
  document.getElementById('modal-body').innerHTML =
    `<label>Column name</label>
     <input id="m-col" type="text" placeholder="e.g. PRIORITY" />`;
  pendingModalCb = () => {
    const name = (document.getElementById('m-col').value || '').trim().toUpperCase() || 'NEW COLUMN';
    appData.daily.columns.push(name);
    appData.daily.rows.forEach(r => r.push(''));
    renderBlocks();
    toast(`"${name}" added ✓`);
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}

// Delete a column by index
function delCol(ci) {
  if (appData.daily.columns.length <= 1) { toast('Need at least one column'); return; }
  if (!confirm(`Delete column "${appData.daily.columns[ci]}"? All data in it will be lost.`)) return;
  appData.daily.columns.splice(ci, 1);
  appData.daily.rows.forEach(r => r.splice(ci, 1));
  renderBlocks();
  toast('Column removed');
}

/* ════════════════════════════════════════════════════════════
   TOGGLE EDIT MODE
   1. Flip isEditMode
   2. Toggle body.edit-mode class (CSS does the heavy lifting —
      shows ec-* controls, outlines text, etc.)
   3. Apply contenteditable to static [data-editable] elements
   4. Apply contenteditable to table cells via applyTableEditableState()
   5. Bind live editors for day / exec / goal elements
   ════════════════════════════════════════════════════════════ */

function toggleEdit() {
  isEditMode = !isEditMode;
  document.body.classList.toggle('edit-mode', isEditMode);

  const btnEdit  = document.getElementById('btn-edit');
  const btnSave  = document.getElementById('btn-save');
  const btnReset = document.getElementById('btn-reset');

  if (isEditMode) {
    btnEdit.textContent  = '👁️ View Mode';
    btnSave.classList.remove('hidden');
    btnReset.classList.remove('hidden');
    document.getElementById('btn-add-long').style.display = '';
    document.getElementById('btn-add-short').style.display = '';
    applyEditableState(true);
    toast('Edit Mode ON — click any text to edit ✏️');
  } else {
    btnEdit.textContent  = '✏️ Edit Mode';
    btnSave.classList.add('hidden');
    btnReset.classList.add('hidden');
    document.getElementById('btn-add-long').style.display  = 'none';
    document.getElementById('btn-add-short').style.display = 'none';
    applyEditableState(false);
    toast('View Mode — click Save to persist changes');
  }
}

// Central function: apply (or remove) contenteditable to all editable elements
function applyEditableState(on) {
  const ce = on ? 'true' : 'false';

  // Static [data-editable] elements (hero, cards, section titles, etc.)
  document.querySelectorAll('[data-editable="text"]').forEach(el => {
    el.contentEditable = ce;
  });

  // Table: th-label spans and body cells
  applyTableEditableState();

  if (on) {
    // Bind editors for day grid, exec grid, goal lists
    bindDayEditors();
    bindExecEditors();
    bindGoalEditors('longterm');
    bindGoalEditors('shortterm');
    // Bind static data-key elements
    document.querySelectorAll('[data-key][data-editable]').forEach(el => {
      el.oninput = () => setByPath(appData, el.dataset.key, el.textContent.trim());
    });
    // Setup drag-drop on table
    setupDragDrop();
  }
}

// ── EDITOR BINDERS ─────────────────────────────────────────
function bindDayEditors() {
  document.querySelectorAll('[data-daykey][data-editable]').forEach(el => {
    el.oninput = () => {
      const [i, f] = el.dataset.daykey.split('.');
      if (f === 'deliverable')
        appData.week.days[i].deliverable = el.textContent.replace(/^Deliverable:\s*/,'').trim();
      else
        appData.week.days[i][f] = el.textContent.trim();
    };
  });
}

function bindExecEditors() {
  document.querySelectorAll('[data-exkey][data-editable]').forEach(el => {
    el.oninput = () => {
      const [i, f] = el.dataset.exkey.split('.');
      appData.exec.weeks[i][f] = el.textContent.trim();
    };
  });
}

function bindGoalEditors(type) {
  document.querySelectorAll(`[data-goalkey^="${type}."]`).forEach(el => {
    el.oninput = () => {
      const [, i, f] = el.dataset.goalkey.split('.');
      appData[type].items[+i][f] = el.textContent.trim();
    };
  });
}

// ── HARVEST ALL EDITS → appData ────────────────────────────
function harvestAll() {
  // Static keyed elements
  document.querySelectorAll('[data-key][data-editable]').forEach(el => {
    setByPath(appData, el.dataset.key, el.textContent.trim());
  });
  // Day grid
  document.querySelectorAll('[data-daykey]').forEach(el => {
    const [i, f] = el.dataset.daykey.split('.');
    if (f === 'deliverable')
      appData.week.days[i].deliverable = el.textContent.replace(/^Deliverable:\s*/,'').trim();
    else
      appData.week.days[i][f] = el.textContent.trim();
  });
  // Exec
  document.querySelectorAll('[data-exkey]').forEach(el => {
    const [i, f] = el.dataset.exkey.split('.');
    appData.exec.weeks[i][f] = el.textContent.trim();
  });
  // Goals
  document.querySelectorAll('[data-goalkey]').forEach(el => {
    const [t, i, f] = el.dataset.goalkey.split('.');
    appData[t].items[+i][f] = el.textContent.trim();
  });
  // Table columns
  document.querySelectorAll('.th-label[data-ci]').forEach(span => {
    appData.daily.columns[+span.dataset.ci] = span.innerText.trim();
  });
  // Table cells
  document.querySelectorAll('.bcell[data-ri]').forEach(td => {
    const ri = +td.dataset.ri, ci = +td.dataset.ci;
    appData.daily.rows[ri][ci] = td.innerText.trim();
  });
}

// ── GOAL ADD / DELETE ───────────────────────────────────────
function addGoal(type) {
  document.getElementById('modal-title').textContent =
    type === 'long' ? 'Add Long-Term Goal' : 'Add Short-Term Goal';
  document.getElementById('modal-body').innerHTML = `
    <label>Icon emoji</label>
    <input id="m-icon"  type="text" placeholder="🎯" maxlength="4" />
    <label>Goal title</label>
    <input id="m-title" type="text" placeholder="What you want to achieve" />
    <label>Description</label>
    <textarea id="m-desc" placeholder="Brief description"></textarea>
    <label>Progress % (0–100)</label>
    <input id="m-prog" type="number" min="0" max="100" value="0" />`;
  pendingModalCb = () => {
    const key = type === 'long' ? 'longterm' : 'shortterm';
    appData[key].items.push({
      icon:     document.getElementById('m-icon').value  || '🎯',
      title:    document.getElementById('m-title').value || 'New Goal',
      desc:     document.getElementById('m-desc').value  || '',
      progress: parseInt(document.getElementById('m-prog').value) || 0
    });
    renderGoalList(key);
    if (isEditMode) {
      applyEditableState(true);
    }
    toast('Goal added ✓');
  };
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function deleteGoal(type, idx) {
  if (!isEditMode) return;
  appData[type].items.splice(idx, 1);
  renderGoalList(type);
  if (isEditMode) { bindGoalEditors(type); applyEditableState(true); }
}

// ── MODAL ───────────────────────────────────────────────────
function confirmModal() {
  if (pendingModalCb) pendingModalCb();
  pendingModalCb = null;
  closeModal();
}
function closeModalOverlay(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  pendingModalCb = null;
}

// ── UTILS ───────────────────────────────────────────────────
function setTxt(key, val) {
  const el = document.querySelector(`[data-key="${key}"]`);
  if (el) el.textContent = val;
}

function setByPath(obj, path, val) {
  const p = path.split('.');
  let o = obj;
  for (let i = 0; i < p.length - 1; i++) {
    const k = isNaN(p[i]) ? p[i] : +p[i];
    o = o[k];
  }
  const last = isNaN(p[p.length-1]) ? p[p.length-1] : +p[p.length-1];
  o[last] = val;
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    Object.assign(t.style, {
      position:'fixed', bottom:'22px', right:'22px',
      background:'#12203a', color:'#fff',
      padding:'11px 18px', borderRadius:'10px',
      fontWeight:'700', fontSize:'.84rem',
      boxShadow:'0 4px 20px rgba(0,0,0,.3)',
      zIndex:'9999', transition:'opacity .3s, transform .3s',
      fontFamily:"'Inter',sans-serif",
      transform:'translateY(0)'
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateY(0)';
  clearTimeout(t._t);
  t._t = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(8px)';
  }, 2400);
}

// ── BOOT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
