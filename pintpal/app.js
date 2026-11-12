const firebaseConfig = {
  apiKey: "AIzaSyCOxQ7TVaw9tt-lF1-w34G_K88jh_bjH-o",
  authDomain: "pintpal-c5c75.firebaseapp.com",
  projectId: "pintpal-c5c75",
  storageBucket: "pintpal-c5c75.firebasestorage.app",
  messagingSenderId: "864608666147",
  appId: "1:864608666147:web:9e8dfad32dc3080e8e2796",
  measurementId: "G-MW47P6S581"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ========== DATA ==========
const SAMPLE_USERS = [
  {
    id: 1,
    name: "Wanjiku",
    age: 24,
    city: "Nairobi",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop",
    drinks: ["Tusker", "Mojito", "Wine"],
    bio: "Fridays are for cold ones and good conversations. Looking for chill drinking buddies."
  },
  {
    id: 2,
    name: "Brian",
    age: 27,
    city: "Nairobi",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
    drinks: ["Whiskey", "Beer", "Gin"],
    bio: "Craft beer hunter. Always down for a new spot or a classic local joint."
  },
  {
    id: 3,
    name: "Amina",
    age: 23,
    city: "Nairobi",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
    drinks: ["Cocktails", "Rosé", "Tequila"],
    bio: "Cocktail enthusiast. Let’s explore rooftop bars and hidden gems."
  },
  {
    id: 4,
    name: "Kevin",
    age: 29,
    city: "Westlands",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop",
    drinks: ["Guinness", "Rum", "Beer"],
    bio: "After-work beers are sacred. Looking for regular drinking partners."
  },
  {
    id: 5,
    name: "Faith",
    age: 26,
    city: "Kilimani",
    photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop",
    drinks: ["Sangria", "Prosecco", "Gin & Tonic"],
    bio: "Love long conversations over drinks. Prefer quality over quantity."
  },
  {
    id: 6,
    name: "Daniel",
    age: 25,
    city: "Nairobi",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop",
    drinks: ["Local beer", "Whiskey sours", "Cider"],
    bio: "New in the city and looking for people to explore the bar scene with."
  }
];

// ========== STATE ==========
let currentUser = null;
let remainingUsers = [...SAMPLE_USERS];
let matches = [];
let chats = {}; // { matchId: [messages] }
let currentCardIndex = 0;
let isDragging = false;
let startX = 0;
let currentX = 0;

// ========== DOM ==========
const onboarding = document.getElementById('onboarding');
const app = document.getElementById('app');
const profileForm = document.getElementById('profile-form');
const cardStack = document.getElementById('card-stack');
const passBtn = document.getElementById('pass-btn');
const likeBtn = document.getElementById('like-btn');
const noMore = document.getElementById('no-more');
const matchesList = document.getElementById('matches-list');
const noMatches = document.getElementById('no-matches');
const matchCount = document.getElementById('match-count');
const myProfile = document.getElementById('my-profile');
const chatModal = document.getElementById('chat-modal');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

// ========== INIT ==========
function init() {
  const saved = localStorage.getItem('pintpal_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    const savedMatches = localStorage.getItem('pintpal_matches');
    const savedChats = localStorage.getItem('pintpal_chats');
    if (savedMatches) matches = JSON.parse(savedMatches);
    if (savedChats) chats = JSON.parse(savedChats);
    
    // Remove already matched users from the stack
    const matchedIds = matches.map(m => m.id);
    remainingUsers = SAMPLE_USERS.filter(u => !matchedIds.includes(u.id));
    
    showApp();
  }

  // Event listeners
  profileForm.addEventListener('submit', handleProfileSubmit);
  passBtn.addEventListener('click', () => swipe('left'));
  likeBtn.addEventListener('click', () => swipe('right'));
  
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('edit-profile').addEventListener('click', () => {
    localStorage.removeItem('pintpal_user');
    location.reload();
  });

  document.getElementById('reset-app').addEventListener('click', () => {
    if (confirm('Reset everything? All matches and chats will be gone.')) {
      localStorage.clear();
      location.reload();
    }
  });

  document.getElementById('close-chat').addEventListener('click', () => {
    chatModal.classList.add('hidden');
  });

  chatForm.addEventListener('submit', handleSendMessage);
}

// ========== PROFILE ==========
function handleProfileSubmit(e) {
  e.preventDefault();
  currentUser = {
    name: document.getElementById('name').value.trim(),
    age: parseInt(document.getElementById('age').value),
    city: document.getElementById('city').value.trim(),
    photo: document.getElementById('photo').value.trim(),
    drinks: document.getElementById('drinks').value.split(',').map(d => d.trim()).filter(Boolean),
    bio: document.getElementById('bio').value.trim()
  };
  localStorage.setItem('pintpal_user', JSON.stringify(currentUser));
  showApp();
}

function showApp() {
  onboarding.classList.add('hidden');
  app.classList.remove('hidden');
  renderCards();
  renderMatches();
  renderMyProfile();
}

// ========== CARDS ==========
function renderCards() {
  cardStack.innerHTML = '';
  noMore.classList.add('hidden');

  if (remainingUsers.length === 0) {
    noMore.classList.remove('hidden');
    return;
  }

  // Show up to 3 cards stacked
  const toShow = remainingUsers.slice(0, 3);
  toShow.forEach((user, i) => {
    const card = createCard(user, i === 0);
    card.style.zIndex = 10 - i;
    card.style.transform = `scale(${1 - i * 0.04}) translateY(${i * 8}px)`;
    cardStack.appendChild(card);
  });
}

function createCard(user, isTop) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = user.id;

  card.innerHTML = `
    <img src="${user.photo}" alt="${user.name}" draggable="false">
    <div class="card-info">
      <h2>${user.name}, ${user.age}</h2>
      <div class="meta">${user.city}</div>
      <div class="drinks">
        ${user.drinks.map(d => `<span class="drink-tag">${d}</span>`).join('')}
      </div>
      <p>${user.bio}</p>
    </div>
    <div class="swipe-indicator like">LIKE</div>
    <div class="swipe-indicator pass">NOPE</div>
  `;

  if (isTop) {
    addDragListeners(card);
  }

  return card;
}

function addDragListeners(card) {
  card.addEventListener('mousedown', startDrag);
  card.addEventListener('touchstart', startDrag, { passive: true });
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('touchmove', onDrag, { passive: false });
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);
}

function startDrag(e) {
  isDragging = true;
  startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  currentX = startX;
  const card = cardStack.querySelector('.card');
  if (card) card.style.transition = 'none';
}

function onDrag(e) {
  if (!isDragging) return;
  e.preventDefault();
  currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  const diff = currentX - startX;
  const card = cardStack.querySelector('.card');
  if (!card) return;

  const rotate = diff * 0.08;
  card.style.transform = `translateX(${diff}px) rotate(${rotate}deg)`;

  // Indicators
  const likeInd = card.querySelector('.swipe-indicator.like');
  const passInd = card.querySelector('.swipe-indicator.pass');
  const abs = Math.abs(diff);
  if (diff > 0) {
    likeInd.style.opacity = Math.min(abs / 100, 1);
    passInd.style.opacity = 0;
  } else {
    passInd.style.opacity = Math.min(abs / 100, 1);
    likeInd.style.opacity = 0;
  }
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  const diff = currentX - startX;
  const card = cardStack.querySelector('.card');
  if (!card) return;

  card.style.transition = 'transform 0.3s ease, opacity 0.3s';

  if (Math.abs(diff) > 120) {
    swipe(diff > 0 ? 'right' : 'left');
  } else {
    card.style.transform = '';
    card.querySelectorAll('.swipe-indicator').forEach(el => el.style.opacity = 0);
  }
}

function swipe(direction) {
  const card = cardStack.querySelector('.card');
  if (!card) return;

  const userId = parseInt(card.dataset.id);
  const user = remainingUsers.find(u => u.id === userId);

  // Animate out
  const flyX = direction === 'right' ? 500 : -500;
  card.style.transform = `translateX(${flyX}px) rotate(${direction === 'right' ? 25 : -25}deg)`;
  card.style.opacity = '0';

  setTimeout(() => {
    remainingUsers = remainingUsers.filter(u => u.id !== userId);

    if (direction === 'right') {
      // 40% chance of mutual match for demo feel
      if (Math.random() < 0.45) {
        matches.push(user);
        chats[user.id] = [
          { from: 'them', text: `Hey ${currentUser.name}! Down for a drink sometime? 🍺` }
        ];
        saveState();
        showMatchToast(user);
      }
    }

    renderCards();
    renderMatches();
  }, 280);
}

function showMatchToast(user) {
  // Simple alert for now – you can upgrade to a nice modal later
  setTimeout(() => {
    alert(`🎉 It's a match with ${user.name}!\nGo to Matches to start chatting.`);
  }, 300);
}

// ========== MATCHES & CHAT ==========
function renderMatches() {
  matchesList.innerHTML = '';
  if (matches.length === 0) {
    noMatches.classList.remove('hidden');
    matchCount.classList.add('hidden');
    return;
  }

  noMatches.classList.add('hidden');
  matchCount.textContent = matches.length;
  matchCount.classList.remove('hidden');

  matches.forEach(user => {
    const item = document.createElement('div');
    item.className = 'match-item';
    item.innerHTML = `
      <img src="${user.photo}" alt="${user.name}">
      <div class="info">
        <h3>${user.name}, ${user.age}</h3>
        <p>${user.drinks.slice(0, 2).join(' • ')}</p>
      </div>
    `;
    item.addEventListener('click', () => openChat(user));
    matchesList.appendChild(item);
  });
}

function openChat(user) {
  document.getElementById('chat-avatar').src = user.photo;
  document.getElementById('chat-name').textContent = user.name;
  chatModal.dataset.userId = user.id;
  renderChatMessages(user.id);
  chatModal.classList.remove('hidden');
  chatInput.focus();
}

function renderChatMessages(userId) {
  chatMessages.innerHTML = '';
  const messages = chats[userId] || [];
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = `message ${msg.from === 'me' ? 'me' : 'them'}`;
    div.textContent = msg.text;
    chatMessages.appendChild(div);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleSendMessage(e) {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  const userId = parseInt(chatModal.dataset.userId);
  if (!chats[userId]) chats[userId] = [];
  chats[userId].push({ from: 'me', text });
  chatInput.value = '';
  renderChatMessages(userId);
  saveState();

  // Fake reply after a short delay
  setTimeout(() => {
    const replies = [
      "Haha nice one 😂",
      "I’m free this Friday if you’re down",
      "Know any good spots in town?",
      "Sounds good, let’s make it happen",
      "Cheers to that 🍻"
    ];
    chats[userId].push({ from: 'them', text: replies[Math.floor(Math.random() * replies.length)] });
    renderChatMessages(userId);
    saveState();
  }, 1200 + Math.random() * 1500);
}

// ========== PROFILE TAB ==========
function renderMyProfile() {
  myProfile.innerHTML = `
    <img src="${currentUser.photo}" alt="${currentUser.name}">
    <div class="info">
      <h2>${currentUser.name}, ${currentUser.age}</h2>
      <div class="meta">${currentUser.city}</div>
      <div class="drinks" style="margin: 12px 0;">
        ${currentUser.drinks.map(d => `<span class="drink-tag">${d}</span>`).join('')}
      </div>
      <p>${currentUser.bio}</p>
    </div>
  `;
}

// ========== TABS ==========
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// ========== PERSISTENCE ==========
function saveState() {
  localStorage.setItem('pintpal_matches', JSON.stringify(matches));
  localStorage.setItem('pintpal_chats', JSON.stringify(chats));
}

// Start
init();
