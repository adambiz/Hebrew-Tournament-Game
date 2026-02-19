/**
 * Round results rendering module.
 * Pure UI rendering only; game flow stays in game-rounds.js.
 */

function getRankColorClass(playerRank) {
    if (playerRank === 1) return 'gold';
    if (playerRank === 2) return 'silver';
    if (playerRank === 3) return 'bronze';
    if (playerRank <= 10) return 'blue';
    return 'purple';
}

function createRankingItem(hero, rankIndex, isPlayer, roundIndex) {
    const roundScore = hero.roundScores[roundIndex] || 0;
    const item = document.createElement('div');
    item.className = `ranking-item ${isPlayer ? 'player' : ''}${hero.eliminated ? ' ranking-eliminated' : ''}`;
    if (hero.eliminated) {
        item.setAttribute('data-testid', 'ranking-item-eliminated');
    }

    item.innerHTML = `
        <div class="ranking-position">${rankIndex + 1}.</div>
        <div class="ranking-name">${hero.name}${isPlayer ? ' (You)' : ''}</div>
        <div class="ranking-score">${hero.score}</div>
        <div class="ranking-points">(+${roundScore})</div>
    `;

    return item;
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

    const keyResultsContainer = document.getElementById('key-results-container');
    if (keyResultsContainer) {
        const statusClass = isEliminated ? 'eliminated' : 'survived';
        const statusIcon = isEliminated ? '😢' : '🎉';
        const statusMessage = isEliminated ? 'Eliminated This Round' : 'You Advance!';
        const rankClass = getRankColorClass(playerRank);

        keyResultsContainer.innerHTML = `
            <div class="status-container ${statusClass}">
                <div class="status-icon">${statusIcon}</div>
                <h3 class="status-message">${statusMessage}</h3>
            </div>
            <div class="rank-display ${rankClass}">
                <div class="rank-number">${playerRank}</div>
                <div class="rank-text">Your Rank: ${playerRank} of ${totalContestants}</div>
                <div class="rank-details">Score: ${playerScore}</div>
            </div>
            <div class="reward-container">
                <div class="reward-item">
                    <div class="reward-icon">🏆</div>
                    <div class="reward-label">Round Points</div>
                    <div class="reward-value">${roundScore} points</div>
                </div>
                <div class="reward-item">
                    <div class="reward-icon">💰</div>
                    <div class="reward-label">Coins Earned</div>
                    <div class="reward-value">${roundCoinsEarned} coins</div>
                </div>
                <div class="reward-item">
                    <div class="reward-icon">👛</div>
                    <div class="reward-label">Total Coins</div>
                    <div class="reward-value">${playerCoins} coins</div>
                </div>
            </div>
        `;
    }

    const rankingList = document.getElementById('ranking-list');
    if (rankingList) {
        rankingList.innerHTML = '';
        const sorted = allContestants.slice().sort((a, b) => b.score - a.score);
        const roundIndex = currentRound - 1;

        sorted.forEach((hero, index) => {
            rankingList.appendChild(createRankingItem(hero, index, hero === gameState.player, roundIndex));
        });
    }

    const nextRoundBtn = document.getElementById('next-round');
    if (nextRoundBtn) {
        nextRoundBtn.disabled = false;
        if (isEliminated) {
            nextRoundBtn.textContent = 'Eliminated';
            nextRoundBtn.disabled = true;
        } else if (currentRound === maxRounds) {
            nextRoundBtn.textContent = 'Final Results';
        } else {
            nextRoundBtn.textContent = 'Next Round';
        }
    }
}

window.HebrewGame = window.HebrewGame || {};
window.HebrewGame.ui = window.HebrewGame.ui || {};
window.HebrewGame.ui.displayRoundResults = displayRoundResults;
window.displayRoundResults = displayRoundResults;
