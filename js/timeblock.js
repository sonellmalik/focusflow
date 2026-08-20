// ===== My 5 Main Priorities =====
const prioritiesList = document.getElementById('priorities-list');
const priorityInput = document.getElementById('priority-input');
const btnAddPriority = document.getElementById('btn-add-priority');
const prioritiesInputGroup = document.getElementById('priorities-input-group');

let priorities = loadData('priorities', []);
let selectedPriorityIndex = null;
let priorityDragIndex = null;

function renderPriorities() {
    prioritiesList.innerHTML = priorities.map((p, i) => `
        <li class="priority-item${selectedPriorityIndex === i ? ' selected' : ''}" draggable="true" data-index="${i}">
            <span class="priority-number">${i + 1}</span>
            <span class="priority-text" data-index="${i}">${escapeHtml(p.text)}</span>
            <button class="btn-edit-priority" data-index="${i}" title="Edit">&#9998;</button>
            <button class="btn-remove-priority" data-index="${i}" title="Delete">&times;</button>
        </li>
    `).join('');

    if (priorities.length >= 5) {
        prioritiesInputGroup.style.display = 'none';
    } else {
        prioritiesInputGroup.style.display = 'flex';
    }

    prioritiesList.querySelectorAll('.priority-item').forEach(item => {
        const idx = parseInt(item.dataset.index);

        item.addEventListener('click', (e) => {
            if (e.target.closest('.btn-edit-priority') || e.target.closest('.btn-remove-priority')) return;
            selectedPriorityIndex = (selectedPriorityIndex === idx) ? null : idx;
            renderPriorities();
        });

        item.addEventListener('dragstart', () => {
            priorityDragIndex = idx;
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            priorityDragIndex = null;
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            item.classList.add('drag-over');
        });
        item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over');
        });
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            if (priorityDragIndex === null || priorityDragIndex === idx) return;
            reorderPriorities(priorityDragIndex, idx);
        });
    });

    prioritiesList.querySelectorAll('.btn-remove-priority').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            priorities.splice(parseInt(btn.dataset.index), 1);
            selectedPriorityIndex = null;
            saveData('priorities', priorities);
            renderPriorities();
        });
    });

    prioritiesList.querySelectorAll('.btn-edit-priority').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            startEditPriority(parseInt(btn.dataset.index));
        });
    });
}

function reorderPriorities(from, to) {
    const [moved] = priorities.splice(from, 1);
    priorities.splice(to, 0, moved);
    selectedPriorityIndex = null;
    saveData('priorities', priorities);
    renderPriorities();
}

function startEditPriority(index) {
    const li = prioritiesList.querySelectorAll('.priority-item')[index];
    if (!li) return;
    li.setAttribute('draggable', 'false');
    const textSpan = li.querySelector('.priority-text');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = priorities[index].text;
    textSpan.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
        const newText = input.value.trim();
        if (newText) {
            priorities[index].text = newText;
            saveData('priorities', priorities);
        }
        selectedPriorityIndex = null;
        renderPriorities();
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { commit(); }
        else if (e.key === 'Escape') { selectedPriorityIndex = null; renderPriorities(); }
    });
    input.addEventListener('blur', commit);
}

btnAddPriority.addEventListener('click', addPriority);
priorityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPriority();
});

function addPriority() {
    const text = priorityInput.value.trim();
    if (!text || priorities.length >= 5) return;
    priorities.push({ text, createdAt: new Date().toISOString() });
    saveData('priorities', priorities);
    renderPriorities();
    priorityInput.value = '';
}

renderPriorities();

// ===== To-Do List =====
const todoInput = document.getElementById('todo-input');
const todoPriority = document.getElementById('todo-priority');
const btnAddTodo = document.getElementById('btn-add-todo');
const btnAddBreak = document.getElementById('btn-add-break');
const todoList = document.getElementById('todo-list');

let todos = loadData('todos', []);
let selectedTodoIndex = null;

function renderTodos() {
    todoList.innerHTML = todos.map((t, i) => {
        const isBreak = t.type === 'break';
        return `
        <li class="todo-item${selectedTodoIndex === i ? ' selected' : ''}${isBreak ? ' is-break' : ''}" draggable="true" data-index="${i}">
            ${isBreak ? '<span class="break-icon">&#9749;</span>' : ''}
            <span class="todo-text" data-index="${i}">${escapeHtml(t.text)}</span>
            <span class="todo-priority ${isBreak ? 'break' : t.priority}">${isBreak ? 'break' : t.priority}</span>
            <button class="btn-edit-todo" data-index="${i}" title="Edit">&#9998;</button>
            <button class="btn-remove-todo" data-index="${i}" title="Delete">&times;</button>
        </li>`;
    }).join('');

    todoList.querySelectorAll('.todo-item').forEach(item => {
        const idx = parseInt(item.dataset.index);

        item.addEventListener('click', (e) => {
            if (e.target.closest('.btn-edit-todo') || e.target.closest('.btn-remove-todo')) return;
            selectedTodoIndex = (selectedTodoIndex === idx) ? null : idx;
            renderTodos();
        });

        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', todos[idx].text);
            e.dataTransfer.setData('application/x-task-type', todos[idx].type || 'todo');
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
    });

    todoList.querySelectorAll('.btn-remove-todo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            todos.splice(btn.dataset.index, 1);
            selectedTodoIndex = null;
            saveData('todos', todos);
            renderTodos();
        });
    });

    todoList.querySelectorAll('.btn-edit-todo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            startEditTodo(parseInt(btn.dataset.index));
        });
    });
}

function startEditTodo(index) {
    const li = todoList.querySelectorAll('.todo-item')[index];
    if (!li) return;
    li.setAttribute('draggable', 'false');
    const textSpan = li.querySelector('.todo-text');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = todos[index].text;
    textSpan.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
        const newText = input.value.trim();
        if (newText) {
            todos[index].text = newText;
            saveData('todos', todos);
        }
        selectedTodoIndex = null;
        renderTodos();
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { commit(); }
        else if (e.key === 'Escape') { selectedTodoIndex = null; renderTodos(); }
    });
    input.addEventListener('blur', commit);
}

btnAddTodo.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;
    todos.push({ text, priority: todoPriority.value, type: 'todo', completed: false });
    saveData('todos', todos);
    renderTodos();
    todoInput.value = '';
}

btnAddBreak.addEventListener('click', () => {
    todos.push({ text: 'Scheduled Break', priority: 'normal', type: 'break', completed: false });
    saveData('todos', todos);
    renderTodos();
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

renderTodos();

// ===== Flexible Time Block Calendar (Teams-style) =====
const timeblockCalendar = document.getElementById('timeblock-calendar');

// Config
const CAL_START_HOUR = 6;   // 6 AM
const CAL_END_HOUR = 23;    // 11 PM
const SLOT_MINUTES = 10;    // 10-minute granularity
const SLOT_HEIGHT = 14;     // px per 10-min slot

// blocks: array of { id, start: minutesFromMidnight, end: minutesFromMidnight, task: string, type: 'todo'|'break' }
let blocks = loadData('timeblocksV2', []);

// Migrate old hourly timeblocks if present
const oldTimeblocks = loadData('timeblocks', null);
if (oldTimeblocks && blocks.length === 0) {
    Object.keys(oldTimeblocks).forEach(key => {
        const hour = parseInt(key.replace('hour_', ''));
        if (!isNaN(hour)) {
            blocks.push({ start: hour * 60, end: (hour + 1) * 60, task: oldTimeblocks[key], type: 'todo' });
        }
    });
    if (blocks.length > 0) saveData('timeblocksV2', blocks);
}

// Ensure every block has a stable unique id
let _blockIdCounter = Date.now();
function newBlockId() {
    return 'blk_' + (_blockIdCounter++);
}
let _blocksChanged = false;
blocks.forEach(b => {
    if (!b.id) { b.id = newBlockId(); _blocksChanged = true; }
});
if (_blocksChanged) saveData('timeblocksV2', blocks);

// ===== Midnight Calendar Reset =====
// Clear all time blocks at 12:00 AM each day
(function initCalendarMidnightReset() {
    const lastClear = loadData('lastCalendarClearDate', null);
    const todayStr = new Date().toDateString();

    // If the app opens on a new day, clear leftover blocks from previous days
    if (lastClear !== todayStr) {
        if (blocks.length > 0) {
            blocks = [];
            saveData('timeblocksV2', blocks);
        }
        saveData('lastCalendarClearDate', todayStr);
    }

    scheduleCalendarMidnightClear();
})();

function clearCalendarForNewDay() {
    blocks = [];
    selectedBlockId = null;
    dragSelecting = false;
    dragStartSlot = null;
    dragEndSlot = null;
    saveData('timeblocksV2', blocks);
    saveData('lastCalendarClearDate', new Date().toDateString());
    if (typeof renderTimeBlockCalendar === 'function') {
        renderTimeBlockCalendar();
    }
}

function scheduleCalendarMidnightClear() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // next midnight
    const msUntilMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
        clearCalendarForNewDay();
        scheduleCalendarMidnightClear(); // reschedule for the following midnight
    }, msUntilMidnight);
}

const totalSlots = ((CAL_END_HOUR - CAL_START_HOUR) * 60) / SLOT_MINUTES;

let dragSelecting = false;
let dragStartSlot = null;
let dragEndSlot = null;

// Event delegation for block edit/remove clicks (survives re-renders)
let selectedBlockId = null; // which calendar block is selected (by id)

function removeBlockById(id) {
    if (id === undefined || id === null) return;
    // Remove ALL blocks matching this id (guards against any duplicate ids)
    const before = blocks.length;
    blocks = blocks.filter(b => String(b.id) !== String(id));
    if (blocks.length !== before) {
        selectedBlockId = null;
        saveData('timeblocksV2', blocks);
        renderTimeBlockCalendar();
    }
}

// Clear all time blocks from the calendar
const btnClearBlocks = document.getElementById('btn-clear-blocks');
if (btnClearBlocks) {
    btnClearBlocks.addEventListener('click', () => {
        if (blocks.length === 0) return;
        if (!confirm('Clear all tasks from the calendar? This cannot be undone.')) return;
        blocks = [];
        selectedBlockId = null;
        // Reset any lingering drag/selection state so adding works right after
        dragSelecting = false;
        dragStartSlot = null;
        dragEndSlot = null;
        saveData('timeblocksV2', blocks);
        renderTimeBlockCalendar();
    });
}

timeblockCalendar.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.cal-block-remove');
    if (removeBtn) {
        e.stopPropagation();
        removeBlockById(removeBtn.dataset.blockId);
        return;
    }

    const editBtn = e.target.closest('.cal-block-edit');
    if (editBtn) {
        e.stopPropagation();
        startEditBlock(editBtn.dataset.blockId);
        return;
    }

    // Click on a block body selects it (reveals edit/remove)
    const blockEl = e.target.closest('.cal-block');
    if (blockEl) {
        e.stopPropagation();
        const id = blockEl.dataset.blockId;
        selectedBlockId = (selectedBlockId === id) ? null : id;
        renderTimeBlockCalendar();
    }
});

// Right-click a block to open a context menu with Edit / Remove
timeblockCalendar.addEventListener('contextmenu', (e) => {
    const blockEl = e.target.closest('.cal-block');
    if (!blockEl) return;
    e.preventDefault();
    e.stopPropagation();
    openBlockContextMenu(blockEl.dataset.blockId, e.clientX, e.clientY);
});

function openBlockContextMenu(id, x, y) {
    // Remove any existing menu
    closeBlockContextMenu();

    const menu = document.createElement('div');
    menu.className = 'block-context-menu';
    menu.id = 'block-context-menu';
    menu.innerHTML = `
        <button class="ctx-item" data-action="edit">&#9998; Edit</button>
        <button class="ctx-item ctx-danger" data-action="remove">&times; Remove</button>
    `;
    document.body.appendChild(menu);

    // Position, keeping it on-screen
    const menuW = menu.offsetWidth;
    const menuH = menu.offsetHeight;
    const px = Math.min(x, window.innerWidth - menuW - 8);
    const py = Math.min(y, window.innerHeight - menuH - 8);
    menu.style.left = px + 'px';
    menu.style.top = py + 'px';

    menu.querySelector('[data-action="edit"]').addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        closeBlockContextMenu();
        selectedBlockId = id;
        renderTimeBlockCalendar();
        // Defer so the current mouse gesture finishes before we focus the input,
        // otherwise the trailing mouseup steals focus and blur-commits immediately.
        setTimeout(() => startEditBlock(id), 0);
    });

    menu.querySelector('[data-action="remove"]').addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        closeBlockContextMenu();
        removeBlockById(id);
    });

    // Dismiss on any outside click / scroll / escape (deferred so this open gesture doesn't close it)
    setTimeout(() => {
        document.addEventListener('mousedown', outsideMenuHandler);
        document.addEventListener('contextmenu', outsideMenuHandler);
        window.addEventListener('scroll', closeBlockContextMenu, true);
        document.addEventListener('keydown', escMenuHandler);
    }, 0);
}

function outsideMenuHandler(e) {
    const menu = document.getElementById('block-context-menu');
    if (menu && !menu.contains(e.target)) {
        closeBlockContextMenu();
    }
}

function escMenuHandler(e) {
    if (e.key === 'Escape') closeBlockContextMenu();
}

function closeBlockContextMenu() {
    const menu = document.getElementById('block-context-menu');
    if (menu) menu.remove();
    document.removeEventListener('mousedown', outsideMenuHandler);
    document.removeEventListener('contextmenu', outsideMenuHandler);
    window.removeEventListener('scroll', closeBlockContextMenu, true);
    document.removeEventListener('keydown', escMenuHandler);
}

function slotToMinutes(slot) {
    return CAL_START_HOUR * 60 + slot * SLOT_MINUTES;
}

function formatMinutes(mins) {
    let h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    let dh = h % 12;
    if (dh === 0) dh = 12;
    return `${dh}:${String(m).padStart(2, '0')} ${ampm}`;
}

function renderTimeBlockCalendar() {
    timeblockCalendar.innerHTML = '';

    // Build the grid column
    const grid = document.createElement('div');
    grid.className = 'cal-grid';

    // Hour labels + slot cells
    for (let slot = 0; slot < totalSlots; slot++) {
        const mins = slotToMinutes(slot);
        const isHourStart = mins % 60 === 0;

        const row = document.createElement('div');
        row.className = 'cal-slot' + (isHourStart ? ' hour-start' : '');
        row.dataset.slot = slot;
        row.style.height = SLOT_HEIGHT + 'px';

        if (isHourStart) {
            const label = document.createElement('span');
            label.className = 'cal-hour-label';
            label.textContent = formatMinutes(mins).replace(':00', '');
            row.appendChild(label);
        }

        grid.appendChild(row);
    }

    timeblockCalendar.appendChild(grid);

    // Attach drag-select on the grid (delegated, robust against re-renders)
    attachGridSelection(grid);

    // Render existing blocks as overlays
    blocks.forEach((block) => {
        renderBlock(block, grid);
    });

    // Current-time indicator line
    const nowLine = document.createElement('div');
    nowLine.className = 'cal-now-line';
    nowLine.id = 'cal-now-line';
    nowLine.innerHTML = '<span class="cal-now-dot"></span><span class="cal-now-label"></span>';
    grid.appendChild(nowLine);
    updateNowLine();
}

// Position the "current time" indicator; hides it if outside the calendar range
function updateNowLine() {
    const nowLine = document.getElementById('cal-now-line');
    if (!nowLine) return;

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const startMin = CAL_START_HOUR * 60;
    const endMin = CAL_END_HOUR * 60;

    if (nowMin < startMin || nowMin > endMin) {
        nowLine.style.display = 'none';
        return;
    }

    nowLine.style.display = 'block';
    const top = ((nowMin - startMin) / SLOT_MINUTES) * SLOT_HEIGHT;
    nowLine.style.top = top + 'px';

    const label = nowLine.querySelector('.cal-now-label');
    if (label) label.textContent = formatMinutes(now.getHours() * 60 + now.getMinutes());
}

// Keep the current-time line updated every 30 seconds
setInterval(updateNowLine, 30000);

// Robust drag-to-select using pointer position over the grid
function attachGridSelection(grid) {
    function slotFromEvent(e) {
        // Find which slot the pointer is over
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const slotEl = el && el.closest ? el.closest('.cal-slot') : null;
        if (slotEl) return parseInt(slotEl.dataset.slot);
        return null;
    }

    grid.addEventListener('mousedown', (e) => {
        // Ignore if pressing on an existing block
        if (e.target.closest('.cal-block')) return;
        const slot = slotFromEvent(e);
        if (slot === null) return;
        dragSelecting = true;
        dragStartSlot = slot;
        dragEndSlot = slot;
        updateSelectionHighlight();
        e.preventDefault();
    });

    grid.addEventListener('mousemove', (e) => {
        if (!dragSelecting) return;
        const slot = slotFromEvent(e);
        if (slot === null) return;
        dragEndSlot = slot;
        updateSelectionHighlight();
    });
}

function renderBlock(block, grid) {
    const startSlot = (block.start - CAL_START_HOUR * 60) / SLOT_MINUTES;
    const endSlot = (block.end - CAL_START_HOUR * 60) / SLOT_MINUTES;
    const top = startSlot * SLOT_HEIGHT;
    const height = (endSlot - startSlot) * SLOT_HEIGHT;

    // Guarantee the block has an id so it can always be removed
    if (!block.id) {
        block.id = newBlockId();
        saveData('timeblocksV2', blocks);
    }

    const el = document.createElement('div');
    el.className = 'cal-block' + (block.type === 'break' ? ' break-block' : '')
        + (selectedBlockId === block.id ? ' selected' : '');
    el.style.top = top + 'px';
    el.style.height = (height - 2) + 'px';
    el.dataset.blockId = block.id;
    el.innerHTML = `
        <div class="cal-block-inner">
            <span class="cal-block-task">${block.type === 'break' ? '&#9749; ' : ''}${escapeHtml(block.task)}</span>
            <span class="cal-block-time">${formatMinutes(block.start)} – ${formatMinutes(block.end)}</span>
            <div class="cal-block-actions">
                <button class="cal-block-edit" data-block-id="${block.id}" title="Edit">&#9998;</button>
                <button class="cal-block-remove" data-block-id="${block.id}" title="Remove">&times;</button>
            </div>
        </div>
    `;

    // Prevent starting a drag-select when pressing on a block
    el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    grid.appendChild(el);
}

function startEditBlock(id) {
    const block = blocks.find(b => b.id === id);
    if (!block) return;

    const blockEl = timeblockCalendar.querySelector(`.cal-block[data-block-id="${id}"]`);
    if (!blockEl) return;

    const taskSpan = blockEl.querySelector('.cal-block-task');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input cal-block-edit-input';
    input.value = block.task;

    // Stop mousedown/clicks inside the input from bubbling to selection logic
    input.addEventListener('mousedown', (e) => e.stopPropagation());
    input.addEventListener('click', (e) => e.stopPropagation());

    taskSpan.replaceWith(input);
    input.focus();
    input.select();

    let committed = false;
    const commit = () => {
        if (committed) return;
        committed = true;
        const newText = input.value.trim();
        if (newText) {
            block.task = newText;
            saveData('timeblocksV2', blocks);
        }
        selectedBlockId = null;
        renderTimeBlockCalendar();
    };

    const cancel = () => {
        if (committed) return;
        committed = true;
        selectedBlockId = null;
        renderTimeBlockCalendar();
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });

    // Attach blur after a tick so the initial focus doesn't immediately blur-commit
    setTimeout(() => {
        input.addEventListener('blur', commit);
    }, 50);
}

function updateSelectionHighlight() {
    const slots = timeblockCalendar.querySelectorAll('.cal-slot');
    const lo = Math.min(dragStartSlot, dragEndSlot);
    const hi = Math.max(dragStartSlot, dragEndSlot);
    slots.forEach(s => {
        const idx = parseInt(s.dataset.slot);
        s.classList.toggle('selecting', idx >= lo && idx <= hi);
    });
}

// End drag selection anywhere
document.addEventListener('mouseup', () => {
    if (!dragSelecting) return;
    dragSelecting = false;

    if (dragStartSlot === null || dragEndSlot === null) {
        dragStartSlot = null;
        dragEndSlot = null;
        return;
    }

    const lo = Math.min(dragStartSlot, dragEndSlot);
    const hi = Math.max(dragStartSlot, dragEndSlot) + 1; // inclusive end slot
    const startMin = slotToMinutes(lo);
    const endMin = slotToMinutes(hi);

    // Clear highlight
    timeblockCalendar.querySelectorAll('.cal-slot.selecting').forEach(s => s.classList.remove('selecting'));

    dragStartSlot = null;
    dragEndSlot = null;

    // Open assignment for the selected range
    openAssignModal(startMin, endMin);
});

function openAssignModal(startMin, endMin) {
    const allTasks = [
        ...priorities.map(p => ({ text: p.text, type: 'priority' })),
        ...todos.filter(t => !t.completed).map(t => ({ text: t.text, type: t.type || 'todo' }))
    ];

    const modal = document.createElement('div');
    modal.className = 'assign-modal';
    modal.innerHTML = `
        <div class="assign-modal-content">
            <h3>Assign to ${formatMinutes(startMin)} – ${formatMinutes(endMin)}</h3>
            ${allTasks.length === 0 ? '<p class="no-data">No tasks yet. Add some to your list first.</p>' : ''}
            ${allTasks.map(t => `
                <div class="task-option ${t.type === 'priority' ? 'is-priority' : ''} ${t.type === 'break' ? 'is-break-option' : ''}" data-task="${escapeHtml(t.text)}" data-type="${t.type}">
                    ${t.type === 'priority' ? '<span class="task-badge">Priority</span>' : ''}
                    ${t.type === 'break' ? '&#9749; ' : ''}${escapeHtml(t.text)}
                </div>
            `).join('')}
            <div class="assign-custom">
                <input type="text" id="assign-custom-input" placeholder="Or type a custom entry...">
            </div>
            <div class="assign-modal-actions">
                <button class="btn btn-primary btn-small" id="assign-confirm">Add</button>
                <button class="btn btn-ghost btn-small" id="assign-cancel">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const customInput = modal.querySelector('#assign-custom-input');

    function commitBlock(task, type) {
        if (!task || !task.trim()) return;
        blocks.push({ id: newBlockId(), start: startMin, end: endMin, task: task.trim(), type: type || 'todo' });
        blocks.sort((a, b) => a.start - b.start);
        saveData('timeblocksV2', blocks);
        renderTimeBlockCalendar();
        modal.remove();
    }

    modal.querySelectorAll('.task-option').forEach(opt => {
        opt.addEventListener('click', () => {
            commitBlock(opt.dataset.task, opt.dataset.type === 'break' ? 'break' : 'todo');
        });
    });

    modal.querySelector('#assign-confirm').addEventListener('click', () => {
        commitBlock(customInput.value, 'todo');
    });
    customInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') commitBlock(customInput.value, 'todo');
    });

    modal.querySelector('#assign-cancel').addEventListener('click', () => modal.remove());

    // Backdrop-dismiss: ignore any clicks in the first 300ms so the same
    // gesture that opened the modal can't immediately close it
    const openedAt = Date.now();
    modal.addEventListener('click', (e) => {
        if (e.target === modal && Date.now() - openedAt > 300) {
            modal.remove();
        }
    });

    // Focus the custom input for quick typing
    if (customInput) setTimeout(() => customInput.focus(), 0);
}

// Scroll the calendar so the current time is visible (centered)
window.scrollTimeBlockToNow = function() {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    // Clamp within calendar range
    const startMin = CAL_START_HOUR * 60;
    const endMin = CAL_END_HOUR * 60;
    const clamped = Math.max(startMin, Math.min(nowMin, endMin));

    const slotIndex = (clamped - startMin) / SLOT_MINUTES;
    const targetTop = slotIndex * SLOT_HEIGHT;

    // Center the current time in the visible area
    const scrollTo = Math.max(0, targetTop - timeblockCalendar.clientHeight / 2);
    timeblockCalendar.scrollTop = scrollTo;
};

renderTimeBlockCalendar();
// Scroll to now on initial load
setTimeout(() => window.scrollTimeBlockToNow(), 0);
