// main.js
document.addEventListener('DOMContentLoaded', function () {

    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out-cubic',
        once: true,
        mirror: false,
        offset: 80 // Start animation a bit sooner
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
            576: { slidesPerView: 2, },
            768: { slidesPerView: 2, },
            992: { slidesPerView: 3, },
            1200: { slidesPerView: 4, },
        },
        autoplay: {
            delay: 4500,
            disableOnInteraction: true, // Pauses on user interaction
        },
        grabCursor: true,
        loop: document.querySelectorAll('.product-swiper .swiper-slide').length > 4, // Loop if enough slides
    });

    // Header scroll effect & active nav link
    const header = document.querySelector('.header');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const sections = document.querySelectorAll('section[id]');
    const headerHeight = header ? header.offsetHeight : 70;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);


    function updateHeaderStyle() {
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }

    function updateActiveNavLink() {
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - (headerHeight + 40); // Adjusted offset
            if (window.scrollY >= sectionTop) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            // Check href against currentSectionId, removing '#' from href for comparison
            if (link.getAttribute('href').substring(1) === currentSectionId) {
                link.classList.add('active');
            }
        });
         // If no section is active (e.g., at the very top or bottom beyond sections), activate 'Inicio'
        if (!currentSectionId && window.scrollY < sections[0].offsetTop / 2) {
            const homeLink = document.querySelector('.navbar-nav .nav-link[href="#inicio"]');
            if (homeLink) homeLink.classList.add('active');
        }
    }

    window.addEventListener('scroll', () => {
        updateHeaderStyle();
        updateActiveNavLink();
    });
    updateHeaderStyle(); // Initial check
    updateActiveNavLink(); // Initial check


    // Smooth scroll for navigation links
    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const currentHeaderHeight = header ? header.offsetHeight : 70;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - currentHeaderHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu after click
                const navbarCollapseEl = document.getElementById('navbarNav');
                if (navbarCollapseEl && navbarCollapseEl.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapseEl, { toggle: false });
                    bsCollapse.hide();
                }

                // Manually set active class on click for immediate feedback
                navLinks.forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });


    // Product Modal Logic
    const productModalEl = document.getElementById('productModal');
    if (productModalEl) {
        productModalEl.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const cardElement = button.closest('.product-card');

            const modalTitle = productModalEl.querySelector('#modalTitle');
            const modalImage = productModalEl.querySelector('#modalImage');
            const modalDescription = productModalEl.querySelector('#modalDescription');

            const defaultDescription = "Fruta exótica colombiana de altísima calidad, cosechada en su punto óptimo y manejada con los más altos estándares para asegurar su frescura y sabor incomparable.";
            const defaultImageUrl = modalImage.dataset.defaultImage || "{% static 'img/placeholder_fruit.webp' %}"; // Get from data- attribute or fallback

            if (cardElement) {
                const title = cardElement.querySelector('.card-title').textContent;
                let imageSrc = cardElement.querySelector('img') ? cardElement.querySelector('img').src : defaultImageUrl;
                const description = cardElement.getAttribute('data-descripcion') || defaultDescription;

                modalTitle.textContent = title;
                modalImage.src = (imageSrc && !imageSrc.endsWith('/None') && !imageSrc.includes('undefined')) ? imageSrc : defaultImageUrl;
                modalImage.alt = title;
                modalDescription.textContent = description;
            } else { // Fallback if triggered not from a card
                modalTitle.textContent = "Detalles del Producto";
                modalImage.src = defaultImageUrl;
                modalImage.alt = "Fruta exótica";
                modalDescription.textContent = defaultDescription;
            }
        });

        // Handle "Solicitar Cotización" button in modal
        const quoteButton = productModalEl.querySelector('a[href="#contacto"]');
        if (quoteButton) {
            quoteButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get modal instance and hide it
                const modalInstance = bootstrap.Modal.getInstance(productModalEl);
                modalInstance.hide();
                
                // After modal is hidden, scroll to contact section
                productModalEl.addEventListener('hidden.bs.modal', function scrollToContact() {
                    const contactSection = document.querySelector('#contacto');
                    if (contactSection) {
                        const headerHeight = document.querySelector('.header')?.offsetHeight || 70;
                        const offsetPosition = contactSection.offsetTop - headerHeight;
                        
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                    // Remove this one-time event listener
                    productModalEl.removeEventListener('hidden.bs.modal', scrollToContact);
                }, { once: true });
            });
        }
    }
    // Store default image path in modal image element if needed (optional)
    const modalImageElement = document.getElementById('modalImage');
    if (modalImageElement) {
        // You can set this dynamically if your static path generation in JS is complex
        // modalImageElement.dataset.defaultImage = "{% static 'img/placeholder_fruit.webp' %}";
    }


    // Fruit Search Functionality
    const fruitSearchInput = document.getElementById('fruitSearch');
    const productSlides = document.querySelectorAll('.product-swiper .swiper-slide');
    const swiperWrapper = document.querySelector('.product-swiper .swiper-wrapper');
    const initialNoResultsPlaceholder = document.querySelector('.initial-no-results-placeholder');
    let noResultsMessageDiv = null;

    if (fruitSearchInput && productSwiper && swiperWrapper) {
        fruitSearchInput.addEventListener('input', () => {
            const searchTerm = fruitSearchInput.value.toLowerCase().trim();
            let visibleSlidesCount = 0;

            productSlides.forEach(slide => {
                const card = slide.querySelector('.product-card');
                if (card) { // Process only product slides
                    const title = card.querySelector('.card-title').textContent.toLowerCase();
                    const matchesSearch = title.includes(searchTerm);

                    if (matchesSearch) {
                        slide.style.display = '';
                        visibleSlidesCount++;
                    } else {
                        slide.style.display = 'none';
                    }
                }
            });

            productSwiper.update(); // Update Swiper layout
            if (visibleSlidesCount > 0) productSwiper.slideTo(0,0);


            // Handle "no results" message
            if (noResultsMessageDiv && swiperWrapper.contains(noResultsMessageDiv)) {
                swiperWrapper.removeChild(noResultsMessageDiv);
                noResultsMessageDiv = null;
            }
            if (initialNoResultsPlaceholder) {
                initialNoResultsPlaceholder.style.display = 'none';
            }

            if (visibleSlidesCount === 0 && searchTerm !== "") {
                noResultsMessageDiv = document.createElement('div');
                noResultsMessageDiv.className = 'col-12 text-center py-5';
                noResultsMessageDiv.innerHTML = '<p class="lead">No se encontraron frutas con ese nombre. Intenta otra búsqueda.</p>';
                swiperWrapper.appendChild(noResultsMessageDiv);
            } else if (visibleSlidesCount === 0 && searchTerm === "" && initialNoResultsPlaceholder) {
                // Show initial placeholder if search is cleared and it exists
                 initialNoResultsPlaceholder.style.display = 'block';
            }
        });
    }


    // Message auto-dismiss & manual close
    const messages = document.querySelectorAll('.messages-container .message');
    messages.forEach(message => {
        const closeButton = message.querySelector('.btn-close');

        const dismissTimeout = setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => message.remove(), 500);
        }, 7000); // Auto-dismiss after 7 seconds

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                clearTimeout(dismissTimeout); // Clear auto-dismiss if manually closed
                message.classList.add('fade-out');
                setTimeout(() => message.remove(), 500);
            });
        }
    });

    // Bootstrap Form Validation
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    // Captcha input styling - ensure it gets form-control class if not already applied by Django widget
    const captchaInput = document.querySelector('.captcha-container input[type="text"]#id_captcha_1');
    if (captchaInput && !captchaInput.classList.contains('form-control')) {
        captchaInput.classList.add('form-control');
    }

    // Preloader (Descomentar si se usa)
    /*
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
    });
    */
});