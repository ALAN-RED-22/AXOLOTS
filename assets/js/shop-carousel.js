(function() {
    function initCoverflow() {
        const section = document.getElementById('taller');
        const container = document.getElementById('coverflow-shop');
        if (!container || !section) return;

        const track = container.querySelector('.coverflow-track');
        const cards = Array.from(container.querySelectorAll('.coverflow-card'));
        const btnPrev = container.querySelector('.ctrl-btn.prev');
        const btnNext = container.querySelector('.ctrl-btn.next');
        
        let activeIndex = 0;
        // Detectar si estamos en un teléfono para reducir la separación lateral
        const isMobile = window.innerWidth <= 768;
        const spacing = isMobile ? 50 : 140; 
        const translateCenter = isMobile ? 60 : 120;

        function updateCoverflow() {
            const activeCard = cards[activeIndex];
            
            // Cambiar fondo si la imagen existe (si no, mantiene el color base suave)
            if (activeCard) {
                const bgImage = activeCard.getAttribute('data-bg');
                if (bgImage && bgImage.trim() !== "") {
                    section.style.backgroundImage = `url('${bgImage}')`;
                }
            }

            cards.forEach((card, i) => {
                const offset = i - activeIndex;
                
                if (offset === 0) {
                    // Tarjeta activa
                    card.style.transform = `translateX(0) rotateY(0deg) translateZ(${translateCenter}px)`;
                    card.style.opacity = '1';
                    card.style.visibility = 'visible';
                    card.style.zIndex = '10';
                    card.classList.add('active');
                } else if (offset < 0) {
                    // Tarjetas izquierdas
                    const translateX = (offset * spacing) - (isMobile ? 30 : 80); 
                    card.style.transform = `translateX(${translateX}px) rotateY(45deg) translateZ(0)`;
                    card.style.opacity = Math.abs(offset) > 1 ? '0' : '0.4';
                    card.style.visibility = Math.abs(offset) > 1 ? 'hidden' : 'visible';
                    card.style.zIndex = `${10 - Math.abs(offset)}`;
                    card.classList.remove('active');
                } else {
                    // Tarjetas derechas
                    const translateX = (offset * spacing) + (isMobile ? 30 : 80);
                    card.style.transform = `translateX(${translateX}px) rotateY(-45deg) translateZ(0)`;
                    card.style.opacity = Math.abs(offset) > 1 ? '0' : '0.4';
                    card.style.visibility = Math.abs(offset) > 1 ? 'hidden' : 'visible';
                    card.style.zIndex = `${10 - Math.abs(offset)}`;
                    card.classList.remove('active');
                }
            });
        }

        // Navegación con botones
        btnPrev.onclick = (e) => {
            e.preventDefault();
            activeIndex = activeIndex > 0 ? activeIndex - 1 : cards.length - 1;
            updateCoverflow();
        };

        btnNext.onclick = (e) => {
            e.preventDefault();
            activeIndex = activeIndex < cards.length - 1 ? activeIndex + 1 : 0;
            updateCoverflow();
        };

        // Click directo en tarjetas
        cards.forEach((card, index) => {
            card.onclick = () => {
                if (activeIndex !== index) {
                    activeIndex = index;
                    updateCoverflow();
                }
            };
        });

        // Soporte para deslizar el dedo en pantallas táctiles (Móvil)
        let touchStartX = 0;
        track.addEventListener('touchstart', (e) => touchStartX = e.touches[0].clientX, {passive: true});
        track.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) { // Umbral de deslizamiento
                if (diff > 0 && activeIndex < cards.length - 1) activeIndex++;
                else if (diff < 0 && activeIndex > 0) activeIndex--;
                updateCoverflow();
            }
        }, {passive: true});

        // Inicializar
        updateCoverflow();
        
        // Re-calcular si rotan la pantalla de la tablet/móvil
        window.addEventListener('resize', updateCoverflow);
    }

    // Ejecutar inmediatamente y también cuando todo cargue para asegurar compatibilidad
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCoverflow);
    } else {
        initCoverflow();
    }
})();