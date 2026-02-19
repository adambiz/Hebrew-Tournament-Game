/**
 * Start screen helpers that do not own core lifecycle.
 */
(function startScreenModule() {
    const PLAYER_AVATAR_STORAGE_KEY = 'hebrewGame_playerAvatar_v1';
    const AVATAR_PAGE_SIZE = 12;
    const TITLE_WAVE_INTERVAL_MS = 8000;
    const TITLE_WAVE_STEP_DELAY_MS = 55;
    const TITLE_WAVE_DURATION_MS = 420;
    const TITLE_WAVE_CHAR_CLASS = 'title-char';
    const TITLE_WAVE_ACTIVE_CLASS = 'title-char-wave';
    const startScreenNamePool = [
        "RedstoneRex", "PikaFlash", "MiniMando", "SpiderZoom", "CreeperNova",
        "GregTheGreat", "DiamondDani", "JediJax", "CharmanderKai", "ThorBoom",
        "RowleyRocket", "EnderMia", "CaptainComet", "SaberSasha", "BlockyBen",
        "HulkSmashKid", "BulbaBuddy", "Noa", "Liam", "Maya"
    ];
    const avatarPickerState = {
        catalog: [],
        selectedPath: null,
        pageStart: 0
    };
    const retroAnimationState = {
        waveLoopIntervalId: null,
        waveTimeoutIds: []
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

    function getHeroesApi() {
        if (!window.HebrewGame || !window.HebrewGame.heroes) return null;
        return window.HebrewGame.heroes;
    }

    function extractAvatarId(avatarPath) {
        if (typeof avatarPath !== 'string') return null;
        const match = avatarPath.match(/portrait-with-border(\d+)\.png$/i);
        if (!match) return null;
        const parsed = Number(match[1]);
        return Number.isFinite(parsed) ? Math.floor(parsed) : null;
    }

    function loadStoredPlayerAvatar() {
        try {
            return localStorage.getItem(PLAYER_AVATAR_STORAGE_KEY);
        } catch (_error) {
            return null;
        }
    }

    function persistPlayerAvatar(avatarPath) {
        try {
            localStorage.setItem(PLAYER_AVATAR_STORAGE_KEY, avatarPath);
        } catch (_error) {
            // Ignore storage failures.
        }
    }

    function getAvatarCatalog() {
        const heroesApi = getHeroesApi();
        if (heroesApi && typeof heroesApi.getAvatarCatalog === 'function') {
            const catalog = heroesApi.getAvatarCatalog();
            if (Array.isArray(catalog) && catalog.length > 0) return catalog;
        }

        // Safe fallback in case heroes API is not ready for some reason.
        return [
            { id: 1, path: 'assets/images/3x/portrait-with-border1.png' },
            { id: 2, path: 'assets/images/3x/portrait-with-border2.png' },
            { id: 3, path: 'assets/images/3x/portrait-with-border3.png' },
            { id: 4, path: 'assets/images/3x/portrait-with-border4.png' },
            { id: 5, path: 'assets/images/3x/portrait-with-border5.png' },
            { id: 6, path: 'assets/images/3x/portrait-with-border6.png' },
            { id: 7, path: 'assets/images/3x/portrait-with-border7.png' },
            { id: 8, path: 'assets/images/3x/portrait-with-border8.png' },
            { id: 9, path: 'assets/images/3x/portrait-with-border9.png' },
            { id: 10, path: 'assets/images/3x/portrait-with-border10.png' },
            { id: 11, path: 'assets/images/3x/portrait-with-border11.png' },
            { id: 12, path: 'assets/images/3x/portrait-with-border12.png' }
        ];
    }

    function normalizeAvatarPath(avatarPath) {
        const heroesApi = getHeroesApi();
        if (heroesApi && typeof heroesApi.normalizeAvatarPath === 'function') {
            return heroesApi.normalizeAvatarPath(avatarPath);
        }
        return avatarPath || null;
    }

    function getVisibleAvatarOptions() {
        if (!Array.isArray(avatarPickerState.catalog) || avatarPickerState.catalog.length === 0) {
            return [];
        }

        const visible = [];
        for (let i = 0; i < Math.min(AVATAR_PAGE_SIZE, avatarPickerState.catalog.length); i++) {
            const index = (avatarPickerState.pageStart + i) % avatarPickerState.catalog.length;
            visible.push(avatarPickerState.catalog[index]);
        }
        return visible;
    }

    function getSelectedAvatarPath() {
        if (avatarPickerState.selectedPath) {
            return avatarPickerState.selectedPath;
        }
        if (!avatarPickerState.catalog.length) {
            return 'assets/images/3x/portrait-with-border1.png';
        }
        return avatarPickerState.catalog[0].path;
    }

    function updateSelectedAvatarPreview() {
        const selectedPath = getSelectedAvatarPath();
        const previewImg = document.getElementById('selected-avatar-preview');
        const previewLabel = document.getElementById('selected-avatar-label');
        const avatarId = extractAvatarId(selectedPath);

        if (previewImg) {
            previewImg.src = selectedPath;
            previewImg.alt = avatarId
                ? t('start.selectedAvatarAltWithId', { id: avatarId })
                : t('start.selectedAvatarAlt');
        }

        if (previewLabel) {
            previewLabel.textContent = avatarId
                ? t('start.avatarLabelWithId', { id: avatarId })
                : t('start.avatarLabel');
        }
    }

    function setSelectedAvatar(avatarPath, options = {}) {
        const normalized = normalizeAvatarPath(avatarPath);
        if (!normalized) return;

        avatarPickerState.selectedPath = normalized;
        updateSelectedAvatarPreview();
        if (!options.skipPersist) {
            persistPlayerAvatar(normalized);
        }
        renderAvatarGrid();
    }

    function renderAvatarGrid() {
        const grid = document.getElementById('player-avatar-grid');
        if (!grid) return;

        grid.innerHTML = '';
        const visibleAvatars = getVisibleAvatarOptions();
        const selectedPath = getSelectedAvatarPath();

        visibleAvatars.forEach(function (avatar) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'avatar-choice';
            button.setAttribute('role', 'radio');
            button.setAttribute('aria-label', t('start.avatarChoiceAria', { id: avatar.id }));
            button.setAttribute('aria-checked', selectedPath === avatar.path ? 'true' : 'false');
            button.dataset.avatarPath = avatar.path;

            if (selectedPath === avatar.path) {
                button.classList.add('selected');
            }

            const image = document.createElement('img');
            image.className = 'hero-avatar hero-avatar-choice';
            image.src = avatar.path;
            image.alt = '';
            image.setAttribute('aria-hidden', 'true');
            image.loading = 'lazy';
            image.decoding = 'async';

            button.appendChild(image);
            button.addEventListener('click', function onAvatarClick() {
                setSelectedAvatar(avatar.path);
            });

            grid.appendChild(button);
        });
    }

    function showNextAvatarPage() {
        if (!avatarPickerState.catalog.length) return;
        avatarPickerState.pageStart = (avatarPickerState.pageStart + AVATAR_PAGE_SIZE) % avatarPickerState.catalog.length;
        renderAvatarGrid();
    }

    function initializeAvatarPicker() {
        const avatarGrid = document.getElementById('player-avatar-grid');
        if (!avatarGrid) return;

        avatarPickerState.catalog = getAvatarCatalog();
        avatarPickerState.pageStart = 0;

        const storedAvatar = normalizeAvatarPath(loadStoredPlayerAvatar());
        const defaultPath = storedAvatar || (avatarPickerState.catalog[0] && avatarPickerState.catalog[0].path);
        if (defaultPath) {
            avatarPickerState.selectedPath = defaultPath;
        }

        const selectedIndex = avatarPickerState.catalog.findIndex(function (avatar) {
            return avatar.path === avatarPickerState.selectedPath;
        });
        if (selectedIndex >= 0) {
            avatarPickerState.pageStart = Math.floor(selectedIndex / AVATAR_PAGE_SIZE) * AVATAR_PAGE_SIZE;
        }

        updateSelectedAvatarPreview();
        renderAvatarGrid();

        const shuffleButton = document.getElementById('shuffle-avatars');
        if (shuffleButton) {
            shuffleButton.addEventListener('click', showNextAvatarPage);
        }

        window.addEventListener('hebrewGame:languageChanged', function onLanguageChanged() {
            updateSelectedAvatarPreview();
            renderAvatarGrid();
        });
    }

    function initializeLanguagePicker() {
        const i18nApi = getI18nApi();
        const buttons = Array.from(document.querySelectorAll('.language-toggle-button[data-language]'));
        if (!buttons.length) return;

        function syncLanguageButtons(language) {
            buttons.forEach(function updateLanguageButton(button) {
                const buttonLanguage = button.dataset.language || '';
                const isActive = buttonLanguage === language;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-checked', isActive ? 'true' : 'false');
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        }

        const currentLanguage = i18nApi && typeof i18nApi.getLanguage === 'function'
            ? i18nApi.getLanguage()
            : 'en';
        syncLanguageButtons(currentLanguage);

        buttons.forEach(function bindLanguageButton(button) {
            button.addEventListener('click', function onLanguageClick() {
                const nextLanguage = button.dataset.language || '';
                if (!i18nApi || typeof i18nApi.setLanguage !== 'function') return;
                i18nApi.setLanguage(nextLanguage);
            });
        });

        window.addEventListener('hebrewGame:languageChanged', function onLanguageChanged(event) {
            const language = event && event.detail && event.detail.language
                ? event.detail.language
                : (i18nApi && typeof i18nApi.getLanguage === 'function' ? i18nApi.getLanguage() : 'en');
            syncLanguageButtons(language);
        });
    }

    function generateRandomName() {
        const randomName = startScreenNamePool[Math.floor(Math.random() * startScreenNamePool.length)];
        const playerNameInput = document.getElementById('player-name');

        if (!playerNameInput) return;

        playerNameInput.value = randomName;
        playerNameInput.classList.add('input-highlight');
        setTimeout(() => {
            playerNameInput.classList.remove('input-highlight');
        }, 1000);
    }

    function prefersReducedMotion() {
        return (
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        );
    }

    function clearPendingTitleWaveTimeouts() {
        retroAnimationState.waveTimeoutIds.forEach(function (timeoutId) {
            window.clearTimeout(timeoutId);
        });
        retroAnimationState.waveTimeoutIds = [];
    }

    function splitTextNodeToTitleChars(textNode) {
        const value = textNode && typeof textNode.nodeValue === 'string'
            ? textNode.nodeValue
            : '';
        if (!value.trim()) return;

        const fragment = document.createDocumentFragment();
        for (const character of value) {
            if (character === ' ') {
                fragment.appendChild(document.createTextNode(' '));
                continue;
            }

            const span = document.createElement('span');
            span.className = TITLE_WAVE_CHAR_CLASS;
            span.textContent = character;
            span.setAttribute('aria-hidden', 'true');
            fragment.appendChild(span);
        }

        if (textNode.parentNode) {
            textNode.parentNode.replaceChild(fragment, textNode);
        }
    }

    function prepareBattleTitleChars() {
        const title = document.getElementById('main-battle-title');
        if (!title) return;
        const heading = title.closest('h1');
        const accessibleTitle = title.textContent.replace(/\s+/g, ' ').trim();
        if (accessibleTitle) {
            title.setAttribute('aria-label', accessibleTitle);
            if (heading) {
                heading.setAttribute('aria-label', accessibleTitle);
            }
        }

        const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        const nodesToSplit = [];

        let currentNode = walker.nextNode();
        while (currentNode) {
            const parentElement = currentNode.parentElement;
            const shouldSkip = !!(parentElement && parentElement.classList.contains(TITLE_WAVE_CHAR_CLASS));
            if (!shouldSkip) {
                nodesToSplit.push(currentNode);
            }
            currentNode = walker.nextNode();
        }

        nodesToSplit.forEach(splitTextNodeToTitleChars);
    }

    function playBattleTitleWave(options = {}) {
        prepareBattleTitleChars();
        if (prefersReducedMotion()) return;

        const title = document.getElementById('main-battle-title');
        if (!title) return;

        const characters = Array.from(title.querySelectorAll(`.${TITLE_WAVE_CHAR_CLASS}`));
        if (!characters.length) return;

        const startDelay = options.immediate ? 0 : 260;
        clearPendingTitleWaveTimeouts();

        characters.forEach(function (node, index) {
            node.classList.remove(TITLE_WAVE_ACTIVE_CLASS);

            const onDelay = startDelay + (index * TITLE_WAVE_STEP_DELAY_MS);
            const onTimeoutId = window.setTimeout(function startWaveStep() {
                node.classList.add(TITLE_WAVE_ACTIVE_CLASS);
            }, onDelay);
            retroAnimationState.waveTimeoutIds.push(onTimeoutId);

            const offDelay = onDelay + TITLE_WAVE_DURATION_MS;
            const offTimeoutId = window.setTimeout(function stopWaveStep() {
                node.classList.remove(TITLE_WAVE_ACTIVE_CLASS);
            }, offDelay);
            retroAnimationState.waveTimeoutIds.push(offTimeoutId);
        });
    }

    function scheduleBattleTitleWaveLoop() {
        if (retroAnimationState.waveLoopIntervalId !== null) return;
        retroAnimationState.waveLoopIntervalId = window.setInterval(function onWaveLoopTick() {
            playBattleTitleWave({ immediate: false });
        }, TITLE_WAVE_INTERVAL_MS);
    }

    function initializeRetroAmbientAnimations() {
        prepareBattleTitleChars();
        playBattleTitleWave({ immediate: true });
        scheduleBattleTitleWaveLoop();
        if (document && document.body) {
            document.body.classList.add('retro-ambient-ready');
        }
    }

    function renderStartScreenHighScores() {
        if (
            window.HebrewGame &&
            window.HebrewGame.core &&
            typeof window.HebrewGame.core.displayHighScores === 'function'
        ) {
            window.HebrewGame.core.displayHighScores();
        }
    }

    function initializeStartScreenEnhancements() {
        const randomNameButton = document.getElementById('random-name');
        if (randomNameButton) {
            randomNameButton.addEventListener('click', generateRandomName);
        }

        initializeLanguagePicker();
        initializeAvatarPicker();
        renderStartScreenHighScores();
        initializeRetroAmbientAnimations();
    }

    window.HebrewGame = window.HebrewGame || {};
    window.HebrewGame.ui = window.HebrewGame.ui || {};
    window.HebrewGame.ui.initializeStartScreenEnhancements = initializeStartScreenEnhancements;
    window.HebrewGame.ui.generateRandomName = generateRandomName;
    window.HebrewGame.ui.renderStartScreenHighScores = renderStartScreenHighScores;
    window.HebrewGame.ui.initializeAvatarPicker = initializeAvatarPicker;
    window.HebrewGame.ui.getSelectedPlayerAvatar = getSelectedAvatarPath;
    window.HebrewGame.ui.setSelectedPlayerAvatar = setSelectedAvatar;
    window.HebrewGame.ui.prepareBattleTitleChars = prepareBattleTitleChars;
    window.HebrewGame.ui.playBattleTitleWave = playBattleTitleWave;
    window.HebrewGame.ui.initializeRetroAmbientAnimations = initializeRetroAmbientAnimations;
})();
