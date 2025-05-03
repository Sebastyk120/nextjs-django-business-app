// Initialize AOS
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    mirror: false
});

// Initialize Swiper carousel
const productSwiper = new Swiper('.product-swiper', {
    slidesPerView: 1,
    spaceBetween: 30,
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    breakpoints: {
        640: {
            slidesPerView: 2,
        },
        992: {
            slidesPerView: 3,
        },
        1200: {
            slidesPerView: 4,
        },
    },
    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
    },
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const headerOffset = document.querySelector('.header').offsetHeight;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Close mobile menu after click
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
        }
    });
});

// Header scroll effect
const header = document.querySelector('.header');
let lastScroll = 0;

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

// Product Modal
const productModal = document.getElementById('productModal');
if (productModal) {
    productModal.addEventListener('show.bs.modal', event => {
        const button = event.relatedTarget;
        const frutaId = button.getAttribute('data-fruta-id');
        const cardElement = button.closest('.product-card');
        
        const modalTitle = document.getElementById('modalTitle');
        const modalImage = document.getElementById('modalImage');
        const modalDescription = document.getElementById('modalDescription');
        
        if (cardElement) {
            const title = cardElement.querySelector('.card-title').textContent;
            const image = cardElement.querySelector('img') ? cardElement.querySelector('img').src : '';
            const description = cardElement.getAttribute('data-descripcion') || 
                               "Fruta exótica colombiana de altísima calidad, cosechada en el momento perfecto y manejada con los más altos estándares para asegurar su frescura y sabor incomparable.";
            
            modalTitle.textContent = title;
            modalImage.src = image;
            modalImage.alt = title;
            modalDescription.textContent = description;
        }
    });
}

// Fruit Search
const fruitSearch = document.getElementById('fruitSearch');
if (fruitSearch) {
    fruitSearch.addEventListener('input', () => {
        const searchTerm = fruitSearch.value.toLowerCase();
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const matchesSearch = title.includes(searchTerm);
            const cardContainer = card.closest('.swiper-slide');
            
            if (matchesSearch) {
                cardContainer.style.display = '';
                card.style.animation = 'fadeInUp 0.6s ease forwards';
            } else {
                cardContainer.style.display = 'none';
            }
        });
        
        // Update Swiper to account for filtered slides
        if (productSwiper) {
            productSwiper.update();
        }
    });
}

// Message auto-dismiss
const messages = document.querySelectorAll('.message');
if (messages.length > 0) {
    messages.forEach(message => {
        setTimeout(() => {
            message.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 5000);
    });
}

// Form validation with improved feedback
const contactForm = document.querySelector('form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        const inputs = contactForm.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('is-invalid');
                
                // Create or update feedback message
                let feedback = input.nextElementSibling;
                if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                    feedback = document.createElement('div');
                    feedback.classList.add('invalid-feedback');
                    input.parentNode.insertBefore(feedback, input.nextSibling);
                }
                feedback.textContent = 'Este campo es requerido';
            } else {
                input.classList.remove('is-invalid');
                // Remove any existing feedback
                const feedback = input.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.remove();
                }
            }
        });
        
        if (!isValid) {
            e.preventDefault();
        }
    });

    // Clear validation errors when user begins typing
    contactForm.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('input', () => {
            field.classList.remove('is-invalid');
            const feedback = field.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.remove();
            }
        });
    });
}

// Mobile menu toggle
const navbarToggler = document.querySelector('.navbar-toggler');
const navbarCollapse = document.querySelector('.navbar-collapse');

if (navbarToggler && navbarCollapse) {
    navbarToggler.addEventListener('click', () => {
        navbarCollapse.classList.toggle('show');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navbarToggler.contains(e.target) && !navbarCollapse.contains(e.target)) {
            navbarCollapse.classList.remove('show');
        }
    });
}

// WhatsApp button effects
const whatsappButton = document.querySelector('.whatsapp-button');
if (whatsappButton) {
    whatsappButton.addEventListener('mouseenter', () => {
        whatsappButton.style.transform = 'scale(1.1) rotate(10deg)';
    });
    
    whatsappButton.addEventListener('mouseleave', () => {
        whatsappButton.style.transform = 'scale(1) rotate(0deg)';
    });
}

// Add custom slideOut animation
document.head.insertAdjacentHTML('beforeend', `
<style>
@keyframes slideOutRight {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(50px);
    }
}
</style>
`);

// Ensure captcha has correct styling and behavior
document.addEventListener('DOMContentLoaded', function() {
    // Find captcha elements and improve them
    const captchaImg = document.querySelector('.captcha img');
    const captchaInput = document.querySelector('.captcha input[type="text"]');
    
    if (captchaImg && captchaInput) {
        // Add specific ID to ensure label works correctly
        captchaInput.id = 'id_captcha_1';
        
        // Add appropriate classes for styling
        captchaImg.classList.add('img-fluid');
        captchaInput.classList.add('form-control', 'mt-2');
    }
});