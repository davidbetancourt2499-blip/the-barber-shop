// THE BARBER SHOP - Shared Booking Logic
// Works for index.html (with barber selector), douglas.html, cristopher.html

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. SERVICE CALCULATOR
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

        if (totalPriceDisplay) {
            totalPriceDisplay.innerHTML = `$${total.toFixed(2)} <span class="text-sm font-sans font-normal text-gray-400">USD</span>`;
        }

        if (selectedCountText) {
            selectedCountText.textContent = selectedCount === 1
                ? '1 servicio seleccionado'
                : `${selectedCount} servicios seleccionados`;
        }
    }

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

    calculateTotal();

    // -------------------------------------------------------------
    // 2. QUICK SERVICE SELECTION (from service cards section)
    // -------------------------------------------------------------
    window.selectServiceInCalculator = function(serviceType) {
        checkboxes.forEach(cb => { cb.checked = false; });

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

        const bookingSec = document.getElementById('reservas');
        if (bookingSec) {
            bookingSec.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // -------------------------------------------------------------
    // 3. TIME SLOT SELECTOR & PREFERENCE TOGGLE
    // -------------------------------------------------------------
    const timeSlots = document.querySelectorAll('.time-slot-btn');
    const selectedTimeInput = document.getElementById('selected-time');
    const timeSlotsSection = document.getElementById('time-slots-section');
    const sinPreferenciaSection = document.getElementById('sin-preferencia-section');
    const timePreferenceBtns = document.querySelectorAll('.time-preference-btn');
    const selectedPreferenceInput = document.getElementById('selected-preference');

    timeSlots.forEach((slot) => {
        slot.addEventListener('click', () => {
            timeSlots.forEach(btn => btn.classList.remove('active'));
            slot.classList.add('active');
            if (selectedTimeInput) {
                selectedTimeInput.value = slot.getAttribute('data-time');
            }
        });
    });

    // Preference buttons (Mañana/Tarde/Noche)
    timePreferenceBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const wasActive = btn.classList.contains('active');
            timePreferenceBtns.forEach(b => b.classList.remove('active'));
            if (!wasActive) {
                btn.classList.add('active');
                if (selectedPreferenceInput) {
                    selectedPreferenceInput.value = btn.getAttribute('data-preference');
                }
            } else {
                if (selectedPreferenceInput) {
                    selectedPreferenceInput.value = '';
                }
            }
        });
    });

    function showTimeSlots() {
        if (timeSlotsSection) timeSlotsSection.classList.remove('hidden');
        if (sinPreferenciaSection) sinPreferenciaSection.classList.add('hidden');
    }

    function showSinPreferencia() {
        if (timeSlotsSection) timeSlotsSection.classList.add('hidden');
        if (sinPreferenciaSection) sinPreferenciaSection.classList.remove('hidden');
    }

    // -------------------------------------------------------------
    // 4. DATE PICKER MIN DATE
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
    // 5. BARBER SELECTION (index.html only)
    // -------------------------------------------------------------
    const bookingForm = document.getElementById('booking-form');
    const step3Wrapper = document.getElementById('step-3-wrapper');
    const submitSection = document.getElementById('submit-section');
    const servicesSection = document.getElementById('services-section');
    const barberCards = document.querySelectorAll('.barber-card');
    const barberRadios = document.querySelectorAll('.barber-radio');

    if (barberCards.length > 0) {
        barberCards.forEach((card) => {
            card.addEventListener('click', () => {
                if (!card.hasAttribute('onclick')) {
                    const radio = card.querySelector('.barber-radio');
                    if (radio) {
                        barberRadios.forEach(r => r.checked = false);
                        barberCards.forEach(c => c.classList.remove('checked'));
                        radio.checked = true;
                        card.classList.add('checked');
                        unlockStep3();
                        toggleTimeSection(radio.value);
                    }
                }
            });
        });

        barberRadios.forEach((radio) => {
            radio.addEventListener('change', () => {
                barberCards.forEach((card) => {
                    const r = card.querySelector('.barber-radio');
                    if (r && r.checked) {
                        card.classList.add('checked');
                    } else {
                        card.classList.remove('checked');
                    }
                });
            });
        });
    }

    function toggleTimeSection(barberValue) {
        if (barberValue && barberValue.includes('Sin preferencia')) {
            showSinPreferencia();
        } else {
            showTimeSlots();
        }
    }

    function unlockStep3() {
        if (step3Wrapper) step3Wrapper.classList.remove('hidden');
        if (submitSection) submitSection.classList.remove('hidden');
        if (servicesSection) servicesSection.classList.remove('hidden');
    }

    function lockStep3() {
        if (step3Wrapper) step3Wrapper.classList.add('hidden');
        if (submitSection) submitSection.classList.add('hidden');
        if (servicesSection) servicesSection.classList.add('hidden');
    }

    // If no barber selector exists (douglas/cristopher pages), step 3 is always unlocked
    if (barberCards.length === 0) {
        unlockStep3();
    } else {
        lockStep3();
    }

    // -------------------------------------------------------------
    // 6. FORM SUBMISSION & MODAL
    // -------------------------------------------------------------
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

            const selectedServices = [];
            let totalAmount = 0;

            checkboxes.forEach((cb) => {
                if (cb.checked) {
                    const price = parseFloat(cb.getAttribute('data-price')) || 0;
                    selectedServices.push({ name: cb.value, price: price });
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
            const preference = selectedPreferenceInput ? selectedPreferenceInput.value : '';

            // Determine barber: from radio selection or hidden input
            let barberName, barberPhone;
            const selectedBarberRadio = document.querySelector('input[name="barber"]:checked');
            const hiddenBarber = document.getElementById('hidden-barber-name');
            const hiddenPhone = document.getElementById('hidden-barber-phone');

            if (selectedBarberRadio) {
                barberName = selectedBarberRadio.value;
                barberPhone = selectedBarberRadio.getAttribute('data-phone') || '525551234567';
            } else if (hiddenBarber) {
                barberName = hiddenBarber.value;
                barberPhone = hiddenPhone ? hiddenPhone.value : '525551234567';
            } else {
                barberName = 'Sin preferencia / Cualquiera disponible';
                barberPhone = '525551234567';
            }

            const isSinPreferencia = barberName.includes('Sin preferencia');

            // Validate time only if specific barber selected
            if (!isSinPreferencia && !time) {
                alert('Por favor selecciona un bloque de hora para tu cita.');
                return;
            }

            const randomFolio = 'TBS-' + Math.floor(10000 + Math.random() * 90000);

            // Build date/time display for modal
            let dateTimeText;
            if (isSinPreferencia) {
                dateTimeText = preference
                    ? `${date} — Horario: por confirmar (${preference})`
                    : `${date} — Horario: por confirmar (según disponibilidad)`;
            } else {
                dateTimeText = `${date} a las ${time}`;
            }

            // Build WhatsApp time text
            let waTimeText;
            if (isSinPreferencia) {
                waTimeText = preference
                    ? `Por confirmar (preferencia: ${preference})`
                    : 'Por confirmar (según disponibilidad)';
            } else {
                waTimeText = time;
            }

            if (modalFolio) modalFolio.textContent = randomFolio;
            if (modalName) modalName.textContent = name;
            if (modalBarber) modalBarber.textContent = barberName;
            if (modalPhone) modalPhone.textContent = phone;
            if (modalDateTime) modalDateTime.textContent = dateTimeText;
            if (modalTotal) modalTotal.textContent = `$${totalAmount.toFixed(2)} USD`;

            if (modalServicesList) {
                modalServicesList.innerHTML = '';
                selectedServices.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'flex justify-between items-center text-xs border-b border-dark-800 pb-1';
                    li.innerHTML = `<span><i class="fa-solid fa-check text-gold-500 mr-2"></i>${item.name}</span> <span class="text-gold-400 font-bold">$${item.price} USD</span>`;
                    modalServicesList.appendChild(li);
                });
            }

            const serviceNamesText = selectedServices.map(s => `• ${s.name} ($${s.price} USD)`).join('\n');
            let greeting = `¡Hola ${barberName}!`;
            if (isSinPreferencia) {
                greeting = `¡Hola THE BARBER SHOP!`;
            }

            const waMessage = `${greeting} Quiero reservar una cita en THE BARBER SHOP:\n\n*Folio:* ${randomFolio}\n*Cliente:* ${name}\n*Barbero Elegido:* ${barberName}\n*Teléfono:* ${phone}\n*Fecha:* ${date}\n*Hora:* ${waTimeText}\n\n*Servicios Elegidos:*\n${serviceNamesText}\n\n*Total a pagar:* $${totalAmount.toFixed(2)} USD`;

            if (whatsappConfirmLink) {
                whatsappConfirmLink.href = `https://wa.me/${barberPhone}?text=${encodeURIComponent(waMessage)}`;
            }

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

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('show');
            }
        });
    }

    // -------------------------------------------------------------
    // 7. SUBMIT BUTTON VALIDATION (enabled when all fields filled)
    // -------------------------------------------------------------
    const submitBtn = document.getElementById('submit-btn');
    const clientName = document.getElementById('client-name');
    const clientPhone = document.getElementById('client-phone');
    const clientEmail = document.getElementById('client-email');
    const clientDate = document.getElementById('client-date');

    function checkFormComplete() {
        if (!submitBtn) return;
        const nameOk = clientName && clientName.value.trim().length > 0;
        const phoneOk = clientPhone && clientPhone.value.trim().length > 0;
        const emailOk = clientEmail && clientEmail.value.trim().length > 0 && clientEmail.value.includes('@');
        const dateOk = clientDate && clientDate.value.length > 0;
        const servicesOk = Array.from(checkboxes).some(cb => cb.checked);

        if (nameOk && phoneOk && emailOk && dateOk && servicesOk) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('bg-gray-700', 'text-gray-500', 'cursor-not-allowed');
            submitBtn.classList.add('bg-gradient-to-r', 'from-gold-400', 'via-gold-500', 'to-gold-600', 'text-black', 'hover:from-gold-300', 'hover:to-gold-500', 'shadow-[0_0_30px_rgba(212,175,55,0.5)]', 'hover:scale-105', 'active:scale-95');
            submitBtn.querySelector('i').classList.remove('fa-lock');
            submitBtn.querySelector('i').classList.add('fa-check-circle');
        } else {
            submitBtn.disabled = true;
            submitBtn.classList.add('bg-gray-700', 'text-gray-500', 'cursor-not-allowed');
            submitBtn.classList.remove('bg-gradient-to-r', 'from-gold-400', 'via-gold-500', 'to-gold-600', 'text-black', 'hover:from-gold-300', 'hover:to-gold-500', 'shadow-[0_0_30px_rgba(212,175,55,0.5)]', 'hover:scale-105', 'active:scale-95');
            submitBtn.querySelector('i').classList.add('fa-lock');
            submitBtn.querySelector('i').classList.remove('fa-check-circle');
        }
    }

    [clientName, clientPhone, clientEmail, clientDate].forEach(input => {
        if (input) input.addEventListener('input', checkFormComplete);
    });
    checkboxes.forEach(cb => cb.addEventListener('change', checkFormComplete));

    // -------------------------------------------------------------
    // 8. MOBILE MENU (index.html only)
    // -------------------------------------------------------------
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            if (menuIcon) {
                menuIcon.className = mobileMenu.classList.contains('hidden')
                    ? 'fa-solid fa-bars text-2xl'
                    : 'fa-solid fa-xmark text-2xl text-gold-500';
            }
        });

        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                if (menuIcon) menuIcon.className = 'fa-solid fa-bars text-2xl';
            });
        });
    }

    // -------------------------------------------------------------
    // 8. GALLERY LIGHTBOX (index.html only)
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
    // 9. SCROLLSPY (index.html only)
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
