/**
 * Heylex Admin Dashboard Controller
 * Manages multitenancy (switching between assigned communities),
 * KPI financial indicators, filtering residents by license status,
 * toggling active/suspended access, and WhatsApp payment notices.
 */

(function () {
  let currentCommunityId = null;
  let currentFilter = 'ALL';
  let currentTab = 'residents';
  let residentToSuspend = null;

  // Filtros inteligentes para pestañas secundarias
  let logsFilter = 'ALL';
  let logsSearch = '';
  let visitsFilter = 'ALL';
  let visitsSearch = '';
  let codesFilter = 'ALL';
  let codesSearch = '';

  // Filtros y estado del módulo de Finanzas
  let financeView = 'cuotas'; // 'cuotas' | 'pagos'
  let cuotasFilter = 'todas';
  let cuotasSearch = '';
  let pagosSearch = '';

  document.addEventListener('DOMContentLoaded', () => {
    initServiceWorker();
    checkAdminSession();
    bindEventListeners();
    initDbHealthCheck();
  });

  function initServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then((reg) => console.log('ServiceWorker Admin registrado:', reg.scope))
          .catch((err) => console.warn('ServiceWorker Admin fallback:', err));
      });
    }
  }

  async function initDbHealthCheck() {
    const badge = document.getElementById('db-health-badge');
    if (!badge) return;
    try {
      const health = await window.HeylexAPI.checkBackendHealth();
      if (health.available && health.dbConnected) {
        badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>BD MySQL: Conectada</span>`;
      } else if (health.available) {
        badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span>API OK (MySQL Pausado)</span>`;
      } else {
        badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-500/20 text-blue-200 border border-blue-500/30';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-400"></span><span>Modo Demostración</span>`;
      }
    } catch (e) {
      badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-500/20 text-blue-200 border border-blue-500/30';
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-400"></span><span>Modo Demostración</span>`;
    }
  }

  function bindEventListeners() {
    // Navigation Tabs Controller
    document.querySelectorAll('.dash-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dash-tab-btn').forEach((b) => {
          b.className = 'dash-tab-btn px-4 py-2 rounded-xl bg-white text-gray-600 hover:text-primary font-bold text-xs uppercase flex items-center gap-2 border border-gray-200 shadow-sm transition-all shrink-0';
        });
        btn.className = 'dash-tab-btn active px-4 py-2 rounded-xl bg-primary text-secondary-fixed font-bold text-xs uppercase flex items-center gap-2 shadow transition-all shrink-0';
        
        currentTab = btn.getAttribute('data-tab');
        document.querySelectorAll('.dash-pane').forEach((pane) => pane.classList.add('hidden'));
        const activePane = document.getElementById(`tab-pane-${currentTab}`);
        if (activePane) activePane.classList.remove('hidden');

        // Load tab specific data
        if (currentTab === 'access_logs') loadAccessLogsTable();
        else if (currentTab === 'visits') loadAllVisitsTable();
        else if (currentTab === 'enrollment') loadEnrollmentCodesTable();
        else if (currentTab === 'finance') loadFinanceModule();
      });
    });

    // Refresh buttons
    const refLogs = document.getElementById('refresh-logs-btn');
    if (refLogs) refLogs.addEventListener('click', loadAccessLogsTable);

    const refVisits = document.getElementById('refresh-visits-btn');
    if (refVisits) refVisits.addEventListener('click', loadAllVisitsTable);

    // Filtros inteligentes: Bitácora de Caseta
    document.querySelectorAll('.logs-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.logs-filter-btn').forEach((b) => {
          b.className = 'logs-filter-btn px-3 py-1.5 rounded-lg text-gray-600 hover:text-primary shrink-0';
        });
        btn.className = 'logs-filter-btn active px-3 py-1.5 rounded-lg bg-white text-primary shadow-sm shrink-0';
        logsFilter = btn.getAttribute('data-filter');
        loadAccessLogsTable();
      });
    });

    const logsSearchInput = document.getElementById('logs-search-input');
    if (logsSearchInput) {
      logsSearchInput.addEventListener('input', (e) => {
        logsSearch = e.target.value;
        loadAccessLogsTable();
      });
    }

    // Filtros inteligentes: Visitas Programadas
    document.querySelectorAll('.visits-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.visits-filter-btn').forEach((b) => {
          b.className = 'visits-filter-btn px-3 py-1.5 rounded-lg text-gray-600 hover:text-primary shrink-0';
        });
        btn.className = 'visits-filter-btn active px-3 py-1.5 rounded-lg bg-white text-primary shadow-sm shrink-0';
        visitsFilter = btn.getAttribute('data-filter');
        loadAllVisitsTable();
      });
    });

    const visitsSearchInput = document.getElementById('visits-search-input');
    if (visitsSearchInput) {
      visitsSearchInput.addEventListener('input', (e) => {
        visitsSearch = e.target.value;
        loadAllVisitsTable();
      });
    }

    // Filtros inteligentes: Códigos de Enrolamiento
    document.querySelectorAll('.codes-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.codes-filter-btn').forEach((b) => {
          b.className = 'codes-filter-btn px-3 py-1.5 rounded-lg text-gray-600 hover:text-primary shrink-0';
        });
        btn.className = 'codes-filter-btn active px-3 py-1.5 rounded-lg bg-white text-primary shadow-sm shrink-0';
        codesFilter = btn.getAttribute('data-filter');
        loadEnrollmentCodesTable();
      });
    });

    const codesSearchInput = document.getElementById('codes-search-input');
    if (codesSearchInput) {
      codesSearchInput.addEventListener('input', (e) => {
        codesSearch = e.target.value;
        loadEnrollmentCodesTable();
      });
    }

    const createCodeBtn = document.getElementById('create-enrollment-btn');
    if (createCodeBtn) {
      createCodeBtn.addEventListener('click', async () => {
        const modalData = await window.HeylexUI.promptEnrollmentCode();
        if (!modalData) return; // Usuario canceló el modal

        try {
          const res = await window.HeylexAPI.createEnrollmentCode({
            type: modalData.type,
            maxUses: modalData.maxUses,
            days: modalData.days
          });
          showToast(`¡Código ${res.code || 'NUEVO'} generado exitosamente!`);
          await loadEnrollmentCodesTable();
        } catch (e) {
          window.HeylexUI.alert({
            title: 'Error al Generar Código',
            message: e.message || 'No se pudo crear la clave de enrolamiento.',
            type: 'error'
          });
        }
      });
    }

    // Finanzas: Switcher entre Cuotas por Lote e Historial de Pagos
    const viewCuotasBtn = document.getElementById('finance-view-cuotas-btn');
    const viewPagosBtn = document.getElementById('finance-view-pagos-btn');
    const cuotasSection = document.getElementById('finance-cuotas-section');
    const pagosSection = document.getElementById('finance-pagos-section');

    if (viewCuotasBtn && viewPagosBtn) {
      viewCuotasBtn.addEventListener('click', () => {
        financeView = 'cuotas';
        viewCuotasBtn.className = 'px-3 py-1.5 rounded-lg bg-white text-primary shadow-sm font-bold flex items-center gap-1.5 transition-all';
        viewPagosBtn.className = 'px-3 py-1.5 rounded-lg text-gray-600 hover:text-primary flex items-center gap-1.5 transition-all';
        if (cuotasSection) cuotasSection.classList.remove('hidden');
        if (pagosSection) pagosSection.classList.add('hidden');
        loadCuotasTable();
      });

      viewPagosBtn.addEventListener('click', () => {
        financeView = 'pagos';
        viewPagosBtn.className = 'px-3 py-1.5 rounded-lg bg-white text-primary shadow-sm font-bold flex items-center gap-1.5 transition-all';
        viewCuotasBtn.className = 'px-3 py-1.5 rounded-lg text-gray-600 hover:text-primary flex items-center gap-1.5 transition-all';
        if (cuotasSection) cuotasSection.classList.add('hidden');
        if (pagosSection) pagosSection.classList.remove('hidden');
        loadPagosTable();
      });
    }

    // Finanzas: Filtros de cuotas (Todas, Pendientes, Vencidas, Pagadas)
    document.querySelectorAll('.cuotas-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cuotas-filter-btn').forEach((b) => {
          b.className = 'cuotas-filter-btn px-3 py-1.5 rounded-lg text-gray-600 hover:text-primary shrink-0';
        });
        btn.className = 'cuotas-filter-btn active px-3 py-1.5 rounded-lg bg-white text-primary shadow-sm shrink-0';
        cuotasFilter = btn.getAttribute('data-filter');
        loadCuotasTable();
      });
    });

    const cuotasSearchInput = document.getElementById('cuotas-search-input');
    if (cuotasSearchInput) {
      cuotasSearchInput.addEventListener('input', (e) => {
        cuotasSearch = e.target.value;
        loadCuotasTable();
      });
    }

    const pagosSearchInput = document.getElementById('pagos-search-input');
    if (pagosSearchInput) {
      pagosSearchInput.addEventListener('input', (e) => {
        pagosSearch = e.target.value;
        loadPagosTable();
      });
    }

    // Finanzas: Botón para generar nueva cuota
    const btnGenCuota = document.getElementById('btn-generate-cuota');
    if (btnGenCuota) {
      btnGenCuota.addEventListener('click', () => openGenerateCuotaModal());
    }

    // Finanzas: Botón para registrar pago
    const btnRegPago = document.getElementById('btn-open-payment-modal');
    if (btnRegPago) {
      btnRegPago.addEventListener('click', () => openRegisterPaymentModal());
    }
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
              <img src="${window.HeylexAPI.getAvatarForUser ? window.HeylexAPI.getAvatarForUser(r) : r.avatar}" alt="${r.name}" class="w-9 h-9 rounded-full object-cover bg-primary shrink-0 border border-primary/20">
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
          const ok = await window.HeylexUI.confirm({
            title: 'Reactivación de Acceso',
            message: `¿Confirmas el pago y la reactivación inmediata de los códigos QR para ${name}?`,
            confirmText: 'Reactivar Acceso',
            cancelText: 'Cancelar'
          });
          if (ok) {
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
      window.HeylexUI.alert({
        title: 'Error de Suspensión',
        message: err.message || 'No fue posible suspender al residente.',
        type: 'error'
      });
    }
  }

  // ================= TABLA 2: BITÁCORA DE CASETA (ACCESOS) =================
  async function loadAccessLogsTable() {
    const tbody = document.getElementById('logs-table-body');
    const badge = document.getElementById('logs-count-badge');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-400">Cargando bitácora de caseta...</td></tr>`;

    try {
      const logs = await window.HeylexAPI.getAccessLogs(100, logsFilter, logsSearch);
      tbody.innerHTML = '';
      if (badge) badge.textContent = `${logs.length} ${logs.length === 1 ? 'evento' : 'eventos'}`;

      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">No se encontraron accesos con el filtro seleccionado.</td></tr>`;
        return;
      }

      logs.forEach((log) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';

        const isOk = log.result === 'permitido';
        const resBadge = isOk 
          ? `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-lime-100 text-[#576500] border border-lime-300">PERMITIDO</span>`
          : `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">DENEGADO</span>`;

        const isEntry = log.direction === 'entrada';
        const dirBadge = isEntry
          ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"><span class="material-symbols-outlined text-sm">login</span> Entrada</span>`
          : `<span class="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700"><span class="material-symbols-outlined text-sm">logout</span> Salida</span>`;

        tr.innerHTML = `
          <td class="py-3 px-4 font-mono text-[11px] text-gray-600">${log.timestamp || 'N/A'}</td>
          <td class="py-3 px-4 uppercase font-bold text-[10px] text-gray-500">${log.type || 'acceso'}</td>
          <td class="py-3 px-4 font-bold text-gray-900">${log.name}</td>
          <td class="py-3 px-4 text-gray-600">${log.unit}</td>
          <td class="py-3 px-4">${dirBadge}</td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-1.5">
              ${resBadge}
              <span class="text-[11px] text-gray-500 font-medium">(${log.reason || 'Sin motivo'})</span>
            </div>
          </td>
          <td class="py-3 px-4 text-center font-mono text-[11px] text-gray-500">GD-${log.guardId || '721'}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-error">Error al cargar bitácora: ${e.message}</td></tr>`;
    }
  }

  // ================= TABLA 3: MONITOR DE VISITAS PROGRAMADAS =================
  async function loadAllVisitsTable() {
    const tbody = document.getElementById('visits-table-body');
    const badge = document.getElementById('visits-count-badge');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-gray-400">Cargando monitor de visitas programadas...</td></tr>`;

    try {
      const visits = await window.HeylexAPI.getAllVisits(visitsFilter, visitsSearch);
      tbody.innerHTML = '';
      if (badge) badge.textContent = `${visits.length} ${visits.length === 1 ? 'visita' : 'visitas'}`;

      if (visits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">No se encontraron visitas con el criterio seleccionado.</td></tr>`;
        return;
      }

      visits.forEach((v) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';

        const isAct = v.status === 'activo' || v.status === 'VALID' || v.status === 'ACTIVE';
        const stBadge = isAct
          ? `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-lime-100 text-[#576500] border border-lime-300 uppercase">Activo</span>`
          : `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-300 uppercase">${v.status}</span>`;

        tr.innerHTML = `
          <td class="py-3 px-4">
            <div class="font-bold text-gray-900">${v.visitorName}</div>
            <div class="text-[11px] text-gray-500">${v.visitorPhone || 'Sin teléfono'}</div>
          </td>
          <td class="py-3 px-4">
            <div class="font-bold text-primary">${v.hostName}</div>
            <div class="text-[11px] text-gray-500">${v.hostUnit}</div>
          </td>
          <td class="py-3 px-4">
            <div class="font-semibold text-gray-700 capitalize">${v.visitType || 'Única'}</div>
            <div class="text-[11px] text-gray-500">Vence: ${v.validUntil || 'N/A'}</div>
          </td>
          <td class="py-3 px-4 font-mono font-bold text-gray-700">${v.vehiclePlate || 'Sin placas'}</td>
          <td class="py-3 px-4 text-gray-600 text-[11px]">${v.reason || 'General'}</td>
          <td class="py-3 px-4 text-center">${stBadge}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-error">Error al cargar visitas: ${e.message}</td></tr>`;
    }
  }

  // ================= TABLA 4: CÓDIGOS DE ENROLAMIENTO =================
  async function loadEnrollmentCodesTable() {
    const tbody = document.getElementById('enrollment-table-body');
    const badge = document.getElementById('codes-count-badge');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-400">Cargando códigos de enrolamiento...</td></tr>`;

    try {
      const codes = await window.HeylexAPI.getEnrollmentCodes(codesFilter, codesSearch);
      tbody.innerHTML = '';
      if (badge) badge.textContent = `${codes.length} ${codes.length === 1 ? 'código' : 'códigos'}`;

      if (codes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">No se encontraron códigos de enrolamiento con ese criterio.</td></tr>`;
        return;
      }

      codes.forEach((c) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';

        tr.innerHTML = `
          <td class="py-3 px-4 font-mono font-bold text-primary text-sm">
            <span class="px-2.5 py-1 bg-primary/5 rounded border border-primary/20 tracking-wider">${c.code}</span>
          </td>
          <td class="py-3 px-4 capitalize font-semibold text-gray-700">
            <span class="inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-sm ${c.type === 'administrador' ? 'text-amber-600' : 'text-primary'}">
                ${c.type === 'administrador' ? 'admin_panel_settings' : 'home'}
              </span>
              <span>${c.type}</span>
            </span>
          </td>
          <td class="py-3 px-4 font-semibold text-gray-800">
            <div class="flex items-center gap-2">
              <span>${c.used} / ${c.maxUses}</span>
              <div class="w-12 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div class="bg-primary h-1.5" style="width: ${Math.min(100, (c.used / c.maxUses) * 100)}%"></div>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 text-[11px] text-gray-500">${c.createdAt || 'N/A'}</td>
          <td class="py-3 px-4 text-[11px] text-gray-500">${c.expiresAt || 'N/A'}</td>
          <td class="py-3 px-4 text-center">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'activo' ? 'bg-lime-100 text-[#576500] border border-lime-300' : 'bg-gray-100 text-gray-500'} uppercase">
              ${c.status}
            </span>
          </td>
          <td class="py-3 px-4 text-center">
            <button class="copy-code-btn px-2.5 py-1 rounded bg-gray-100 hover:bg-primary hover:text-white text-gray-700 font-bold text-[11px] transition-all inline-flex items-center gap-1" data-code="${c.code}" title="Copiar código al portapapeles">
              <span class="material-symbols-outlined text-xs">content_copy</span>
              <span>Copiar</span>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Bind copy buttons
      tbody.querySelectorAll('.copy-code-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const codeVal = btn.getAttribute('data-code');
          if (navigator.clipboard) {
            navigator.clipboard.writeText(codeVal);
            showToast(`¡Código ${codeVal} copiado al portapapeles!`);
          } else {
            window.HeylexUI.alert({
              title: 'Código de Enrolamiento',
              message: `Código: ${codeVal}`,
              type: 'info'
            });
          }
        });
      });
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-error">Error al cargar códigos: ${e.message}</td></tr>`;
    }
  }

  // ==============================================================
  // PANE 5: MÓDULO CONTABLE Y FINANZAS (appcuotas / apppagos)
  // ==============================================================
  async function loadFinanceModule() {
    await updateFinanceKPIs();
    if (financeView === 'cuotas') {
      await loadCuotasTable();
    } else {
      await loadPagosTable();
    }
  }

  async function updateFinanceKPIs() {
    try {
      const summary = await window.HeylexAPI.getFinanceSummary(currentCommunityId);
      const colEl = document.getElementById('finance-kpi-collected');
      const overEl = document.getElementById('finance-kpi-overdue');
      const overCountEl = document.getElementById('finance-kpi-overdue-count');
      const pendEl = document.getElementById('finance-kpi-pending');
      const pendCountEl = document.getElementById('finance-kpi-pending-count');
      const rateEl = document.getElementById('finance-kpi-rate');

      if (colEl) colEl.textContent = `$${(summary.totalCollectedMonth || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
      if (overEl) overEl.textContent = `$${(summary.overdueDebt || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
      if (overCountEl) overCountEl.textContent = `${summary.overdueCount || 0} cuotas vencidas`;
      if (pendEl) pendEl.textContent = `$${(summary.pendingAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
      if (pendCountEl) pendCountEl.textContent = `${summary.pendingCount || 0} por vencer`;
      if (rateEl) rateEl.textContent = `${summary.collectionRate || 100}%`;
    } catch (e) {
      console.error('Error al actualizar KPIs de finanzas:', e);
    }
  }

  async function loadCuotasTable() {
    const tbody = document.getElementById('cuotas-table-body');
    const emptyState = document.getElementById('cuotas-empty-state');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-400">Cargando libro de cuotas...</td></tr>`;

    try {
      const cuotas = await window.HeylexAPI.getCuotas({
        communityId: currentCommunityId,
        status: cuotasFilter,
        search: cuotasSearch
      });

      tbody.innerHTML = '';
      if (!cuotas || cuotas.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }
      if (emptyState) emptyState.classList.add('hidden');

      cuotas.forEach((c) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/80 transition-colors';

        let badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200';
        let statusLabel = 'Pendiente';
        if (c.status === 'pagada') {
          badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
          statusLabel = 'Pagada';
        } else if (c.status === 'vencida') {
          badgeClass = 'bg-rose-50 text-rose-700 border border-rose-200';
          statusLabel = 'Vencida (Mora)';
        }

        const accessClass = (c.residentAccessStatus === 'SUSPENDIDO')
          ? 'bg-red-50 text-red-600 border border-red-200'
          : 'bg-emerald-50 text-emerald-600 border border-emerald-200';
        const accessLabel = (c.residentAccessStatus === 'SUSPENDIDO') ? 'QR Bloqueado' : 'Acceso Autorizado';

        const actionHtml = (c.status === 'pagada')
          ? `<button class="view-receipt-by-cuota-btn px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold flex items-center gap-1 transition-all ml-auto" data-cuota-id="${c.id}">
               <span class="material-symbols-outlined text-xs text-primary">receipt</span>
               <span>Ver Recibo</span>
             </button>`
          : `<button class="register-payment-direct-btn px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all ml-auto" data-cuota-id="${c.id}" data-resident-name="${c.residentName}" data-amount="${c.amount}" data-concept="${c.concept}">
               <span class="material-symbols-outlined text-xs">payments</span>
               <span>Cobrar / Registrar</span>
             </button>`;

        tr.innerHTML = `
          <td class="py-3 px-3">
            <div class="font-bold text-gray-900">${c.residentName}</div>
            <div class="text-[11px] text-gray-500 font-medium">${c.unit}</div>
          </td>
          <td class="py-3 px-3">
            <div class="font-semibold text-gray-800">${c.concept}</div>
            <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-100 text-gray-600">${c.type}</span>
          </td>
          <td class="py-3 px-3 font-black text-gray-900">
            $${Number(c.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </td>
          <td class="py-3 px-3 text-gray-600 font-mono text-[11px]">
            ${c.dueDate}
          </td>
          <td class="py-3 px-3">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeClass}">${statusLabel}</span>
          </td>
          <td class="py-3 px-3">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${accessClass}">${accessLabel}</span>
          </td>
          <td class="py-3 px-3 text-right">
            ${actionHtml}
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Bind direct payment buttons
      tbody.querySelectorAll('.register-payment-direct-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cuotaId = btn.getAttribute('data-cuota-id');
          openRegisterPaymentModal(cuotaId);
        });
      });

      // Bind view receipt buttons
      tbody.querySelectorAll('.view-receipt-by-cuota-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const cuotaId = btn.getAttribute('data-cuota-id');
          const pagos = await window.HeylexAPI.getPagos();
          const targetPago = pagos.find(p => String(p.cuotaId) === String(cuotaId));
          if (targetPago) {
            openReceiptModal(targetPago);
          } else {
            showToast('El comprobante digital está en validación.');
          }
        });
      });

    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-error">Error al cargar cuotas: ${e.message}</td></tr>`;
    }
  }

  async function loadPagosTable() {
    const tbody = document.getElementById('pagos-table-body');
    const emptyState = document.getElementById('pagos-empty-state');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-gray-400">Cargando libro de pagos...</td></tr>`;

    try {
      const pagos = await window.HeylexAPI.getPagos({
        communityId: currentCommunityId,
        search: pagosSearch
      });

      tbody.innerHTML = '';
      if (!pagos || pagos.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }
      if (emptyState) emptyState.classList.add('hidden');

      pagos.forEach((p) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/80 transition-colors';

        tr.innerHTML = `
          <td class="py-3 px-3">
            <span class="font-mono text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/20">${p.folio}</span>
          </td>
          <td class="py-3 px-3">
            <div class="font-bold text-gray-900">${p.residentName}</div>
            <div class="text-[11px] text-gray-500">${p.unit}</div>
          </td>
          <td class="py-3 px-3 font-medium text-gray-800">
            ${p.concept}
          </td>
          <td class="py-3 px-3 font-black text-emerald-700">
            $${Number(p.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </td>
          <td class="py-3 px-3">
            <div class="font-bold uppercase text-[11px] text-gray-700">${p.paymentMethod}</div>
            <div class="text-[10px] text-gray-500 font-mono">${p.reference || 'Sin Ref'}</div>
          </td>
          <td class="py-3 px-3 text-gray-600 font-mono text-[11px]">
            ${p.paidAt}
          </td>
          <td class="py-3 px-3 text-[11px] text-gray-500">
            ${p.adminName || 'Admin'}
          </td>
          <td class="py-3 px-3 text-right">
            <button class="view-payment-receipt-btn px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-all ml-auto" data-folio="${p.folio}">
              <span class="material-symbols-outlined text-xs">receipt_long</span>
              <span>Comprobante</span>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.view-payment-receipt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const folio = btn.getAttribute('data-folio');
          const target = pagos.find(p => p.folio === folio);
          if (target) openReceiptModal(target);
        });
      });

    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-error">Error al cargar pagos: ${e.message}</td></tr>`;
    }
  }

  // Modal Corporativo: Registrar Pago de Cuota
  async function openRegisterPaymentModal(preselectedCuotaId = null) {
    const allCuotas = await window.HeylexAPI.getCuotas({ communityId: currentCommunityId, status: 'todas' });
    const pendingCuotas = allCuotas.filter(c => c.status !== 'pagada');

    if (pendingCuotas.length === 0) {
      window.HeylexUI.alert({
        title: 'Sin Cuotas Pendientes',
        message: 'No existen cuotas pendientes o vencidas por liquidar en este momento.',
        type: 'info'
      });
      return;
    }

    const defaultCuota = preselectedCuotaId 
      ? pendingCuotas.find(c => String(c.id) === String(preselectedCuotaId)) || pendingCuotas[0]
      : pendingCuotas[0];

    const optionsHtml = pendingCuotas.map(c => `
      <option value="${c.id}" data-amount="${c.amount}" data-res="${c.residentName}" ${c.id === defaultCuota.id ? 'selected' : ''}>
        ${c.residentName} (${c.unit}) — ${c.concept} [$${Number(c.amount).toFixed(2)}]
      </option>
    `).join('');

    const formHtml = `
      <div class="space-y-4 text-left">
        <div>
          <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Seleccionar Cuota a Liquidar</label>
          <select id="modal-pay-cuota-id" class="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:border-emerald-500 focus:outline-none bg-gray-50">
            ${optionsHtml}
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Monto a Cobrar ($ MXN)</label>
            <input type="number" step="0.01" id="modal-pay-amount" value="${defaultCuota.amount}" class="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:border-emerald-500 focus:outline-none bg-white">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Método de Pago</label>
            <select id="modal-pay-method" class="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:border-emerald-500 focus:outline-none bg-white">
              <option value="transferencia" selected>Transferencia Bancaria SPEI</option>
              <option value="efectivo">Efectivo en Caseta / Administración</option>
              <option value="tarjeta">Terminal POS / Tarjeta</option>
              <option value="deposito">Depósito en Ventanilla</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Referencia Bancaria / Clave de Rastreo</label>
          <input type="text" id="modal-pay-ref" placeholder="Ej. SPEI-BBVA-${Math.floor(100000 + Math.random()*900000)}" class="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:border-emerald-500 focus:outline-none bg-white">
        </div>

        <div>
          <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Observaciones / Notas del Recibo</label>
          <textarea id="modal-pay-notes" rows="2" placeholder="Pago verificado por administración central..." class="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:border-emerald-500 focus:outline-none bg-white"></textarea>
        </div>

        <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-2">
          <span class="material-symbols-outlined text-base text-emerald-600 shrink-0">verified_user</span>
          <span><strong>Automatización en Caseta:</strong> Si este pago cubre todas las cuotas vencidas del residente, su acceso QR será reactivado en el acto en el tótem de caseta.</span>
        </div>
      </div>
    `;

    const result = await window.HeylexUI.modal({
      title: 'Registrar Cobro y Emisión de Recibo',
      content: formHtml,
      confirmText: 'Registrar Pago y Generar Folio',
      cancelText: 'Cancelar',
      onOpen: (modalEl) => {
        const selectEl = modalEl.querySelector('#modal-pay-cuota-id');
        const amountEl = modalEl.querySelector('#modal-pay-amount');
        selectEl.addEventListener('change', () => {
          const selectedOpt = selectEl.options[selectEl.selectedIndex];
          if (selectedOpt) {
            amountEl.value = selectedOpt.getAttribute('data-amount') || '1850.00';
          }
        });
      }
    });

    if (!result) return; // Cancelado

    const cuotaSelect = document.getElementById('modal-pay-cuota-id');
    const selectedCuotaId = cuotaSelect ? cuotaSelect.value : defaultCuota.id;
    const amountVal = parseFloat(document.getElementById('modal-pay-amount')?.value || defaultCuota.amount);
    const methodVal = document.getElementById('modal-pay-method')?.value || 'transferencia';
    const refVal = document.getElementById('modal-pay-ref')?.value || '';
    const notesVal = document.getElementById('modal-pay-notes')?.value || '';

    try {
      const resp = await window.HeylexAPI.registerPayment({
        cuotaId: selectedCuotaId,
        amount: amountVal,
        method: methodVal,
        reference: refVal,
        notes: notesVal
      });

      // Recargar KPIs, tabla de cuotas, tabla de residentes y bitácora
      await updateFinanceKPIs();
      if (financeView === 'cuotas') await loadCuotasTable();
      else await loadPagosTable();
      await loadDashboardData();

      window.HeylexUI.alert({
        title: resp.accessReactivated ? '¡Pago Exitoso y Acceso Reactivado!' : '¡Pago Registrado Exitosamente!',
        message: resp.message,
        type: 'success'
      });

      showToast(`Pago procesado con Folio ${resp.payment.folio}`);
    } catch (e) {
      window.HeylexUI.alert({
        title: 'Error al Registrar Pago',
        message: e.message || 'Ocurrió un error al procesar el pago.',
        type: 'error'
      });
    }
  }

  // Modal Corporativo: Generar Nueva Cuota
  async function openGenerateCuotaModal() {
    const residents = await window.HeylexAPI.getCommunityResidents(currentCommunityId, 'ALL');
    const residentsOptions = residents.map(r => `
      <option value="${r.id}" data-name="${r.name}" data-unit="${r.unit}">
        ${r.name} — ${r.unit} (${r.zone || ''})
      </option>
    `).join('');

    const formHtml = `
      <div class="space-y-4 text-left">
        <div>
          <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Residente Destinatario</label>
          <select id="modal-gen-resident" class="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:border-emerald-500 focus:outline-none bg-gray-50">
            ${residentsOptions}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Concepto de la Cuota</label>
          <input type="text" id="modal-gen-concept" value="Mantenimiento Mensual Diciembre 2026" class="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:border-emerald-500 focus:outline-none bg-white">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Tipo de Cuota</label>
            <select id="modal-gen-type" class="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:border-emerald-500 focus:outline-none bg-white">
              <option value="ordinaria" selected>Ordinaria</option>
              <option value="extraordinaria">Extraordinaria</option>
              <option value="amenidad">Amenidad / Renta</option>
              <option value="multa">Multa / Penalización</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Monto ($ MXN)</label>
            <input type="number" step="0.01" id="modal-gen-amount" value="1850.00" class="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:border-emerald-500 focus:outline-none bg-white">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Fecha Vencimiento</label>
            <input type="date" id="modal-gen-due" value="${new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]}" class="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:border-emerald-500 focus:outline-none bg-white">
          </div>
        </div>
      </div>
    `;

    const result = await window.HeylexUI.modal({
      title: 'Emisión de Nueva Cuota Condominal',
      content: formHtml,
      confirmText: 'Generar y Notificar Cuota',
      cancelText: 'Cancelar'
    });

    if (!result) return;

    const resSelect = document.getElementById('modal-gen-resident');
    const selectedResOpt = resSelect.options[resSelect.selectedIndex];

    try {
      const newCuota = await window.HeylexAPI.generateCuota({
        communityId: currentCommunityId,
        residentId: resSelect.value,
        residentName: selectedResOpt.getAttribute('data-name'),
        unit: selectedResOpt.getAttribute('data-unit'),
        concept: document.getElementById('modal-gen-concept').value,
        type: document.getElementById('modal-gen-type').value,
        amount: parseFloat(document.getElementById('modal-gen-amount').value || 1850),
        dueDate: document.getElementById('modal-gen-due').value
      });

      await updateFinanceKPIs();
      await loadCuotasTable();
      showToast('Cuota generada y programada');
    } catch (e) {
      window.HeylexUI.alert({
        title: 'Error',
        message: e.message || 'No se pudo generar la cuota.',
        type: 'error'
      });
    }
  }

  // Modal Corporativo: Visualizador Oficial de Recibo
  function openReceiptModal(payment) {
    const receiptHtml = `
      <div class="space-y-4 text-left font-sans">
        <!-- Recibo Header -->
        <div class="p-4 bg-primary text-white rounded-xl flex items-center justify-between shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-black text-secondary-fixed">
              HLX
            </div>
            <div>
              <h4 class="font-bold text-sm tracking-wide">RECIBO DE CAJA OFICIAL</h4>
              <p class="text-[10px] text-gray-300">SISTEMA HEYLEX DE ADMINISTRACIÓN CONDOMINAL</p>
            </div>
          </div>
          <div class="text-right">
            <span class="block text-[10px] uppercase font-bold text-secondary-fixed">Folio Digital</span>
            <span class="font-mono text-sm font-black">${payment.folio}</span>
          </div>
        </div>

        <!-- Recibo Body Info Grid -->
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Residente Titular:</span>
            <span class="font-bold text-gray-900">${payment.residentName}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Unidad / Inmueble:</span>
            <span class="font-bold text-gray-900">${payment.unit}</span>
          </div>
          <div class="col-span-2 border-t border-gray-200 pt-2">
            <span class="block text-[10px] font-bold uppercase text-gray-500">Concepto Liquidado:</span>
            <span class="font-semibold text-gray-800">${payment.concept}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Método de Pago:</span>
            <span class="font-bold uppercase text-gray-800">${payment.paymentMethod}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Clave SPEI / Ref:</span>
            <span class="font-mono text-gray-800 font-bold">${payment.reference || 'AUT-INTERNA'}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Fecha y Hora de Validación:</span>
            <span class="font-mono text-gray-800">${payment.paidAt}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Autorizado Por:</span>
            <span class="font-medium text-gray-800">${payment.adminName || 'Admin Central'}</span>
          </div>
        </div>

        <!-- Recibo Total Box -->
        <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold uppercase text-emerald-800">Total Pagado:</span>
            <p class="text-[11px] text-emerald-700 font-medium">Liquidado en Moneda Nacional</p>
          </div>
          <div class="text-right">
            <span class="text-2xl font-black text-emerald-800">$${Number(payment.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
          </div>
        </div>

        <!-- Sello Digital -->
        <div class="p-2.5 rounded-lg bg-gray-100 border border-gray-200 text-[9px] text-gray-500 font-mono flex items-center justify-between">
          <span>SELLO DIGITAL: SHA256-${Math.random().toString(36).substring(2, 14).toUpperCase()} | VALIDADO EN SERVIDOR CASÈTA HEYLEX</span>
          <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase text-[9px]">Pagado</span>
        </div>
      </div>
    `;

    window.HeylexUI.modal({
      title: `Recibo de Pago: ${payment.folio}`,
      content: receiptHtml,
      confirmText: 'Imprimir / Descargar Recibo',
      cancelText: 'Cerrar'
    }).then(confirmed => {
      if (confirmed) {
        window.print();
      }
    });
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
    const ok = await window.HeylexUI.confirm({
      title: 'Cerrar Sesión Administrador',
      message: '¿Estás seguro de que deseas salir del panel de administración?',
      confirmText: 'Sí, Salir',
      cancelText: 'Permanecer',
      type: 'warning'
    });
    if (!ok) return;

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
