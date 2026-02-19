/**
 * Round results rendering module.
 * Pure UI rendering only; game flow stays in game-rounds.js.
 */

const ROUND_RESULT_STATE = Object.freeze({
    ELIMINATED: 'eliminated',
    SURVIVED: 'survived',
    TOP3: 'top3',
    CHAMPION: 'champion'
});

const ROUND_RESULTS_COUNTUP_DURATIONS = Object.freeze({
    rank: 300,
    points: 340,
    earned: 420,
    total: 500
});

const STATUS_SPARKLE_LAYOUT = Object.freeze({
    survived: [
        { x: 20, y: 64, dx: -12, dy: -24, delay: 0, duration: 680 },
        { x: 36, y: 36, dx: -6, dy: -30, delay: 45, duration: 700 },
        { x: 52, y: 58, dx: 8, dy: -28, delay: 70, duration: 720 },
        { x: 68, y: 40, dx: 12, dy: -24, delay: 95, duration: 700 },
        { x: 80, y: 66, dx: 10, dy: -18, delay: 120, duration: 660 }
    ],
    top3: [
        { x: 18, y: 62, dx: -13, dy: -27, delay: 0, duration: 700 },
        { x: 30, y: 36, dx: -8, dy: -32, delay: 30, duration: 730 },
        { x: 45, y: 66, dx: 0, dy: -25, delay: 55, duration: 720 },
        { x: 60, y: 34, dx: 10, dy: -31, delay: 80, duration: 720 },
        { x: 74, y: 58, dx: 12, dy: -22, delay: 105, duration: 700 },
        { x: 84, y: 42, dx: 11, dy: -28, delay: 135, duration: 680 }
    ],
    champion: [
        { x: 14, y: 64, dx: -15, dy: -30, delay: 0, duration: 760 },
        { x: 26, y: 40, dx: -10, dy: -34, delay: 30, duration: 780 },
        { x: 38, y: 66, dx: -4, dy: -28, delay: 55, duration: 740 },
        { x: 50, y: 34, dx: 2, dy: -36, delay: 80, duration: 780 },
        { x: 62, y: 66, dx: 8, dy: -29, delay: 105, duration: 740 },
        { x: 74, y: 42, dx: 12, dy: -32, delay: 130, duration: 760 },
        { x: 86, y: 64, dx: 14, dy: -26, delay: 155, duration: 720 }
    ]
});

const STATUS_SPARKLE_ICONS = Object.freeze({
    survived: ['dot', 'starburst', 'dot', 'coin', 'dot'],
    top3: ['badge-bronze', 'starburst', 'dot', 'coin', 'dot', 'starburst'],
    champion: ['badge-cream', 'starburst', 'coin', 'dot', 'starburst', 'coin', 'badge-cream']
});

let roundResultsAnimationToken = 0;

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

function getRankColorClass(playerRank) {
    if (playerRank === 1) return 'gold';
    if (playerRank === 2) return 'silver';
    if (playerRank === 3) return 'bronze';
    if (playerRank <= 10) return 'blue';
    return 'purple';
}

function renderResultIcon(iconId, additionalClass = '') {
    const optionalClass = additionalClass ? ` ${additionalClass}` : '';
    return `<span class="pixel-icon pixel-icon--${iconId}${optionalClass}" aria-hidden="true"></span>`;
}

function prefersReducedMotion() {
    return (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

function getResultState(playerRank, isEliminated) {
    if (isEliminated) return ROUND_RESULT_STATE.ELIMINATED;
    if (playerRank === 1) return ROUND_RESULT_STATE.CHAMPION;
    if (playerRank <= 3) return ROUND_RESULT_STATE.TOP3;
    return ROUND_RESULT_STATE.SURVIVED;
}

function getStatusMessage(resultState) {
    if (resultState === ROUND_RESULT_STATE.ELIMINATED) return t('results.state.eliminated');
    if (resultState === ROUND_RESULT_STATE.CHAMPION) return t('results.state.champion');
    if (resultState === ROUND_RESULT_STATE.TOP3) return t('results.state.top3');
    return t('results.state.survived');
}

function setCountupValue(element, value, suffix) {
    if (!element) return;
    const safeValue = Math.max(0, Math.floor(Number(value) || 0));
    element.textContent = `${safeValue}${suffix || ''}`;
}

function animateCountupValue(element, endValue, suffix, duration, token) {
    return new Promise(resolve => {
        if (!element) {
            resolve();
            return;
        }

        const target = Math.max(0, Math.floor(Number(endValue) || 0));
        if (duration <= 0 || prefersReducedMotion()) {
            setCountupValue(element, target, suffix);
            resolve();
            return;
        }

        let startTime = null;
        setCountupValue(element, 0, suffix);

        function step(timestamp) {
            if (token !== roundResultsAnimationToken) {
                resolve();
                return;
            }

            if (startTime === null) {
                startTime = timestamp;
            }

            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(target * easedProgress);
            setCountupValue(element, currentValue, suffix);

            if (progress < 1) {
                window.requestAnimationFrame(step);
                return;
            }

            setCountupValue(element, target, suffix);
            resolve();
        }

        window.requestAnimationFrame(step);
    });
}

function clearStatusSparkleBurst(statusContainer) {
    if (!statusContainer) return;
    statusContainer.querySelectorAll('.results-sparkle-burst').forEach(node => {
        if (node.parentNode) node.parentNode.removeChild(node);
    });
}

function spawnStatusSparkleBurst(statusContainer, resultState, token) {
    if (!statusContainer || resultState === ROUND_RESULT_STATE.ELIMINATED || prefersReducedMotion()) return;

    const layoutKey = resultState === ROUND_RESULT_STATE.CHAMPION
        ? ROUND_RESULT_STATE.CHAMPION
        : (resultState === ROUND_RESULT_STATE.TOP3 ? ROUND_RESULT_STATE.TOP3 : ROUND_RESULT_STATE.SURVIVED);

    const layout = STATUS_SPARKLE_LAYOUT[layoutKey];
    const icons = STATUS_SPARKLE_ICONS[layoutKey];
    if (!Array.isArray(layout) || !layout.length || !Array.isArray(icons) || !icons.length) return;

    clearStatusSparkleBurst(statusContainer);

    const burst = document.createElement('div');
    burst.className = 'results-sparkle-burst';
    burst.setAttribute('data-testid', 'results-sparkle-burst');
    burst.setAttribute('aria-hidden', 'true');

    layout.forEach((sparkle, index) => {
        const iconId = icons[index % icons.length];
        const sparkleNode = document.createElement('span');
        sparkleNode.className = `results-sparkle pixel-icon pixel-icon--${iconId}`;
        sparkleNode.style.setProperty('--sparkle-x', `${sparkle.x}%`);
        sparkleNode.style.setProperty('--sparkle-y', `${sparkle.y}%`);
        sparkleNode.style.setProperty('--sparkle-dx', `${sparkle.dx}px`);
        sparkleNode.style.setProperty('--sparkle-dy', `${sparkle.dy}px`);
        sparkleNode.style.setProperty('--sparkle-delay', `${sparkle.delay}ms`);
        sparkleNode.style.setProperty('--sparkle-duration', `${sparkle.duration}ms`);
        burst.appendChild(sparkleNode);
    });

    statusContainer.appendChild(burst);

    window.setTimeout(() => {
        if (token !== roundResultsAnimationToken) return;
        if (burst.parentNode) burst.parentNode.removeChild(burst);
    }, 1150);
}

function runResultsCountups(container, token) {
    if (!container) return;
    const countupNodes = Array.from(container.querySelectorAll('[data-countup-value]'));
    if (!countupNodes.length) return;

    countupNodes.forEach(node => {
        const key = String(node.dataset.countupKey || '').trim();
        const duration = ROUND_RESULTS_COUNTUP_DURATIONS[key] || 340;
        const suffix = String(node.dataset.countupSuffix || '');
        const value = Number(node.dataset.countupValue || 0);
        animateCountupValue(node, value, suffix, duration, token);
    });
}

function runResultsEntranceAnimations(keyResultsContainer, resultState, token) {
    const roundResultsScreen = document.getElementById('round-results');
    if (!roundResultsScreen || !keyResultsContainer) return;

    roundResultsScreen.classList.remove('results-enter-active');
    // Force reflow so the entry sequence retriggers each round.
    void roundResultsScreen.offsetWidth;
    roundResultsScreen.classList.add('results-enter-active');

    const statusContainer = keyResultsContainer.querySelector('.status-container');
    clearStatusSparkleBurst(statusContainer);

    if (prefersReducedMotion()) {
        window.setTimeout(() => {
            if (token !== roundResultsAnimationToken) return;
            roundResultsScreen.classList.remove('results-enter-active');
        }, 0);
        return;
    }

    runResultsCountups(keyResultsContainer, token);
    spawnStatusSparkleBurst(statusContainer, resultState, token);

    window.setTimeout(() => {
        if (token !== roundResultsAnimationToken) return;
        roundResultsScreen.classList.remove('results-enter-active');
    }, 900);
}

function getHeroesApi() {
    return window.HebrewGame && window.HebrewGame.heroes
        ? window.HebrewGame.heroes
        : null;
}

function escapeUiText(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderRankingHeroName(hero, isPlayer) {
    const heroesApi = getHeroesApi();
    if (heroesApi && typeof heroesApi.createHeroNameMarkup === 'function') {
        return heroesApi.createHeroNameMarkup(hero, {
            playerSuffix: isPlayer,
            nameClass: 'ranking-name-text',
            avatarClass: 'hero-avatar-ranking'
        });
    }
    const fallbackName = hero && hero.name ? hero.name : '';
    return `<span class="ranking-name-text">${escapeUiText(fallbackName)}${isPlayer ? ` (${escapeUiText(t('label.you'))})` : ''}</span>`;
}

function createRankingItem(hero, rankIndex, isPlayer, roundIndex) {
    const roundScore = hero.roundScores[roundIndex] || 0;
    const eliminatedBadge = hero.eliminated
        ? `<span class="ranking-eliminated-badge" aria-label="${escapeUiText(t('results.outBadgeAria'))}">${escapeUiText(t('results.outBadge'))}</span>`
        : '';
    const item = document.createElement('div');
    item.className = `ranking-item ${isPlayer ? 'player' : ''}${hero.eliminated ? ' ranking-eliminated' : ''}`;
    if (hero.eliminated) {
        item.setAttribute('data-testid', 'ranking-item-eliminated');
    }

    item.innerHTML = `
        <div class="ranking-position pixel-chip">#${rankIndex + 1}</div>
        <div class="ranking-name">${eliminatedBadge}${renderRankingHeroName(hero, isPlayer)}</div>
        <div class="ranking-score pixel-chip">${hero.score}</div>
        <div class="ranking-points pixel-chip">(+${roundScore})</div>
    `;

    return item;
}

function scrollPlayerRowIntoView(rankingList) {
    if (!rankingList || rankingList.scrollHeight <= rankingList.clientHeight + 1) return;

    const playerRow = rankingList.querySelector('.ranking-item.player');
    if (!playerRow) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    window.requestAnimationFrame(() => {
        try {
            playerRow.scrollIntoView({
                behavior: scrollBehavior,
                block: 'center',
                inline: 'nearest'
            });
        } catch (_error) {
            playerRow.scrollIntoView();
        }
    });
}

function displayRoundResults(payload) {
    const {
        playerRank,
        totalContestants,
        allContestants,
        playerScore,
        roundScore,
        roundCoinsEarned,
        playerCoins,
        isEliminated,
        currentRound,
        maxRounds
    } = payload;

    const completedRoundElement = document.getElementById('completed-round');
    if (completedRoundElement) completedRoundElement.textContent = currentRound;

    const playerScoreElement = document.getElementById('player-score');
    if (playerScoreElement) playerScoreElement.textContent = playerScore;

    const roundScoreElement = document.getElementById('round-score');
    if (roundScoreElement) roundScoreElement.textContent = roundScore;

    const coinsEarnedElement = document.getElementById('coins-earned');
    if (coinsEarnedElement) coinsEarnedElement.textContent = roundCoinsEarned;

    const storeCoinsElement = document.getElementById('store-coins');
    if (storeCoinsElement) storeCoinsElement.textContent = playerCoins;

    const resultState = getResultState(playerRank, isEliminated);
    const renderToken = ++roundResultsAnimationToken;
    const roundResultsScreen = document.getElementById('round-results');
    if (roundResultsScreen) {
        roundResultsScreen.dataset.resultState = resultState;
    }

    const keyResultsContainer = document.getElementById('key-results-container');
    if (keyResultsContainer) {
        keyResultsContainer.dataset.resultState = resultState;
        const statusClass = isEliminated ? 'eliminated' : 'survived';
        const statusIcon = isEliminated ? renderResultIcon('alert') : renderResultIcon('starburst');
        const statusMessage = getStatusMessage(resultState);
        const rankClass = getRankColorClass(playerRank);

        keyResultsContainer.innerHTML = `
            <div class="results-hero">
                <div class="status-container ${statusClass} state-${resultState} pixel-frame-parchment">
                    <div class="status-icon">${statusIcon}</div>
                    <h3 class="status-message pixel-title-plate">
                        <span class="pixel-flag pixel-flag--sm" aria-hidden="true"></span>
                        <span>${statusMessage}</span>
                    </h3>
                </div>
                <div class="rank-display ${rankClass} state-${resultState} pixel-frame-steel">
                    <div class="rank-number" data-countup-key="rank" data-countup-value="${playerRank}">${playerRank}</div>
                    <div class="rank-text">
                        <div class="rank-text-label">${t('results.rankLabel')}</div>
                        <div class="rank-text-value">${playerRank} / ${totalContestants}</div>
                    </div>
                    <div class="rank-details pixel-chip">${t('results.points')}: ${playerScore}</div>
                </div>
            </div>
            <div class="reward-container">
                <div class="reward-item reward-item--points pixel-frame-parchment">
                    <div class="reward-icon">${renderResultIcon('badge-bronze')}</div>
                    <div class="reward-label pixel-title-plate">${t('results.roundPoints')}</div>
                    <div class="reward-value pixel-chip" data-countup-key="points" data-countup-value="${roundScore}" data-countup-suffix="${t('results.pointsSuffix')}">${roundScore}${t('results.pointsSuffix')}</div>
                </div>
                <div class="reward-item reward-item--earned pixel-frame-parchment">
                    <div class="reward-icon">${renderResultIcon('coin')}</div>
                    <div class="reward-label pixel-title-plate">${t('results.coinsEarnedLabel')}</div>
                    <div class="reward-value pixel-chip" data-countup-key="earned" data-countup-value="${roundCoinsEarned}" data-countup-suffix="${t('results.coinsSuffix')}">${roundCoinsEarned}${t('results.coinsSuffix')}</div>
                </div>
                <div class="reward-item reward-item--total pixel-frame-parchment">
                    <div class="reward-icon">${renderResultIcon('badge-cream')}</div>
                    <div class="reward-label pixel-title-plate">${t('results.totalCoins')}</div>
                    <div class="reward-value pixel-chip" data-countup-key="total" data-countup-value="${playerCoins}" data-countup-suffix="${t('results.coinsSuffix')}">${playerCoins}${t('results.coinsSuffix')}</div>
                </div>
            </div>
        `;

        runResultsEntranceAnimations(keyResultsContainer, resultState, renderToken);
    }

    const rankingList = document.getElementById('ranking-list');
    if (rankingList) {
        rankingList.innerHTML = '';
        const sorted = allContestants.slice().sort((a, b) => b.score - a.score);
        const roundIndex = currentRound - 1;

        sorted.forEach((hero, index) => {
            rankingList.appendChild(createRankingItem(hero, index, hero === gameState.player, roundIndex));
        });

        scrollPlayerRowIntoView(rankingList);
    }

    const nextRoundBtn = document.getElementById('next-round');
    if (nextRoundBtn) {
        nextRoundBtn.disabled = false;
        if (isEliminated) {
            nextRoundBtn.textContent = t('results.eliminatedButton');
            nextRoundBtn.disabled = true;
        } else if (currentRound === maxRounds) {
            nextRoundBtn.textContent = t('results.finalResultsButton');
        } else {
            nextRoundBtn.textContent = t('results.nextRound');
        }
    }
}

window.HebrewGame = window.HebrewGame || {};
window.HebrewGame.ui = window.HebrewGame.ui || {};
window.HebrewGame.ui.displayRoundResults = displayRoundResults;
window.displayRoundResults = displayRoundResults;
