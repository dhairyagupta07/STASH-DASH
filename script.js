/* =========================================
   STASH-DASH: BUDGET SURVIVAL RPG
   ========================================= */

// --- 1. DOM SELECTION ---
const hpFill = document.getElementById('hp-fill');
const hpText = document.getElementById('hp-text');
const goldText = document.getElementById('gold-count');
const expenseList = document.getElementById('expense-list');
const expenseForm = document.getElementById('expense-form');
const gameOverOverlay = document.getElementById('game-over-overlay');
const limitOverlay = document.getElementById('limit-overlay');

// Buttons
const buyPotionBtn = document.getElementById('buy-potion-btn');
const resetDayBtn = document.getElementById('reset-day');
const restartBtn = document.getElementById('restart-game');
const clearDataBtn = document.getElementById('clear-data');
const closeLimitBtn = document.getElementById('close-limit-btn'); 


// --- 2. STATE MANAGEMENT ---
let gameState = JSON.parse(localStorage.getItem('stashDashData')) || {
    hp: 100,
    gold: 0,
    expenses: [] 
};

// --- 3. VISUAL EFFECTS ENGINE ---
function triggerVisualEffect(amount, type) {
    const container = document.querySelector('.game-container');
    
    // A. SCREEN SHAKE
    if (type === 'want' || (type === 'damage' && amount > 20)) {
        container.classList.add('shake-active');
        setTimeout(() => container.classList.remove('shake-active'), 500);
    }

    // B. FLOATING TEXT
    const floatEl = document.createElement('div');
    floatEl.className = 'damage-number';

    if (type === 'heal') {
        floatEl.innerText = `+${amount}`;
        floatEl.style.color = '#2ecc71'; 
    } else if (type === 'gold') {
        floatEl.innerText = `+${amount} Gold`;
        floatEl.className += ' gold-number';
    } else {
        floatEl.innerText = `-${amount}`; 
    }

    const randomX = Math.floor(Math.random() * 40) - 20;
    floatEl.style.left = `calc(50% + ${randomX}px)`;
    floatEl.style.top = '20%'; 

    document.querySelector('.game-container').appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1000);
}

// --- 4. CORE FUNCTIONS ---

function saveGame() {
    localStorage.setItem('stashDashData', JSON.stringify(gameState));
    renderUI();
}

function renderUI() {
    // Update Stats
    hpText.innerText = `${Math.ceil(gameState.hp)} / 100`;
    goldText.innerText = gameState.gold;
    
    // Update Health Bar
    hpFill.style.width = `${gameState.hp}%`;
    
    if (gameState.hp > 50) {
        hpFill.style.backgroundColor = '#2ecc71'; 
    } else if (gameState.hp > 20) {
        hpFill.style.backgroundColor = '#f1c40f'; 
    } else {
        hpFill.style.backgroundColor = '#e74c3c'; 
    }

    // Overlays
    if (gameState.hp <= 0) {
        gameOverOverlay.style.display = 'flex';
    } else {
        gameOverOverlay.style.display = 'none';
    }

    // Render List
    expenseList.innerHTML = ''; 
    
    gameState.expenses.forEach(expense => {
        const li = document.createElement('li');
        li.className = 'expense-item';
        
        if(expense.type === 'want') li.style.borderLeftColor = '#e94560';

        li.innerHTML = `
            <span>
                <strong>${expense.name}</strong> 
                <small style="color: #888;">(${expense.type})</small>
            </span>
            <span style="color: #e94560; font-weight: bold;">-$${expense.amount}</span>
            <button class="delete-btn" data-id="${expense.id}">X</button>
        `;
        expenseList.appendChild(li);
    });
}

function calculateTotalSpent() {
    return gameState.expenses.reduce((total, item) => total + item.amount, 0);
}

// ACTION: Add Expense
function addExpense(e) {
    e.preventDefault();

    const nameInput = document.getElementById('expense-name');
    const amountInput = document.getElementById('expense-amount');
    const typeInput = document.getElementById('expense-type');

    const amount = parseFloat(amountInput.value);
    const type = typeInput.value;
    const dailyLimit = 50; 

    if (isNaN(amount) || amount <= 0) {
        alert("Enter a valid cost!");
        return;
    }

    // VALIDATION: Check Limit
    const currentTotal = calculateTotalSpent();
    
    if (currentTotal + amount > dailyLimit) {
        limitOverlay.style.display = 'flex'; // Show Block Screen
        triggerVisualEffect(0, 'want'); 
        return; 
    }

    // Logic: Wants do 1.5x Damage
    let damage = (type === 'want') ? amount * 1.5 : amount;
    
    gameState.hp -= damage;
    if (gameState.hp < 0) gameState.hp = 0;

    triggerVisualEffect(damage.toFixed(0), type);

    const newExpense = {
        id: Date.now(),
        name: nameInput.value,
        amount: amount,
        type: type
    };

    gameState.expenses.push(newExpense);
    
    nameInput.value = '';
    amountInput.value = '';
    saveGame();
}

// ACTION: Delete Expense
function deleteExpense(e) {
    if (e.target.classList.contains('delete-btn')) {
        const id = Number(e.target.dataset.id);
        const expense = gameState.expenses.find(item => item.id === id);
        
        if (expense) {
            let refund = (expense.type === 'want') ? expense.amount * 1.5 : expense.amount;
            gameState.hp += refund;
            if (gameState.hp > 100) gameState.hp = 100;
            
            triggerVisualEffect(refund.toFixed(0), 'heal');
        }

        gameState.expenses = gameState.expenses.filter(item => item.id !== id);
        saveGame();
    }
}

// ACTION: Buy Potion
function buyPotion() {
    const price = 50;
    const heal = 20;

    if (gameState.gold < price) {
        alert(`Need ${price} Gold!`); 
        return;
    }
    if (gameState.hp >= 100) {
        alert("Health is full!");
        return;
    }

    gameState.gold -= price;
    gameState.hp += heal;
    if (gameState.hp > 100) gameState.hp = 100;

    triggerVisualEffect(heal, 'heal');
    saveGame();
}

// ACTION: Reset Day
function resetDay() {
    if(gameState.hp > 0 && gameState.expenses.length > 0) {
        if(confirm("Survive the day? You will earn 10 Gold.")) {
            gameState.gold += 10;
            gameState.expenses = []; 
            triggerVisualEffect(10, 'gold');
            saveGame();
        }
    } else {
        alert("Log some expenses first, or heal up!");
    }
}

// ACTION: Restart
function restartGame() {
    gameState = { hp: 100, gold: 0, expenses: [] };
    saveGame();
    location.reload(); // Reload to clear overlays
}

// ACTION: Wipe Data
function wipeData() {
    if(confirm("Delete save file?")) {
        localStorage.removeItem('stashDashData');
        location.reload();
    }
}

// --- 5. EVENT LISTENERS (At the bottom!) ---
expenseForm.addEventListener('submit', addExpense);
expenseList.addEventListener('click', deleteExpense);
buyPotionBtn.addEventListener('click', buyPotion);
resetDayBtn.addEventListener('click', resetDay);
restartBtn.addEventListener('click', restartGame);
clearDataBtn.addEventListener('click', wipeData);

// Close Limit Overlay Listener
closeLimitBtn.addEventListener('click', () => {
    limitOverlay.style.display = 'none';
});

// Initial Load
renderUI();