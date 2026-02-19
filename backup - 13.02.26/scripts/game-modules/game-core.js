/**
 * Main game logic for 1 Against 95 - Core functionality
 */

// Game state
const gameState = {
    player: null,
    opponents: [],
    currentRound: 0,
    maxRounds: 6,
    roundWords: [],
    currentWordIndex: 0,
    currentWord: null,
    typedWord: "", // For single words
    typedWords: null, // For phrases (array of typed words)
    activeWord: 0, // Currently active word in a phrase
    activeLetterIndex: 0, // Current letter position for editing
    playerCoins: 0,
    roundCoinsEarned: 0,
    roundScore: 0,
    perfectWords: 0,  // Number of perfectly typed words for tracking coins
    dataReady: false,
    debugEnabled: !!window.DEBUG_UI,
    isRoundTransitioning: false,
    ui: {
        activeOverlayId: null,
        lastFocusedElement: null,
        mobileActionBarVisible: false
    },
    powerUpsActive: {
        // Double points power-up
        doublePoints: false,
        
        // Second chance power-ups
        secondChance: false, // For single word
        secondChanceRound: false, // For entire round
        
        // Letter filter power-up
        disabledLetters: [], // Letters disabled by the filter
        
        // Easier word power-up
        originalWord: null, // Stores the original word for point calculations
        removedLetters: 0,  // Tracks how many letters were removed (count as correct)
        easierWordCurrentLevel: 0, // Tracks the current difficulty level for stacking easier word power-ups
        
        // Revealed letters (from other power-ups)
        revealedLetters: []
    }
};

const HIGH_SCORES_STORAGE_KEY = 'hebrewGame_highScores_v1';
const MAX_HIGH_SCORES = 10;
const HIGH_SCORE_NAME_MAX_LENGTH = 20;

// High scores list persisted in localStorage.
let highScores = [];

function normalizeHighScoreName(rawName) {
    if (typeof rawName !== 'string') return '';
    return rawName.trim().slice(0, HIGH_SCORE_NAME_MAX_LENGTH);
}

function normalizeHighScoreValue(rawScore) {
    const parsed = Number(rawScore);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Math.floor(parsed);
}

function normalizeHighScoreTimestamp(rawTimestamp, fallbackTimestamp) {
    const parsed = Number(rawTimestamp);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return Math.floor(fallbackTimestamp);
    }
    return Math.floor(parsed);
}

function sanitizeHighScoreEntry(entry, fallbackTimestamp) {
    if (!entry || typeof entry !== 'object') return null;
    const name = normalizeHighScoreName(entry.name);
    const score = normalizeHighScoreValue(entry.score);
    if (!name || score === null) return null;

    return {
        name,
        score,
        timestamp: normalizeHighScoreTimestamp(entry.timestamp, fallbackTimestamp)
    };
}

function sortHighScores(entries) {
    entries.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        return a.name.localeCompare(b.name);
    });
    return entries;
}

function collapseBestScores(entries) {
    const bestByName = new Map();
    entries.forEach(entry => {
        const key = entry.name.toLowerCase();
        const existing = bestByName.get(key);
        if (!existing) {
            bestByName.set(key, entry);
            return;
        }

        if (
            entry.score > existing.score ||
            (entry.score === existing.score && entry.timestamp < existing.timestamp)
        ) {
            bestByName.set(key, entry);
        }
    });

    return sortHighScores(Array.from(bestByName.values())).slice(0, MAX_HIGH_SCORES);
}

function persistHighScores() {
    try {
        localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify(highScores));
    } catch (error) {
        logDebug('Failed to persist high scores:', error);
    }
}

function getHighScores() {
    return highScores.map(entry => ({
        name: entry.name,
        score: entry.score,
        timestamp: entry.timestamp
    }));
}

function recordHighScore(scoreInput) {
    const timestamp = Date.now();
    const sanitized = sanitizeHighScoreEntry(scoreInput, timestamp);
    if (!sanitized) {
        return getHighScores();
    }

    highScores = collapseBestScores(highScores.concat(sanitized));
    persistHighScores();
    displayHighScores();
    return getHighScores();
}

function clearHighScores() {
    highScores = [];
    persistHighScores();
    displayHighScores();
    return getHighScores();
}

function logDebug() {
    const globalLogger = window.logDebug;
    if (typeof globalLogger === 'function' && globalLogger !== logDebug) {
        globalLogger.apply(window, arguments);
        return;
    }
    if (gameState.debugEnabled && window.console) {
        console.log.apply(console, arguments);
    }
}

function announceToScreenReader(message) {
    if (!message) return;
    const announcer = document.getElementById('sr-announcer');
    if (!announcer) return;

    announcer.textContent = '';
    setTimeout(() => {
        announcer.textContent = String(message);
    }, 20);
}

// Toast function for notifications
function toast({title, description, variant = "default"}) {
    // Create a toast element
    const toastEl = document.createElement('div');
    toastEl.className = `game-toast ${variant}`;
    
    // Add title and description
    toastEl.innerHTML = `
        <div class="toast-title">${title}</div>
        ${description ? `<div class="toast-description">${description}</div>` : ''}
    `;
    
    // Add to document
    document.body.appendChild(toastEl);
    
    // Animate in
    setTimeout(() => {
        toastEl.classList.add('show');
    }, 10);
    
    // Remove after timeout
    setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toastEl);
        }, 300);
    }, 3000);
}

// Initialize the game
function initializeGame() {
    logDebug('Initializing game...');
    
    // Set up DOM event listeners
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', startGame);
        startButton.disabled = true;
        startButton.textContent = 'Loading words...';
        startButton.setAttribute('aria-busy', 'true');
    }
    document.getElementById('use-powerup').addEventListener('click', togglePowerUpsPanel);
    document.getElementById('next-round').addEventListener('click', startNextRound);
    document.getElementById('play-again').addEventListener('click', resetGame);
    const submitButton = document.getElementById('submit-word');
    if (submitButton) {
        submitButton.addEventListener('click', function handleSubmitClick() {
            if (typeof window.submitWord === 'function') {
                window.submitWord();
            }
        });
    }

    window.addEventListener('hebrewGame:dataReady', function onDataReady(event) {
        gameState.dataReady = !!(event.detail && event.detail.ready);
        const errorMessage = event.detail && event.detail.error;
        if (!gameState.dataReady && errorMessage) {
            toast({
                title: "Word list loading failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
        if (!startButton) return;

        startButton.disabled = !gameState.dataReady;
        startButton.textContent = gameState.dataReady
            ? 'Start Game'
            : (errorMessage ? 'Unable to Load Words' : 'Loading words...');
        startButton.removeAttribute('aria-busy');

        if (gameState.dataReady) {
            announceToScreenReader('Word list loaded. You can start the game.');
        }
    });

    if (
        window.HebrewGame &&
        window.HebrewGame.words &&
        typeof window.HebrewGame.words.loadWordListsFromCSV === 'function'
    ) {
        window.HebrewGame.words.loadWordListsFromCSV();
    }

    if (
        window.HebrewGame &&
        window.HebrewGame.ui &&
        typeof window.HebrewGame.ui.initializeStartScreenEnhancements === 'function'
    ) {
        window.HebrewGame.ui.initializeStartScreenEnhancements();
    }
    
    // Load high scores (placeholder - will use Firebase later)
    loadHighScores();
    
    // Show the start screen
    showScreen('start-screen');
    
    // Debug info
    logDebug('Game initialized. Press Start to begin.');
    
    // Add focus to the player name input
    setTimeout(() => {
        const playerNameInput = document.getElementById('player-name');
        if (playerNameInput) {
            playerNameInput.focus();
        }
    }, 500);
}

// Load high scores from localStorage.
function loadHighScores() {
    let parsed = [];
    try {
        const raw = localStorage.getItem(HIGH_SCORES_STORAGE_KEY);
        if (raw) {
            const decoded = JSON.parse(raw);
            if (Array.isArray(decoded)) {
                const now = Date.now();
                const sanitized = decoded
                    .map((entry, index) => sanitizeHighScoreEntry(entry, now + index))
                    .filter(Boolean);
                parsed = collapseBestScores(sanitized);
            }
        }
    } catch (error) {
        logDebug('Failed to load high scores:', error);
    }

    highScores = parsed;
    displayHighScores();
}

// Display high scores on the start screen
function displayHighScores() {
    // Use enhanced renderer as the single start-screen leaderboard view.
    displayEnhancedHighScores();
}

// Enhanced high scores display
function displayEnhancedHighScores() {
    const highScoresList = document.getElementById('high-scores-list');
    if (!highScoresList) return;
    
    // Clear current content
    highScoresList.innerHTML = '';
    
    if (highScores.length > 0) {
        // Create enhanced high score items
        highScores.slice(0, 5).forEach((score, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'high-score-item';
            
            // Add rank number and medal emoji for top 3
            let rankDisplay = `${index + 1}.`;
            if (index === 0) rankDisplay = '🥇';
            else if (index === 1) rankDisplay = '🥈';
            else if (index === 2) rankDisplay = '🥉';
            
            scoreItem.innerHTML = `
                <div class="high-score-content clearfix">
                    <span class="score-name">${rankDisplay} ${score.name}</span>
                    <span class="score-value">${score.score}</span>
                </div>
            `;
            
            highScoresList.appendChild(scoreItem);
        });
    } else {
        // No high scores yet
        const noScores = document.createElement('div');
        noScores.textContent = 'No high scores yet. Be the first!';
        noScores.style.textAlign = 'center';
        noScores.style.padding = '20px';
        noScores.style.color = '#666666';
        highScoresList.appendChild(noScores);
    }
}

// Start the game
function startGame() {
    if (!gameState.dataReady) {
        toast({
            title: "Still loading",
            description: "Word lists are still loading. Please wait a moment.",
            variant: "destructive"
        });
        return;
    }

    const playerName = document.getElementById('player-name').value.trim();
    
    if (!playerName) {
        // Add shake animation to the input field
        const playerNameInput = document.getElementById('player-name');
        playerNameInput.classList.add('shake');
        setTimeout(() => {
            playerNameInput.classList.remove('shake');
        }, 500);
        
        // Focus back on the input
        playerNameInput.focus();
        
        // Don't proceed further
        return;
    }
    
    // Initialize game state - ENSURE ALL DEFAULTS ARE PROPERLY SET
    gameState.player = new Hero(playerName, 50); // Player starts with average skill
    gameState.player.score = 0; // Explicitly set score to 0
    gameState.opponents = generateOpponents(95);
    gameState.currentRound = 0;
    gameState.playerCoins = 0;
    gameState.roundCoinsEarned = 0;
    gameState.roundScore = 0;
    gameState.perfectWords = 0;
    gameState.isRoundTransitioning = false;
    gameState.ui.activeOverlayId = null;
    gameState.ui.lastFocusedElement = null;
    gameState.ui.mobileActionBarVisible = false;
    
    // Reset power-ups
    gameState.powerUpsActive = {
        doublePoints: false,
        secondChance: false,
        secondChanceRound: false,
        disabledLetters: [],
        originalWord: null,
        removedLetters: 0,
        easierWordCurrentLevel: 0,
        revealedLetters: []
    };
    
    // Reset editing state
    gameState.activeWord = 0;
    gameState.activeLetterIndex = 0;
    
    // Initialize power-ups
    initializePlayerPowerUps();
    
    // Display player name
    document.getElementById('player-name-display').textContent = playerName;
    document.getElementById('current-score').textContent = '0';
    document.getElementById('coin-count').textContent = '0';
    
    // Start the first round
    startNextRound();
    
    // Check if power-up button should be visible
    updatePowerUpButtonVisibility();
}

// Helper function to show a specific screen
function showScreen(screenId) {
    const screens = document.querySelectorAll('.game-screen');
    
    screens.forEach(screen => {
        if (screen.id === screenId) {
            screen.classList.remove('hidden');
            screen.setAttribute('aria-hidden', 'false');
        } else {
            screen.classList.add('hidden');
            screen.setAttribute('aria-hidden', 'true');
        }
    });

    gameState.ui.mobileActionBarVisible = screenId === 'round-screen';
}

// Reset the game to play again
function resetGame() {
    if (
        window.HebrewGame &&
        window.HebrewGame.ui &&
        typeof window.HebrewGame.ui.isStoreOverlayOpen === 'function' &&
        window.HebrewGame.ui.isStoreOverlayOpen() &&
        typeof window.HebrewGame.ui.closeStoreOverlay === 'function'
    ) {
        window.HebrewGame.ui.closeStoreOverlay();
    }

    // Clear all game state
    gameState.player = null;
    gameState.opponents = [];
    gameState.currentRound = 0;
    gameState.playerCoins = 0;
    gameState.roundCoinsEarned = 0;
    gameState.roundScore = 0;
    gameState.perfectWords = 0;
    gameState.isRoundTransitioning = false;
    gameState.ui.activeOverlayId = null;
    gameState.ui.lastFocusedElement = null;
    gameState.ui.mobileActionBarVisible = false;
    
    // Reset power-ups
    gameState.powerUpsActive = {
        doublePoints: false,
        secondChance: false,
        secondChanceRound: false,
        disabledLetters: [],
        originalWord: null,
        removedLetters: 0,
        easierWordCurrentLevel: 0,
        revealedLetters: []
    };
    
    // Reset editing state
    gameState.typedWords = null;
    gameState.activeWord = 0;
    gameState.activeLetterIndex = 0;
    
    // Show the start screen
    showScreen('start-screen');
    displayHighScores();
}

// Unified public namespace
window.HebrewGame = window.HebrewGame || {};
window.HebrewGame.core = window.HebrewGame.core || {};
window.HebrewGame.ui = window.HebrewGame.ui || {};
window.HebrewGame.words = window.HebrewGame.words || {};
window.HebrewGame.powerups = window.HebrewGame.powerups || {};
window.HebrewGame.debug = window.HebrewGame.debug || {};

window.HebrewGame.core.initializeGame = initializeGame;
window.HebrewGame.core.startGame = startGame;
window.HebrewGame.core.showScreen = showScreen;
window.HebrewGame.core.resetGame = resetGame;
window.HebrewGame.core.displayHighScores = displayHighScores;
window.HebrewGame.core.displayEnhancedHighScores = displayEnhancedHighScores;
window.HebrewGame.core.getHighScores = getHighScores;
window.HebrewGame.core.recordHighScore = recordHighScore;
window.HebrewGame.core.getGameState = function getGameState() {
    return gameState;
};
window.HebrewGame.ui.announce = announceToScreenReader;

window.HebrewGame.debug.getGameState = window.HebrewGame.core.getGameState;
window.HebrewGame.debug.forceShowScreen = function forceShowScreen(screenId) {
    showScreen(screenId);
    return true;
};
window.HebrewGame.debug.setEnabled = function setDebugEnabled(enabled) {
    gameState.debugEnabled = !!enabled;
    window.DEBUG_UI = !!enabled;
};
window.HebrewGame.debug.clearHighScores = clearHighScores;

window.showScreen = showScreen;
window.startGame = function startGameCompat() {
    return window.HebrewGame.core.startGame.apply(null, arguments);
};

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initializeGame);
