/**
 * Hebrew prompt speech using browser Web Speech API.
 * No external service dependency in v1.
 */
(function bootstrapTts() {
    const HebrewGame = window.HebrewGame = window.HebrewGame || {};
    const ttsApi = HebrewGame.tts = HebrewGame.tts || {};

    const AUTO_READ_STORAGE_KEY = 'hebrewGame_ttsAutoRead_v1';
    const DEFAULT_AUTO_READ = true;
    const DEFAULT_LANG = 'he-IL';
    const AUTO_READ_DELAY_MS = 1000;
    const JOYFUL_RATE = 0.98;
    const JOYFUL_PITCH = 1.14;
    const SHORT_WORD_RATE = 0.86;
    const SHORT_WORD_PITCH = 1.06;
    const JOYFUL_VOLUME = 1;
    const STRESS_HINT_OVERRIDES = Object.freeze({
        'מים': 'מַֽיִם',
        'מַיִם': 'מַֽיִם',
        'ספר': 'סֵֽפֶר',
        'סֵפֶר': 'סֵֽפֶר',
        'הספר': 'הַסֵּֽפֶר',
        'הַסֵּפֶר': 'הַסֵּֽפֶר'
    });
    const PREFERRED_VOICE_NAME_PATTERNS = Object.freeze([
        /siri/i,
        /premium/i,
        /enhanced/i,
        /neural/i,
        /natural/i,
        /google/i
    ]);
    const DISFAVORED_VOICE_NAME_PATTERNS = Object.freeze([
        /compact/i,
        /legacy/i,
        /espeak/i,
        /eloquence/i
    ]);

    const supportsSpeech = typeof window.speechSynthesis !== 'undefined' &&
        typeof window.SpeechSynthesisUtterance === 'function';
    const speechEngine = supportsSpeech ? window.speechSynthesis : null;

    let currentPrompt = null;
    let selectedVoice = null;
    let voicesResolved = false;
    let missingVoiceNoticeShown = false;
    let lastError = null;
    let autoReadTimerId = null;
    let promptVersion = 0;

    let autoReadEnabled = loadAutoReadPreference();

    function normalizeSpaces(text) {
        return String(text || '').replace(/\s+/g, ' ').trim();
    }

    function loadAutoReadPreference() {
        try {
            const stored = localStorage.getItem(AUTO_READ_STORAGE_KEY);
            if (stored === null) return DEFAULT_AUTO_READ;
            return stored === '1';
        } catch (error) {
            return DEFAULT_AUTO_READ;
        }
    }

    function saveAutoReadPreference(value) {
        try {
            localStorage.setItem(AUTO_READ_STORAGE_KEY, value ? '1' : '0');
        } catch (error) {
            // Ignore storage failures (private mode / quota).
        }
    }

    function scoreHebrewVoice(voice) {
        const lang = normalizeSpaces(voice && voice.lang).toLowerCase();
        const name = normalizeSpaces(voice && voice.name);
        const voiceUri = normalizeSpaces(voice && voice.voiceURI);
        const lowerName = name.toLowerCase();
        const lowerVoiceUri = voiceUri.toLowerCase();

        if (!lang.startsWith('he')) return Number.NEGATIVE_INFINITY;

        let score = 0;
        if (lang === 'he-il') score += 40;
        else score += 20;

        if (voice && voice.default) score += 4;
        if (voice && voice.localService === false) score += 3;

        PREFERRED_VOICE_NAME_PATTERNS.forEach(function addPreferredPatternBoost(pattern) {
            if (pattern.test(lowerName) || pattern.test(lowerVoiceUri)) {
                score += 3;
            }
        });

        DISFAVORED_VOICE_NAME_PATTERNS.forEach(function addDisfavoredPatternPenalty(pattern) {
            if (pattern.test(lowerName) || pattern.test(lowerVoiceUri)) {
                score -= 6;
            }
        });

        return score;
    }

    function chooseHebrewVoice(voices) {
        if (!Array.isArray(voices) || voices.length === 0) return null;

        const rankedVoices = voices
            .map(function toScoredVoice(voice, index) {
                return {
                    voice,
                    index,
                    score: scoreHebrewVoice(voice)
                };
            })
            .filter(function keepHebrew(scored) {
                return Number.isFinite(scored.score);
            })
            .sort(function sortByScoreDescending(left, right) {
                if (right.score !== left.score) return right.score - left.score;
                return left.index - right.index;
            });

        return rankedVoices.length > 0 ? rankedVoices[0].voice : null;
    }

    function getSpeechTextForWordData(wordData) {
        if (!wordData || typeof wordData !== 'object') return '';

        const ttsText = normalizeSpaces(wordData.ttsText || wordData.tts_text || '');
        if (ttsText) return ttsText;

        const hebrewVocalized = normalizeSpaces(wordData.hebrewVocalized || wordData.hebrew_vocalized || '');
        if (hebrewVocalized) return hebrewVocalized;

        return normalizeSpaces(wordData.hebrew || '');
    }

    function applyStressHints(text) {
        const cleaned = normalizeSpaces(text);
        if (!cleaned) return '';

        return cleaned
            .split(' ')
            .filter(Boolean)
            .map(function mapStressHint(token) {
                return STRESS_HINT_OVERRIDES[token] || token;
            })
            .join(' ');
    }

    function getHebrewLetterCount(text) {
        const matches = String(text || '').match(/[\u05D0-\u05EA]/g);
        return matches ? matches.length : 0;
    }

    function getSpeechPlanForText(text) {
        const cleaned = normalizeSpaces(text);
        if (!cleaned) {
            return {
                text: '',
                rate: JOYFUL_RATE,
                pitch: JOYFUL_PITCH
            };
        }

        const preparedText = applyStressHints(cleaned);
        const tokens = preparedText.split(' ').filter(Boolean);
        let plannedText = preparedText;
        let plannedRate = JOYFUL_RATE;
        let plannedPitch = JOYFUL_PITCH;

        if (tokens.length === 1) {
            const hebrewLetterCount = getHebrewLetterCount(tokens[0]);

            if (hebrewLetterCount > 0 && hebrewLetterCount <= 3) {
                // Short Hebrew words are often clipped or flattened by browser TTS at fast/pitched settings.
                plannedRate = SHORT_WORD_RATE;
                plannedPitch = SHORT_WORD_PITCH;
                plannedText = `${tokens[0]}.`;
            } else if (hebrewLetterCount > 0 && hebrewLetterCount <= 5) {
                plannedRate = 0.92;
                plannedPitch = 1.1;
            }
        }

        return {
            text: plannedText,
            rate: plannedRate,
            pitch: plannedPitch
        };
    }

    function refreshVoiceSelection() {
        if (!speechEngine) {
            voicesResolved = true;
            selectedVoice = null;
            updateControls();
            return;
        }

        const voices = speechEngine.getVoices();
        if (Array.isArray(voices) && voices.length > 0) {
            voicesResolved = true;
            selectedVoice = chooseHebrewVoice(voices);
        } else {
            selectedVoice = null;
        }

        updateControls();
    }

    function ensureVoiceSelected() {
        if (!speechEngine) return false;
        if (selectedVoice) return true;

        refreshVoiceSelection();
        if (selectedVoice) return true;

        // If voices are still unresolved, attempt one final direct read.
        const voices = speechEngine.getVoices();
        if (Array.isArray(voices) && voices.length > 0) {
            voicesResolved = true;
            selectedVoice = chooseHebrewVoice(voices);
        } else {
            voicesResolved = true;
        }

        return !!selectedVoice;
    }

    function showMissingVoiceNoticeOnce() {
        if (missingVoiceNoticeShown) return;
        missingVoiceNoticeShown = true;

        if (typeof window.toast === 'function') {
            window.toast({
                title: 'Keine hebräische Stimme gefunden',
                description: 'Vorlesen ist deaktiviert. Installiere eine hebräische Stimme im Browser oder Betriebssystem.',
                variant: 'default'
            });
            return;
        }

        if (window.console) {
            console.warn('No Hebrew TTS voice available. Speech controls are disabled.');
        }
    }

    function setButtonState(button, enabled) {
        if (!button) return;
        button.disabled = !enabled;
        button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    }

    function clearAutoReadTimer() {
        if (autoReadTimerId !== null) {
            window.clearTimeout(autoReadTimerId);
            autoReadTimerId = null;
        }
    }

    function scheduleAutoReadForCurrentPrompt() {
        clearAutoReadTimer();

        if (!autoReadEnabled || !currentPrompt || !currentPrompt.text) {
            return false;
        }

        const scheduledPromptVersion = promptVersion;
        autoReadTimerId = window.setTimeout(function autoReadTimerHandler() {
            autoReadTimerId = null;

            if (!autoReadEnabled) return;
            if (scheduledPromptVersion !== promptVersion) return;
            if (!currentPrompt || !currentPrompt.text) return;

            speakResolvedText(currentPrompt.text);
        }, AUTO_READ_DELAY_MS);

        return true;
    }

    function updateControls() {
        const playButton = document.getElementById('play-hebrew-audio');
        const autoToggleButton = document.getElementById('toggle-auto-read');
        const playLabel = playButton ? playButton.querySelector('.play-label') : null;
        const autoToggleLabel = autoToggleButton ? autoToggleButton.querySelector('.toggle-label') : null;

        const hasPrompt = !!(currentPrompt && currentPrompt.text);
        const voiceReady = !!selectedVoice;
        const canSpeak = supportsSpeech && voiceReady;

        if (playButton) {
            let playButtonText = 'Vorlesen';
            if (!supportsSpeech) {
                playButtonText = 'Audio nicht verfügbar';
            } else if (!voiceReady) {
                playButtonText = 'Keine hebr. Stimme';
            }
            if (playLabel) {
                playLabel.textContent = playButtonText;
            } else {
                playButton.textContent = playButtonText;
            }

            setButtonState(playButton, canSpeak && hasPrompt);
            playButton.setAttribute(
                'aria-label',
                canSpeak && hasPrompt
                    ? 'Hebräischen Text vorlesen'
                    : 'Hebräisches Vorlesen nicht verfügbar'
            );
        }

        if (autoToggleButton) {
            const autoButtonText = autoReadEnabled ? 'Auto an' : 'Auto aus';
            if (autoToggleLabel) {
                autoToggleLabel.textContent = autoButtonText;
            } else {
                autoToggleButton.textContent = autoButtonText;
            }
            autoToggleButton.setAttribute('aria-pressed', autoReadEnabled ? 'true' : 'false');
            autoToggleButton.setAttribute(
                'aria-label',
                autoReadEnabled
                    ? 'Automatisches Vorlesen deaktivieren'
                    : 'Automatisches Vorlesen aktivieren'
            );
            setButtonState(autoToggleButton, canSpeak);
        }
    }

    function speakResolvedText(text) {
        if (!supportsSpeech) {
            updateControls();
            return false;
        }

        if (!ensureVoiceSelected()) {
            updateControls();
            showMissingVoiceNoticeOnce();
            return false;
        }

        const cleanedText = normalizeSpaces(text);
        if (!cleanedText) {
            updateControls();
            return false;
        }

        const speechPlan = getSpeechPlanForText(cleanedText);

        try {
            speechEngine.cancel();
            const utterance = new window.SpeechSynthesisUtterance(speechPlan.text);
            utterance.lang = DEFAULT_LANG;
            utterance.rate = speechPlan.rate;
            utterance.pitch = speechPlan.pitch;
            utterance.volume = JOYFUL_VOLUME;
            utterance.voice = selectedVoice;
            utterance.onerror = function onUtteranceError(event) {
                const errorCode = event && event.error ? String(event.error) : 'tts_error';
                lastError = errorCode;
            };
            speechEngine.speak(utterance);
            return true;
        } catch (error) {
            lastError = String(error && error.message ? error.message : error);
            updateControls();
            return false;
        }
    }

    function buildPrompt(wordData) {
        if (!wordData || typeof wordData !== 'object') return null;

        return {
            text: getSpeechTextForWordData(wordData),
            hebrew: normalizeSpaces(wordData.hebrew || ''),
            german: normalizeSpaces(wordData.german || ''),
            english: normalizeSpaces(wordData.english || '')
        };
    }

    function onPromptChanged(wordData, source) {
        clearAutoReadTimer();
        currentPrompt = buildPrompt(wordData);
        promptVersion += 1;
        updateControls();

        if (!currentPrompt || !currentPrompt.text) return false;
        if (!autoReadEnabled) return false;

        return scheduleAutoReadForCurrentPrompt();
    }

    function speakCurrentPrompt() {
        clearAutoReadTimer();
        if (!currentPrompt || !currentPrompt.text) {
            updateControls();
            return false;
        }
        return speakResolvedText(currentPrompt.text);
    }

    function speakText(text) {
        clearAutoReadTimer();
        return speakResolvedText(text);
    }

    function setAutoReadEnabled(nextValue) {
        autoReadEnabled = !!nextValue;
        saveAutoReadPreference(autoReadEnabled);
        updateControls();

        if (autoReadEnabled) {
            scheduleAutoReadForCurrentPrompt();
        } else {
            clearAutoReadTimer();
        }

        return autoReadEnabled;
    }

    function isAutoReadEnabled() {
        return !!autoReadEnabled;
    }

    function getVoiceStatus() {
        return {
            supported: supportsSpeech,
            voicesResolved: !!voicesResolved,
            voiceReady: !!selectedVoice,
            voiceName: selectedVoice ? selectedVoice.name : null,
            voiceLang: selectedVoice ? selectedVoice.lang : null,
            voiceRate: JOYFUL_RATE,
            voicePitch: JOYFUL_PITCH,
            autoReadEnabled: !!autoReadEnabled,
            hasPrompt: !!(currentPrompt && currentPrompt.text),
            lastError
        };
    }

    if (speechEngine) {
        if (typeof speechEngine.addEventListener === 'function') {
            speechEngine.addEventListener('voiceschanged', refreshVoiceSelection);
        } else if ('onvoiceschanged' in speechEngine) {
            speechEngine.onvoiceschanged = refreshVoiceSelection;
        }
        refreshVoiceSelection();
    }

    document.addEventListener('DOMContentLoaded', function onDomContentLoaded() {
        updateControls();
    });

    window.addEventListener('beforeunload', function onBeforeUnload() {
        clearAutoReadTimer();
        if (speechEngine) {
            speechEngine.cancel();
        }
    });

    ttsApi.onPromptChanged = onPromptChanged;
    ttsApi.speakCurrentPrompt = speakCurrentPrompt;
    ttsApi.speakText = speakText;
    ttsApi.setAutoReadEnabled = setAutoReadEnabled;
    ttsApi.isAutoReadEnabled = isAutoReadEnabled;
    ttsApi.applyStressHints = applyStressHints;
    ttsApi.getSpeechPlan = getSpeechPlanForText;
    ttsApi.getVoiceStatus = getVoiceStatus;
})();
