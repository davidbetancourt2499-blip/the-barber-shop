/**
 * THE BARBER SHOP — Booking Form Component
 * Modern, accessible, validated booking form
 */

import { Form } from '../components/index.js';
import { generateFolio, buildWhatsAppMessage, getBarberPhone, ServicePrices, calculateTotal } from '../types/api.js';

export class BookingForm extends Form {
  static selectors = {
    ...Form.selectors,
    serviceCard: '[data-service-card]',
    serviceCheckbox: '[data-service-checkbox]',
    timeSlot: '[data-time-slot]',
    preferenceBtn: '[data-preference-btn]',
    barberCard: '[data-barber-card]',
    stepWrapper: '[data-step]',
    totalDisplay: '[data-total]',
    countDisplay: '[data-count]'
  };

  get defaultOptions() {
    return {
      ...super.defaultOptions,
      onSubmit: this.handleBookingSubmit.bind(this)
    };
  }

  init() {
    super.init();
    this.selectedServices = new Set();
    this.selectedTime = null;
    this.selectedPreference = null;
    this.selectedBarber = null;
    this.bindServiceCards();
    this.bindTimeSlots();
    this.bindPreferences();
    this.bindBarberCards();
    this.updateTotal();
    this.initStepVisibility();
  }

  bindServiceCards() {
    const cards = this.element.querySelectorAll(BookingForm.selectors.serviceCard);
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button, input')) return;
        const checkbox = card.querySelector(BookingForm.selectors.serviceCheckbox);
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          this.toggleService(checkbox.value, checkbox.checked);
        }
      });

      const checkbox = card.querySelector(BookingForm.selectors.serviceCheckbox);
      checkbox?.addEventListener('change', () => this.toggleService(checkbox.value, checkbox.checked));
    });
  }

  toggleService(service, checked) {
    if (checked) this.selectedServices.add(service);
    else this.selectedServices.delete(service);
    this.updateTotal();
    this.updateStep3Visibility();
    this.validateField(this.element.querySelector('[name="services"]') || { name: 'services' });
  }

  bindTimeSlots() {
    const slots = this.element.querySelectorAll(BookingForm.selectors.timeSlot);
    slots.forEach(slot => {
      slot.addEventListener('click', () => {
        slots.forEach(s => s.classList.remove('active'));
        slot.classList.add('active');
        this.selectedTime = slot.dataset.time;
        this.updateHiddenInput('selected-time', this.selectedTime);
      });
    });
  }

  bindPreferences() {
    const btns = this.element.querySelectorAll(BookingForm.selectors.preferenceBtn);
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const wasActive = btn.classList.contains('active');
        btns.forEach(b => b.classList.remove('active'));
        if (!wasActive) {
          btn.classList.add('active');
          this.selectedPreference = btn.dataset.preference;
        } else {
          this.selectedPreference = null;
        }
        this.updateHiddenInput('selected-preference', this.selectedPreference);
      });
    });
  }

  bindBarberCards() {
    const cards = this.element.querySelectorAll(BookingForm.selectors.barberCard);
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        if (card.dataset.nav) {
          window.location.href = card.dataset.nav;
          return;
        }
        const radio = card.querySelector('input[name="barber"]');
        if (!radio) return;

        // Toggle off if same barber
        if (radio.checked) {
          radio.checked = false;
          card.classList.remove('checked');
          this.selectedBarber = null;
          this.updateStepVisibility();
          return;
        }

        // Select new barber
        cards.forEach(c => c.classList.remove('checked'));
        this.element.querySelectorAll('input[name="barber"]').forEach(r => r.checked = false);
        radio.checked = true;
        card.classList.add('checked');
        this.selectedBarber = radio.value;
        this.updateHiddenInput('hidden-barber-name', radio.value);
        this.updateHiddenInput('hidden-barber-phone', radio.dataset.phone);
        this.updateStepVisibility();
      });
    });
  }

  updateHiddenInput(name, value) {
    const input = this.element.querySelector(`[name="${name}"]`);
    if (input) input.value = value || '';
  }

  initStepVisibility() {
    const hasBarberSelection = this.element.querySelectorAll(BookingForm.selectors.barberCard).length > 0;
    if (!hasBarberSelection) {
      this.showStep(3);
      this.showServicesSection();
    }
  }

  updateStepVisibility() {
    const isAny = this.selectedBarber?.includes('Sin preferencia');
    const timeSection = this.element.querySelector('[data-time-section]');
    const preferenceSection = this.element.querySelector('[data-preference-section]');
    const servicesSection = this.element.querySelector('[data-services-section]');

    if (isAny) {
      timeSection?.classList.add('hidden');
      preferenceSection?.classList.remove('hidden');
    } else {
      timeSection?.classList.remove('hidden');
      preferenceSection?.classList.add('hidden');
    }

    this.showStep(3);
    this.showServicesSection();
  }

  updateStep3Visibility() {
    if (this.selectedServices.size > 0) {
      this.showStep(3);
      this.showServicesSection();
    } else {
      this.hideStep(3);
      this.hideServicesSection();
    }
  }

  showStep(step) {
    const wrapper = this.element.querySelector(`[data-step="${step}"]`);
    wrapper?.classList.remove('hidden');
  }

  hideStep(step) {
    const wrapper = this.element.querySelector(`[data-step="${step}"]`);
    wrapper?.classList.add('hidden');
  }

  showServicesSection() {
    const section = this.element.querySelector('[data-services-section]');
    section?.classList.remove('hidden');
  }

  hideServicesSection() {
    const section = this.element.querySelector('[data-services-section]');
    section?.classList.add('hidden');
  }

  updateTotal() {
    const total = Array.from(this.selectedServices).reduce((sum, s) => sum + (ServicePrices[s] || 0), 0);
    const count = this.selectedServices.size;

    const totalEl = this.element.querySelector(BookingForm.selectors.totalDisplay);
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)} USD`;

    const countEl = this.element.querySelector(BookingForm.selectors.countDisplay);
    if (countEl) countEl.textContent = count === 1 ? '1 servicio seleccionado' : `${count} servicios seleccionados`;

    this.checkSubmitState();
  }

  checkSubmitState() {
    const submitBtn = this.element.querySelector(Form.selectors.submit);
    if (!submitBtn) return;

    const val = (name) => this.element.querySelector(`[name="${name}"]`)?.value.trim();
    const nameOk = val('name') || val('client-name');
    const phoneOk = val('phone') || val('client-phone');
    const emailOk = val('email') || val('client-email');
    const emailValid = emailOk && emailOk.includes('@');
    const dateOk = val('date') || val('client-date');
    const servicesOk = this.selectedServices.size > 0;
    const timeOk = this.selectedBarber?.includes('Sin preferencia') || this.selectedTime;

    const allValid = nameOk && phoneOk && emailValid && dateOk && servicesOk && timeOk;

    submitBtn.disabled = !allValid;
    submitBtn.classList.toggle('bg-gray-700', !allValid);
    submitBtn.classList.toggle('text-gray-500', !allValid);
    submitBtn.classList.toggle('cursor-not-allowed', !allValid);
    submitBtn.classList.toggle('bg-gradient-to-r', allValid);
    submitBtn.classList.toggle('from-gold-400', allValid);
    submitBtn.classList.toggle('via-gold-500', allValid);
    submitBtn.classList.toggle('to-gold-600', allValid);
    submitBtn.classList.toggle('text-black', allValid);

    const icon = submitBtn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-lock', !allValid);
      icon.classList.toggle('fa-check-circle', allValid);
    }

    const submitSection = this.element.querySelector('[data-submit-section]');
    if (submitSection) submitSection.classList.toggle('hidden', !allValid);
  }

  /**
   * Override Form.handleSubmit to collect checkbox services correctly.
   * FormData with Object.fromEntries collapses repeated names to one value,
   * so we read checked checkboxes explicitly.
   */
  handleSubmit(e) {
    e.preventDefault();
    if (this.submitting) return;

    const formData = new FormData(this.element);
    const data = Object.fromEntries(formData);

    // Collect services from checked checkboxes (supports multiple)
    data.services = Array.from(
      this.element.querySelectorAll('input[name="services"]:checked')
    ).map(cb => cb.value);

    // Normalize field names to the API schema
    data.name = data['client-name'] || data.name || '';
    data.phone = data['client-phone'] || data.phone || '';
    data.email = data['client-email'] || data.email || '';
    data.date = data['client-date'] || data.date || '';
    data.barber = this.selectedBarber || data.barber || 'Sin preferencia / Cualquiera disponible';
    data.time = this.selectedTime || data['selected-time'] || '';
    data.preference = this.selectedPreference || data['selected-preference'] || '';

    const isValid = this.validateAll();
    if (!isValid) {
      this.options.onError?.(this.errors);
      this.emit('error', this.errors);
      return;
    }

    this.submitting = true;
    this.setSubmitState(true);

    Promise.resolve(this.options.onSubmit?.(data))
      .then(result => {
        this.options.onSuccess?.(result, data);
        this.emit('success', { result, data });
      })
      .catch(err => {
        this.options.onError?.(err);
        this.emit('error', err);
        this.showError(err.message || 'Error al procesar');
      })
      .finally(() => {
        this.submitting = false;
        this.setSubmitState(false);
      });
  }

  async handleBookingSubmit(data) {
    const folio = generateFolio();
    const isAny = data.barber?.includes('Sin preferencia');
    const barberPhone = getBarberPhone(data.barber);
    const total = calculateTotal(data.services);

    const waMessage = buildWhatsAppMessage({ ...data, folio });

    // Try to submit to API
    let apiSuccess = false;
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, folio })
      });
      if (res.ok) apiSuccess = true;
    } catch (e) {
      console.warn('API unavailable, using local fallback');
    }

    // Show confirmation modal
    this.showConfirmation({
      folio,
      name: data.name,
      barber: data.barber,
      phone: data.phone,
      date: data.date,
      time: isAny
        ? (data.preference ? `Por confirmar (preferencia: ${data.preference})` : 'Por confirmar (según disponibilidad)')
        : data.time,
      services: data.services,
      total,
      whatsappUrl: `https://wa.me/${barberPhone}?text=${encodeURIComponent(waMessage)}`
    });

    return { success: true, folio };
  }

  showConfirmation(booking) {
    const modal = this.element.querySelector('[data-confirmation-modal]');
    if (!modal) return;

    const folioEl = modal.querySelector('[data-modal-folio]');
    const nameEl = modal.querySelector('[data-modal-name]');
    const barberEl = modal.querySelector('[data-modal-barber]');
    const phoneEl = modal.querySelector('[data-modal-phone]');
    const datetimeEl = modal.querySelector('[data-modal-datetime]');
    const totalEl = modal.querySelector('[data-modal-total]');

    if (folioEl) folioEl.textContent = booking.folio;
    if (nameEl) nameEl.textContent = booking.name;
    if (barberEl) barberEl.textContent = booking.barber;
    if (phoneEl) phoneEl.textContent = booking.phone;
    if (datetimeEl) datetimeEl.textContent = `${booking.date} — ${booking.time}`;
    if (totalEl) totalEl.textContent = `$${booking.total.toFixed(2)} USD`;

    const list = modal.querySelector('[data-modal-services]');
    if (list) {
      list.innerHTML = booking.services.map(s =>
        `<li class="flex justify-between text-xs border-b border-dark-800 pb-1">
          <span><i class="fa-solid fa-check text-gold-500 mr-2"></i>${s}</span>
          <span class="text-gold-400 font-bold">$${ServicePrices[s]} USD</span>
        </li>`
      ).join('');
    }

    const waLink = modal.querySelector('[data-whatsapp-link]');
    if (waLink) waLink.href = booking.whatsappUrl;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  validateField(input) {
    if (input.name === 'services') {
      return this.selectedServices.size > 0;
    }
    return super.validateField(input);
  }
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-booking-form]').forEach(el => new BookingForm(el));
  });
} else {
  document.querySelectorAll('[data-booking-form]').forEach(el => new BookingForm(el));
}