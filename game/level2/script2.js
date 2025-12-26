// Пул текстов (10 штук) по 3-4 предложения
const textsPool = [
    "Утром я обычно пью горячий кофе с молоком. Потом читаю новости в газете. Иногда смотрю телевизор перед работой. Вечером возвращаюсь домой уставший.",
    "Дети играли в парке на свежем воздухе. Они бегали, прыгали и смеялись. Вдруг пошел сильный дождь. Все побежали прятаться под деревья.",
    "В библиотеке всегда тихо и спокойно. Люди приходят сюда читать книги. На полках стоят тысячи интересных изданий. Можно найти литературу на любой вкус.",
    "Зимой выпадает пушистый белый снег. Дети лепят снеговиков и катаются на санках. Взрослые расчищают дорожки лопатами. Вечером все пьют горячий чай у камина.",
    "На кухне мама готовит вкусный обед. Пахнет свежей выпечкой и специями. Скоро вся семья соберется за столом. Будем есть суп, салат и мясо с картошкой.",
    "В зоопарке много разных животных. Обезьяны прыгают по деревьям. Слоны едят сено и фрукты. Тигры спят в своих вольерах.",
    "На уроке математики решаем сложные задачи. Учитель объясняет новую тему у доски. Ученики внимательно слушают и записывают. Потом будет самостоятельная работа.",
    "Летом мы ездим на дачу к бабушке. Там растут яблоки, груши и сливы. Мы помогаем собирать урожай. Вечерами сидим на веранде и разговариваем.",
    "В театре сегодня премьера нового спектакля. Актеры долго репетировали свои роли. Зал заполнен зрителями до отказа. Скогда поднимется занавес.",
    "Спортсмены тренируются на стадионе каждый день. Они бегают, поднимают штанги, играют в футбол. Тренер следит за их прогрессом. Скоро будут важные соревнования."
];

// Пул неподходящих слов (20 слов)
const wrongWordsPool = [
    "компьютер", "ракета", "динозавр", "пианино", "океан", 
    "вертолет", "шоколад", "микроскоп", "вулкан", "телефон",
    "космонавт", "аквариум", "гитара", "пароход", "телескоп",
    "торт", "самолет", "фонарь", "мотоцикл", "фотоаппарат"
];

let currentQuestion = 0;
let totalQuestions = 3;
let score = 0;
let mistakes = 0;
let maxMistakes = 5; // По умолчанию
let timer;
let timeLeft = 120; // По умолчанию
let currentText = "";
let errorWords = [];
let foundWords = [];
let totalErrors = 0;
let scoreMultiplier = 1.0;
let isQuestionActive = true;

// Элементы DOM
const playerNameEl = document.getElementById('playerName');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const mistakesEl = document.getElementById('mistakes');
const currentQuestionEl = document.getElementById('currentQuestion');
const textContainer = document.getElementById('textContainer');
const feedbackEl = document.getElementById('feedback');
const finishBtn = document.getElementById('finishBtn');
const foundCountEl = document.getElementById('foundCount');
const totalErrorsEl = document.getElementById('totalErrors');
const foundListEl = document.getElementById('foundList');

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

// Функция загрузки настроек сложности
function loadDifficultySettings() {
    let difficulty;
    if (typeof DifficultyManager !== 'undefined') {
        difficulty = DifficultyManager.getDifficulty(2);
    } else {
        difficulty = localStorage.getItem('level2Difficulty') || 'easy';
    }
    
    const settings = {
        easy: { time: 120, maxMistakes: 5, scoreMultiplier: 1.0 },
        medium: { time: 90, maxMistakes: 3, scoreMultiplier: 2.0 },
        hard: { time: 60, maxMistakes: 1, scoreMultiplier: 3.0 }
    };
    
    return settings[difficulty] || settings.easy;
}

// Функция получения названия сложности
function getDifficultyName() {
    const difficultySettings = loadDifficultySettings();
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
        if (difficultySettings.time === settings.time && difficultySettings.maxMistakes === settings.maxMistakes) {
            return difficulties[key];
        }
    }
    
    return difficulties.easy;
}

// Функция инициализации игры
async function initGame() {
    // Проверяем доступ к уровню
    if (!(await checkLevelAccess(2))) {
        return;
    }
    
    const name = localStorage.getItem('playerName');
    playerNameEl.textContent = name || 'Игрок';
    
    // Загружаем настройки сложности
    const difficultySettings = loadDifficultySettings();
    timeLeft = difficultySettings.time;
    maxMistakes = difficultySettings.maxMistakes;
    scoreMultiplier = difficultySettings.scoreMultiplier;
    
    // Обновляем таймер и ошибки в UI
    timerEl.textContent = timeLeft;
    mistakesEl.textContent = `${mistakes}/${maxMistakes}`;
    
    // Показываем информацию о сложности в заголовке
    const difficultyInfo = getDifficultyName();
    const header = document.querySelector('h1');
    if (header) {
        header.innerHTML += ` | Сложность: ${difficultyInfo.name}`;
    }
    
    // Начинаем игру
    loadQuestion();
    startTimer();
    updateStats();

    window.activateWinCheat = function() {
        console.log('Активация чита WIN на Уровне 2');
        score = 1000; // Устанавливаем 1000 очков
        finishLevel(true); // Завершаем уровень победой
    };
}

// Функция загрузки вопроса
function loadQuestion() {
    if (currentQuestion >= totalQuestions) {
        finishLevel(true);
        return;
    }
    
    resetQuestion();
    
    // Выбираем случайный текст
    const randomIndex = Math.floor(Math.random() * textsPool.length);
    currentText = textsPool[randomIndex];
    
    // Определяем количество ошибок (2-3 случайных слова)
    totalErrors = Math.floor(Math.random() * 2) + 2; // 2 или 3 ошибки
    
    // Создаем текст с неподходящими словами
    const { modifiedText, errorWordsList } = createTextWithErrors(currentText, totalErrors);
    errorWords = errorWordsList;
    
    // Отображаем текст
    displayText(modifiedText);
    
    // Обновляем счетчик вопросов
    currentQuestionEl.textContent = currentQuestion + 1;
    totalErrorsEl.textContent = totalErrors;
    
    isQuestionActive = true;
}

// Функция создания текста с ошибками
function createTextWithErrors(text, errorCount) {
    const words = text.split(' ');
    const errorWordsList = [];
    const usedPositions = new Set();
    
    // Выбираем случайные позиции для ошибок
    while (errorWordsList.length < errorCount) {
        const pos = Math.floor(Math.random() * (words.length - 1));
        
        // Пропускаем слишком короткие слова и уже использованные позиции
        if (words[pos].length > 2 && !usedPositions.has(pos)) {
            usedPositions.add(pos);
            
            // Выбираем случайное неподходящее слово
            const wrongWord = wrongWordsPool[Math.floor(Math.random() * wrongWordsPool.length)];
            errorWordsList.push({
                word: wrongWord,
                position: pos,
                originalWord: words[pos]
            });
            
            // Заменяем слово в тексте
            words[pos] = wrongWord;
        }
    }
    
    return {
        modifiedText: words.join(' '),
        errorWordsList
    };
}

// Функция отображения текста
function displayText(text) {
    const words = text.split(' ');
    let html = '';
    
    words.forEach((word, index) => {
        // ИЗМЕНЕНО: Убрано выделение неподходящих слов
        html += `<span class="word" data-index="${index}" data-word="${word}">${word}</span> `;
    });
    
    textContainer.innerHTML = `<p>${html}</p>`;
    
    // Добавляем обработчики двойного клика
    document.querySelectorAll('.word').forEach(wordEl => {
        wordEl.addEventListener('dblclick', handleWordClick);
    });
}

// Функция обработки двойного клика на слове
function handleWordClick(event) {
    if (!isQuestionActive) return;
    
    const wordEl = event.target;
    const wordIndex = parseInt(wordEl.dataset.index);
    const wordText = wordEl.dataset.word;
    
    // Проверяем, было ли уже найдено это слово
    if (wordEl.classList.contains('disabled')) return;
    
    // Проверяем, является ли это слово ошибкой
    const isErrorWord = errorWords.some(e => e.position === wordIndex && e.word === wordText);
    
    if (isErrorWord) {
        // Правильный клик
        wordEl.classList.add('correct-click', 'disabled');
        
        // Добавляем в список найденных
        foundWords.push(wordText);
        updateFoundList();
        
        // Увеличиваем счет
        const baseScore = 30;
        score += Math.round(baseScore * scoreMultiplier);
        scoreEl.textContent = score;
        
        // Показываем сообщение
        showFeedback(true, `Правильно! Слово "${wordText}" не подходит по смыслу.`);
        
        // Проверяем, все ли ошибки найдены
        if (foundWords.length === totalErrors) {
            isQuestionActive = false;
            showFeedback(true, `Все неподходящие слова найдены!`);
            
            // Автоматический переход к следующему вопросу через 1.5 секунды
            setTimeout(() => {
                currentQuestion++;
                if (currentQuestion < totalQuestions) {
                    loadQuestion();
                } else {
                    finishLevel(true);
                }
            }, 1500);
        }
    } else {
        // Неправильный клик
        wordEl.classList.add('incorrect-click');
        
        // Штраф
        const penalty = 15;
        score = Math.max(0, score - Math.round(penalty * scoreMultiplier));
        scoreEl.textContent = score;
        
        // Увеличиваем счетчик ошибок
        mistakes++;
        mistakesEl.textContent = `${mistakes}/${maxMistakes}`;
        
        // Показываем сообщение
        showFeedback(false, `Неправильно! Слово "${wordText}" подходит по смыслу.`);
        
        // Через 2 секунды убираем подсветку
        setTimeout(() => {
            wordEl.classList.remove('incorrect-click');
        }, 2000);
        
        // Проверяем, не превышен ли лимит ошибок
        if (mistakes >= maxMistakes) {
            isQuestionActive = false;
            setTimeout(async () => {
                await showModal(
                    'Слишком много ошибок!',
                    `Вы совершили ${mistakes} ошибок из допустимых ${maxMistakes}.`
                );
                finishLevel(false);
            }, 2000);
            return;
        }
    }
    
    updateStats();
}

// Функция обновления списка найденных слов
function updateFoundList() {
    foundCountEl.textContent = foundWords.length;
    foundListEl.innerHTML = '';
    
    foundWords.forEach(word => {
        const wordEl = document.createElement('div');
        wordEl.className = 'found-word-item';
        wordEl.textContent = word;
        foundListEl.appendChild(wordEl);
    });
}

// Функция показа обратной связи
function showFeedback(isCorrect, message) {
    feedbackEl.innerHTML = '';
    feedbackEl.className = 'feedback';
    
    if (isCorrect) {
        feedbackEl.classList.add('correct');
        feedbackEl.innerHTML = `
            <div>
                <span style="font-size: 24px; margin-right: 10px;">✓</span>
                <strong>${message}</strong>
            </div>
        `;
    } else {
        feedbackEl.classList.add('incorrect');
        feedbackEl.innerHTML = `
            <div>
                <span style="font-size: 24px; margin-right: 10px;">✗</span>
                <strong>${message}</strong>
            </div>
        `;
    }
}

// Функция сброса состояния вопроса
function resetQuestion() {
    isQuestionActive = true;
    foundWords = [];
    errorWords = [];
    totalErrors = 0;
    feedbackEl.innerHTML = '';
    feedbackEl.className = 'feedback';
    foundCountEl.textContent = '0';
    foundListEl.innerHTML = '';
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

    document.getElementById('customModal').style.display = 'none';
  
    const difficultySettings = loadDifficultySettings();
    const timeSpent = difficultySettings.time - timeLeft;
    saveLevelTime(2, timeSpent);
  
    saveLevelResult(2, score);
  
    if (success) {
        showVictoryAnimation(2);
    } 
    
    // Получаем информацию о сложности
    const difficultyInfo = getDifficultyName();
    
    // Показываем результат
    const resultHTML = `
        <div class="result-overlay">
            <div class="result-modal">
                <h2>Уровень 2 завершен!</h2>
                <div class="result-details">
                    <p>Сложность: <strong>${difficultyInfo.name} ${difficultyInfo.icon}</strong></p>
                    <p>Найдено слов: <strong>${foundWords.length} из ${errorWords.length}</strong></p>
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
                    <button onclick="goToNextLevel(2)">Следующий уровень</button>
                    <button onclick="window.location.reload()">Играть снова</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', resultHTML);
}

// Обработчик кнопки завершения уровня
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