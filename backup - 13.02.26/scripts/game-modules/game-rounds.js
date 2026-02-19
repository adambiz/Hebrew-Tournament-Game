/**
 * Round management functions
 */

// Round descriptions for next round preview
const roundDescriptions = {
    1: "Single words with 2 Hebrew letters",
    2: "Single words with 4 Hebrew letters",
    3: "Single words with 6 Hebrew letters",
    4: "Two-word Hebrew phrases",
    5: "Three-word Hebrew sentences",
    6: "Four-word Hebrew sentences"
};

let storeOverlayKeydownHandler = null;
let finalScreenAnimationToken = 0;

const FINAL_SCORE_ANIMATION_DURATIONS = {
    base: 680,
    bonus: 560,
    total: 760
};

function announceUi(message) {
    if (
        window.HebrewGame &&
        window.HebrewGame.ui &&
        typeof window.HebrewGame.ui.announce === 'function'
    ) {
        window.HebrewGame.ui.announce(message);
    }
}
 
// Start the next round
function startNextRound() {
    if (
        window.HebrewGame &&
        window.HebrewGame.ui &&
        typeof window.HebrewGame.ui.isStoreOverlayOpen === 'function' &&
        window.HebrewGame.ui.isStoreOverlayOpen() &&
        typeof window.HebrewGame.ui.closeStoreOverlay === 'function'
    ) {
        window.HebrewGame.ui.closeStoreOverlay();
    }

    if (typeof window.logDebug === 'function') {
        window.logDebug('Starting next round. Current round before increment:', gameState.currentRound);
    }
    
    // Reset power-ups active for this round
    gameState.powerUpsActive = {
        doublePoints: false,
        secondChance: false,
        secondChanceRound: false,
        disabledLetters: [],
        originalWord: null,
        removedLetters: 0,
        easierWordCurrentLevel: 0,
        revealedLetters: []
    };
    
    // Increment round number
    gameState.currentRound++;
    gameState.roundCoinsEarned = 0;
    gameState.isRoundTransitioning = false;
    if (typeof window.logDebug === 'function') {
        window.logDebug('Round incremented to:', gameState.currentRound);
    }
    
    // Check if game is over
    if (gameState.currentRound > gameState.maxRounds) {
        if (typeof window.logDebug === 'function') window.logDebug('Max rounds reached. Ending game.');
        endGame();
        return;
    }
    
    // Update round display
    document.getElementById('current-round').textContent = gameState.currentRound;
    document.getElementById('coin-count').textContent = gameState.playerCoins;
    
    // Reset round-specific values, but keep cumulative score
    gameState.roundWords = getRandomWordsForRound(gameState.currentRound);
    gameState.currentWordIndex = 0;
    gameState.roundScore = 0;  // This tracks score for the current round only
    gameState.perfectWords = 0;
    
    // Reset letter position tracking
    gameState.activeWord = 0;
    gameState.activeLetterIndex = 0;
    
    if (!gameState.roundWords || gameState.roundWords.length === 0) {
        toast({
            title: "No words available",
            description: "Word data failed to load for this round.",
            variant: "destructive"
        });
        showScreen('start-screen');
        return;
    }
    if (typeof window.logDebug === 'function') {
        window.logDebug('Round words loaded:', gameState.roundWords.length);
    }
    
    // Reset the progress bar
    updateProgressBar(0);
    
    // Initialize round scores for opponents if this is a new round
    gameState.opponents.forEach(opponent => {
        if (!opponent.eliminated && !opponent.roundScores[gameState.currentRound - 1]) {
            opponent.roundScores[gameState.currentRound - 1] = 0;
        }
    });
    
    // Show the round screen
    window.showScreen('round-screen');
    
    // Update remaining heroes count
    const remainingHeroes = [gameState.player, ...gameState.opponents].filter(h => !h.eliminated).length;
    document.getElementById('heroes-remaining').textContent = remainingHeroes;
    
    // Update tournament display
    updateTournamentDisplay();
    
    // Start the first word
    startNextWord();
    
    // Reset any used keys
    resetKeyboard();
    
    // Initialize the keyboard
    initializeKeyboard('hebrew-keyboard', handleKeyPress);
    initializePhysicalKeyboard(handleKeyPress);
    
    if (typeof window.logDebug === 'function') window.logDebug('Round started:', gameState.currentRound);
    announceUi(`Round ${gameState.currentRound} started. ${gameState.roundWords.length} words in this round.`);
    
    // Show round info for higher rounds
    if (gameState.currentRound >= 4) {
        let roundTypeMessage = "";
        
        if (gameState.currentRound === 4) {
            roundTypeMessage = "This round has two-word phrases!";
        } else if (gameState.currentRound === 5) {
            roundTypeMessage = "This round has three-word sentences!";
        } else {
            roundTypeMessage = "This round has four-word sentences!";
        }
            
        const clickHint = "Click any letter to edit that position.";
        
        toast({
            title: `Round ${gameState.currentRound}: Phrases!`,
            description: `${roundTypeMessage} ${clickHint}`,
            variant: "default"
        });
    }
}

// New function to update the tournament display
function updateTournamentDisplay() {
    // Update the badge values
    document.getElementById('current-round-badge').textContent = gameState.currentRound;
    
    // Count remaining heroes
    const remainingHeroes = [gameState.player, ...gameState.opponents].filter(h => !h.eliminated).length;
    document.getElementById('heroes-remaining').textContent = remainingHeroes;
    
    // Sort heroes by score consistently
    const allHeroes = [gameState.player, ...gameState.opponents].filter(h => !h.eliminated);
    allHeroes.sort((a, b) => b.score - a.score);
    
    // Find player's rank
    const playerRank = allHeroes.findIndex(h => h === gameState.player) + 1;
    
    // Update player's rank with trophy icon if in top 3
    const playerRankElement = document.getElementById('player-current-rank');
    if (playerRank <= 3) {
        const trophyIcon = playerRank === 1 ? '🏆' : playerRank === 2 ? '🥈' : '🥉';
        playerRankElement.innerHTML = `${trophyIcon} ${playerRank}`;
        playerRankElement.classList.add('top-rank');
    } else {
        playerRankElement.textContent = playerRank;
        playerRankElement.classList.remove('top-rank');
    }
    
    // Update top champions (only show top 3 for simplicity)
    const topChampionsContainer = document.getElementById('top-champions');
    topChampionsContainer.innerHTML = '';
    
    // Use the already sorted heroes list for top champions
    const topHeroes = allHeroes.slice(0, 3);
    
    topHeroes.forEach((hero, index) => {
        const championElement = document.createElement('div');
        championElement.className = 'champion-item';
        
        // Add special class if it's the player
        if (hero === gameState.player) {
            championElement.classList.add('player-champion');
        }
        
        // Use medals for top 3
        const medalIcons = ['🏆', '🥈', '🥉'];
        
        championElement.innerHTML = `
            <div class="champion-rank">${medalIcons[index]}</div>
            <div class="champion-name">${hero.name}${hero === gameState.player ? ' (You)' : ''}</div>
            <div class="champion-score">${hero.score}</div>
        `;
        
        topChampionsContainer.appendChild(championElement);
    });
}

// Complete the current round.
window.completeRound = function completeRound() {
    if (gameState.isRoundTransitioning) return;
    gameState.isRoundTransitioning = true;
    if (typeof window.logDebug === 'function') window.logDebug('completeRound called');

    try {
        gameState.player.roundScores.push(gameState.roundScore);

        const allContestants = [gameState.player, ...gameState.opponents].filter(h => !h.eliminated);
        allContestants.sort((a, b) => b.score - a.score);

        const eliminateCount = Math.floor(allContestants.length / 2);
        const cutoffIndex = allContestants.length - eliminateCount - 1;
        const cutoffScore = allContestants[cutoffIndex].score;

        for (let i = allContestants.length - 1; i > cutoffIndex; i--) {
            allContestants[i].eliminated = true;
        }

        if (gameState.player.score === cutoffScore && gameState.player.eliminated) {
            gameState.player.eliminated = false;
            for (let i = cutoffIndex; i >= 0; i--) {
                if (
                    allContestants[i] !== gameState.player &&
                    allContestants[i].score === cutoffScore &&
                    !allContestants[i].eliminated
                ) {
                    allContestants[i].eliminated = true;
                    break;
                }
            }
        }

        const playerIndex = allContestants.findIndex(hero => hero === gameState.player);
        const playerRank = playerIndex + 1;
        const totalContestants = allContestants.length;

        if (gameState.player.eliminated) {
            endGame({ reason: 'eliminated' });
            return;
        }

        if (gameState.currentRound === gameState.maxRounds) {
            endGame({ reason: 'tournament_complete' });
            return;
        }

        if (typeof window.displayRoundResults === 'function') {
            window.displayRoundResults({
                playerRank,
                totalContestants,
                allContestants,
                playerScore: gameState.player.score,
                roundScore: gameState.roundScore,
                roundCoinsEarned: gameState.roundCoinsEarned,
                playerCoins: gameState.playerCoins,
                isEliminated: gameState.player.eliminated,
                currentRound: gameState.currentRound,
                maxRounds: gameState.maxRounds
            });
        }

        window.showScreen('round-results');
        announceUi(`Round ${gameState.currentRound} complete. You earned ${gameState.roundCoinsEarned} coins this round.`);

        const storeBtn = document.getElementById('visit-store');
        if (storeBtn) {
            storeBtn.onclick = function handleStoreOpen() {
                openStoreOverlay(storeBtn);
            };
        }

        updatePowerUpButtonVisibility();
    } catch (error) {
        console.error('Error in completeRound:', error);
        endGame();
    } finally {
        gameState.isRoundTransitioning = false;
    }
};

// Update the round progress bar
function updateProgressBar(percentage) {
    const progressBar = document.getElementById('round-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
}

function getStoreFocusableElements(overlay) {
    if (!overlay) return [];
    return Array.from(overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.disabled);
}

function isStoreOverlayOpen() {
    const overlay = document.getElementById('store-overlay');
    return !!overlay && overlay.classList.contains('active');
}

function closeStoreOverlay() {
    const overlay = document.getElementById('store-overlay');
    if (!overlay) return false;

    overlay.classList.remove('active');

    if (storeOverlayKeydownHandler) {
        document.removeEventListener('keydown', storeOverlayKeydownHandler);
        storeOverlayKeydownHandler = null;
    }

    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 180);

    gameState.ui.activeOverlayId = null;
    const focusTarget = gameState.ui.lastFocusedElement;
    if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus();
    }
    gameState.ui.lastFocusedElement = null;
    announceUi('Shop closed.');
    return true;
}

// Show store overlay
function openStoreOverlay(triggerElement) {
    const existing = document.getElementById('store-overlay');
    if (existing) {
        closeStoreOverlay();
    }

    const overlay = document.createElement('div');
    overlay.id = 'store-overlay';
    overlay.className = 'game-overlay active';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Power-up store');
    overlay.setAttribute('data-testid', 'store-overlay');

    overlay.innerHTML = `
        <div class="overlay-content store-overlay">
            <div class="store-header">
                <h2>Bonus Shop</h2>
                <div class="player-coins" aria-live="polite">
                    <span class="coin-icon">💰</span>
                    <span id="overlay-store-coins">${gameState.playerCoins}</span> coins
                </div>
                <button id="close-store-x" class="close-store-x-button" type="button" aria-label="Close store">✕</button>
            </div>
            <div id="overlay-store-items"></div>
            <button id="close-store" class="close-overlay-button" type="button">Back to Results</button>
        </div>
    `;

    document.body.appendChild(overlay);
    generateStoreUI('overlay-store-items', gameState.playerCoins, gameState.currentRound, purchasePowerUp);
    gameState.ui.activeOverlayId = 'store-overlay';
    gameState.ui.lastFocusedElement = triggerElement || document.activeElement;
    announceUi('Shop opened.');

    const closeButton = document.getElementById('close-store');
    if (closeButton) closeButton.addEventListener('click', closeStoreOverlay);

    const closeXButton = document.getElementById('close-store-x');
    if (closeXButton) closeXButton.addEventListener('click', closeStoreOverlay);

    overlay.addEventListener('click', function handleOverlayClick(event) {
        if (event.target === overlay) {
            closeStoreOverlay();
        }
    });

    storeOverlayKeydownHandler = function handleStoreOverlayKeys(event) {
        if (!isStoreOverlayOpen()) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeStoreOverlay();
            return;
        }

        if (event.key !== 'Tab') return;
        const focusable = getStoreFocusableElements(overlay);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    document.addEventListener('keydown', storeOverlayKeydownHandler);

    const focusable = getStoreFocusableElements(overlay);
    if (focusable.length > 0) {
        focusable[0].focus();
    }

    return true;
}

function showStore() {
    return openStoreOverlay(document.getElementById('visit-store'));
}

function formatScoreValue(value) {
    const safeValue = Math.max(0, Math.floor(Number(value) || 0));
    return safeValue.toLocaleString();
}

function setScoreValue(element, value) {
    if (!element) return;
    element.textContent = formatScoreValue(value);
}

function prefersReducedMotion() {
    return (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

function animateScoreValue(element, endValue, duration, token) {
    return new Promise(resolve => {
        if (!element) {
            resolve();
            return;
        }
        if (duration <= 0 || prefersReducedMotion()) {
            setScoreValue(element, endValue);
            resolve();
            return;
        }

        const target = Math.max(0, Math.floor(Number(endValue) || 0));
        let startTime = null;
        element.classList.add('score-counting');

        function step(timestamp) {
            if (token !== finalScreenAnimationToken) {
                element.classList.remove('score-counting');
                resolve();
                return;
            }

            if (startTime === null) {
                startTime = timestamp;
            }

            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = Math.round(target * progress);
            setScoreValue(element, currentValue);

            if (progress < 1) {
                window.requestAnimationFrame(step);
                return;
            }

            element.classList.remove('score-counting');
            resolve();
        }

        window.requestAnimationFrame(step);
    });
}

async function runFinalScoreAnimation(baseScore, coinBonus, finalScore) {
    const gameOverScreen = document.getElementById('game-over');
    const baseScoreEl = document.getElementById('final-base-score');
    const coinBonusEl = document.getElementById('final-coin-bonus');
    const finalTotalEl = document.getElementById('final-total-score');
    if (!gameOverScreen) return;

    const token = ++finalScreenAnimationToken;
    gameOverScreen.classList.remove('final-jackpot-active');

    if (prefersReducedMotion()) {
        setScoreValue(baseScoreEl, baseScore);
        setScoreValue(coinBonusEl, coinBonus);
        setScoreValue(finalTotalEl, finalScore);
        return;
    }

    setScoreValue(baseScoreEl, 0);
    setScoreValue(coinBonusEl, 0);
    setScoreValue(finalTotalEl, 0);

    await animateScoreValue(baseScoreEl, baseScore, FINAL_SCORE_ANIMATION_DURATIONS.base, token);
    if (token !== finalScreenAnimationToken) return;

    if (coinBonusEl) coinBonusEl.classList.add('bonus-pulse');
    await animateScoreValue(coinBonusEl, coinBonus, FINAL_SCORE_ANIMATION_DURATIONS.bonus, token);
    if (coinBonusEl) coinBonusEl.classList.remove('bonus-pulse');
    if (token !== finalScreenAnimationToken) return;

    await animateScoreValue(finalTotalEl, finalScore, FINAL_SCORE_ANIMATION_DURATIONS.total, token);
    if (token !== finalScreenAnimationToken) return;

    gameOverScreen.classList.add('final-jackpot-active');
    setTimeout(() => {
        if (token === finalScreenAnimationToken && gameOverScreen) {
            gameOverScreen.classList.remove('final-jackpot-active');
        }
    }, 850);
}

function renderFinalComparisonList(finalists, playerFinalScore, showComparison) {
    const section = document.getElementById('final-comparison-section');
    const list = document.getElementById('final-comparison-list');
    if (!section || !list) return;

    if (!showComparison) {
        section.classList.add('hidden');
        list.innerHTML = '';
        return;
    }

    section.classList.remove('hidden');
    list.innerHTML = '';

    const sortedFinalists = finalists
        .map(hero => ({
            hero,
            score: hero === gameState.player ? playerFinalScore : hero.score
        }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (a.hero === gameState.player) return -1;
            if (b.hero === gameState.player) return 1;
            return a.hero.name.localeCompare(b.hero.name);
        });

    sortedFinalists.forEach((entry, index) => {
        const row = document.createElement('div');
        row.className = 'final-comparison-item';
        if (entry.hero === gameState.player) {
            row.classList.add('player-finalist');
        }

        const rank = document.createElement('span');
        rank.className = 'final-comparison-rank';
        rank.textContent = `#${index + 1}`;

        const name = document.createElement('span');
        name.className = 'final-comparison-name';
        name.textContent = `${entry.hero.name}${entry.hero === gameState.player ? ' (You)' : ''}`;

        const score = document.createElement('span');
        score.className = 'final-comparison-score';
        score.textContent = formatScoreValue(entry.score);

        row.appendChild(rank);
        row.appendChild(name);
        row.appendChild(score);
        list.appendChild(row);
    });
}

function renderFinalLeaderboard(scores, playerName) {
    const finalHighScoresList = document.getElementById('final-high-scores-list');
    if (!finalHighScoresList) return;

    finalHighScoresList.innerHTML = '';
    if (!Array.isArray(scores) || scores.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'high-score-item';
        empty.textContent = 'No high scores yet. Be the first!';
        finalHighScoresList.appendChild(empty);
        return;
    }

    const normalizedPlayerName = String(playerName || '').toLowerCase();
    scores.forEach((scoreEntry, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'high-score-item';

        if (String(scoreEntry.name || '').toLowerCase() === normalizedPlayerName) {
            scoreItem.classList.add('player-high-score');
        }

        const rank = document.createElement('span');
        rank.className = 'leaderboard-rank';
        rank.textContent = `#${index + 1}`;

        const name = document.createElement('span');
        name.className = 'leaderboard-name';
        name.textContent = String(scoreEntry.name || '');

        const value = document.createElement('span');
        value.className = 'leaderboard-score';
        value.textContent = formatScoreValue(scoreEntry.score);

        scoreItem.appendChild(rank);
        scoreItem.appendChild(name);
        scoreItem.appendChild(value);
        finalHighScoresList.appendChild(scoreItem);
    });
}

function updateFinalResultCopy(playerRank, reason) {
    const gameOverScreen = document.getElementById('game-over');
    const gameResult = document.getElementById('game-result');
    const gameResultCopy = document.getElementById('game-result-copy');
    if (!gameOverScreen || !gameResult || !gameResultCopy) return;

    gameOverScreen.classList.remove('result-win', 'result-strong', 'result-loss');

    if (playerRank === 1) {
        gameResult.textContent = 'Jackpot Champion!';
        gameResultCopy.textContent = 'You finished first and hit the full points rush.';
        gameOverScreen.classList.add('result-win');
        return;
    }

    if (reason === 'eliminated') {
        gameResult.textContent = 'Great Run!';
        gameResultCopy.textContent = 'You were in the fight and still locked in a final score.';
        gameOverScreen.classList.add('result-loss');
        return;
    }

    gameResult.textContent = 'Strong Finish!';
    gameResultCopy.textContent = 'Nice finish. You brought big points to the final table.';
    gameOverScreen.classList.add('result-strong');
}

function isBetterScore(nextScore, previousScore) {
    if (!Number.isFinite(previousScore)) return true;
    return nextScore > previousScore;
}

// End the game
function endGame(context = {}) {
    const reason = context.reason || (gameState.player && gameState.player.eliminated ? 'eliminated' : 'tournament_complete');
    const baseScore = Math.max(0, Math.floor(Number(gameState.player?.score) || 0));
    const unusedCoins = Math.max(0, Math.floor(Number(gameState.playerCoins) || 0));
    const coinBonus = unusedCoins * 2;
    const finalScore = baseScore + coinBonus;
    const totalContestants = 1 + gameState.opponents.length;

    const rankedContestants = [
        { hero: gameState.player, score: finalScore, isPlayer: true },
        ...gameState.opponents.map(opponent => ({ hero: opponent, score: opponent.score, isPlayer: false }))
    ].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.isPlayer && !b.isPlayer) return -1;
        if (!a.isPlayer && b.isPlayer) return 1;
        return a.hero.name.localeCompare(b.hero.name);
    });

    const playerRank = rankedContestants.findIndex(entry => entry.isPlayer) + 1;
    const finalists = [gameState.player, ...gameState.opponents].filter(hero => !hero.eliminated);
    const showFinalComparison = reason !== 'eliminated' && playerRank === 1;

    const finalRankEl = document.getElementById('final-rank');
    if (finalRankEl) {
        finalRankEl.textContent = `${playerRank} of ${totalContestants}`;
    }
    const finalScoreCompatEl = document.getElementById('final-score');
    if (finalScoreCompatEl) {
        finalScoreCompatEl.textContent = String(finalScore);
    }

    const bonusCoinsEl = document.getElementById('final-bonus-coins');
    if (bonusCoinsEl) {
        bonusCoinsEl.textContent = String(unusedCoins);
    }

    const coreApi = window.HebrewGame && window.HebrewGame.core ? window.HebrewGame.core : null;
    const previousScores = coreApi && typeof coreApi.getHighScores === 'function'
        ? coreApi.getHighScores()
        : [];
    const playerKey = String(gameState.player.name || '').toLowerCase();
    const previousPlayerScore = previousScores.find(entry => String(entry.name || '').toLowerCase() === playerKey)?.score;

    let savedScores = previousScores;
    if (coreApi && typeof coreApi.recordHighScore === 'function' && finalScore > 0) {
        savedScores = coreApi.recordHighScore({
            name: gameState.player.name,
            score: finalScore
        });
    }

    const playerPosition = savedScores.findIndex(
        entry => String(entry.name || '').toLowerCase() === playerKey
    ) + 1;
    const improvedScore = isBetterScore(finalScore, Number(previousPlayerScore));

    const highScoreEntry = document.getElementById('high-score-entry');
    const highScoreDetails = document.getElementById('high-score-details');
    if (highScoreEntry && highScoreDetails && improvedScore && playerPosition > 0) {
        highScoreEntry.classList.remove('hidden');
        highScoreDetails.textContent = `You moved to #${playerPosition} with ${formatScoreValue(finalScore)} points.`;
    } else if (highScoreEntry) {
        highScoreEntry.classList.add('hidden');
    }

    renderFinalComparisonList(finalists, finalScore, showFinalComparison);
    renderFinalLeaderboard(savedScores, gameState.player.name);
    updateFinalResultCopy(playerRank, reason);

    window.showScreen('game-over');
    runFinalScoreAnimation(baseScore, coinBonus, finalScore);
    announceUi(`Tournament complete. Final score ${finalScore} points. Rank ${playerRank} of ${totalContestants}.`);
}

window.HebrewGame = window.HebrewGame || {};
window.HebrewGame.ui = window.HebrewGame.ui || {};
window.HebrewGame.ui.startNextRound = startNextRound;
window.HebrewGame.ui.completeRound = window.completeRound;
window.HebrewGame.ui.showStore = showStore;
window.HebrewGame.ui.openStoreOverlay = openStoreOverlay;
window.HebrewGame.ui.closeStoreOverlay = closeStoreOverlay;
window.HebrewGame.ui.isStoreOverlayOpen = isStoreOverlayOpen;
