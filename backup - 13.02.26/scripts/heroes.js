/**
 * Heroes and opponents for the game
 */

// Version of opponents data - increment this when changing opponent names
const OPPONENTS_VERSION = 1;

// Fixed list of elite opponents with consistent names and high skill levels
const eliteOpponents = [
    { name: "Star", skillLevel: 99, consistency: 0.98, perfectWordCapability: 0.99 },
    { name: "Mack", skillLevel: 98, consistency: 0.98, perfectWordCapability: 0.98 },
    { name: "Dog Kid", skillLevel: 97, consistency: 0.97, perfectWordCapability: 0.97 },
    { name: "Max", skillLevel: 96, consistency: 0.96, perfectWordCapability: 0.96 },
    { name: "Kai", skillLevel: 95, consistency: 0.95, perfectWordCapability: 0.95 }
];

// Fixed list of strong opponents with consistent names
const strongOpponents = [
    { name: "Expert Ethan", skillLevel: 89, consistency: 0.85, perfectWordCapability: 0.85 },
    { name: "Scholar Sarah", skillLevel: 88, consistency: 0.85, perfectWordCapability: 0.84 },
    { name: "Professor David", skillLevel: 87, consistency: 0.80, perfectWordCapability: 0.83 },
    { name: "Genius Rebecca", skillLevel: 86, consistency: 0.80, perfectWordCapability: 0.82 },
    { name: "Language Guru Daniel", skillLevel: 85, consistency: 0.80, perfectWordCapability: 0.81 },
    { name: "Amazing Rachel", skillLevel: 84, consistency: 0.75, perfectWordCapability: 0.80 },
    { name: "Word Master Aaron", skillLevel: 83, consistency: 0.75, perfectWordCapability: 0.79 },
    { name: "Swift Hannah", skillLevel: 82, consistency: 0.75, perfectWordCapability: 0.78 },
    { name: "Brilliant Joseph", skillLevel: 81, consistency: 0.70, perfectWordCapability: 0.77 },
    { name: "Skilled Miriam", skillLevel: 80, consistency: 0.70, perfectWordCapability: 0.76 }
];

// List of potential regular hero names
const heroNames = [
    "Aaron", "Bella", "Caleb", "Diana", "Ethan", "Fiona", "Gabriel", "Hannah", "Isaac", "Julia",
    "Kai", "Luna", "Max", "Nina", "Oscar", "Penny", "Quinn", "Ruby", "Sam", "Talia",
    "Uri", "Violet", "Will", "Xena", "Yael", "Zoe", "Adam", "Beth", "Cyrus", "Dora",
    "Elijah", "Flora", "Gideon", "Hope", "Ian", "Joy", "Kevin", "Lily", "Milo", "Naomi",
    "Owen", "Piper", "Quincy", "Rose", "Simon", "Tessa", "Ulysses", "Vera", "Wyatt", "Xander",
    "Yasmin", "Zach", "Aria", "Ben", "Clara", "Daniel", "Emma", "Felix", "Grace", "Henry",
    "Iris", "Jacob", "Kylie", "Leo", "Maya", "Noah", "Olivia", "Peter", "Quinn", "Ryan",
    "Sophie", "Tyler", "Uma", "Victor", "Wendy", "Xavier", "Yvonne", "Zane", "Alex", "Bianca",
    "Cody", "Daisy", "Eli", "Freya", "Greg", "Harper", "Ivan", "Jasmine", "Kyle", "Liam",
    "Mia", "Nate", "Olive", "Paul", "Queenie", "Rowan", "Sarah", "Tim", "Ursula", "Vincent",
    "Whitney", "Xavier", "Yara", "Zack"
];

// Check if opponents version has changed and clear if needed
(function checkOpponentsVersion() {
    try {
        const savedVersion = localStorage.getItem('hebrewGame_opponentsVersion');
        
        // If version doesn't match, clear the saved opponents
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

// Save elite opponents to local storage for consistency across games
function saveEliteOpponents() {
    try {
        localStorage.setItem('hebrewGame_eliteOpponents', JSON.stringify(eliteOpponents));
        localStorage.setItem('hebrewGame_strongOpponents', JSON.stringify(strongOpponents));
        localStorage.setItem('hebrewGame_opponentsVersion', OPPONENTS_VERSION.toString());
    } catch (e) {
        window.logDebug('Could not save elite opponents to localStorage');
    }
}

// Try to load elite opponents from local storage to maintain consistency
function loadEliteOpponents() {
    try {
        const savedElite = localStorage.getItem('hebrewGame_eliteOpponents');
        
        if (savedElite) {
            const parsed = JSON.parse(savedElite);
            // Check if valid data format
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

// Hero class to represent both the player and AI opponents
class Hero {
    constructor(name, skillLevel = null, consistency = null, perfectWordCapability = null, isElite = false) {
        this.name = name;
        // Skill level between 10 and 100 if not provided
        this.skillLevel = skillLevel !== null ? skillLevel : Math.floor(Math.random() * 91) + 10;
        this.score = 0;
        this.roundScores = []; // Track scores for each round
        this.eliminated = false;
        this.id = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + '_' + Math.random().toString(36).substring(2, 6);
        // Consistency determines how stable their performance is
        this.consistency = consistency !== null ? consistency : Math.min(0.7, 0.3 + (this.skillLevel / 100));
        // Perfect word capability - higher skill means higher chance of getting perfect words
        this.perfectWordCapability = perfectWordCapability !== null ? perfectWordCapability : Math.pow(this.skillLevel / 100, 1.5);
        // Elite opponents almost never make simple mistakes in early rounds
        this.errorThreshold = this.skillLevel >= 90 ? 0.95 : this.skillLevel / 100;
        // Flag for elite status
        this.isElite = isElite;
        
        // Performance across all rounds (not just early rounds for elite)
        this.performanceBonus = this.isElite ? 0.99 : (this.skillLevel >= 90 ? 0.90 : null);
    }
    
    // Simulate a round of play for an AI opponent
    simulateRound(roundNumber, wordCount = 5) {
        // Higher round number means tougher words
        // Higher skill level means better chance of getting words right
        
        let roundScore = 0;
        let perfectWords = 0;
        
        for (let i = 0; i < wordCount; i++) {
            // Calculate word length based on round
            const wordLength = roundNumber + 1; // approximate letters in word for this round
            
            // Calculate how many letters the AI gets correct based on skill
            // The higher the skill, the more letters they're likely to get right
            const correctLetterProbability = this.skillLevel / 100;
            
            // Simulate typing the word letter by letter
            let correctLettersTyped = 0;
            for (let j = 0; j < wordLength; j++) {
                // For each letter, determine if the AI gets it right
                if (Math.random() < correctLetterProbability) {
                    correctLettersTyped++;
                }
            }
            
            // Make sure correctLettersTyped doesn't exceed word length
            correctLettersTyped = Math.min(correctLettersTyped, wordLength);
            
            // Calculate points - 1 point per correct letter
            const wordScore = correctLettersTyped;
            roundScore += wordScore;
            
            // Check if the word was perfect
            if (correctLettersTyped === wordLength) {
                perfectWords++;
            }
        }
        
        // Store and return the round result
        this.roundScores.push(roundScore);
        this.score += roundScore;
        
        return {
            score: roundScore,
            perfectWords: perfectWords
        };
    }
}

// Generate a list of AI opponents with persistent elite opponents
function generateOpponents(count = 95) {
    if (count < 15) count = 15; // Ensure minimum opponents
    const opponents = [];
    
    // Load elite opponents with consistent names to maintain them across games
    const loadedEliteOpponents = loadEliteOpponents();
    const loadedStrongOpponents = loadStrongOpponents();
    
    // Create the elite opponents first - these are the "bosses" the player needs to beat
    loadedEliteOpponents.forEach(elite => {
        const hero = new Hero(
            elite.name, 
            elite.skillLevel, 
            elite.consistency, 
            elite.perfectWordCapability,
            true
        );
        
        // Elite opponents get nearly perfect performance in ALL rounds
        hero.performanceBonus = 0.99; // They get 99% of possible points
        hero.firstRoundBonus = 0.99; // They get 99% of possible points in rounds 1-2
        
        opponents.push(hero);
    });
    
    // Create strong opponents
    loadedStrongOpponents.forEach(strong => {
        const hero = new Hero(strong.name, strong.skillLevel, strong.consistency, strong.perfectWordCapability);
        
        // Strong opponents also get a bonus, but less than elites
        hero.firstRoundBonus = 0.90; // They get 90% of possible points in rounds 1-2
        
        opponents.push(hero);
    });
    
    // Create a group of good (but not elite) opponents for round 1
    const goodOpponentsCount = 15;
    for (let i = 0; i < goodOpponentsCount; i++) {
        const name = `Strong Player ${i+1}`;
        // Skill level between 70-85
        const skillLevel = 70 + Math.floor(Math.random() * 16);
        const hero = new Hero(name, skillLevel, 0.7, 0.6);
        
        // Give them a bonus in early rounds too
        hero.firstRoundBonus = 0.8;
        
        opponents.push(hero);
    }
    
    // Get shuffled names to assign to regular opponents
    let shuffledNames = shuffleHeroArray([...heroNames]);
    
    // Create regular opponents with a bell curve distribution of skills
    const regularCount = count - loadedEliteOpponents.length - loadedStrongOpponents.length - goodOpponentsCount;
    for (let i = 0; i < regularCount; i++) {
        const nameIndex = i % shuffledNames.length;
        
        // Use a bell curve distribution for more realistic skills (centered around 50)
        const skillLevel = Math.floor(bellCurveRandom(10, 70, 50, 15));
        
        const hero = new Hero(shuffledNames[nameIndex], skillLevel);
        
        // Regular opponents don't get bonuses
        opponents.push(hero);
    }
    
    // Save elite opponents for future games
    saveEliteOpponents();
    
    return opponents;
}

// Bell curve random number generator for more realistic skill distribution
function bellCurveRandom(min, max, mean, stdDev) {
    // Box-Muller transform for normal distribution
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    
    // Transform to our desired mean and standard deviation
    let result = z * stdDev + mean;
    
    // Clamp between min and max
    return Math.max(min, Math.min(max, result));
}

// Eliminate the bottom half of opponents after a round
function eliminateOpponents(player, opponents, roundNumber) {
    // Combine player and opponents for ranking
    const allContestants = [player, ...opponents].filter(h => !h.eliminated);
    
    // Sort by total score (higher is better)
    allContestants.sort((a, b) => b.score - a.score);
    
    // Calculate how many to eliminate (half of all contestants)
    const eliminateCount = Math.floor(allContestants.length / 2);
    
    // Get the cutoff score (score of the last non-eliminated contestant)
    const cutoffScore = allContestants[allContestants.length - eliminateCount - 1].score;
    
    // First pass - mark contestants for elimination based on score
    for (let i = allContestants.length - 1; i >= allContestants.length - eliminateCount; i--) {
        allContestants[i].eliminated = true;
    }
    
    // Special protection for player if tied at cutoff
    if (player.score === cutoffScore && player.eliminated) {
        // Find another opponent to eliminate instead
        player.eliminated = false;
        
        // Find the highest-ranked opponent who isn't eliminated yet but has the same score
        for (let i = allContestants.length - eliminateCount - 1; i >= 0; i--) {
            const contestant = allContestants[i];
            if (contestant !== player && contestant.score === cutoffScore && !contestant.eliminated) {
                contestant.eliminated = true;
                break;
            }
        }
    }
    
    // Return the sorted list for display purposes - correctly sorted by score
    return allContestants;
}

// Get top N heroes by total score
function getTopHeroes(player, opponents, count = 5) {
    const allHeroes = [player, ...opponents].filter(h => !h.eliminated);
    
    // Sort by total score (higher is better)
    allHeroes.sort((a, b) => b.score - a.score);
    
    return allHeroes.slice(0, count);
}

// Helper function to shuffle an array (shared with wordLists.js)
function shuffleHeroArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
