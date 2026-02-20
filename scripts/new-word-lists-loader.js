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

const LOADER_GENERIC_EMOJI_CUES = [
    '🎯',
    '✨',
    '🌟',
    '🧩',
    '🚀',
    '⚡',
    '🌈',
    '🎈',
    '🐾',
    '🪄',
    '🏆',
    '🎮'
];

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

function buildDeterministicEmojiCue(seedSource) {
    const normalizedSeed = normalizeSpaces(seedSource || '');
    if (!normalizedSeed) return '🎯';

    let hash = 0;
    for (let i = 0; i < normalizedSeed.length; i++) {
        hash = (hash * 33 + normalizedSeed.charCodeAt(i)) >>> 0;
    }

    const paletteSize = LOADER_GENERIC_EMOJI_CUES.length;
    const primary = LOADER_GENERIC_EMOJI_CUES[hash % paletteSize];
    const secondary = LOADER_GENERIC_EMOJI_CUES[(Math.floor(hash / paletteSize) + 5) % paletteSize];
    if (primary === secondary) return primary;
    return `${primary} ${secondary}`;
}

function inferEmojiCueFromI18n(wordData) {
    const i18nApi = getI18nApi();
    if (!i18nApi || typeof i18nApi.inferEmojiCue !== 'function') {
        return '';
    }
    return normalizeSpaces(i18nApi.inferEmojiCue(wordData) || '');
}

function resolveEmojiCue(round, german, hebrew, english, emojiRaw) {
    const existingEmoji = normalizeSpaces(emojiRaw || '');
    if (existingEmoji) return existingEmoji;

    const inferredEmoji = inferEmojiCueFromI18n({
        round,
        german,
        hebrew,
        english
    });
    if (inferredEmoji) return inferredEmoji;

    return buildDeterministicEmojiCue([round, german, english, hebrew].join(' '));
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
    const emoji = resolveEmojiCue(round, german, hebrew, english, optionalFields.emojiRaw || '');

    if (!german || !hebrew) {
        throw new Error(t('loader.rowValuesRequired', { row: rowLabel }));
    }

    const expectedWordCount = ROUND_WORD_COUNT_RULES[round];
    if (!expectedWordCount) {
        throw new Error(t('loader.invalidRoundValue', { row: rowLabel, round }));
    }

    const hebrewWords = hebrew.split(' ');
    if (hebrewWords.length !== expectedWordCount) {
        throw new Error(
            t('loader.roundWordCount', {
                row: rowLabel,
                round,
                expected: expectedWordCount,
                actual: hebrewWords.length,
                hebrew
            })
        );
    }

    return {
        german,
        hebrew,
        english,
        hebrewVocalized,
        ttsText,
        emoji,
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
            throw new Error(t('loader.missingRoundWords', { roundKey: key }));
        }
    }
}

async function loadWordListsFromCSV(csvFilePath = 'data/hebrew-german-words.csv') {
    try {
        const response = await fetch(csvFilePath);

        if (!response.ok) {
            throw new Error(t('loader.fetchFailed', {
                status: response.status,
                statusText: response.statusText
            }));
        }

        const csvText = await response.text();
        const lines = csvText.replace(/\r\n?/g, '\n').split('\n');

        if (lines.length < 2) {
            throw new Error(t('loader.csvEmpty'));
        }

        const header = parseCsvLine(lines[0]);
        const headerIndexMap = buildHeaderIndexMap(header);
        const hasRequiredColumns = ['round', 'german', 'hebrew'].every(columnName => {
            return Number.isInteger(headerIndexMap[columnName]);
        });
        if (!hasRequiredColumns) {
            throw new Error(t('loader.requiredColumns'));
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
                throw new Error(t('loader.expectedColumns', { line: index + 1 }));
            }

            const roundRaw = getColumnValue(parsed, headerIndexMap, 'round');
            const round = Number(roundRaw);
            if (!Number.isInteger(round) || round < 1 || round > 6) {
                throw new Error(t('loader.invalidRound', { line: index + 1, round: roundRaw }));
            }

            const wordData = validateAndBuildWordData(
                round,
                getColumnValue(parsed, headerIndexMap, 'german'),
                getColumnValue(parsed, headerIndexMap, 'hebrew'),
                `line ${index + 1}`,
                {
                    englishRaw: getColumnValue(parsed, headerIndexMap, 'english'),
                    hebrewVocalizedRaw: getColumnValue(parsed, headerIndexMap, 'hebrew_vocalized'),
                    ttsTextRaw: getColumnValue(parsed, headerIndexMap, 'tts_text'),
                    emojiRaw: getColumnValue(parsed, headerIndexMap, 'emoji')
                }
            );

            const duplicateKey = `${round}|${wordData.german}|${wordData.hebrew}`;
            if (seenEntries.has(duplicateKey)) {
                throw new Error(t('loader.duplicateRow', { line: index + 1, key: duplicateKey }));
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
                throw new Error(t('loader.fallbackUnavailable'));
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
                    ttsTextRaw: item.ttsText || item.tts_text,
                    emojiRaw: item.emoji
                }
            );

            const duplicateKey = `${round}|${wordData.german}|${wordData.hebrew}`;
            if (seenEntries.has(duplicateKey)) {
                throw new Error(t('loader.fallbackDuplicate', { key: duplicateKey }));
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
        emoji: entry.emoji,
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
