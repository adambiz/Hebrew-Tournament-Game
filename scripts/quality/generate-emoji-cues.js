#!/usr/bin/env node
/**
 * Generates/updates the optional `emoji` CSV column for gameplay cue mode.
 *
 * Usage:
 *   node scripts/quality/generate-emoji-cues.js
 *   node scripts/quality/generate-emoji-cues.js data/hebrew-german-words.csv
 */

const fs = require('fs');
const path = require('path');

function parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (ch === ',' && !inQuotes) {
            values.push(current);
            current = '';
            continue;
        }
        current += ch;
    }
    values.push(current);
    return values;
}

function csvEscape(value) {
    const text = String(value === undefined || value === null ? '' : value);
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function normalizeSpaces(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
}

function slugText(text) {
    return normalizeSpaces(text)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ');
}

const MANUAL_OVERRIDES = {
    'the cat wears a big hat': '🐱 🎩',
    'the turtle runs like lightning': '🐢 🏃 ⚡',
    'the unicorn drives through clouds': '🦄 ☁️',
    'the unicorn travels through the clouds': '🦄 ☁️',
    'die katze traegt einen grossen hut': '🐱 🎩',
    'die schildkroete rennt wie ein blitz': '🐢 🏃 ⚡',
    'das einhorn faehrt durch wolken': '🦄 ☁️'
};

const TOKEN_TO_EMOJI = [
    { re: /\b(cat|katze|חתול)\b/, emoji: '🐱' },
    { re: /\b(dog|hund|כלב)\b/, emoji: '🐶' },
    { re: /\b(fish|fisch|דג)\b/, emoji: '🐟' },
    { re: /\b(turtle|schildkrote|schildkroete|צב)\b/, emoji: '🐢' },
    { re: /\b(unicorn|einhorn)\b/, emoji: '🦄' },
    { re: /\b(dragon|drache|drachen|דרקון)\b/, emoji: '🐉' },
    { re: /\b(monkey|affe|קוף)\b/, emoji: '🐵' },
    { re: /\b(mouse|maus|עכבר)\b/, emoji: '🐭' },
    { re: /\b(panda|פנדה)\b/, emoji: '🐼' },
    { re: /\b(wolf|זאב)\b/, emoji: '🐺' },
    { re: /\b(bear|bar|bär|דוב)\b/, emoji: '🐻' },
    { re: /\b(llama|lama)\b/, emoji: '🦙' },
    { re: /\b(pirate|pirat|פיראט)\b/, emoji: '🏴‍☠️' },
    { re: /\b(alien|חייזר)\b/, emoji: '👽' },
    { re: /\b(robot|roboter|רובוט)\b/, emoji: '🤖' },
    { re: /\b(teacher|lehrer|lehrerin|מורה)\b/, emoji: '🧑‍🏫' },
    { re: /\b(child|kind|junge|madchen|mädchen|ילד|ילדה)\b/, emoji: '🧒' },
    { re: /\b(woman|frau|אישה)\b/, emoji: '👩' },
    { re: /\b(man|mann|איש)\b/, emoji: '👨' },
    { re: /\b(father|vater|אב)\b/, emoji: '👨' },
    { re: /\b(son|sohn|בן)\b/, emoji: '👦' },
    { re: /\b(hand|יד)\b/, emoji: '✋' },
    { re: /\b(foot|fuss|fuß|רגל)\b/, emoji: '🦶' },
    { re: /\b(nose|nase|אף)\b/, emoji: '👃' },
    { re: /\b(mouth|mund|פה)\b/, emoji: '👄' },

    { re: /\b(moon|mond|ירח)\b/, emoji: '🌙' },
    { re: /\b(star|sterne|stern|כוכב|כוכבים)\b/, emoji: '⭐' },
    { re: /\b(cloud|wolke|wolken|עננ|עננים)\b/, emoji: '☁️' },
    { re: /\b(lightning|blitz|ברק)\b/, emoji: '⚡' },
    { re: /\b(wind|רוח)\b/, emoji: '💨' },
    { re: /\b(sea|meer|ים)\b/, emoji: '🌊' },
    { re: /\b(island|insel|אי)\b/, emoji: '🏝️' },
    { re: /\b(mountain|berg|הר)\b/, emoji: '⛰️' },
    { re: /\b(tree|baum|עץ)\b/, emoji: '🌳' },
    { re: /\b(flower|blume|rose|פרח|שושנה)\b/, emoji: '🌸' },
    { re: /\b(sun|sonne|שמש)\b/, emoji: '☀️' },

    { re: /\b(run|rennt|lauft|läuft|רץ|רצה|רצים)\b/, emoji: '🏃' },
    { re: /\b(jump|spring|קופץ|קופצת)\b/, emoji: '🦘' },
    { re: /\b(fly|flieg|fliegen|טס|טסה|מטיס)\b/, emoji: '✈️' },
    { re: /\b(sail|segeln|מפליג)\b/, emoji: '⛵' },
    { re: /\b(ride|fahrt|fährt|נוסע|נוסעת|רוכב)\b/, emoji: '🚗' },
    { re: /\b(dance|tanzt|tanzen|רוקד|רוקדים)\b/, emoji: '💃' },
    { re: /\b(play|spielt|spielen|מנגן|משחק)\b/, emoji: '🎮' },
    { re: /\b(draw|malt|מציירת|מצלם)\b/, emoji: '🎨' },
    { re: /\b(build|baut|bauen|בונה|בונים|מכין)\b/, emoji: '🛠️' },
    { re: /\b(find|findet|מוצא)\b/, emoji: '🔍' },
    { re: /\b(guard|bewacht|שומר)\b/, emoji: '🛡️' },

    { re: /\b(rocket|rakete|raketen|רקטה)\b/, emoji: '🚀' },
    { re: /\b(spaceship|raumschiff|חללית)\b/, emoji: '🛸' },
    { re: /\b(car|auto|מכונית)\b/, emoji: '🚗' },
    { re: /\b(boat|boot|סירה)\b/, emoji: '🚤' },
    { re: /\b(train|zug|רכבת)\b/, emoji: '🚆' },
    { re: /\b(map|karte|מפה)\b/, emoji: '🗺️' },
    { re: /\b(compass|kompass|מצפן)\b/, emoji: '🧭' },
    { re: /\b(key|schlussel|schlüssel|מפתח)\b/, emoji: '🔑' },
    { re: /\b(treasure|schatz|אוצר)\b/, emoji: '💎' },
    { re: /\b(castle|schloss|burg|ארמון|טירה)\b/, emoji: '🏰' },
    { re: /\b(kite|drachen|עפיפון)\b/, emoji: '🪁' },
    { re: /\b(skate|skateboard)\b/, emoji: '🛹' },
    { re: /\b(camera|fotograf|מצלם)\b/, emoji: '📷' },

    { re: /\b(hat|hut|כובע)\b/, emoji: '🎩' },
    { re: /\b(cape|umhang|גלימה)\b/, emoji: '🦸' },
    { re: /\b(helmet|helm|קסדה)\b/, emoji: '⛑️' },
    { re: /\b(backpack|rucksack|תרמיל)\b/, emoji: '🎒' },
    { re: /\b(coin|coins|münze|muenze|מטבע)\b/, emoji: '🪙' },
    { re: /\b(magic|zauber|קסם|שיקוי)\b/, emoji: '✨' },

    { re: /\b(chocolate|schokolade|שוקולד)\b/, emoji: '🍫' },
    { re: /\b(cake|kuchen|עוגה)\b/, emoji: '🍰' },
    { re: /\b(cookies|kekse|cookie|עוגיות)\b/, emoji: '🍪' },
    { re: /\b(pizza|פיצה)\b/, emoji: '🍕' },
    { re: /\b(popcorn|פופקורן)\b/, emoji: '🍿' },
    { re: /\b(ice cream|eiscreme|גלידה)\b/, emoji: '🍦' },
    { re: /\b(banana|banane|בננה)\b/, emoji: '🍌' },
    { re: /\b(apple|apfel|תפוח)\b/, emoji: '🍎' },
    { re: /\b(oranges|orange|תפוז)\b/, emoji: '🍊' },
    { re: /\b(bread|brot|לחם)\b/, emoji: '🍞' },
    { re: /\b(tea|tee|תה)\b/, emoji: '🍵' },
    { re: /\b(coffee|kaffee|קפה)\b/, emoji: '☕' },
    { re: /\b(water|wasser|מים)\b/, emoji: '💧' },
    { re: /\b(grapes|trauben|ענבים)\b/, emoji: '🍇' },
    { re: /\b(candies|bonbons|סוכריות)\b/, emoji: '🍬' },

    { re: /\b(school|schule|בית הספר)\b/, emoji: '🏫' },
    { re: /\b(book|buch|buecher|bücher|ספר)\b/, emoji: '📚' },
    { re: /\b(window|fenster|חלון)\b/, emoji: '🪟' },
    { re: /\b(computer|מחשב)\b/, emoji: '💻' },
    { re: /\b(phone|telefon|טלפון)\b/, emoji: '📞' },
    { re: /\b(home|hause|haus|בית|הביתה)\b/, emoji: '🏠' },
    { re: /\b(roof|dach|גג)\b/, emoji: '🏠' },
    { re: /\b(garden|garten|גן)\b/, emoji: '🪴' },
    { re: /\b(street|strasse|straße|רחוב)\b/, emoji: '🛣️' },
    { re: /\b(city|stadt|עיר)\b/, emoji: '🏙️' },
    { re: /\b(day|tag|יום|heute|today)\b/, emoji: '📅' },
    { re: /\b(night|nacht|לילה)\b/, emoji: '🌃' },
    { re: /\b(friend|freund|freunden|חבר)\b/, emoji: '🫂' },
    { re: /\b(what|was|מה)\b/, emoji: '❓' },
    { re: /\b(who|wer|מי)\b/, emoji: '👤' },
    { re: /\b(there|dort|שם)\b/, emoji: '👉' },
    { re: /\b(here|hier|כאן)\b/, emoji: '👈' },
    { re: /\b(also|auch|גם)\b/, emoji: '➕' },
    { re: /\b(with|mit|עם)\b/, emoji: '🤝' },
    { re: /\b(on|auf|על)\b/, emoji: '🔝' },
    { re: /\b(bad|schlecht|רע)\b/, emoji: '👎' }
];

function buildEmojiForRow(round, english, german, hebrew) {
    const englishSlug = slugText(english);
    const germanSlug = slugText(german);
    const hebrewNormalized = normalizeSpaces(hebrew);

    const override = MANUAL_OVERRIDES[englishSlug] || MANUAL_OVERRIDES[germanSlug];
    if (override) return override;

    const source = `${englishSlug} ${germanSlug} ${hebrewNormalized}`;
    const matched = [];
    for (const entry of TOKEN_TO_EMOJI) {
        if (!entry.re.test(source)) continue;
        if (!matched.includes(entry.emoji)) {
            matched.push(entry.emoji);
        }
        if (matched.length >= 3) break;
    }

    if (matched.length > 0) return matched.join(' ');

    // Round fallback keeps visual variety when no token mapping hit.
    const roundFallback = {
        1: '🧩',
        2: '🔤',
        3: '🎯',
        4: '🗣️',
        5: '🧠',
        6: '🚀'
    };
    return roundFallback[round] || '';
}

function main() {
    const inputPath = process.argv[2] || 'data/hebrew-german-words.csv';
    const resolvedPath = path.resolve(process.cwd(), inputPath);
    const csvText = fs.readFileSync(resolvedPath, 'utf8');
    const lines = csvText.replace(/\r\n?/g, '\n').split('\n');
    if (lines.length < 2) {
        throw new Error('CSV has no data rows.');
    }

    const header = parseCsvLine(lines[0]).map((col) => normalizeSpaces(col.replace(/^\uFEFF/, '')));
    const headerLookup = new Map(header.map((name, idx) => [name.toLowerCase(), idx]));
    const required = ['round', 'german', 'hebrew'];
    for (const name of required) {
        if (!headerLookup.has(name)) {
            throw new Error(`CSV must include column: ${name}`);
        }
    }

    let emojiIndex = headerLookup.get('emoji');
    if (!Number.isInteger(emojiIndex)) {
        header.push('emoji');
        emojiIndex = header.length - 1;
    }

    const roundIndex = headerLookup.get('round');
    const germanIndex = headerLookup.get('german');
    const hebrewIndex = headerLookup.get('hebrew');
    const englishIndex = headerLookup.get('english');

    let updatedRows = 0;
    let fallbackRows = 0;
    const outputRows = [header];

    for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
        const rawLine = lines[lineIndex];
        if (!rawLine.trim()) continue;

        const row = parseCsvLine(rawLine);
        while (row.length < header.length) row.push('');

        const round = Number(normalizeSpaces(row[roundIndex]));
        const german = normalizeSpaces(row[germanIndex]);
        const hebrew = normalizeSpaces(row[hebrewIndex]);
        const english = Number.isInteger(englishIndex) ? normalizeSpaces(row[englishIndex]) : '';

        const generated = buildEmojiForRow(round, english, german, hebrew);
        const previous = normalizeSpaces(row[emojiIndex]);
        if (previous !== generated) {
            updatedRows += 1;
            row[emojiIndex] = generated;
        }
        if (!generated) {
            fallbackRows += 1;
        }

        outputRows.push(row.slice(0, header.length));
    }

    const outputText = outputRows
        .map((row) => row.map(csvEscape).join(','))
        .join('\n') + '\n';
    fs.writeFileSync(resolvedPath, outputText, 'utf8');

    const dataRows = outputRows.length - 1;
    console.log(
        `Updated ${updatedRows} row(s) in ${inputPath}. ` +
        `${dataRows - fallbackRows}/${dataRows} rows have non-empty emoji cues.`
    );
}

try {
    main();
} catch (error) {
    console.error(String(error && error.message ? error.message : error));
    process.exit(1);
}
