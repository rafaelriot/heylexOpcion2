/**
 * Heylex Admin Dashboard Controller
 * Manages multitenancy (switching between assigned communities),
 * KPI financial indicators, filtering residents by license status,
 * toggling active/suspended access, and WhatsApp payment notices.
 */

(function () {
  let currentCommunityId = null;
  let currentFilter = 'ALL';
  let residentToSuspend = null;

  document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();
    bindEventListeners();
  });

  function bindEventListeners() {
    // Admin Login Form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleAdminLogin);
    }

    // Community Selector Switch
    const selector = document.getElementById('community-selector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        currentCommunityId = e.target.value;
        loadDashboardData();
      });
    }

    // Filter Buttons (ALL, ACTIVE, SUSPENDED)
    document.querySelectorAll('.filter-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab-btn').forEach((b) => {
          b.classList.remove('bg-white', 'text-primary', 'shadow-sm', 'text-error');
          b.classList.add('text-gray-600');
        });
        btn.classList.add('bg-white', 'text-primary', 'shadow-sm');
        btn.classList.remove('text-gray-600');
        currentFilter = btn.getAttribute('data-filter');
        loadResidentsTable();
      });
    });

    // Search Input
    const searchInput = document.getElementById('resident-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        loadResidentsTable();
      });
    }

    // Logout
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleAdminLogout);
    }

    // Modal controls
    const cancelBtn = document.getElementById('cancel-suspension-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeSuspensionModal);
    }

    const confirmBtn = document.getElementById('confirm-suspension-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', handleConfirmSuspension);
    }
  }

  function checkAdminSession() {
    const session = window.HeylexAPI.getCurrentSession();
    if (session && session.user && session.user.role === 'ADMINISTRADOR') {
      showDashboardView(session.user);
    } else {
      showLoginView();
    }
  }

  function showLoginView() {
    document.getElementById('admin-login-view').classList.remove('hidden');
    document.getElementById('admin-dashboard-view').classList.add('hidden');
  }

  async function showDashboardView(adminUser) {
    document.getElementById('admin-login-view').classList.add('hidden');
    document.getElementById('admin-dashboard-view').classList.remove('hidden');
    document.getElementById('current-admin-name').textContent = adminUser.name;

    // Load assigned communities for multitenancy
    try {
      const communities = await window.HeylexAPI.getAdminCommunities();
      const selector = document.getElementById('community-selector');
      selector.innerHTML = '';

      if (communities.length === 0) {
        selector.innerHTML = `<option value="">Sin fraccionamientos asignados</option>`;
        return;
      }

      communities.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.type})`;
        selector.appendChild(opt);
      });

      currentCommunityId = communities[0].id;
      loadDashboardData();
    } catch (err) {
      showToast(err.message || 'Error al cargar comunidades');
    }
  }

  async function loadDashboardData() {
    if (!currentCommunityId) return;
    await Promise.all([loadMetrics(), loadResidentsTable()]);
  }

  async function loadMetrics() {
    try {
      const metrics = await window.HeylexAPI.getCommunityMetrics(currentCommunityId);
      document.getElementById('kpi-total-residents').textContent = metrics.totalResidents;
      document.getElementById('kpi-active-residents').textContent = metrics.activeResidents;
      document.getElementById('kpi-suspended-residents').textContent = metrics.suspendedResidents;
      document.getElementById('kpi-debt-amount').textContent = `$${metrics.totalDebt.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
    } catch (err) {
      console.error('Error cargando KPIs:', err);
    }
  }

  async function loadResidentsTable() {
    const tbody = document.getElementById('residents-table-body');
    const emptyState = document.getElementById('table-empty-state');
    const searchVal = document.getElementById('resident-search-input').value;

    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-gray-400">Cargando padrón...</td></tr>`;

    try {
      const residents = await window.HeylexAPI.getCommunityResidents(currentCommunityId, currentFilter, searchVal);
      tbody.innerHTML = '';

      if (residents.length === 0) {
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      residents.forEach((r) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/80 transition-colors';

        const isAct = r.licenseStatus === 'ACTIVE';
        const badgeClass = isAct ? 'badge-active' : 'badge-suspended';
        const badgeLabel = isAct ? 'ACTIVA / AL CORRIENTE' : 'SUSPENDIDA (BLOQUEADO)';
        const debtText = isAct ? '$0.00 MXN' : `$${(r.debtAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
        const monthsText = isAct ? 'Al corriente' : `${r.monthsDue || 1} cuota(s) pendiente(s)`;

        tr.innerHTML = `
          <!-- 1. Residente -->
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-3">
              <img src="${r.avatar}" alt="${r.name}" class="w-8 h-8 rounded-full object-cover bg-gray-200 shrink-0">
              <div>
                <div class="font-bold text-gray-900">${r.name}</div>
                <div class="text-[11px] text-gray-500">${r.email} | ${r.phone}</div>
              </div>
            </div>
          </td>

          <!-- 2. Unidad -->
          <td class="py-3.5 px-4 font-semibold text-gray-800">
            <div>${r.unit}</div>
            <div class="text-[11px] font-normal text-gray-500">${r.zone}</div>
          </td>

          <!-- 3. Estatus Licencia -->
          <td class="py-3.5 px-4">
            <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${badgeClass}">
              ${badgeLabel}
            </span>
            ${r.suspensionReason ? `<div class="text-[10px] text-red-600 mt-1 max-w-[200px] truncate" title="${r.suspensionReason}">⚠️ ${r.suspensionReason}</div>` : ''}
          </td>

          <!-- 4. Adeudo -->
          <td class="py-3.5 px-4">
            <div class="font-bold ${isAct ? 'text-gray-900' : 'text-error'}">${debtText}</div>
            <div class="text-[10px] text-gray-500">${monthsText}</div>
          </td>

          <!-- 5. Último Pago -->
          <td class="py-3.5 px-4 text-gray-600">
            <div>${r.lastPaymentDate || 'Sin registro'}</div>
          </td>

          <!-- 6. Acciones -->
          <td class="py-3.5 px-4 text-center">
            <div class="flex items-center justify-center gap-1.5">
              ${
                isAct
                  ? `<button class="suspend-btn h-8 px-2.5 rounded-lg bg-red-50 hover:bg-error hover:text-white text-error text-[11px] font-bold uppercase transition-all flex items-center gap-1" data-id="${r.id}" data-name="${r.name}">
                      <span class="material-symbols-outlined text-sm">block</span>
                      <span>Suspender</span>
                    </button>`
                  : `<button class="activate-btn h-8 px-2.5 rounded-lg bg-lime-100 hover:bg-lime-200 text-[#3f4a00] text-[11px] font-bold uppercase transition-all flex items-center gap-1" data-id="${r.id}" data-name="${r.name}">
                      <span class="material-symbols-outlined text-sm">check_circle</span>
                      <span>Reactivar</span>
                    </button>
                    <button class="whatsapp-btn h-8 w-8 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center shadow transition-all" data-name="${r.name}" data-phone="${r.phone}" data-unit="${r.unit}" data-debt="${r.debtAmount}" title="Cobrar por WhatsApp">
                      <span class="material-symbols-outlined text-sm">chat</span>
                    </button>`
              }
            </div>
          </td>
        `;

        tbody.appendChild(tr);
      });

      // Bind dynamic row actions
      tbody.querySelectorAll('.suspend-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          openSuspensionModal(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
        });
      });

      tbody.querySelectorAll('.activate-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const name = btn.getAttribute('data-name');
          if (confirm(`¿Confirmas el pago y la reactivación inmediata de los códigos QR para ${name}?`)) {
            await window.HeylexAPI.updateResidentLicenseStatus(id, 'ACTIVE');
            showToast(`Acceso reactivado para ${name}`);
            loadDashboardData();
          }
        });
      });

      tbody.querySelectorAll('.whatsapp-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const name = btn.getAttribute('data-name');
          const unit = btn.getAttribute('data-unit');
          const debt = btn.getAttribute('data-debt');
          const selector = document.getElementById('community-selector');
          const comName = selector.options[selector.selectedIndex].text.split('(')[0].trim();

          const msg = encodeURIComponent(
            `Hola ${name}, le saluda la Administración de *${comName}*.\n\n` +
            `Le recordamos que presenta un adeudo acumulado de mantenimiento por *$${Number(debt).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN* correspondiente a la unidad *${unit}*.\n\n` +
            `Por políticas de administración, el acceso mediante código QR dinámico se encuentra temporalmente inactivo. Le invitamos a regularizar su pago para reactivar sus privilegios de caseta.\n\n` +
            `Agradecemos su atención.`
          );
          window.open(`https://wa.me/?text=${msg}`, '_blank');
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-error">Error al cargar datos</td></tr>`;
    }
  }

  function openSuspensionModal(residentId, residentName) {
    residentToSuspend = residentId;
    document.getElementById('modal-resident-name').textContent = residentName;
    document.getElementById('suspension-reason-input').value = 'Adeudo de cuota de mantenimiento y administración vencida.';
    document.getElementById('suspension-modal').classList.remove('hidden');
  }

  function closeSuspensionModal() {
    residentToSuspend = null;
    document.getElementById('suspension-modal').classList.add('hidden');
  }

  async function handleConfirmSuspension() {
    if (!residentToSuspend) return;
    const reason = document.getElementById('suspension-reason-input').value.trim() || 'Acceso suspendido por comité de administración.';
    try {
      await window.HeylexAPI.updateResidentLicenseStatus(residentToSuspend, 'SUSPENDED', reason);
      closeSuspensionModal();
      showToast('Acceso QR y licencias suspendidas para el residente.');
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Error al suspender');
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;
    const errBox = document.getElementById('admin-login-error');

    errBox.classList.add('hidden');
    try {
      const session = await window.HeylexAPI.login(email, pass);
      if (session.user.role !== 'ADMINISTRADOR') {
        throw new Error('Esta cuenta es de residente. Solo administradores pueden ingresar a este panel.');
      }
      showDashboardView(session.user);
      showToast(`Bienvenido Administrador: ${session.user.name}`);
    } catch (err) {
      errBox.classList.remove('hidden');
      document.getElementById('admin-login-error-msg').textContent = err.message;
    }
  }

  async function handleAdminLogout() {
    await window.HeylexAPI.logout();
    showLoginView();
    showToast('Sesión de administrador finalizada');
  }

  function showToast(msg) {
    const toast = document.getElementById('admin-toast');
    const toastText = document.getElementById('admin-toast-text');
    if (!toast || !toastText) return;
    toastText.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3800);
  }
})();
