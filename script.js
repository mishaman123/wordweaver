const gameGrid = document.getElementById('game-grid');
let selectedLetters = [];
let lastSelectedRow = -1;
let lastSelectedCol = -1;
let isMoving = false;
let moveDirection = null; // 'horizontal' or 'vertical'
let isLevelCompleted = false;

console.log('Script is running');

let currentLevel;
let words;
let dictionary; // Add this line to store the dictionary
let levels; // Add this line to store the levels

async function initializeGame() {
    const [levelsResponse, dictionaryResponse] = await Promise.all([
        fetch('levels.json'),
        fetch('dictionary.json')
    ]);
    const levelsData = await levelsResponse.json();
    dictionary = await dictionaryResponse.json();
    levels = levelsData.levels;

    loadLevel(1); // Start with level 1
}

function displayWords(words) {
    const wordList = document.getElementById('word-list');
    wordList.innerHTML = ''; // Clear any existing content

    if (words.length === 0) {
        const message = document.createElement('div');
        message.textContent = 'No words for this level';
        wordList.appendChild(message);
        return;
    }

    words.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.classList.add('word-item');
        wordElement.dataset.word = word.toLowerCase();
        wordElement.textContent = '?'.repeat(word.length); // Display placeholders instead of the actual word
        wordList.appendChild(wordElement);
    });
}

function revealWord(word) {
    const wordElement = document.querySelector(`.word-item[data-word="${word.toLowerCase()}"]`);
    if (wordElement && wordElement.textContent === '?'.repeat(word.length)) {
        wordElement.textContent = word;
        console.log(`Revealed word: ${word}`);
    }
}

function canMove(direction) {
    console.log(`Checking if can move ${direction}`);
    console.log(`Selected letters: ${selectedLetters.map(l => `${l.textContent}(${l.dataset.row},${l.dataset.col})`).join(', ')}`);

    if (selectedLetters.length < 3) {
        console.log('Cannot move: less than 3 letters selected');
        return false;
    }

    // Determine if the selection is horizontal or vertical
    const isHorizontal = selectedLetters.every(letter => letter.dataset.row === selectedLetters[0].dataset.row);
    const isVertical = selectedLetters.every(letter => letter.dataset.col === selectedLetters[0].dataset.col);

    // Check if the movement direction is valid for the selection orientation
    if ((isHorizontal && (direction === 'up' || direction === 'down')) ||
        (isVertical && (direction === 'left' || direction === 'right'))) {
        console.log(`Cannot move ${direction}: invalid direction for current selection orientation`);
        return false;
    }

    // Sort the selected letters based on their position
    selectedLetters.sort((a, b) => {
        if (isHorizontal) {
            return parseInt(a.dataset.col) - parseInt(b.dataset.col);
        } else if (isVertical) {
            return parseInt(a.dataset.row) - parseInt(b.dataset.row);
        }
    });

    // Find the edge letter based on the direction
    let edgeLetter;
    switch (direction) {
        case 'right':
        case 'down':
            edgeLetter = selectedLetters[selectedLetters.length - 1];
            break;
        case 'left':
        case 'up':
            edgeLetter = selectedLetters[0];
            break;
    }

    const currentRow = parseInt(edgeLetter.dataset.row);
    const currentCol = parseInt(edgeLetter.dataset.col);
    let newRow = currentRow;
    let newCol = currentCol;

    switch (direction) {
        case 'right': newCol++; break;
        case 'left': newCol--; break;
        case 'down': newRow++; break;
        case 'up': newRow--; break;
    }

    console.log(`Checking move from (${currentRow},${currentCol}) to (${newRow},${newCol})`);

    const nextElement = document.querySelector(`.letter[data-row="${newRow}"][data-col="${newCol}"]`);
    console.log(`Next element:`, nextElement ? `${nextElement.textContent}(${nextElement.dataset.row},${nextElement.dataset.col})` : 'null');

    if (!nextElement) {
        console.log(`Cannot move: no element found at (${newRow},${newCol})`);
        return false;
    }

    const isEmpty = !nextElement.textContent.trim();
    console.log(`Is next element empty: ${isEmpty}`);
    console.log(`Next element content: '${nextElement.textContent}'`);
    
    console.log(`Can move ${direction}: ${isEmpty}`);
    return isEmpty;
}

function moveLetters(direction) {
    console.log(`Attempting to move ${direction}`);
    if (!canMove(direction)) {
        console.log(`Cannot move ${direction}`);
        return false;
    }

    const isHorizontal = direction === 'left' || direction === 'right';
    const increment = direction === 'right' || direction === 'down' ? 1 : -1;

    // Sort letters based on their position for word checking
    const sortedLetters = [...selectedLetters].sort((a, b) => {
        if (isHorizontal) {
            return parseInt(a.dataset.col) - parseInt(b.dataset.col);
        } else {
            return parseInt(a.dataset.row) - parseInt(b.dataset.row);
        }
    });

    const selectedWord = sortedLetters.map(letter => letter.textContent.toLowerCase()).join('');
    if (!dictionary.includes(selectedWord)) {
        console.log(`Cannot move: "${selectedWord}" is not a valid word`);
        return false;
    }

    // Sort letters based on the direction of movement
    selectedLetters = selectedLetters.sort((a, b) => {
        if (direction === 'left' || direction === 'up') {
            return isHorizontal 
                ? parseInt(a.dataset.col) - parseInt(b.dataset.col)
                : parseInt(a.dataset.row) - parseInt(b.dataset.row);
        } else {
            return isHorizontal 
                ? parseInt(b.dataset.col) - parseInt(a.dataset.col)
                : parseInt(b.dataset.row) - parseInt(a.dataset.row);
        }
    });

    // Move letters one by one
    selectedLetters.forEach((letter) => {
        const currentRow = parseInt(letter.dataset.row);
        const currentCol = parseInt(letter.dataset.col);
        const newRow = isHorizontal ? currentRow : currentRow + increment;
        const newCol = isHorizontal ? currentCol + increment : currentCol;

        const targetElement = document.querySelector(`.letter[data-row="${newRow}"][data-col="${newCol}"]`);
        if (targetElement && !targetElement.textContent.trim()) {
            // Move content only if target is empty
            targetElement.textContent = letter.textContent;
            letter.textContent = '';
            
            // Update classes
            letter.classList.remove('selected');
            targetElement.classList.add('selected');
        } else {
            console.log(`Cannot move to (${newRow},${newCol}): target is not empty or doesn't exist`);
        }
    });

    // Update selectedLetters
    selectedLetters = Array.from(document.querySelectorAll('.letter.selected'));

    // Update last selected position
    const lastSelected = selectedLetters[selectedLetters.length - 1];
    lastSelectedRow = parseInt(lastSelected.dataset.row);
    lastSelectedCol = parseInt(lastSelected.dataset.col);

    console.log(`Move completed. New selected letters: ${selectedLetters.map(l => `${l.textContent}(${l.dataset.row},${l.dataset.col})`).join(', ')}`);

    // After moving letters
    selectedLetters.forEach(letter => {
        if (letter.classList.contains('was-completed')) {
            letter.classList.remove('was-completed');
        }
    });

    // Check for completed words after moving
    checkForCompletedWordsAfterMove();

    return true;
}

function checkForCompletedWordsAfterMove() {
    const allLetters = Array.from(document.querySelectorAll('.letter'));
    const gridWidth = currentLevel.width;
    const gridHeight = currentLevel.height;

    // Log the entire grid state
    console.log("Current grid state:");
    for (let row = 0; row < gridHeight; row++) {
        const rowLetters = allLetters.filter(l => parseInt(l.dataset.row) === row);
        console.log(rowLetters.map(l => l.textContent || '_').join(' '));
    }

    // Reset all words to uncompleted state, but don't hide revealed words
    words.forEach(word => {
        const wordElement = document.querySelector(`.word-item[data-word="${word.toLowerCase()}"]`);
        if (wordElement) {
            wordElement.classList.remove('completed');
        }
    });

    // Reset all letters to uncompleted state
    allLetters.forEach(letter => {
        letter.classList.remove('completed');
    });

    // Check horizontal lines
    for (let row = 0; row < gridHeight; row++) {
        const rowLetters = allLetters.filter(l => parseInt(l.dataset.row) === row);
        checkWordInLine(rowLetters, 'horizontal');
    }

    // Check vertical lines
    for (let col = 0; col < gridWidth; col++) {
        const colLetters = allLetters.filter(l => parseInt(l.dataset.col) === col);
        checkWordInLine(colLetters, 'vertical');
    }

    // Check if all words are completed
    if (areAllWordsCompleted()) {
        const currentLevel = parseInt(getCurrentLevel());
        const nextLevel = currentLevel + 1;
        if (levels[nextLevel.toString()]) {
            const existingContinueButton = document.getElementById('continue-button');
            if (!existingContinueButton) {
                showContinueButton(nextLevel);
            }
        } else {
            console.log("All levels completed!");
            showGameCompletedMessage();
        }
    }
}

function checkWordInLine(lineLetters, direction) {
    words.forEach(word => {
        const lowercaseWord = word.toLowerCase();
        
        for (let startIndex = 0; startIndex < lineLetters.length; startIndex++) {
            let isValidWord = true;
            let wordIndex = 0;
            let consecutiveCount = 0;

            for (let i = startIndex; i < lineLetters.length && wordIndex < word.length; i++) {
                const letterElement = lineLetters[i];
                const letterContent = letterElement.textContent.trim().toLowerCase();
                
                if (letterContent) {
                    if (letterContent !== lowercaseWord[wordIndex]) {
                        isValidWord = false;
                        break;
                    }
                    wordIndex++;
                    consecutiveCount++;
                } else if (consecutiveCount > 0) {
                    // If we've started matching and find an empty space, it's not valid
                    isValidWord = false;
                    break;
                }
            }

            if (isValidWord && wordIndex === word.length) {
                console.log(`Valid word found: ${word}`);
                wordIndex = 0;
                for (let i = startIndex; i < lineLetters.length && wordIndex < word.length; i++) {
                    const letterElement = lineLetters[i];
                    if (letterElement.textContent.trim()) {
                        if (!letterElement.classList.contains('selected')) {
                            letterElement.classList.add('completed');
                        }
                        console.log(`Marked letter ${letterElement.textContent}(${letterElement.dataset.row},${letterElement.dataset.col}) as completed for word ${word}`);
                        wordIndex++;
                    }
                }
                markWordAsCompleted(word);
                break; // Exit the loop once we've found and marked a valid word
            }
        }
    });
}

function areAllWordsCompleted() {
    const wordItems = document.querySelectorAll('.word-item');
    const allCompleted = Array.from(wordItems).every(item => item.classList.contains('completed'));
    if (allCompleted) {
        isLevelCompleted = true;
    }
    return allCompleted;
}

function showContinueButton(nextLevel) {
    const container = document.getElementById('game-container'); // Assume this is the main container
    const button = document.createElement('button');
    button.id = 'continue-button';
    button.textContent = `Continue to level ${nextLevel}`;
    button.style.opacity = '0';
    button.style.transition = 'opacity 500ms ease-in';
    button.style.display = 'block';
    button.style.margin = '20px auto';
    button.style.padding = '10px 20px';
    button.style.fontSize = '16px';
    button.style.backgroundColor = 'green';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    container.appendChild(button);

    // Trigger the fade-in effect
    setTimeout(() => {
        button.style.opacity = '1';
    }, 10);

    // Add click event to load next level
    button.addEventListener('click', () => loadLevel(nextLevel));
}

function showGameCompletedMessage() {
    const container = document.getElementById('game-container');
    const messageElement = document.createElement('div');
    messageElement.id = 'game-completed-message';
    messageElement.textContent = 'Congratulations! You have completed all levels!';
    messageElement.style.textAlign = 'center';
    messageElement.style.fontSize = '24px';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.margin = '20px 0';
    messageElement.style.color = '#4CAF50';  // Green color

    container.appendChild(messageElement);
}

function getCurrentLevel() {
    // This assumes you're storing the current level somewhere
    // You might need to adjust this based on how you're tracking the current level
    return document.body.dataset.currentLevel || "1";
}

function loadLevel(levelNumber) {
    // Remove the continue button if it exists
    const continueButton = document.getElementById('continue-button');
    if (continueButton) {
        continueButton.remove();
    }

    // Remove the reset button if it exists
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.remove();
    }

    // Clear selection and reset variables
    clearSelection();

    // Load the new level data
    currentLevel = levels[levelNumber.toString()];
    if (!currentLevel) {
        console.error(`Level ${levelNumber} not found!`);
        return;
    }

    words = currentLevel.words || []; // Use an empty array if words are not defined

    // Clear the game grid and word list
    gameGrid.innerHTML = '';
    document.getElementById('word-list').innerHTML = '';

    // Set up the new level
    gameGrid.style.gridTemplateColumns = `repeat(${currentLevel.width}, 1fr)`;

    currentLevel.letters.forEach((row, rowIndex) => {
        row.forEach((letter, colIndex) => {
            const letterElement = document.createElement('div');
            letterElement.classList.add('letter');
            letterElement.textContent = letter;
            letterElement.dataset.row = rowIndex;
            letterElement.dataset.col = colIndex;
            letterElement.addEventListener('click', () => selectLetter(letterElement, rowIndex, colIndex));
            gameGrid.appendChild(letterElement);
        });
    });

    if (words.length > 0) {
        displayWords(words);
        updateWordList();
    } else {
        console.log('No words defined for this level');
        // You might want to display a message to the user or handle this case differently
    }

    // Add the reset button after setting up the level
    addResetButton();

    // Update the current level
    document.body.dataset.currentLevel = levelNumber.toString();

    isLevelCompleted = false;
}

function markWordAsCompleted(word) {
    const wordElement = document.querySelector(`.word-item[data-word="${word.toLowerCase()}"]`);
    if (wordElement) {
        wordElement.classList.add('completed');
        revealWord(word);
        console.log(`Marked word ${word} as completed`);
    } else {
        console.log(`Could not find word element for ${word}`);
    }
}

function getDirection(lastRow, lastCol, newRow, newCol) {
    if (lastRow === newRow) {
        return lastCol < newCol ? 'right' : 'left';
    } else if (lastCol === newCol) {
        return lastRow < newRow ? 'down' : 'up';
    }
    return null;
}

function selectLetter(element, row, col) {
    if (isLevelCompleted) {
        console.log('Level completed. Letter selection disabled.');
        return;
    }

    // Remove the check for 'completed' class
    if (!element.textContent.trim()) {
        console.log('Attempted to select an empty square');
        return;
    }

    const isLastSelected = selectedLetters.length > 0 &&
        selectedLetters[selectedLetters.length - 1] === element;
    
    console.log('Before action:', selectedLetters.map(el => el.textContent).join(''));
    console.log('Clicked:', element.textContent, 'at', row, col);
    console.log('Is last selected:', isLastSelected);

    if (selectedLetters.length === 0 || (isAdjacent(row, col) && !element.classList.contains('selected'))) {
        element.classList.add('selected');
        if (element.classList.contains('completed')) {
            element.classList.remove('completed');
            element.classList.add('was-completed');
        }
        selectedLetters.push(element);
        lastSelectedRow = row;
        lastSelectedCol = col;
        console.log('Action: Selected new letter');
    } else if (isLastSelected) {
        element.classList.remove('selected');
        if (element.classList.contains('was-completed')) {
            element.classList.remove('was-completed');
            element.classList.add('completed');
        }
        selectedLetters.pop();
        if (selectedLetters.length > 0) {
            const last = selectedLetters[selectedLetters.length - 1];
            lastSelectedRow = parseInt(last.dataset.row);
            lastSelectedCol = parseInt(last.dataset.col);
        } else {
            lastSelectedRow = -1;
            lastSelectedCol = -1;
        }
        console.log('Action: Deselected last letter');
    } else {
        console.log('Action: No change (not adjacent or not last selected)');
    }

    console.log('After action:', selectedLetters.map(el => el.textContent).join(''));
    console.log('---');
}

function isAdjacent(row, col) {
    if (selectedLetters.length === 0) return true;
    const rowDiff = Math.abs(row - lastSelectedRow);
    const colDiff = Math.abs(col - lastSelectedCol);

    // Check if we're continuing in the same direction
    if (selectedLetters.length > 1) {
        const secondLastRow = parseInt(selectedLetters[selectedLetters.length - 2].dataset.row);
        const secondLastCol = parseInt(selectedLetters[selectedLetters.length - 2].dataset.col);
        const isHorizontal = secondLastRow === lastSelectedRow;
        const isVertical = secondLastCol === lastSelectedCol;

        if (isHorizontal) {
            return rowDiff === 0 && colDiff === 1;
        } else if (isVertical) {
            return rowDiff === 1 && colDiff === 0;
        }
    }

    // For the second letter or if no clear direction yet
    return (rowDiff === 0 && colDiff === 1) || (rowDiff === 1 && colDiff === 0);
}

function handleKeyPress(event) {
    if (event.key === 'Escape') {
        handleEscape();
    }
}

function handleEscape() {
    if (isLevelCompleted) {
        console.log('Level completed. No action taken.');
        return;
    }

    // Store the previously selected letters
    const previouslySelected = [...selectedLetters];

    // Clear selection
    clearSelection();

    // Recheck the grid for completed words
    checkForCompletedWordsAfterMove();

    // Log the action
    console.log('Escape or background clicked: Cleared selection and rechecked grid');
    console.log('Previously selected:', previouslySelected.map(el => el.textContent).join(''));
}

function addResetButton() {
    const container = document.getElementById('game-container');
    const resetButton = document.createElement('button');
    resetButton.id = 'reset-button';
    resetButton.textContent = 'Reset Level';
    resetButton.style.display = 'block';
    resetButton.style.margin = '20px auto';
    resetButton.style.padding = '10px 20px';
    resetButton.style.fontSize = '16px';
    resetButton.style.backgroundColor = '#f44336';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '5px';
    resetButton.style.cursor = 'pointer';

    resetButton.addEventListener('click', resetLevel);

    container.appendChild(resetButton);
}

function resetLevel() {
    const currentLevelNumber = getCurrentLevel();
    loadLevel(currentLevelNumber);
}

function updateWordList() {
    const wordList = document.getElementById('word-list');
    const wordItems = wordList.querySelectorAll('.word-item');

    wordItems.forEach(wordItem => {
        const word = wordItem.dataset.word;
        const isCompleted = isWordCompleted(word);
        wordItem.classList.toggle('completed', isCompleted);
    });
}

function isWordCompleted(word) {
    const lowercaseWord = word.toLowerCase();
    const letters = Array.from(document.querySelectorAll('.letter'));
    
    // Check horizontal
    for (let row = 0; row < currentLevel.height; row++) {
        const rowLetters = letters.filter(l => parseInt(l.dataset.row) === row);
        if (isWordInLine(rowLetters, lowercaseWord)) return true;
    }

    // Check vertical
    for (let col = 0; col < currentLevel.width; col++) {
        const colLetters = letters.filter(l => parseInt(l.dataset.col) === col);
        if (isWordInLine(colLetters, lowercaseWord)) return true;
    }

    return false;
}

function isWordInLine(lineLetters, word) {
    const lineWord = lineLetters.map(l => l.textContent.trim().toLowerCase()).join('');
    return lineWord.includes(word);
}

function clearSelection() {
    // Remove 'selected' and 'was-completed' classes from all letters
    const allLetters = document.querySelectorAll('.letter');
    allLetters.forEach(letter => {
        letter.classList.remove('selected', 'was-completed');
    });

    // Reset selection variables
    selectedLetters = [];
    lastSelectedRow = -1;
    lastSelectedCol = -1;

    console.log('Selection cleared and variables reset');
}

function setupBackgroundClickHandler() {
    document.addEventListener('click', (event) => {
        // Check if the click is outside the game grid
        if (!event.target.closest('#game-grid')) {
            handleEscape();
        }
    });
}

// Wrap the initialization and event listeners in a DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupBackgroundClickHandler();

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keydown', (event) => {
        if (isLevelCompleted) {
            console.log('Level completed. No action taken.');
            return;
        }

        console.log(`Key pressed: ${event.key}`);
        console.log(`Selected letters before move: ${selectedLetters.map(l => l.textContent).join('')}`);
        if (selectedLetters.length >= 3) {
            let direction;
            switch (event.key) {
                case 'ArrowLeft': direction = 'left'; break;
                case 'ArrowRight': direction = 'right'; break;
                case 'ArrowUp': direction = 'up'; break;
                case 'ArrowDown': direction = 'down'; break;
                default: return; // Exit if not an arrow key
            }
            
            console.log(`Attempting to move ${direction}`);
            if (moveLetters(direction)) {
                event.preventDefault(); // Prevent default scroll behavior
                console.log(`Moved ${direction} successfully`);
            } else {
                console.log(`Failed to move ${direction}`);
            }
        } else {
            console.log(`Not enough letters selected: ${selectedLetters.length}`);
        }
        console.log(`Selected letters after move attempt: ${selectedLetters.map(l => l.textContent).join('')}`);
        console.log('---');
    });
});