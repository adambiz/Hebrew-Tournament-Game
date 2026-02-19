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

function buildHeaderIndexMap(headerValues) {
    const map = {};
    headerValues.forEach((headerValue, index) => {
        const normalizedHeader = normalizeSpaces(String(headerValue || '').replace(/^\uFEFF/, '')).toLowerCase();
        if (!normalizedHeader || map[normalizedHeader] !== undefined) return;
        map[normalizedHeader] = index;
    });
    return map;
}

function getColumnValue(parsedLine, headerIndexMap, columnName) {
    const columnIndex = headerIndexMap[columnName];
    if (!Number.isInteger(columnIndex)) return '';
    return normalizeSpaces(parsedLine[columnIndex] || '');
}

function validateAndBuildWordData(round, germanRaw, hebrewRaw, rowLabel, optionalFields = {}) {
    const german = normalizeSpaces(germanRaw || '');
    const hebrew = normalizeSpaces(hebrewRaw || '');
    const english = normalizeSpaces(optionalFields.englishRaw || '');
    const hebrewVocalized = normalizeSpaces(optionalFields.hebrewVocalizedRaw || '');
    const ttsText = normalizeSpaces(optionalFields.ttsTextRaw || '');

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
        english,
        hebrewVocalized,
        ttsText,
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
            throw new Error(`Fehlende Wörter für ${key}`);
        }
    }
}

async function loadWordListsFromCSV(csvFilePath = 'data/hebrew-german-words.csv') {
    try {
        const response = await fetch(csvFilePath);

        if (!response.ok) {
            throw new Error(`Wortlisten konnten nicht geladen werden: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        const lines = csvText.replace(/\r\n?/g, '\n').split('\n');

        if (lines.length < 2) {
            throw new Error('Die CSV-Datei ist leer');
        }

        const header = parseCsvLine(lines[0]);
        const headerIndexMap = buildHeaderIndexMap(header);
        const hasRequiredColumns = ['round', 'german', 'hebrew'].every(columnName => {
            return Number.isInteger(headerIndexMap[columnName]);
        });
        if (!hasRequiredColumns) {
            throw new Error("CSV benötigt die Spalten: round,german,hebrew (weitere optionale Spalten sind erlaubt)");
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
                throw new Error(`Zeile ${index + 1}: erwartet wurden 3 Spalten`);
            }

            const roundRaw = getColumnValue(parsed, headerIndexMap, 'round');
            const round = Number(roundRaw);
            if (!Number.isInteger(round) || round < 1 || round > 6) {
                throw new Error(`Zeile ${index + 1}: ungültiger Rundenwert '${roundRaw}'`);
            }

            const wordData = validateAndBuildWordData(
                round,
                getColumnValue(parsed, headerIndexMap, 'german'),
                getColumnValue(parsed, headerIndexMap, 'hebrew'),
                `line ${index + 1}`,
                {
                    englishRaw: getColumnValue(parsed, headerIndexMap, 'english'),
                    hebrewVocalizedRaw: getColumnValue(parsed, headerIndexMap, 'hebrew_vocalized'),
                    ttsTextRaw: getColumnValue(parsed, headerIndexMap, 'tts_text')
                }
            );

            const duplicateKey = `${round}|${wordData.german}|${wordData.hebrew}`;
            if (seenEntries.has(duplicateKey)) {
                throw new Error(`Zeile ${index + 1}: doppelte Zeile '${duplicateKey}'`);
            }
            seenEntries.add(duplicateKey);

            nextWordLists[`round${round}`].push(wordData);
        }

        validateWordListsHaveCoverage(nextWordLists);
        wordLists = nextWordLists;
        emitDataReady(true);

        return wordLists;
    } catch (error) {
        console.error('Fehler beim Laden der CSV-Wortlisten:', error);

        try {
            if (typeof fallbackWordLists === 'undefined') {
                throw new Error('Fallback-Wortlisten sind nicht verfügbar');
            }

            wordLists = processFallbackWordLists(fallbackWordLists);
            emitDataReady(true);
            return wordLists;
        } catch (fallbackError) {
            console.error('Validierung der Fallback-Wortlisten fehlgeschlagen:', fallbackError);
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
                `fallback ${roundKey} item ${idx + 1}`,
                {
                    englishRaw: item.english,
                    hebrewVocalizedRaw: item.hebrewVocalized || item.hebrew_vocalized,
                    ttsTextRaw: item.ttsText || item.tts_text
                }
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

function cloneWordEntry(entry) {
    return {
        german: entry.german,
        hebrew: entry.hebrew,
        english: entry.english,
        hebrewVocalized: entry.hebrewVocalized,
        ttsText: entry.ttsText,
        words: Array.isArray(entry.words) ? entry.words.slice() : [],
        wordCount: entry.wordCount,
        isPhrase: entry.isPhrase,
        totalLetters: entry.totalLetters
    };
}

function getWordListsSnapshot() {
    const snapshot = {};
    for (let round = 1; round <= 6; round++) {
        const roundKey = `round${round}`;
        const roundWords = Array.isArray(wordLists[roundKey]) ? wordLists[roundKey] : [];
        snapshot[roundKey] = roundWords.map(cloneWordEntry);
    }
    return snapshot;
}

window.HebrewGame = window.HebrewGame || {};
window.HebrewGame.words = window.HebrewGame.words || {};
window.HebrewGame.words.loadWordListsFromCSV = loadWordListsFromCSV;
window.HebrewGame.words.getRandomWordsForRound = getRandomWordsForRound;
window.HebrewGame.words.getWordListsSnapshot = getWordListsSnapshot;
