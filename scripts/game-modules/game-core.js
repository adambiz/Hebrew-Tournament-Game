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
        secondChanceRoundUsedThisWord: false, // One free retry per word when round bonus is active
        
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
const ACTIVE_GAME_STORAGE_KEY = 'hebrewGame_activeGame_v1';
const ACTIVE_GAME_SCHEMA_VERSION = 1;
const ACTIVE_GAME_AUTOSAVE_INTERVAL_MS = 1500;
const ACTIVE_GAME_AUTOSAVE_THROTTLE_MS = 650;
const DEFAULT_HIGH_SCORE_SEED = [
    { name: 'VaderVanquisher Max', score: 46, avatar: 'assets/images/3x/portrait-with-border154.png' },
    { name: 'IronBlockPro Ben', score: 41, avatar: 'assets/images/3x/portrait-with-border37.png' },
    { name: 'Adam', score: 38, avatar: 'assets/images/3x/portrait-with-border1.png' },
    { name: 'JediNova Noa', score: 34, avatar: 'assets/images/3x/portrait-with-border82.png' },
    { name: 'ShieldSprint Maya', score: 31, avatar: 'assets/images/3x/portrait-with-border112.png' },
    { name: 'CometRider Eli', score: 27, avatar: 'assets/images/3x/portrait-with-border57.png' },
    { name: 'PixelNinja Dani', score: 24, avatar: 'assets/images/3x/portrait-with-border19.png' },
    { name: 'TurboTal Roni', score: 22, avatar: 'assets/images/3x/portrait-with-border143.png' },
    { name: 'BlockBoss Avi', score: 19, avatar: 'assets/images/3x/portrait-with-border68.png' },
    { name: 'SaberSasha', score: 15, avatar: 'assets/images/3x/portrait-with-border26.png' }
];

// High scores list persisted in localStorage.
let highScores = [];
let latestDataLoadErrorMessage = null;
let activeGameAutosaveIntervalId = null;
let activeGameAutosaveLastSavedAt = 0;
let activeGamePagehideBound = false;
let pendingActiveGameSnapshot = null;
let resumeOverlayState = null;

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

function getHighScoreHeroesApi() {
    return window.HebrewGame && window.HebrewGame.heroes
        ? window.HebrewGame.heroes
        : null;
}

function getDeterministicHighScoreAvatar(name) {
    const heroesApi = getHighScoreHeroesApi();
    if (heroesApi && typeof heroesApi.getAvatarCatalog === 'function') {
        const catalog = heroesApi.getAvatarCatalog();
        if (Array.isArray(catalog) && catalog.length > 0) {
            const source = String(name || '').trim().toLowerCase();
            let hash = 0;
            for (let i = 0; i < source.length; i++) {
                hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
            }
            const candidate = catalog[hash % catalog.length];
            if (candidate && typeof candidate.path === 'string' && candidate.path) {
                return candidate.path;
            }
        }
    }
    return 'assets/images/3x/portrait-with-border1.png';
}

function normalizeHighScoreAvatar(rawAvatar, name) {
    const heroesApi = getHighScoreHeroesApi();
    if (heroesApi && typeof heroesApi.normalizeAvatarPath === 'function') {
        const normalized = heroesApi.normalizeAvatarPath(rawAvatar);
        if (normalized) return normalized;
    }
    return getDeterministicHighScoreAvatar(name);
}

function sanitizeHighScoreEntry(entry, fallbackTimestamp) {
    if (!entry || typeof entry !== 'object') return null;
    const name = normalizeHighScoreName(entry.name);
    const score = normalizeHighScoreValue(entry.score);
    if (!name || score === null) return null;
    const avatar = normalizeHighScoreAvatar(entry.avatar, name);

    return {
        name,
        score,
        timestamp: normalizeHighScoreTimestamp(entry.timestamp, fallbackTimestamp),
        avatar
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

function buildDefaultHighScores(now = Date.now()) {
    const seededEntries = DEFAULT_HIGH_SCORE_SEED
        .map((entry, index) => {
            const timestamp = now - (index + 1);
            return sanitizeHighScoreEntry(
                {
                    name: entry.name,
                    score: entry.score,
                    timestamp
                },
                timestamp
            );
        })
        .filter(Boolean);

    return collapseBestScores(seededEntries);
}

function ensureSeededHighScores(entries) {
    const currentEntries = Array.isArray(entries) ? entries : [];
    if (currentEntries.length >= 5) {
        return currentEntries;
    }
    return collapseBestScores(currentEntries.concat(buildDefaultHighScores()));
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
        timestamp: entry.timestamp,
        avatar: entry.avatar
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

function getHeroesApi() {
    return window.HebrewGame && window.HebrewGame.heroes
        ? window.HebrewGame.heroes
        : null;
}

function getStartScreenApi() {
    return window.HebrewGame && window.HebrewGame.ui
        ? window.HebrewGame.ui
        : null;
}

function getI18nApi() {
    return window.HebrewGame && window.HebrewGame.i18n
        ? window.HebrewGame.i18n
        : null;
}

function t(key, vars) {
    const i18nApi = getI18nApi();
    if (i18nApi && typeof i18nApi.t === 'function') {
        return i18nApi.t(key, vars);
    }
    return key;
}

function toFiniteNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toFiniteInteger(value, fallback = 0, min = null, max = null) {
    let parsed = Math.floor(toFiniteNumber(value, fallback));
    if (min !== null) parsed = Math.max(min, parsed);
    if (max !== null) parsed = Math.min(max, parsed);
    return parsed;
}

function normalizeOverlayId(value) {
    return value === 'store-overlay' ? 'store-overlay' : null;
}

function getVisibleScreenId() {
    const visibleScreen = Array.from(document.querySelectorAll('.game-screen')).find(function (screen) {
        return !screen.classList.contains('hidden');
    });
    return visibleScreen ? visibleScreen.id : 'start-screen';
}

function shouldPersistActiveGameSnapshot(screenId = getVisibleScreenId()) {
    if (!gameState.player) return false;
    if (screenId !== 'round-screen' && screenId !== 'round-results') return false;

    const currentRound = toFiniteInteger(gameState.currentRound, 0, 0);
    const maxRounds = toFiniteInteger(gameState.maxRounds, 6, 1);
    return currentRound >= 1 && currentRound <= maxRounds;
}

function cloneWordData(rawWordData) {
    if (!rawWordData || typeof rawWordData !== 'object') return null;

    const hebrew = String(rawWordData.hebrew || '').trim();
    const words = Array.isArray(rawWordData.words)
        ? rawWordData.words.map(function (word) {
            return String(word || '');
        })
        : [];
    const isPhrase = typeof rawWordData.isPhrase === 'boolean'
        ? rawWordData.isPhrase
        : words.length > 1;
    const fallbackWordCount = isPhrase ? Math.max(1, words.length) : 1;
    const fallbackTotalLetters = isPhrase
        ? words.join('').length
        : hebrew.length;

    return {
        german: String(rawWordData.german || ''),
        hebrew: hebrew,
        english: String(rawWordData.english || ''),
        hebrewVocalized: String(rawWordData.hebrewVocalized || ''),
        ttsText: String(rawWordData.ttsText || ''),
        emoji: String(rawWordData.emoji || ''),
        words: words,
        wordCount: toFiniteInteger(rawWordData.wordCount, fallbackWordCount, 1),
        isPhrase: isPhrase,
        totalLetters: toFiniteInteger(rawWordData.totalLetters, fallbackTotalLetters, 0)
    };
}

function cloneWordList(rawWordList) {
    if (!Array.isArray(rawWordList)) return [];
    return rawWordList.map(cloneWordData).filter(Boolean);
}

function clonePowerUpsActiveState(rawPowerUps) {
    const powerUps = rawPowerUps && typeof rawPowerUps === 'object' ? rawPowerUps : {};
    const normalized = {
        doublePoints: !!powerUps.doublePoints,
        secondChance: !!powerUps.secondChance,
        secondChanceRound: !!powerUps.secondChanceRound,
        secondChanceRoundUsedThisWord: !!powerUps.secondChanceRoundUsedThisWord,
        disabledLetters: Array.isArray(powerUps.disabledLetters)
            ? powerUps.disabledLetters.map(function (letter) { return String(letter || ''); }).filter(Boolean)
            : [],
        originalWord: cloneWordData(powerUps.originalWord),
        removedLetters: toFiniteInteger(powerUps.removedLetters, 0, 0),
        easierWordCurrentLevel: toFiniteInteger(powerUps.easierWordCurrentLevel, 0, 0),
        revealedLetters: Array.isArray(powerUps.revealedLetters)
            ? powerUps.revealedLetters.map(function (index) {
                return toFiniteInteger(index, 0, 0);
            })
            : []
    };

    if (Number.isFinite(powerUps.originalTotalLetters)) {
        normalized.originalTotalLetters = toFiniteInteger(powerUps.originalTotalLetters, 0, 0);
    }

    return normalized;
}

function cloneRoundScores(rawRoundScores) {
    if (!Array.isArray(rawRoundScores)) return [];
    return rawRoundScores.map(function (score) {
        return toFiniteInteger(score, 0, 0);
    });
}

function createHeroSnapshot(hero) {
    if (!hero || typeof hero !== 'object') return null;
    const name = String(hero.name || '').trim();
    if (!name) return null;

    return {
        name: name,
        skillLevel: toFiniteNumber(hero.skillLevel, 50),
        consistency: toFiniteNumber(hero.consistency, 0.5),
        perfectWordCapability: toFiniteNumber(hero.perfectWordCapability, 0.5),
        isElite: !!hero.isElite,
        avatar: String(hero.avatar || ''),
        id: String(hero.id || ''),
        score: toFiniteInteger(hero.score, 0, 0),
        roundScores: cloneRoundScores(hero.roundScores),
        eliminated: !!hero.eliminated,
        firstRoundBonus: Number.isFinite(hero.firstRoundBonus) ? toFiniteNumber(hero.firstRoundBonus, 0) : null,
        performanceBonus: Number.isFinite(hero.performanceBonus) ? toFiniteNumber(hero.performanceBonus, 0) : null,
        errorThreshold: Number.isFinite(hero.errorThreshold) ? toFiniteNumber(hero.errorThreshold, 0) : null
    };
}

function sanitizePowerUpInventory(rawInventory) {
    const normalized = {};
    if (!rawInventory || typeof rawInventory !== 'object' || Array.isArray(rawInventory)) {
        return normalized;
    }

    Object.keys(rawInventory).forEach(function (id) {
        normalized[id] = toFiniteInteger(rawInventory[id], 0, 0);
    });
    return normalized;
}

function readPowerUpInventorySnapshot() {
    const powerUpsApi = window.HebrewGame && window.HebrewGame.powerups
        ? window.HebrewGame.powerups
        : null;
    if (powerUpsApi && typeof powerUpsApi.getInventorySnapshot === 'function') {
        return sanitizePowerUpInventory(powerUpsApi.getInventorySnapshot());
    }
    return {};
}

function applyPowerUpInventorySnapshot(inventorySnapshot) {
    const powerUpsApi = window.HebrewGame && window.HebrewGame.powerups
        ? window.HebrewGame.powerups
        : null;
    if (powerUpsApi && typeof powerUpsApi.setInventorySnapshot === 'function') {
        powerUpsApi.setInventorySnapshot(sanitizePowerUpInventory(inventorySnapshot));
    }
}

function createActiveGameSnapshot() {
    const screenId = getVisibleScreenId();
    if (!shouldPersistActiveGameSnapshot(screenId)) return null;

    const playerSnapshot = createHeroSnapshot(gameState.player);
    if (!playerSnapshot) return null;

    const opponentsSnapshot = Array.isArray(gameState.opponents)
        ? gameState.opponents.map(createHeroSnapshot).filter(Boolean)
        : [];

    return {
        schemaVersion: ACTIVE_GAME_SCHEMA_VERSION,
        savedAt: Date.now(),
        screenId: screenId,
        player: playerSnapshot,
        opponents: opponentsSnapshot,
        currentRound: toFiniteInteger(gameState.currentRound, 1, 1),
        maxRounds: toFiniteInteger(gameState.maxRounds, 6, 1),
        roundWords: cloneWordList(gameState.roundWords),
        currentWordIndex: toFiniteInteger(gameState.currentWordIndex, 0, 0),
        currentWord: cloneWordData(gameState.currentWord),
        typedWord: String(gameState.typedWord || ''),
        typedWords: Array.isArray(gameState.typedWords)
            ? gameState.typedWords.map(function (word) { return String(word || ''); })
            : null,
        activeWord: toFiniteInteger(gameState.activeWord, 0, 0),
        activeLetterIndex: toFiniteInteger(gameState.activeLetterIndex, 0, 0),
        playerCoins: toFiniteInteger(gameState.playerCoins, 0, 0),
        roundCoinsEarned: toFiniteInteger(gameState.roundCoinsEarned, 0, 0),
        roundScore: toFiniteInteger(gameState.roundScore, 0, 0),
        perfectWords: toFiniteInteger(gameState.perfectWords, 0, 0),
        powerUpsActive: clonePowerUpsActiveState(gameState.powerUpsActive),
        ui: {
            activeOverlayId: normalizeOverlayId(gameState.ui && gameState.ui.activeOverlayId)
        },
        powerUpInventory: readPowerUpInventorySnapshot()
    };
}

function clearActiveGameSnapshot() {
    try {
        localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
    } catch (error) {
        logDebug('Failed to clear active game snapshot:', error);
    }
    activeGameAutosaveLastSavedAt = 0;
}

function persistActiveGameSnapshot(options = {}) {
    const force = !!options.force;
    const now = Date.now();
    if (!force && now - activeGameAutosaveLastSavedAt < ACTIVE_GAME_AUTOSAVE_THROTTLE_MS) {
        return false;
    }

    const snapshot = createActiveGameSnapshot();
    if (!snapshot) return false;

    try {
        localStorage.setItem(ACTIVE_GAME_STORAGE_KEY, JSON.stringify(snapshot));
        activeGameAutosaveLastSavedAt = now;
        return true;
    } catch (error) {
        logDebug('Failed to persist active game snapshot:', error);
        return false;
    }
}

function sanitizeHeroSnapshot(rawHero) {
    if (!rawHero || typeof rawHero !== 'object') return null;

    const name = String(rawHero.name || '').trim();
    if (!name) return null;

    return {
        name: name,
        skillLevel: toFiniteNumber(rawHero.skillLevel, 50),
        consistency: toFiniteNumber(rawHero.consistency, 0.5),
        perfectWordCapability: toFiniteNumber(rawHero.perfectWordCapability, 0.5),
        isElite: !!rawHero.isElite,
        avatar: String(rawHero.avatar || ''),
        id: String(rawHero.id || ''),
        score: toFiniteInteger(rawHero.score, 0, 0),
        roundScores: cloneRoundScores(rawHero.roundScores),
        eliminated: !!rawHero.eliminated,
        firstRoundBonus: Number.isFinite(rawHero.firstRoundBonus) ? toFiniteNumber(rawHero.firstRoundBonus, 0) : null,
        performanceBonus: Number.isFinite(rawHero.performanceBonus) ? toFiniteNumber(rawHero.performanceBonus, 0) : null,
        errorThreshold: Number.isFinite(rawHero.errorThreshold) ? toFiniteNumber(rawHero.errorThreshold, 0) : null
    };
}

function sanitizeActiveGameSnapshot(rawSnapshot) {
    if (!rawSnapshot || typeof rawSnapshot !== 'object' || Array.isArray(rawSnapshot)) return null;
    if (toFiniteInteger(rawSnapshot.schemaVersion, -1) !== ACTIVE_GAME_SCHEMA_VERSION) return null;

    const screenId = String(rawSnapshot.screenId || '');
    if (screenId !== 'round-screen' && screenId !== 'round-results') return null;

    const player = sanitizeHeroSnapshot(rawSnapshot.player);
    if (!player) return null;

    if (!Array.isArray(rawSnapshot.opponents)) return null;
    const opponents = rawSnapshot.opponents.map(sanitizeHeroSnapshot);
    if (opponents.some(function (hero) { return !hero; })) return null;

    const maxRounds = toFiniteInteger(rawSnapshot.maxRounds, 6, 1);
    const currentRound = toFiniteInteger(rawSnapshot.currentRound, 1, 1, maxRounds);
    const roundWords = cloneWordList(rawSnapshot.roundWords);
    if (roundWords.length === 0) return null;

    const currentWordIndex = toFiniteInteger(rawSnapshot.currentWordIndex, 0, 0, Math.max(0, roundWords.length - 1));
    const currentWord = cloneWordData(rawSnapshot.currentWord) || cloneWordData(roundWords[currentWordIndex]);
    if (!currentWord) return null;

    const sanitized = {
        schemaVersion: ACTIVE_GAME_SCHEMA_VERSION,
        savedAt: toFiniteInteger(rawSnapshot.savedAt, Date.now(), 0),
        screenId: screenId,
        player: player,
        opponents: opponents,
        currentRound: currentRound,
        maxRounds: maxRounds,
        roundWords: roundWords,
        currentWordIndex: currentWordIndex,
        currentWord: currentWord,
        typedWord: String(rawSnapshot.typedWord || ''),
        typedWords: Array.isArray(rawSnapshot.typedWords)
            ? rawSnapshot.typedWords.map(function (word) { return String(word || ''); })
            : null,
        activeWord: toFiniteInteger(rawSnapshot.activeWord, 0, 0),
        activeLetterIndex: toFiniteInteger(rawSnapshot.activeLetterIndex, 0, 0),
        playerCoins: toFiniteInteger(rawSnapshot.playerCoins, 0, 0),
        roundCoinsEarned: toFiniteInteger(rawSnapshot.roundCoinsEarned, 0, 0),
        roundScore: toFiniteInteger(rawSnapshot.roundScore, 0, 0),
        perfectWords: toFiniteInteger(rawSnapshot.perfectWords, 0, 0),
        powerUpsActive: clonePowerUpsActiveState(rawSnapshot.powerUpsActive),
        ui: {
            activeOverlayId: normalizeOverlayId(rawSnapshot.ui && rawSnapshot.ui.activeOverlayId)
        },
        powerUpInventory: sanitizePowerUpInventory(rawSnapshot.powerUpInventory)
    };

    return sanitized;
}

function loadActiveGameSnapshot() {
    try {
        const raw = localStorage.getItem(ACTIVE_GAME_STORAGE_KEY);
        if (!raw) return null;
        const decoded = JSON.parse(raw);
        const snapshot = sanitizeActiveGameSnapshot(decoded);
        if (!snapshot) {
            localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
        }
        return snapshot;
    } catch (error) {
        logDebug('Failed to load active game snapshot:', error);
        clearActiveGameSnapshot();
        return null;
    }
}

function hydrateHeroFromSnapshot(heroSnapshot) {
    if (!heroSnapshot) return null;

    const hero = new Hero(
        heroSnapshot.name,
        heroSnapshot.skillLevel,
        heroSnapshot.consistency,
        heroSnapshot.perfectWordCapability,
        !!heroSnapshot.isElite,
        heroSnapshot.avatar
    );

    hero.id = heroSnapshot.id || hero.id;
    hero.score = toFiniteInteger(heroSnapshot.score, 0, 0);
    hero.roundScores = cloneRoundScores(heroSnapshot.roundScores);
    hero.eliminated = !!heroSnapshot.eliminated;

    if (Number.isFinite(heroSnapshot.firstRoundBonus)) {
        hero.firstRoundBonus = toFiniteNumber(heroSnapshot.firstRoundBonus, 0);
    } else {
        delete hero.firstRoundBonus;
    }

    if (Number.isFinite(heroSnapshot.performanceBonus)) {
        hero.performanceBonus = toFiniteNumber(heroSnapshot.performanceBonus, hero.performanceBonus);
    }

    if (Number.isFinite(heroSnapshot.errorThreshold)) {
        hero.errorThreshold = toFiniteNumber(heroSnapshot.errorThreshold, hero.errorThreshold);
    }

    return hero;
}

function getResumePromptText(wordData) {
    const i18nApi = getI18nApi();
    if (i18nApi && typeof i18nApi.getPromptText === 'function') {
        return i18nApi.getPromptText(wordData);
    }
    return wordData && typeof wordData.german === 'string' ? wordData.german : '';
}

function renderRoundHeaderPlayerIdentity() {
    const playerNameDisplay = document.getElementById('player-name-display');
    if (!playerNameDisplay) return;

    const heroesApi = getHeroesApi();
    if (gameState.player && heroesApi && typeof heroesApi.createHeroNameMarkup === 'function') {
        playerNameDisplay.innerHTML = heroesApi.createHeroNameMarkup(gameState.player, {
            nameClass: 'player-name-text',
            avatarClass: 'hero-avatar-player-header'
        });
        return;
    }

    playerNameDisplay.textContent = gameState.player ? String(gameState.player.name || '') : '';
}

function setRoundProgressByIndex(currentIndex, totalWords) {
    const progressBar = document.getElementById('round-progress-bar');
    if (!progressBar) return;

    const denominator = Math.max(1, toFiniteInteger(totalWords, 1, 1));
    const safeIndex = toFiniteInteger(currentIndex, 0, 0, denominator);
    const progressPercent = (safeIndex / denominator) * 100;
    progressBar.style.width = `${progressPercent}%`;
}

function updateNextRoundPreviewFromState() {
    const nextRoundNumberEl = document.getElementById('next-round-number');
    const nextRoundDescriptionEl = document.getElementById('next-round-description');
    if (!nextRoundNumberEl || !nextRoundDescriptionEl) return;

    const currentRound = toFiniteInteger(gameState.currentRound, 1, 1);
    const maxRounds = toFiniteInteger(gameState.maxRounds, 6, 1);
    const nextRound = Math.min(maxRounds, currentRound + 1);
    nextRoundNumberEl.textContent = String(nextRound);
    nextRoundDescriptionEl.textContent = currentRound >= maxRounds
        ? t('round.description.finalResults')
        : t(`round.description.${nextRound}`);
}

function restoreRoundScreenFromSnapshot() {
    showScreen('round-screen');

    renderRoundHeaderPlayerIdentity();
    const currentRoundElement = document.getElementById('current-round');
    if (currentRoundElement) {
        currentRoundElement.textContent = String(gameState.currentRound);
    }

    const currentScoreElement = document.getElementById('current-score');
    if (currentScoreElement) {
        currentScoreElement.textContent = String(toFiniteInteger(gameState.player && gameState.player.score, 0, 0));
    }

    const coinCountElement = document.getElementById('coin-count');
    if (coinCountElement) {
        coinCountElement.textContent = String(gameState.playerCoins);
    }

    if (!gameState.currentWord && Array.isArray(gameState.roundWords) && gameState.roundWords[gameState.currentWordIndex]) {
        gameState.currentWord = cloneWordData(gameState.roundWords[gameState.currentWordIndex]);
    }

    const promptElement = document.getElementById('german-word');
    if (promptElement && gameState.currentWord) {
        promptElement.textContent = getResumePromptText(gameState.currentWord);
    }

    const wordCounterElement = document.getElementById('current-word-counter');
    if (wordCounterElement) {
        wordCounterElement.textContent = t('round.wordCounter', {
            current: gameState.currentWordIndex + 1,
            total: gameState.roundWords.length
        });
    }

    setRoundProgressByIndex(gameState.currentWordIndex, gameState.roundWords.length);

    if (typeof resetKeyboard === 'function') {
        resetKeyboard();
    }
    if (typeof initializeKeyboard === 'function' && typeof handleKeyPress === 'function') {
        initializeKeyboard('hebrew-keyboard', handleKeyPress);
    }
    if (typeof initializePhysicalKeyboard === 'function' && typeof handleKeyPress === 'function') {
        initializePhysicalKeyboard(handleKeyPress);
    }

    if (
        window.HebrewGame &&
        window.HebrewGame.words &&
        typeof window.HebrewGame.words.refreshWordUiFromState === 'function'
    ) {
        window.HebrewGame.words.refreshWordUiFromState();
    }

    if (
        window.HebrewGame &&
        window.HebrewGame.tts &&
        typeof window.HebrewGame.tts.onPromptChanged === 'function' &&
        gameState.currentWord
    ) {
        window.HebrewGame.tts.onPromptChanged(gameState.currentWord, 'resumeRestore');
    }

    if (
        window.HebrewGame &&
        window.HebrewGame.ui &&
        typeof window.HebrewGame.ui.updateTournamentDisplay === 'function'
    ) {
        window.HebrewGame.ui.updateTournamentDisplay();
    }

    if (typeof updatePowerUpButtonVisibility === 'function') {
        updatePowerUpButtonVisibility();
    }
}

function buildRoundResultsContestants(roundNumber) {
    const contestants = [gameState.player].concat(Array.isArray(gameState.opponents) ? gameState.opponents : []);
    const filtered = contestants.filter(function (hero) {
        if (!hero) return false;
        if (hero === gameState.player) return true;
        return Array.isArray(hero.roundScores) && hero.roundScores.length >= roundNumber;
    });
    return filtered.length > 0 ? filtered : contestants.filter(Boolean);
}

function getSortedRoundResultsContestants(contestants) {
    const sorted = Array.isArray(contestants) ? contestants.slice() : [];
    sorted.sort(function (a, b) {
        const scoreDiff = (Number(b && b.score) || 0) - (Number(a && a.score) || 0);
        if (scoreDiff !== 0) return scoreDiff;
        if (a === gameState.player) return -1;
        if (b === gameState.player) return 1;
        return String(a && a.name || '').localeCompare(String(b && b.name || ''));
    });
    return sorted;
}

function restoreRoundResultsFromSnapshot(snapshot) {
    showScreen('round-results');
    updateNextRoundPreviewFromState();

    const contestants = buildRoundResultsContestants(gameState.currentRound);
    const sortedContestants = getSortedRoundResultsContestants(contestants);
    const playerRank = Math.max(1, sortedContestants.findIndex(function (hero) {
        return hero === gameState.player;
    }) + 1);

    if (typeof window.displayRoundResults === 'function') {
        window.displayRoundResults({
            playerRank: playerRank,
            totalContestants: sortedContestants.length,
            allContestants: sortedContestants,
            playerScore: gameState.player.score,
            roundScore: gameState.roundScore,
            roundCoinsEarned: gameState.roundCoinsEarned,
            playerCoins: gameState.playerCoins,
            isEliminated: !!(gameState.player && gameState.player.eliminated),
            currentRound: gameState.currentRound,
            maxRounds: gameState.maxRounds
        });
    }

    const storeButton = document.getElementById('visit-store');
    if (storeButton) {
        storeButton.onclick = function handleStoreOpen() {
            if (
                window.HebrewGame &&
                window.HebrewGame.ui &&
                typeof window.HebrewGame.ui.openStoreOverlay === 'function'
            ) {
                window.HebrewGame.ui.openStoreOverlay(storeButton);
            }
        };
    }

    if (
        snapshot &&
        snapshot.ui &&
        snapshot.ui.activeOverlayId === 'store-overlay' &&
        window.HebrewGame &&
        window.HebrewGame.ui &&
        typeof window.HebrewGame.ui.openStoreOverlay === 'function'
    ) {
        setTimeout(function openRestoredOverlay() {
            window.HebrewGame.ui.openStoreOverlay(storeButton || null);
        }, 0);
    }
}

function restoreActiveGameFromSnapshot(snapshot) {
    if (!snapshot) return false;

    const player = hydrateHeroFromSnapshot(snapshot.player);
    const opponents = Array.isArray(snapshot.opponents)
        ? snapshot.opponents.map(hydrateHeroFromSnapshot).filter(Boolean)
        : [];
    if (!player) return false;

    if (
        window.HebrewGame &&
        window.HebrewGame.ui &&
        typeof window.HebrewGame.ui.isStoreOverlayOpen === 'function' &&
        window.HebrewGame.ui.isStoreOverlayOpen() &&
        typeof window.HebrewGame.ui.closeStoreOverlay === 'function'
    ) {
        window.HebrewGame.ui.closeStoreOverlay();
    }

    gameState.player = player;
    gameState.opponents = opponents;
    gameState.currentRound = toFiniteInteger(snapshot.currentRound, 1, 1);
    gameState.maxRounds = toFiniteInteger(snapshot.maxRounds, gameState.maxRounds, 1);
    gameState.roundWords = cloneWordList(snapshot.roundWords);
    gameState.currentWordIndex = toFiniteInteger(
        snapshot.currentWordIndex,
        0,
        0,
        Math.max(0, gameState.roundWords.length - 1)
    );
    gameState.currentWord = cloneWordData(snapshot.currentWord) || cloneWordData(gameState.roundWords[gameState.currentWordIndex]);
    gameState.typedWord = String(snapshot.typedWord || '');
    gameState.typedWords = Array.isArray(snapshot.typedWords)
        ? snapshot.typedWords.map(function (word) { return String(word || ''); })
        : null;
    gameState.activeWord = toFiniteInteger(snapshot.activeWord, 0, 0);
    gameState.activeLetterIndex = toFiniteInteger(snapshot.activeLetterIndex, 0, 0);
    gameState.playerCoins = toFiniteInteger(snapshot.playerCoins, 0, 0);
    gameState.roundCoinsEarned = toFiniteInteger(snapshot.roundCoinsEarned, 0, 0);
    gameState.roundScore = toFiniteInteger(snapshot.roundScore, 0, 0);
    gameState.perfectWords = toFiniteInteger(snapshot.perfectWords, 0, 0);
    gameState.isRoundTransitioning = false;
    gameState.powerUpsActive = clonePowerUpsActiveState(snapshot.powerUpsActive);
    gameState.ui.activeOverlayId = normalizeOverlayId(snapshot.ui && snapshot.ui.activeOverlayId);
    gameState.ui.lastFocusedElement = null;
    gameState.ui.mobileActionBarVisible = snapshot.screenId === 'round-screen';

    if (gameState.currentWord && gameState.currentWord.isPhrase) {
        const expectedWords = Array.isArray(gameState.currentWord.words) ? gameState.currentWord.words : [];
        if (!Array.isArray(gameState.typedWords)) {
            gameState.typedWords = expectedWords.map(function () { return ''; });
        }
        gameState.typedWords = expectedWords.map(function (expectedWord, index) {
            return String(gameState.typedWords[index] || '').slice(0, expectedWord.length);
        });
        gameState.typedWord = '';
        gameState.activeWord = toFiniteInteger(gameState.activeWord, 0, 0, Math.max(0, expectedWords.length - 1));
        const activeWordLength = expectedWords[gameState.activeWord] ? expectedWords[gameState.activeWord].length : 0;
        gameState.activeLetterIndex = toFiniteInteger(gameState.activeLetterIndex, 0, 0, activeWordLength);
    } else {
        gameState.typedWords = null;
        const expectedLength = gameState.currentWord ? String(gameState.currentWord.hebrew || '').length : 0;
        gameState.typedWord = String(gameState.typedWord || '').slice(0, expectedLength);
        gameState.activeWord = 0;
        gameState.activeLetterIndex = toFiniteInteger(gameState.activeLetterIndex, 0, 0, expectedLength);
    }

    applyPowerUpInventorySnapshot(snapshot.powerUpInventory);

    if (
        window.HebrewGame &&
        window.HebrewGame.ui &&
        typeof window.HebrewGame.ui.updateMainBattleTitle === 'function'
    ) {
        window.HebrewGame.ui.updateMainBattleTitle();
    }

    if (snapshot.screenId === 'round-results') {
        restoreRoundResultsFromSnapshot(snapshot);
    } else {
        restoreRoundScreenFromSnapshot();
    }

    if (typeof updatePowerUpButtonVisibility === 'function') {
        updatePowerUpButtonVisibility();
    }

    persistActiveGameSnapshot({ force: true });
    return true;
}

function getResumeOverlayFocusableElements(overlay) {
    if (!overlay) return [];
    return Array.from(overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(function (element) {
            return !element.disabled;
        });
}

function closeResumeOverlay() {
    if (!resumeOverlayState) return;
    if (resumeOverlayState.keydownHandler) {
        document.removeEventListener('keydown', resumeOverlayState.keydownHandler);
    }
    if (resumeOverlayState.overlay && resumeOverlayState.overlay.parentNode) {
        resumeOverlayState.overlay.parentNode.removeChild(resumeOverlayState.overlay);
    }
    resumeOverlayState = null;
}

function updateResumeOverlayCopy() {
    if (!resumeOverlayState || !resumeOverlayState.overlay) return;
    const overlay = resumeOverlayState.overlay;

    overlay.setAttribute('aria-label', t('resume.overlayAria'));
    const title = overlay.querySelector('#resume-title');
    const description = overlay.querySelector('#resume-description');
    const continueButton = overlay.querySelector('#resume-continue');
    const restartButton = overlay.querySelector('#resume-restart');

    if (title) title.textContent = t('resume.title');
    if (description) description.textContent = t('resume.description');
    if (continueButton) {
        continueButton.textContent = t('resume.continue');
        continueButton.setAttribute('aria-label', t('resume.continueAria'));
    }
    if (restartButton) {
        restartButton.textContent = t('resume.restart');
        restartButton.setAttribute('aria-label', t('resume.restartAria'));
    }
}

function showResumeOverlay(snapshot) {
    if (resumeOverlayState || !snapshot) return;

    const overlay = document.createElement('div');
    overlay.id = 'resume-overlay';
    overlay.className = 'game-overlay active recovery-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('data-testid', 'resume-overlay');
    overlay.innerHTML = `
        <div class="overlay-content resume-overlay pixel-frame-steel">
            <h2 id="resume-title" class="pixel-title-plate"></h2>
            <p id="resume-description" class="pixel-chip"></p>
            <div class="resume-actions">
                <button id="resume-continue" class="game-button" type="button"></button>
                <button id="resume-restart" class="game-button" type="button"></button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const keydownHandler = function handleResumeOverlayKeys(event) {
        if (!resumeOverlayState || resumeOverlayState.overlay !== overlay) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            return;
        }
        if (event.key !== 'Tab') return;

        const focusable = getResumeOverlayFocusableElements(overlay);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    resumeOverlayState = {
        overlay: overlay,
        keydownHandler: keydownHandler
    };
    document.addEventListener('keydown', keydownHandler);
    updateResumeOverlayCopy();

    const continueButton = overlay.querySelector('#resume-continue');
    const restartButton = overlay.querySelector('#resume-restart');
    if (continueButton) {
        continueButton.addEventListener('click', function handleContinueClick() {
            closeResumeOverlay();
            pendingActiveGameSnapshot = null;
            const didRestore = restoreActiveGameFromSnapshot(snapshot);
            if (!didRestore) {
                clearActiveGameSnapshot();
                resetGame();
            }
        });
    }

    if (restartButton) {
        restartButton.addEventListener('click', function handleRestartClick() {
            closeResumeOverlay();
            pendingActiveGameSnapshot = null;
            clearActiveGameSnapshot();
            resetGame();
        });
    }

    if (continueButton) {
        continueButton.focus();
    }
}

function maybeShowResumeOverlay() {
    if (!pendingActiveGameSnapshot) return;
    if (!gameState.dataReady) return;
    if (resumeOverlayState) return;
    showResumeOverlay(pendingActiveGameSnapshot);
}

function ensureActiveGameAutosaveLoop() {
    if (activeGameAutosaveIntervalId !== null) return;
    activeGameAutosaveIntervalId = window.setInterval(function autosaveTick() {
        persistActiveGameSnapshot();
    }, ACTIVE_GAME_AUTOSAVE_INTERVAL_MS);
}

function ensurePagehideAutosaveHandler() {
    if (activeGamePagehideBound) return;
    activeGamePagehideBound = true;
    window.addEventListener('pagehide', function onPageHideAutosave() {
        persistActiveGameSnapshot({ force: true });
    });
}

function updateStartButtonState(startButton, dataReady, errorMessage) {
    if (!startButton) return;
    startButton.disabled = !dataReady;
    startButton.textContent = dataReady
        ? t('start.startButton')
        : (errorMessage ? t('start.wordsLoadFailButton') : t('start.loadingWords'));
    startButton.removeAttribute('aria-busy');
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
    pendingActiveGameSnapshot = loadActiveGameSnapshot();
    ensureActiveGameAutosaveLoop();
    ensurePagehideAutosaveHandler();
    
    // Set up DOM event listeners
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', startGame);
        startButton.disabled = true;
        startButton.textContent = t('start.loadingWords');
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

    const playHebrewAudioButton = document.getElementById('play-hebrew-audio');
    if (playHebrewAudioButton) {
        playHebrewAudioButton.addEventListener('click', function handlePlayHebrewAudioClick() {
            if (
                window.HebrewGame &&
                window.HebrewGame.tts &&
                typeof window.HebrewGame.tts.speakCurrentPrompt === 'function'
            ) {
                window.HebrewGame.tts.speakCurrentPrompt();
            }
        });
    }

    const autoReadToggleButton = document.getElementById('toggle-auto-read');
    if (autoReadToggleButton) {
        autoReadToggleButton.addEventListener('click', function handleAutoReadToggleClick() {
            if (
                window.HebrewGame &&
                window.HebrewGame.tts &&
                typeof window.HebrewGame.tts.isAutoReadEnabled === 'function' &&
                typeof window.HebrewGame.tts.setAutoReadEnabled === 'function'
            ) {
                const nextValue = !window.HebrewGame.tts.isAutoReadEnabled();
                window.HebrewGame.tts.setAutoReadEnabled(nextValue);
            }
        });
    }

    if (
        window.HebrewGame &&
        window.HebrewGame.tts &&
        typeof window.HebrewGame.tts.isAutoReadEnabled === 'function' &&
        typeof window.HebrewGame.tts.setAutoReadEnabled === 'function'
    ) {
        window.HebrewGame.tts.setAutoReadEnabled(window.HebrewGame.tts.isAutoReadEnabled());
    }

    window.addEventListener('hebrewGame:dataReady', function onDataReady(event) {
        gameState.dataReady = !!(event.detail && event.detail.ready);
        const errorMessage = event.detail && event.detail.error;
        latestDataLoadErrorMessage = errorMessage || null;
        if (!gameState.dataReady && errorMessage) {
            toast({
                title: t('start.wordsLoadFailTitle'),
                description: errorMessage,
                variant: "destructive"
            });
        }
        updateStartButtonState(startButton, gameState.dataReady, errorMessage);

        if (gameState.dataReady) {
            announceToScreenReader(t('start.wordsLoadedAnnounce'));
            maybeShowResumeOverlay();
        }
    });

    window.addEventListener('hebrewGame:languageChanged', function onLanguageChanged() {
        updateStartButtonState(startButton, gameState.dataReady, latestDataLoadErrorMessage);
        if (
            window.HebrewGame &&
            window.HebrewGame.ui &&
            typeof window.HebrewGame.ui.updateMainBattleTitle === 'function'
        ) {
            window.HebrewGame.ui.updateMainBattleTitle();
        }
        displayHighScores();
        updateResumeOverlayCopy();
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
    if (window.HebrewGame && window.HebrewGame.ui && typeof window.HebrewGame.ui.updateMainBattleTitle === 'function') {
        window.HebrewGame.ui.updateMainBattleTitle();
    }
    
    // Debug info
    logDebug('Game initialized. Press Start to begin.');
    maybeShowResumeOverlay();
    
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
        if (raw !== null) {
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

    highScores = ensureSeededHighScores(parsed);
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

    const heroesApi = getHighScoreHeroesApi();

    // Clear current content
    highScoresList.innerHTML = '';

    if (highScores.length > 0) {
        // Create enhanced high score items
        highScores.slice(0, 5).forEach((score, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'high-score-item';
            scoreItem.classList.add(`leaderboard-rank-${index + 1}`);
            scoreItem.dataset.rank = String(index + 1);
            if (index < 3) {
                scoreItem.classList.add('leaderboard-top-three');
            }

            const scoreContent = document.createElement('div');
            scoreContent.className = 'high-score-content pixel-chip';

            const scoreName = document.createElement('span');
            scoreName.className = 'score-name';

            const displayName = String(score.name || '');
            const displayAvatar = normalizeHighScoreAvatar(score.avatar, displayName);
            if (heroesApi && typeof heroesApi.createHeroNameMarkup === 'function') {
                scoreName.innerHTML = heroesApi.createHeroNameMarkup(
                    {
                        name: displayName,
                        avatar: displayAvatar
                    },
                    {
                        nameClass: 'hero-name-text',
                        avatarClass: 'hero-avatar-high-score'
                    }
                );
            } else {
                scoreName.textContent = displayName;
            }

            const scoreValue = document.createElement('span');
            scoreValue.className = 'score-value pixel-chip';
            scoreValue.textContent = String(score.score);

            scoreContent.appendChild(scoreName);
            scoreContent.appendChild(scoreValue);
            scoreItem.appendChild(scoreContent);
            highScoresList.appendChild(scoreItem);
        });
    } else {
        // No high scores yet
        const noScores = document.createElement('div');
        noScores.className = 'high-score-empty pixel-chip';
        noScores.textContent = t('highscores.empty');
        highScoresList.appendChild(noScores);
    }
}

// Start the game
function startGame() {
    if (!gameState.dataReady) {
        toast({
            title: t('start.loadingToastTitle'),
            description: t('start.loadingToastDesc'),
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
    
    closeResumeOverlay();
    pendingActiveGameSnapshot = null;
    clearActiveGameSnapshot();

    const uiApi = getStartScreenApi();
    const selectedPlayerAvatar = uiApi && typeof uiApi.getSelectedPlayerAvatar === 'function'
        ? uiApi.getSelectedPlayerAvatar()
        : null;

    // Initialize game state - ENSURE ALL DEFAULTS ARE PROPERLY SET
    gameState.player = new Hero(playerName, 50, null, null, false, selectedPlayerAvatar); // Player starts with average skill
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
        secondChanceRoundUsedThisWord: false,
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
    
    // Display player name and avatar in round header.
    renderRoundHeaderPlayerIdentity();
    document.getElementById('current-score').textContent = '0';
    document.getElementById('coin-count').textContent = '0';
    
    // Start the first round
    startNextRound();
    
    // Check if power-up button should be visible
    updatePowerUpButtonVisibility();
    persistActiveGameSnapshot({ force: true });
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

    // Normalize viewport position so transitions don't inherit stale deep scroll offsets.
    if (typeof window.scrollTo === 'function') {
        window.scrollTo(0, 0);
    }
}

// Reset the game to play again
function resetGame() {
    closeResumeOverlay();
    pendingActiveGameSnapshot = null;
    clearActiveGameSnapshot();

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
        secondChanceRoundUsedThisWord: false,
        disabledLetters: [],
        originalWord: null,
        removedLetters: 0,
        easierWordCurrentLevel: 0,
        revealedLetters: []
    };
    
    // Reset editing state
    gameState.typedWord = "";
    gameState.typedWords = null;
    gameState.activeWord = 0;
    gameState.activeLetterIndex = 0;
    
    // Show the start screen
    showScreen('start-screen');
    if (window.HebrewGame && window.HebrewGame.ui && typeof window.HebrewGame.ui.updateMainBattleTitle === 'function') {
        window.HebrewGame.ui.updateMainBattleTitle();
    }
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
window.HebrewGame.core.clearAutosaveSnapshot = clearActiveGameSnapshot;
window.HebrewGame.core.persistAutosaveSnapshot = function persistAutosaveSnapshotCompat() {
    return persistActiveGameSnapshot({ force: true });
};
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
window.HebrewGame.debug.clearAutosaveSnapshot = clearActiveGameSnapshot;

window.showScreen = showScreen;
window.startGame = function startGameCompat() {
    return window.HebrewGame.core.startGame.apply(null, arguments);
};

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initializeGame);
