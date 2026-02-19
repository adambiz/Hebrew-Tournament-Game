/**
 * Power-up management functions
 */

// Variable to store the panel click handler
let panelClickHandler = null;

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

function getPromptText(wordData) {
    const i18nApi = getI18nApi();
    if (i18nApi && typeof i18nApi.getPromptText === 'function') {
        return i18nApi.getPromptText(wordData);
    }
    return wordData && typeof wordData.german === 'string' ? wordData.german : '';
}

function playPowerUpSfx(soundName, options) {
    if (typeof window.playGameSound === 'function') {
        window.playGameSound(soundName, options);
    }
}

// Toggle the power-ups panel
function togglePowerUpsPanel() {
    const powerupsPanel = document.getElementById('powerups-panel');
    
    if (powerupsPanel.classList.contains('hidden')) {
        // Generate power-ups UI
        const hasPowerUps = generatePowerUpsPanel('powerups-panel', usePowerUpInGame);
        
        if (hasPowerUps) {
            powerupsPanel.classList.remove('hidden');
            
            // Add a click event listener to close the panel when clicking outside
            if (panelClickHandler) {
                // Remove existing handler if there is one
                document.removeEventListener('click', panelClickHandler);
            }
            
            // Create a new handler
            panelClickHandler = function(event) {
                // Check if the click is outside the panel and not on the power-up button
                if (!powerupsPanel.contains(event.target) && 
                    event.target.id !== 'use-powerup') {
                    // Close the panel
                    closePowerupsPanel();
                }
            };
            
            // Add the handler with a slight delay to avoid triggering it immediately
            setTimeout(() => {
                document.addEventListener('click', panelClickHandler);
            }, 10);
        } else {
            // Use toast instead of alert for better UX
            toast({
                title: t('powerups.noneTitle'),
                description: t('powerups.noneDesc'),
                variant: "destructive"
            });
        }
    } else {
        // Close the panel
        closePowerupsPanel();
    }
}

// Helper function to close the powerups panel and clean up event listener
function closePowerupsPanel() {
    const powerupsPanel = document.getElementById('powerups-panel');
    powerupsPanel.classList.add('hidden');
    
    // Remove the click handler if it exists
    if (panelClickHandler) {
        document.removeEventListener('click', panelClickHandler);
        panelClickHandler = null;
    }
}

// Check if player has any power-ups and update button visibility
function updatePowerUpButtonVisibility() {
    const hasAnyPowerUps = Object.values(playerPowerUps).some(count => count > 0);
    const powerupButton = document.getElementById('use-powerup');
    
    if (powerupButton) {
        powerupButton.classList.remove('hidden');
        if (hasAnyPowerUps) {
            powerupButton.disabled = false;
            powerupButton.removeAttribute('aria-disabled');
            powerupButton.setAttribute('aria-label', t('powerups.openMenuAria'));
            // Add a pulse animation to make it more noticeable
            if (!powerupButton.classList.contains('pulse-animation')) {
                powerupButton.classList.add('pulse-animation');
                // Remove the animation after a few seconds
                setTimeout(() => {
                    powerupButton.classList.remove('pulse-animation');
                }, 3000);
            }
        } else {
            powerupButton.disabled = true;
            powerupButton.setAttribute('aria-disabled', 'true');
            powerupButton.setAttribute('aria-label', t('powerups.noneAvailableAria'));
            powerupButton.classList.remove('pulse-animation');
        }
    }
}

// Use a power-up during gameplay
function usePowerUpInGame(powerUpId) {
    // Check if power-up is available
    if (playerPowerUps[powerUpId] <= 0) {
        playPowerUpSfx('bonusNoFunds', { powerUpId });
        return false;
    }
    
    // Apply power-up effect
    let success = false;
    
    switch (powerUpId) {
        case 'double_points':
            // Double points for current word
            success = applyDoublePointsPowerUp();
            break;
            
        case 'letter_filter':
            // Filter similar-sounding letters
            success = applyLetterFilterPowerUp();
            break;
            
        case 'second_chance_round':
            // Apply second chance for entire round
            success = applySecondChanceRoundPowerUp();
            break;
            
        case 'easier_word':
            // Get an easier word
            success = applyEasierWordPowerUp();
            break;
    }
    
    // Only decrease power-up count if successfully applied
    if (success) {
        playerPowerUps[powerUpId]--;
        playPowerUpSfx('bonusUse', { powerUpId });
        
        // Close the powerups panel using the helper function
        closePowerupsPanel();
        
        // Update power-up button visibility since inventory changed
        updatePowerUpButtonVisibility();
        
        // Refresh the panel to show updated counts
        setTimeout(() => {
            generatePowerUpsPanel('powerups-panel', usePowerUpInGame);
        }, 100);
        
        return true;
    }

    playPowerUpSfx('bonusNoFunds', { powerUpId });
    
    return false;
}

// Power-up: Double Points
function applyDoublePointsPowerUp() {
    // Activate double points for current word
    gameState.powerUpsActive.doublePoints = true;
    
    // Visual feedback
    toast({
        title: t('powerups.doublePointsTitle'),
        description: t('powerups.doublePointsDesc'),
        variant: "default"
    });
    
    return true;
}

// Power-up: Letter Filter - UPDATED VERSION
function applyLetterFilterPowerUp() {
    // Define pairs of similar-sounding Hebrew letters
    const similarLetterPairs = [
        ['א', 'ע', 'ה'],  // These three can sound similar
        ['כ', 'ח', 'ק', 'ך'],  // Guttural/throat sounds
        ['ט', 'ת'],
        ['ו', 'ב'],
        ['פ', 'ף'],
        ['ץ', 'צ']
    ];
    
    // Set to track all letters that should be disabled
    const lettersToDisable = new Set();
    
    // Get the letters from the current word/phrase
    let wordLetters = new Set();
    
    if (gameState.currentWord.isPhrase) {
        // For phrases, use the current active word
        const activeWordIndex = gameState.activeWord;
        const currentHebrewWord = gameState.currentWord.words[activeWordIndex];
        
        for (let i = 0; i < currentHebrewWord.length; i++) {
            wordLetters.add(currentHebrewWord[i]);
        }
    } else {
        // For single words, use the word directly
        const hebrewWord = gameState.currentWord.hebrew;
        for (let i = 0; i < hebrewWord.length; i++) {
            wordLetters.add(hebrewWord[i]);
        }
    }
    
    // For each group of similar letters
    similarLetterPairs.forEach(letterGroup => {
        // Find which letters in this group are in the current word
        const lettersInWord = letterGroup.filter(letter => wordLetters.has(letter));
        
        // If any letter from this group is in the word, disable all others in the group
        if (lettersInWord.length > 0) {
            letterGroup.forEach(letter => {
                if (!wordLetters.has(letter)) {
                    lettersToDisable.add(letter);
                }
            });
        }
    });
    
    // Apply the disabling effect
    if (lettersToDisable.size > 0) {
        // Save the list of disabled letters in game state
        gameState.powerUpsActive.disabledLetters = Array.from(lettersToDisable);
        
        // Flag that letter filter is active
        gameState.powerUpsActive.letterFilterActive = true;
        
        // Disable these letters on the keyboard
        disableKeyboardLetters(lettersToDisable);
        
        // Visual feedback
        toast({
            title: t('powerups.letterFilterActiveTitle'),
            description: t('powerups.letterFilterActiveDesc', { count: lettersToDisable.size }),
            variant: "default"
        });
        
        return true;
    } else {
        // No letters could be disabled
        toast({
            title: t('powerups.letterFilterTitle'),
            description: t('powerups.letterFilterNoneDesc'),
            variant: "default"
        });
        
        // Return false so we don't consume the power-up
        return false;
    }
}

// Update letter filtering for the current active word in a phrase
function updateLetterFilteringForActiveWord() {
    // Only proceed if letter filtering is active
    if (!gameState.powerUpsActive.letterFilterActive) {
        return;
    }
    
    // Only needed for phrases
    if (!gameState.currentWord || !gameState.currentWord.isPhrase) {
        return;
    }
    
    // First reset all disabled keys
    resetDisabledKeyboardLetters();
    
    // Define pairs of similar-sounding Hebrew letters
    const similarLetterPairs = [
        ['א', 'ע', 'ה'],  // These three can sound similar
        ['כ', 'ח', 'ק', 'ך'],  // Guttural/throat sounds
        ['ט', 'ת'],
        ['ו', 'ב'],
        ['פ', 'ף'],
        ['ץ', 'צ']
    ];
    
    // Set to track all letters that should be disabled
    const lettersToDisable = new Set();
    
    // Get the current active word
    const activeWordIndex = gameState.activeWord;
    const currentHebrewWord = gameState.currentWord.words[activeWordIndex];
    
    // Create a set of letters in the word
    let wordLetters = new Set();
    for (let i = 0; i < currentHebrewWord.length; i++) {
        wordLetters.add(currentHebrewWord[i]);
    }
    
    // For each group of similar letters
    similarLetterPairs.forEach(letterGroup => {
        // Find which letters in this group are in the current word
        const lettersInWord = letterGroup.filter(letter => wordLetters.has(letter));
        
        // If any letter from this group is in the word, disable all others in the group
        if (lettersInWord.length > 0) {
            letterGroup.forEach(letter => {
                if (!wordLetters.has(letter)) {
                    lettersToDisable.add(letter);
                }
            });
        }
    });
    
    // Save the updated list of disabled letters
    gameState.powerUpsActive.disabledLetters = Array.from(lettersToDisable);
    
    // Apply to the keyboard
    disableKeyboardLetters(lettersToDisable);
}

// Helper function to disable specific letters on the keyboard
function disableKeyboardLetters(lettersToDisable) {
    // Get all keyboard keys
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    
    // Loop through and disable matching letters
    keyboardKeys.forEach(key => {
        if (lettersToDisable.has(key.textContent)) {
            key.classList.add('keyboard-key-disabled');
            key.disabled = true;
        }
    });
}

// Helper function to reset disabled keyboard letters
function resetDisabledKeyboardLetters() {
    // Get all keyboard keys
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    
    // Loop through and enable all keys
    keyboardKeys.forEach(key => {
        key.classList.remove('keyboard-key-disabled');
        key.disabled = false;
    });
}

// Power-up: Second Chance for entire round
function applySecondChanceRoundPowerUp() {
    // Activate second chance for the entire round
    gameState.powerUpsActive.secondChanceRound = true;
    
    // Visual feedback
    toast({
        title: t('powerups.secondChanceTitle'),
        description: t('powerups.secondChanceDesc'),
        variant: "default"
    });
    
    return true;
}

// Power-up: Easier Word - Fixed to allow multiple applications
function applyEasierWordPowerUp() {
    // Get the current word difficulty level
    // If this is the first application, use the current round
    // Otherwise, use the stored easier word level
    const currentLevel = gameState.powerUpsActive.easierWordCurrentLevel || gameState.currentRound;
    
    // Don't allow using this power-up if already at minimum difficulty (round 1)
    if (currentLevel <= 1) {
        toast({
            title: t('powerups.cannotSimplifyTitle'),
            description: t('powerups.cannotSimplifyDesc'),
            variant: "destructive"
        });
        
        // Return false so we don't consume the power-up
        return false;
    }
    
    // Determine target round (one level easier)
    const targetLevel = currentLevel - 1;
    
    window.logDebug(`Applying easier word power-up: current level ${currentLevel}, target level ${targetLevel}`);
    
    // If this is the first application of the power-up for this word
    if (!gameState.powerUpsActive.originalWord) {
        window.logDebug('First application, storing original word');
        // Store the original word for scoring purposes
        gameState.powerUpsActive.originalWord = {
            german: gameState.currentWord.german,
            english: gameState.currentWord.english,
            hebrew: gameState.currentWord.hebrew,
            isPhrase: gameState.currentWord.isPhrase,
            words: gameState.currentWord.words ? [...gameState.currentWord.words] : null,
            wordCount: gameState.currentWord.wordCount,
            totalLetters: gameState.currentWord.totalLetters,
            round: gameState.currentRound
        };
        
        // Store the original total letters count for scoring
        gameState.powerUpsActive.originalTotalLetters = gameState.currentWord.totalLetters;
    }
    
    // Get a word from the target level
    const easierWords = getRandomWordsForRound(targetLevel, 1);
    
    if (easierWords.length === 0) {
        toast({
            title: t('powerups.errorTitle'),
            description: t('powerups.noEasierWordDesc'),
            variant: "destructive"
        });
        
        // Return false so we don't consume the power-up
        return false;
    }
    
    // Get the easier word
    const newWord = easierWords[0];
    
    // Update the game state with the new word
    gameState.currentWord = newWord;
    
    // Update the easier word current level
    gameState.powerUpsActive.easierWordCurrentLevel = targetLevel;
    
    // Calculate removed letters for scoring
    // We keep track of the total letter difference from the original word to the current word
    const originalTotalLetters = gameState.powerUpsActive.originalTotalLetters || 
                                gameState.powerUpsActive.originalWord.totalLetters;
    const newTotalLetters = newWord.totalLetters;
    
    // Total letters removed from the original
    const totalRemovedLetters = Math.max(0, originalTotalLetters - newTotalLetters);
    
    window.logDebug(`Original letters: ${originalTotalLetters}, New letters: ${newTotalLetters}, Removed: ${totalRemovedLetters}`);
    
    // Store this information to award correct points later
    gameState.powerUpsActive.removedLetters = totalRemovedLetters;
    
    // Reset typing state based on the new word type
    if (newWord.isPhrase) {
        // Reset for phrase
        gameState.typedWords = newWord.words.map(() => "");
        gameState.activeWord = 0;
        gameState.activeLetterIndex = 0;
    } else {
        // Reset for single word
        gameState.typedWord = "";
        gameState.typedWords = null;
        gameState.activeWord = 0;
        gameState.activeLetterIndex = 0;
    }
    
    // Update display
    document.getElementById('german-word').textContent = getPromptText(newWord);
    updateHebrewWordDisplay();
    
    // Initialize the keyboard with appropriate layout
    initializeKeyboard('hebrew-keyboard', handleKeyPress);

    if (
        window.HebrewGame &&
        window.HebrewGame.tts &&
        typeof window.HebrewGame.tts.onPromptChanged === 'function'
    ) {
        window.HebrewGame.tts.onPromptChanged(newWord, 'easierWordPowerUp');
    }
    
    // Visual feedback with appropriate message
    let message = t('powerups.newWordMsg', {
        word: getPromptText(newWord),
        level: targetLevel
    });
    
    if (newWord.isPhrase) {
        if (targetLevel === 5) {
            message = t('powerups.simplifiedThreeWord', { level: targetLevel });
        } else if (targetLevel === 4) {
            message = t('powerups.simplifiedTwoWord', { level: targetLevel });
        } else {
            message = t('powerups.simplifiedShortPhrase', { level: targetLevel });
        }
    } else {
        message = t('powerups.simplifiedSingleWord', { level: targetLevel });
    }
    
    toast({
        title: t('powerups.wordSimplifiedTitle'),
        description: message,
        variant: "default"
    });
    
    return true;
}

// Helper function to check if second chance should be applied
function shouldApplySecondChance() {
    // Check if either single-word second chance or round-based second chance is active
    return gameState.powerUpsActive.secondChance || gameState.powerUpsActive.secondChanceRound;
}

// Helper function to consume a second chance
function consumeSecondChance() {
    // If this is a single-word second chance, consume it
    if (gameState.powerUpsActive.secondChance) {
        gameState.powerUpsActive.secondChance = false;
        return true;
    }
    
    // If this is a round-based second chance, don't consume it (lasts whole round)
    if (gameState.powerUpsActive.secondChanceRound) {
        return true;
    }
    
    return false;
}

// Helper function to get the correct point value when using the easier word power-up
function getPointsForEasierWord(correctLetters) {
    // If we've made the word easier
    if (gameState.powerUpsActive.originalWord) {
        // Calculate how many points to award:
        // - correctLetters = How many letters the user got correct in the current easier word
        // - removedLetters = How many letters were removed by the power-up (these count as automatically correct)
        const removedLetters = gameState.powerUpsActive.removedLetters || 0;
        
        // Return the sum of correct letters plus removed letters (which count as correct)
        return correctLetters + removedLetters;
    }
    
    // If no easier word power-up was used, just return the number of correct letters
    return correctLetters;
}

window.HebrewGame = window.HebrewGame || {};
window.HebrewGame.powerups = window.HebrewGame.powerups || {};
window.HebrewGame.powerups.togglePowerUpsPanel = togglePowerUpsPanel;
window.HebrewGame.powerups.updatePowerUpButtonVisibility = updatePowerUpButtonVisibility;
window.HebrewGame.powerups.usePowerUpInGame = usePowerUpInGame;
