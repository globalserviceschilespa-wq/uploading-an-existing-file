const list = document.querySelector('#news-list');
const statusMessage = document.querySelector('#news-status');
const filters = document.querySelector('#news-filters');
const buttons = [...filters.querySelectorAll('button')];
const articleLimit = 6;
const refreshInterval = 10 * 60 * 1000;
const maxBackupAge = 45 * 24 * 60 * 60 * 1000;
const articleDate = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'America/Santiago' });
const checkedDate = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santiago',
});
const allowedHosts = ['therobotreport.com', 'roboticsandautomationnews.com'];
let state;
let activeTopic = '';
let checking = false;
let lastCheck = 0;

function articleItem(article) {
  const item = document.createElement('li');
  const category = document.createElement('p');
  const title = document.createElement('h3');
  const link = document.createElement('a');
  const meta = document.createElement('p');
  const date = document.createElement('time');

  category.className = 'news-category';
  category.textContent = article.topic;
  title.lang = 'en';
  link.href = article.url;
  link.textContent = article.title;
  title.append(link);
  meta.className = 'news-meta';
  date.dateTime = article.date;
  date.textContent = articleDate.format(new Date(article.date));
  meta.append(article.source, ' · ', date);
  item.append(category, title, meta);
  return item;
}

function visibleArticles(articles) {
  return articles.filter(article => {
    try {
      const url = new URL(article.url);
      return url.protocol === 'https:' && allowedHosts.includes(url.hostname.replace(/^www\./, ''))
        && Number.isFinite(Date.parse(article.date)) && Date.now() - Date.parse(article.date) <= maxBackupAge;
    } catch {
      return false;
    }
  });
}

function render() {
  const articles = visibleArticles(state?.articles ?? []);
  const filtered = activeTopic ? articles.filter(article => article.topic === activeTopic) : articles;
  list.replaceChildren(...filtered.slice(0, articleLimit).map(articleItem));
  filters.hidden = !articles.length;
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === activeTopic)));

  if (!articles.length) {
    statusMessage.textContent = 'Por ahora puedes consultar las fuentes directamente.';
  } else if (!filtered.length) {
    statusMessage.textContent = 'Sin noticias recientes en este tema.';
  } else {
    const date = checkedDate.format(new Date(state.checkedAt));
    const label = { live: 'Fuentes consultadas', partial: 'Consulta parcial de fuentes', fallback: 'Última selección guardada' };
    statusMessage.textContent = label[state.status] + ' el ' + date + ' (hora de Chile).';
  }
}

for (const button of buttons) {
  button.addEventListener('click', () => {
    activeTopic = button.dataset.topic;
    render();
  });
}

async function fetchNews(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8500) });
  if (!response.ok) throw new Error('Noticias no disponibles');
  const data = await response.json();
  if (!Array.isArray(data.articles) || !Number.isFinite(Date.parse(data.checkedAt))) {
    throw new Error('Datos de noticias inválidos');
  }
  return data;
}

async function refresh() {
  if (checking) return;
  checking = true;
  lastCheck = Date.now();
  if (!state) statusMessage.textContent = 'Consultando titulares recientes…';
  try {
    state = await fetchNews('api/automation-news');
  } catch {
    if (state?.articles.length) {
      state = { ...state, status: 'fallback' };
    } else {
      try {
        state = { ...await fetchNews('news-fallback.json'), status: 'fallback' };
      } catch {
        state = null;
      }
    }
  } finally {
    checking = false;
    render();
  }
}

refresh();
window.setInterval(() => {
  if (!document.hidden) refresh();
}, refreshInterval);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && Date.now() - lastCheck >= refreshInterval) refresh();
});
