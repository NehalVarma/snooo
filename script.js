// Snooker Score Counter - Advanced JavaScript
class SnookerScoreCounter {
    constructor() {
        this.scores = {
            a: 0,
            b: 0
        };
        this.history = [];
        this.isAnimating = false;
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.loadFromStorage();
    }

    cacheElements() {
        // Score displays
        this.scoreAElement = document.getElementById('score-a');
        this.scoreBElement = document.getElementById('score-b');
        
        // Player name inputs
        this.playerANameInput = document.getElementById('player-a-name');
        this.playerBNameInput = document.getElementById('player-b-name');
        
        // Buttons
        this.scoreBtns = document.querySelectorAll('.score-btn');
        this.foulBtns = document.querySelectorAll('.foul-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.resetBtn = document.getElementById('reset-btn');
        
        // Settings
        this.redsCountSelect = document.getElementById('reds-count');
        this.respotToggle = document.getElementById('respot-toggle');
        
        // Containers
        this.container = document.querySelector('.container');
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
        this.playerANameInput.addEventListener('input', () => this.saveToStorage());
        this.playerBNameInput.addEventListener('input', () => this.saveToStorage());

        // Settings
        this.redsCountSelect.addEventListener('change', () => this.saveToStorage());
        this.respotToggle.addEventListener('change', () => this.saveToStorage());
    }

    handleScoreClick(e) {
        if (this.isAnimating) return;

        const btn = e.currentTarget;
        const player = btn.dataset.player;
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

        // Update score (allow negative scores)
        this.scores[player] += points;

        // Update display with animation
        this.updateScoreDisplay(player);
        
        // Save to storage
        this.saveToStorage();
    }

    updateScoreDisplay(player) {
        const element = player === 'a' ? this.scoreAElement : this.scoreBElement;
        const targetScore = this.scores[player];
        const currentScore = parseInt(element.textContent);

        // Add animation class
        element.classList.add('score-update');

        // Animate score counting
        this.animateScore(element, currentScore, targetScore);

        // Remove animation class after animation
        setTimeout(() => {
            element.classList.remove('score-update');
        }, 600);
    }

    animateScore(element, start, end) {
        const duration = 400;
        const startTime = performance.now();
        const difference = end - start;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (easeOutCubic)
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const current = Math.round(start + (difference * easeProgress));
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = end;
            }
        };

        requestAnimationFrame(step);
    }

    undo() {
        if (this.history.length === 0) {
            // Shake animation when nothing to undo
            this.undoBtn.classList.add('shake');
            setTimeout(() => {
                this.undoBtn.classList.remove('shake');
            }, 500);
            return;
        }

        // Get last action
        const lastAction = this.history.pop();

        // Restore previous scores
        this.scores = { ...lastAction.previousScores };

        // Update both displays (in case score was 0)
        this.updateScoreDisplay('a');
        this.updateScoreDisplay('b');

        // Add shake animation
        this.undoBtn.classList.add('shake');
        setTimeout(() => {
            this.undoBtn.classList.remove('shake');
        }, 500);

        // Save to storage
        this.saveToStorage();
    }

    async reset() {
        // Add fade animation
        this.container.classList.add('reset-animation');

        // Wait for animation
        await this.delay(300);

        // Reset all data
        this.scores = { a: 0, b: 0 };
        this.history = [];

        // Reset displays
        this.scoreAElement.textContent = '0';
        this.scoreBElement.textContent = '0';

        // Reset player names
        this.playerANameInput.value = '';
        this.playerBNameInput.value = '';

        // Reset settings
        this.redsCountSelect.value = '15';
        this.respotToggle.checked = false;

        // Clear storage
        this.saveToStorage();

        // Wait for animation to complete
        await this.delay(300);
        this.container.classList.remove('reset-animation');
    }

    saveToStorage() {
        const data = {
            scores: this.scores,
            history: this.history,
            playerAName: this.playerANameInput.value,
            playerBName: this.playerBNameInput.value,
            redsCount: this.redsCountSelect.value,
            respotColors: this.respotToggle.checked
        };

        try {
            localStorage.setItem('snookerScoreData', JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('snookerScoreData');
            if (data) {
                const parsed = JSON.parse(data);

                // Restore scores
                this.scores = parsed.scores || { a: 0, b: 0 };
                this.history = parsed.history || [];

                // Restore displays
                this.scoreAElement.textContent = this.scores.a;
                this.scoreBElement.textContent = this.scores.b;

                // Restore player names
                if (parsed.playerAName) {
                    this.playerANameInput.value = parsed.playerAName;
                }
                if (parsed.playerBName) {
                    this.playerBNameInput.value = parsed.playerBName;
                }

                // Restore settings
                if (parsed.redsCount) {
                    this.redsCountSelect.value = parsed.redsCount;
                }
                if (parsed.respotColors !== undefined) {
                    this.respotToggle.checked = parsed.respotColors;
                }
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new SnookerScoreCounter();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            app.undo();
        }
        
        // Ctrl/Cmd + R for reset (with confirmation)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (confirm('Reset the match?')) {
                app.reset();
            }
        }
    });

    // Prevent accidental page refresh
    window.addEventListener('beforeunload', (e) => {
        if (app.history.length > 0) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});

// Add touch feedback for mobile
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', () => {}, { passive: true });
}
