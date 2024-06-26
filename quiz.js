document.addEventListener("DOMContentLoaded", function () {
    fetch('questions.json')
        .then(response => response.json())
        .then(data => initializeQuiz(data))
        .catch(error => console.error('Error loading the questions:', error));
});

const Colors = {
    'lightGreen': '#28a745',
    'green': 'green',
    'lightRed': '#FF6347',
    'red': 'red',
};

let currentQuestionIndex = 0;
let currentChapter;
let quizData;
let autoNext = true;
const shuffleModeList = ["Shuffle off", "Shuffle questions", "Shuffle chapters and questions"];
let shuffleModeIndex = 0;

function toggleAutoNext() {
    autoNext = !autoNext;
    const button = document.getElementById('autoNextToggle');
    button.textContent = autoNext ? 'Auto Next: On' : 'Auto Next: Off';
    button.style.backgroundColor = autoNext ?  Colors.lightGreen : Colors.lightRed;
}

function initializeQuiz(data) {
    quizData = data;
    Object.keys(data).forEach(chapter => {
        data[chapter].forEach((question, index) => {
            question.originalIndex = index; // Ensure each question has an original index
        });
    });
    populateChapters();
    changeChapter(Object.keys(data)[0]); // Start with the first chapter
    const shuffleButton = document.getElementById('shuffleToggle');
    shuffleButton.textContent = shuffleModeList[shuffleModeIndex];
}

function populateChapters() {
    const select = document.getElementById('chapter-select');
    select.innerHTML = ''; // Clear previous options
    Object.keys(quizData).forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter;
        option.textContent = chapter;
        select.appendChild(option);
    });
    if (currentChapter) select.value = currentChapter; // Set the current chapter in the dropdown
}

function populateQuestions() {
    const select = document.getElementById('question-select');
    select.innerHTML = ''; // Clear previous options
    quizData[currentChapter].forEach((question, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Question ${index + 1}`;
        select.appendChild(option);
    });
    select.value = currentQuestionIndex; // Set the current question in the dropdown
}


function changeChapter(chapter) {
    currentChapter = chapter;
    currentQuestionIndex = 0; // Start from the first question in the chapter
    populateQuestions();
    loadQuestion();
}

function changeQuestion(index) {
    currentQuestionIndex = index;
    loadQuestion();
}

function loadQuestion() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '';
    const chapterData = quizData[currentChapter];
    if (chapterData && chapterData[currentQuestionIndex]) {
        const questionData = chapterData[currentQuestionIndex];
        document.getElementById('question').textContent = questionData.question;
        document.getElementById('question-select').value = currentQuestionIndex;
        document.getElementById('chapter-select').value = currentChapter;
        const optionsUl = document.getElementById('options');
        optionsUl.innerHTML = '';

        // Copy options to a new array and shuffle it
        const shuffledOptions = questionData.options.slice().sort(() => Math.random() - 0.5);

        shuffledOptions.forEach((option, index) => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = `${String.fromCharCode(65 + index)}) ${option}`;
            button.onclick = () => checkAnswer(option, questionData.answer);
            li.appendChild(button);
            optionsUl.appendChild(li);
        });
    }
}
function checkAnswer(selectedOption, correctAnswer) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = selectedOption === correctAnswer ? 'Correct!' : 'Wrong, try again!';
    feedback.style.color = selectedOption === correctAnswer ? 'green' : 'red';
    if(autoNext && selectedOption === correctAnswer) {
        // next question in 100ms
        setTimeout(() => {
            performAutoNext();
        }, 200);
    }

    // make the correct answer green background
    const optionsUl = document.getElementById('options');
    optionsUl.childNodes.forEach((li, index) => {
        const button = li.firstChild;
        if (button.textContent.includes(correctAnswer)) {
            button.style.backgroundColor = 'green';
            // text white
            button.style.color = 'white';
        }
    });

    // if selected option is wrong, then make it red background
    if (selectedOption !== correctAnswer) {
        optionsUl.childNodes.forEach((li, index) => {
            const button = li.firstChild;
            if (button.textContent.includes(selectedOption)) {
                button.style.backgroundColor = 'red';
                // text white
                button.style.color = 'white';
            }
        });
    }

    // Disable all buttons
    optionsUl.childNodes.forEach(li => {
        li.firstChild.disabled = true;
    });
}

function loadNextQuestion() {
    if (currentQuestionIndex < quizData[currentChapter].length - 1) {
        currentQuestionIndex++; // Move to the next question
    } else {
        currentQuestionIndex = 0; // Restart at the beginning if it's the last question
    }
    loadQuestion();
}

function loadPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--; // Move to the previous question
    } else {
        currentQuestionIndex = quizData[currentChapter].length - 1; // Move to the last question if it's the first question
    }
    loadQuestion();
}

function loadNextChapter() {
    const chapters = Object.keys(quizData);
    const currentChapterIndex = chapters.indexOf(currentChapter);
    const nextChapterIndex = currentChapterIndex < chapters.length - 1 ? currentChapterIndex + 1 : 0;
    changeChapter(chapters[nextChapterIndex]);
}

function loadPreviousChapter() {
    const chapters = Object.keys(quizData);
    const currentChapterIndex = chapters.indexOf(currentChapter);
    const previousChapterIndex = currentChapterIndex > 0 ? currentChapterIndex - 1 : chapters.length - 1;
    changeChapter(chapters[previousChapterIndex]);
}

function shuffleCurrentQuestions() {
    const availableQuestions = quizData[currentChapter];
    currentQuestionIndex = Math.floor(Math.random() * availableQuestions.length);
    loadQuestion();
}

function shuffleChaptersAndQuestions() {
    const chapters = Object.keys(quizData);
    currentChapter = chapters[Math.floor(Math.random() * chapters.length)];
    const availableQuestions = quizData[currentChapter];
    currentQuestionIndex = Math.floor(Math.random() * availableQuestions.length);
    loadQuestion();
}

function toggleShuffleMode() {
    shuffleModeIndex = (shuffleModeIndex + 1) % shuffleModeList.length;
    const shuffleButton = document.getElementById('shuffleToggle');
    shuffleButton.textContent = shuffleModeList[shuffleModeIndex];
    if (shuffleModeIndex === 0) shuffleButton.style.backgroundColor = Colors.lightRed;
    else shuffleButton.style.backgroundColor = Colors.lightGreen;
}


function performAutoNext(){
    if (shuffleModeIndex === 0) loadNextQuestion();
    else if (shuffleModeIndex === 1) shuffleCurrentQuestions();
    else shuffleChaptersAndQuestions();
}

let shiftDown = false;
document.addEventListener('keydown', function (event) {
    if (event.key === 'Shift') shiftDown = true;
    if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        if(shiftDown) loadNextChapter();
        else loadNextQuestion();
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if(shiftDown) loadPreviousChapter();
        else loadPreviousQuestion();
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        shuffleCurrentQuestions();
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        shuffleChaptersAndQuestions();
    }
    else {
        const optionsUl = document.getElementById('options');
        const key = event.key.toLowerCase();
        const keyIndex = key.length === 1 ? key.charCodeAt(0) - 97 : -1;
        if (keyIndex >= 0 && keyIndex < optionsUl.childNodes.length) {
            optionsUl.childNodes[keyIndex].firstChild.click();
        }
    }
});

document.addEventListener('keyup', function (event) {
    if (event.key === 'Shift') shiftDown = false;
});
