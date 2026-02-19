/**
 * Word lists loader for Hebrew Learning Game.
 * Loads words from CSV, validates content, and exposes round-level random access.
 */

let wordLists = {};

const ROUND_WORD_COUNT_RULES = {
    1: 1,
    2: 1,
    3: 1,
    4: 2,
    5: 3,
    6: 4
};

function emitDataReady(ready, errorMessage) {
    window.dispatchEvent(new CustomEvent('hebrewGame:dataReady', {
        detail: {
            ready: !!ready,
            error: errorMessage || null
        }
    }));
}

function parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
            continue;
        }

        current += char;
    }

    values.push(current);
    return values;
}

function normalizeSpaces(text) {
    return text.replace(/\s+/g, ' ').trim();
}

function validateAndBuildWordData(round, germanRaw, hebrewRaw, rowLabel) {
    const german = normalizeSpaces(germanRaw || '');
    const hebrew = normalizeSpaces(hebrewRaw || '');

    if (!german || !hebrew) {
        throw new Error(`${rowLabel}: German and Hebrew values are required`);
    }

    const expectedWordCount = ROUND_WORD_COUNT_RULES[round];
    if (!expectedWordCount) {
        throw new Error(`${rowLabel}: Invalid round '${round}'. Expected 1-6`);
    }

    const hebrewWords = hebrew.split(' ');
    if (hebrewWords.length !== expectedWordCount) {
        throw new Error(
            `${rowLabel}: Round ${round} expects ${expectedWordCount} Hebrew word(s), got ${hebrewWords.length} ('${hebrew}')`
        );
    }

    return {
        german,
        hebrew,
        words: hebrewWords,
        wordCount: hebrewWords.length,
        isPhrase: hebrewWords.length > 1,
        totalLetters: hebrewWords.reduce((sum, word) => sum + word.length, 0)
    };
}

function validateWordListsHaveCoverage(lists) {
    for (let round = 1; round <= 6; round++) {
        const key = `round${round}`;
        if (!Array.isArray(lists[key]) || lists[key].length === 0) {
            throw new Error(`Missing words for ${key}`);
        }
    }
}

async function loadWordListsFromCSV(csvFilePath = 'data/hebrew-german-words.csv') {
    try {
        const response = await fetch(csvFilePath);

        if (!response.ok) {
            throw new Error(`Failed to load word lists: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        const lines = csvText.replace(/\r\n?/g, '\n').split('\n');

        if (lines.length < 2) {
            throw new Error('CSV file is empty');
        }

        const header = parseCsvLine(lines[0]).map(value => value.trim().toLowerCase());
        if (header[0] !== 'round' || header[1] !== 'german' || header[2] !== 'hebrew') {
            throw new Error("CSV header must be exactly: round,german,hebrew");
        }

        const nextWordLists = {
            round1: [],
            round2: [],
            round3: [],
            round4: [],
            round5: [],
            round6: []
        };
        const seenEntries = new Set();

        for (let index = 1; index < lines.length; index++) {
            const line = lines[index];
            if (!line.trim()) continue;

            const parsed = parseCsvLine(line);
            if (parsed.length < 3) {
                throw new Error(`line ${index + 1}: expected 3 columns`);
            }

            const roundRaw = normalizeSpaces(parsed[0] || '');
            const round = Number(roundRaw);
            if (!Number.isInteger(round) || round < 1 || round > 6) {
                throw new Error(`line ${index + 1}: invalid round value '${roundRaw}'`);
            }

            const wordData = validateAndBuildWordData(
                round,
                parsed[1],
                parsed[2],
                `line ${index + 1}`
            );

            const duplicateKey = `${round}|${wordData.german}|${wordData.hebrew}`;
            if (seenEntries.has(duplicateKey)) {
                throw new Error(`line ${index + 1}: duplicate row '${duplicateKey}'`);
            }
            seenEntries.add(duplicateKey);

            nextWordLists[`round${round}`].push(wordData);
        }

        validateWordListsHaveCoverage(nextWordLists);
        wordLists = nextWordLists;
        emitDataReady(true);

        return wordLists;
    } catch (error) {
        console.error('Error loading CSV word lists:', error);

        try {
            if (typeof fallbackWordLists === 'undefined') {
                throw new Error('Fallback word lists are unavailable');
            }

            wordLists = processFallbackWordLists(fallbackWordLists);
            emitDataReady(true);
            return wordLists;
        } catch (fallbackError) {
            console.error('Fallback word list validation failed:', fallbackError);
            emitDataReady(false, String(fallbackError && fallbackError.message ? fallbackError.message : fallbackError));
            wordLists = {
                round1: [],
                round2: [],
                round3: [],
                round4: [],
                round5: [],
                round6: []
            };
            return wordLists;
        }
    }
}

function processFallbackWordLists(sourceWordLists) {
    const processedLists = {
        round1: [],
        round2: [],
        round3: [],
        round4: [],
        round5: [],
        round6: []
    };
    const seenEntries = new Set();

    for (const [roundKey, wordList] of Object.entries(sourceWordLists)) {
        const match = roundKey.match(/^round([1-6])$/);
        if (!match) continue;
        const round = Number(match[1]);

        processedLists[roundKey] = wordList.map((item, idx) => {
            const wordData = validateAndBuildWordData(
                round,
                item.german,
                item.hebrew,
                `fallback ${roundKey} item ${idx + 1}`
            );

            const duplicateKey = `${round}|${wordData.german}|${wordData.hebrew}`;
            if (seenEntries.has(duplicateKey)) {
                throw new Error(`Duplicate fallback row '${duplicateKey}'`);
            }
            seenEntries.add(duplicateKey);

            return wordData;
        });
    }

    validateWordListsHaveCoverage(processedLists);
    return processedLists;
}

function getRandomWordsForRound(roundNumber, count = 5) {
    const roundKey = `round${roundNumber}`;
    const roundWords = wordLists[roundKey];

    if (!roundWords || roundWords.length === 0) {
        console.error(`No words found for round ${roundNumber}`);
        return [];
    }

    return shuffleWordArray(roundWords.slice()).slice(0, count);
}

function shuffleWordArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

window.HebrewGame = window.HebrewGame || {};
window.HebrewGame.words = window.HebrewGame.words || {};
window.HebrewGame.words.loadWordListsFromCSV = loadWordListsFromCSV;
window.HebrewGame.words.getRandomWordsForRound = getRandomWordsForRound;
