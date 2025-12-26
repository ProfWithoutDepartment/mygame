// game/common.js - Общие функции для игры

// Функция для получения уникального ключа для текущего игрока
function getPlayerKey(key) {
  const playerName = localStorage.getItem('playerName');
  if (!playerName) return key;
  return `${playerName}_${key}`;
}

function saveLevelResult(levelNumber, score) {
  const playerName = localStorage.getItem('playerName');
  if (!playerName) return;
  
  // Сохраняем рейтинг
  let rating = JSON.parse(localStorage.getItem('gameRating')) || [];
  let player = rating.find(p => p.name === playerName);
  if (!player) {
      player = { name: playerName, level1: 0, level2: 0, level3: 0, total: 0 };
      rating.push(player);
  }
  player[`level${levelNumber}`] = score;
  player.total = player.level1 + player.level2 + player.level3;
  localStorage.setItem('gameRating', JSON.stringify(rating));
  
  // Отмечаем уровень как пройденный для текущего игрока
  const passedLevelsKey = getPlayerKey('passedLevels');
  let passedLevels = JSON.parse(localStorage.getItem(passedLevelsKey)) || [false, false, false];
  passedLevels[levelNumber - 1] = true;
  localStorage.setItem(passedLevelsKey, JSON.stringify(passedLevels));
}

// Проверка, пройден ли уровень для текущего игрока
function isLevelPassed(levelNumber) {
  const passedLevelsKey = getPlayerKey('passedLevels');
  const passedLevels = JSON.parse(localStorage.getItem(passedLevelsKey)) || [false, false, false];
  return passedLevels[levelNumber - 1] || false;
}

function showVictoryAnimation(levelNumber) {
  // Создаем или получаем контейнер для анимации
  let victoryOverlay = document.getElementById('victoryOverlay');
  if (!victoryOverlay) {
      victoryOverlay = document.createElement('div');
      victoryOverlay.id = 'victoryOverlay';
      victoryOverlay.className = 'victory-overlay';
      document.body.appendChild(victoryOverlay);
  }

  // Создаем или обновляем текст с номером уровня
  let victoryText = document.getElementById('victoryText');
  if (!victoryText) {
      victoryText = document.createElement('div');
      victoryText.id = 'victoryText';
      victoryText.className = 'victory-text bounce-animation';
      victoryOverlay.appendChild(victoryText);
  }
  
  victoryText.textContent = `Уровень ${levelNumber} пройден!`;

  // Показываем контейнер с анимацией
  victoryOverlay.style.display = 'flex';

  // Запускаем эффект конфетти с помощью библиотеки [Используем canvas-confetti]
  // Делаем несколько выстрелов для большего эффекта
  const duration = 3 * 1000; // 3 секунды
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2501 };

  // Функция для случайного выстрела конфетти
  function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
          return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Выстрел слева
      confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      
      // Выстрел справа
      confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
  }, 250);

  // Через 4 секунды автоматически скрываем анимацию
  setTimeout(() => {
      victoryOverlay.style.display = 'none';
  }, 4000);
}

// Проверка, доступен ли уровень для текущего игрока
function isLevelAvailable(levelNumber) {
  if (levelNumber === 1) return true; // Первый уровень всегда доступен
  
  const passedLevelsKey = getPlayerKey('passedLevels');
  const passedLevels = JSON.parse(localStorage.getItem(passedLevelsKey)) || [false, false, false];
  
  // Проверяем, пройден ли предыдущий уровень
  return passedLevels[levelNumber - 2] || false;
}

// Проверка доступа к уровню с редиректом
// Проверка доступа к уровню с редиректом
async function checkLevelAccess(levelNumber) {
  const playerName = localStorage.getItem('playerName');
  if (playerName && playerName.toLowerCase() === 'creator') {
    console.log('Чит активирован: creator mode');
    return true; // Пропускаем все проверки доступа
  }

  if (!isLevelAvailable(levelNumber)) {
      await showCommonModal(
          'Доступ запрещен',
          'Сначала пройдите предыдущий уровень!',
          false, // Это не confirm окно
          '../levels.html' // URL для редиректа
      );
      return false;
  }
  return true;
}

function goToNextLevel(currentLevel) {
  if (currentLevel < 3) {
      window.location.href = `../level${currentLevel + 1}/select-mode.html`;
  } else {
      window.location.href = '../levels.html';
  }
}

function saveLevelTime(levelNumber, timeSpent) {
  const playerName = localStorage.getItem('playerName');
  if (!playerName) return;
  
  const levelTimesKey = getPlayerKey('levelTimes');
  let levelTimes = JSON.parse(localStorage.getItem(levelTimesKey)) || {};
  levelTimes[`level${levelNumber}`] = timeSpent;
  localStorage.setItem(levelTimesKey, JSON.stringify(levelTimes));
}

// Уровни сложности для всех уровней
const DifficultyManager = {
  // Сохраняем выбранную сложность для уровня
  saveDifficulty(level, difficulty) {
      const difficultyKey = getPlayerKey(`level${level}Difficulty`);
      localStorage.setItem(difficultyKey, difficulty);
  },
  
  // Получаем сложность для уровня (по умолчанию 'easy')
  getDifficulty(level) {
      const difficultyKey = getPlayerKey(`level${level}Difficulty`);
      return localStorage.getItem(difficultyKey) || 'easy';
  },
  
  // Получаем настройки для уровня и сложности
  getSettings(level, difficulty) {
      const baseSettings = {
          time: 120,
          mistakes: 5,
          scoreMultiplier: 1.0
      };
      
      const settings = {
          1: {
              easy: { time: 120, mistakes: 5, scoreMultiplier: 1.0 },
              medium: { time: 90, mistakes: 3, scoreMultiplier: 2.0 },
              hard: { time: 60, mistakes: 1, scoreMultiplier: 3.0 }
          },
          2: {
              easy: { time: 120, mistakes: 5, scoreMultiplier: 1.0 },
              medium: { time: 90, mistakes: 3, scoreMultiplier: 2.0 },
              hard: { time: 60, mistakes: 1, scoreMultiplier: 3.0 }
          },
          3: {
              easy: { time: 120, mistakes: 5, scoreMultiplier: 1.0 },
              medium: { time: 90, mistakes: 3, scoreMultiplier: 2.0 },
              hard: { time: 60, mistakes: 1, scoreMultiplier: 3.0 }
          }
      };
      
      return settings[level]?.[difficulty] || baseSettings;
  },
  
  getDifficultyDescription(difficulty) {
      const descriptions = {
          easy: { name: "Простой", icon: "😊" },
          medium: { name: "Средний", icon: "😐" },
          hard: { name: "Сложный", icon: "😰" }
      };
      return descriptions[difficulty] || descriptions.easy;
  }
};

// Функция для возврата на главную страницу сайта
function goToSiteHome() {
  window.location.href = '../../index.html';
}

// Функция для возврата на страницу игры на сайте
function goToGameHome() {
  window.location.href = '../../game-index.html';
}

// Инициализация игры при загрузке страницы
function initGame() {
  // Проверяем, авторизован ли пользователь
  const playerName = localStorage.getItem('playerName');
  if (!playerName && !window.location.pathname.includes('index.html')) {
    window.location.href = 'game-index.html';
  }
  
  // Обновляем имя игрока на странице, если элемент существует
  const playerNameEl = document.getElementById('playerName');
  if (playerNameEl) {
    playerNameEl.textContent = playerName || 'Игрок';
  }
}

// Функция для показа модального окна (общая для всех уровней)
function showCommonModal(title, message, isConfirm = false, redirectUrl = null) {
  return new Promise((resolve) => {
      // Создаем элементы модального окна, если их нет
      let modal = document.getElementById('commonModal');
      if (!modal) {
          modal = document.createElement('div');
          modal.id = 'commonModal';
          modal.className = 'modal-overlay';
          modal.innerHTML = `
              <div class="modal-content">
                  <h3 class="modal-title" id="commonModalTitle">${title}</h3>
                  <p class="modal-message" id="commonModalMessage">${message}</p>
                  <div class="modal-buttons">
                      <button class="modal-button modal-button-primary" id="commonModalOkButton">OK</button>
                      <button class="modal-button modal-button-secondary" id="commonModalCancelButton" style="display: none;">Отмена</button>
                  </div>
              </div>
          `;
          document.body.appendChild(modal);
      } else {
          document.getElementById('commonModalTitle').textContent = title;
          document.getElementById('commonModalMessage').textContent = message;
      }
      
      const okButton = document.getElementById('commonModalOkButton');
      const cancelButton = document.getElementById('commonModalCancelButton');
      
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
          if (redirectUrl) {
              window.location.href = redirectUrl;
          }
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

let winKeySequence = []; // Массив для хранения последних нажатых клавиш

// Функция для проверки последовательности
function checkWinSequence(key) {
  // Добавляем нажатую клавишу (в нижнем регистре)
  winKeySequence.push(key.toLowerCase());
  
  // Оставляем только последние 3 нажатия
  if (winKeySequence.length > 3) {
    winKeySequence.shift();
  }
  
  // Проверяем, равна ли последовательность ['w', 'i', 'n']
  if (winKeySequence.length === 3 && 
      winKeySequence[0] === 'w' && 
      winKeySequence[1] === 'i' && 
      winKeySequence[2] === 'n') {
    winKeySequence = [];
    return true;
  }
  return false;
}

document.addEventListener('keydown', function(event) {
  if (checkWinSequence(event.key)) {
    console.log('Чит-код WIN активирован!');
    if (typeof window.activateWinCheat === 'function') {
      window.activateWinCheat();
    }
  }
});