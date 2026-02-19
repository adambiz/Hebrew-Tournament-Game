/**
 * Word handling functions
 * Fixed to prevent double-counting in scoring
 */

function announceWordUi(message) {
    if (
        window.HebrewGame &&
        window.HebrewGame.ui &&
        typeof window.HebrewGame.ui.announce === 'function'
    ) {
        window.HebrewGame.ui.announce(message);
    }
}

function playWordSfx(soundName, options) {
    if (typeof window.playGameSound === 'function') {
        window.playGameSound(soundName, options);
    }
}

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

function notifyTtsPromptChanged(wordData, source) {
    if (
        window.HebrewGame &&
        window.HebrewGame.tts &&
        typeof window.HebrewGame.tts.onPromptChanged === 'function'
    ) {
        window.HebrewGame.tts.onPromptChanged(wordData, source || 'unknown');
    }
}

function getCurrentWordLengthForIndex(wordIndex) {
    if (!gameState.currentWord) return 0;
    if (gameState.currentWord.isPhrase) {
        const safeWordIndex = Math.max(0, Math.min(gameState.currentWord.words.length - 1, wordIndex));
        return gameState.currentWord.words[safeWordIndex].length;
    }
    return gameState.currentWord.hebrew.length;
}

function setWordSlotMetadata(slotElement, slotState) {
    if (!slotElement) return;
    slotElement.setAttribute('data-testid', 'word-slot');
    slotElement.dataset.state = slotState;
}

function setActiveLetter(wordIndex, letterIndex) {
    if (!gameState.currentWord) return false;

    let nextWordIndex = 0;
    if (gameState.currentWord.isPhrase) {
        nextWordIndex = Math.max(0, Math.min(gameState.currentWord.words.length - 1, wordIndex || 0));
    }

    const maxLetters = getCurrentWordLengthForIndex(nextWordIndex);
    const nextLetterIndex = Math.max(0, Math.min(maxLetters, letterIndex));

    gameState.activeWord = nextWordIndex;
    gameState.activeLetterIndex = nextLetterIndex;
    updateHebrewWordDisplay();

    if (gameState.powerUpsActive.letterFilterActive) {
        updateLetterFilteringForActiveWord();
    }

    return true;
}

function bindWordInputKeyboardAccess() {
    const wordInput = document.getElementById('hebrew-word-input');
    if (!wordInput || wordInput.dataset.keyboardCursorBound === '1') return;

    wordInput.dataset.keyboardCursorBound = '1';
    wordInput.addEventListener('keydown', function onWordEditorKeydown(event) {
        if (!gameState.currentWord) return;

        const currentWordIndex = gameState.currentWord.isPhrase ? gameState.activeWord : 0;
        const currentLetterIndex = gameState.activeLetterIndex;
        const maxLetters = getCurrentWordLengthForIndex(currentWordIndex);

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setActiveLetter(currentWordIndex, currentLetterIndex + 1);
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            setActiveLetter(currentWordIndex, currentLetterIndex - 1);
            return;
        }

        if (event.key === 'Home') {
            event.preventDefault();
            setActiveLetter(currentWordIndex, 0);
            return;
        }

        if (event.key === 'End') {
            event.preventDefault();
            setActiveLetter(currentWordIndex, maxLetters);
        }
    });
}

// Start the next word in the round
function startNextWord() {
    window.logDebug('startNextWord called, currentWordIndex:', gameState.currentWordIndex, 
                'roundWords length:', gameState.roundWords ? gameState.roundWords.length : 'undefined');
    
    // Check if round is complete
    if (gameState.currentWordIndex >= gameState.roundWords.length) {
        window.logDebug('Round should be complete, calling completeRound()');
        
        // Use the global completeRound function with explicit window reference
        window.completeRound();
        return;
    }
    
    // Get the current word
    gameState.currentWord = gameState.roundWords[gameState.currentWordIndex];
    
    // Set up typed word state for multi-word support
    if (gameState.currentWord.isPhrase) {
        // For phrases, we need to track each word separately
        gameState.typedWords = gameState.currentWord.words.map(() => "");
        gameState.activeWord = 0; // Track which word we're actively editing
        gameState.activeLetterIndex = 0; // Track which letter in the word is active for editing
    } else {
        // For single words, use the original structure
        gameState.typedWord = "";
        gameState.typedWords = null;
        gameState.activeWord = 0;
        gameState.activeLetterIndex = 0;
    }
    
    // Reset active power-ups for this word
    gameState.powerUpsActive.doublePoints = false;
    gameState.powerUpsActive.disabledLetters = [];
    gameState.powerUpsActive.letterFilterActive = false; // Reset letter filter flag
    gameState.powerUpsActive.originalWord = null;
    gameState.powerUpsActive.removedLetters = 0;
    gameState.powerUpsActive.easierWordCurrentLevel = 0;
    gameState.powerUpsActive.revealedLetters = [];
    
    // Note that secondChanceRound is not reset as it applies to the entire round
    
    window.logDebug('Starting new word:', gameState.currentWord);
    
    // Update display
    document.getElementById('german-word').textContent = getPromptText(gameState.currentWord);
    document.getElementById('current-word-counter').textContent = 
        t('round.wordCounter', {
            current: gameState.currentWordIndex + 1,
            total: gameState.roundWords.length
        });
    
    // Update round progress display
    const progressPercent = (gameState.currentWordIndex / gameState.roundWords.length) * 100;
    updateProgressBar(progressPercent);
    
    // Reset keyboard for new word
    resetKeyboard();
    
    // Initialize word display with underscores
    updateHebrewWordDisplay();
    
    // Initialize the keyboard - only the on-screen keyboard, not the physical keyboard
    // (Physical keyboard is already initialized at the round level)
    initializeKeyboard('hebrew-keyboard', handleKeyPress);
    
    // Show the submit button and ensure it's disabled initially
    const submitButton = document.getElementById('submit-word');
    if (submitButton) {
        submitButton.classList.remove('hidden');
        submitButton.disabled = true;
        submitButton.classList.remove('submit-button-ready');
    }

    const wordInput = document.getElementById('hebrew-word-input');
    if (wordInput) {
        wordInput.focus();
        bindWordInputKeyboardAccess();
    }

    notifyTtsPromptChanged(gameState.currentWord, 'startNextWord');
}

// Handle keyboard key press
function handleKeyPress(key) {
    window.logDebug('Key pressed:', key);
    let didChangeInput = false;
    
    // For multi-word phrases
    if (gameState.currentWord.isPhrase) {
        const activeWord = gameState.activeWord;
        const currentHebrewWord = gameState.currentWord.words[activeWord];
        const activeLetterIndex = gameState.activeLetterIndex;
        
        if (key === 'backspace') {
            // Handle backspace - remove the letter at the active index or move to previous word
            const typedWord = gameState.typedWords[activeWord];
            
            if (typedWord.length > 0 && activeLetterIndex > 0) {
                // Remove the letter at or before the active index
                const newWord = typedWord.substring(0, activeLetterIndex - 1) + 
                               typedWord.substring(activeLetterIndex);
                               
                gameState.typedWords[activeWord] = newWord;
                gameState.activeLetterIndex = Math.max(0, activeLetterIndex - 1);
                didChangeInput = true;
            } else if (activeWord > 0 && activeLetterIndex === 0) {
                // Move to the end of the previous word
                gameState.activeWord = activeWord - 1;
                gameState.activeLetterIndex = gameState.typedWords[activeWord - 1].length;
                didChangeInput = true;
                
                // Update letter filtering for the new active word
                if (gameState.powerUpsActive.letterFilterActive) {
                    updateLetterFilteringForActiveWord();
                }
            }
        } else {
            // Handle letter key
            const typedWord = gameState.typedWords[activeWord];
            
            // If we're at a position within the existing word, replace the letter
            if (activeLetterIndex < typedWord.length) {
                const newWord = typedWord.substring(0, activeLetterIndex) + 
                               key + 
                               typedWord.substring(activeLetterIndex + 1);
                               
                gameState.typedWords[activeWord] = newWord;
                gameState.activeLetterIndex++;
                didChangeInput = true;
            } 
            // Otherwise append the letter if we're not past the word length
            else if (activeLetterIndex < currentHebrewWord.length) {
                const newWord = typedWord.substring(0, activeLetterIndex) + 
                               key + 
                               typedWord.substring(activeLetterIndex);
                               
                gameState.typedWords[activeWord] = newWord;
                gameState.activeLetterIndex++;
                didChangeInput = true;
                
                // Check if word is full and we can move to the next word
                if (newWord.length >= currentHebrewWord.length && activeWord < gameState.currentWord.words.length - 1) {
                    // Move to the beginning of the next word
                    gameState.activeWord = activeWord + 1;
                    gameState.activeLetterIndex = 0;
                    
                    // Update letter filtering for the new active word
                    if (gameState.powerUpsActive.letterFilterActive) {
                        updateLetterFilteringForActiveWord();
                    }
                }
            }
        }
    } else {
        // Single word handling
        const expectedWordLength = gameState.currentWord.hebrew.length;
        const activeLetterIndex = gameState.activeLetterIndex;
        
        if (key === 'backspace') {
            // Handle backspace - remove the letter at the active index
            if (gameState.typedWord.length > 0 && activeLetterIndex > 0) {
                // Remove the letter at the active index
                const newWord = gameState.typedWord.substring(0, activeLetterIndex - 1) + 
                              gameState.typedWord.substring(activeLetterIndex);
                              
                gameState.typedWord = newWord;
                gameState.activeLetterIndex = Math.max(0, activeLetterIndex - 1);
                didChangeInput = true;
            }
        } else {
            // If we're at a position within the existing word, replace the letter
            if (activeLetterIndex < gameState.typedWord.length) {
                const newWord = gameState.typedWord.substring(0, activeLetterIndex) + 
                              key + 
                              gameState.typedWord.substring(activeLetterIndex + 1);
                              
                gameState.typedWord = newWord;
                gameState.activeLetterIndex++;
                didChangeInput = true;
            }
            // Otherwise append the letter if we're not past the word length
            else if (activeLetterIndex < expectedWordLength) {
                const newWord = gameState.typedWord.substring(0, activeLetterIndex) + 
                              key + 
                              gameState.typedWord.substring(activeLetterIndex);
                              
                gameState.typedWord = newWord;
                gameState.activeLetterIndex++;
                didChangeInput = true;
            }
        }
    }

    if (didChangeInput) {
        if (key === 'backspace') {
            playWordSfx('deleteLetter');
        } else {
            playWordSfx('typeLetter');
        }
    }
    
    // Update the display after any change
    updateHebrewWordDisplay();
    
    // Update submit button state
    updateSubmitButtonState();
}

// Check if the submit button should be enabled (word or phrase is complete)
function updateSubmitButtonState() {
    const submitButton = document.getElementById('submit-word');
    if (!submitButton) return;
    
    let isComplete = false;
    
    if (gameState.currentWord.isPhrase) {
        // Check if all words in the phrase are filled completely
        isComplete = true; // Start with true and check each word
        
        for (let i = 0; i < gameState.currentWord.words.length; i++) {
            const expectedWord = gameState.currentWord.words[i];
            const typedWord = gameState.typedWords[i] || "";
            
            // If any word is not filled completely, the phrase is not complete
            if (typedWord.length < expectedWord.length) {
                isComplete = false;
                break;
            }
        }
    } else {
        // For single words, check if the typed word length matches the expected length
        const expectedWordLength = gameState.currentWord.hebrew.length;
        isComplete = gameState.typedWord.length === expectedWordLength;
    }
    
    // Update button state
    submitButton.disabled = !isComplete;
    
    if (isComplete) {
        submitButton.classList.add('submit-button-ready');
    } else {
        submitButton.classList.remove('submit-button-ready');
    }
    
    window.logDebug('Submit button state updated. Is complete:', isComplete);
}

// Check if the entire phrase is complete (all words filled)
function isEntirePhraseComplete() {
    if (!gameState.currentWord.isPhrase) return false;
    
    for (let i = 0; i < gameState.currentWord.words.length; i++) {
        const expectedWord = gameState.currentWord.words[i];
        const typedWord = gameState.typedWords[i] || "";
        
        if (typedWord.length < expectedWord.length) {
            return false;
        }
    }
    
    return true;
}

// Update the display of the Hebrew word being typed
function updateHebrewWordDisplay() {
    const wordInput = document.getElementById('hebrew-word-input');
    if (!wordInput) {
        console.error('Hebrew word input element not found');
        return;
    }
    
    // Check if we're dealing with a phrase or a single word
    if (gameState.currentWord.isPhrase) {
        // Multi-word phrase display
        const displayElements = [];
        const allWords = gameState.currentWord.words;
        const typedWords = gameState.typedWords;
        const activeWord = gameState.activeWord;
        const activeLetterIndex = gameState.activeLetterIndex;
        
        // Create word containers for each word
        allWords.forEach((word, wordIndex) => {
            const isActiveWord = wordIndex === activeWord;
            const typedWord = typedWords[wordIndex] || "";
            
            // Create a word container
            const wordContainer = document.createElement('div');
            wordContainer.className = 'hebrew-word-container';
            wordContainer.dataset.wordIndex = wordIndex;
            
            if (isActiveWord) {
                wordContainer.classList.add('active-word-container');
            }
            
            // Add click event to make this word active
            wordContainer.addEventListener('click', () => {
                gameState.activeWord = wordIndex;
                gameState.activeLetterIndex = typedWord.length;
                updateHebrewWordDisplay();
                
                // Update letter filtering if active
                if (gameState.powerUpsActive.letterFilterActive) {
                    updateLetterFilteringForActiveWord();
                }
            });
            
            // Create letter elements for this word
            const letterElements = [];
            
            for (let i = 0; i < word.length; i++) {
                const isActivePosition = isActiveWord && i === activeLetterIndex;
                const isCursorEndPosition = isActiveWord && activeLetterIndex >= word.length && i === word.length - 1;
                let slotState = 'placeholder';
                
                // Create a letter container that's clickable
                const letterContainer = document.createElement('div');
                letterContainer.className = 'letter-container';
                letterContainer.dataset.letterIndex = i;
                letterContainer.dataset.wordIndex = wordIndex;
                
                // Add click event to position cursor at this letter
                letterContainer.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering the word container click
                    handleLetterClick(wordIndex, i);
                });
                
                // If the letter is typed, show it
                if (i < typedWord.length) {
                    // If this is the active position, add a special class
                    const letterClass = isActivePosition ? 'typed-letter active-letter' : 'typed-letter';
                    
                    // If this is a revealed letter, style it differently
                    if (gameState.powerUpsActive.revealedLetters.includes(getAbsoluteLetterIndex(wordIndex, i))) {
                        letterContainer.innerHTML = `<span class="revealed-letter">${typedWord[i]}</span>`;
                        slotState = 'revealed';
                    } else {
                        letterContainer.innerHTML = `<span class="${letterClass}">${typedWord[i]}</span>`;
                        slotState = 'typed';
                    }
                } else if (gameState.powerUpsActive.revealedLetters.includes(getAbsoluteLetterIndex(wordIndex, i))) {
                    // Show revealed letters even if not typed yet
                    letterContainer.innerHTML = `<span class="revealed-letter">${word[i]}</span>`;
                    slotState = 'revealed';
                } else {
                    // Show placeholder for letters not yet typed
                    letterContainer.innerHTML = `<span class="letter-placeholder"></span>`;
                }
                
                // Add active marker for cursor position
                if (isActivePosition || isCursorEndPosition) {
                    letterContainer.classList.add('active-letter-container');
                }
                if (isCursorEndPosition) {
                    letterContainer.classList.add('cursor-end');
                    slotState = 'cursor-end';
                }
                setWordSlotMetadata(letterContainer, slotState);
                
                letterElements.push(letterContainer.outerHTML);
            }
            
            // Set the word container content
            wordContainer.innerHTML = letterElements.join('');
            
            // Add to display elements
            displayElements.push(wordContainer.outerHTML);
        });
        
        // Set the complete phrase display
        wordInput.innerHTML = displayElements.join('');
        
        // Add click events to all letter containers for direct editing
        const letterContainers = wordInput.querySelectorAll('.letter-container');
        letterContainers.forEach(container => {
            const parentWordContainer = container.closest('.hebrew-word-container');
            if (!parentWordContainer) return;
            const wordIndex = parseInt(parentWordContainer.dataset.wordIndex, 10);
            const letterIndex = parseInt(container.dataset.letterIndex, 10);
            if (Number.isNaN(wordIndex) || Number.isNaN(letterIndex)) return;
            
            container.addEventListener('click', () => {
                handleLetterClick(wordIndex, letterIndex);
            });
        });
    } else {
        // Single word display (original logic but with clickable letters)
        const expectedWord = gameState.currentWord.hebrew;
        const typedWord = gameState.typedWord;
        const activeLetterIndex = gameState.activeLetterIndex;
        
        // Create a word container
        const wordContainer = document.createElement('div');
        wordContainer.className = 'hebrew-word-container active-word-container';
        
        // Create display with clickable letter positions
        const letterElements = [];
        for (let i = 0; i < expectedWord.length; i++) {
            const isActivePosition = i === activeLetterIndex;
            const isCursorEndPosition = activeLetterIndex >= expectedWord.length && i === expectedWord.length - 1;
            let slotState = 'placeholder';
            
            // Create a letter container
            const letterContainer = document.createElement('div');
            letterContainer.className = 'letter-container';
            letterContainer.dataset.letterIndex = i;
            
            // Add click event to position cursor at this letter
            letterContainer.addEventListener('click', () => {
                setActiveLetter(0, i);
            });
            
            // If the letter is typed or revealed, show it
            if (i < typedWord.length) {
                // If this is the active position, add a special class
                const letterClass = isActivePosition ? 'typed-letter active-letter' : 'typed-letter';
                
                // If this is a revealed letter, style it differently
                if (gameState.powerUpsActive.revealedLetters.includes(i)) {
                    letterContainer.innerHTML = `<span class="revealed-letter">${typedWord[i]}</span>`;
                    slotState = 'revealed';
                } else {
                    letterContainer.innerHTML = `<span class="${letterClass}">${typedWord[i]}</span>`;
                    slotState = 'typed';
                }
            } else if (gameState.powerUpsActive.revealedLetters.includes(i)) {
                // Show revealed letters even if not typed yet
                letterContainer.innerHTML = `<span class="revealed-letter">${expectedWord[i]}</span>`;
                slotState = 'revealed';
            } else {
                // Show placeholder for letters not yet typed
                letterContainer.innerHTML = `<span class="letter-placeholder"></span>`;
            }
            
            // Add active marker for cursor position
            if (isActivePosition || isCursorEndPosition) {
                letterContainer.classList.add('active-letter-container');
            }
            if (isCursorEndPosition) {
                letterContainer.classList.add('cursor-end');
                slotState = 'cursor-end';
            }
            setWordSlotMetadata(letterContainer, slotState);
            
            letterElements.push(letterContainer.outerHTML);
        }
        
        wordContainer.innerHTML = letterElements.join('');
        wordInput.innerHTML = wordContainer.outerHTML;
        
        // Add click events to all letter containers
        const letterContainers = wordInput.querySelectorAll('.letter-container');
        letterContainers.forEach(container => {
            const letterIndex = parseInt(container.dataset.letterIndex, 10);
            if (Number.isNaN(letterIndex)) return;
            
            container.addEventListener('click', () => {
                setActiveLetter(0, letterIndex);
            });
        });
    }
    
    // Apply RTL direction for Hebrew
    wordInput.style.direction = 'rtl';
}

// Helper function to handle letter click events
function handleLetterClick(wordIndex, letterIndex) {
    if (!Number.isFinite(wordIndex) || !Number.isFinite(letterIndex)) return;
    setActiveLetter(wordIndex, letterIndex);
}

// Helper function to calculate the absolute letter index in a multi-word phrase
function getAbsoluteLetterIndex(wordIndex, letterIndex) {
    // Calculate absolute position for revealed letters in multi-word phrases
    let absoluteIndex = letterIndex;
    const words = gameState.currentWord.words;
    
    // Add lengths of all previous words
    for (let i = 0; i < wordIndex; i++) {
        absoluteIndex += words[i].length;
    }
    
    // Add the number of spaces (wordIndex)
    absoluteIndex += wordIndex;
    
    return absoluteIndex;
}

// ======== SUBMIT AND SCORING FUNCTIONS - FIXED TO PREVENT DOUBLE-COUNTING ========

// Track if we're already processing a word submission to prevent duplicate calls
let isProcessingWordSubmission = false;

// Handle submission of the typed word
function submitWord() {
    window.logDebug('submitWord called');
    
    // CRITICAL FIX: If we're already processing a word submission, don't allow another one
    if (isProcessingWordSubmission) {
        window.logDebug('Already processing a word submission - ignoring duplicate call');
        return;
    }
    
    // Set the processing flag to prevent duplicate calls
    isProcessingWordSubmission = true;
    
    // Disable the submit button to prevent multiple submissions
    const submitButton = document.getElementById('submit-word');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.remove('submit-button-ready');
    }

    playWordSfx('submit');
    
    // Start the sequential checking animation
    checkWordSequentially();
}

// New function for sequential letter checking with animation
function checkWordSequentially() {
    window.logDebug('Starting sequential word check');
    playWordSfx('checkStart');
    
    // Create a container for the checking animation
    const wordInput = document.getElementById('hebrew-word-input');
    const animationContainer = document.createElement('div');
    animationContainer.className = 'checking-animation-container';
    wordInput.parentNode.appendChild(animationContainer);
    
    // Set up the sequential checking process
    let letterCheckingDelay = 180; // ms delay between letter checks (FASTER)
    let totalScore = 0;
    let correctLetters = 0;
    let totalLetters = 0;
    let letterChecks = [];
    
    // Prepare data structure for checking
    if (gameState.currentWord.isPhrase) {
        // For phrases, collect checks for all words
        gameState.currentWord.words.forEach((expectedWord, wordIndex) => {
            const typedWord = gameState.typedWords[wordIndex] || "";
            
            for (let i = 0; i < expectedWord.length; i++) {
                const expectedLetter = expectedWord[i];
                const typedLetter = i < typedWord.length ? typedWord[i] : "";
                const isCorrect = typedLetter === expectedLetter;
                
                letterChecks.push({
                    wordIndex,
                    letterIndex: i,
                    expected: expectedLetter,
                    typed: typedLetter,
                    isCorrect
                });
                
                totalLetters++;
                if (isCorrect) correctLetters++;
            }
        });
    } else {
        // For single words
        const expectedWord = gameState.currentWord.hebrew;
        const typedWord = gameState.typedWord || "";
        
        for (let i = 0; i < expectedWord.length; i++) {
            const expectedLetter = expectedWord[i];
            const typedLetter = i < typedWord.length ? typedWord[i] : "";
            const isCorrect = typedLetter === expectedLetter;
            
            letterChecks.push({
                wordIndex: 0,
                letterIndex: i,
                expected: expectedLetter,
                typed: typedLetter,
                isCorrect
            });
            
            totalLetters++;
            if (isCorrect) correctLetters++;
        }
    }
    
    // Start the sequential animation
    let currentCheckIndex = 0;
    
    function checkNextLetter() {
        if (currentCheckIndex >= letterChecks.length) {
            // All letters checked, finalize the check
            // Wait a bit longer to see the final letter state
            setTimeout(() => {
                finalizeWordCheck(correctLetters, totalLetters, letterChecks);
            }, 300); // Added delay before finalizing
            return;
        }
        
        const check = letterChecks[currentCheckIndex];
        const letterElement = findLetterElement(check.wordIndex, check.letterIndex);
        
        if (letterElement) {
            // Highlight the current letter being checked
            letterElement.classList.add('checking-letter');
            
            // Create and show the point indicator
            const points = check.isCorrect ? 1 : 0;
            // IMPORTANT: We don't add to totalScore here to avoid double-counting
            // totalScore += points;
            
            showPointIndicator(letterElement, points);
            
            // Reveal the letter status (correct or incorrect)
            setTimeout(() => {
                // Remove checking class
                letterElement.classList.remove('checking-letter');
                
                // Add result class - ensure consistent size
                if (check.isCorrect) {
                    letterElement.classList.add('correct-letter');
                    letterElement.classList.remove('incorrect-letter');
                    const letterSpan = letterElement.querySelector('span');
                    if (letterSpan) {
                        letterSpan.classList.add('correct-letter');
                        letterSpan.classList.remove('incorrect-letter');
                    }
                } else {
                    letterElement.classList.add('incorrect-letter');
                    letterElement.classList.remove('correct-letter');
                    
                    // Make sure the letter is visibly marked as incorrect
                    const letterSpan = letterElement.querySelector('span');
                    if (letterSpan) {
                        letterSpan.classList.add('incorrect-letter');
                        letterSpan.classList.remove('correct-letter');
                    }
                }

                playWordSfx(check.isCorrect ? 'letterCorrect' : 'letterWrong');
                
                // Proceed to the next letter
                currentCheckIndex++;
                setTimeout(checkNextLetter, letterCheckingDelay);
            }, letterCheckingDelay);
        } else {
            // If letter element not found, skip to next
            currentCheckIndex++;
            setTimeout(checkNextLetter, 50);
        }
    }
    
    // Find the letter element by indices
    function findLetterElement(wordIndex, letterIndex) {
        if (gameState.currentWord.isPhrase) {
            const wordContainers = wordInput.querySelectorAll('.hebrew-word-container');
            if (wordContainers.length > wordIndex) {
                const wordContainer = wordContainers[wordIndex];
                const letterContainers = wordContainer.querySelectorAll('.letter-container');
                
                if (letterContainers.length > letterIndex) {
                    return letterContainers[letterIndex];
                }
            }
        } else {
            const letterContainers = wordInput.querySelectorAll('.letter-container');
            if (letterContainers.length > letterIndex) {
                return letterContainers[letterIndex];
            }
        }
        return null;
    }
    
    // Show point indicator for a letter
    function showPointIndicator(letterElement, points) {
        const pointIndicator = document.createElement('div');
        pointIndicator.className = points > 0 ? 'point-indicator correct' : 'point-indicator incorrect';
        pointIndicator.textContent = points > 0 ? '+1' : '+0';
        
        // Get position of the letter element
        const rect = letterElement.getBoundingClientRect();
        const containerRect = wordInput.parentNode.getBoundingClientRect();
        
        // Position the indicator above the letter
        pointIndicator.style.left = `${rect.left - containerRect.left + (rect.width / 2)}px`;
        pointIndicator.style.top = `${rect.top - containerRect.top - 30}px`;
        
        animationContainer.appendChild(pointIndicator);
        
        // Animate and remove
        setTimeout(() => {
            pointIndicator.classList.add('point-indicator-animate');
            setTimeout(() => {
                if (animationContainer.contains(pointIndicator)) {
                    animationContainer.removeChild(pointIndicator);
                }
            }, 800);
        }, 50);
    }
    
    // Start checking
    setTimeout(checkNextLetter, 200);
}

// Prepare next word in advance to avoid flashing
function prepareNextWord() {
    // Load next word into a temporary variable
    if (gameState.currentWordIndex + 1 < gameState.roundWords.length) {
        // Create a temporary holder for the next word data
        gameState.nextWordData = {
            currentWordIndex: gameState.currentWordIndex + 1,
            currentWord: gameState.roundWords[gameState.currentWordIndex + 1]
        };
    }
}

// Transition to next word without flashing old word
function transitionToNextWord() {
    // Increment the current word index
    gameState.currentWordIndex++;
    window.logDebug('Moving to next word, new index is:', gameState.currentWordIndex);
    
    // Hide the current word immediately
    const wordInput = document.getElementById('hebrew-word-input');
    if (wordInput) {
        wordInput.style.opacity = '0';
    }
    
    // Reset the processing flag to allow the next word submission
    isProcessingWordSubmission = false;
    
    // Start the next word after a brief transition
    setTimeout(() => {
        startNextWord();
        
        // Fade the new word in
        if (wordInput) {
            wordInput.style.opacity = '1';
        }
    }, 50);
}

// Finalize word check after animation
function finalizeWordCheck(correctLetters, totalLetters, letterChecks) {
    window.logDebug('Finalizing word check:', {correctLetters, totalLetters});
    
    // CRITICAL FIX: Record scores before any changes
    const currentPlayerScore = gameState.player.score;
    const currentRoundScore = gameState.roundScore;
    const currentCoins = gameState.playerCoins;
    
    // If we used the Easier Word power-up, we need to adjust scoring
    // Removed letters count as automatically correct
    let adjustedCorrectLetters = correctLetters;
    if (gameState.powerUpsActive.originalWord) {
        // Add the number of removed letters to the correct letters count
        adjustedCorrectLetters = getPointsForEasierWord(correctLetters);
        window.logDebug(`Adjusted score for easier word: ${correctLetters} + ${gameState.powerUpsActive.removedLetters} removed letters = ${adjustedCorrectLetters}`);
    }
    
    // Calculate score - 1 point per correct letter in correct position
    const basePoints = adjustedCorrectLetters;
    
    // Apply double points if the power-up is active
    const finalPoints = gameState.powerUpsActive.doublePoints ? basePoints * 2 : basePoints;
    
    window.logDebug('Points calculation:', { 
        basePoints, 
        doublePointsActive: gameState.powerUpsActive.doublePoints, 
        finalPoints 
    });
    
    // Check if the word/phrase was perfectly typed
    const isPerfect = correctLetters === totalLetters;
    
    // Calculate coins to award - one coin per word if perfect
    let coinsToAward = 0;
    if (isPerfect) {
        // Award 1 coin per correct word/phrase
        coinsToAward = gameState.currentWord.isPhrase ? gameState.currentWord.words.length : 1;
    }
    
    // CRITICAL CHANGE - Update scores only ONCE
    gameState.roundScore += finalPoints;
    gameState.player.score += finalPoints;
    
    if (isPerfect) {
        gameState.perfectWords += 1; // Increment by 1 for UI stats
        gameState.roundCoinsEarned += coinsToAward;
        gameState.playerCoins += coinsToAward;
    }

    announceWordUi(
        isPerfect
            ? t('word.announcePerfect', { points: finalPoints, coins: coinsToAward })
            : t('word.announceChecked', { points: finalPoints })
    );
    
    // Log the ACTUAL change for debugging
    window.logDebug('Score update verification:', {
        prevScore: currentPlayerScore,
        newScore: gameState.player.score,
        scoreDiff: gameState.player.score - currentPlayerScore,
        shouldBe: finalPoints,
        
        prevRoundScore: currentRoundScore,
        newRoundScore: gameState.roundScore,
        roundScoreDiff: gameState.roundScore - currentRoundScore,
        
        prevCoins: currentCoins,
        newCoins: gameState.playerCoins,
        coinsDiff: gameState.playerCoins - currentCoins,
        isPerfect,
        coinsToAward
    });
    
    // Show simplified result overlay with points
    showSimplifiedResultOverlay(finalPoints);
    
    // Update the coin count display
    document.getElementById('coin-count').textContent = gameState.playerCoins;
    document.getElementById('current-score').textContent = gameState.player.score;
    
    // Simulate opponent progress for this word
    // IMPORTANT: Pass the base points (totalPossiblePoints) to opponents, NOT the player's doubled points
    simulateOpponentProgress(totalLetters);
    
    // Update the tournament display with new scores
    updateTournamentDisplay();
    
    // Determine appropriate feedback message
    if (isPerfect) {
        // Perfect match - all letters correct
        handlePerfectWord(finalPoints, totalLetters, letterChecks, coinsToAward);
    } else {
        // Imperfect match - some letters wrong or in wrong positions
        handleImperfectWord(finalPoints, correctLetters, totalLetters, letterChecks);
    }
}

// Show simplified result overlay with only points
function showSimplifiedResultOverlay(finalPoints) {
    const wordChallenge = document.getElementById('word-challenge');
    
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'result-overlay';
    
    // Show only the score value
    const scoreValue = document.createElement('div');
    scoreValue.className = 'result-score-value'; // Renamed to avoid CSS conflict
    scoreValue.textContent = `+${finalPoints}`;
    
    overlay.appendChild(scoreValue);
    wordChallenge.appendChild(overlay);
    
    // Animate in
    setTimeout(() => {
        overlay.classList.add('show');
        
        // Remove after delay
        setTimeout(() => {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (wordChallenge.contains(overlay)) {
                    wordChallenge.removeChild(overlay);
                }
            }, 300);
        }, 1800);
    }, 50);
}

// Handle a perfectly typed word (all letters correct)
function handlePerfectWord(finalPoints, totalPossiblePoints, letterChecks, coinsEarned) {    
    playWordSfx('wordPerfect');
    if (coinsEarned > 0) {
        playWordSfx('coin');
    }

    // Show a visual celebration effect for perfect words
    showCelebrationEffect('perfect');
    
    // Create toast message based on the number of words
    const wordCount = gameState.currentWord.isPhrase ? gameState.currentWord.words.length : 1;
    let wordDescription = wordCount > 1
        ? `${wordCount} ${t('word.wordPlural')}`
        : t('word.wordSingle');
    let coinText = coinsEarned > 1
        ? t('word.coinPlural', { count: coinsEarned })
        : t('word.coinSingle');
    
    // Show toast notification with original points info if easier word was used
    let description = t('word.perfectDesc', { points: finalPoints, coinText });
    if (gameState.powerUpsActive.originalWord) {
        const originalLetters = gameState.powerUpsActive.originalWord.totalLetters;
        description = t('word.perfectDescOriginal', {
            points: finalPoints,
            letters: originalLetters,
            wordDesc: wordDescription,
            coinText
        });
    }
    
    toast({
        title: t('word.toastSuper'),
        description: description,
        variant: "default"
    });
    
    // Prepare next word data
    prepareNextWord();
    
    // IMPORTANT: Store the current index before the timeout to prevent double incrementing
    const currentIndex = gameState.currentWordIndex;
    
    // Move to next word after a short delay (long enough for celebration)
    setTimeout(() => {
        if (gameState.currentWordIndex === currentIndex) { // Only increment if it hasn't changed
            // Move to next word with smooth transition
            transitionToNextWord();
        }
    }, 2200); // Adjusted to allow for celebration
}

// Handle an imperfectly typed word (some letters wrong or missing)
function handleImperfectWord(finalPoints, correctLetters, totalPossiblePoints, letterChecks) {
    // Check if player has a second chance (either per-word or per-round)
    if (gameState.powerUpsActive.secondChance || gameState.powerUpsActive.secondChanceRound) {
        playWordSfx('secondChance');

        // Use the second chance
        const isRoundPowerUp = gameState.powerUpsActive.secondChanceRound;
        
        // Only consume the single-word power-up, keep the round-based one active
        if (!isRoundPowerUp) {
            gameState.powerUpsActive.secondChance = false;
        }
        
        // Provide feedback
        toast({
            title: t('word.secondChanceTitle'),
            description: isRoundPowerUp ? 
                t('word.secondChanceRoundDesc') : 
                t('word.secondChanceSingleDesc'),
            variant: "default"
        });
        
        // Reset processing flag to allow resubmission
        setTimeout(() => {
            isProcessingWordSubmission = false;
            
            // Reset the letter classes
            const letterContainers = document.querySelectorAll('.letter-container');
            letterContainers.forEach(container => {
                container.classList.remove('correct-letter', 'incorrect-letter', 'checking-letter');
                
                // Reset the span classes too
                const span = container.querySelector('span');
                if (span) {
                    span.classList.remove('correct-letter', 'incorrect-letter');
                    if (
                        !span.classList.contains('typed-letter') &&
                        !span.classList.contains('revealed-letter') &&
                        !span.classList.contains('letter-placeholder') &&
                        span.textContent &&
                        span.textContent.trim() !== ''
                    ) {
                        span.classList.add('typed-letter');
                    }
                }
            });
            
            // Remove any checking animation container
            const animContainer = document.querySelector('.checking-animation-container');
            if (animContainer && animContainer.parentNode) {
                animContainer.parentNode.removeChild(animContainer);
            }
            
            // Don't clear what the user has typed - just let them continue
            updateHebrewWordDisplay();
            
            // Re-enable the submit button
            const submitButton = document.getElementById('submit-word');
            if (submitButton) {
                submitButton.disabled = false;
                // Only add the ready class if the word is still complete
                if ((gameState.currentWord.isPhrase && isEntirePhraseComplete()) || 
                    (!gameState.currentWord.isPhrase && gameState.typedWord.length === gameState.currentWord.hebrew.length)) {
                    submitButton.classList.add('submit-button-ready');
                }
            }
        }, 1500);
        
        return;
    }

    playWordSfx('wordImperfect');
    
    // Create description with original word info if easier word was used
    let description = t('word.imperfectDesc', { points: finalPoints });
    if (gameState.powerUpsActive.originalWord) {
        const originalLetters = gameState.powerUpsActive.originalWord.totalLetters;
        description = t('word.imperfectDescOriginal', {
            points: finalPoints,
            letters: originalLetters
        });
    }
    
    // Show toast notification
    toast({
        title: finalPoints > 0 ? t('word.toastAlmost') : t('word.toastError'),
        description: description,
        variant: finalPoints > 0 ? "default" : "destructive"
    });
    
    // Create a list of incorrect letters
    const incorrectLetters = letterChecks.filter(check => !check.isCorrect);
    
    // Show simplified correct word display WITH marked wrong letters
    const wordInput = document.getElementById('hebrew-word-input');
    const correctWordContainer = document.createElement('div');
    correctWordContainer.className = 'correct-word-container';
    
    // Show just the correct word with wrong letters marked
    const correctWordDisplay = document.createElement('div');
    correctWordDisplay.className = 'correct-word-display';
    correctWordDisplay.dir = "rtl";
    
    if (gameState.currentWord.isPhrase) {
        // For phrases, build a word-by-word display with marked incorrect letters
        let displayHTML = '';
        const words = gameState.currentWord.words;
        let letterPosition = 0;
        
        for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];
            displayHTML += '<span class="correct-display-word">';
            
            for (let letterIndex = 0; letterIndex < word.length; letterIndex++) {
                const letter = word[letterIndex];
                const isIncorrect = incorrectLetters.some(l => 
                    l.wordIndex === wordIndex && l.letterIndex === letterIndex);
                
                if (isIncorrect) {
                    displayHTML += `<span class="incorrect-display-letter">${letter}</span>`;
                } else {
                    displayHTML += `<span class="correct-display-letter">${letter}</span>`;
                }
                letterPosition++;
            }
            
            displayHTML += '</span> ';
        }
        
        correctWordDisplay.innerHTML = displayHTML;
    } else {
        // For single words with marked incorrect letters
        let displayHTML = '';
        const word = gameState.currentWord.hebrew;
        
        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            const isIncorrect = incorrectLetters.some(l => l.letterIndex === i);
            
            if (isIncorrect) {
                displayHTML += `<span class="incorrect-display-letter">${letter}</span>`;
            } else {
                displayHTML += `<span class="correct-display-letter">${letter}</span>`;
            }
        }
        
        correctWordDisplay.innerHTML = displayHTML;
    }
    
    correctWordContainer.appendChild(correctWordDisplay);
    wordInput.parentNode.appendChild(correctWordContainer);
    
    // Animate in the correct word container
    setTimeout(() => {
        correctWordContainer.classList.add('show');
    }, 50);
    
    // Prepare next word data
    prepareNextWord();
    
    // IMPORTANT: Store the current index before the timeout to prevent double incrementing
    const currentIndex = gameState.currentWordIndex;
    
    // Move to next word after a delay
    setTimeout(() => {
        if (correctWordContainer.parentNode) {
            correctWordContainer.classList.remove('show');
            
            // Immediately prepare move to the next word when overlay fades
            const prepareNextWord = () => {
                if (correctWordContainer.parentNode) {
                    correctWordContainer.parentNode.removeChild(correctWordContainer);
                }
                
                if (gameState.currentWordIndex === currentIndex) { // Only increment if it hasn't changed
                    // Move to next word with smooth transition
                    transitionToNextWord();
                }
            };
            
            // Start preparing the next word as the overlay fades out
            setTimeout(prepareNextWord, 300);
        } else {
            if (gameState.currentWordIndex === currentIndex) { // Only increment if it hasn't changed
                transitionToNextWord();
            }
        }
    }, 2500);
}

// Function for celebration effects
function showCelebrationEffect(type) {
    // Keep the celebration directly in the word challenge area
    const wordChallengeArea = document.getElementById('word-challenge');
    
    if (type === 'perfect') {
        // Create a more engaging celebration
        const celebration = document.createElement('div');
        celebration.className = 'word-celebration';
        
        const sparkTypes = ['coin', 'star', 'plus'];

        // Create sprite particles with varied timing and positions
        for (let i = 0; i < 8; i++) {
            const spark = document.createElement('div');
            const sparkType = sparkTypes[Math.floor(Math.random() * sparkTypes.length)];
            spark.className = `celebration-spark ${sparkType}`;
            spark.setAttribute('aria-hidden', 'true');
            
            // Randomize position
            spark.style.left = `${Math.random() * 100}%`;
            spark.style.animationDelay = `${Math.random() * 0.3}s`;
            spark.style.animationDuration = `${0.8 + Math.random() * 0.6}s`;
            
            celebration.appendChild(spark);
        }
        
        // Append to the word challenge area
        wordChallengeArea.appendChild(celebration);
        
        // Remove after animation completes (shorter time)
        setTimeout(() => {
            if (wordChallengeArea.contains(celebration)) {
                celebration.classList.add('fade-out'); // Add fade-out class
                setTimeout(() => {
                    if (wordChallengeArea.contains(celebration)) {
                        wordChallengeArea.removeChild(celebration);
                    }
                }, 300); // Short fade-out time
            }
        }, 1800); // Shorter celebration time
    }
    
    // For round advance, we'll keep it minimal
    if (type === 'round-advance') {
        const roundAdvanceText = document.createElement('div');
        roundAdvanceText.className = 'round-complete-text';
        roundAdvanceText.textContent = t('round.completedShort');
        
        wordChallengeArea.appendChild(roundAdvanceText);
        
        setTimeout(() => {
            if (wordChallengeArea.contains(roundAdvanceText)) {
                wordChallengeArea.removeChild(roundAdvanceText);
            }
        }, 1500);
    }
}

// Make the submitWord function globally accessible
window.HebrewGame = window.HebrewGame || {};
window.HebrewGame.words = window.HebrewGame.words || {};
window.HebrewGame.words.submitWord = submitWord;
window.HebrewGame.words.setActiveLetter = setActiveLetter;
window.submitWord = function submitWordCompat() {
    return window.HebrewGame.words.submitWord.apply(null, arguments);
};
