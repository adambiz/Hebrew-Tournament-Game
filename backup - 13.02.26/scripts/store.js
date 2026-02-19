/**
 * Power-ups store functionality
 */

// Power-up definitions
const powerUps = [
    {
        id: 'double_points',
        name: 'Double Score',
        description: 'Doubles the points for the current word',
        basePrice: 6,
        effect: 'doublePoints',
        icon: '✨'
    },
    {
        id: 'letter_filter',
        name: 'Letter Filter',
        description: 'Disables similar-sounding letters not in the current word',
        basePrice: 2,
        effect: 'letterFilter',
        icon: '🔍'
    },
    {
        id: 'second_chance_round',
        name: 'Second Chance',
        description: 'Retry words if you make a mistake (entire round)',
        basePrice: 4,
        effect: 'secondChanceRound',
        icon: '🛡️'
    },
    {
        id: 'easier_word',
        name: 'Easier Word',
        description: 'Get an easier word with fewer letters (stackable)',
        basePrice: 2,
        effect: 'easierWord',
        icon: '🍀'
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
        
        const storeItem = document.createElement('div');
        storeItem.className = 'store-item';
        
        // Optionally add a class if the player can't afford it
        if (!canAfford) {
            storeItem.classList.add('store-item-unaffordable');
        }
        
        // Current inventory count
        const inventoryCount = playerPowerUps[powerUp.id] || 0;
        
        // Create a more kid-friendly display with less text and better spacing
        storeItem.innerHTML = `
            <div class="store-item-icon">${powerUp.icon || ''}</div>
            <div class="store-item-name">${powerUp.name}</div>
            <div class="store-item-price">${price} 💰</div>
            <div class="store-item-inventory">Owned: <span id="inventory-${powerUp.id}">${inventoryCount}</span></div>
            <button 
                class="store-item-button" 
                id="buy-${powerUp.id}"
                data-power-up-id="${powerUp.id}" 
                data-testid="buy-${powerUp.id}"
                aria-label="Buy ${powerUp.name}"
                ${canAfford ? '' : 'disabled'}
            >
                Buy Bonus
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
                        title: "Item Purchased!",
                        description: `You bought ${powerUp.name}`,
                        variant: "default"
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
            
            if (playerCoins < price) {
                buyButton.disabled = true;
                // Optionally add a visual indicator
                const storeItem = buyButton.closest('.store-item');
                if (storeItem) {
                    storeItem.classList.add('store-item-unaffordable');
                }
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
        
        return true;
    }
    
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
                <div>${powerUp.icon || ''} ${powerUp.name} (${count})</div>
                <div class="power-up-description">${powerUp.description}</div>
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
