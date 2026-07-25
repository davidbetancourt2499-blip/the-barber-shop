// THE BARBER SHOP - JavaScript Logic

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. CALCULADOR MODULAR DE PRECIOS EN TIEMPO REAL
    // -------------------------------------------------------------
    const checkboxes = document.querySelectorAll('.service-checkbox');
    const totalPriceDisplay = document.getElementById('total-price-display');
    const selectedCountText = document.getElementById('selected-count-text');
    const cards = document.querySelectorAll('.service-checkbox-card');

    function calculateTotal() {
        let total = 0;
        let selectedCount = 0;

        checkboxes.forEach((cb) => {
            const card = cb.closest('.service-checkbox-card');
            const price = parseFloat(cb.getAttribute('data-price')) || 0;

            if (cb.checked) {
                total += price;
                selectedCount++;
                if (card) card.classList.add('checked');
            } else {
                if (card) card.classList.remove('checked');
            }
        });

        // Update Total display with animation effect
        if (totalPriceDisplay) {
            totalPriceDisplay.innerHTML = `$${total.toFixed(2)} <span class="text-sm font-sans font-normal text-gray-400">USD</span>`;
        }

        if (selectedCountText) {
            selectedCountText.textContent = selectedCount === 1 
                ? '1 servicio seleccionado' 
                : `${selectedCount} servicios seleccionados`;
        }
    }

    // Attach listener to all service cards and checkboxes
    cards.forEach((card) => {
        card.addEventListener('click', () => {
            const cb = card.querySelector('.service-checkbox');
            if (cb) {
                cb.checked = !cb.checked;
                calculateTotal();
            }
        });
    });

    checkboxes.forEach((cb) => {
        cb.addEventListener('change', calculateTotal);
    });

    // Run initial calculation on page load
    calculateTotal();

    // -------------------------------------------------------------
    // 2. SELECCIÓN RÁPIDA DESDE TARJETAS DE SERVICIOS
    // -------------------------------------------------------------
    window.selectServiceInCalculator = function(serviceType) {
        // Uncheck all initially
        checkboxes.forEach(cb => {
            cb.checked = false;
        });

        if (serviceType === 'corte') {
            const cb = document.querySelector('input[value="Corte de Cabello General"]');
            if (cb) cb.checked = true;
        } else if (serviceType === 'corte_barba') {
            const cb1 = document.querySelector('input[value="Corte de Cabello General"]');
            const cb2 = document.querySelector('input[value="Perfilado / Afeitado de Barba"]');
            if (cb1) cb1.checked = true;
            if (cb2) cb2.checked = true;
        } else if (serviceType === 'corte_barba_cejas') {
            const cb1 = document.querySelector('input[value="Corte de Cabello General"]');
            const cb2 = document.querySelector('input[value="Perfilado / Afeitado de Barba"]');
            const cb3 = document.querySelector('input[value="Perfilado / Depilado de Cejas"]');
            if (cb1) cb1.checked = true;
            if (cb2) cb2.checked = true;
            if (cb3) cb3.checked = true;
        } else if (serviceType === 'experiencia_total') {
            checkboxes.forEach(cb => cb.checked = true);
        }

        calculateTotal();

        // Scroll smoothly to reservation section
        const bookingSec = document.getElementById('reservas');
        if (bookingSec) {
            bookingSec.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // -------------------------------------------------------------
    // 3. SELECTOR VISUAL DE BLOQUES DE HORA
    // -------------------------------------------------------------
    const timeSlots = document.querySelectorAll('.time-slot-btn');
    const selectedTimeInput = document.getElementById('selected-time');

    timeSlots.forEach((slot) => {
        slot.addEventListener('click', () => {
            timeSlots.forEach(btn => btn.classList.remove('active'));
            slot.classList.add('active');
            if (selectedTimeInput) {
                selectedTimeInput.value = slot.getAttribute('data-time');
            }
        });
    });

    // -------------------------------------------------------------
    // 4. CONFIGURAR FECHA MÍNIMA (HOY) EN PICKER
    // -------------------------------------------------------------
    const dateInput = document.getElementById('client-date');
    if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.min = `${year}-${month}-${day}`;
        dateInput.value = `${year}-${month}-${day}`;
        }

    // -------------------------------------------------------------
    // 5. ENVÍO DE FORMULARIO Y MODAL DE CONFIRMACIÓN
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // Barber Selector radio cards handling & URL parameter pre-selection
    // -------------------------------------------------------------
    const barberRadios = document.querySelectorAll('.barber-radio');
    document.querySelectorAll('.barber-card').forEach((card) => {
        card.addEventListener('click', (e) => {
            // Only handle inline selection if the card doesn't navigate via onclick attribute
            if (!card.hasAttribute('onclick')) {
                const radio = card.querySelector('.barber-radio');
                if (radio) {
                    document.querySelectorAll('.barber-radio').forEach(r => r.checked = false);
                    document.querySelectorAll('.barber-card').forEach(c => c.classList.remove('checked'));
                    radio.checked = true;
                    card.classList.add('checked');
                }
            }
        });
    });

    barberRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('.barber-card').forEach((card) => {
                const r = card.querySelector('.barber-radio');
                if (r && r.checked) {
                    card.classList.add('checked');
                } else {
                    card.classList.remove('checked');
                }
            });
        });
    });

    // Check URL params (e.g., index.html?barbero=douglas#reservas)
    const urlParams = new URLSearchParams(window.location.search);
    const paramBarbero = urlParams.get('barbero');

    if (paramBarbero) {
        document.querySelectorAll('.barber-card').forEach(card => card.classList.remove('checked'));
        document.querySelectorAll('.barber-radio').forEach(r => r.checked = false);

        let selectedRadio = null;
        if (paramBarbero.toLowerCase() === 'douglas') {
            selectedRadio = document.getElementById('barber-douglas');
        } else if (paramBarbero.toLowerCase() === 'cristopher') {
            selectedRadio = document.getElementById('barber-cristopher');
        }

        if (selectedRadio) {
            selectedRadio.checked = true;
            const card = selectedRadio.closest('.barber-card');
            if (card) {
                card.classList.add('checked');
            }
        }

        // Auto scroll to reservation form
        const bookingSec = document.getElementById('reservas');
        if (bookingSec) {
            setTimeout(() => {
                bookingSec.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }
    }

    // -------------------------------------------------------------
    // 5. ENVÍO DE FORMULARIO Y MODAL DE CONFIRMACIÓN
    // -------------------------------------------------------------
    const bookingForm = document.getElementById('booking-form');
    const modal = document.getElementById('confirmation-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalFolio = document.getElementById('modal-folio');
    const modalName = document.getElementById('modal-name');
    const modalBarber = document.getElementById('modal-barber');
    const modalPhone = document.getElementById('modal-phone');
    const modalDateTime = document.getElementById('modal-datetime');
    const modalServicesList = document.getElementById('modal-services-list');
    const modalTotal = document.getElementById('modal-total');
    const whatsappConfirmLink = document.getElementById('whatsapp-confirm-link');

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Gather selected services
            const selectedServices = [];
            let totalAmount = 0;

            checkboxes.forEach((cb) => {
                if (cb.checked) {
                    const price = parseFloat(cb.getAttribute('data-price')) || 0;
                    selectedServices.push({
                        name: cb.value,
                        price: price
                    });
                    totalAmount += price;
                }
            });

            if (selectedServices.length === 0) {
                alert('Por favor selecciona al menos un servicio para tu cita.');
                return;
            }

            const name = document.getElementById('client-name').value.trim();
            const phone = document.getElementById('client-phone').value.trim();
            const date = document.getElementById('client-date').value;
            const time = selectedTimeInput ? selectedTimeInput.value : '';

            if (!time) {
                alert('Por favor selecciona un bloque de hora para tu cita.');
                return;
            }

            // Selected Barber
            const selectedBarberRadio = document.querySelector('input[name="barber"]:checked');
            const barberName = selectedBarberRadio ? selectedBarberRadio.value : 'Sin preferencia / Cualquiera disponible';
            const barberPhone = selectedBarberRadio ? (selectedBarberRadio.getAttribute('data-phone') || '525551234567') : '525551234567';

            // Generate unique Folio
            const randomFolio = 'TBS-' + Math.floor(10000 + Math.random() * 90000);

            // Fill Modal details
            if (modalFolio) modalFolio.textContent = randomFolio;
            if (modalName) modalName.textContent = name;
            if (modalBarber) modalBarber.textContent = barberName;
            if (modalPhone) modalPhone.textContent = phone;
            if (modalDateTime) modalDateTime.textContent = `${date} a las ${time}`;
            if (modalTotal) modalTotal.textContent = `$${totalAmount.toFixed(2)} USD`;

            // Populate services list inside modal
            if (modalServicesList) {
                modalServicesList.innerHTML = '';
                selectedServices.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'flex justify-between items-center text-xs border-b border-dark-800 pb-1';
                    li.innerHTML = `<span><i class="fa-solid fa-check text-gold-500 mr-2"></i>${item.name}</span> <span class="text-gold-400 font-bold">$${item.price} USD</span>`;
                    modalServicesList.appendChild(li);
                });
            }

            // Create pre-filled WhatsApp link based on chosen barber
            const serviceNamesText = selectedServices.map(s => `• ${s.name} ($${s.price} USD)`).join('\n');
            let greeting = `¡Hola ${barberName}!`;
            if (barberName.includes('Sin preferencia')) {
                greeting = `¡Hola THE BARBER SHOP!`;
            }

            const waMessage = `${greeting} Quiero reservar una cita en THE BARBER SHOP:\n\n*Folio:* ${randomFolio}\n*Cliente:* ${name}\n*Barbero Elegido:* ${barberName}\n*Teléfono:* ${phone}\n*Fecha:* ${date}\n*Hora:* ${time}\n\n*Servicios Elegidos:*\n${serviceNamesText}\n\n*Total a pagar:* $${totalAmount.toFixed(2)} USD`;
            
            if (whatsappConfirmLink) {
                whatsappConfirmLink.href = `https://wa.me/${barberPhone}?text=${encodeURIComponent(waMessage)}`;
            }

            // Show Modal with animation
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('show');
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('show');
            }
        });
    }

    // Close modal on clicking backdrop
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('show');
            }
        });
    }

    // -------------------------------------------------------------
    // 6. MENÚ HAMBURGUESA MÓVIL
    // -------------------------------------------------------------
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            if (menuIcon) {
                if (mobileMenu.classList.contains('hidden')) {
                    menuIcon.className = 'fa-solid fa-bars text-2xl';
                } else {
                    menuIcon.className = 'fa-solid fa-xmark text-2xl text-gold-500';
                }
            }
        });

        // Close menu when clicking links
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                if (menuIcon) menuIcon.className = 'fa-solid fa-bars text-2xl';
            });
        });
    }

    // -------------------------------------------------------------
    // 7. LIGHTBOX DE GALERÍA DE FOTOS
    // -------------------------------------------------------------
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const closeLightboxBtn = document.getElementById('close-lightbox-btn');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const title = item.querySelector('h4');
            if (img && lightbox && lightboxImg) {
                lightboxImg.src = img.src;
                if (lightboxTitle && title) lightboxTitle.textContent = title.textContent;
                lightbox.classList.remove('hidden');
                lightbox.classList.add('flex');
            }
        });
    });

    if (closeLightboxBtn && lightbox) {
        closeLightboxBtn.addEventListener('click', () => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.add('hidden');
                lightbox.classList.remove('flex');
            }
        });
    }

    // -------------------------------------------------------------
    // 8. HIGHLIGHT ACTIVE NAV LINK ON SCROLL (SCROLLSPY)
    // -------------------------------------------------------------
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = window.scrollY + 120;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});
