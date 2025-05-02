// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });

        // Cerrar el menú móvil al hacer clic en un enlace
        const nav = document.querySelector('.nav');
        const menuButton = document.querySelector('.mobile-menu-button');
        if (nav && nav.classList.contains('active') && menuButton) {
            nav.classList.remove('active');
            menuButton.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
});

// Header scroll effect
const header = document.querySelector('.header');
let lastScroll = 0;

// Asegurar que el header sea visible inicialmente
document.addEventListener('DOMContentLoaded', () => {
    header.classList.add('scroll-up');
    header.style.transform = 'translateY(0)';
});

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        // Scroll Down
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        // Scroll Up
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

// Add fade-in animation to elements when they come into view
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Form submission handling
const contactForm = document.querySelector('.contacto-form form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // Show loading state
        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Enviando...';
        submitButton.disabled = true;
        
        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            // Reset form
            this.reset();
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = '¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.';
            this.appendChild(successMessage);
            
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // Remove success message after 5 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 5000);
        }, 1500);
    });
}

// Mobile menu toggle
function createMobileMenu() {
    const headerContainer = document.querySelector('.header .container');
    const nav = document.querySelector('.nav');
    const existingButton = document.querySelector('.mobile-menu-button');

    if (window.innerWidth <= 768) {
        if (!existingButton) {
            // Crear botón móvil
            const menuButton = document.createElement('button');
            menuButton.className = 'mobile-menu-button';
            menuButton.setAttribute('aria-label', 'Menú');
            menuButton.innerHTML = '<i class="fas fa-bars"></i>';
            
            // Insertar el botón después del logo
            const logo = headerContainer.querySelector('.logo');
            if (logo) {
                headerContainer.insertBefore(menuButton, logo.nextSibling);
            }

            // Toggle menú
            menuButton.addEventListener('click', function(e) {
                e.stopPropagation();
                nav.classList.toggle('active');
                this.innerHTML = nav.classList.contains('active')
                    ? '<i class="fas fa-times"></i>'
                    : '<i class="fas fa-bars"></i>';
            });
        }
    } else {
        // Pantallas grandes: eliminar botón si existe
        if (existingButton) {
            existingButton.remove();
            nav.classList.remove('active');
        }
    }
}

// Cerrar al clicar fuera del menú
document.addEventListener('click', (e) => {
    const nav = document.querySelector('.nav');
    const menuButton = document.querySelector('.mobile-menu-button');
    
    if (nav && nav.classList.contains('active') && menuButton) {
        if (!nav.contains(e.target) && !menuButton.contains(e.target)) {
            nav.classList.remove('active');
            menuButton.innerHTML = '<i class="fas fa-bars"></i>';
        }
    }
});

// Initialize mobile menu on DOM content loaded
document.addEventListener('DOMContentLoaded', createMobileMenu);

// Recreate mobile menu on window resize
window.addEventListener('resize', createMobileMenu);

// Add hover effect to product cards
document.querySelectorAll('.producto-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// Enhanced parallax effect for hero section
const heroSection = document.querySelector('.hero');
const heroBackground = document.querySelector('.hero-background');
const heroImage = document.querySelector('.hero-image');

if (heroSection) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const scrollRate = scrolled * 0.3;
        
        // Parallax for background
        heroBackground.style.transform = `translateY(${scrollRate}px)`;
        
        // Fade out effect as you scroll
        const opacity = 1 - (scrolled / (heroSection.offsetHeight / 2));
        heroSection.style.opacity = opacity > 0 ? opacity : 0;
    });
    
    // Add mouse movement parallax effect to hero image only
    heroSection.addEventListener('mousemove', (e) => {
        const xPos = (e.clientX / window.innerWidth - 0.5) * 20;
        const yPos = (e.clientY / window.innerHeight - 0.5) * 20;
        
        if (heroImage) {
            heroImage.style.transform = `perspective(1000px) rotateY(${xPos * 0.05}deg) rotateX(${-yPos * 0.05}deg)`;
        }
    });
}

// Scroll indicator click handler
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const productosSection = document.querySelector('#productos');
        if (productosSection) {
            productosSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// Animated heading text effect
const animateText = () => {
    const heading = document.querySelector('.animated-heading');
    if (heading) {
        const text = heading.textContent;
        heading.textContent = '';
        
        // Add each letter with a delay
        for (let i = 0; i < text.length; i++) {
            const span = document.createElement('span');
            span.textContent = text[i];
            span.style.animationDelay = `${i * 0.05}s`;
            span.style.opacity = '0';
            span.style.animation = 'fadeInUp 0.5s forwards';
            heading.appendChild(span);
        }
    }
};

// Initialize text animation when page loads
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(animateText, 500);
});

// Add parallax effect to hero section
const hero = document.querySelector('.hero');
if (hero) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        hero.style.backgroundPositionY = -(scrolled * 0.5) + 'px';
    });
}

// Modal de Productos
const modal = document.getElementById('productModal');
const closeModal = document.querySelector('.close-modal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');

// Función para abrir el modal
function openModal(frutaId) {
    const frutaCard = document.querySelector(`[data-fruta-id="${frutaId}"]`);
    const frutaNombre = frutaCard.querySelector('h3').textContent;
    const frutaImagen = frutaCard.querySelector('.producto-imagen img');
    const frutaDescripcion = frutaCard.dataset.descripcion || "Descripción detallada de la fruta...";
    
    // Actualizar el contenido del modal
    modalTitle.textContent = frutaNombre;
    modalDescription.textContent = frutaDescripcion;
    
    // Actualizar la imagen del modal
    if (frutaImagen) {
        modalImage.src = frutaImagen.src;
        modalImage.alt = frutaNombre;
    }
    
    // Mostrar el modal con animación
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Función para cerrar el modal
function closeProductModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Event Listeners para el modal
document.querySelectorAll('.producto-card').forEach(card => {
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('info-button')) return;
        const frutaId = card.dataset.frutaId;
        openModal(frutaId);
    });
});

closeModal.addEventListener('click', closeProductModal);

// Cerrar modal al hacer clic fuera del contenido
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeProductModal();
    }
});

// Cerrar modal con la tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeProductModal();
    }
});

// Carrusel de Productos
const carousel = document.querySelector('.productos-carousel');
const prevButton = document.querySelector('.carousel-button.prev');
const nextButton = document.querySelector('.carousel-button.next');

if (carousel && prevButton && nextButton) {
    const scrollAmount = 300; // Cantidad de scroll por clic

    prevButton.addEventListener('click', () => {
        carousel.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    nextButton.addEventListener('click', () => {
        carousel.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    // Actualizar visibilidad de botones según la posición del scroll
    const updateButtonVisibility = () => {
        const { scrollLeft, scrollWidth, clientWidth } = carousel;
        prevButton.style.display = scrollLeft > 0 ? 'flex' : 'none';
        nextButton.style.display = scrollLeft < scrollWidth - clientWidth - 1 ? 'flex' : 'none';
    };

    carousel.addEventListener('scroll', updateButtonVisibility);
    window.addEventListener('resize', updateButtonVisibility);
    updateButtonVisibility(); // Estado inicial
}

// Búsqueda de Productos
const fruitSearch = document.getElementById('fruitSearch');
const productCards = document.querySelectorAll('.producto-card');

if (fruitSearch && productCards.length > 0) {
    fruitSearch.addEventListener('input', () => {
        const searchTerm = fruitSearch.value.toLowerCase();
        
        productCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const matchesSearch = title.includes(searchTerm);
            
            if (matchesSearch) {
                card.style.display = 'flex';
                card.style.animation = 'fadeIn 0.5s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Lazy Loading para imágenes de productos
const lazyLoadImages = () => {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                    img.classList.add('loaded');
                }
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.1
    });

    // Observar todas las imágenes de productos
    document.querySelectorAll('.producto-imagen img').forEach(img => {
        if (!img.classList.contains('loaded')) {
            imageObserver.observe(img);
        }
    });
};

// Inicializar lazy loading cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    lazyLoadImages();
    
    // Observar cambios en el carrusel para nuevas imágenes
    const carouselObserver = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            lazyLoadImages();
        });
    });

    const carousel = document.querySelector('.productos-carousel');
    if (carousel) {
        carouselObserver.observe(carousel, {
            childList: true,
            subtree: true
        });
    }
});