/**
 * Start screen helpers that do not own core lifecycle.
 */
(function startScreenModule() {
    const startScreenNamePool = [
        "Yael", "Noah", "Ethan", "Leah", "Maya", "Aaron", "Levi", "Sarah",
        "David", "Hannah", "Samuel", "Abigail", "Daniel", "Rachel", "Gabriel",
        "Rebecca", "Michael", "Sophia", "Benjamin", "Olivia"
    ];

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

        renderStartScreenHighScores();
    }

    window.HebrewGame = window.HebrewGame || {};
    window.HebrewGame.ui = window.HebrewGame.ui || {};
    window.HebrewGame.ui.initializeStartScreenEnhancements = initializeStartScreenEnhancements;
    window.HebrewGame.ui.generateRandomName = generateRandomName;
    window.HebrewGame.ui.renderStartScreenHighScores = renderStartScreenHighScores;
})();
