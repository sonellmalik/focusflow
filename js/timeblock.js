// ===== My 5 Main Priorities =====
const prioritiesList = document.getElementById('priorities-list');
const priorityInput = document.getElementById('priority-input');
const btnAddPriority = document.getElementById('btn-add-priority');
const prioritiesInputGroup = document.getElementById('priorities-input-group');

let priorities = loadData('priorities', []);

function renderPriorities() {
    prioritiesList.innerHTML = priorities.map((p, i) => `
        <li class="priority-item">
            <span class="priority-number">${i + 1}</span>
            <span class="priority-text">${p.text}</span>
            <button class="btn-remove-priority" data-index="${i}">&times;</button>
        </li>
    `).join('');

    // Hide input if we already have 5
    if (priorities.length >= 5) {
        prioritiesInputGroup.style.display = 'none';
    } else {
        prioritiesInputGroup.style.display = 'flex';
    }

    // Remove button listeners
    prioritiesList.querySelectorAll('.btn-remove-priority').forEach(btn => {
        btn.addEventListener('click', () => {
            priorities.splice(parseInt(btn.dataset.index), 1);
            saveData('priorities', priorities);
            renderPriorities();
        });
    });
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

// ===== Time Blocking =====
const todoInput = document.getElementById('todo-input');
const todoPriority = document.getElementById('todo-priority');
const btnAddTodo = document.getElementById('btn-add-todo');
const todoList = document.getElementById('todo-list');
const timeblockGrid = document.getElementById('timeblock-grid');

let todos = loadData('todos', []);
let timeblocks = loadData('timeblocks', {});

// Generate time block grid (6 AM to 10 PM)
function generateTimeblockGrid() {
    timeblockGrid.innerHTML = '';
    for (let hour = 6; hour <= 22; hour++) {
        const timeStr = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
        const hourKey = `hour_${hour}`;

        const row = document.createElement('div');
        row.className = 'timeblock-row';

        const timeLabel = document.createElement('div');
        timeLabel.className = 'timeblock-time';
        timeLabel.textContent = timeStr;

        const slot = document.createElement('div');
        slot.className = 'timeblock-slot';
        slot.dataset.hour = hourKey;

        if (timeblocks[hourKey]) {
            slot.classList.add('filled');
            slot.innerHTML = `
                <div class="slot-task">
                    <span>${timeblocks[hourKey]}</span>
                    <button class="btn-remove-slot" data-hour="${hourKey}">&times;</button>
                </div>
            `;
        } else {
            slot.textContent = 'Click to assign task';
        }

        slot.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-slot')) {
                removeTimeblock(e.target.dataset.hour);
                return;
            }
            openAssignModal(hourKey);
        });

        // Drop support
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            slot.style.borderColor = 'var(--primary)';
        });
        slot.addEventListener('dragleave', () => {
            slot.style.borderColor = 'transparent';
        });
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.style.borderColor = 'transparent';
            const taskText = e.dataTransfer.getData('text/plain');
            if (taskText) {
                assignTask(hourKey, taskText);
            }
        });

        row.appendChild(timeLabel);
        row.appendChild(slot);
        timeblockGrid.appendChild(row);
    }
}

function removeTimeblock(hourKey) {
    delete timeblocks[hourKey];
    saveData('timeblocks', timeblocks);
    generateTimeblockGrid();
}

function assignTask(hourKey, taskText) {
    timeblocks[hourKey] = taskText;
    saveData('timeblocks', timeblocks);
    generateTimeblockGrid();
}

function openAssignModal(hourKey) {
    // Combine priorities and todos for assignment
    const allTasks = [
        ...priorities.map(p => ({ text: p.text, type: 'priority' })),
        ...todos.filter(t => !t.completed).map(t => ({ text: t.text, type: 'todo' }))
    ];

    if (allTasks.length === 0) {
        alert('Add tasks to your to-do list or priorities first!');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'assign-modal';
    modal.innerHTML = `
        <div class="assign-modal-content">
            <h3>Assign a task</h3>
            ${allTasks.map(t => `
                <div class="task-option ${t.type === 'priority' ? 'is-priority' : ''}" data-task="${t.text}">
                    ${t.type === 'priority' ? '<span class="task-badge">Priority</span>' : ''}
                    ${t.text}
                </div>
            `).join('')}
            <button class="btn btn-ghost btn-small" style="margin-top:1rem; width:100%;">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelectorAll('.task-option').forEach(opt => {
        opt.addEventListener('click', () => {
            assignTask(hourKey, opt.dataset.task);
            modal.remove();
        });
    });

    modal.querySelector('.btn-ghost').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ===== To-Do List =====
function renderTodos() {
    todoList.innerHTML = todos.map((t, i) => `
        <li class="todo-item" draggable="true" data-index="${i}">
            <span class="todo-text">${t.text}</span>
            <span class="todo-priority ${t.priority}">${t.priority}</span>
            <button class="btn-remove-todo" data-index="${i}">&times;</button>
        </li>
    `).join('');

    // Add drag listeners
    todoList.querySelectorAll('.todo-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', todos[item.dataset.index].text);
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
    });

    // Remove button listeners
    todoList.querySelectorAll('.btn-remove-todo').forEach(btn => {
        btn.addEventListener('click', () => {
            todos.splice(btn.dataset.index, 1);
            saveData('todos', todos);
            renderTodos();
        });
    });
}

btnAddTodo.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    todos.push({ text, priority: todoPriority.value, completed: false });
    saveData('todos', todos);
    renderTodos();
    todoInput.value = '';
}

// Initialize
renderTodos();
generateTimeblockGrid();
