#!/usr/bin/env node
/**
 * Flags likely ambiguous Hebrew rows that are missing hebrew_vocalized.
 *
 * Usage:
 *   node scripts/quality/flag-ambiguous-hebrew.js
 *   node scripts/quality/flag-ambiguous-hebrew.js data/hebrew-german-words.csv
 *   node scripts/quality/flag-ambiguous-hebrew.js --strict
 */

const fs = require('fs');
const path = require('path');

const NIQQUD_PATTERN = /[\u0591-\u05C7]/;
const AMBIGUOUS_TOKENS = new Set([
    'עם', 'אם', 'את', 'אל', 'על',
    'בן', 'בת', 'מה', 'מי',
    'שם', 'פה', 'גם', 'כל', 'יש', 'אין'
]);

function normalizeSpaces(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
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
                i += 1;
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

function detectAmbiguityReason(hebrewText) {
    const hebrew = normalizeSpaces(hebrewText);
    if (!hebrew) return null;
    if (NIQQUD_PATTERN.test(hebrew)) return null;

    const words = hebrew.split(' ').filter(Boolean);
    if (words.length === 0) return null;

    const reasons = [];
    const matchingTokens = words.filter((word) => AMBIGUOUS_TOKENS.has(word));
    if (matchingTokens.length > 0) {
        reasons.push(`common ambiguous token(s): ${matchingTokens.join(', ')}`);
    }

    const shortAlefAyinWords = words.filter((word) => word.length <= 3 && /[אע]/.test(word));
    if (shortAlefAyinWords.length > 0) {
        reasons.push(`short Alef/Ayin form(s): ${shortAlefAyinWords.join(', ')}`);
    }

    if (reasons.length === 0) {
        return null;
    }

    return reasons.join('; ');
}

function parseArgs(argv) {
    const args = argv.slice(2);
    let csvPath = 'data/hebrew-german-words.csv';
    let strict = false;

    args.forEach((arg) => {
        if (arg === '--strict') {
            strict = true;
            return;
        }
        csvPath = arg;
    });

    return { csvPath, strict };
}

function main() {
    const { csvPath, strict } = parseArgs(process.argv);
    const resolvedCsvPath = path.resolve(process.cwd(), csvPath);

    if (!fs.existsSync(resolvedCsvPath)) {
        console.error(`CSV file not found: ${resolvedCsvPath}`);
        process.exit(2);
    }

    const csvText = fs.readFileSync(resolvedCsvPath, 'utf8');
    const lines = csvText.replace(/\r\n?/g, '\n').split('\n');
    if (lines.length < 2) {
        console.error(`CSV file is empty: ${resolvedCsvPath}`);
        process.exit(2);
    }

    const header = parseCsvLine(lines[0]);
    const headerIndexMap = buildHeaderIndexMap(header);
    const hasRequiredColumns = ['round', 'german', 'hebrew'].every((columnName) => {
        return Number.isInteger(headerIndexMap[columnName]);
    });
    if (!hasRequiredColumns) {
        console.error('CSV must include columns: round,german,hebrew');
        process.exit(2);
    }

    if (!Number.isInteger(headerIndexMap.hebrew_vocalized)) {
        console.error("CSV is missing 'hebrew_vocalized' column. Add it to use this checker.");
        process.exit(2);
    }

    const findings = [];

    for (let index = 1; index < lines.length; index++) {
        const rawLine = lines[index];
        if (!rawLine || !rawLine.trim()) continue;

        const parsed = parseCsvLine(rawLine);
        const round = getColumnValue(parsed, headerIndexMap, 'round');
        const german = getColumnValue(parsed, headerIndexMap, 'german');
        const hebrew = getColumnValue(parsed, headerIndexMap, 'hebrew');
        const hebrewVocalized = getColumnValue(parsed, headerIndexMap, 'hebrew_vocalized');
        const ttsText = getColumnValue(parsed, headerIndexMap, 'tts_text');

        if (!hebrew || hebrewVocalized || ttsText) continue;

        const reason = detectAmbiguityReason(hebrew);
        if (!reason) continue;

        findings.push({
            line: index + 1,
            round,
            german,
            hebrew,
            reason
        });
    }

    if (findings.length === 0) {
        console.log('No likely ambiguous rows missing hebrew_vocalized.');
        return;
    }

    console.log(
        `Found ${findings.length} likely ambiguous row(s) with empty hebrew_vocalized in ${path.relative(process.cwd(), resolvedCsvPath)}`
    );
    findings.forEach((finding) => {
        console.log(
            `line ${finding.line} | round ${finding.round} | german="${finding.german}" | hebrew="${finding.hebrew}" | reason: ${finding.reason}`
        );
    });
    console.log('Tip: add hebrew_vocalized (or tts_text when you need exact spoken output).');

    if (strict) {
        process.exit(1);
    }
}

main();
