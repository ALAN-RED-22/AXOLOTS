(function () {
  const steps = document.querySelectorAll('.step');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); } });
  }, { threshold: 0.3 });
  steps.forEach(s => obs.observe(s));
})();
