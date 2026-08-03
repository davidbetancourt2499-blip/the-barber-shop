/**
 * THE BARBER SHOP — Admin Panel JS
 * Auth via /api/auth/login, dashboard via /api/admin
 */

(() => {
    'use strict';

    const TOKEN_KEY = 'tbs_admin_token';
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    const loginView = $('#login-view');
    const dashboardView = $('#dashboard-view');
    const bookingsTbody = $('#bookings-tbody');
    const bookingsEmpty = $('#bookings-empty');

    // ---------------------------------------------------------------
    // TOASTS
    // ---------------------------------------------------------------
    function showToast(msg, type = 'success') {
        const container = $('#toast-container');
        const colors = { success: 'text-emerald-300 border-emerald-500/40', error: 'text-red-300 border-red-500/40', info: 'text-sky-300 border-sky-500/40' };
        const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
        const toast = document.createElement('div');
        toast.className = `toast-admin flex items-center gap-3 px-4 py-3 rounded-xl border ${colors[type]} bg-dark-800 shadow-lg text-xs`;
        toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
    }

    // ---------------------------------------------------------------
    // API HELPER
    // ---------------------------------------------------------------
    async function api(url, options = {}) {
        const token = localStorage.getItem(TOKEN_KEY);
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(url, { ...options, headers });
        const body = await res.json().catch(() => ({}));

        if (res.status === 401 && url.includes('/api/admin')) {
            logout(true);
            throw new Error('Sesión expirada');
        }
        if (!res.ok) {
            const msg = body.error || body.details?.join(', ') || `Error ${res.status}`;
            throw new Error(msg);
        }
        return body;
    }

    // ---------------------------------------------------------------
    // AUTH VIEWS
    // ---------------------------------------------------------------
    function showLogin() {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    }

    function showDashboard(username) {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        $('#admin-user-label').textContent = `👤 ${username || 'admin'}`;
        loadStats();
        loadBookings();
    }

    function logout(silent = false) {
        localStorage.removeItem(TOKEN_KEY);
        showLogin();
        if (!silent) showToast('Sesión cerrada', 'info');
    }

    // ---------------------------------------------------------------
    // LOGIN FORM
    // ---------------------------------------------------------------
    const loginForm = $('#login-form');
    const loginBtn = $('#login-btn');
    const loginBtnText = $('#login-btn-text');
    const loginBtnSpinner = $('#login-btn-spinner');
    const loginError = $('#login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('#login-username').value.trim();
        const password = $('#login-password').value;

        loginError.classList.add('hidden');
        loginBtn.disabled = true;
        loginBtnText.textContent = 'Verificando...';
        loginBtnSpinner.classList.remove('hidden');

        try {
            const data = await api('/api/auth/login?action=login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            localStorage.setItem(TOKEN_KEY, data.token);
            showToast('Sesión iniciada correctamente');
            showDashboard(data.user?.username);
        } catch (err) {
            loginError.textContent = err.message === 'Unauthorized'
                ? 'Credenciales inválidas'
                : err.message;
            loginError.classList.remove('hidden');
        } finally {
            loginBtn.disabled = false;
            loginBtnText.textContent = 'Iniciar Sesión';
            loginBtnSpinner.classList.add('hidden');
        }
    });

    $('#logout-btn').addEventListener('click', () => logout());

    // ---------------------------------------------------------------
    // STATS
    // ---------------------------------------------------------------
    async function loadStats() {
        try {
            const { stats } = await api('/api/admin?stats=1');
            $('#stat-total').textContent = stats.total;
            $('#stat-today').textContent = stats.today;
            $('#stat-month').textContent = stats.thisMonth;
            $('#stat-revenue').textContent = `$${stats.revenue.thisMonth.toFixed(2)}`;
            $('#stat-pending').textContent = stats.byStatus.pending;
            $('#stat-confirmed').textContent = stats.byStatus.confirmed;
            $('#stat-completed').textContent = stats.byStatus.completed;
            $('#stat-cancelled').textContent = stats.byStatus.cancelled;
        } catch (err) {
            showToast('Error al cargar estadísticas: ' + err.message, 'error');
        }
    }

    // ---------------------------------------------------------------
    // BOOKINGS LIST
    // ---------------------------------------------------------------
    const STATUS_LABELS = {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        cancelled: 'Cancelada',
        completed: 'Completada'
    };

    const STATUS_STYLES = {
        pending: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/30',
        confirmed: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
        cancelled: 'bg-red-400/10 text-red-300 border-red-400/30',
        completed: 'bg-sky-400/10 text-sky-300 border-sky-400/30'
    };

    async function loadBookings() {
        const date = $('#filter-date').value;
        const status = $('#filter-status').value;
        const barber = $('#filter-barber').value;

        const params = new URLSearchParams();
        if (date) params.set('date', date);
        if (status) params.set('status', status);
        if (barber) params.set('barber', barber);
        params.set('limit', '200');

        try {
            const data = await api(`/api/admin/bookings?${params.toString()}`);
            renderBookings(data.bookings, data.total);
        } catch (err) {
            showToast('Error al cargar reservas: ' + err.message, 'error');
        }
    }

    function renderBookings(bookings, total) {
        $('#bookings-count').textContent = `${bookings.length} reserva(s)`;

        if (!bookings.length) {
            bookingsEmpty.classList.remove('hidden');
            bookingsTbody.innerHTML = '';
            return;
        }
        bookingsEmpty.classList.add('hidden');

        bookingsTbody.innerHTML = bookings.map(b => {
            const servicesList = Array.isArray(b.services) ? b.services.join(', ') : (b.services || '');
            const date = b.date || '—';
            const time = b.time || b.preference || '—';
            const barber = (b.barber || '—').replace(' / Cualquiera disponible', '');
            const statusStyle = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
            const statusLabel = STATUS_LABELS[b.status] || b.status;

            return `
            <tr class="border-b border-dark-700/60 hover:bg-dark-800/40 transition-colors">
                <td class="px-5 py-3 font-bold text-gold-500 text-xs">${b.folio}</td>
                <td class="px-5 py-3">
                    <div class="font-semibold">${escapeHtml(b.name)}</div>
                    <div class="text-[10px] text-[#fffffe]/50">${escapeHtml(b.phone)}</div>
                </td>
                <td class="px-5 py-3 text-xs">${escapeHtml(barber)}</td>
                <td class="px-5 py-3 text-xs">${escapeHtml(date)}</td>
                <td class="px-5 py-3 text-xs">${escapeHtml(time)}</td>
                <td class="px-5 py-3 text-xs max-w-[180px]">${escapeHtml(servicesList)}</td>
                <td class="px-5 py-3 text-xs font-bold">$${Number(b.total || 0).toFixed(2)}</td>
                <td class="px-5 py-3">
                    <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusStyle}">${statusLabel}</span>
                </td>
                <td class="px-5 py-3">
                    <div class="flex gap-1.5">
                        <button class="status-btn text-[10px] px-2 py-1 rounded-md border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10"
                                data-folio="${b.folio}" data-status="confirmed" title="Confirmar"><i class="fa-solid fa-check"></i></button>
                        <button class="status-btn text-[10px] px-2 py-1 rounded-md border border-sky-400/40 text-sky-300 hover:bg-sky-400/10"
                                data-folio="${b.folio}" data-status="completed" title="Completar"><i class="fa-solid fa-flag-checkered"></i></button>
                        <button class="status-btn text-[10px] px-2 py-1 rounded-md border border-red-400/40 text-red-300 hover:bg-red-400/10"
                                data-folio="${b.folio}" data-status="cancelled" title="Cancelar"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    function escapeHtml(str) {
        return String(str ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

    // Event delegation for status buttons
    bookingsTbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('.status-btn');
        if (!btn) return;
        const { folio, status } = btn.dataset;

        try {
            await api(`/api/admin/bookings/${encodeURIComponent(folio)}`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            showToast(`${folio} → ${STATUS_LABELS[status]}`);
            loadStats();
            loadBookings();
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    });

    // Filters
    $('#filter-apply').addEventListener('click', loadBookings);
    ['#filter-date', '#filter-status', '#filter-barber'].forEach(sel => {
        $(sel).addEventListener('change', loadBookings);
    });

    // ---------------------------------------------------------------
    // INIT
    // ---------------------------------------------------------------
    async function init() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            showLogin();
            return;
        }
        try {
            await api('/api/auth/verify', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showDashboard();
        } catch {
            logout(true);
        }
    }

    init();
})();
