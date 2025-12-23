// Snooker Score Counter - Multi-Player Version

// Character Selection System
class CharacterSelector {
    constructor() {
        this.selectedPlayers = [];
        this.playerCount = 2;
        this.modal = document.getElementById('characterModal');
        this.grid = document.getElementById('characterGrid');
        this.startBtn = document.getElementById('startGameBtn');
        this.statusText = document.getElementById('selectionStatus');
        this.countSelector = document.getElementById('playerCountSelector');
        this.selectionArea = document.getElementById('characterSelectionArea');
        
        this.init();
    }

    init() {
        // Check if characters are already selected
        const saved = localStorage.getItem('selectedPlayers');
        if (saved) {
            this.selectedPlayers = JSON.parse(saved);
            this.playerCount = this.selectedPlayers.length;
            this.hideModal();
            return;
        }
        
        // Set up player count buttons
        const countBtns = document.querySelectorAll('.count-btn');
        countBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectPlayerCount(btn));
        });
    }

    selectPlayerCount(btn) {
        this.playerCount = parseInt(btn.dataset.count);
        
        // Hide count selector, show character selection
        this.countSelector.style.display = 'none';
        this.selectionArea.style.display = 'block';
        
        this.renderCharacters();
        this.startBtn.addEventListener('click', () => this.startGame());
    }

    renderCharacters() {
        this.grid.innerHTML = CHARACTERS.map(char => `
            <div class="character-card" data-id="${char.id}" style="--char-image: url('${char.image}')">
                <div class="character-name">${char.name}</div>
            </div>
        `).join('');

        this.grid.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectCharacter(e));
        });
    }

    selectCharacter(e) {
        const card = e.currentTarget;
        const charId = parseInt(card.dataset.id);
        const character = CHARACTERS.find(c => c.id === charId);

        // Already selected
        if (this.selectedPlayers.find(p => p.id === charId)) {
            return;
        }

        // Add to selection
        if (this.selectedPlayers.length < this.playerCount) {
            this.selectedPlayers.push(character);
            card.classList.add('selected');
            
            // Update status
            if (this.selectedPlayers.length < this.playerCount) {
                this.statusText.textContent = `Select Player ${this.selectedPlayers.length + 1}`;
            } else {
                this.statusText.textContent = 'Ready to start!';
                this.startBtn.style.display = 'block';
            }
        }
    }

    startGame() {
        if (this.selectedPlayers.length === this.playerCount) {
            localStorage.setItem('selectedPlayers', JSON.stringify(this.selectedPlayers));
            this.hideModal();
            // Load characters first, then reset scores only
            if (window.scoreCounter) {
                scoreCounter.loadCharacters(this.selectedPlayers);
                scoreCounter.resetScoresOnly();
            }
        }
    }

    hideModal() {
        this.modal.style.display = 'none';
        // Initialize the game with selected characters
        if (window.scoreCounter) {
            scoreCounter.loadCharacters(this.selectedPlayers);
        }
    }

    showModal() {
        this.selectedPlayers = [];
        this.modal.style.display = 'flex';
        this.startBtn.style.display = 'none';
        this.countSelector.style.display = 'block';
        this.selectionArea.style.display = 'none';
        this.statusText.textContent = 'Select Player 1';
    }

    reset() {
        localStorage.removeItem('selectedPlayers');
        this.showModal();
    }
}

class SnookerScoreCounter {
    constructor() {
        this.scores = {};
        this.history = [];
        this.isAnimating = false;
        this.selectedPlayers = [];
        this.playerCount = 0;
        this.container = document.querySelector('.container');
        this.playersContainer = document.getElementById('playersContainer');
        
        this.init();
    }

    init() {
        // Load selected characters
        const saved = localStorage.getItem('selectedPlayers');
        if (saved) {
            this.loadCharacters(JSON.parse(saved));
        }
    }

    loadCharacters(players) {
        this.selectedPlayers = players;
        this.playerCount = players.length;
        
        // Initialize scores
        this.scores = {};
        players.forEach((player, index) => {
            this.scores[index] = 0;
        });
        
        // Clear old storage data when loading new characters
        localStorage.removeItem('snookerScoreData');
        
        // Generate player panels
        this.generatePlayerPanels();
        
        // Cache elements after panels are created
        this.cacheElements();
        this.attachEventListeners();
        // Don't load from storage - we want fresh character names
    }

    generatePlayerPanels() {
        const colors = ['gold', 'silver', 'gold', 'silver', 'gold', 'silver'];
        const playerClasses = ['player-a', 'player-b', 'player-c', 'player-d', 'player-e', 'player-f'];
        
        this.playersContainer.setAttribute('data-players', this.playerCount);
        this.playersContainer.innerHTML = this.selectedPlayers.map((player, index) => `
            <div class="player-panel ${playerClasses[index]}" 
                 style="--bg-image: url('${player.image}'); --bg-size: ${player.zoom || '100%'}; --bg-position: ${player.position || 'center'};">
                <div class="player-header">
                    <input type="text" 
                           class="player-name-input" 
                           id="player-${index}-name" 
                           value="${player.name}"
                           placeholder="Player ${index + 1}"
                           maxlength="20">
                </div>
                
                <div class="score-display">
                    <div class="score-value" id="score-${index}">0</div>
                </div>

                <div class="controls">
                    <div class="score-buttons">
                        <button class="score-btn red-ball" data-player="${index}" data-points="1">+1</button>
                        <button class="score-btn yellow-ball" data-player="${index}" data-points="2">+2</button>
                        <button class="score-btn green-ball" data-player="${index}" data-points="3">+3</button>
                        <button class="score-btn brown-ball" data-player="${index}" data-points="4">+4</button>
                        <button class="score-btn blue-ball" data-player="${index}" data-points="5">+5</button>
                        <button class="score-btn pink-ball" data-player="${index}" data-points="6">+6</button>
                        <button class="score-btn black-ball" data-player="${index}" data-points="7">+7</button>
                    </div>
                    
                    <div class="foul-buttons">
                        <button class="foul-btn" data-player="${index}" data-points="-4">-4</button>
                        <button class="foul-btn" data-player="${index}" data-points="-5">-5</button>
                        <button class="foul-btn" data-player="${index}" data-points="-6">-6</button>
                        <button class="foul-btn" data-player="${index}" data-points="-7">-7</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    cacheElements() {
        // Score displays and name inputs - now dynamic
        this.scoreElements = {};
        this.nameInputs = {};
        
        this.selectedPlayers.forEach((player, index) => {
            this.scoreElements[index] = document.getElementById(`score-${index}`);
            this.nameInputs[index] = document.getElementById(`player-${index}-name`);
        });
        
        // Buttons
        this.scoreBtns = document.querySelectorAll('.score-btn');
        this.foulBtns = document.querySelectorAll('.foul-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.resetBtn = document.getElementById('reset-btn');
        
        // Settings
        this.redsCountSelect = document.getElementById('reds-count');
        this.respotToggle = document.getElementById('respot-toggle');
    }

    attachEventListeners() {
        // Score buttons
        this.scoreBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleScoreClick(e));
        });

        // Foul buttons
        this.foulBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleScoreClick(e));
        });

        // Undo button
        this.undoBtn.addEventListener('click', () => this.undo());

        // Reset button
        this.resetBtn.addEventListener('click', () => this.reset());

        // Player name inputs
        Object.values(this.nameInputs).forEach(input => {
            input.addEventListener('input', () => this.saveToStorage());
        });

        // Settings
        this.redsCountSelect.addEventListener('change', () => this.saveToStorage());
        this.respotToggle.addEventListener('change', () => this.saveToStorage());

        // Change Players button
        const changePlayersBtn = document.getElementById('changePlayersBtn');
        if (changePlayersBtn) {
            changePlayersBtn.addEventListener('click', () => {
                if (window.characterSelector) {
                    characterSelector.reset();
                }
            });
        }
    }

    handleScoreClick(e) {
        if (this.isAnimating) return;

        const btn = e.currentTarget;
        const player = parseInt(btn.dataset.player);
        const points = parseInt(btn.dataset.points);

        this.addScore(player, points);
    }

    addScore(player, points) {
        // Save current state to history
        this.history.push({
            player,
            points,
            previousScores: { ...this.scores }
        });

        // Update score
        this.scores[player] += points;

        // Animate score change
        this.animateScore(player, this.scores[player]);

        // Save to localStorage
        this.saveToStorage();

        // Animate button press
        const playerBtns = document.querySelectorAll(`[data-player="${player}"]`);
        playerBtns.forEach(btn => {
            if (parseInt(btn.dataset.points) === points) {
                btn.classList.add('score-animation');
                setTimeout(() => btn.classList.remove('score-animation'), 300);
            }
        });
    }

    animateScore(player, targetScore) {
        const element = this.scoreElements[player];
        if (!element) return;

        const currentScore = parseInt(element.textContent) || 0;
        const duration = 500;
        const startTime = performance.now();
        
        this.isAnimating = true;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            
            const current = Math.round(currentScore + (targetScore - currentScore) * easeOutCubic);
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };

        requestAnimationFrame(animate);
    }

    undo() {
        if (this.history.length === 0) return;

        const lastAction = this.history.pop();
        this.scores = lastAction.previousScores;

        // Update all displays
        Object.keys(this.scores).forEach(player => {
            if (this.scoreElements[player]) {
                this.scoreElements[player].textContent = this.scores[player];
            }
        });

        this.saveToStorage();
    }

    resetScoresOnly() {
        // Reset only scores and history, reset names to character names
        Object.keys(this.scores).forEach(key => {
            this.scores[key] = 0;
        });
        this.history = [];

        // Reset displays
        Object.keys(this.scoreElements).forEach(key => {
            if (this.scoreElements[key]) {
                this.scoreElements[key].textContent = '0';
            }
        });

        // Reset player names to original character names
        this.selectedPlayers.forEach((player, index) => {
            if (this.nameInputs[index]) {
                this.nameInputs[index].value = player.name;
            }
        });

        // Save to storage
        this.saveToStorage();
    }

    async reset() {
        // Add fade animation
        this.container.classList.add('reset-animation');

        // Wait for animation
        await this.delay(300);

        // Reset all data
        Object.keys(this.scores).forEach(key => {
            this.scores[key] = 0;
        });
        this.history = [];

        // Reset displays
        Object.keys(this.scoreElements).forEach(key => {
            if (this.scoreElements[key]) {
                this.scoreElements[key].textContent = '0';
            }
        });

        // Reset player names to character names
        this.selectedPlayers.forEach((player, index) => {
            if (this.nameInputs[index]) {
                this.nameInputs[index].value = player.name;
            }
        });

        // Reset settings
        this.redsCountSelect.value = '15';
        this.respotToggle.checked = false;

        // Clear storage
        this.saveToStorage();

        // Wait for animation to complete
        await this.delay(300);
        this.container.classList.remove('reset-animation');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    saveToStorage() {
        const data = {
            scores: this.scores,
            names: {},
            settings: {
                reds: this.redsCountSelect.value,
                respot: this.respotToggle.checked
            }
        };

        Object.keys(this.nameInputs).forEach(key => {
            if (this.nameInputs[key]) {
                data.names[key] = this.nameInputs[key].value;
            }
        });

        localStorage.setItem('snookerScoreData', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('snookerScoreData');
        if (!saved) return;

        try {
            const data = JSON.parse(saved);
            
            // Restore scores
            if (data.scores) {
                Object.keys(data.scores).forEach(key => {
                    const index = parseInt(key);
                    if (!isNaN(index) && this.scoreElements[index]) {
                        this.scores[index] = parseInt(data.scores[key]) || 0;
                        this.scoreElements[index].textContent = this.scores[index];
                    }
                });
            }

            // Restore names
            if (data.names) {
                Object.keys(data.names).forEach(key => {
                    const index = parseInt(key);
                    if (!isNaN(index) && this.nameInputs[index]) {
                        this.nameInputs[index].value = data.names[key];
                    }
                });
            }

            // Restore settings
            if (data.settings) {
                this.redsCountSelect.value = data.settings.reds;
                this.respotToggle.checked = data.settings.respot;
            }
        } catch (e) {
            console.error('Error loading from storage:', e);
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Character Selector first
    const characterSelector = new CharacterSelector();
    window.characterSelector = characterSelector;

    // Initialize the score counter (will load characters after selection)
    const scoreCounter = new SnookerScoreCounter();
    window.scoreCounter = scoreCounter;
});

// Add touch feedback for mobile
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', () => {}, { passive: true });
}
