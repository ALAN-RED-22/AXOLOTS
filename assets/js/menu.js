(function () {
  const toggle = document.querySelector('.menu-toggle');
  const navlinks = document.querySelector('.navlinks');
  if (!toggle || !navlinks) return;

  function closeMenu() {
    navlinks.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    const isOpen = navlinks.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // cerrar el menú al elegir una sección
  navlinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // si la ventana crece a tamaño de escritorio, cerrar el menú móvil
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 820) closeMenu();
  });
})();
