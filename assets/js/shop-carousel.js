document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('taller');
    const container = document.getElementById('coverflow-shop');
    if (!container || !section) return;

    const track = container.querySelector('.coverflow-track');
    const cards = Array.from(container.querySelectorAll('.coverflow-card'));
    const btnPrev = container.querySelector('.ctrl-btn.prev');
    const btnNext = container.querySelector('.ctrl-btn.next');
    
    let activeIndex = 0;

    function updateCoverflow() {
        // 1. Actualizar el fondo de la sección principal
        const activeCard = cards[activeIndex];
        if (activeCard) {
            const bgImage = activeCard.getAttribute('data-bg');
            if (bgImage) {
                section.style.backgroundImage = `url('${bgImage}')`;
            }
        }

        // 2. Calcular posiciones, rotación y profundidad 3D
        cards.forEach((card, i) => {
            const offset = i - activeIndex;
            
            if (offset === 0) {
                // Tarjeta Activa (De frente y al centro)
                card.style.transform = `translateX(0) rotateY(0deg) translateZ(120px)`;
                card.style.opacity = '1';
                card.style.zIndex = '10';
                card.classList.add('active');
            } else if (offset < 0) {
                // Tarjetas a la izquierda (Rotadas hacia la derecha)
                // Hacemos que se encadenen multiplicando el offset por la separación espacial
                const translateX = (offset * 140) - 80; 
                card.style.transform = `translateX(${translateX}px) rotateY(45deg) translateZ(0)`;
                card.style.opacity = Math.abs(offset) > 2 ? '0' : '0.6'; // Difuminar las muy lejanas
                card.style.zIndex = `${10 - Math.abs(offset)}`;
                card.classList.remove('active');
            } else {
                // Tarjetas a la derecha (Rotadas hacia la izquierda)
                const translateX = (offset * 140) + 80;
                card.style.transform = `translateX(${translateX}px) rotateY(-45deg) translateZ(0)`;
                card.style.opacity = Math.abs(offset) > 2 ? '0' : '0.6';
                card.style.zIndex = `${10 - Math.abs(offset)}`;
                card.classList.remove('active');
            }
        });
    }

    // Eventos para botones
    btnPrev.addEventListener('click', () => {
        if (activeIndex > 0) {
            activeIndex--;
            updateCoverflow();
        } else {
            // Efecto bucle opcional: si llega al inicio va al final
            activeIndex = cards.length - 1;
            updateCoverflow();
        }
    });

    btnNext.addEventListener('click', () => {
        if (activeIndex < cards.length - 1) {
            activeIndex++;
            updateCoverflow();
        } else {
            // Efecto bucle opcional: si llega al final regresa al inicio
            activeIndex = 0;
            updateCoverflow();
        }
    });

    // Permitir hacer click directo en las tarjetas laterales para seleccionarlas
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            if (activeIndex !== index) {
                activeIndex = index;
                updateCoverflow();
            }
        });
    });

    // Inicializar el carrusel en la primera carga
    updateCoverflow();
});