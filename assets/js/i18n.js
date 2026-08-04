(function () {
  const translatable = document.querySelectorAll('[data-en]');
  // guarda el texto original en español antes de tocar nada
  translatable.forEach(el => { el.dataset.es = el.textContent; });

  const buttons = document.querySelectorAll('.lang-btn');

  function setLang(lang) {
    translatable.forEach(el => {
      el.textContent = (lang === 'en') ? el.dataset.en : el.dataset.es;
    });
    document.documentElement.lang = lang;
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
})();
