/* ============== STATE (in-memory only, resets on reload) ============== */
const state = {
  users: [],            // {nickname, password}
  currentUser: null,    // nickname string
  authMode: 'register',
  selectedMoodKey: null,
  moodPhoto: null,
  moods: [],             // {id, key, label, emoji, comment, photo, author, ts}
  dateFilter: 'all',
  letterTab: 'scheduled',
  letters: [],            // {id, title, text, unlockAt, author, opened}
  currentView: 'home',
};

const MOODS = [
  { key: 'happy', label: 'Счастье', emoji: '😊', bg: '#f7e6c9', fg: '#a9791f' },
  { key: 'calm', label: 'Спокойствие', emoji: '🌿', bg: '#dcecdf', fg: '#4c8a5c' },
  { key: 'love', label: 'Влюблённость', emoji: '💗', bg: '#f6d9e0', fg: '#c15c78' },
  { key: 'sad', label: 'Грусть', emoji: '😔', bg: '#dde0f3', fg: '#6a71c4' },
  { key: 'tilt', label: 'Тильт без причины', emoji: '😣', bg: '#f6d3d9', fg: '#c15464' },
  { key: 'fight', label: 'Поругались с кем-то', emoji: '😠', bg: '#f3cdd2', fg: '#b6414f' },
  { key: 'anxious', label: 'Тревога', emoji: '🌧', bg: '#dbe7f2', fg: '#4f7ea3' },
  { key: 'tired', label: 'Усталость', emoji: '🔋', bg: '#dbeee7', fg: '#3f9179' },
  { key: 'lonely', label: 'Одиночество', emoji: '🫥', bg: '#e3e0e6', fg: '#7a6d86' },
  { key: 'joy', label: 'Радость', emoji: '☀️', bg: '#f6ecc9', fg: '#b6941c' },
  { key: 'angry', label: 'Злость', emoji: '😡', bg: '#f5d0cf', fg: '#c04a41' },
  { key: 'other', label: 'Другое', emoji: '➕', bg: '#eee9e4', fg: '#8c7a72' },
];

const DATE_IDEAS = [
  { text: 'Устроить вечер кино дома с вкусняшками', place: 'Дома', tag: 'Спокойный', cat: 'home' },
  { text: 'Прогулка по любимым местам в городе', place: 'На улице', tag: 'Романтичный', cat: 'outside' },
  { text: 'Совместно приготовить что-нибудь новое', place: 'Дома', tag: 'Творческий', cat: 'home' },
  { text: 'Сходить в библиотеку или книжный магазин', place: 'На улице', tag: 'Спокойный', cat: 'outside' },
  { text: 'Поиграть в настольную игру', place: 'Дома', tag: 'Активный', cat: 'active' },
  { text: 'Устроить пикник в парке', place: 'На улице', tag: 'Активный', cat: 'active' },
  { text: 'Собрать плейлист друг для друга', place: 'Дома', tag: 'Творческий', cat: 'home' },
  { text: 'Погулять на закате без телефонов', place: 'На улице', tag: 'Романтичный', cat: 'outside' },
  { text: 'Устроить кухню другой страны у себя дома', place: 'Дома', tag: 'Творческий', cat: 'home' },
  { text: 'Покататься на велосипедах', place: 'На улице', tag: 'Активный', cat: 'active' },
  { text: 'Написать друг другу письма о планах на год', place: 'Дома', tag: 'Спокойный', cat: 'home' },
  { text: 'Устроить фотопрогулку по незнакомому району', place: 'На улице', tag: 'Активный', cat: 'outside' },
];

const DATE_FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'home', label: 'Дома' },
  { key: 'outside', label: 'На улице' },
  { key: 'active', label: 'Активные' },
];

let idCounter = 1;
const nextId = () => idCounter++;

/* ============== HELPERS ============== */
function initials(name) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}
function timeAgo(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
function fmtDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s ?? '';
  return div.innerHTML;
}
function plural(n, one, few, many) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return few;
  return many;
}

/* ============== NAVIGATION ============== */
function goToSplash() {
  show('screen-splash'); hide('screen-auth'); hide('screen-app');
}
function goToAuth(mode) {
  state.authMode = mode;
  hide('screen-splash'); hide('screen-app'); show('screen-auth');
  renderAuth();
}
function switchAuthMode() {
  state.authMode = state.authMode === 'login' ? 'register' : 'login';
  renderAuth();
}
function renderAuth() {
  const isLogin = state.authMode === 'login';
  document.getElementById('auth-title').textContent = isLogin ? 'Вход' : 'Создать аккаунт';
  document.getElementById('auth-sub').textContent = isLogin
    ? 'Чтобы продолжить, войдите в свой аккаунт'
    : 'Придумайте свой ник — так вас будет видеть партнёр';
  document.getElementById('reg-only').classList.toggle('hidden', isLogin);
  document.getElementById('login-only').classList.toggle('hidden', !isLogin);
  document.getElementById('auth-submit-btn').textContent = isLogin ? 'Войти' : 'Создать аккаунт';
  document.getElementById('auth-switch-btn').textContent = isLogin ? 'Создать аккаунт' : 'У меня уже есть аккаунт';
  document.getElementById('auth-error').classList.add('hidden');
}
function togglePw() {
  const f = document.getElementById('auth-password');
  f.type = f.type === 'password' ? 'text' : 'password';
}
function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function handleAuthSubmit(e) {
  e.preventDefault();
  const password = document.getElementById('auth-password').value;
  if (state.authMode === 'register') {
    const nickname = document.getElementById('reg-nickname').value.trim();
    if (!nickname) { showAuthError('Введите свой ник'); return false; }
    if (!password) { showAuthError('Придумайте пароль'); return false; }
    if (state.users.find(u => u.nickname.toLowerCase() === nickname.toLowerCase())) {
      showAuthError('Такой ник уже занят в этой паре'); return false;
    }
    if (state.users.length >= 2) {
      showAuthError('В этом пространстве уже двое — для двоих ♡'); return false;
    }
    state.users.push({ nickname, password });
    loginAs(nickname);
  } else {
    const nickname = document.getElementById('login-nickname').value.trim();
    const user = state.users.find(u => u.nickname.toLowerCase() === nickname.toLowerCase() && u.password === password);
    if (!user) { showAuthError('Неверный ник или пароль'); return false; }
    loginAs(user.nickname);
  }
  return false;
}
function loginAs(nickname) {
  state.currentUser = nickname;
  hide('screen-splash'); hide('screen-auth'); show('screen-app');
  document.getElementById('auth-form').reset();
  setView('home');
  renderAll();
}
function logout() {
  state.currentUser = null;
  goToSplash();
}
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

function setView(view) {
  state.currentView = view;
  ['home', 'emotions', 'dates', 'messages', 'profile'].forEach(v => {
    document.getElementById('view-' + v).classList.toggle('hidden', v !== view);
  });
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === view);
  });
  renderAll();
}

/* ============== RENDER: HOME ============== */
function renderHome() {
  document.getElementById('avatar-pair').innerHTML = state.users.map(u =>
    `<div class="w-8 h-8 rounded-full bg-[#e6d6da] border-2 border-[#f6f3f0] flex items-center justify-center text-[11px] font-extrabold text-[#8c7a72]">${escapeHtml(initials(u.nickname))}</div>`
  ).join('');

  const hour = new Date().getHours();
  const greetWord = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  document.getElementById('home-greeting').textContent = `${greetWord}, ${state.currentUser} ♡`;

  const todays = state.moods.filter(m => new Date(m.ts).toDateString() === new Date().toDateString());
  document.getElementById('home-substatus').textContent = todays.length
    ? `Сегодня уже ${todays.length} ${plural(todays.length, 'запись', 'записи', 'записей')} об эмоциях. Последняя — «${todays[todays.length - 1].label}».`
    : 'Сегодня ещё не было ни одной записи об эмоциях.';

  const recent = [...state.moods].slice(-4).reverse();
  document.getElementById('home-recent-emotions').innerHTML = recent.length ? recent.map(m => moodRow(m)).join('') :
    `<div class="card rounded-2xl p-4 text-sm text-[#8c7a72] text-center">Пока пусто — отметьте, что чувствуете</div>`;

  const scheduled = state.letters.filter(l => !l.opened);
  document.getElementById('home-letters-status').textContent = scheduled.length
    ? `Ожидают открытия: ${scheduled.length}`
    : 'Пока нет запечатанных писем';
}
function moodRow(m) {
  const mood = MOODS.find(x => x.key === m.key) || {};
  return `<div class="card rounded-2xl p-3.5 flex items-center gap-3">
    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style="background:${mood.bg}">${mood.emoji || '🙂'}</div>
    <div class="flex-1 min-w-0">
      <p class="font-bold text-[14px]">${escapeHtml(m.label)}</p>
      <p class="text-xs text-[#8c7a72] truncate">${escapeHtml(m.comment) || 'Без комментария'}</p>
    </div>
    <span class="text-[11px] text-[#b7a89f] shrink-0">${timeAgo(m.ts)}</span>
  </div>`;
}

/* ============== RENDER: EMOTIONS ============== */
function renderMoodGrid() {
  document.getElementById('mood-grid').innerHTML = MOODS.map(m => `
    <button type="button" onclick="selectMood('${m.key}')" data-mood="${m.key}"
      class="tile rounded-2xl py-3.5 flex flex-col items-center gap-1.5 ${state.selectedMoodKey === m.key ? 'selected' : ''}"
      style="background:${m.bg}">
      <span class="text-xl">${m.emoji}</span>
      <span class="text-[11px] font-bold text-center leading-tight px-1" style="color:${m.fg}">${m.label}</span>
    </button>
  `).join('');
}
function selectMood(key) {
  state.selectedMoodKey = key;
  renderMoodGrid();
}
function saveMood() {
  if (!state.selectedMoodKey) {
    flashHint('mood-grid');
    return;
  }
  const mood = MOODS.find(m => m.key === state.selectedMoodKey);
  const comment = document.getElementById('mood-comment').value.trim();
  const entry = {
    id: nextId(),
    key: mood.key,
    label: mood.label,
    emoji: mood.emoji,
    comment,
    photo: state.moodPhoto,
    author: state.currentUser,
    ts: Date.now(),
  };
  state.moods.push(entry);
  state.selectedMoodKey = null;
  state.moodPhoto = null;
  document.getElementById('mood-comment').value = '';
  document.getElementById('mood-photo-url').value = '';
  document.getElementById('mood-photo-file').value = '';
  document.getElementById('mood-photo-preview').classList.add('hidden');
  renderAll();
}
function flashHint(id) {
  const el = document.getElementById(id);
  el.classList.add('glow');
  setTimeout(() => el.classList.remove('glow'), 700);
}
function renderMoodHistory() {
  const list = [...state.moods].reverse();
  document.getElementById('mood-history-count').textContent = `${list.length} ${plural(list.length, 'запись', 'записи', 'записей')}`;
  document.getElementById('mood-history-list').innerHTML = list.length ? list.map(m => `
    <div class="card rounded-2xl p-3.5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style="background:${(MOODS.find(x => x.key === m.key) || {}).bg}">${m.emoji}</div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-[14px]">${escapeHtml(m.label)} <span class="font-normal text-[#b7a89f]">· ${escapeHtml(m.author)}</span></p>
          <p class="text-xs text-[#8c7a72] truncate">${escapeHtml(m.comment) || 'Без комментария'}</p>
        </div>
        <span class="text-[11px] text-[#b7a89f] shrink-0">${fmtDateTime(m.ts)}</span>
      </div>
      ${m.photo ? `<img src="${m.photo}" class="w-full h-32 object-cover rounded-xl mt-3" alt="Фото дня" onerror="this.style.display='none'">` : ''}
    </div>
  `).join('') : `<div class="card rounded-2xl p-5 text-sm text-[#8c7a72] text-center">История пока пуста</div>`;
}

function initMoodPhotoInputs() {
  document.getElementById('mood-photo-url').addEventListener('input', (e) => {
    const url = e.target.value.trim();
    state.moodPhoto = url || null;
    updateMoodPhotoPreview(url);
  });
  document.getElementById('mood-photo-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.moodPhoto = reader.result;
      document.getElementById('mood-photo-url').value = '';
      updateMoodPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
function updateMoodPhotoPreview(src) {
  const wrap = document.getElementById('mood-photo-preview');
  const img = document.getElementById('mood-photo-img');
  if (src) { img.src = src; wrap.classList.remove('hidden'); }
  else { wrap.classList.add('hidden'); }
}

/* ============== RENDER: DATES ============== */
function renderDateFilters() {
  document.getElementById('date-filters').innerHTML = DATE_FILTERS.map(f => `
    <button onclick="setDateFilter('${f.key}')" class="chip shrink-0 px-4 py-2 rounded-full text-xs font-bold ${state.dateFilter === f.key ? 'bg-[#4a423e] text-[#fdfaf7]' : 'bg-[#eee9e4] text-[#8c7a72]'}">${f.label}</button>
  `).join('');
}
function setDateFilter(key) {
  state.dateFilter = key;
  renderDates();
}
function renderDateList() {
  const items = DATE_IDEAS.filter(d => state.dateFilter === 'all' || d.cat === state.dateFilter);
  document.getElementById('date-list').innerHTML = items.map(d => `
    <div class="card rounded-2xl p-3.5 flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-[#f0e6e8] flex items-center justify-center text-sm shrink-0">${d.cat === 'home' ? '🏠' : d.cat === 'outside' ? '🌤' : '⚡'}</div>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-[13.5px] leading-snug">${escapeHtml(d.text)}</p>
        <p class="text-xs text-[#8c7a72] mt-0.5">${d.place} · ${d.tag}</p>
      </div>
    </div>
  `).join('');
}
function randomizeDate() {
  const items = DATE_IDEAS.filter(d => state.dateFilter === 'all' || d.cat === state.dateFilter);
  const pool = items.length ? items : DATE_IDEAS;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const box = document.getElementById('date-pick');
  box.classList.remove('hidden');
  box.classList.add('flex');
  box.innerHTML = `
    <div class="w-10 h-10 rounded-xl bg-[#4a423e] text-[#fdfaf7] flex items-center justify-center text-base shrink-0">✓</div>
    <div>
      <p class="text-[11px] font-bold text-[#8c7a72]">Сегодняшняя идея</p>
      <p class="font-extrabold text-[14.5px] mt-0.5">${escapeHtml(pick.text)}</p>
      <p class="text-xs text-[#8c7a72] mt-0.5">${pick.place} · ${pick.tag}</p>
    </div>`;
}
function renderDates() {
  renderDateFilters();
  renderDateList();
}

/* ============== RENDER: MESSAGES ============== */
function sealLetter() {
  const title = document.getElementById('letter-title').value.trim();
  const text = document.getElementById('letter-text').value.trim();
  const unlockVal = document.getElementById('letter-unlock').value;
  if (!text) { alert('Напишите текст письма'); return; }
  if (!unlockVal) { alert('Выберите дату открытия'); return; }
  const unlockAt = new Date(unlockVal).getTime();
  if (isNaN(unlockAt)) { alert('Некорректная дата'); return; }
  state.letters.push({
    id: nextId(),
    title: title || 'Без темы',
    text,
    unlockAt,
    author: state.currentUser,
    opened: false,
  });
  document.getElementById('letter-title').value = '';
  document.getElementById('letter-text').value = '';
  document.getElementById('letter-unlock').value = '';
  state.letterTab = 'scheduled';
  renderAll();
}
function renderLetterTabs() {
  const tabs = [
    { key: 'scheduled', label: 'Запланированные' },
    { key: 'sent', label: 'Отправленные' },
  ];
  document.getElementById('letter-tabs').innerHTML = tabs.map(t => `
    <button onclick="setLetterTab('${t.key}')" class="chip flex-1 py-2.5 rounded-xl text-xs font-bold ${state.letterTab === t.key ? 'bg-[#4a423e] text-[#fdfaf7]' : 'bg-[#eee9e4] text-[#8c7a72]'}">${t.label}</button>
  `).join('');
}
function setLetterTab(key) {
  state.letterTab = key;
  renderLetters();
}
function openLetter(id) {
  const letter = state.letters.find(l => l.id === id);
  if (!letter || Date.now() < letter.unlockAt) return;
  letter.opened = true;
  renderAll();
}
function renderLetters() {
  const now = Date.now();
  const list = state.letters
    .filter(l => state.letterTab === 'sent' ? l.opened : !l.opened)
    .sort((a, b) => a.unlockAt - b.unlockAt);

  document.getElementById('letter-list').innerHTML = list.length ? list.map(l => {
    const ready = now >= l.unlockAt;
    if (l.opened) {
      return `<div class="card rounded-2xl p-4">
        <p class="text-[11px] font-bold text-[#8c7a72]">от ${escapeHtml(l.author)} · открыто</p>
        <p class="font-extrabold text-[14.5px] mt-1">${escapeHtml(l.title)}</p>
        <p class="text-[13.5px] text-[#5a504a] mt-1.5 leading-relaxed">${escapeHtml(l.text)}</p>
      </div>`;
    }
    if (ready) {
      return `<button onclick="openLetter(${l.id})" class="card w-full text-left rounded-2xl p-4 border-[#d6a88c]">
        <p class="text-[11px] font-bold text-[#b6941c]">✨ можно открыть</p>
        <p class="font-extrabold text-[14.5px] mt-1">${escapeHtml(l.title)}</p>
        <p class="text-xs text-[#8c7a72] mt-1">от ${escapeHtml(l.author)} · нажмите, чтобы прочитать</p>
      </button>`;
    }
    return `<div class="card rounded-2xl p-4 opacity-90">
      <p class="text-[11px] font-bold text-[#8c7a72]">🔒 запечатано</p>
      <p class="font-extrabold text-[14.5px] mt-1">${escapeHtml(l.title)}</p>
      <p class="text-xs text-[#8c7a72] mt-1">от ${escapeHtml(l.author)} · откроется ${fmtDateTime(l.unlockAt)}</p>
    </div>`;
  }).join('') : `<div class="card rounded-2xl p-5 text-sm text-[#8c7a72] text-center">${state.letterTab === 'sent' ? 'Открытых писем ещё нет' : 'Запланированных писем нет'}</div>`;
}

/* ============== RENDER: PROFILE ============== */
function renderProfile() {
  document.getElementById('profile-avatar').textContent = initials(state.currentUser);
  document.getElementById('profile-name').textContent = state.currentUser || '—';
  document.getElementById('profile-nickname-input').value = state.currentUser || '';
  document.getElementById('profile-stat-moods').textContent = state.moods.length;
  document.getElementById('profile-stat-letters').textContent = state.letters.length;
}
function saveNickname() {
  const val = document.getElementById('profile-nickname-input').value.trim();
  if (!val) return;
  const user = state.users.find(u => u.nickname === state.currentUser);
  if (user) user.nickname = val;
  state.moods.forEach(m => { if (m.author === state.currentUser) m.author = val; });
  state.letters.forEach(l => { if (l.author === state.currentUser) l.author = val; });
  state.currentUser = val;
  renderAll();
}

/* ============== RENDER ALL ============== */
function renderAll() {
  if (!state.currentUser) return;
  renderHome();
  renderMoodGrid();
  renderMoodHistory();
  renderDates();
  renderLetterTabs();
  renderLetters();
  renderProfile();
}

/* live re-check for letters unlocking */
setInterval(() => {
  if (state.currentUser && state.currentView === 'messages') renderLetters();
}, 15000);

/* ============== INIT ============== */
document.addEventListener('DOMContentLoaded', () => {
  initMoodPhotoInputs();
  document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
  goToSplash();
});
