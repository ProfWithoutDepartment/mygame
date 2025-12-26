const Level3New = {
    // Пул предложений (10 предложений по 3-4 слова)
    sentencesPool: [
      "Дети играют в парке",
      "Мама готовит вкусный ужин",
      "Солнце светит очень ярко",
      "Собака бежит по полю",
      "Книга лежит на столе",
      "Дождь идет второй день",
      "Птицы поют весной",
      "Река течет спокойно",
      "Окно открыто настежь",
      "Мальчик читает интересную книгу"
    ],

    // Текущее состояние
    selectedSentences: [], // 5 случайных предложений из пула
    currentWordsPool: [],
    score: 0,
    mistakes: 0,
    maxMistakes: 5,
    timer: null,
    timeLeft: 120,
    completedSentences: 0,
    totalSentences: 3,
    fallingWords: [],
    maxFallingWords: 4,
    spawnInterval: 1500,
    spawnIntervalId: null,
    scoreMultiplier: 1.0,
    sentenceSlotsData: {
      1: { words: [], isCorrect: false, completedSentence: null },
      2: { words: [], isCorrect: false, completedSentence: null },
      3: { words: [], isCorrect: false, completedSentence: null }
    },

    // Элементы DOM
    elements: {},
    
    // Функция загрузки настроек сложности
    loadDifficultySettings() {
        let difficulty;
        if (typeof DifficultyManager !== 'undefined') {
            difficulty = DifficultyManager.getDifficulty(3);
        } else {
            difficulty = localStorage.getItem('level3Difficulty') || 'easy';
        }
        
        const settings = {
            easy: { time: 120, maxMistakes: 5, scoreMultiplier: 1.0 },
            medium: { time: 90, maxMistakes: 3, scoreMultiplier: 1.5 },
            hard: { time: 60, maxMistakes: 1, scoreMultiplier: 2.0 }
        };
        
        return settings[difficulty] || settings.easy;
    },
    
    // Функция получения названия сложности
    getDifficultyName() {
        const difficultySettings = this.loadDifficultySettings();
        const difficulties = {
            easy: { name: "Простой", icon: "Easy" },
            medium: { name: "Средний", icon: "Medium" },
            hard: { name: "Сложный", icon: "Hard" }
        };
        
        if (difficultySettings.time === 60 && difficultySettings.maxMistakes === 1) {
            return difficulties.hard;
        } else if (difficultySettings.time === 90 && difficultySettings.maxMistakes === 3) {
            return difficulties.medium;
        } else {
            return difficulties.easy;
        }
    },

        // Функция для показа модального окна
    showModal(title, message, isConfirm = false) {
        return new Promise((resolve) => {
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalMessage').textContent = message;
            const modal = document.getElementById('customModal');
            const okButton = document.getElementById('modalOkButton');
            const cancelButton = document.getElementById('modalCancelButton');
        
            if (isConfirm) {
               okButton.textContent = 'Да';
                cancelButton.style.display = 'inline-block';
                cancelButton.textContent = 'Нет';
            } else {
                okButton.textContent = 'OK';
                cancelButton.style.display = 'none';
            }
        
            modal.style.display = 'flex';
        
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
    },

    // Инициализация игры
    async init() {
        // Проверяем доступ к уровню
        if (!(await checkLevelAccess(3))) {
            return;
        }
        
        // Загружаем настройки сложности
        const difficultySettings = this.loadDifficultySettings();
        this.timeLeft = difficultySettings.time;
        this.maxMistakes = difficultySettings.maxMistakes;
        this.scoreMultiplier = difficultySettings.scoreMultiplier;
        
        // Выбираем 5 случайных предложений из пула
        this.selectRandomSentences();
        
        // Создаем пул слов для игры (только слова из выбранных 5 предложений)
        this.createWordsPool();
        
        // Получаем элементы DOM
        this.getElements();
        
        // Отображаем имя игрока
        this.displayPlayerName();
        
        // Инициализируем слоты для предложений
        this.initializeSentenceSlots();
        
        // Запускаем таймер
        this.startTimer();
        
        // Запускаем падение слов
        this.startWordSpawning();
        
        // Обновляем статистику
        this.updateStats();
        
        // Показываем информацию о сложности
        const difficultyInfo = this.getDifficultyName();
        const header = document.querySelector('h1');
        if (header) {
          header.innerHTML += ` | Сложность: ${difficultyInfo.name}`;
        }
        
        // Логи для отладки
        console.log('Выбранные предложения:', this.selectedSentences);

        window.activateWinCheat = () => {
            console.log('Активация чита WIN на Уровне 3');
            this.score = 1000; // Устанавливаем 1000 очков
            this.finishLevel(true); // Завершаем уровень победой (true = успешное прохождение)
        };
    },

    // Выбор 5 случайных предложений из пула
    selectRandomSentences() {
        // Перемешиваем предложения
        const shuffled = [...this.sentencesPool].sort(() => Math.random() - 0.5);
        
        // Берем первые 5 предложений
        this.selectedSentences = shuffled.slice(0, 5);
    },

    // Создание пула слов для игры (только слова из выбранных 5 предложений)
    createWordsPool() {
        // Собираем все слова из выбранных предложений
        this.currentWordsPool = [];
        
        // Разбиваем предложения на слова
        this.selectedSentences.forEach(sentence => {
            const words = sentence.split(' ');
            this.currentWordsPool.push(...words);
        });
        
        // Добавляем слова еще 2 раза, чтобы было достаточно для составления
        const additionalWords = [...this.currentWordsPool];
        for (let i = 0; i < 2; i++) {
            this.currentWordsPool.push(...additionalWords);
        }
        
        // Перемешиваем
        for (let i = this.currentWordsPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.currentWordsPool[i], this.currentWordsPool[j]] = [this.currentWordsPool[j], this.currentWordsPool[i]];
        }
        
        console.log('Создан пул слов:', this.currentWordsPool);
    },

    // Получение элементов DOM
    getElements() {
        this.elements = {
            playerName: document.getElementById('playerName'),
            timer: document.getElementById('timer'),
            score: document.getElementById('score'),
            mistakes: document.getElementById('mistakes'),
            completed: document.getElementById('completed'),
            stormArea: document.getElementById('stormArea'),
            sentenceSlot1: document.getElementById('sentenceSlot1'),
            sentenceSlot2: document.getElementById('sentenceSlot2'),
            sentenceSlot3: document.getElementById('sentenceSlot3'),
            feedback: document.getElementById('feedback'),
            finishBtn: document.getElementById('finishBtn')
        };
        
        // Обработчики событий для кнопок проверки каждого слота
        document.querySelectorAll('.slot-check-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const slotNumber = parseInt(e.target.dataset.slot);
                this.checkSingleSentence(slotNumber);
            });
        });
        
        if (this.elements.finishBtn) {
            this.elements.finishBtn.addEventListener('click', async () => {
                const confirmed = await this.showModal(
                    'Завершить уровень досрочно?',
                    'Ваш текущий счет будет сохранен.',
                    true // Это confirm-окно с кнопками Да/Нет
                );
                if (confirmed) {
                    this.finishLevel();
                }
            });
        }
    },

    // Отображение имени игрока
    displayPlayerName() {
        const name = localStorage.getItem('playerName');
        if (this.elements.playerName) {
            this.elements.playerName.textContent = name || 'Игрок';
        }
    },

    // Инициализация слотов для предложений
    initializeSentenceSlots() {
        // Очищаем слоты
        for (let i = 1; i <= 3; i++) {
            const slotContainer = document.querySelector(`.sentence-slot[data-slot="${i}"] .word-slots`);
            if (slotContainer) {
                slotContainer.innerHTML = '';
                // Убираем лишние классы
                slotContainer.parentElement.classList.remove('correct', 'incorrect');
            }
        }
        
        // Обновляем счетчик
        if (this.elements.completed) {
            this.elements.completed.textContent = this.completedSentences;
        }
        
        // Обновляем состояние кнопок проверки
        this.updateCheckButtonsState();
    },

    // Запуск таймера
    startTimer() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            if (this.elements.timer) {
                this.elements.timer.textContent = this.timeLeft;
            }
            
            if (this.timeLeft <= 30) {
                if (this.elements.timer) {
                    this.elements.timer.style.color = '#ff4444';
                    this.elements.timer.style.fontWeight = 'bold';
                }
            }
            
            if (this.timeLeft <= 0) {
                this.finishLevel();
            }
        }, 1000);
    },

    // Запуск падения слов
    startWordSpawning() {
        this.spawnWord();
        
        this.spawnIntervalId = setInterval(() => {
            if (this.fallingWords.length < this.maxFallingWords) {
                this.spawnWord();
            }
        }, this.spawnInterval);
    },

    // Создание падающего слова
    spawnWord() {
        if (!this.elements.stormArea) return;
        
        // Выбираем случайное слово из пула
        if (this.currentWordsPool.length === 0) return;
        
        const wordIndex = Math.floor(Math.random() * this.currentWordsPool.length);
        const wordText = this.currentWordsPool[wordIndex];
        
        const wordEl = document.createElement('div');
        wordEl.className = 'falling-word';
        wordEl.textContent = wordText;
        wordEl.dataset.word = wordText;
        wordEl.dataset.id = Date.now() + Math.random();
        
        const areaWidth = this.elements.stormArea.clientWidth - 80;
        wordEl.style.left = `${Math.random() * areaWidth}px`;
        wordEl.style.top = '-50px';
        
        this.elements.stormArea.appendChild(wordEl);
        this.makeDraggable(wordEl);
        this.startFalling(wordEl);
        this.fallingWords.push(wordEl);
    },

    // Запуск анимации падения
    startFalling(wordEl, startX = null, startY = null) {
        if (!wordEl || !this.elements.stormArea) return;
        
        let x = startX !== null ? startX : parseFloat(wordEl.style.left);
        let y = startY !== null ? startY : parseFloat(wordEl.style.top);
        const areaHeight = this.elements.stormArea.clientHeight;
        const areaWidth = this.elements.stormArea.clientWidth - wordEl.offsetWidth;
        
        const direction = Math.random() > 0.5 ? 1 : -1;
        let horizontalSpeed = (Math.random() * 2 + 1) * direction;
        const verticalSpeed = 1.5;
        
        const animate = () => {
            if (!wordEl.isConnected || wordEl.classList.contains('dragging')) {
                return;
            }
            
            x += horizontalSpeed;
            y += verticalSpeed;
            
            // Отскок от боковых границ
            if (x <= 0) {
                x = 0;
                horizontalSpeed = Math.abs(horizontalSpeed);
            } else if (x >= areaWidth) {
                x = areaWidth;
                horizontalSpeed = -Math.abs(horizontalSpeed);
            }
            
            if (y >= areaHeight) {
                this.wordMissed(wordEl);
                return;
            }
            
            wordEl.style.left = `${x}px`;
            wordEl.style.top = `${y}px`;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    },

    // Делаем слово перетаскиваемым
    makeDraggable(wordEl) {
        let isDragging = false;
        let offsetX, offsetY;
        
        wordEl.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            
            isDragging = true;
            const rect = wordEl.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            wordEl.classList.add('dragging');
            wordEl._stopFall = true;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            wordEl.style.position = 'fixed';
            wordEl.style.left = `${x}px`;
            wordEl.style.top = `${y}px`;
            wordEl.style.zIndex = '1000';
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            wordEl.classList.remove('dragging');
            wordEl._stopFall = false;
            
            const stormAreaRect = this.elements.stormArea.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            // Проверяем, находится ли курсор внутри stormArea
            const isInsideStormArea = mouseX >= stormAreaRect.left && 
                                     mouseX <= stormAreaRect.right && 
                                     mouseY >= stormAreaRect.top && 
                                     mouseY <= stormAreaRect.bottom;
            
            let droppedOnSlot = false;
            let targetSlotNumber = null;
            
            // Проверяем, попал ли на слот для предложений
            for (let i = 1; i <= 3; i++) {
                const slotElement = document.querySelector(`.sentence-slot[data-slot="${i}"]`);
                if (slotElement) {
                    const rect = slotElement.getBoundingClientRect();
                    if (mouseX >= rect.left && mouseX <= rect.right &&
                        mouseY >= rect.top && mouseY <= rect.bottom) {
                        targetSlotNumber = i;
                        break;
                    }
                }
            }
            
            if (targetSlotNumber !== null) {
                // Проверяем, что слот еще не правильный
                if (!this.sentenceSlotsData[targetSlotNumber].isCorrect) {
                    // Слово из stormArea сбрасывается в слот
                    this.handleWordDropToSlot(wordEl, targetSlotNumber);
                    droppedOnSlot = true;
                }
            }
            
            // Если не попал на слот, но внутри stormArea
            if (!droppedOnSlot && isInsideStormArea) {
                // Помещаем в текущую позицию внутри stormArea
                const relativeX = mouseX - stormAreaRect.left;
                const relativeY = mouseY - stormAreaRect.top;
                this.placeWordInStormArea(wordEl, relativeX, relativeY);
            } 
            // Если вне stormArea и не на слоте - помещаем в центр stormArea
            else if (!droppedOnSlot) {
                this.placeWordInStormArea(wordEl, 
                    this.elements.stormArea.clientWidth / 2, 
                    50);
            }
            
            // Сбрасываем z-index
            setTimeout(() => {
                wordEl.style.zIndex = '';
            }, 100);
            
            // Обновляем состояние кнопок проверки
            this.updateCheckButtonsState();
        });
    },

    // Помещение слова в stormArea
    placeWordInStormArea(wordEl, x, y) {
        wordEl.style.position = 'absolute';
        wordEl.style.left = `${Math.max(0, Math.min(x, this.elements.stormArea.clientWidth - wordEl.offsetWidth))}px`;
        wordEl.style.top = `${Math.max(0, Math.min(y, this.elements.stormArea.clientHeight - wordEl.offsetHeight))}px`;
        
        this.elements.stormArea.appendChild(wordEl);
        
        setTimeout(() => {
            if (wordEl.isConnected && !wordEl._stopFall) {
                const currentX = parseFloat(wordEl.style.left);
                const currentY = parseFloat(wordEl.style.top);
                this.startFalling(wordEl, currentX, currentY);
            }
        }, 100);
    },

    // Обработка сброса слова в слот
    handleWordDropToSlot(wordEl, targetSlotNumber) {
        const wordText = wordEl.textContent;
        const targetSlotData = this.sentenceSlotsData[targetSlotNumber];
        
        // Если целевой слот уже правильный, не принимаем слова
        if (targetSlotData.isCorrect) return;
        
        // Проверяем, является ли слово уже находящимся в каком-либо слоте
        let sourceSlotNumber = null;
        for (let i = 1; i <= 3; i++) {
            if (i !== targetSlotNumber && this.sentenceSlotsData[i].words.includes(wordText)) {
                // Проверяем, есть ли такое же слово в другом слоте
                const slotElement = document.querySelector(`.sentence-slot[data-slot="${i}"]`);
                if (slotElement) {
                    const wordSlots = slotElement.querySelectorAll('.word-slot');
                    for (const slot of wordSlots) {
                        if (slot.textContent === wordText && slot.dataset.originalId === wordEl.dataset.id) {
                            sourceSlotNumber = i;
                            break;
                        }
                    }
                }
                if (sourceSlotNumber) break;
            }
        }
        
        // Если слово уже находится в другом слоте
        if (sourceSlotNumber !== null) {
            // Удаляем слово из исходного слота
            const sourceSlotData = this.sentenceSlotsData[sourceSlotNumber];
            const wordIndex = sourceSlotData.words.indexOf(wordText);
            if (wordIndex !== -1) {
                sourceSlotData.words.splice(wordIndex, 1);
            }
            
            // Удаляем элемент из исходного слота
            const sourceSlotElement = document.querySelector(`.sentence-slot[data-slot="${sourceSlotNumber}"] .word-slots`);
            if (sourceSlotElement) {
                const wordToRemove = sourceSlotElement.querySelector(`.word-slot[data-original-id="${wordEl.dataset.id}"]`);
                if (wordToRemove) {
                    wordToRemove.remove();
                }
            }
            
            // Создаем новый элемент слова для целевого слота
            const wordSlotEl = document.createElement('div');
            wordSlotEl.className = 'word-slot';
            wordSlotEl.textContent = wordText;
            wordSlotEl.dataset.word = wordText;
            wordSlotEl.dataset.originalId = wordEl.dataset.id;
            
            // Добавляем обработчик для перетаскивания из слота
            this.makeSlotWordDraggable(wordSlotEl, targetSlotNumber);
            
            // Добавляем слово в целевой слот
            const targetSlotElement = document.querySelector(`.sentence-slot[data-slot="${targetSlotNumber}"] .word-slots`);
            if (targetSlotElement) {
                targetSlotElement.appendChild(wordSlotEl);
            }
            
            // Добавляем слово в данные целевого слота
            targetSlotData.words.push(wordText);
            
            // Удаляем падающее слово
            this.fallingWords = this.fallingWords.filter(w => w !== wordEl);
            if (wordEl.isConnected) {
                wordEl.remove();
            }
        } else {
            // Слово из stormArea
            // Проверяем, нет ли уже такого слова в целевом слоте
            if (targetSlotData.words.includes(wordText)) {
                // Если слово уже есть, возвращаем его в stormArea
                this.placeWordInStormArea(wordEl, 
                    Math.random() * (this.elements.stormArea.clientWidth - 80), 
                    50);
                return;
            }
            
            // Создаем элемент слова в целевом слоте
            const wordSlotEl = document.createElement('div');
            wordSlotEl.className = 'word-slot';
            wordSlotEl.textContent = wordText;
            wordSlotEl.dataset.word = wordText;
            wordSlotEl.dataset.originalId = wordEl.dataset.id;
            
            // Добавляем обработчик для перетаскивания из слота
            this.makeSlotWordDraggable(wordSlotEl, targetSlotNumber);
            
            // Добавляем слово в целевой слот
            const targetSlotElement = document.querySelector(`.sentence-slot[data-slot="${targetSlotNumber}"] .word-slots`);
            if (targetSlotElement) {
                targetSlotElement.appendChild(wordSlotEl);
            }
            
            // Добавляем слово в данные целевого слота
            targetSlotData.words.push(wordText);
            
            // Удаляем падающее слово
            this.fallingWords = this.fallingWords.filter(w => w !== wordEl);
            if (wordEl.isConnected) {
                wordEl.remove();
            }
        }
        
        // Обновляем состояние кнопок проверки
        this.updateCheckButtonsState();
    },

    // Делаем слово в слоте перетаскиваемым
    makeSlotWordDraggable(wordSlotEl, currentSlotNumber) {
        let isDragging = false;
        let offsetX, offsetY;
        
        wordSlotEl.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            
            isDragging = true;
            const rect = wordSlotEl.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            wordSlotEl.classList.add('dragging');
            wordSlotEl.dataset.sourceSlot = currentSlotNumber;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            wordSlotEl.style.position = 'fixed';
            wordSlotEl.style.left = `${x}px`;
            wordSlotEl.style.top = `${y}px`;
            wordSlotEl.style.zIndex = '1000';
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            wordSlotEl.classList.remove('dragging');
            
            const stormAreaRect = this.elements.stormArea.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            // Проверяем, находится ли курсор внутри stormArea
            const isInsideStormArea = mouseX >= stormAreaRect.left && 
                                     mouseX <= stormAreaRect.right && 
                                     mouseY >= stormAreaRect.top && 
                                     mouseY <= stormAreaRect.bottom;
            
            // Проверяем, попал ли на другой слот для предложений
            let targetSlotNumber = null;
            for (let i = 1; i <= 3; i++) {
                const slotElement = document.querySelector(`.sentence-slot[data-slot="${i}"]`);
                if (slotElement) {
                    const rect = slotElement.getBoundingClientRect();
                    if (mouseX >= rect.left && mouseX <= rect.right &&
                        mouseY >= rect.top && mouseY <= rect.bottom) {
                        targetSlotNumber = i;
                        break;
                    }
                }
            }
            
            const sourceSlotNumber = parseInt(wordSlotEl.dataset.sourceSlot);
            const wordText = wordSlotEl.textContent;
            
            if (targetSlotNumber !== null && targetSlotNumber !== sourceSlotNumber) {
                // Проверяем, что целевой слот не правильный
                if (!this.sentenceSlotsData[targetSlotNumber].isCorrect) {
                    // Перемещаем слово из одного слота в другой
                    this.moveWordBetweenSlots(wordSlotEl, sourceSlotNumber, targetSlotNumber, wordText);
                } else {
                    // Возвращаем на место в исходном слоте
                    wordSlotEl.style.position = '';
                    wordSlotEl.style.left = '';
                    wordSlotEl.style.top = '';
                    wordSlotEl.style.zIndex = '';
                }
            } else if (isInsideStormArea) {
                // Возвращаем слово в stormArea
                this.returnWordToStormArea(wordSlotEl, sourceSlotNumber, mouseX - stormAreaRect.left, mouseY - stormAreaRect.top);
            } else {
                // Возвращаем на место в исходном слоте
                wordSlotEl.style.position = '';
                wordSlotEl.style.left = '';
                wordSlotEl.style.top = '';
                wordSlotEl.style.zIndex = '';
            }
            
            // Удаляем временный атрибут
            delete wordSlotEl.dataset.sourceSlot;
        });
    },

    // Перемещение слова между слотами
    moveWordBetweenSlots(wordSlotEl, sourceSlotNumber, targetSlotNumber, wordText) {
        const sourceSlotData = this.sentenceSlotsData[sourceSlotNumber];
        const targetSlotData = this.sentenceSlotsData[targetSlotNumber];
        
        // Проверяем, нет ли уже такого слова в целевом слоте
        if (targetSlotData.words.includes(wordText)) {
            // Возвращаем слово в исходный слот
            wordSlotEl.style.position = '';
            wordSlotEl.style.left = '';
            wordSlotEl.style.top = '';
            wordSlotEl.style.zIndex = '';
            return;
        }
        
        // Удаляем слово из исходного слота
        const wordIndex = sourceSlotData.words.indexOf(wordText);
        if (wordIndex !== -1) {
            sourceSlotData.words.splice(wordIndex, 1);
        }
        
        // Добавляем слово в целевой слот
        targetSlotData.words.push(wordText);
        
        // Перемещаем элемент в DOM
        const targetSlotElement = document.querySelector(`.sentence-slot[data-slot="${targetSlotNumber}"] .word-slots`);
        if (targetSlotElement) {
            targetSlotElement.appendChild(wordSlotEl);
        }
        
        // Обновляем состояние кнопок проверки
        this.updateCheckButtonsState();
    },

    // Возвращение слова обратно в stormArea
    returnWordToStormArea(wordSlotEl, slotNumber, x, y) {
        const wordText = wordSlotEl.textContent;
        const slotData = this.sentenceSlotsData[slotNumber];
        
        // Удаляем слово из данных слота
        const wordIndex = slotData.words.indexOf(wordText);
        if (wordIndex !== -1) {
            slotData.words.splice(wordIndex, 1);
        }
        
        // Удаляем элемент из слота
        if (wordSlotEl.parentNode) {
            wordSlotEl.remove();
        }
        
        // Создаем новое падающее слово
        const wordEl = document.createElement('div');
        wordEl.className = 'falling-word';
        wordEl.textContent = wordText;
        wordEl.dataset.word = wordText;
        wordEl.dataset.id = Date.now() + Math.random();
        
        this.elements.stormArea.appendChild(wordEl);
        this.makeDraggable(wordEl);
        this.placeWordInStormArea(wordEl, x, y);
        this.fallingWords.push(wordEl);
        
        // Обновляем состояние кнопок проверки
        this.updateCheckButtonsState();
    },

    // Обновление состояния кнопок проверки
    updateCheckButtonsState() {
        for (let i = 1; i <= 3; i++) {
            const slotData = this.sentenceSlotsData[i];
            const button = document.querySelector(`.slot-check-button[data-slot="${i}"]`);
            
            if (button) {
                // Кнопка активна, если в слоте есть слова и слот еще не правильный
                button.disabled = slotData.words.length === 0 || slotData.isCorrect;
            }
        }
    },

    // Проверка одного предложения
    checkSingleSentence(slotNumber) {
        const slotData = this.sentenceSlotsData[slotNumber];
        const slotElement = document.querySelector(`.sentence-slot[data-slot="${slotNumber}"]`);
        const button = document.querySelector(`.slot-check-button[data-slot="${slotNumber}"]`);
        
        // Если слот уже правильный, ничего не делаем
        if (slotData.isCorrect) return;
        
        // Если слот пустой, ничего не происходит (кнопка должна быть disabled)
        if (slotData.words.length === 0) return;
        
        // Формируем предложение из слов в слоте
        const userSentence = slotData.words.join(' ');
        
        console.log('Проверяемое предложение:', userSentence);
        console.log('Выбранные предложения:', this.selectedSentences);
        
        // Проверяем, является ли это любым предложением из всего пула (10 предложений)
        const isCorrect = this.sentencesPool.includes(userSentence);
        
        console.log('Результат проверки:', isCorrect);
        
        if (isCorrect) {
            // Правильное предложение
            slotData.isCorrect = true;
            slotData.completedSentence = userSentence;
            this.completedSentences++;
            
            if (slotElement) {
                slotElement.classList.add('correct');
                slotElement.classList.remove('incorrect');
            }
            
            // Отключаем кнопку проверки для этого слота
            if (button) {
                button.disabled = true;
            }
            
            // Добавляем очки
            const baseScore = 50;
            this.score += Math.round(baseScore * this.scoreMultiplier);
            
            // Обновляем слот для отображения готового предложения
            this.updateCompletedSlot(slotNumber);
            
            // Показываем сообщение
            this.showFeedback(true, `Предложение собрано правильно!`);
            
            // Проверяем, все ли предложения собраны
            if (this.completedSentences >= this.totalSentences) {
                setTimeout(() => {
                    this.finishLevel(true);
                }, 1500);
            }
        } else {
            // Неправильное предложение
            if (slotElement) {
                slotElement.classList.add('incorrect');
                setTimeout(() => {
                    slotElement.classList.remove('incorrect');
                }, 2000);
            }
            
            // Штраф
            const penalty = 10;
            this.score = Math.max(0, this.score - Math.round(penalty * this.scoreMultiplier));
            
            // Ошибка
            this.mistakes++;
            
            // Показываем сообщение
            this.showFeedback(false, `Это не правильное предложение!`);
            
            // Проверяем, не превышен ли лимит ошибок
            if (this.mistakes >= this.maxMistakes) {
                setTimeout(async () => {
                    await this.showModal(
                        'Слишком много ошибок!',
                        `Вы совершили ${this.mistakes} ошибок из допустимых ${this.maxMistakes}.`
                    );
                    this.finishLevel();
                }, 2000);
                return;
            }
        }
        
        // Обновляем статистику
        this.updateStats();
        
        // Обновляем состояние кнопок проверки
        this.updateCheckButtonsState();
    },

    // Обновление завершенного слота
    updateCompletedSlot(slotNumber) {
        const slotContainer = document.querySelector(`.sentence-slot[data-slot="${slotNumber}"]`);
        if (!slotContainer) return;
        
        const completedSentence = this.sentenceSlotsData[slotNumber].completedSentence;
        if (completedSentence) {
            const wordSlotsContainer = slotContainer.querySelector('.word-slots');
            if (wordSlotsContainer) {
                wordSlotsContainer.innerHTML = `<div class="completed-sentence">${completedSentence}</div>`;
            }
        }
        
        // Обновляем счетчик
        if (this.elements.completed) {
            this.elements.completed.textContent = this.completedSentences;
        }
    },

    // Пропуск слова (достигло нижней границы)
    wordMissed(wordEl) {
        this.fallingWords = this.fallingWords.filter(w => w !== wordEl);
        if (wordEl.isConnected) {
            wordEl.remove();
        }
    },

    // Показать обратную связь
    showFeedback(isCorrect, message) {
        if (!this.elements.feedback) return;
        
        this.elements.feedback.innerHTML = '';
        this.elements.feedback.className = 'feedback';
        
        if (isCorrect) {
            this.elements.feedback.classList.add('correct');
            this.elements.feedback.innerHTML = `
                <div>
                    <span style="font-size: 24px; margin-right: 10px;">✓</span>
                    <strong>${message}</strong>
                </div>
            `;
        } else {
            this.elements.feedback.classList.add('incorrect');
            this.elements.feedback.innerHTML = `
                <div>
                    <span style="font-size: 24px; margin-right: 10px;">✗</span>
                    <strong>${message}</strong>
                </div>
            `;
        }
        
        // Через 3 секунды очищаем
        setTimeout(() => {
            this.elements.feedback.innerHTML = '';
            this.elements.feedback.className = 'feedback';
        }, 3000);
    },

    // Обновление статистики
    updateStats() {
        if (this.elements.score) {
            this.elements.score.textContent = this.score;
        }
        
        if (this.elements.mistakes) {
            this.elements.mistakes.textContent = `${this.mistakes}/${this.maxMistakes}`;
        }
        
        // Визуальная индикация ошибок
        if (this.elements.mistakes) {
            if (this.mistakes >= this.maxMistakes - 1) {
                this.elements.mistakes.style.color = '#ff4444';
                this.elements.mistakes.style.fontWeight = 'bold';
            } else if (this.mistakes > 0) {
                this.elements.mistakes.style.color = '#ffaa00';
            } else {
                this.elements.mistakes.style.color = '';
                this.elements.mistakes.style.fontWeight = '';
            }
        }
    },

    // Завершение уровня
    finishLevel(success = false) {
        document.getElementById('customModal').style.display = 'none';
        clearInterval(this.timer);
        
        // Останавливаем спавн слов
        if (this.spawnIntervalId) {
            clearInterval(this.spawnIntervalId);
        }
        
        // Останавливаем все падающие слова
        this.fallingWords.forEach(word => {
            if (word.isConnected) {
                word.remove();
            }
        });
        this.fallingWords = [];
        
        // Сохраняем результат
        saveLevelResult(3, this.score);
        
        // Показываем результат
        this.showResult(success);
    },

    // Показ результата
    showResult(success) {
        const difficultyInfo = this.getDifficultyName();
        const difficultySettings = this.loadDifficultySettings();
        const timeSpent = difficultySettings.time - this.timeLeft;

        if (success) {
            showVictoryAnimation(3);
        }
        
        const resultHTML = `
            <div class="result-overlay">
                <div class="result-modal">
                    <h2>Уровень 3 ${success ? 'пройден' : 'не пройден'}!</h2>
                    <div class="result-details">
                        <p>Сложность: <strong>${difficultyInfo.name} ${difficultyInfo.icon}</strong></p>
                        <p>Набрано очков: <strong>${this.score}</strong></p>
                        <p>Собрано предложений: <strong>${this.completedSentences} из ${this.totalSentences}</strong></p>
                        <p>Ошибок (неправильные предложения): <strong>${this.mistakes}/${this.maxMistakes}</strong></p>
                        <p>Время: <strong>${timeSpent} сек.</strong></p>
                        <p>Множитель очков: <strong>${this.scoreMultiplier}×</strong></p>
                    </div>
                    <div class="result-score">
                        Итоговый счет: <span class="score-value">${this.score}</span>
                    </div>
                    <div class="result-buttons">
                        <button onclick="window.location.href='../levels.html'">Выбор уровня</button>
                        <button onclick="window.location.href='select-mode.html'">Сменить сложность</button>
                        <button onclick="window.location.reload()">Играть снова</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', resultHTML);
    }
  };
  
  window.addEventListener('DOMContentLoaded', async () => {
    try {
        await Level3New.init();
    } catch (error) {
        console.error('Ошибка инициализации игры:', error);
    }
  });