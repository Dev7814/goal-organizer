/**
 * app.js — Goal Organizer v4
 *
 * Dark mode: html[data-theme="dark" | "light"] set via setAttribute
 * Edit mode: body.edit-mode toggled; ec-flex / ec-cell shown via CSS
 * Blocks table: always renders ALL controls; applyTableEditState() sets contenteditable
 */

// ── STATE ───────────────────────────────────────────────────────────
const STORAGE_KEY = 'goal-organizer-v4';
let appData    = null;
let isEditMode = false;
let pendingModalCb = null;

// ── BOOT ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  appData = loadData();
  applyTheme();        // must run before renderAll so colors are right
  renderAll();
});

// ── PERSISTENCE ─────────────────────────────────────────────────────
function loadData() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch(e) { console.warn('loadData:', e); }
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
  if (!confirm('Reset ALL content to defaults? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  renderAll();
  if (isEditMode) applyEditState(true);
  toast('Reset ↩');
}

function exportJSON() {
  harvestAll();
  const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'goal-organizer.json';
  a.click();
  toast('Exported 📤');
}

function importJSON(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      appData = parsed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
      renderAll();
      if (isEditMode) applyEditState(true);
      toast('Imported ✅');
    } catch { toast('Invalid JSON ❌'); }
  };
  r.readAsText(f);
  e.target.value = '';
}

// ════════════════════════════════════════════════════════════════════
// DARK / LIGHT THEME
//
// Uses html[data-theme="dark"] / html[data-theme="light"]
// Set via setAttribute — guaranteed to match CSS selectors exactly.
// ════════════════════════════════════════════════════════════════════
function applyTheme() {
  const saved = localStorage.getItem('theme'); // "dark" | "light" | null
  const theme = saved === 'dark' ? 'dark' : 'light';
  _setTheme(theme);
}

function toggleDark() {
  const current = document.documentElement.getAttribute('data-theme');
  _setTheme(current === 'dark' ? 'light' : 'dark');
}

function _setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const btn = document.getElementById('btn-dark');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ── RENDER ALL ──────────────────────────────────────────────────────
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

// ── HERO ─────────────────────────────────────────────────────────────
function renderHero() {
  setText('hero.badge', appData.hero.badge);
  setText('hero.title', appData.hero.title);
  setText('hero.sub1',  appData.hero.sub1);
  setText('hero.sub2',  appData.hero.sub2);
}

// ── CARDS ────────────────────────────────────────────────────────────
function renderCards() {
  (appData.cards || []).forEach((c, i) => {
    setText(`cards.${i}.label`, c.label);
    setText(`cards.${i}.title`, c.title);
    setText(`cards.${i}.desc`,  c.desc);
  });
}

// ── WEEKLY GRID ──────────────────────────────────────────────────────
function renderWeek() {
  setText('week.title', appData.week.title);
  setText('week.sub',   appData.week.sub);
  const grid = document.getElementById('week-grid');
  if (!grid) return;
  grid.innerHTML = '';
  appData.week.days.forEach((d, i) => {
    const el = document.createElement('div');
    el.className = 'day-card';
    el.innerHTML = `
      <div class="day-header" style="background:${d.color}; position:relative;">
        <span data-daykey="${i}.name" data-editable="text">${esc(d.name)}</span>
        <button class="ec-flex del-corner" onclick="delDay(${i})" title="Delete day">✕</button>
      </div>
      <div class="day-body">
        <div class="day-label" style="color:${d.color}">Focus</div>
        <div class="day-text" data-daykey="${i}.focus"       data-editable="text">${esc(d.focus)}</div>
        <div class="day-label" style="color:${d.color}">Build</div>
        <div class="day-text" data-daykey="${i}.build"       data-editable="text">${esc(d.build)}</div>
        <div class="day-label" style="color:${d.color}">Theory</div>
        <div class="day-text" data-daykey="${i}.theory"      data-editable="text">${esc(d.theory)}</div>
        <div class="day-label" style="color:${d.color}">DSA</div>
        <div class="day-text" data-daykey="${i}.dsa"         data-editable="text">${esc(d.dsa)}</div>
        <div class="day-deliver" data-daykey="${i}.deliverable" data-editable="text">
          Deliverable: ${esc(d.deliverable)}
        </div>
      </div>`;
    grid.appendChild(el);
  });
  
  // Add Day button
  const addBtn = document.createElement('button');
  addBtn.className = 'add-item-btn ec-flex-center';
  addBtn.innerHTML = '＋ Add Day';
  addBtn.onclick = addDay;
  grid.appendChild(addBtn);

  if (isEditMode) bindDayEditors();
}

// ── EXEC MAP ─────────────────────────────────────────────────────────
function renderExec() {
  setText('exec.title', appData.exec.title);
  setText('exec.sub',   appData.exec.sub);
  const grid = document.getElementById('exec-grid');
  if (!grid) return;
  grid.innerHTML = '';
  appData.exec.weeks.forEach((w, i) => {
    const el = document.createElement('div');
    el.className = 'exec-card';
    el.innerHTML = `
      <div class="exec-header" style="border-bottom-color:${w.color}; position:relative;">
        <div class="exec-week"  style="color:${w.color}" data-exkey="${i}.week"  data-editable="text">${esc(w.week)}</div>
        <div class="exec-name"  data-exkey="${i}.name"   data-editable="text">${esc(w.name)}</div>
        <button class="ec-flex del-corner" onclick="delExec(${i})" title="Delete week">✕</button>
      </div>
      <div class="exec-body">
        <div class="exec-desc"  data-exkey="${i}.desc"   data-editable="text">${esc(w.desc)}</div>
        <div class="exec-proof" data-exkey="${i}.proof"  data-editable="text">${esc(w.proof)}</div>
      </div>`;
    grid.appendChild(el);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'add-item-btn ec-flex-center';
  addBtn.innerHTML = '＋ Add Phase';
  addBtn.onclick = addExec;
  grid.appendChild(addBtn);

  if (isEditMode) bindExecEditors();
}

// ── GOALS ─────────────────────────────────────────────────────────────
function renderGoalList(type) {
  setText(`${type}.title`, appData[type].title);
  setText(`${type}.sub`,   appData[type].sub);
  const el = document.getElementById(`${type}-list`);
  if (!el) return;
  el.innerHTML = '';
  appData[type].items.forEach((item, i) => {
    const todos = item.todos || [];
    const div = document.createElement('div');
    div.className = 'goal-item';
    div.innerHTML = `
      <div class="goal-icon" data-goalkey="${type}.${i}.icon" data-editable="text">${esc(item.icon)}</div>
      <div class="goal-content">
        <div class="goal-item-title" data-goalkey="${type}.${i}.title" data-editable="text">${esc(item.title)}</div>
        <div class="goal-item-desc"  data-goalkey="${type}.${i}.desc"  data-editable="text">${esc(item.desc)}</div>
        
        <div class="goal-todos">
          ${todos.map((todo, tIdx) => `
            <div class="todo-row">
              <input type="checkbox" class="todo-cb" ${todo.done ? 'checked' : ''} onchange="toggleTodo('${type}', ${i}, ${tIdx}, this.checked)" ${!isEditMode && !todo.done ? '' : ''}>
              <span class="todo-txt ${todo.done ? 'done' : ''}" data-todokey="${type}.${i}.${tIdx}" data-editable="text">${esc(todo.text)}</span>
              <button class="ec-flex todo-del" onclick="delTodo('${type}', ${i}, ${tIdx})">✕</button>
            </div>
          `).join('')}
          <button class="ec-flex todo-add" onclick="addTodo('${type}', ${i})">＋ Add To-Do</button>
        </div>

        <div class="goal-progress">
          <div class="prog-bar">
            <div class="prog-fill" style="width:${item.progress}%"></div>
          </div>
          <span class="prog-pct ec-hide">${item.progress}%</span>
          <div class="ec-flex prog-slider-container">
            <input type="range" class="prog-slider" min="0" max="100" value="${item.progress}" oninput="setGoalProgress('${type}', ${i}, this.value)" onchange="saveData()">
            <span class="prog-pct">${item.progress}%</span>
          </div>
        </div>
      </div>
      <button class="goal-delete" onclick="deleteGoal('${type}',${i})" title="Delete goal">✕</button>`;
    el.appendChild(div);
  });
  
  if (isEditMode) {
    bindGoalEditors(type);
    bindTodoEditors(type);
  }
}

// ── RULES ─────────────────────────────────────────────────────────────
function renderRules() {
  setText('rules.title', appData.rules.title);
  setText('rules.body',  appData.rules.body);
}

/* ══════════════════════════════════════════════════════════════════════
   BLOCKS TABLE
   • renderBlocks()       → builds full HTML (always includes ec-* controls)
   • applyTableEditState()→ sets contenteditable on .th-label and .bcell
   • addRow / delRow / addCol / delCol → mutate appData then re-render
   ══════════════════════════════════════════════════════════════════════ */
function renderBlocks() {
  setText('daily.title', appData.daily.title);
  setText('daily.sub',   appData.daily.sub);

  const wrap = document.querySelector('.table-wrap');
  if (!wrap) return;

  const { columns: cols, rows } = appData.daily;

  const thCells = cols.map((col, ci) => `
    <th style="position:relative" data-ci="${ci}">
      <span class="th-label" data-ci="${ci}" contenteditable="false">${esc(col)}</span>
      ${cols.length > 1
        ? `<button class="th-del-col ec-flex" onclick="delCol(${ci})" title="Delete column">×</button>`
        : ''}
    </th>`).join('');

  const tRows = rows.map((row, ri) => `
    <tr class="brow" data-ri="${ri}" draggable="false">
      <td class="td-drag ec-cell" data-ri="${ri}">
        <span class="drag-icon" title="Drag to reorder">⠿</span>
      </td>
      ${cols.map((_, ci) => `
        <td class="bcell" data-ri="${ri}" data-ci="${ci}"
            contenteditable="false">${esc(row[ci] ?? '')}</td>`).join('')}
      <td class="td-delrow ec-cell">
        <button class="btn-del-row ec-flex" onclick="delRow(${ri})" title="Delete row">✕</button>
      </td>
    </tr>`).join('');

  wrap.innerHTML = `
    <table class="blocks-table">
      <thead>
        <tr>
          <th class="th-drag ec-cell"></th>
          ${thCells}
          <th class="th-delrow ec-cell"></th>
        </tr>
      </thead>
      <tbody id="btbody">${tRows}</tbody>
    </table>`;

  // Apply current edit state to the freshly rendered elements
  applyTableEditState();
  if (isEditMode) setupDragDrop();
}

function applyTableEditState() {
  const ce = isEditMode ? 'true' : 'false';
  document.querySelectorAll('.th-label').forEach(el => { el.contentEditable = ce; });
  document.querySelectorAll('.bcell').forEach(el => { el.contentEditable = ce; });
  document.querySelectorAll('.brow').forEach(row => { row.draggable = isEditMode; });
  if (isEditMode) bindTableCellEditors();
}

function bindTableCellEditors() {
  document.querySelectorAll('.th-label[contenteditable="true"]').forEach(span => {
    span.oninput = () => {
      appData.daily.columns[+span.dataset.ci] = span.innerText.trim();
    };
  });
  document.querySelectorAll('.bcell[contenteditable="true"]').forEach(td => {
    td.oninput = () => {
      const ri = +td.dataset.ri, ci = +td.dataset.ci;
      if (!appData.daily.rows[ri]) appData.daily.rows[ri] = Array(appData.daily.columns.length).fill('');
      appData.daily.rows[ri][ci] = td.innerText.trim();
    };
  });
}

// Drag to reorder rows
function setupDragDrop() {
  let srcIdx = null;
  document.querySelectorAll('.brow').forEach(row => {
    row.ondragstart = e => {
      srcIdx = +row.dataset.ri;
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
      if (srcIdx !== null && srcIdx !== dest) {
        const moved = appData.daily.rows.splice(srcIdx, 1)[0];
        appData.daily.rows.splice(dest, 0, moved);
        renderBlocks();
        if (isEditMode) setupDragDrop();
      }
      srcIdx = null;
    };
  });
}

// ── TABLE CRUD ──────────────────────────────────────────────────────

function addRow() {
  appData.daily.rows.push(Array(appData.daily.columns.length).fill(''));
  renderBlocks();
  setTimeout(() => {
    const last = document.querySelector('#btbody .brow:last-child');
    if (last) {
      last.classList.add('new-row');
      const first = last.querySelector('.bcell');
      if (first) first.focus();
    }
  }, 40);
  toast('Row added ✓');
}

function delRow(ri) {
  if (appData.daily.rows.length <= 1) { toast('Need at least 1 row 😌'); return; }
  appData.daily.rows.splice(ri, 1);
  renderBlocks();
  toast('Row deleted');
}

function addCol() {
  openModal('Add Column', `
    <label>Column name</label>
    <input id="m-col" type="text" placeholder="e.g. PRIORITY" />`,
    () => {
      const name = (document.getElementById('m-col').value || '').trim().toUpperCase() || 'NEW COLUMN';
      appData.daily.columns.push(name);
      appData.daily.rows.forEach(r => r.push(''));
      renderBlocks();
      toast(`"${name}" added ✓`);
    });
}

function delCol(ci) {
  if (appData.daily.columns.length <= 1) { toast('Need at least 1 column'); return; }
  if (!confirm(`Delete column "${appData.daily.columns[ci]}"?\nAll data in it will be lost.`)) return;
  appData.daily.columns.splice(ci, 1);
  appData.daily.rows.forEach(r => r.splice(ci, 1));
  renderBlocks();
  toast('Column deleted');
}

/* ══════════════════════════════════════════════════════════════════════
   TOGGLE EDIT MODE
   ══════════════════════════════════════════════════════════════════════ */
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
    if (btnAddL) btnAddL.style.display = 'inline-flex';
    if (btnAddS) btnAddS.style.display = 'inline-flex';
    applyEditState(true);
    toast('Edit Mode — click any text or use the table controls ✏️');
  } else {
    btnEdit.textContent = '✏️ Edit Mode';
    btnSave.classList.add('hidden');
    btnReset.classList.add('hidden');
    if (btnAddL) btnAddL.style.display = 'none';
    if (btnAddS) btnAddS.style.display = 'none';
    applyEditState(false);
    toast('View Mode — Save to keep changes');
  }
}

// Apply contenteditable state to all editable elements
function applyEditState(on) {
  const ce = on ? 'true' : 'false';

  // Static [data-editable] spans/divs (hero, cards, section headings…)
  document.querySelectorAll('[data-editable="text"]').forEach(el => {
    el.contentEditable = ce;
  });

  // Table
  applyTableEditState();

  if (on) {
    bindDayEditors();
    bindExecEditors();
    bindGoalEditors('longterm');
    bindGoalEditors('shortterm');
    bindTodoEditors('longterm');
    bindTodoEditors('shortterm');
    setupDragDrop();
  }
}

// ── INLINE EDITOR BINDERS ───────────────────────────────────────────
function bindDayEditors() {
  document.querySelectorAll('[data-daykey]').forEach(el => {
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
  document.querySelectorAll('[data-exkey]').forEach(el => {
    el.oninput = () => {
      const [i, f] = el.dataset.exkey.split('.');
      appData.exec.weeks[i][f] = el.textContent.trim();
    };
  });
}

function bindGoalEditors(type) {
  document.querySelectorAll(`[data-goalkey^="${type}."]`).forEach(el => {
    el.oninput = () => {
      const parts = el.dataset.goalkey.split('.');
      const i = +parts[1];
      const f = parts[2];
      appData[type].items[i][f] = el.textContent.trim();
    };
  });
}

function bindTodoEditors(type) {
  document.querySelectorAll(`[data-todokey^="${type}."]`).forEach(el => {
    el.oninput = () => {
      const parts = el.dataset.todokey.split('.');
      const gIdx = +parts[1];
      const tIdx = +parts[2];
      appData[type].items[gIdx].todos[tIdx].text = el.textContent.trim();
    };
  });
}

// ── HARVEST ──────────────────────────────────────────────────────────
function harvestAll() {
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
  // Table headers
  document.querySelectorAll('.th-label[data-ci]').forEach(span => {
    appData.daily.columns[+span.dataset.ci] = span.innerText.trim();
  });
  // Table cells
  document.querySelectorAll('.bcell[data-ri]').forEach(td => {
    const ri = +td.dataset.ri, ci = +td.dataset.ci;
    appData.daily.rows[ri][ci] = td.innerText.trim();
  });
}

// ── GOAL / CRUD / CUSTOMIZATION ──────────────────────────────────────────────
function addGoal(type) {
  const label = type === 'long' ? 'Long-Term' : 'Short-Term';
  openModal(`Add ${label} Goal`, `
    <label>Icon emoji</label>
    <input id="m-icon"  type="text" placeholder="🎯" maxlength="4" />
    <label>Title</label>
    <input id="m-title" type="text" placeholder="What you want to achieve" />
    <label>Description</label>
    <textarea id="m-desc" placeholder="Brief description or milestone"></textarea>
    <label>Progress % (0–100)</label>
    <input id="m-prog" type="number" min="0" max="100" value="0" />`,
    () => {
      const key = type === 'long' ? 'longterm' : 'shortterm';
      appData[key].items.push({
        icon:     document.getElementById('m-icon').value.trim()  || '🎯',
        title:    document.getElementById('m-title').value.trim() || 'New Goal',
        desc:     document.getElementById('m-desc').value.trim()  || '',
        progress: Math.min(100, Math.max(0, parseInt(document.getElementById('m-prog').value) || 0)),
        todos: []
      });
      renderGoalList(key);
      if (isEditMode) { applyEditState(true); }
      toast('Goal added ✓');
    });
}

function deleteGoal(type, idx) {
  if (!isEditMode) return;
  if (!confirm('Delete this goal?')) return;
  appData[type].items.splice(idx, 1);
  renderGoalList(type);
  if (isEditMode) { applyEditState(true); }
}

function addTodo(type, gIdx) {
  if (!appData[type].items[gIdx].todos) appData[type].items[gIdx].todos = [];
  appData[type].items[gIdx].todos.push({ text: 'New task', done: false });
  recalcProgress(type, gIdx);
  renderGoalList(type);
  if (isEditMode) { applyEditState(true); }
}

function delTodo(type, gIdx, tIdx) {
  appData[type].items[gIdx].todos.splice(tIdx, 1);
  recalcProgress(type, gIdx);
  renderGoalList(type);
  if (isEditMode) { applyEditState(true); }
}

function toggleTodo(type, gIdx, tIdx, checked) {
  appData[type].items[gIdx].todos[tIdx].done = checked;
  recalcProgress(type, gIdx);
  renderGoalList(type);
  if (isEditMode) { applyEditState(true); }
  saveData(); // Auto save when checking off tasks!
}

function recalcProgress(type, gIdx) {
  const goal = appData[type].items[gIdx];
  if (!goal.todos || goal.todos.length === 0) return;
  const done = goal.todos.filter(t => t.done).length;
  goal.progress = Math.round((done / goal.todos.length) * 100);
}

function editProgress(type, gIdx) {
  openModal('Edit Progress', `
    <label>Progress % (0–100)</label>
    <input id="m-prog-edit" type="number" min="0" max="100" value="${appData[type].items[gIdx].progress}" />`,
    () => {
      appData[type].items[gIdx].progress = Math.min(100, Math.max(0, parseInt(document.getElementById('m-prog-edit').value) || 0));
      renderGoalList(type);
      if (isEditMode) { applyEditState(true); }
    });
}

function setGoalProgress(type, gIdx, val) {
  const v = parseInt(val) || 0;
  appData[type].items[gIdx].progress = v;
  const list = document.getElementById(`${type}-list`);
  if (!list || !list.children[gIdx]) return;
  const itemEl = list.children[gIdx];
  const fill = itemEl.querySelector('.prog-fill');
  if (fill) fill.style.width = v + '%';
  itemEl.querySelectorAll('.prog-pct').forEach(el => el.textContent = v + '%');
}

function addDay() {
  appData.week.days.push({
    name: "New Day", color: "#3b82f6",
    focus: "Focus area", build: "What to build", theory: "Theory to learn",
    dsa: "DSA goal", deliverable: "Deliverable"
  });
  renderWeek();
  if (isEditMode) applyEditState(true);
}

function delDay(idx) {
  if (!confirm('Delete this day?')) return;
  appData.week.days.splice(idx, 1);
  renderWeek();
  if (isEditMode) applyEditState(true);
}

function addExec() {
  appData.exec.weeks.push({
    week: "NEW", name: "Phase Name", color: "#8b5cf6",
    desc: "Phase description", proof: "Proof of completion"
  });
  renderExec();
  if (isEditMode) applyEditState(true);
}

function delExec(idx) {
  if (!confirm('Delete this phase?')) return;
  appData.exec.weeks.splice(idx, 1);
  renderExec();
  if (isEditMode) applyEditState(true);
}

// ── MODAL ────────────────────────────────────────────────────────────
function openModal(title, bodyHtml, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  pendingModalCb = onConfirm;
  document.getElementById('modal-overlay').classList.remove('hidden');
  // Focus first input
  setTimeout(() => {
    const first = document.querySelector('#modal-body input, #modal-body textarea');
    if (first) first.focus();
  }, 60);
}

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

// ── UTILS ────────────────────────────────────────────────────────────
function setText(key, val) {
  const el = document.querySelector(`[data-key="${key}"]`);
  if (el) el.textContent = val;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = Object.assign(document.createElement('div'), { id: '_toast' });
    Object.assign(t.style, {
      position:'fixed', bottom:'24px', right:'24px',
      background:'#1e1b4b', color:'#fff',
      padding:'12px 20px', borderRadius:'10px',
      fontWeight:'700', fontSize:'.84rem',
      boxShadow:'0 6px 24px rgba(0,0,0,.35)',
      zIndex:'9999', transition:'opacity .3s, transform .3s',
      fontFamily:"'Inter',sans-serif",
      display:'flex', alignItems:'center', gap:'8px',
      pointerEvents:'none'
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateY(0)';
  clearTimeout(t._tid);
  t._tid = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(8px)';
  }, 2600);
}
