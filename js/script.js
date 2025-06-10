// RULES:
// - The board is a 5x5 grid of cells
// - Start with N lives
// - Start with N*2 buttons
// - Half of the buttons are rescue buttons, half are death buttons
// - Press a button within 30 seconds or a random life is lost
// - Survive N rounds to win
// - One of the lives is assigned to the player, if the player dies, the game is over and everyone dies
// - If the player survives N rounds, the player wins
// - Each time a button is pressed, the board is shuffled
// - After each shuffle, the board will have one less of the type of button that was pressed (rescue or death)
// - After 4 rounds, one button becomes the Merciless button, which will kill one life at random that is not the player's
// - The player can press the Merciless button to kill one life at random that is not the player's

const livesElement = document.getElementById("lives");
const boardElement = document.getElementById("board");
const cellElements = boardElement.querySelectorAll(".cell");

const startingLives = 8;

let lives = [];

// start with 8 lives
let randomNames = getRandomNames(startingLives);
lives = randomNames.map((name) => ({ name, alive: true }));

let activeCell = null;
// Change initial counts to be N each instead of N/2
let rescueCount = startingLives;
let deathCount = startingLives;

var gameActive = false; // Track if the game is active

function getRandomNames(count) {
    count = count - 1; // subtract 1 for the player

    let outNames = [];
    // until there's enough names, keep picking random names (without duplicates)
    while (outNames.length < count) {
        const name =
            names[Math.floor(Math.random() * names.length)];
        if (!outNames.includes(name)) {
            outNames.push(name);
        }
    }

    // add the player's name to the list
    outNames.push("Player");

    // shuffle the names
    outNames = outNames.sort(() => Math.random() - 0.5);

    return outNames;
}

const CELL_TYPES = {
    EMPTY: 0,
    RESCUE: 1,
    DEATH: 2,
    MERCILESS: 3,
};

// 2D array to store the board state
let boardState = Array(5)
    .fill()
    .map(() => Array(5).fill(CELL_TYPES.EMPTY));
let round = 0;

function initializeBoardState() {
    // Clear the board
    boardState = Array(5)
        .fill()
        .map(() => Array(5).fill(CELL_TYPES.EMPTY));

    // Change to use total buttons count instead of lives count
    let totalButtons = rescueCount + deathCount;
    let cellsToPlace = totalButtons;
    let rescueRemaining = rescueCount;
    let deathRemaining = deathCount;

    // If we're past round 4, reserve one death slot for the Merciless button
    if (round >= 4) {
        deathRemaining--;
    }

    // Randomly place rescue and death cells
    while (cellsToPlace > 1 || (cellsToPlace === 1 && round < 4)) {
        let row = Math.floor(Math.random() * 5);
        let col = Math.floor(Math.random() * 5);

        if (boardState[row][col] === CELL_TYPES.EMPTY) {
            if (rescueRemaining > 0) {
                boardState[row][col] = CELL_TYPES.RESCUE;
                rescueRemaining--;
            } else if (deathRemaining > 0) {
                boardState[row][col] = CELL_TYPES.DEATH;
                deathRemaining--;
            }
            cellsToPlace--;
        }
    }

    // Place the Merciless button last if we're past round 4
    if (round >= 4 && cellsToPlace === 1) {
        while (true) {
            let row = Math.floor(Math.random() * 5);
            let col = Math.floor(Math.random() * 5);
            if (boardState[row][col] === CELL_TYPES.EMPTY) {
                boardState[row][col] = CELL_TYPES.MERCILESS;
                break;
            }
        }
    }
}

function generateBoard() {
    boardElement.innerHTML = "";
    initializeBoardState();

    for (let i = 0; i < 5; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        boardElement.appendChild(row);

        for (let j = 0; j < 5; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            if (boardState[i][j] !== CELL_TYPES.EMPTY) {
                cell.setAttribute("active", "");
                cell.dataset.row = i;
                cell.dataset.col = j;
                if (boardState[i][j] === CELL_TYPES.MERCILESS) {
                    cell.classList.add("merciless");
                }
                cell.addEventListener("click", handleCellClick);
            }
            row.appendChild(cell);
        }
    }

    generateLives();
}

// Replace leaderboard management functions
function saveToLeaderboard(survivors) {
    const leaderboard = JSON.parse(
        localStorage.getItem("deathCheckersLeaderboard") || "[]"
    );
    leaderboard.push({
        date: Date.now(),
        survivors,
    });
    // Keep only last 10 results
    while (leaderboard.length > 10) {
        leaderboard.shift();
    }
    localStorage.setItem(
        "deathCheckersLeaderboard",
        JSON.stringify(leaderboard)
    );
    updateLeaderboardDisplay();
}

function updateLeaderboardDisplay() {
    const leaderboard = JSON.parse(
        localStorage.getItem("deathCheckersLeaderboard") || "[]"
    );
    const canvas = document.getElementById("graph");
    const ctx = canvas.getContext("2d");

    // Set canvas resolution
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Count frequencies
    const frequencies = Array(startingLives + 1).fill(0);
    leaderboard.forEach((entry) => {
        frequencies[entry.survivors]++;
    });

    // Increase left padding for more space
    const leftPadding = 40;
    const rightPadding = 60;
    const topPadding = 60;
    const bottomPadding = 60;

    const graphHeight = canvas.height - topPadding - bottomPadding;
    const barHeight = graphHeight / frequencies.length;
    const maxFreq = Math.max(...frequencies);
    const barMaxWidth = canvas.width - leftPadding - rightPadding;

    // Draw axis labels with more spacing
    ctx.fillStyle = "#ccc";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.font = "20px Arial";

    // Draw bars and labels with adjusted padding
    for (let i = startingLives; i >= 0; i--) {
        const y =
            topPadding +
            barHeight * (startingLives - i) +
            barHeight / 2;

        // Move numbers further from axis
        ctx.textAlign = "right";
        ctx.fillText(i.toString().trim(), leftPadding - 10, y);

        if (frequencies[i] > 0) {
            const width = (frequencies[i] / maxFreq) * barMaxWidth;
            ctx.fillStyle = i === 0 ? "#ff6b6b" : "#4ecdc4";
            ctx.fillRect(
                leftPadding,
                y - barHeight / 2,
                width,
                barHeight - 2
            );

            ctx.fillStyle = "#ccc";
            ctx.textAlign = "left";
            ctx.fillText(
                frequencies[i].toString().trim(),
                leftPadding + width + 5,
                y
            );
        }
    }

    // Draw axis with new padding
    ctx.strokeStyle = "#ccc";
    ctx.beginPath();
    ctx.moveTo(leftPadding, topPadding);
    ctx.lineTo(leftPadding, canvas.height - bottomPadding);
    ctx.stroke();
}

function clearHistory() {
    showModal(
        "Clear History",
        "Are you sure you want to clear your survival history?",
        [
            {
                text: "Yes, Clear History", action: () => {
                    localStorage.removeItem('deathCheckersLeaderboard');
                    updateLeaderboardDisplay();
                }
            },
            { text: "Cancel", action: null }
        ]
    );
}

let timerInterval;
let timeLeft = 30;

function startTimer(initialStart = false) {
    // Add event handler cleanup
    clearInterval(timerInterval);
    timeLeft = 30;
    updateTimerDisplay();

    // if initialStart is true, set gameActive to true
    if (initialStart) {
        gameActive = true;
    }

    // if gameActive is false, stop the timer
    if (!gameActive) {
        return;
    }

    // Remove the container instead of just hiding it
    if (round === 0 && document.getElementById('start-container')) {
        const startContainer = document.getElementById('start-container');
        startContainer.remove();
    }
    document.getElementById('timer').style.display = 'block';

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            killRandomLife();
            if (lives.find(life => life.name === "Player").alive) {
                // showStartButton();
                generateBoard();
                // Restart the timer for the next round
                startTimer();
            }
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timeLeft = 30; // Reset time left
    updateTimerDisplay();
    document.getElementById('timer').style.display = 'none';
    document.title = "Death Checkers"; // Reset the document title

    gameActive = false; // Stop the game
}

function showStartButton() {
    const timer = document.getElementById('timer');
    timer.style.display = 'none';

    // Only recreate start container if it's round 0
    if (round === 0) {
        const gameplayArea = document.querySelector('.gameplay-area');
        const startContainer = document.createElement('div');
        startContainer.id = 'start-container';

        const startButton = document.createElement('button');
        startButton.id = 'start-button';
        startButton.className = 'modal-button';
        startButton.textContent = 'Start Game';
        startButton.type = 'button';
        startButton.addEventListener('click', startTimer, { once: true });

        startContainer.appendChild(startButton);
        gameplayArea.insertBefore(startContainer, gameplayArea.firstChild);
    }
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = timeLeft;
    timerElement.className = timeLeft <= 10 ? 'danger' : '';

    document.title = `Death Checkers - ${timeLeft}`;
}

let gameWon = false; // Add state tracking
let finalSurvivors = 0; // Add state variables at the top with other declarations

function handleCellClick(event) {
    // Ignore clicks if game is won
    if (gameWon) {
        showVictoryScreen();
        return;
    }

    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const cellType = boardState[row][col];

    switch (cellType) {
        case CELL_TYPES.RESCUE:
            // Handle rescue
            rescueCount--;
            break;
        case CELL_TYPES.DEATH:
            // Kill random life
            deathCount--;
            killRandomLife();
            break;
        case CELL_TYPES.MERCILESS:
            // Kill random non-player life
            deathCount--;
            killRandomNonPlayerLife();
            break;
    }    round++;

    // Check for game completion
    if (round >= startingLives) {
        const survivors = lives.filter((life) => life.alive).length;
        const playerAlive = lives.find(
            (life) => life.name === "Player"
        ).alive;

        if (playerAlive) {
            gameWon = true; // Set victory state
            finalSurvivors = survivors; // Store the final count
            stopTimer(); // Stop the timer and reset display
            document.title = "Death Checkers - Victory!";
            showVictoryScreen();
        } else {
            generateBoard();
        }
    } else {
        generateBoard();
    }

    // Always start the timer after a button press
    startTimer();
}

function showVictoryScreen() {
    showModal(
        "Victory!",
        `Game Complete! ${finalSurvivors} survivor${finalSurvivors !== 1 ? "s" : ""} remained.`,
        [{
            text: "Continue",
            action: () => {
                saveToLeaderboard(finalSurvivors);
                resetGame();
            }
        }]
    );
}

function generateLives() {
    livesElement.innerHTML = "";
    lives.forEach((life) => {
        const lifeElement = document.createElement("div");
        lifeElement.classList.add("life");
        if (!life.alive) {
            lifeElement.classList.add("dead");
        }
        lifeElement.textContent = life.name;
        livesElement.appendChild(lifeElement);
    });
}

function killRandomLife() {
    const aliveLives = lives.filter((life) => life.alive);
    if (aliveLives.length > 0) {
        const randomLife = aliveLives[Math.floor(Math.random() * aliveLives.length)];
        randomLife.alive = false;
        generateLives(); // Regenerate lives display immediately

        if (randomLife.name === "Player") {
            // Stop the timer immediately when player dies
            clearInterval(timerInterval);
            stopTimer();
            
            // Kill everyone else when player dies
            lives.forEach((life) => (life.alive = false));
            generateLives(); // Show all dead before modal

            // Small delay to show deaths before modal
            showModal(
                "Game Over",
                "The player has died. Everyone else followed.",
                [{
                    text: "Try Again",
                    action: () => {
                        saveToLeaderboard(0);
                        resetGame();
                    }
                }],
                () => {
                    // Reset the game state after modal is closed
                    resetGame();
                }
            );
        }
    }
}

function killRandomNonPlayerLife() {
    const aliveNonPlayerLives = lives.filter(
        (life) => life.alive && life.name !== "Player"
    );
    if (aliveNonPlayerLives.length > 0) {
        const randomLife =
            aliveNonPlayerLives[
            Math.floor(
                Math.random() * aliveNonPlayerLives.length
            )
            ];
        randomLife.alive = false;
    }
}

function resetGame() {
    gameWon = false; // Reset victory state
    finalSurvivors = 0; // Reset final survivors count
    round = 0;
    rescueCount = startingLives;
    deathCount = startingLives;
    lives = getRandomNames(startingLives).map((name) => ({
        name,
        alive: true,
    }));
    showStartButton();
    generateBoard();
}

// Add modal functions
function showModal(title, message, buttons = [{ text: 'Continue', action: hideModal }], onClose = null) {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalButtons = document.getElementById("modal-buttons");

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalButtons.innerHTML = '';

    // assign the close button action to .modal-close
    const closeButton = document.querySelector('.modal-close');
    closeButton.onclick = () => {
        hideModal();
        if (onClose) onClose();
    }

    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'modal-button';
        button.textContent = btn.text;
        button.onclick = () => {
            hideModal();
            if (btn.action) btn.action();
        };
        modalButtons.appendChild(button);
    });

    modal.style.display = "flex";
}

function hideModal() {
    document.getElementById("modal").style.display = "none";
}

// Add after updateLeaderboardDisplay function
function showRules() {
    document.getElementById('rules-modal').style.display = 'flex';
}

// Initialize game
const startButton = document.getElementById('start-button');
startButton.addEventListener('click', () => {
    startTimer(true); // Start the timer immediately
});

updateLeaderboardDisplay();
generateBoard();

// Remove automatic rules display and timer start
// showRules();
// startTimer();