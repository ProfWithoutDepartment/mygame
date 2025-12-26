const sentencesPool = [ // предложения для отвелчения
    {
        sentence: "Вчера мы ходили в лес и нашли там огромный ____, под которым устроили пикник.",
        correct: "дуб",
        category: "природа"
    },
    {
        sentence: "Моя бабушка всегда готовит самый вкусный яблочный ____ по старинному рецепту.",
        correct: "пирог",
        category: "еда"
    },
    {
        sentence: "Ученые обнаружили, что в центре нашей галактики находится огромная черная ____.",
        correct: "дыра",
        category: "космос"
    },
    {
        sentence: "После долгого рабочего дня он с удовольствием сел в удобное кресло и открыл интересную ____.",
        correct: "книгу",
        category: "отдых"
    },
    {
        sentence: "Дети с радостью побежали купаться в теплой прозрачной ____ деревенского озера.",
        correct: "воде",
        category: "природа"
    },
    {
        sentence: "Наш домашний ____ по имени Васька очень любит спать на подоконнике на солнышке.",
        correct: "кот",
        category: "животные"
    },
    {
        sentence: "Зимним вечером мы любим пить горячий ____ с медом и рассказывать друг другу истории.",
        correct: "чай",
        category: "еда"
    },
    {
        sentence: "Художник взял кисть и начал создавать на холсте удивительной красоты ____.",
        correct: "картину",
        category: "искусство"
    },
    {
        sentence: "Путешественники долго шли через густой ____, прежде чем вышли к реке.",
        correct: "лес",
        category: "природа"
    },
    {
        sentence: "Строители завершили работу и на месте пустыря теперь стоит красивый новый ____.",
        correct: "дом",
        category: "строительство"
    }
];

// пул возможных слов
const wordsPool = [
    // правильные слова (из sentencesPool)
    "дуб", "пирог", "дыра", "книгу", "воде", "кот", "чай", "картину", "лес", "дом",
    // отвлекающие слова
    "стол", "река", "солнце", "окно", "птица", "машина", "город", "улица", "цветок", "гора"
];

let currentQuestion = 0;
let totalQuestions = 5;
let score = 0;
let mistakes = 0;
let maxMistakes = 5;
let timer;
let timeLeft = 120;
let currentCorrectAnswer = "";
let selectedSentences = [];
let selectedOptions = [];
let isAnswerSubmitted = false;
let scoreMultiplier = 1.0;

const playerNameEl = document.getElementById('playerName');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const mistakesEl = document.getElementById('mistakes');
const currentQuestionEl = document.getElementById('currentQuestion');
const sentenceTextEl = document.getElementById('sentenceText');
const optionsContainer = document.getElementById('optionsContainer');
const feedbackEl = document.getElementById('feedback');
const finishBtn = document.getElementById('finishBtn');
const maxMistakesEl = document.getElementById('maxMistakes');

// Функции для работы с модальным окном
function showModal(title, message, isConfirm = false) {
    return new Promise((resolve) => {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        const modal = document.getElementById('customModal');
        const okButton = document.getElementById('modalOkButton');
        const cancelButton = document.getElementById('modalCancelButton');
        
        // Настройка кнопок
        if (isConfirm) {
            okButton.textContent = 'Да';
            cancelButton.style.display = 'inline-block';
            cancelButton.textContent = 'Нет';
        } else {
            okButton.textContent = 'OK';
            cancelButton.style.display = 'none';
        }
        
        // Показываем модальное окно
        modal.style.display = 'flex';
        
        // Обработчики кнопок
        const handleOk = () => {
            modal.style.display = 'none';
            okButton.removeEventListener('click', handleOk);
            if (cancelButton) cancelButton.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeyDown);
            resolve(true);
        };
        
        const handleCancel = () => {
            modal.style.display = 'none';
            okButton.removeEventListener('click', handleOk);
            cancelButton.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeyDown);
            resolve(false);
        };
        
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            } else if (e.key === 'Enter' && !isConfirm) {
                handleOk();
            }
        };
        
        okButton.addEventListener('click', handleOk);
        if (isConfirm) {
            cancelButton.addEventListener('click', handleCancel);
        }
        document.addEventListener('keydown', handleKeyDown);
    });
}

function loadDifficultySettings() {
    let difficulty;
    if (typeof DifficultyManager !== 'undefined') {
        difficulty = DifficultyManager.getDifficulty(1);
    } else {
        difficulty = localStorage.getItem('level1Difficulty') || 'easy';
    }
    
    const settings = {
        easy: { time: 120, maxMistakes: 5, scoreMultiplier: 1.0 },
        medium: { time: 90, maxMistakes: 3, scoreMultiplier: 1.5 },
        hard: { time: 60, maxMistakes: 1, scoreMultiplier: 2.0 }
    };
    
    return settings[difficulty] || settings.easy;
}

function getDifficultyName() {
    const difficulty = loadDifficultySettings();
    const difficulties = {
        easy: { name: "Простой", icon: "Easy" },
        medium: { name: "Средний", icon: "Medium" },
        hard: { name: "Сложный", icon: "Hard" }
    };
    
    for (const [key, settings] of Object.entries({
        easy: { time: 120, maxMistakes: 5 },
        medium: { time: 90, maxMistakes: 3 },
        hard: { time: 60, maxMistakes: 1 }
    })) {
        if (difficulty.time === settings.time && difficulty.maxMistakes === settings.maxMistakes) {
            return difficulties[key];
        }
    }
    
    return difficulties.easy;
}

async function initGame() {
    if (!(await checkLevelAccess(1))) {
        return;
    }
    
    const name = localStorage.getItem('playerName');
    playerNameEl.textContent = name || 'Игрок';
    
    const difficultySettings = loadDifficultySettings();
    timeLeft = difficultySettings.time;
    maxMistakes = difficultySettings.maxMistakes;
    scoreMultiplier = difficultySettings.scoreMultiplier;
    
    if (maxMistakesEl) {
        maxMistakesEl.textContent = maxMistakes;
    }
    
    selectedSentences = getRandomSentences(sentencesPool, totalQuestions);
    
    loadQuestion();
    startTimer();
    updateStats();
    
    // Добавляем обработчик клавиатуры
    document.addEventListener('keydown', handleKeyPress);

    window.activateWinCheat = function() {
        console.log('Активация чита WIN на Уровне 1');
        score = 1000; // Устанавливаем 1000 очков
        finishLevel(true); // Завершаем уровень победой
      };
}

function getRandomSentences(pool, count) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function loadQuestion() {
    if (currentQuestion >= totalQuestions) {
        finishLevel(true);
        return;
    }
    
    resetQuestion();
    const questionData = selectedSentences[currentQuestion];
    
    const sentenceWithBlank = questionData.sentence.replace('____', '<span class="blank">____</span>');
    sentenceTextEl.innerHTML = sentenceWithBlank;
    
    // Сохраняем правильный ответ
    currentCorrectAnswer = questionData.correct;
    
    // Генерируем варианты ответов (1 правильный + 5 неправильных)
    selectedOptions = generateOptions(questionData.correct);
    
    // Отображаем варианты
    displayOptions(selectedOptions);
    
    // Обновляем счетчик вопросов
    currentQuestionEl.textContent = currentQuestion + 1;
}

// Функция генерации вариантов ответов
function generateOptions(correctAnswer) {
    const options = [correctAnswer];
    
    // Получаем все слова кроме правильного
    const otherWords = wordsPool.filter(word => word !== correctAnswer);
    
    // Выбираем 5 случайных отвлекающих слов
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 5);
    
    // Добавляем к вариантам
    options.push(...shuffledOthers);
    
    // Перемешиваем все варианты
    return options.sort(() => Math.random() - 0.5);
}

// Функция отображения вариантов
function displayOptions(options) {
    optionsContainer.innerHTML = '';
    
    options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.innerHTML = `<div class="option-number">${index + 1}</div>${option}`;
        optionElement.dataset.word = option;
        optionElement.dataset.index = index;
        
        optionsContainer.appendChild(optionElement);
    });
}

// Функция обработки нажатия клавиш
function handleKeyPress(event) {
    if (isAnswerSubmitted) return;
    
    const key = event.key;
    // Проверяем, что нажата цифра от 1 до 6
    if (key >= '1' && key <= '6') {
        const index = parseInt(key) - 1;
        
        // Проверяем, что индекс в пределах количества вариантов
        if (index >= 0 && index < selectedOptions.length) {
            const selectedWord = selectedOptions[index];
            handleOptionSelect(selectedWord, index);
        }
    }
}

// Функция обработки выбора варианта
function handleOptionSelect(selectedWord, index) {
    if (isAnswerSubmitted) return;
    
    const isCorrect = selectedWord === currentCorrectAnswer;
    
    // Помечаем выбранный вариант
    const optionElements = document.querySelectorAll('.option');
    optionElements[index].classList.add(isCorrect ? 'correct' : 'incorrect');
    
    // Показываем правильный ответ, если выбран неправильный
    if (!isCorrect) {
        const correctIndex = selectedOptions.findIndex(option => option === currentCorrectAnswer);
        if (correctIndex !== -1) {
            optionElements[correctIndex].classList.add('correct');
        }
    }
    
    // Отключаем все варианты
    optionElements.forEach(option => {
        option.classList.add('disabled');
        option.style.pointerEvents = 'none';
    });
    
    isAnswerSubmitted = true;
    
    // Показываем обратную связь
    showFeedback(isCorrect, selectedWord);
    
    // Обновляем счет и ошибки
    if (isCorrect) {
        // Увеличиваем счет с учетом множителя
        const baseScore = 20;
        score += Math.round(baseScore * scoreMultiplier);
        scoreEl.textContent = score;
    } else {
        mistakes++;
        mistakesEl.textContent = mistakes;
        
        // Проверяем, не превышен ли лимит ошибок
        if (mistakes >= maxMistakes) {
            setTimeout(async () => {
                await showModal(
                    'Уровень завершен!',
                    `Вы совершили ${mistakes} ошибок из допустимых ${maxMistakes}.`
                );
                finishLevel(false);
            }, 2000);
            return;
        }
    }
    
    // Переходим к следующему вопросу через 1.5 секунды
    setTimeout(() => {
        if (currentQuestion < totalQuestions - 1) {
            currentQuestion++;
            loadQuestion();
        } else {
            finishLevel(true);
        }
    }, 1500);
}

// Функция показа обратной связи
function showFeedback(isCorrect, selectedWord) {
    feedbackEl.innerHTML = '';
    feedbackEl.className = 'feedback';
    
    if (isCorrect) {
        feedbackEl.classList.add('correct');
        feedbackEl.innerHTML = `
            <div>
                <span style="font-size: 24px; margin-right: 10px;">✓</span>
                <strong>Правильно!</strong> Вы выбрали слово "${selectedWord}"
            </div>
        `;
    } else {
        feedbackEl.classList.add('incorrect');
        feedbackEl.innerHTML = `
            <div>
                <span style="font-size: 24px; margin-right: 10px;">✗</span>
                <strong>Неправильно!</strong> Вы выбрали "${selectedWord}", а нужно "${currentCorrectAnswer}"
            </div>
        `;
    }
}

// Функция сброса состояния вопроса
function resetQuestion() {
    isAnswerSubmitted = false;
    feedbackEl.innerHTML = '';
    feedbackEl.className = 'feedback';
}

// Функция обновления статистики
function updateStats() {
    scoreEl.textContent = score;
    mistakesEl.textContent = `${mistakes}/${maxMistakes}`;
    
    // Визуальная индикация ошибок
    if (mistakes >= maxMistakes - 1) {
        mistakesEl.style.color = '#ff4444';
        mistakesEl.style.fontWeight = 'bold';
    } else if (mistakes > 0) {
        mistakesEl.style.color = '#ffaa00';
    } else {
        mistakesEl.style.color = '';
        mistakesEl.style.fontWeight = '';
    }
}

// Функция запуска таймера
function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        
        if (timeLeft <= 30) {
            timerEl.style.color = '#ff4444';
            timerEl.style.fontWeight = 'bold';
        } else if (timeLeft <= 60) {
            timerEl.style.color = '#ffaa00';
        } else {
            timerEl.style.color = '';
            timerEl.style.fontWeight = '';
        }
        
        if (timeLeft <= 0) {
            finishLevel(false);
        }
    }, 1000);
}

// Функция завершения уровня
function finishLevel(success = false) {
    
    clearInterval(timer);
  
  // Закрываем все модальные окна
    document.getElementById('customModal').style.display = 'none';
  
  // Сохраняем время прохождения уровня
    const difficultySettings = loadDifficultySettings();
    const timeSpent = difficultySettings.time - timeLeft;
    saveLevelTime(1, timeSpent);
  
  // Сохраняем результат
    saveLevelResult(1, score);
  
  // ТОЛЬКО если уровень успешно пройден - показываем анимацию
    if (success) {
        showVictoryAnimation(1);
    }
    
    // Получаем информацию о сложности
    const difficultyInfo = getDifficultyName();
    const header = document.querySelector('h1');
    if (header) {
        header.innerHTML += ` | Сложность: ${difficultyInfo.name}`;
    }
    
    // Показываем результат
    const resultHTML = `
        <div class="result-overlay">
            <div class="result-modal">
                <h2>Уровень 1 завершен!</h2>
                <div class="result-details">
                    <p>Сложность: <strong>${difficultyInfo.name} ${difficultyInfo.icon}</strong></p>
                    <p>Правильных ответов: <strong>${Math.round(score / (20 * scoreMultiplier))} из ${totalQuestions}</strong></p>
                    <p>Ошибок: <strong>${mistakes}/${maxMistakes}</strong></p>
                    <p>Время: <strong>${timeSpent} сек.</strong></p>
                    <p>Множитель очков: <strong>${scoreMultiplier}×</strong></p>
                </div>
                <div class="result-score">
                    Ваш счет: <span class="score-value">${score}</span>
                </div>
                <div class="result-buttons">
                    <button onclick="window.location.href='../levels.html'">Выбор уровня</button>
                    <button onclick="window.location.href='select-mode.html'">Сменить сложность</button>
                    <button onclick="goToNextLevel(1)">Следующий уровень</button>
                    <button onclick="window.location.reload()">Играть снова</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', resultHTML);
}

finishBtn.addEventListener('click', async () => {
    const confirmed = await showModal(
        'Завершить уровень досрочно?',
        'Ваш текущий счет будет сохранен.',
        true // Это confirm-окно с кнопками Да/Нет
    );
    if (confirmed) {
        finishLevel(false);
    }
});

// Инициализация игры при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initGame().catch(error => {
        console.error('Ошибка инициализации игры:', error);
    });
});