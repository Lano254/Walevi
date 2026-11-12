const STORAGE_KEY = 'pintpal-pints';

const samplePints = [
  {
    id: crypto.randomUUID(),
    name: 'Hazy IPA',
    style: 'IPA',
    rating: 5,
    venue: 'North Brew House',
    notes: 'Bright citrus, smooth finish, and a soft haze.',
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: 'Amber Ale',
    style: 'Ale',
    rating: 4,
    venue: 'Riverside Tap',
    notes: 'Caramel notes with a clean body.',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const form = document.querySelector('#pint-form');
const list = document.querySelector('#pint-list');
const resetBtn = document.querySelector('#reset-btn');

const totalPintsEl = document.querySelector('#total-pints');
const topStyleEl = document.querySelector('#top-style');
const avgRatingEl = document.querySelector('#avg-rating');
const lastPintEl = document.querySelector('#last-pint');

function loadPints() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(samplePints));
    return [...samplePints];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : [...samplePints];
  } catch {
    return [...samplePints];
  }
}

let pints = loadPints();

function renderPints() {
  if (!pints.length) {
    list.innerHTML = '<li class="empty-state">No pints logged yet. Add your first pour above.</li>';
    updateSummary();
    return;
  }

  list.innerHTML = pints
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((pint) => {
      const initials = pint.name.slice(0, 2).toUpperCase();
      return `
        <li class="pint-item">
          <div class="pint-badge">${initials}</div>
          <div>
            <h4>${pint.name}</h4>
            <div class="pint-meta">
              <span>${pint.style}</span>
              <span>•</span>
              <span>${pint.venue || 'No venue'}</span>
            </div>
            ${pint.notes ? `<div class="pint-meta"><span>${pint.notes}</span></div>` : ''}
          </div>
          <div class="pint-rating">${'★'.repeat(pint.rating)}${'☆'.repeat(5 - pint.rating)}</div>
        </li>
      `;
    })
    .join('');

  updateSummary();
}

function updateSummary() {
  totalPintsEl.textContent = pints.length;

  if (!pints.length) {
    topStyleEl.textContent = '—';
    avgRatingEl.textContent = '—';
    lastPintEl.textContent = '—';
    return;
  }

  const styleCounts = pints.reduce((acc, pint) => {
    acc[pint.style] = (acc[pint.style] || 0) + 1;
    return acc;
  }, {});

  const topStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0];
  const avg = pints.reduce((sum, pint) => sum + Number(pint.rating), 0) / pints.length;
  const latest = [...pints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  topStyleEl.textContent = topStyle ? topStyle[0] : '—';
  avgRatingEl.textContent = `${avg.toFixed(1)}/5`;
  lastPintEl.textContent = latest ? latest.name : '—';
}

function savePints() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pints));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const newPint = {
    id: crypto.randomUUID(),
    name: (formData.get('name') || '').toString().trim(),
    style: (formData.get('style') || '').toString().trim(),
    rating: Number(formData.get('rating') || 0),
    venue: (formData.get('venue') || '').toString().trim(),
    notes: (formData.get('notes') || '').toString().trim(),
    createdAt: new Date().toISOString()
  };

  if (!newPint.name || !newPint.style) return;

  pints.push(newPint);
  savePints();
  renderPints();
  form.reset();
  document.querySelector('#rating').value = 4;
});

resetBtn.addEventListener('click', () => {
  pints = [];
  localStorage.removeItem(STORAGE_KEY);
  renderPints();
});

renderPints();
