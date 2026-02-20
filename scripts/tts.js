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
    const DEFAULT_RATE = 1;
    const DEFAULT_PITCH = 1;
    const DEFAULT_VOLUME = 1;

    function shouldDisableSpeechForAutomation() {
        if (window.__HEBREW_GAME_TTS_FORCE_ENABLE__ === true) return false;
        if (window.__HEBREW_GAME_DISABLE_TTS__ === true) return true;

        try {
            if (window.location && typeof window.location.search === 'string') {
                const searchParams = new URLSearchParams(window.location.search);
                if (searchParams.get('disableTts') === '1') {
                    return true;
                }
            }
        } catch (error) {
            // Ignore URL parsing errors and keep fallback checks.
        }

        return typeof navigator !== 'undefined' && navigator.webdriver === true;
    }

    const speechDisabledForAutomation = shouldDisableSpeechForAutomation();
    const supportsSpeech = !speechDisabledForAutomation &&
        typeof window.speechSynthesis !== 'undefined' &&
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

    function t(key, vars) {
        if (ttsApi && typeof ttsApi.t === 'function') {
            return ttsApi.t(key, vars);
        }
        if (HebrewGame.i18n && typeof HebrewGame.i18n.t === 'function') {
            return HebrewGame.i18n.t(key, vars);
        }
        return key;
    }

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

    function isHebrewVoice(voice) {
        const lang = normalizeSpaces(voice && voice.lang).toLowerCase();
        return lang.startsWith('he');
    }

    function chooseHebrewVoice(voices) {
        if (!Array.isArray(voices) || voices.length === 0) return null;

        const hebrewVoices = voices.filter(isHebrewVoice);
        if (hebrewVoices.length === 0) return null;

        const defaultHebrewVoice = hebrewVoices.find(function findDefaultHebrewVoice(voice) {
            return !!(voice && voice.default);
        });
        if (defaultHebrewVoice) return defaultHebrewVoice;

        return hebrewVoices[0];
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
        // Kept for API compatibility; default mode intentionally avoids word-level overrides.
        return normalizeSpaces(text);
    }

    function getSpeechPlanForText(text) {
        const cleaned = applyStressHints(text);

        return {
            text: cleaned,
            rate: DEFAULT_RATE,
            pitch: DEFAULT_PITCH
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
                title: t('tts.noVoiceTitle'),
                description: t('tts.noVoiceDesc'),
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
            let playButtonText = t('tts.read');
            if (!supportsSpeech) {
                playButtonText = t('tts.audioUnavailable');
            } else if (!voiceReady) {
                playButtonText = t('tts.noVoiceShort');
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
                    ? t('tts.readAria')
                    : t('tts.unavailableAria')
            );
        }

        if (autoToggleButton) {
            const autoButtonText = autoReadEnabled ? t('tts.autoOn') : t('tts.autoOff');
            if (autoToggleLabel) {
                autoToggleLabel.textContent = autoButtonText;
            } else {
                autoToggleButton.textContent = autoButtonText;
            }
            autoToggleButton.setAttribute('aria-pressed', autoReadEnabled ? 'true' : 'false');
            autoToggleButton.setAttribute(
                'aria-label',
                autoReadEnabled
                    ? t('tts.autoDisableAria')
                    : t('tts.autoEnableAria')
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
            utterance.volume = DEFAULT_VOLUME;
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
            disabledForAutomation: speechDisabledForAutomation,
            voicesResolved: !!voicesResolved,
            voiceReady: !!selectedVoice,
            voiceName: selectedVoice ? selectedVoice.name : null,
            voiceLang: selectedVoice ? selectedVoice.lang : null,
            voiceRate: DEFAULT_RATE,
            voicePitch: DEFAULT_PITCH,
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

    window.addEventListener('hebrewGame:languageChanged', function onLanguageChanged() {
        updateControls();
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
