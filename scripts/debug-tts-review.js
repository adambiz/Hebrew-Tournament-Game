/**
 * Start-screen TTS debug review panel.
 * Lets you listen to entries and mark sentence/word-level pronunciation issues.
 */
(function bootstrapTtsDebugReview() {
    const ISSUES_STORAGE_KEY = 'hebrewGame_ttsDebugIssueMap_v2';
    const LEGACY_FLAGS_STORAGE_KEY = 'hebrewGame_ttsDebugFlags_v1';

    const state = {
        rows: [],
        rowsById: new Map(),
        issueMap: loadIssueMap(),
        filterQuery: '',
        isOpen: false
    };

    const dom = {
        openButton: null,
        panel: null,
        closeButton: null,
        filterInput: null,
        copyButton: null,
        clearButton: null,
        status: null,
        list: null
    };

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

    function getPromptText(entry) {
        const i18nApi = getI18nApi();
        if (i18nApi && typeof i18nApi.getPromptText === 'function') {
            return normalizeSpaces(i18nApi.getPromptText(entry));
        }
        return normalizeSpaces(entry.german || entry.english || '');
    }

    function normalizeSpaces(text) {
        return String(text || '').replace(/\s+/g, ' ').trim();
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function csvEscape(value) {
        const text = String(value || '');
        if (/[",\n]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    }

    function createEmptyIssueEntry() {
        return {
            sentenceIssue: false,
            words: {}
        };
    }

    function cloneIssueEntry(entry) {
        if (!entry || typeof entry !== 'object') return createEmptyIssueEntry();

        const normalizedWords = {};
        const sourceWords = entry.words && typeof entry.words === 'object' ? entry.words : {};
        Object.keys(sourceWords).forEach((wordKey) => {
            const wordEntry = sourceWords[wordKey];
            if (!wordEntry || typeof wordEntry !== 'object') return;
            const wrongStress = !!wordEntry.wrongStress;
            const weirdPronunciation = !!wordEntry.weirdPronunciation;
            if (!wrongStress && !weirdPronunciation) return;
            normalizedWords[wordKey] = { wrongStress, weirdPronunciation };
        });

        return {
            sentenceIssue: !!entry.sentenceIssue,
            words: normalizedWords
        };
    }

    function hasIssueEntry(entry) {
        if (!entry || typeof entry !== 'object') return false;
        if (entry.sentenceIssue) return true;

        const sourceWords = entry.words && typeof entry.words === 'object' ? entry.words : {};
        return Object.keys(sourceWords).some((wordKey) => {
            const wordEntry = sourceWords[wordKey];
            if (!wordEntry || typeof wordEntry !== 'object') return false;
            return !!wordEntry.wrongStress || !!wordEntry.weirdPronunciation;
        });
    }

    function loadIssueMap() {
        try {
            const raw = localStorage.getItem(ISSUES_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const normalized = {};
                    Object.keys(parsed).forEach((rowId) => {
                        const normalizedId = normalizeSpaces(rowId);
                        if (!normalizedId) return;
                        const issueEntry = cloneIssueEntry(parsed[rowId]);
                        if (!hasIssueEntry(issueEntry)) return;
                        normalized[normalizedId] = issueEntry;
                    });
                    return normalized;
                }
            }

            const legacyRaw = localStorage.getItem(LEGACY_FLAGS_STORAGE_KEY);
            if (!legacyRaw) return {};
            const legacyParsed = JSON.parse(legacyRaw);
            if (!Array.isArray(legacyParsed)) return {};

            const migrated = {};
            legacyParsed.forEach((legacyId) => {
                const normalizedId = normalizeSpaces(legacyId);
                if (!normalizedId) return;
                migrated[normalizedId] = {
                    sentenceIssue: true,
                    words: {}
                };
            });
            return migrated;
        } catch (_error) {
            return {};
        }
    }

    function saveIssueMap() {
        const persisted = {};
        Object.keys(state.issueMap).forEach((rowId) => {
            const issueEntry = cloneIssueEntry(state.issueMap[rowId]);
            if (!hasIssueEntry(issueEntry)) return;
            persisted[rowId] = issueEntry;
        });
        state.issueMap = persisted;

        try {
            localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(persisted));
            localStorage.removeItem(LEGACY_FLAGS_STORAGE_KEY);
        } catch (_error) {
            // Ignore storage failures.
        }
    }

    function getWordsSnapshot() {
        if (
            !window.HebrewGame ||
            !window.HebrewGame.words ||
            typeof window.HebrewGame.words.getWordListsSnapshot !== 'function'
        ) {
            return null;
        }
        return window.HebrewGame.words.getWordListsSnapshot();
    }

    function buildSpokenText(entry) {
        const ttsText = normalizeSpaces(entry.ttsText || entry.tts_text || '');
        if (ttsText) return ttsText;
        const hebrewVocalized = normalizeSpaces(entry.hebrewVocalized || entry.hebrew_vocalized || '');
        if (hebrewVocalized) return hebrewVocalized;
        return normalizeSpaces(entry.hebrew || '');
    }

    function getSpokenTokens(spokenText) {
        const cleaned = normalizeSpaces(spokenText);
        if (!cleaned) return [];
        return cleaned.split(' ').filter(Boolean);
    }

    function flattenRows(snapshot) {
        const rows = [];
        let globalIndex = 0;

        for (let round = 1; round <= 6; round++) {
            const roundKey = `round${round}`;
            const roundEntries = Array.isArray(snapshot && snapshot[roundKey]) ? snapshot[roundKey] : [];

            roundEntries.forEach((entry, roundIndex) => {
                globalIndex += 1;

                const german = normalizeSpaces(entry.german || '');
                const hebrew = normalizeSpaces(entry.hebrew || '');
                const english = normalizeSpaces(entry.english || '');
                const hebrewVocalized = normalizeSpaces(entry.hebrewVocalized || entry.hebrew_vocalized || '');
                const ttsText = normalizeSpaces(entry.ttsText || entry.tts_text || '');
                const spokenText = buildSpokenText(entry);
                const sourceText = getPromptText(entry) || german || english || hebrew;

                const id = `${round}|${german}|${hebrew}|${roundIndex}`;
                const searchBlob = normalizeSpaces(
                    `${round} ${german} ${hebrew} ${english} ${sourceText} ${hebrewVocalized} ${ttsText} ${spokenText}`
                ).toLowerCase();

                rows.push({
                    id,
                    rowNumber: globalIndex,
                    round,
                    roundIndex: roundIndex + 1,
                    german,
                    hebrew,
                    english,
                    hebrewVocalized,
                    ttsText,
                    sourceText,
                    spokenText,
                    spokenTokens: getSpokenTokens(spokenText),
                    searchBlob
                });
            });
        }

        return rows;
    }

    function getIssueEntry(rowId) {
        if (!state.issueMap[rowId]) {
            state.issueMap[rowId] = createEmptyIssueEntry();
        }
        return state.issueMap[rowId];
    }

    function getIssueDetailsForRow(row) {
        return cloneIssueEntry(state.issueMap[row.id]);
    }

    function normalizeIssueMapAgainstRows() {
        const rowIds = new Set(state.rows.map((row) => row.id));
        const normalized = {};

        Object.keys(state.issueMap).forEach((rowId) => {
            if (!rowIds.has(rowId)) return;
            const row = state.rowsById.get(rowId);
            if (!row) return;

            const issueEntry = cloneIssueEntry(state.issueMap[rowId]);
            const allowedMaxIndex = row.spokenTokens.length - 1;
            const normalizedWords = {};
            Object.keys(issueEntry.words || {}).forEach((wordKey) => {
                const index = Number(wordKey);
                if (!Number.isInteger(index)) return;
                if (index < 0 || index > allowedMaxIndex) return;
                const wordEntry = issueEntry.words[wordKey];
                if (!wordEntry) return;
                const wrongStress = !!wordEntry.wrongStress;
                const weirdPronunciation = !!wordEntry.weirdPronunciation;
                if (!wrongStress && !weirdPronunciation) return;
                normalizedWords[String(index)] = { wrongStress, weirdPronunciation };
            });

            issueEntry.words = normalizedWords;
            if (!hasIssueEntry(issueEntry)) return;
            normalized[rowId] = issueEntry;
        });

        state.issueMap = normalized;
        saveIssueMap();
    }

    function countIssueRows() {
        return Object.keys(state.issueMap).length;
    }

    function countSentenceIssues() {
        let total = 0;
        Object.keys(state.issueMap).forEach((rowId) => {
            const entry = state.issueMap[rowId];
            if (entry && entry.sentenceIssue) total += 1;
        });
        return total;
    }

    function countWordIssues() {
        let total = 0;
        Object.keys(state.issueMap).forEach((rowId) => {
            const entry = state.issueMap[rowId];
            if (!entry || !entry.words) return;
            Object.keys(entry.words).forEach((wordKey) => {
                const wordEntry = entry.words[wordKey];
                if (!wordEntry) return;
                if (wordEntry.wrongStress) total += 1;
                if (wordEntry.weirdPronunciation) total += 1;
            });
        });
        return total;
    }

    function getIssueRows() {
        return state.rows.filter((row) => hasIssueEntry(state.issueMap[row.id]));
    }

    function setStatus(message) {
        if (!dom.status) return;
        dom.status.textContent = normalizeSpaces(message || '');
    }

    function refreshRows() {
        const snapshot = getWordsSnapshot();
        state.rows = flattenRows(snapshot);
        state.rowsById = new Map(state.rows.map((row) => [row.id, row]));
        normalizeIssueMapAgainstRows();
        renderList();
    }

    function getVisibleRows() {
        if (!state.filterQuery) return state.rows.slice();
        return state.rows.filter((row) => row.searchBlob.includes(state.filterQuery));
    }

    function formatRowMeta(row) {
        const emptyValue = t('ttsDebug.emptyValue');
        const shownTts = row.ttsText || emptyValue;
        return [
            t('ttsDebug.metaHebrew', { value: row.hebrew || emptyValue }),
            t('ttsDebug.metaVocalized', { value: row.hebrewVocalized || emptyValue }),
            t('ttsDebug.metaTts', { value: shownTts }),
            t('ttsDebug.metaSpoken', { value: row.spokenText || emptyValue })
        ].join(' · ');
    }

    function renderWordIssueControls(row, issueEntry) {
        if (!row.spokenTokens.length) return '';

        return row.spokenTokens.map((token, wordIndex) => {
            const wordIssue = issueEntry.words[String(wordIndex)] || { wrongStress: false, weirdPronunciation: false };
            return `
                <div class="tts-debug-word-item">
                    <div class="tts-debug-word-label">${escapeHtml(token)}</div>
                    <div class="tts-debug-word-actions">
                        <button
                            type="button"
                            class="game-button tts-debug-word-flag"
                            data-action="toggle-word-issue"
                            data-id="${escapeHtml(row.id)}"
                            data-word-index="${wordIndex}"
                            data-kind="wrongStress"
                            aria-pressed="${wordIssue.wrongStress ? 'true' : 'false'}"
                        >${t('ttsDebug.issueStress')}</button>
                        <button
                            type="button"
                            class="game-button tts-debug-word-flag"
                            data-action="toggle-word-issue"
                            data-id="${escapeHtml(row.id)}"
                            data-word-index="${wordIndex}"
                            data-kind="weirdPronunciation"
                            aria-pressed="${wordIssue.weirdPronunciation ? 'true' : 'false'}"
                        >${t('ttsDebug.issuePronunciation')}</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderRow(row) {
        const issueEntry = getIssueDetailsForRow(row);
        const rowClass = hasIssueEntry(issueEntry) ? 'tts-debug-row flagged' : 'tts-debug-row';
        const sentenceLabel = issueEntry.sentenceIssue
            ? t('ttsDebug.sentenceMarked')
            : t('ttsDebug.sentenceUnclear');
        const wordIssueControls = renderWordIssueControls(row, issueEntry);

        return `
            <div class="${rowClass}" data-row-id="${escapeHtml(row.id)}">
                <div class="tts-debug-row-main">
                    <div class="tts-debug-row-headline">${escapeHtml(t('ttsDebug.rowHeadline', {
                        row: row.rowNumber,
                        round: row.round,
                        source: row.sourceText
                    }))}</div>
                    <div class="tts-debug-row-hebrew">${escapeHtml(row.hebrewVocalized || row.hebrew)}</div>
                    <div class="tts-debug-row-meta">${escapeHtml(formatRowMeta(row))}</div>
                    <div class="tts-debug-word-grid">${wordIssueControls}</div>
                </div>
                <button
                    type="button"
                    class="game-button tts-debug-sentence-flag"
                    data-action="toggle-sentence-issue"
                    data-id="${escapeHtml(row.id)}"
                    aria-pressed="${issueEntry.sentenceIssue ? 'true' : 'false'}"
                >${sentenceLabel}</button>
                <button type="button" class="game-button tts-debug-play" data-action="play" data-id="${escapeHtml(row.id)}">${t('ttsDebug.listen')}</button>
            </div>
        `;
    }

    function renderList() {
        if (!dom.list) return;

        const visibleRows = getVisibleRows();
        const total = state.rows.length;
        const sentenceIssueCount = countSentenceIssues();
        const wordIssueCount = countWordIssues();
        const issueRowCount = countIssueRows();

        if (total === 0) {
            dom.list.innerHTML = `<div class="tts-debug-empty">${escapeHtml(t('ttsDebug.emptyLoading'))}</div>`;
            setStatus(t('ttsDebug.noData'));
            return;
        }

        if (visibleRows.length === 0) {
            dom.list.innerHTML = `<div class="tts-debug-empty">${escapeHtml(t('ttsDebug.noFilterMatch'))}</div>`;
            setStatus(t('ttsDebug.statusFilter', {
                visible: 0,
                total,
                sentences: sentenceIssueCount,
                wordIssues: wordIssueCount
            }));
            return;
        }

        dom.list.innerHTML = visibleRows.map(renderRow).join('');
        setStatus(t('ttsDebug.statusEntries', {
            visible: visibleRows.length,
            total,
            issueRows: issueRowCount,
            sentences: sentenceIssueCount,
            wordIssues: wordIssueCount
        }));
    }

    function toggleSentenceIssue(rowId) {
        if (!state.rowsById.has(rowId)) return;
        const issueEntry = getIssueEntry(rowId);
        issueEntry.sentenceIssue = !issueEntry.sentenceIssue;

        if (!hasIssueEntry(issueEntry)) {
            delete state.issueMap[rowId];
        }

        saveIssueMap();
        renderList();
    }

    function toggleWordIssue(rowId, wordIndex, issueKind) {
        if (!state.rowsById.has(rowId)) return;
        if (!Number.isInteger(wordIndex) || wordIndex < 0) return;
        if (issueKind !== 'wrongStress' && issueKind !== 'weirdPronunciation') return;

        const row = state.rowsById.get(rowId);
        if (!row || wordIndex >= row.spokenTokens.length) return;

        const issueEntry = getIssueEntry(rowId);
        const wordKey = String(wordIndex);
        if (!issueEntry.words[wordKey]) {
            issueEntry.words[wordKey] = { wrongStress: false, weirdPronunciation: false };
        }
        issueEntry.words[wordKey][issueKind] = !issueEntry.words[wordKey][issueKind];

        const updatedWord = issueEntry.words[wordKey];
        if (!updatedWord.wrongStress && !updatedWord.weirdPronunciation) {
            delete issueEntry.words[wordKey];
        }

        if (!hasIssueEntry(issueEntry)) {
            delete state.issueMap[rowId];
        }

        saveIssueMap();
        renderList();
    }

    function buildClipboardReport(rows) {
        const lines = [];
        const timestamp = new Date().toISOString();
        lines.push(t('ttsDebug.reportTitle'));
        lines.push(t('ttsDebug.reportCreated', { timestamp }));
        lines.push('round,german,hebrew,english,hebrew_vocalized,tts_text,spoken_text,issue_level,issue_type,word_index,word_text,notes');

        rows.forEach((row) => {
            const issueEntry = getIssueDetailsForRow(row);

            if (issueEntry.sentenceIssue) {
                lines.push([
                    row.round,
                    row.german,
                    row.hebrew,
                    row.english,
                    row.hebrewVocalized,
                    row.ttsText,
                    row.spokenText,
                    'sentence',
                    'unclear_or_unnatural',
                    '',
                    '',
                    ''
                ].map(csvEscape).join(','));
            }

            Object.keys(issueEntry.words || {}).forEach((wordKey) => {
                const wordIndex = Number(wordKey);
                if (!Number.isInteger(wordIndex)) return;
                const token = row.spokenTokens[wordIndex] || '';
                const wordIssue = issueEntry.words[wordKey];
                if (!wordIssue) return;

                if (wordIssue.wrongStress) {
                    lines.push([
                        row.round,
                        row.german,
                        row.hebrew,
                        row.english,
                        row.hebrewVocalized,
                        row.ttsText,
                        row.spokenText,
                        'word',
                        'wrong_stress',
                        wordIndex + 1,
                        token,
                        ''
                    ].map(csvEscape).join(','));
                }

                if (wordIssue.weirdPronunciation) {
                    lines.push([
                        row.round,
                        row.german,
                        row.hebrew,
                        row.english,
                        row.hebrewVocalized,
                        row.ttsText,
                        row.spokenText,
                        'word',
                        'weird_pronunciation',
                        wordIndex + 1,
                        token,
                        ''
                    ].map(csvEscape).join(','));
                }
            });
        });

        return lines.join('\n');
    }

    async function copyTextToClipboard(text) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text);
            return;
        }

        const helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', 'true');
        helper.style.position = 'fixed';
        helper.style.top = '-9999px';
        helper.style.left = '-9999px';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        document.body.removeChild(helper);
    }

    async function copyFlaggedRows() {
        const issueRows = getIssueRows();
        if (issueRows.length === 0) {
            setStatus(t('ttsDebug.copyNone'));
            return;
        }

        try {
            await copyTextToClipboard(buildClipboardReport(issueRows));
            setStatus(t('ttsDebug.copySuccess', { count: issueRows.length }));
        } catch (_error) {
            setStatus(t('ttsDebug.copyFailed'));
        }
    }

    function clearFlags() {
        if (Object.keys(state.issueMap).length === 0) {
            setStatus(t('ttsDebug.clearNone'));
            return;
        }

        state.issueMap = {};
        saveIssueMap();
        renderList();
        setStatus(t('ttsDebug.clearDone'));
    }

    function speakRow(rowId) {
        const row = state.rowsById.get(rowId);
        if (!row) return;

        const ttsApi = window.HebrewGame && window.HebrewGame.tts
            ? window.HebrewGame.tts
            : null;

        if (!ttsApi) {
            setStatus(t('ttsDebug.ttsUnavailable'));
            return;
        }

        let didSpeak = false;
        if (typeof ttsApi.speakText === 'function') {
            didSpeak = !!ttsApi.speakText(row.spokenText);
        } else if (
            typeof ttsApi.onPromptChanged === 'function' &&
            typeof ttsApi.speakCurrentPrompt === 'function'
        ) {
            ttsApi.onPromptChanged({
                german: row.german,
                hebrew: row.hebrew,
                hebrewVocalized: row.hebrewVocalized,
                ttsText: row.ttsText,
                english: row.english
            }, 'tts-debug-review');
            didSpeak = !!ttsApi.speakCurrentPrompt();
        }

        if (didSpeak) {
            setStatus(t('ttsDebug.playing', {
                row: row.rowNumber,
                round: row.round
            }));
        } else {
            setStatus(t('ttsDebug.playFailed', { row: row.rowNumber }));
        }
    }

    function openPanel() {
        if (!dom.panel) return;
        state.isOpen = true;
        dom.panel.classList.remove('hidden');
        dom.panel.setAttribute('aria-hidden', 'false');
        refreshRows();
        if (dom.filterInput) {
            dom.filterInput.focus();
        }
    }

    function closePanel() {
        if (!dom.panel) return;
        state.isOpen = false;
        dom.panel.classList.add('hidden');
        dom.panel.setAttribute('aria-hidden', 'true');
    }

    function onListClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const rowId = normalizeSpaces(button.getAttribute('data-id'));
        if (!rowId) return;

        if (action === 'play') {
            speakRow(rowId);
            return;
        }

        if (action === 'toggle-sentence-issue') {
            toggleSentenceIssue(rowId);
            return;
        }

        if (action === 'toggle-word-issue') {
            const wordIndexRaw = button.getAttribute('data-word-index');
            const issueKind = normalizeSpaces(button.getAttribute('data-kind'));
            const wordIndex = Number(wordIndexRaw);
            if (!Number.isInteger(wordIndex)) return;
            toggleWordIssue(rowId, wordIndex, issueKind);
        }
    }

    function onFilterInput(event) {
        state.filterQuery = normalizeSpaces(event.target.value || '').toLowerCase();
        renderList();
    }

    function cacheDom() {
        dom.openButton = document.getElementById('open-tts-debug');
        dom.panel = document.getElementById('tts-debug-panel');
        dom.closeButton = document.getElementById('close-tts-debug');
        dom.filterInput = document.getElementById('tts-debug-filter');
        dom.copyButton = document.getElementById('tts-debug-copy-flagged');
        dom.clearButton = document.getElementById('tts-debug-clear-flagged');
        dom.status = document.getElementById('tts-debug-status');
        dom.list = document.getElementById('tts-debug-list');
    }

    function bindEvents() {
        if (dom.openButton) {
            dom.openButton.addEventListener('click', openPanel);
        }

        if (dom.closeButton) {
            dom.closeButton.addEventListener('click', closePanel);
        }

        if (dom.panel) {
            dom.panel.addEventListener('click', function onPanelBackdropClick(event) {
                if (event.target === dom.panel) {
                    closePanel();
                }
            });
        }

        if (dom.list) {
            dom.list.addEventListener('click', onListClick);
        }

        if (dom.filterInput) {
            dom.filterInput.addEventListener('input', onFilterInput);
        }

        if (dom.copyButton) {
            dom.copyButton.addEventListener('click', function onCopyFlaggedClick() {
                copyFlaggedRows();
            });
        }

        if (dom.clearButton) {
            dom.clearButton.addEventListener('click', clearFlags);
        }

        document.addEventListener('keydown', function onEscape(event) {
            if (!state.isOpen) return;
            if (event.key === 'Escape') {
                closePanel();
            }
        });

        window.addEventListener('hebrewGame:dataReady', function onDataReady() {
            if (!state.isOpen) return;
            refreshRows();
        });

        window.addEventListener('hebrewGame:languageChanged', function onLanguageChanged() {
            if (state.isOpen) {
                refreshRows();
            }
        });
    }

    function exposeDebugApi() {
        window.HebrewGame = window.HebrewGame || {};
        window.HebrewGame.debug = window.HebrewGame.debug || {};
        window.HebrewGame.debug.getTtsFlaggedRows = function getTtsFlaggedRows() {
            return getIssueRows().map((row) => ({
                round: row.round,
                german: row.german,
                hebrew: row.hebrew,
                english: row.english,
                hebrewVocalized: row.hebrewVocalized,
                ttsText: row.ttsText,
                spokenText: row.spokenText,
                issues: getIssueDetailsForRow(row)
            }));
        };
        window.HebrewGame.debug.clearTtsFlaggedRows = function clearTtsFlaggedRows() {
            clearFlags();
        };
    }

    function initialize() {
        cacheDom();
        if (!dom.openButton || !dom.panel || !dom.list) return;

        bindEvents();
        renderList();
        exposeDebugApi();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
