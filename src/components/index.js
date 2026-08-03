/**
 * THE BARBER SHOP — COMPONENT SYSTEM
 * Lightweight, accessible, composable components
 */

// ============================================================================
// BASE COMPONENT CLASS
// ============================================================================

export class BaseComponent {
  constructor(element, options = {}) {
    this.element = element;
    this.options = { ...this.defaultOptions, ...options };
    this.state = {};
    this.eventListeners = new Map();
    this.init();
  }

  get defaultOptions() { return {}; }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {}

  render() {}

  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    this.render();
  }

  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventListeners.get(event) || [];
    handlers.forEach(h => h(data));
    // Also dispatch CustomEvent for external listeners
    this.element.dispatchEvent(new CustomEvent(event, { detail: data, bubbles: true }));
  }

  destroy() {
    this.eventListeners.clear();
  }
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export class Button extends BaseComponent {
  static selectors = {
    root: '[data-component="button"]',
    loader: '[data-button-loader]',
    text: '[data-button-text]'
  };

  get defaultOptions() {
    return {
      variant: 'primary',
      size: 'md',
      disabled: false,
      loading: false
    };
  }

  bindEvents() {
    this.element.addEventListener('click', (e) => {
      if (this.options.disabled || this.options.loading) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.emit('click', e);
    });
  }

  setLoading(loading) {
    this.options.loading = loading;
    this.element.disabled = loading || this.options.disabled;
    const loader = this.element.querySelector(Button.selectors.loader);
    const text = this.element.querySelector(Button.selectors.text);
    if (loader) loader.hidden = !loading;
    if (text) text.hidden = loading;
  }

  setDisabled(disabled) {
    this.options.disabled = disabled;
    this.element.disabled = disabled;
    this.element.classList.toggle('btn--disabled', disabled);
  }
}

// ============================================================================
// MODAL COMPONENT
// ============================================================================

export class Modal extends BaseComponent {
  static selectors = {
    root: '[data-component="modal"]',
    overlay: '[data-modal-overlay]',
    close: '[data-modal-close]',
    content: '[data-modal-content]'
  };

  get defaultOptions() {
    return {
      closeOnOverlayClick: true,
      closeOnEscape: true,
      trapFocus: true,
      onOpen: null,
      onClose: null
    };
  }

  init() {
    super.init();
    this.isOpen = false;
    this.lastFocusedElement = null;
    this.overlay = this.element.querySelector(Modal.selectors.overlay);
    this.content = this.element.querySelector(Modal.selectors.content);
    this.closeButtons = this.element.querySelectorAll(Modal.selectors.close);
    this.bindEvents();
  }

  bindEvents() {
    this.closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    if (this.options.closeOnOverlayClick && this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    if (this.options.closeOnEscape) {
      this.keydownHandler = (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      };
      document.addEventListener('keydown', this.keydownHandler);
    }
  }

  open() {
    if (this.isOpen) return;
    this.lastFocusedElement = document.activeElement;
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    this.element.hidden = false;
    this.element.classList.add('modal-overlay--open');
    this.trapFocus();
    this.options.onOpen?.();
    this.emit('open');
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    document.body.style.overflow = '';
    this.element.classList.remove('modal-overlay--open');
    setTimeout(() => {
      this.element.hidden = true;
      this.lastFocusedElement?.focus();
    }, 250);
    this.options.onClose?.();
    this.emit('close');
  }

  trapFocus() {
    if (!this.options.trapFocus || !this.content) return;
    const focusable = this.content.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    this.content.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });

    first?.focus();
  }

  destroy() {
    document.removeEventListener('keydown', this.keydownHandler);
    super.destroy();
  }
}

// ============================================================================
// FORM COMPONENT
// ============================================================================

export class Form extends BaseComponent {
  static selectors = {
    root: '[data-component="form"]',
    field: '[data-form-field]',
    input: 'input, select, textarea',
    submit: '[type="submit"]',
    error: '[data-form-error]',
    success: '[data-form-success]'
  };

  get defaultOptions() {
    return {
      validateOnBlur: true,
      validateOnChange: false,
      validateOnSubmit: true,
      showErrors: true,
      onSubmit: null,
      onError: null,
      onSuccess: null
    };
  }

  init() {
    super.init();
    this.fields = new Map();
    this.errors = new Map();
    this.submitting = false;
    this.bindEvents();
  }

  bindEvents() {
    this.element.addEventListener('submit', (e) => this.handleSubmit(e));

    if (this.options.validateOnBlur) {
      this.element.addEventListener('blur', (e) => {
        if (e.target.matches(Form.selectors.input)) this.validateField(e.target);
      }, true);
    }

    if (this.options.validateOnChange) {
      this.element.addEventListener('change', (e) => {
        if (e.target.matches(Form.selectors.input)) this.validateField(e.target);
      });
    }

    this.element.addEventListener('input', (e) => {
      if (e.target.matches(Form.selectors.input) && this.errors.has(e.target.name)) {
        this.clearError(e.target.name);
      }
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.submitting) return;

    const formData = new FormData(this.element);
    const data = Object.fromEntries(formData);

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
        this.showSuccess();
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

  validateAll() {
    this.errors.clear();
    const inputs = this.element.querySelectorAll(Form.selectors.input);
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) isValid = false;
    });

    return isValid;
  }

  validateField(input) {
    const { name, required, type, pattern, minLength, maxLength } = input;
    const value = input.value.trim();

    if (required && !value) {
      this.setError(name, 'Este campo es obligatorio');
      return false;
    }

    if (value && type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      this.setError(name, 'Email inválido');
      return false;
    }

    if (value && type === 'tel' && !/^[\d\s\+\-\(\)]{8,}$/.test(value)) {
      this.setError(name, 'Teléfono inválido');
      return false;
    }

    if (pattern && value && !new RegExp(pattern).test(value)) {
      this.setError(name, input.dataset.errorMessage || 'Formato inválido');
      return false;
    }

    if (minLength && value.length < minLength) {
      this.setError(name, `Mínimo ${minLength} caracteres`);
      return false;
    }

    if (maxLength && value.length > maxLength) {
      this.setError(name, `Máximo ${maxLength} caracteres`);
      return false;
    }

    this.clearError(name);
    return true;
  }

  setError(name, message) {
    this.errors.set(name, message);
    const input = this.element.querySelector(`[name="${name}"]`);
    if (input) {
      input.classList.add('input--error');
      const errorEl = input.parentElement?.querySelector('[data-form-error]');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
    }
  }

  clearError(name) {
    this.errors.delete(name);
    const input = this.element.querySelector(`[name="${name}"]`);
    if (input) {
      input.classList.remove('input--error');
      const errorEl = input.parentElement?.querySelector('[data-form-error]');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.hidden = true;
      }
    }
  }

  setSubmitState(loading) {
    const btn = this.element.querySelector(Form.selectors.submit);
    if (btn) btn.disabled = loading;
  }

  showSuccess() {
    const successEl = this.element.querySelector(Form.selectors.success);
    if (successEl) successEl.hidden = false;
  }

  reset() {
    this.element.reset();
    this.errors.clear();
    this.element.querySelectorAll('.input--error').forEach(el => el.classList.remove('input--error'));
    this.element.querySelectorAll('[data-form-error]').forEach(el => { el.textContent = ''; el.hidden = true; });
    this.element.querySelector(Form.selectors.success)?.hidden = true;
  }
}

// ============================================================================
// TOAST COMPONENT
// ============================================================================

export class Toast {
  static container = null;
  static toasts = [];

  static init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: var(--space-6);
      right: var(--space-6);
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  static show(message, type = 'info', duration = 4000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-6);
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-medium);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      transform: translateX(120%);
      opacity: 0;
      transition: all var(--duration-normal) var(--ease-spring);
      pointer-events: auto;
      max-width: 360px;
    `;

    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `
      <span style="color: var(--color-${type === 'info' ? 'gold-500' : type}); flex-shrink: 0;">${icons[type] || icons.info}</span>
      <span style="color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-sm);">${message}</span>
      <button data-toast-close style="margin-left: auto; background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: var(--space-1);">✕</button>
    `;

    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    // Close handler
    toast.querySelector('[data-toast-close]')?.addEventListener('click', () => this.dismiss(toast));

    // Auto dismiss
    setTimeout(() => this.dismiss(toast), duration);

    return toast;
  }

  static dismiss(toast) {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 250);
  }

  static success(msg, dur) { return this.show(msg, 'success', dur); }
  static error(msg, dur) { return this.show(msg, 'error', dur); }
  static warning(msg, dur) { return this.show(msg, 'warning', dur); }
  static info(msg, dur) { return this.show(msg, 'info', dur); }
}

// ============================================================================
// COMPONENT REGISTRY
// ============================================================================

export const ComponentRegistry = {
  components: new Map(),

  register(name, ComponentClass) {
    this.components.set(name, ComponentClass);
  },

  get(name) {
    return this.components.get(name);
  },

  initAll(root = document) {
    this.components.forEach((ComponentClass, name) => {
      const selector = ComponentClass.selectors?.root || `[data-component="${name}"]`;
      const elements = root.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.dataset.componentInstance) {
          const instance = new ComponentClass(el);
          el.dataset.componentInstance = name;
          el.__component = instance;
        }
      });
    });
  }
};

// Register built-in components
ComponentRegistry.register('button', Button);
ComponentRegistry.register('modal', Modal);
ComponentRegistry.register('form', Form);

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ComponentRegistry.initAll());
} else {
  ComponentRegistry.initAll();
}

// Export for external use
window.TBS = window.TBS || {};
window.TBS.ComponentRegistry = ComponentRegistry;
window.TBS.Toast = Toast;
window.TBS.Button = Button;
window.TBS.Modal = Modal;
window.TBS.Form = Form;