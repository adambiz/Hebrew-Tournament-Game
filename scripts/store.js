/**
 * Power-ups store functionality
 */

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

// Power-up definitions
const powerUps = [
    {
        id: 'double_points',
        nameKey: 'powerup.double_points.name',
        descriptionKey: 'powerup.double_points.description',
        basePrice: 6,
        effect: 'doublePoints',
        iconId: 'starburst'
    },
    {
        id: 'letter_filter',
        nameKey: 'powerup.letter_filter.name',
        descriptionKey: 'powerup.letter_filter.description',
        basePrice: 2,
        effect: 'letterFilter',
        iconId: 'warning'
    },
    {
        id: 'second_chance_round',
        nameKey: 'powerup.second_chance_round.name',
        descriptionKey: 'powerup.second_chance_round.description',
        basePrice: 4,
        effect: 'secondChanceRound',
        iconId: 'badge-blue'
    },
    {
        id: 'easier_word',
        nameKey: 'powerup.easier_word.name',
        descriptionKey: 'powerup.easier_word.description',
        basePrice: 2,
        effect: 'easierWord',
        iconId: 'easy'
    }
];

// Player's inventory of power-ups
let playerPowerUps = {};

// Initialize player's power-ups
function initializePlayerPowerUps() {
    playerPowerUps = {};
    powerUps.forEach(powerUp => {
        playerPowerUps[powerUp.id] = 0;
    });
}

// Calculate price for the current round
function calculatePowerUpPrice(powerUp, roundNumber) {
    // Price is fixed based on the basePrice
    return powerUp.basePrice;
}

// Show or hide the store
function toggleStore(show = true) {
    const storeSection = document.getElementById('store-section');
    if (show) {
        storeSection.classList.remove('hidden');
    } else {
        storeSection.classList.add('hidden');
    }
}

function renderPixelIcon(iconId, additionalClass = '') {
    if (!iconId) return '';
    const optionalClass = additionalClass ? ` ${additionalClass}` : '';
    return `<span class="pixel-icon pixel-icon--${iconId}${optionalClass}" aria-hidden="true"></span>`;
}

function playStoreSfx(soundName, options) {
    if (typeof window.playGameSound === 'function') {
        window.playGameSound(soundName, options);
    }
}

// Generate the store UI - SIMPLIFIED for kids with better spacing
function generateStoreUI(storeContainerId, playerCoins, roundNumber, onPurchase) {
    const storeContainer = document.getElementById(storeContainerId);
    if (!storeContainer) return;
    
    storeContainer.innerHTML = '';
    
    // Update the display of available coins
    const storeCoinsEl = document.getElementById('store-coins');
    if (storeCoinsEl) {
        storeCoinsEl.textContent = playerCoins;
    }
    
    // Create a container for store items
    const itemsGrid = document.createElement('div');
    itemsGrid.className = 'store-items-grid';
    storeContainer.appendChild(itemsGrid);
    
    // Create each store item
    powerUps.forEach(powerUp => {
        const price = calculatePowerUpPrice(powerUp, roundNumber);
        const canAfford = playerCoins >= price;
        const powerUpName = t(powerUp.nameKey);
        const powerUpDescription = t(powerUp.descriptionKey);
        const unaffordableLabel = t('store.needMoreCoinsBadge');
        
        const storeItem = document.createElement('div');
        storeItem.className = 'store-item pixel-frame-parchment';
        storeItem.setAttribute('data-unaffordable-label', unaffordableLabel);
        
        // Optionally add a class if the player can't afford it
        if (!canAfford) {
            storeItem.classList.add('store-item-unaffordable');
        }
        
        // Current inventory count
        const inventoryCount = playerPowerUps[powerUp.id] || 0;
        
        // Create a more kid-friendly display with less text and better spacing
        storeItem.innerHTML = `
            <div class="store-item-head">
                <span class="pixel-flag pixel-flag--sm" aria-hidden="true"></span>
                <div class="store-item-icon pixel-chip">${renderPixelIcon(powerUp.iconId)}</div>
            </div>
            <div class="store-item-name pixel-title-plate">${powerUpName}</div>
            <div class="store-item-price pixel-chip">${renderPixelIcon('coin')} ${price}</div>
            <div class="store-item-inventory pixel-chip">${t('store.ownedLabel')}: <span id="inventory-${powerUp.id}">${inventoryCount}</span></div>
            <button 
                class="store-item-button" 
                id="buy-${powerUp.id}"
                data-power-up-id="${powerUp.id}" 
                data-testid="buy-${powerUp.id}"
                aria-label="${t('store.buyAria', { name: powerUpName })}"
                aria-disabled="${canAfford ? 'false' : 'true'}"
            >
                ${t('store.buy')}
            </button>
        `;
        
        itemsGrid.appendChild(storeItem);
    });
    
    // Add event listeners to all buy buttons after they've been added to the DOM
    powerUps.forEach(powerUp => {
        const buyButton = document.getElementById(`buy-${powerUp.id}`);
        if (buyButton) {
            const price = calculatePowerUpPrice(powerUp, roundNumber);
            
            buyButton.addEventListener('click', () => {
                if (onPurchase(powerUp.id, price)) {
                    // Purchase was successful
                    
                    // Update the inventory count display
                    const inventoryDisplay = document.getElementById(`inventory-${powerUp.id}`);
                    if (inventoryDisplay) {
                        // Fix the count discrepancy by reading directly from playerPowerUps
                        inventoryDisplay.textContent = playerPowerUps[powerUp.id];
                    }
                    
                    // Update the overlay coins display too
                    const overlayCoinsDisplay = document.getElementById('overlay-store-coins');
                    if (overlayCoinsDisplay) {
                        overlayCoinsDisplay.textContent = gameState.playerCoins;
                    }
                    
                    // Update buttons that the player can no longer afford
                    updateStoreButtonsAffordability(gameState.playerCoins, roundNumber);
                    
                    // Show feedback
                    toast({
                        title: t('store.purchasedTitle'),
                        description: t('store.purchasedDesc', { name: t(powerUp.nameKey) }),
                        variant: "default"
                    });
                } else {
                    toast({
                        title: t('store.notEnoughTitle'),
                        description: t('store.notEnoughDesc', { name: t(powerUp.nameKey), price }),
                        variant: "destructive"
                    });
                }
            });
        }
    });
    
    // Update which store buttons the player can afford
    updateStoreButtonsAffordability(playerCoins, roundNumber);
}

// Update which store buttons the player can afford
function updateStoreButtonsAffordability(playerCoins, roundNumber) {
    powerUps.forEach(powerUp => {
        const buyButton = document.getElementById(`buy-${powerUp.id}`);
        if (buyButton) {
            const price = calculatePowerUpPrice(powerUp, roundNumber);
            const canAfford = playerCoins >= price;
            buyButton.disabled = false;
            buyButton.setAttribute('aria-disabled', canAfford ? 'false' : 'true');

            const storeItem = buyButton.closest('.store-item');
            if (storeItem) {
                storeItem.classList.toggle('store-item-unaffordable', !canAfford);
            }
        }
    });
    
    // Update the coins display
    const storeCoinsEl = document.getElementById('store-coins');
    if (storeCoinsEl) {
        storeCoinsEl.textContent = playerCoins;
    }
}

// Purchase a power-up - fixed to handle count correctly
function purchasePowerUp(powerUpId, price) {
    if (gameState.playerCoins >= price) {
        // Deduct coins first
        gameState.playerCoins -= price;
        
        // Then increment the inventory count
        playerPowerUps[powerUpId] = (playerPowerUps[powerUpId] || 0) + 1;
        
        // Update the display of available coins
        document.getElementById('store-coins').textContent = gameState.playerCoins;
        if (typeof updatePowerUpButtonVisibility === 'function') {
            updatePowerUpButtonVisibility();
        }

        playStoreSfx('bonusBuy', { powerUpId });
        
        return true;
    }

    playStoreSfx('bonusNoFunds', { powerUpId });
    
    return false;
}

// Generate the power-ups panel for use during gameplay
function generatePowerUpsPanel(panelId, onUse) {
    const panel = document.getElementById(panelId);
    if (!panel) return false;
    
    panel.innerHTML = '';
    
    let hasPowerUps = false;
    
    // Create a button for each owned power-up
    powerUps.forEach(powerUp => {
        const count = playerPowerUps[powerUp.id] || 0;
        
        if (count > 0) {
            hasPowerUps = true;
            
            const powerUpButton = document.createElement('button');
            powerUpButton.className = 'power-up-button';
            powerUpButton.dataset.powerUpId = powerUp.id;
            powerUpButton.innerHTML = `
                <div class="power-up-title pixel-title-plate">${renderPixelIcon(powerUp.iconId)} ${t(powerUp.nameKey)} (${count})</div>
                <div class="power-up-description pixel-chip">${t(powerUp.descriptionKey)}</div>
            `;
            
            powerUpButton.addEventListener('click', () => {
                // Get the latest count from playerPowerUps
                const currentCount = playerPowerUps[powerUp.id] || 0;
                
                // Only allow using if there are still power-ups available
                if (currentCount > 0) {
                    if (onUse(powerUp.id)) {
                        // Don't need to manually decrement here, handled in usePowerUpInGame
                        
                        // Hide the panel to refresh and recreate it (prevents count display issues)
                        panel.classList.add('hidden');
                    }
                } else {
                    // Remove the button if somehow count is 0
                    panel.removeChild(powerUpButton);
                    
                    // Hide the panel if no more power-ups
                    if (panel.children.length === 0) {
                        panel.classList.add('hidden');
                    }
                }
            });
            
            panel.appendChild(powerUpButton);
        }
    });
    
    // Return whether the player has any power-ups
    return hasPowerUps;
}

window.HebrewGame = window.HebrewGame || {};
window.HebrewGame.powerups = window.HebrewGame.powerups || {};
window.HebrewGame.powerups.generatePowerUpsPanel = generatePowerUpsPanel;
window.HebrewGame.powerups.initializePlayerPowerUps = initializePlayerPowerUps;
window.HebrewGame.powerups.purchasePowerUp = purchasePowerUp;
