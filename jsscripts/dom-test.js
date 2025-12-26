
const QUESTIONS = [
  {
    q: "Если человека назвали мордофиля, то это…",
    options: [
      {text: "Значит, что он тщеславный.", correct: true, explain: "В Этимологическом словаре Фасмера 'мордофиля' означает чванливого, тщеславного человека."},
      {text: "Значит, что у него лицо как у хряка.", correct: false, explain: ""},
      {text: "Значит, что чумазый.", correct: false, explain: ""}
    ]
  },
  {
    q: "«Да этот Ярополк — фуфлыга!» Что не так с Ярополком?",
    options: [
      {text: "Он маленький и невзрачный.", correct: true, explain: "Словарь Даля: 'фуфлыга' — невзрачный, малорослый человек."},
      {text: "Он тот еще алкоголик.", correct: false, explain: ""},
      {text: "Он не держит свое слово.", correct: false, explain: ""}
    ]
  },
  {
    q: "Если человека прозвали пятигузом, значит, он…",
    options: [
      {text: "Не держит слово.", correct: true, explain: "По Фасмеру 'пятигуз' — ненадежный, непостоянный человек."},
      {text: "Изменяет жене", correct: false, explain: ""},
      {text: "Без гроша в кармане.", correct: false, explain: ""}
    ]
  },
  {
    q: "Кто такой шлындра?",
    options: [
      {text: "Обманщик.", correct: false, explain: ""},
      {text: "Нытик.", correct: false, explain: ""},
      {text: "Бродяга.", correct: true, explain: "В сленге 'шлындрать' — шляться, бездельничать; 'шлындра' — бродяга."}
    ]
  }
];

// Это как раз перетряска элементов
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const wrap = document.getElementById('questions-wrap');
const statusArea = document.getElementById('status-area');
const resultsBox = document.getElementById('results');

let state = {
  questions: [],
  currentProcessing: false,
  answeredCount: 0,
  correctCount: 0,
  visibleIndex: 0 // индекс текущего вопроса, чтобы знать, что перезатенять
};

// инициализация списка вопросов
function init() {
  state.questions = shuffle(QUESTIONS.map((item, idx) => ({
    id: idx,
    q: item.q,
    options: shuffle(item.options.map(o => Object.assign({}, o))),
    answered: false,
    chosenIndex: null,
    correct: null,
    revealed: false
  })));

  state.currentProcessing = false;
  state.answeredCount = 0;
  state.correctCount = 0;
  state.visibleIndex = 0;

  renderAll();
  statusArea.textContent = `Вопросов: ${state.questions.length}`;
  resultsBox.hidden = true;
  resultsBox.innerHTML = '';
}

function renderAll() {
  wrap.innerHTML = '';

  state.questions.forEach((qs, idx) => {
    const card = document.createElement('article');
    card.className = 'question-card';
    card.dataset.qid = qs.id;

    // header
    const header = document.createElement('div'); header.className = 'q-header';
    const num = document.createElement('div'); num.className = 'q-number'; num.textContent = (idx + 1) + '.';
    const marker = document.createElement('div'); marker.className = 'q-marker'; marker.setAttribute('aria-hidden','true');
    header.appendChild(num); header.appendChild(marker);

    // row (left question, right answers)
    const row = document.createElement('div'); row.className = 'question-row';
    const qLeft = document.createElement('div'); qLeft.className = 'q-left';
    const qText = document.createElement('div'); qText.className = 'q-text'; qText.textContent = qs.q;
    qLeft.appendChild(qText);

    const qRight = document.createElement('div'); qRight.className = 'q-right';
    const MAX_SLOTS = 4;
    for (let s = 0; s < MAX_SLOTS; s++) {
      const slot = document.createElement('div');
      if (s < qs.options.length) {
        const opt = qs.options[s];
        slot.className = 'answer';
        slot.tabIndex = 0;
        slot.role = 'button';
        slot.dataset.optIndex = s;
        slot.textContent = opt.text;
        slot.addEventListener('click', () => onAnswerClick(qs, slot, opt, s));
        slot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); slot.click(); } });
      } else {
        slot.className = 'answer placeholder';
        slot.setAttribute('aria-hidden','true');
      }
      qRight.appendChild(slot);
    }

    const explanation = document.createElement('div'); explanation.className = 'explanation'; explanation.setAttribute('aria-hidden','true');

    row.appendChild(qLeft);
    row.appendChild(qRight);

    card.appendChild(header);
    card.appendChild(row);
    card.appendChild(explanation);

    if (idx > state.visibleIndex) {
      card.classList.add('hidden-card'); //
    }

    // просмотр правильного ответа в конце
    card.addEventListener('click', () => {
      if (state.answeredCount === state.questions.length && !qs.revealed) {
        revealCorrectForQuestion(card, qs);
        qs.revealed = true;
      }
    });

    wrap.appendChild(card);
  });
}


function onAnswerClick(qs, answerElem, opt, optIndex) {
  if (state.currentProcessing || qs.answered) return;
  state.currentProcessing = true;

  // визуальная тряска
  answerElem.classList.add('shake');
  setTimeout(() => answerElem.classList.remove('shake'), 360);

  const card = answerElem.closest('.question-card');
  const qRight = card.querySelector('.q-right');
  const answerSlots = card.querySelectorAll('.answer');

  // деактивировать слот с ответами
  answerSlots.forEach(a => {
    a.classList.add('disabled');
    a.tabIndex = -1;
  });

  // запись для статистики
  qs.chosenIndex = optIndex;
  qs.correct = !!opt.correct;
  qs.answered = true;
  if (opt.correct) state.correctCount++;
  state.answeredCount++;

  const cardRect = card.getBoundingClientRect();
  card.style.minHeight = `${cardRect.height}px`;

  // как раз скольжение элементов вниз (не полностью и с затемнением)
  setTimeout(() => {
    qRight.classList.add('slide-down-inside');
  }, 520);

  // Разблокировка следующего вопроса 
  setTimeout(() => {
    qRight.style.display = 'none';

    const headerMarker = card.querySelector('.q-marker');
    headerMarker.classList.add('visible');
    if (qs.correct) {
      headerMarker.style.background = '#e8f9ef';
      headerMarker.style.color = '#2aa673';
      headerMarker.textContent = '✓';
    } else {
      headerMarker.style.background = '#ffecec';
      headerMarker.style.color = '#c0392b';
      headerMarker.textContent = '✕';
    }

    // если следующий вопрос существует, переключаем их
    if (state.visibleIndex < state.questions.length - 1) {
      state.visibleIndex++;
      const nextCard = wrap.querySelectorAll('.question-card')[state.visibleIndex];
      if (nextCard) nextCard.classList.remove('hidden-card');
    }

    // обновляем статистику, чтобы потом показать
    statusArea.textContent = `Ответов: ${state.answeredCount} из ${state.questions.length}`;


    setTimeout(() => {
      card.style.minHeight = '';
    }, 300);

    state.currentProcessing = false;

    if (state.answeredCount === state.questions.length) {
      showFinished();
    }
  }, 1100);
}

function showFinished() {
  const existingMsg = document.querySelector('.finished-message');
  if (existingMsg) existingMsg.remove();

  const finishedMsg = document.createElement('div');
  finishedMsg.className = 'finished-message';
  finishedMsg.textContent = 'Вопросы закончились';
  finishedMsg.style.fontWeight = '700';
  finishedMsg.style.marginBottom = '0.6rem';
  wrap.parentNode.insertBefore(finishedMsg, wrap);

  resultsBox.hidden = false;
  resultsBox.innerHTML = `
    <div class="big">Статистика</div>
    <div>Правильных ответов: <strong>${state.correctCount}</strong> из <strong>${state.questions.length}</strong></div>
    <div style="margin-top:0.6rem">Нажмите на любой вопрос, чтобы увидеть правильный ответ и пояснение (по одному разу).</div>
  `;

  const restartBtn = document.createElement('button');
  restartBtn.className = 'restart-btn';
  restartBtn.type = 'button';
  restartBtn.textContent = '🔁 Пройти тест снова';
  restartBtn.addEventListener('click', restartTest);
  resultsBox.appendChild(restartBtn);

  resultsBox.scrollIntoView({behavior: 'smooth'});
  console.log(QUESTIONS);
}

function revealCorrectForQuestion(card, qobj) {
  // hide other reveals
  document.querySelectorAll('.question-card').forEach(c => {
    if (c === card) return;
    const panel = c.querySelector('.reveal-panel');
    if (panel) panel.remove();
    c.querySelectorAll('.answer').forEach(a => a.classList.remove('revealed-correct', 'revealed-chosen'));
    const otherId = Number(c.dataset.qid);
    const otherQ = state.questions.find(s => s.id === otherId);
    if (otherQ) otherQ.revealed = false;
  });

  // build reveal panel
  const existingPanel = card.querySelector('.reveal-panel');
  if (existingPanel) existingPanel.remove();

  const correctOpt = qobj.options.find(o => o.correct) || null;
  const panel = document.createElement('div');
  panel.className = 'reveal-panel';

  const correctBlock = document.createElement('div');
  correctBlock.className = 'reveal-answer revealed-correct';
  correctBlock.innerHTML = `<strong>Правильный ответ:</strong><div class="reveal-text">${correctOpt ? correctOpt.text : ''}</div>`;
  panel.appendChild(correctBlock);

  if (typeof qobj.chosenIndex === 'number') {
    const chosen = qobj.options[qobj.chosenIndex];
    const chosenBlock = document.createElement('div');
    chosenBlock.className = 'reveal-answer revealed-chosen';
    chosenBlock.innerHTML = `<strong>Ваш выбор:</strong><div class="reveal-text">${chosen ? chosen.text : ''}</div>`;
    panel.appendChild(chosenBlock);
  }

  const expl = document.createElement('div');
  expl.className = 'reveal-explain';
  expl.innerHTML = (correctOpt && correctOpt.explain) ? correctOpt.explain : '';
  panel.appendChild(expl);

  card.appendChild(panel);
  panel.scrollIntoView({behavior:'smooth', block:'center'});

  qobj.revealed = true;
}

function restartTest() {
  const fm = document.querySelector('.finished-message');
  if (fm) fm.remove();
  resultsBox.hidden = true;
  resultsBox.innerHTML = '';

  // reset cards (show q-right back, remove classes)
  document.querySelectorAll('.question-card').forEach(c => {
    const qRight = c.querySelector('.q-right');
    if (qRight) {
      qRight.style.display = '';
      qRight.classList.remove('slide-down-inside');
      qRight.style.opacity = '';
      qRight.style.transform = '';
      qRight.style.height = '';
      qRight.style.transition = '';
    }
    const panel = c.querySelector('.reveal-panel');
    if (panel) panel.remove();
    const marker = c.querySelector('.q-marker');
    if (marker) {
      marker.classList.remove('visible');
      marker.style.background = '';
      marker.style.color = '';
      marker.textContent = '';
    }
    c.querySelectorAll('.answer').forEach(a => {
      a.classList.remove('disabled','shake','correct','incorrect','revealed-correct','revealed-chosen');
      a.tabIndex = 0;
    });
    c.classList.remove('hidden-card');
    c.style.minHeight = '';
  });

  init();
}

document.addEventListener('DOMContentLoaded', init);
