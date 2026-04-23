/**
 * ODHR Contact Form
 * Sends data to Google Sheets via Apps Script + Telegram notification
 *
 * Usage: include this script on every page, then call:
 *   openContactForm()  — to open the modal
 *   or put data-contact-trigger on any <button> / <a>
 */

(function () {
  const APPS_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbxnF6jgqoXw5g7mD43_-odCwXsIh0RKwtL51mpRzgLuf_A1VafVsTHspW5cd1qyaKe-/exec';

  // ── CSS ──────────────────────────────────────────────────────────────────
  const CSS = `
  #odhr-overlay {
    display:none; position:fixed; inset:0; z-index:9999;
    background:rgba(20,32,50,.72); backdrop-filter:blur(6px);
    align-items:center; justify-content:center; padding:20px;
  }
  #odhr-overlay.odhr-open { display:flex; }

  #odhr-modal {
    background:#faf8f2; border-radius:16px; width:100%; max-width:480px;
    box-shadow:0 24px 64px rgba(0,0,0,.28); position:relative;
    font-family:'Golos Text',sans-serif; overflow:hidden;
    animation:odhrSlideUp .28s cubic-bezier(.22,1,.36,1);
  }
  @keyframes odhrSlideUp {
    from { opacity:0; transform:translateY(28px); }
    to   { opacity:1; transform:translateY(0); }
  }

  #odhr-modal-header {
    background:#2d3f5c; padding:28px 32px 24px; position:relative;
  }
  #odhr-modal-header::after {
    content:''; position:absolute; bottom:0; left:0;
    width:100%; height:3px;
    background:linear-gradient(90deg,#f0a830,#5a7a8a);
  }
  #odhr-modal-title {
    font-family:'Unbounded',sans-serif; font-size:15px; font-weight:700;
    color:#fff; margin:0 0 6px; letter-spacing:.5px;
  }
  #odhr-modal-sub {
    font-size:13px; color:#8fa0b8; line-height:1.5; margin:0;
  }
  #odhr-close {
    position:absolute; top:16px; right:18px;
    background:rgba(255,255,255,.1); border:none; color:#fff;
    width:30px; height:30px; border-radius:50%; font-size:16px;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition:background .2s; line-height:1;
  }
  #odhr-close:hover { background:rgba(255,255,255,.22); }

  #odhr-form { padding:28px 32px 32px; display:flex; flex-direction:column; gap:16px; }

  .odhr-field { display:flex; flex-direction:column; gap:6px; }
  .odhr-label {
    font-family:'Unbounded',sans-serif; font-size:9px; font-weight:700;
    letter-spacing:1.5px; text-transform:uppercase; color:#7a8a9a;
  }
  .odhr-input, .odhr-textarea {
    font-family:'Golos Text',sans-serif; font-size:14px; color:#2d3f5c;
    background:#fff; border:1.5px solid #d4d0c8; border-radius:8px;
    padding:12px 14px; outline:none; transition:border-color .2s;
    width:100%; box-sizing:border-box;
  }
  .odhr-input:focus, .odhr-textarea:focus { border-color:#f0a830; }
  .odhr-input.odhr-err, .odhr-textarea.odhr-err { border-color:#c05070; }
  .odhr-textarea { resize:vertical; min-height:100px; }

  #odhr-submit {
    font-family:'Unbounded',sans-serif; font-size:11px; font-weight:700;
    letter-spacing:1px; text-transform:uppercase;
    background:#f0a830; color:#2d3f5c; border:none; border-radius:8px;
    padding:14px 28px; cursor:pointer; transition:background .2s; margin-top:4px;
  }
  #odhr-submit:hover:not(:disabled) { background:#e09820; }
  #odhr-submit:disabled { opacity:.6; cursor:not-allowed; }

  #odhr-status {
    font-size:13px; text-align:center; min-height:18px; line-height:1.5;
  }
  #odhr-status.ok  { color:#3a7a4a; }
  #odhr-status.err { color:#c05070; }

  #odhr-success {
    display:none; padding:48px 32px; text-align:center; flex-direction:column;
    align-items:center; gap:16px;
  }
  #odhr-success.odhr-open { display:flex; }
  .odhr-check {
    width:56px; height:56px; border-radius:50%; background:#e8f4ec;
    display:flex; align-items:center; justify-content:center; font-size:26px;
  }
  #odhr-success-title {
    font-family:'Unbounded',sans-serif; font-size:16px; font-weight:700;
    color:#2d3f5c; margin:0;
  }
  #odhr-success-sub { font-size:13px; color:#7a8a9a; margin:0; }
  #odhr-success-close {
    margin-top:8px; font-family:'Unbounded',sans-serif; font-size:10px;
    font-weight:700; letter-spacing:1px; text-transform:uppercase;
    background:transparent; border:1.5px solid #d4d0c8; border-radius:8px;
    padding:10px 22px; cursor:pointer; color:#2d3f5c; transition:all .2s;
  }
  #odhr-success-close:hover { border-color:#2d3f5c; }

  @media (max-width:520px) {
    #odhr-form, #odhr-modal-header { padding-left:20px; padding-right:20px; }
  }
  `;

  // ── HTML ─────────────────────────────────────────────────────────────────
  const HTML = `
  <div id="odhr-overlay">
    <div id="odhr-modal" role="dialog" aria-modal="true" aria-labelledby="odhr-modal-title">
      <div id="odhr-modal-header">
        <button id="odhr-close" aria-label="Закрыть">✕</button>
        <p id="odhr-modal-title">Напишите мне</p>
        <p id="odhr-modal-sub">Отвечу в течение 24 часов</p>
      </div>
      <div id="odhr-form-wrap">
        <div id="odhr-form">
          <div class="odhr-field">
            <label class="odhr-label" for="odhr-name">Имя</label>
            <input class="odhr-input" id="odhr-name" type="text" placeholder="Ваше имя" autocomplete="name">
          </div>
          <div class="odhr-field">
            <label class="odhr-label" for="odhr-email">E-mail</label>
            <input class="odhr-input" id="odhr-email" type="email" placeholder="email@example.com" autocomplete="email">
          </div>
          <div class="odhr-field">
            <label class="odhr-label" for="odhr-message">Суть вопроса</label>
            <textarea class="odhr-textarea" id="odhr-message" placeholder="Расскажите, с чем хотите разобраться…"></textarea>
          </div>
          <div id="odhr-status"></div>
          <button id="odhr-submit">Отправить</button>
        </div>
        <div id="odhr-success">
          <div class="odhr-check">✓</div>
          <p id="odhr-success-title">Сообщение отправлено!</p>
          <p id="odhr-success-sub">Я получила вашу заявку и отвечу в ближайшее время.</p>
          <button id="odhr-success-close">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
  `;


  // ── i18n ─────────────────────────────────────────────────────────────────
  var I18N = {
    ru: {
      title:       'Напишите мне',
      sub:         'Отвечу в течение 24 часов',
      labelName:   'Имя',
      labelEmail:  'E-mail',
      labelMsg:    'Суть вопроса',
      placeName:   'Ваше имя',
      placeMsg:    'Расскажите, с чем хотите разобраться…',
      submit:      'Отправить',
      sending:     'Отправка…',
      errFields:   'Пожалуйста, заполните все поля.',
      errEmail:    'Введите корректный e-mail.',
      errSend:     'Ошибка при отправке. Напишите напрямую: grebenallka@gmail.com',
      successTitle:'Сообщение отправлено!',
      successSub:  'Я получила вашу заявку и отвечу в ближайшее время.',
      close:       'Закрыть',
    },
    en: {
      title:       'Get in touch',
      sub:         'I\'ll reply within 24 hours',
      labelName:   'Name',
      labelEmail:  'E-mail',
      labelMsg:    'Your question',
      placeName:   'Your name',
      placeMsg:    'Tell me what you\'d like to figure out…',
      submit:      'Send',
      sending:     'Sending…',
      errFields:   'Please fill in all fields.',
      errEmail:    'Please enter a valid e-mail.',
      errSend:     'Send error. Write directly: grebenallka@gmail.com',
      successTitle:'Message sent!',
      successSub:  'I\'ve received your request and will reply shortly.',
      close:       'Close',
    }
  };

  function getLang() {
    var urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang === 'en') return 'en';
    var htmlLang = (document.documentElement.lang || '').toLowerCase();
    if (htmlLang.startsWith('en')) return 'en';
    return 'ru';
  }

  function applyLang(t) {
    document.getElementById('odhr-modal-title').textContent = t.title;
    document.getElementById('odhr-modal-sub').textContent   = t.sub;
    document.querySelector('label[for="odhr-name"]').textContent    = t.labelName;
    document.querySelector('label[for="odhr-email"]').textContent   = t.labelEmail;
    document.querySelector('label[for="odhr-message"]').textContent = t.labelMsg;
    document.getElementById('odhr-name').placeholder    = t.placeName;
    document.getElementById('odhr-message').placeholder = t.placeMsg;
    document.getElementById('odhr-submit').textContent  = t.submit;
    document.getElementById('odhr-success-title').textContent = t.successTitle;
    document.getElementById('odhr-success-sub').textContent   = t.successSub;
    document.getElementById('odhr-success-close').textContent = t.close;
  }


  // ── INIT ─────────────────────────────────────────────────────────────────
  function inject() {
    // styles
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // markup
    const div = document.createElement('div');
    div.innerHTML = HTML;
    document.body.appendChild(div.firstElementChild);

    // events
    document.getElementById('odhr-close').addEventListener('click', closeModal);
    document.getElementById('odhr-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
    document.getElementById('odhr-submit').addEventListener('click', handleSubmit);
    document.getElementById('odhr-success-close').addEventListener('click', closeModal);

    // keyboard
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // wire up any [data-contact-trigger] elements
    document.querySelectorAll('[data-contact-trigger]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
    });

    // auto-patch ALL mailto:grebenallka@gmail.com links on the page
    document.querySelectorAll('a[href="mailto:grebenallka@gmail.com"]').forEach(function (el) {
      el.setAttribute('href', '#');
      el.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
    });
  }

  // ── OPEN / CLOSE ─────────────────────────────────────────────────────────
  function openModal() {
    var overlay = document.getElementById('odhr-overlay');
    if (!overlay) return;
    overlay.classList.add('odhr-open');
    document.body.style.overflow = 'hidden';
    document.getElementById('odhr-name').focus();
    // reset
    document.getElementById('odhr-form').style.display = 'flex';
    document.getElementById('odhr-success').classList.remove('odhr-open');
    document.getElementById('odhr-status').textContent = '';
    document.getElementById('odhr-status').className = '';
    // apply language
    applyLang(I18N[getLang()]);
  }

  function closeModal() {
    var overlay = document.getElementById('odhr-overlay');
    if (!overlay) return;
    overlay.classList.remove('odhr-open');
    document.body.style.overflow = '';
    // clear fields
    ['odhr-name','odhr-email','odhr-message'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.value = ''; el.classList.remove('odhr-err'); }
    });
  }

  // ── SUBMIT ───────────────────────────────────────────────────────────────
  function handleSubmit() {
    var name    = document.getElementById('odhr-name').value.trim();
    var email   = document.getElementById('odhr-email').value.trim();
    var message = document.getElementById('odhr-message').value.trim();
    var status  = document.getElementById('odhr-status');
    var btn     = document.getElementById('odhr-submit');

    // validation
    var valid = true;
    [['odhr-name', name], ['odhr-email', email], ['odhr-message', message]].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (!pair[1]) { el.classList.add('odhr-err'); valid = false; }
      else el.classList.remove('odhr-err');
    });
    if (!valid) {
      status.textContent = I18N[getLang()].errFields;
      status.className = 'err';
      return;
    }
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      document.getElementById('odhr-email').classList.add('odhr-err');
      status.textContent = I18N[getLang()].errEmail;
      status.className = 'err';
      return;
    }

    btn.disabled = true;
    status.textContent = I18N[getLang()].sending;
    status.className = '';

    var payload = { name: name, email: email, message: message };

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function () {
      // no-cors → opaque response, treat as success
      document.getElementById('odhr-form').style.display = 'none';
      document.getElementById('odhr-success').classList.add('odhr-open');
    })
    .catch(function () {
      status.textContent = I18N[getLang()].errSend;
      status.className = 'err';
      btn.disabled = false;
    });
  }

  // ── PUBLIC API ───────────────────────────────────────────────────────────
  window.openContactForm = openModal;

  // ── RUN ──────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
