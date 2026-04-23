const App = {
  currentLang: 'ru',

  init() {
    this.currentLang = new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'ru';
    this.bindMobileMenu();
    this.updateCrossLinks();
    this.updateLangButtons();
  },

  bindMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    if (menuBtn && navMenu) {
      menuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        menuBtn.textContent = navMenu.classList.contains('open') ? '✕' : '☰';
      });
    }
  },

  updateCrossLinks() {
    document.querySelectorAll('.cross-link').forEach(link => {
      if (link.getAttribute('href') && link.getAttribute('href') !== '#') {
        const url = new URL(link.href, window.location.origin);
        url.searchParams.set('lang', this.currentLang);
        link.href = url.toString();
      }
    });
  },

  updateLangButtons() {
    ['ru', 'en'].forEach(l => {
      const btn = document.getElementById(`btn-lang-${l}`);
      if (btn) btn.classList.toggle('active', this.currentLang === l);
    });
  },

  setLanguage(lang, callback) {
    this.currentLang = lang;
    this.updateLangButtons();
    this.updateCrossLinks();
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.pushState({}, '', url);
    if (callback) callback(lang);
  },

  setText(id, val, html = false) {
    const el = document.getElementById(id);
    if (!el) return;
    html ? el.innerHTML = val : el.textContent = val;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());