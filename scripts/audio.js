/**
 * Lightweight retro SFX using Web Audio.
 * Generates sounds procedurally to avoid external audio assets.
 */
(function bootstrapAudio() {
    const HebrewGame = window.HebrewGame = window.HebrewGame || {};
    const audioApi = HebrewGame.audio = HebrewGame.audio || {};

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const supportsAudio = typeof AudioCtx === 'function';
    const MASTER_LEVEL = 0.18;
    const SOUND_COOLDOWNS = {
        uiClick: 45,
        typeLetter: 20,
        deleteLetter: 30,
        letterCorrect: 60,
        letterWrong: 90,
        submit: 120,
        checkStart: 130,
        bonusBuy: 90,
        bonusUse: 90,
        bonusNoFunds: 120
    };

    let context = null;
    let muted = false;
    const lastPlayedAt = new Map();
    let noiseBuffer = null;

    function ensureContext() {
        if (!supportsAudio) return null;
        if (!context) {
            try {
                context = new AudioCtx();
            } catch (error) {
                return null;
            }
        }
        return context;
    }

    function unlockContext() {
        const ctx = ensureContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
    }

    function nowMs() {
        return Date.now();
    }

    function shouldThrottle(soundName) {
        const cooldown = SOUND_COOLDOWNS[soundName] || 0;
        if (!cooldown) return false;
        const now = nowMs();
        const last = lastPlayedAt.get(soundName) || 0;
        if ((now - last) < cooldown) return true;
        lastPlayedAt.set(soundName, now);
        return false;
    }

    function clampLevel(level) {
        const numeric = Number(level);
        if (!Number.isFinite(numeric)) return 0;
        return Math.max(0, Math.min(1, numeric));
    }

    function safeFrequency(freq) {
        const numeric = Number(freq);
        if (!Number.isFinite(numeric)) return 220;
        return Math.max(40, numeric);
    }

    function scheduleTone(config = {}) {
        const ctx = ensureContext();
        if (!ctx) return;

        const {
            type = 'square',
            freq = 440,
            endFreq = null,
            level = 0.35,
            startOffset = 0,
            duration = 0.08,
            attack = 0.003
        } = config;

        const startTime = ctx.currentTime + Math.max(0, Number(startOffset) || 0);
        const endTime = startTime + Math.max(0.02, Number(duration) || 0.08);
        const gainValue = Math.max(0.00015, clampLevel(level) * MASTER_LEVEL);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(safeFrequency(freq), startTime);
        if (endFreq !== null && endFreq !== undefined) {
            osc.frequency.exponentialRampToValueAtTime(safeFrequency(endFreq), endTime);
        }

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(gainValue, startTime + Math.max(0.001, attack));
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(endTime + 0.01);
    }

    function getNoiseBuffer() {
        const ctx = ensureContext();
        if (!ctx) return null;
        if (noiseBuffer) return noiseBuffer;

        const size = Math.max(2048, Math.floor(ctx.sampleRate * 0.2));
        const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < size; i++) {
            channelData[i] = (Math.random() * 2) - 1;
        }
        noiseBuffer = buffer;
        return noiseBuffer;
    }

    function scheduleNoise(config = {}) {
        const ctx = ensureContext();
        if (!ctx) return;

        const {
            level = 0.2,
            startOffset = 0,
            duration = 0.06,
            highpass = 400
        } = config;

        const buffer = getNoiseBuffer();
        if (!buffer) return;

        const startTime = ctx.currentTime + Math.max(0, Number(startOffset) || 0);
        const endTime = startTime + Math.max(0.02, Number(duration) || 0.06);
        const gainValue = Math.max(0.00015, clampLevel(level) * MASTER_LEVEL);

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const highpassFilter = ctx.createBiquadFilter();
        highpassFilter.type = 'highpass';
        highpassFilter.frequency.setValueAtTime(Math.max(120, Number(highpass) || 400), startTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        source.connect(highpassFilter);
        highpassFilter.connect(gain);
        gain.connect(ctx.destination);

        source.start(startTime);
        source.stop(endTime + 0.01);
    }

    function playSound(soundName, options = {}) {
        if (muted || !supportsAudio) return false;
        if (shouldThrottle(soundName)) return false;

        const ctx = ensureContext();
        if (!ctx) return false;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        switch (soundName) {
            case 'uiClick':
                scheduleTone({ type: 'square', freq: 910, endFreq: 760, level: 0.22, duration: 0.03 });
                break;

            case 'typeLetter':
                scheduleTone({ type: 'triangle', freq: 1180, endFreq: 960, level: 0.18, duration: 0.028 });
                break;

            case 'deleteLetter':
                scheduleTone({ type: 'square', freq: 560, endFreq: 300, level: 0.2, duration: 0.06 });
                break;

            case 'submit':
                scheduleTone({ type: 'square', freq: 620, level: 0.2, duration: 0.04 });
                scheduleTone({ type: 'square', freq: 840, level: 0.18, duration: 0.05, startOffset: 0.03 });
                break;

            case 'checkStart':
                scheduleTone({ type: 'triangle', freq: 700, endFreq: 660, level: 0.17, duration: 0.035 });
                break;

            case 'letterCorrect':
                scheduleTone({ type: 'square', freq: 1040, endFreq: 1240, level: 0.2, duration: 0.05 });
                break;

            case 'letterWrong':
                scheduleTone({ type: 'sawtooth', freq: 260, endFreq: 170, level: 0.16, duration: 0.07 });
                scheduleNoise({ level: 0.06, duration: 0.05, highpass: 320, startOffset: 0.008 });
                break;

            case 'wordPerfect':
                scheduleTone({ type: 'square', freq: 523, level: 0.2, duration: 0.07 });
                scheduleTone({ type: 'square', freq: 659, level: 0.2, duration: 0.08, startOffset: 0.05 });
                scheduleTone({ type: 'square', freq: 784, level: 0.22, duration: 0.11, startOffset: 0.1 });
                break;

            case 'wordImperfect':
                scheduleTone({ type: 'triangle', freq: 300, endFreq: 205, level: 0.17, duration: 0.1 });
                break;

            case 'coin':
                scheduleTone({ type: 'square', freq: 1480, level: 0.23, duration: 0.05 });
                scheduleTone({ type: 'square', freq: 1960, level: 0.24, duration: 0.09, startOffset: 0.04 });
                break;

            case 'bonusUse':
                if (options && options.powerUpId === 'second_chance_round') {
                    scheduleTone({ type: 'triangle', freq: 430, level: 0.18, duration: 0.05 });
                    scheduleTone({ type: 'triangle', freq: 640, level: 0.2, duration: 0.08, startOffset: 0.04 });
                } else if (options && options.powerUpId === 'double_points') {
                    scheduleTone({ type: 'square', freq: 560, level: 0.16, duration: 0.04 });
                    scheduleTone({ type: 'square', freq: 1120, level: 0.2, duration: 0.09, startOffset: 0.03 });
                } else if (options && options.powerUpId === 'letter_filter') {
                    scheduleTone({ type: 'triangle', freq: 960, level: 0.16, duration: 0.05 });
                    scheduleTone({ type: 'triangle', freq: 740, level: 0.15, duration: 0.06, startOffset: 0.03 });
                } else if (options && options.powerUpId === 'easier_word') {
                    scheduleTone({ type: 'square', freq: 820, endFreq: 600, level: 0.18, duration: 0.08 });
                    scheduleTone({ type: 'square', freq: 690, endFreq: 540, level: 0.15, duration: 0.07, startOffset: 0.03 });
                } else {
                    scheduleTone({ type: 'square', freq: 620, level: 0.18, duration: 0.05 });
                    scheduleTone({ type: 'square', freq: 820, level: 0.2, duration: 0.07, startOffset: 0.045 });
                    scheduleTone({ type: 'square', freq: 980, level: 0.18, duration: 0.08, startOffset: 0.095 });
                }
                break;

            case 'bonusBuy':
                scheduleTone({ type: 'square', freq: 740, level: 0.16, duration: 0.04 });
                scheduleTone({ type: 'square', freq: 1080, level: 0.2, duration: 0.07, startOffset: 0.03 });
                scheduleTone({ type: 'square', freq: 1560, level: 0.18, duration: 0.08, startOffset: 0.07 });
                break;

            case 'bonusNoFunds':
                scheduleTone({ type: 'sawtooth', freq: 240, endFreq: 140, level: 0.14, duration: 0.11 });
                scheduleNoise({ level: 0.05, duration: 0.07, highpass: 240, startOffset: 0.01 });
                break;

            case 'secondChance':
                scheduleTone({ type: 'triangle', freq: 390, level: 0.16, duration: 0.06 });
                scheduleTone({ type: 'triangle', freq: 520, level: 0.18, duration: 0.08, startOffset: 0.055 });
                break;

            case 'roundStart':
                scheduleTone({ type: 'square', freq: 510, level: 0.18, duration: 0.05 });
                scheduleTone({ type: 'square', freq: 760, level: 0.2, duration: 0.08, startOffset: 0.05 });
                break;

            case 'roundComplete':
                scheduleTone({ type: 'square', freq: 392, level: 0.19, duration: 0.08 });
                scheduleTone({ type: 'square', freq: 523, level: 0.2, duration: 0.09, startOffset: 0.06 });
                scheduleTone({ type: 'square', freq: 659, level: 0.22, duration: 0.12, startOffset: 0.12 });
                break;

            case 'storeOpen':
                scheduleTone({ type: 'triangle', freq: 470, level: 0.15, duration: 0.05 });
                scheduleTone({ type: 'triangle', freq: 700, level: 0.17, duration: 0.08, startOffset: 0.04 });
                break;

            case 'storeClose':
                scheduleTone({ type: 'triangle', freq: 620, endFreq: 420, level: 0.14, duration: 0.08 });
                break;

            case 'gameComplete':
                scheduleTone({ type: 'square', freq: 392, level: 0.17, duration: 0.09 });
                scheduleTone({ type: 'square', freq: 523, level: 0.18, duration: 0.1, startOffset: 0.08 });
                scheduleTone({ type: 'square', freq: 659, level: 0.2, duration: 0.11, startOffset: 0.16 });
                scheduleTone({ type: 'square', freq: 784, level: 0.22, duration: 0.16, startOffset: 0.24 });
                break;

            default:
                return false;
        }

        return true;
    }

    function setMuted(nextMuted) {
        muted = !!nextMuted;
        return muted;
    }

    function isMuted() {
        return muted;
    }

    function shouldIgnoreButtonForDefaultClick(button) {
        if (!button) return true;
        if (button.disabled) return true;
        if (button.classList.contains('keyboard-key')) return true;
        if (button.id === 'submit-word') return true;
        if (button.classList.contains('power-up-button')) return true;
        if (button.id && button.id.indexOf('buy-') === 0) return true;
        return false;
    }

    document.addEventListener('click', function handleAnyButtonClick(event) {
        const button = event.target instanceof Element ? event.target.closest('button') : null;
        if (!button || shouldIgnoreButtonForDefaultClick(button)) return;
        playSound('uiClick');
    }, true);

    document.addEventListener('click', unlockContext, { capture: true });
    document.addEventListener('keydown', unlockContext, { capture: true });
    document.addEventListener('touchend', unlockContext, { capture: true, passive: true });

    audioApi.play = playSound;
    audioApi.setMuted = setMuted;
    audioApi.isMuted = isMuted;
    audioApi.supportsAudio = supportsAudio;
    audioApi.unlock = unlockContext;

    window.playGameSound = function playGameSound(soundName, options) {
        return playSound(soundName, options);
    };
})();
