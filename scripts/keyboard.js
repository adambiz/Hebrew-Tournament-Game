/**
 * Hebrew keyboard implementation
 */

// Correct Hebrew keyboard layout (standard Israeli layout)
const hebrewKeyboardLayout = [
    ['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'],
    ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'],
    ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ']
];

// Store the current keydown handler for cleanup
let currentKeydownHandler = null;

// Track if the keyboard has been initialized already
let isKeyboardInitialized = false;

// Initialize the Hebrew keyboard
function initializeKeyboard(containerId, onKeyPress) {
    const keyboardContainer = document.getElementById(containerId);
    if (!keyboardContainer) {
        console.error('Keyboard container not found:', containerId);
        return;
    }
    
    // Clear any existing content
    keyboardContainer.innerHTML = '';
    
    // For each row in the layout
    hebrewKeyboardLayout.forEach(row => {
        // Create a row div
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        rowDiv.style.display = 'flex';
        rowDiv.style.justifyContent = 'center';
        rowDiv.style.marginBottom = '8px';
        
        // For each key in the row
        row.forEach(key => {
            const button = document.createElement('button');
            button.className = 'keyboard-key';
            button.textContent = key;
            button.type = 'button'; // Explicitly set type to prevent form submission
            button.setAttribute('aria-label', `Hebrew letter ${key}`);
            
            // Check if this key should be disabled
            if (gameState.powerUpsActive && 
                gameState.powerUpsActive.disabledLetters && 
                gameState.powerUpsActive.disabledLetters.includes(key)) {
                button.classList.add('keyboard-key-disabled');
                button.disabled = true;
            }
            
            // Add click event listener
            button.addEventListener('click', function(event) {
                // Prevent default to ensure no unexpected behavior
                event.preventDefault();
                event.stopPropagation();
                
                // Only process if the key is not disabled
                if (!button.disabled) {
                    // Call the provided callback
                    onKeyPress(key);
                }
            });
            
            rowDiv.appendChild(button);
        });
        
        keyboardContainer.appendChild(rowDiv);
    });
    
    // Add a backspace row
    const controlsRow = document.createElement('div');
    controlsRow.className = 'keyboard-row';
    controlsRow.style.display = 'flex';
    controlsRow.style.justifyContent = 'center';
    
    // Add backspace key
    const backspaceButton = document.createElement('button');
    backspaceButton.className = 'keyboard-key keyboard-backspace';
    backspaceButton.textContent = '⌫';
    backspaceButton.type = 'button';
    backspaceButton.setAttribute('aria-label', 'Backspace');
    backspaceButton.style.width = '120px';
    backspaceButton.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        onKeyPress('backspace');
    });
    
    controlsRow.appendChild(backspaceButton);
    keyboardContainer.appendChild(controlsRow);
}

// CORRECT Hebrew keyboard mapping based on user-provided mapping
const hebrewKeyMap = {
    // Top row - QWERTYUIOP exactly as specified
    'q': '/',
    'w': '\'', // Apostrophe/Geresh
    'e': 'ק',
    'r': 'ר',
    't': 'א',
    'y': 'ט',
    'u': 'ו',
    'i': 'ן',
    'o': 'ם',
    'p': 'פ',
    
    // Middle row - ASDFGHJKL (typical Israeli layout)
    'a': 'ש',
    's': 'ד',
    'd': 'ג',
    'f': 'כ',
    'g': 'ע',
    'h': 'י',
    'j': 'ח',
    'k': 'ל',
    'l': 'ך',
    ';': 'ף',
    "'": ',',
    
    // Bottom row - ZXCVBNM (typical Israeli layout)
    'z': 'ז',
    'x': 'ס',
    'c': 'ב',
    'v': 'ה',
    'b': 'נ',
    'n': 'מ',
    'm': 'צ',
    ',': 'ת',
    '.': 'ץ',
    '/': '.',
    
    // Uppercase variants (for shift key) - consistent with lowercase
    'Q': '/',
    'W': '\'',
    'E': 'ק',
    'R': 'ר',
    'T': 'א',
    'Y': 'ט',
    'U': 'ו',
    'I': 'ן',
    'O': 'ם',
    'P': 'פ',
    'A': 'ש',
    'S': 'ד',
    'D': 'ג',
    'F': 'כ',
    'G': 'ע',
    'H': 'י',
    'J': 'ח',
    'K': 'ל',
    'L': 'ך',
    'Z': 'ז',
    'X': 'ס',
    'C': 'ב',
    'V': 'ה',
    'B': 'נ',
    'N': 'מ',
    'M': 'צ',
    '<': 'ת',
    '>': 'ץ',
    '?': '.',
    
    // Backspace key special handling
    'Backspace': 'backspace'
};

// Map physical keyboard keys to Hebrew letters using the fixed mapping
function mapPhysicalKeyToHebrew(key) {
    return hebrewKeyMap[key] || null;
}

// Initialize physical keyboard support
function initializePhysicalKeyboard(onKeyPress) {
    // Always remove existing handler to prevent duplicate inputs
    if (currentKeydownHandler) {
        if (typeof window.logDebug === 'function') window.logDebug('Removing existing keyboard event listener');
        document.removeEventListener('keydown', currentKeydownHandler);
        currentKeydownHandler = null;
    }
    
    // Create a new handler function
    currentKeydownHandler = (event) => {
        if (
            window.HebrewGame &&
            window.HebrewGame.ui &&
            typeof window.HebrewGame.ui.isStoreOverlayOpen === 'function' &&
            window.HebrewGame.ui.isStoreOverlayOpen()
        ) {
            return;
        }

        // Debug cheat: press 2 to force-finish the current round with a winning score.
        if (
            event.key === '2' &&
            !event.shiftKey &&
            !event.altKey &&
            !event.metaKey &&
            !event.ctrlKey
        ) {
            const debugApi = window.HebrewGame && window.HebrewGame.debug ? window.HebrewGame.debug : null;
            if (debugApi && typeof debugApi.forceWinRound === 'function') {
                const didForceWin = !event.repeat && debugApi.forceWinRound();
                if (didForceWin) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
            }
        }

        // Handle backspace key directly
        if (event.key === 'Backspace') {
            event.preventDefault();
            onKeyPress('backspace');
            return;
        }

        // Support keyboard-based cursor movement inside the Hebrew editor
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
            if (!gameState.currentWord) return;

            const editorHelper = window.HebrewGame &&
                window.HebrewGame.words &&
                typeof window.HebrewGame.words.setActiveLetter === 'function'
                ? window.HebrewGame.words.setActiveLetter
                : null;
            if (!editorHelper) return;

            const currentWordIndex = gameState.currentWord.isPhrase ? gameState.activeWord : 0;
            const maxLength = gameState.currentWord.isPhrase
                ? gameState.currentWord.words[currentWordIndex].length
                : gameState.currentWord.hebrew.length;

            let nextLetterIndex = gameState.activeLetterIndex;
            if (event.key === 'ArrowLeft') nextLetterIndex = gameState.activeLetterIndex + 1;
            if (event.key === 'ArrowRight') nextLetterIndex = gameState.activeLetterIndex - 1;
            if (event.key === 'Home') nextLetterIndex = 0;
            if (event.key === 'End') nextLetterIndex = maxLength;

            event.preventDefault();
            editorHelper(currentWordIndex, nextLetterIndex);
            return;
        }
        
        // Handle Enter key for submission
        if (event.key === 'Enter') {
            const roundScreen = document.getElementById('round-screen');
            const isRoundScreenVisible = !!roundScreen && !roundScreen.classList.contains('hidden');
            if (!isRoundScreenVisible) {
                return;
            }

            // Check if the submit button is enabled
            const submitButton = document.getElementById('submit-word');
            if (submitButton && !submitButton.disabled) {
                event.preventDefault();
                // If enabled, trigger the submit function
                if (typeof window.logDebug === 'function') window.logDebug('Enter key pressed - submitting word');
                if (typeof window.submitWord === 'function') {
                    window.submitWord();
                } else {
                    console.error('submitWord function not found or not accessible!');
                }
            } else {
                return;
            }
            return;
        }
        
        // Map the key to Hebrew using our consistent mapping
        const hebrewKey = mapPhysicalKeyToHebrew(event.key);
        
        if (hebrewKey) {
            // Check if this key is disabled by the letter filter power-up
            if (gameState.powerUpsActive && 
                gameState.powerUpsActive.disabledLetters && 
                gameState.powerUpsActive.disabledLetters.includes(hebrewKey)) {
                // Key is disabled, don't process it
                event.preventDefault();
                if (typeof window.playGameSound === 'function') {
                    window.playGameSound('letterWrong');
                }
                
                // Optional feedback that key is disabled
                const keyboardKey = Array.from(document.querySelectorAll('.keyboard-key'))
                    .find(keyEl => keyEl.textContent === hebrewKey);
                if (keyboardKey) {
                    keyboardKey.classList.add('keyboard-key-highlight-disabled');
                    setTimeout(() => {
                        keyboardKey.classList.remove('keyboard-key-highlight-disabled');
                    }, 300);
                }
                
                return;
            }
            
            event.preventDefault();
            onKeyPress(hebrewKey);
        }
    };
    
    // Add the new handler
    document.addEventListener('keydown', currentKeydownHandler);
    isKeyboardInitialized = true;
    if (typeof window.logDebug === 'function') {
        window.logDebug('New keyboard event listener added with user-provided mapping and Enter key support');
    }
}

// Fully reset the physical keyboard - important for consistent behavior between rounds
function resetPhysicalKeyboard(onKeyPress) {
    // Always remove the existing handler
    if (currentKeydownHandler) {
        if (typeof window.logDebug === 'function') window.logDebug('Fully resetting physical keyboard');
        document.removeEventListener('keydown', currentKeydownHandler);
        currentKeydownHandler = null;
        isKeyboardInitialized = false;
    }
    
    // Reinitialize with the correct handler
    initializePhysicalKeyboard(onKeyPress);
}

// Disable specific keys (for letter filter power-up)
function disableKeyboardKeys(keysToDisable) {
    // Get all keyboard keys
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    
    // Loop through and disable matching keys
    keyboardKeys.forEach(key => {
        if (keysToDisable.has(key.textContent)) {
            key.classList.add('keyboard-key-disabled');
            key.disabled = true;
        }
    });
}

// Enable all keys (reset disabled state)
function enableAllKeyboardKeys() {
    // Get all keyboard keys
    const keyboardKeys = document.querySelectorAll('.keyboard-key');
    
    // Remove disabled state from all keys
    keyboardKeys.forEach(key => {
        key.classList.remove('keyboard-key-disabled');
        key.disabled = false;
    });
}

// Reset all keys (clear the "used" state)
function resetKeyboard() {
    // Clear any disabled keys
    if (gameState.powerUpsActive && gameState.powerUpsActive.disabledLetters) {
        gameState.powerUpsActive.disabledLetters = [];
    }
    
    // Enable all keys
    enableAllKeyboardKeys();
}
