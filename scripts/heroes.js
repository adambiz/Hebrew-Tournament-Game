/**
 * Heroes and opponents for the game.
 */

// Version of opponents data - increment this when changing opponent names/avatar logic.
const OPPONENTS_VERSION = 4;
const AVATAR_ASSET_DIR = 'assets/images/3x';
const AVATAR_FILE_PREFIX = 'portrait-with-border';
const AVATAR_MIN_ID = 1;
const AVATAR_MAX_ID = 200;
const AVATAR_FALLBACK_ID = 1;

const femaleNameTokens = new Set([
    'mia', 'ava', 'zoe', 'noa', 'nora', 'tali', 'mila', 'ella', 'aria', 'luna', 'neta', 'romi', 'shira', 'maya',
    'sasha', 'leia', 'nova', 'ruby', 'harper', 'poppy', 'juno', 'jules'
]);
const maleNameTokens = new Set([
    'leo', 'max', 'ben', 'eli', 'kai', 'omer', 'rafi', 'yoni', 'noam', 'itai', 'matan', 'ori', 'yuval', 'gabi',
    'niv', 'tomer', 'yarden', 'liam', 'milo', 'jasper', 'finn', 'dex', 'ari', 'sami', 'jax'
]);

// Fixed list of elite opponents with consistent names and high skill levels.
const eliteOpponents = [
    { name: "EnderDragon99 Kai", skillLevel: 99, consistency: 0.98, perfectWordCapability: 0.99 },
    { name: "VaderVanquisher Max", skillLevel: 98, consistency: 0.98, perfectWordCapability: 0.98 },
    { name: "PikaOverlord Ava", skillLevel: 97, consistency: 0.97, perfectWordCapability: 0.97 },
    { name: "IronBlockPro Ben", skillLevel: 96, consistency: 0.96, perfectWordCapability: 0.96 },
    { name: "MandoMaster Mia", skillLevel: 95, consistency: 0.95, perfectWordCapability: 0.95 }
];

// Fixed list of strong opponents with consistent names.
const strongOpponents = [
    { name: "SpiderNinja Leo", skillLevel: 89, consistency: 0.85, perfectWordCapability: 0.85 },
    { name: "CaptainCreeper Mia", skillLevel: 88, consistency: 0.85, perfectWordCapability: 0.84 },
    { name: "JediSpark Max", skillLevel: 87, consistency: 0.80, perfectWordCapability: 0.83 },
    { name: "ThorPikachu Ben", skillLevel: 86, consistency: 0.80, perfectWordCapability: 0.82 },
    { name: "DiamondDash Ava", skillLevel: 85, consistency: 0.80, perfectWordCapability: 0.81 },
    { name: "WookieeWhirl Noa", skillLevel: 84, consistency: 0.75, perfectWordCapability: 0.80 },
    { name: "CharmanderAce Eli", skillLevel: 83, consistency: 0.75, perfectWordCapability: 0.79 },
    { name: "RocketRider Zoe", skillLevel: 82, consistency: 0.75, perfectWordCapability: 0.78 },
    { name: "GregBoss Maya", skillLevel: 81, consistency: 0.70, perfectWordCapability: 0.77 },
    { name: "BlockBuilder Kai", skillLevel: 80, consistency: 0.70, perfectWordCapability: 0.76 }
];

// List of potential regular hero names.
const heroNames = [
    "RedstoneRex", "CreeperNova", "DiamondDani", "EnderMia", "NetherNinja", "BlockyBen", "PandaBuilder", "PixelPiper", "ZombieZap", "CraftyKai",
    "MiniMando", "BabyYodaFan", "JediJax", "SaberSasha", "WookieeWiz", "XWingMax", "AstroLeia", "DroidDex", "FalconFinn", "PadawanPip",
    "PikaFlash", "CharmanderKai", "BulbaBuddy", "SquirtleSplash", "EeveeSpark", "SnorlaxSnack", "MewMischief", "PokeNoa", "ZapdosZoom", "GengarGiggle",
    "SpiderZoom", "IronAri", "HulkSmashKid", "ThorBoom", "CaptainComet", "PantherPace", "RocketRico", "GrootGrowl", "WidowWhiz", "HawkeyeHex",
    "GregTheGreat", "RowleyRocket", "CheeseTouchChamp", "DiaryDude", "ZooWeeMia", "MannyMode", "HeffleyHero", "AwesomeAlley", "LodedDiperFan", "ComicKid",
    "Leo", "Maya", "Noa", "Liam", "Ava", "Eli", "Nora", "Omer", "Zoe", "Tali",
    "Rafi", "Mila", "Yoni", "Ella", "Aria", "Noam", "Luna", "Itai", "Matan", "Sami",
    "Ori", "Neta", "Romi", "Yuval", "Dani", "Gabi", "Niv", "Tomer", "Shira", "Yarden",
    "Skye", "River", "Jasper", "Ruby", "Sage", "Milo", "Nova", "Harper", "Poppy", "Juno",
    "TurboTurtle", "NinjaNoodle", "LaserLlama", "CookieWizard", "RainbowRacer", "MegaMango", "BouncyBison", "FrostyFox", "ThunderToes", "BubbleBlitz"
];

const avatarCatalog = createAvatarCatalog();

function normalizeAvatarId(candidateId) {
    const parsed = Number(candidateId);
    if (!Number.isFinite(parsed)) return null;
    const id = Math.floor(parsed);
    if (id < AVATAR_MIN_ID || id > AVATAR_MAX_ID) return null;
    return id;
}

function buildAvatarPathFromId(candidateId) {
    const id = normalizeAvatarId(candidateId);
    const safeId = id === null ? AVATAR_FALLBACK_ID : id;
    return `${AVATAR_ASSET_DIR}/${AVATAR_FILE_PREFIX}${safeId}.png`;
}

function extractAvatarIdFromPath(avatarPath) {
    if (typeof avatarPath !== 'string') return null;
    const match = avatarPath.match(/portrait-with-border(\d+)\.png$/i);
    if (!match) return null;
    return normalizeAvatarId(match[1]);
}

function normalizeAvatarPath(avatarPath) {
    const id = extractAvatarIdFromPath(avatarPath);
    if (id === null) return null;
    return buildAvatarPathFromId(id);
}

function createAvatarCatalog() {
    return Array.from({ length: AVATAR_MAX_ID - AVATAR_MIN_ID + 1 }, function (_, index) {
        const id = index + AVATAR_MIN_ID;
        return {
            id: id,
            path: buildAvatarPathFromId(id)
        };
    });
}

function getAvatarCatalog() {
    return avatarCatalog.slice();
}

function getRandomAvatarId() {
    return Math.floor(Math.random() * AVATAR_MAX_ID) + AVATAR_MIN_ID;
}

function getRandomAvatarPath() {
    return buildAvatarPathFromId(getRandomAvatarId());
}

function getLastNameToken(name) {
    const normalizedName = String(name || '').trim();
    if (!normalizedName) return '';
    const segments = normalizedName.split(/\s+/);
    return segments[segments.length - 1].toLowerCase();
}

function guessNameGender(name) {
    const token = getLastNameToken(name);
    if (!token) return 'neutral';
    if (femaleNameTokens.has(token)) return 'female';
    if (maleNameTokens.has(token)) return 'male';
    return 'neutral';
}

function createAvatarIdPool() {
    const allAvatarIds = Array.from({ length: AVATAR_MAX_ID - AVATAR_MIN_ID + 1 }, function (_, index) {
        return index + AVATAR_MIN_ID;
    });
    return shuffleHeroArray(allAvatarIds);
}

function takeAvatarIdFromPool(avatarPool, gender) {
    if (!Array.isArray(avatarPool) || avatarPool.length === 0) {
        return getRandomAvatarId();
    }

    if (gender === 'neutral') {
        return avatarPool.pop();
    }

    // Lightweight pairing attempt: female picks from even IDs first, male from odd IDs first.
    const prefersEven = gender === 'female';
    for (let i = avatarPool.length - 1; i >= 0; i--) {
        const candidateId = avatarPool[i];
        const isEven = candidateId % 2 === 0;
        if ((prefersEven && isEven) || (!prefersEven && !isEven)) {
            avatarPool.splice(i, 1);
            return candidateId;
        }
    }

    return avatarPool.pop();
}

function takeAvatarPathForName(name, avatarPool) {
    const gender = guessNameGender(name);
    return buildAvatarPathFromId(takeAvatarIdFromPool(avatarPool, gender));
}

function getHeroAvatarPath(hero) {
    const normalized = normalizeAvatarPath(hero && hero.avatar);
    return normalized || getRandomAvatarPath();
}

function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

function createHeroAvatarMarkup(hero, options = {}) {
    const className = options.className ? ` ${escapeHtml(options.className)}` : '';
    const avatarPath = normalizeAvatarPath(options.avatarPath) || getHeroAvatarPath(hero);
    const altText = typeof options.alt === 'string'
        ? options.alt
        : t('hero.avatarAlt', {
            name: hero && hero.name ? hero.name : t('hero.avatarFallbackName')
        });
    const isDecorative = !!options.decorative;
    const altAttribute = isDecorative ? 'alt="" aria-hidden="true"' : `alt="${escapeHtml(altText)}"`;
    const loadingMode = options.eager ? 'eager' : 'lazy';

    return `<img class="hero-avatar${className}" src="${escapeHtml(avatarPath)}" ${altAttribute} loading="${loadingMode}" decoding="async">`;
}

function createHeroNameMarkup(hero, options = {}) {
    const heroName = hero && hero.name ? String(hero.name) : '';
    const playerLabel = typeof options.playerLabel === 'string' && options.playerLabel.trim()
        ? options.playerLabel.trim()
        : t('label.you');
    const nameSuffix = options.playerSuffix ? ` (${playerLabel})` : '';
    const nameClass = options.nameClass || 'hero-name-text';
    const avatarClass = options.avatarClass || 'hero-avatar-inline';
    const avatarMarkup = createHeroAvatarMarkup(hero, {
        className: avatarClass,
        decorative: true
    });

    return `<span class="hero-name-with-avatar">${avatarMarkup}<span class="${escapeHtml(nameClass)}">${escapeHtml(heroName + nameSuffix)}</span></span>`;
}

// Check if opponents version has changed and clear if needed.
(function checkOpponentsVersion() {
    try {
        const savedVersion = localStorage.getItem('hebrewGame_opponentsVersion');

        // If version doesn't match, clear the saved opponents.
        if (savedVersion !== OPPONENTS_VERSION.toString()) {
            localStorage.removeItem('hebrewGame_eliteOpponents');
            localStorage.removeItem('hebrewGame_strongOpponents');
            localStorage.setItem('hebrewGame_opponentsVersion', OPPONENTS_VERSION.toString());
            window.logDebug('Cleared opponent data due to version update');
        }
    } catch (e) {
        window.logDebug('Could not check opponents version');
    }
})();

// Save elite opponents to local storage for consistency across games.
function saveEliteOpponents() {
    try {
        localStorage.setItem('hebrewGame_eliteOpponents', JSON.stringify(eliteOpponents));
        localStorage.setItem('hebrewGame_strongOpponents', JSON.stringify(strongOpponents));
        localStorage.setItem('hebrewGame_opponentsVersion', OPPONENTS_VERSION.toString());
    } catch (e) {
        window.logDebug('Could not save elite opponents to localStorage');
    }
}

// Try to load elite opponents from local storage to maintain consistency.
function loadEliteOpponents() {
    try {
        const savedElite = localStorage.getItem('hebrewGame_eliteOpponents');

        if (savedElite) {
            const parsed = JSON.parse(savedElite);
            // Check if valid data format.
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
                return parsed;
            }
        }
    } catch (e) {
        window.logDebug('Could not load elite opponents from localStorage');
    }
    return eliteOpponents;
}

function loadStrongOpponents() {
    try {
        const saved = localStorage.getItem('hebrewGame_strongOpponents');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
                return parsed;
            }
        }
    } catch (e) {
        window.logDebug('Could not load strong opponents from localStorage');
    }
    return strongOpponents;
}

// Hero class to represent both the player and AI opponents.
class Hero {
    constructor(name, skillLevel = null, consistency = null, perfectWordCapability = null, isElite = false, avatar = null) {
        this.name = name;
        // Skill level between 10 and 100 if not provided.
        this.skillLevel = skillLevel !== null ? skillLevel : Math.floor(Math.random() * 91) + 10;
        this.score = 0;
        this.roundScores = []; // Track scores for each round.
        this.eliminated = false;
        this.id = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + '_' + Math.random().toString(36).substring(2, 6);
        this.avatar = normalizeAvatarPath(avatar) || getRandomAvatarPath();
        // Consistency determines how stable their performance is.
        this.consistency = consistency !== null ? consistency : Math.min(0.7, 0.3 + (this.skillLevel / 100));
        // Perfect word capability - higher skill means higher chance of getting perfect words.
        this.perfectWordCapability = perfectWordCapability !== null ? perfectWordCapability : Math.pow(this.skillLevel / 100, 1.5);
        // Elite opponents almost never make simple mistakes in early rounds.
        this.errorThreshold = this.skillLevel >= 90 ? 0.95 : this.skillLevel / 100;
        // Flag for elite status.
        this.isElite = isElite;

        // Performance across all rounds (not just early rounds for elite).
        this.performanceBonus = this.isElite ? 0.99 : (this.skillLevel >= 90 ? 0.90 : null);
    }

    // Simulate a round of play for an AI opponent.
    simulateRound(roundNumber, wordCount = 5) {
        // Higher round number means tougher words.
        // Higher skill level means better chance of getting words right.

        let roundScore = 0;
        let perfectWords = 0;

        for (let i = 0; i < wordCount; i++) {
            // Calculate word length based on round.
            const wordLength = roundNumber + 1; // approximate letters in word for this round

            // Calculate how many letters the AI gets correct based on skill.
            const correctLetterProbability = this.skillLevel / 100;

            // Simulate typing the word letter by letter.
            let correctLettersTyped = 0;
            for (let j = 0; j < wordLength; j++) {
                // For each letter, determine if the AI gets it right.
                if (Math.random() < correctLetterProbability) {
                    correctLettersTyped++;
                }
            }

            // Make sure correctLettersTyped doesn't exceed word length.
            correctLettersTyped = Math.min(correctLettersTyped, wordLength);

            // Calculate points - 1 point per correct letter.
            const wordScore = correctLettersTyped;
            roundScore += wordScore;

            // Check if the word was perfect.
            if (correctLettersTyped === wordLength) {
                perfectWords++;
            }
        }

        // Store and return the round result.
        this.roundScores.push(roundScore);
        this.score += roundScore;

        return {
            score: roundScore,
            perfectWords: perfectWords
        };
    }
}

// Generate a list of AI opponents with persistent elite opponents.
function generateOpponents(count = 95) {
    if (count < 15) count = 15; // Ensure minimum opponents.
    const opponents = [];
    const avatarPool = createAvatarIdPool();

    // Load elite opponents with consistent names to maintain them across games.
    const loadedEliteOpponents = loadEliteOpponents();
    const loadedStrongOpponents = loadStrongOpponents();

    // Create the elite opponents first - these are the "bosses" the player needs to beat.
    loadedEliteOpponents.forEach(function (elite) {
        const hero = new Hero(
            elite.name,
            elite.skillLevel,
            elite.consistency,
            elite.perfectWordCapability,
            true,
            takeAvatarPathForName(elite.name, avatarPool)
        );

        // Elite opponents get nearly perfect performance in ALL rounds.
        hero.performanceBonus = 0.99; // They get 99% of possible points.
        hero.firstRoundBonus = 0.99; // They get 99% of possible points in rounds 1-2.

        opponents.push(hero);
    });

    // Create strong opponents.
    loadedStrongOpponents.forEach(function (strong) {
        const hero = new Hero(
            strong.name,
            strong.skillLevel,
            strong.consistency,
            strong.perfectWordCapability,
            false,
            takeAvatarPathForName(strong.name, avatarPool)
        );

        // Strong opponents also get a bonus, but less than elites.
        hero.firstRoundBonus = 0.90; // They get 90% of possible points in rounds 1-2.

        opponents.push(hero);
    });

    // Create a group of good (but not elite) opponents for round 1.
    const goodOpponentsCount = 15;
    const goodOpponentHandles = [
        "TurboTNT", "CreeperSprinter", "PixelPanda", "LightningLlama", "CheeseTouchKing",
        "SaberSkater", "PokeRacer", "WebShooter", "DiamondDasher", "CookieCommander",
        "StarJump", "NoScope", "ZombieZapper", "RainbowRider", "MegaMuffin"
    ];
    const femaleNames = ["Mia", "Ava", "Noa", "Zoe", "Maya", "Nora", "Shira", "Romi"];
    const maleNames = ["Ben", "Max", "Kai", "Eli", "Omer", "Rafi", "Tomer", "Ori"];

    for (let i = 0; i < goodOpponentsCount; i++) {
        const handle = goodOpponentHandles[i % goodOpponentHandles.length];
        const usesFemaleName = i % 2 === 0;
        const firstName = usesFemaleName
            ? femaleNames[i % femaleNames.length]
            : maleNames[i % maleNames.length];
        const name = `${handle} ${firstName}`;
        // Skill level between 70-85.
        const skillLevel = 70 + Math.floor(Math.random() * 16);
        const hero = new Hero(name, skillLevel, 0.7, 0.6, false, takeAvatarPathForName(name, avatarPool));

        // Give them a bonus in early rounds too.
        hero.firstRoundBonus = 0.8;

        opponents.push(hero);
    }

    // Get shuffled names to assign to regular opponents.
    const shuffledNames = shuffleHeroArray(heroNames.slice());

    // Create regular opponents with a bell curve distribution of skills.
    const regularCount = count - loadedEliteOpponents.length - loadedStrongOpponents.length - goodOpponentsCount;
    for (let i = 0; i < regularCount; i++) {
        const nameIndex = i % shuffledNames.length;

        // Use a bell curve distribution for more realistic skills (centered around 50).
        const skillLevel = Math.floor(bellCurveRandom(10, 70, 50, 15));
        const name = shuffledNames[nameIndex];
        const hero = new Hero(name, skillLevel, null, null, false, takeAvatarPathForName(name, avatarPool));

        // Regular opponents don't get bonuses.
        opponents.push(hero);
    }

    // Save elite opponents for future games.
    saveEliteOpponents();

    return opponents;
}

// Bell curve random number generator for more realistic skill distribution.
function bellCurveRandom(min, max, mean, stdDev) {
    // Box-Muller transform for normal distribution.
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    // Transform to our desired mean and standard deviation.
    const result = z * stdDev + mean;

    // Clamp between min and max.
    return Math.max(min, Math.min(max, result));
}

// Eliminate the bottom half of opponents after a round.
function eliminateOpponents(player, opponents, roundNumber) {
    // Combine player and opponents for ranking.
    const allContestants = [player, ...opponents].filter(h => !h.eliminated);

    // Sort by total score (higher is better).
    allContestants.sort((a, b) => b.score - a.score);

    // Calculate how many to eliminate (half of all contestants).
    const eliminateCount = Math.floor(allContestants.length / 2);

    // Get the cutoff score (score of the last non-eliminated contestant).
    const cutoffScore = allContestants[allContestants.length - eliminateCount - 1].score;

    // First pass - mark contestants for elimination based on score.
    for (let i = allContestants.length - 1; i >= allContestants.length - eliminateCount; i--) {
        allContestants[i].eliminated = true;
    }

    // Special protection for player if tied at cutoff.
    if (player.score === cutoffScore && player.eliminated) {
        // Find another opponent to eliminate instead.
        player.eliminated = false;

        // Find the highest-ranked opponent who isn't eliminated yet but has the same score.
        for (let i = allContestants.length - eliminateCount - 1; i >= 0; i--) {
            const contestant = allContestants[i];
            if (contestant !== player && contestant.score === cutoffScore && !contestant.eliminated) {
                contestant.eliminated = true;
                break;
            }
        }
    }

    // Return the sorted list for display purposes - correctly sorted by score.
    return allContestants;
}

// Get top N heroes by total score.
function getTopHeroes(player, opponents, count = 5) {
    const allHeroes = [player, ...opponents].filter(h => !h.eliminated);

    // Sort by total score (higher is better).
    allHeroes.sort((a, b) => b.score - a.score);

    return allHeroes.slice(0, count);
}

// Helper function to shuffle an array (shared with wordLists.js).
function shuffleHeroArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

window.HebrewGame = window.HebrewGame || {};
window.HebrewGame.heroes = window.HebrewGame.heroes || {};
window.HebrewGame.heroes.getAvatarCatalog = getAvatarCatalog;
window.HebrewGame.heroes.getRandomAvatarPath = getRandomAvatarPath;
window.HebrewGame.heroes.normalizeAvatarPath = normalizeAvatarPath;
window.HebrewGame.heroes.getHeroAvatarPath = getHeroAvatarPath;
window.HebrewGame.heroes.createHeroAvatarMarkup = createHeroAvatarMarkup;
window.HebrewGame.heroes.createHeroNameMarkup = createHeroNameMarkup;
window.HebrewGame.heroes.escapeHtml = escapeHtml;
