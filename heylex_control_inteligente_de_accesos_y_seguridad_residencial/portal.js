/**
 * Heylex Resident Portal & Auth Controller
 * Coordinates login, user profile modal, license privilege validation,
 * resident QR pass generation with live countdown, and visitor QR invitations.
 */

(function () {
  // Global modal state & timer references
  let qrCountdownInterval = null;
  let currentResidentPass = null;

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initPortalUI();
    checkExistingSession();
  });

  function checkExistingSession() {
    const session = window.HeylexAPI.getCurrentSession();
    updateHeaderUserStatus(session);
  }

  function updateHeaderUserStatus(session) {
    const desktopBtn = document.getElementById('portal-open-btn');
    const mobileBtn = document.getElementById('mobile-portal-btn');
    const userLabelDesktop = document.getElementById('portal-user-name');

    if (session && session.user) {
      if (desktopBtn) {
        desktopBtn.classList.remove('bg-primary-container', 'text-on-primary');
        desktopBtn.classList.add('bg-secondary-fixed', 'text-primary');
        desktopBtn.innerHTML = `
          <span class="material-symbols-outlined text-[18px]">verified_user</span>
          <span class="max-w-[120px] truncate">${session.user.name.split(' ')[0]} (Portal)</span>
        `;
      }
      if (mobileBtn) {
        mobileBtn.innerHTML = `
          <span class="material-symbols-outlined text-secondary-fixed text-lg">verified_user</span>
          <span>Mi Perfil Residente</span>
        `;
      }
    } else {
      if (desktopBtn) {
        desktopBtn.className = 'inline-flex items-center justify-center h-11 px-space-md font-label-sm text-label-sm uppercase bg-primary-container text-on-primary hover:bg-primary-container/80 rounded-lg shadow-sm transition-all gap-1.5 font-bold border border-secondary-fixed/30';
        desktopBtn.innerHTML = `
          <span class="material-symbols-outlined text-[18px] text-secondary-fixed">account_circle</span>
          <span>Acceso Residentes</span>
        `;
      }
      if (mobileBtn) {
        mobileBtn.innerHTML = `
          <span class="material-symbols-outlined text-secondary-fixed text-lg">account_circle</span>
          <span>Portal Residentes (Login)</span>
        `;
      }
    }
  }

  function initPortalUI() {
    // Inject Modals into DOM
    injectModalMarkup();
    bindEventListeners();
  }

  function injectModalMarkup() {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'heylex-portal-root';
    modalContainer.innerHTML = `
      <!-- BACKDROP -->
      <div id="heylex-modal-backdrop" class="fixed inset-0 z-[70] bg-primary/85 backdrop-blur-md hidden transition-opacity duration-300 opacity-0 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        
        <!-- ================= 1. LOGIN MODAL ================= -->
        <div id="heylex-login-card" class="relative w-full max-w-md bg-surface-container-lowest text-on-surface rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden hidden transform transition-all duration-300 scale-95 my-auto">
          <!-- Card Top Brand Banner -->
          <div class="bg-gradient-to-r from-primary via-primary-container to-primary p-6 text-on-primary relative">
            <button class="heylex-modal-close-btn absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container-lowest/15 hover:bg-surface-container-lowest/30 flex items-center justify-center text-on-primary transition-colors">
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-secondary-fixed text-primary flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-2xl">vpn_key</span>
              </div>
              <div>
                <h3 class="font-headline-md text-xl font-bold leading-none">Portal Residentes</h3>
                <span class="font-label-sm text-[11px] text-secondary-fixed uppercase tracking-wider">Control de Acceso Seguro</span>
              </div>
            </div>
            <p class="font-body-sm text-xs text-primary-fixed">Accede a tu credencial digital, generación de QR y pases de visitas.</p>
          </div>

          <!-- Login Form Content -->
          <div class="p-6">
            <div id="login-error-alert" class="hidden mb-4 p-3 rounded-lg bg-error-container text-error text-xs font-semibold flex items-center gap-2">
              <span class="material-symbols-outlined text-base">error</span>
              <span id="login-error-msg">Credenciales incorrectas</span>
            </div>

            <form id="heylex-login-form" class="space-y-4">
              <div>
                <label class="block font-label-sm text-xs font-bold uppercase text-on-surface mb-1">Correo Electrónico Registrado</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">mail</span>
                  <input type="email" id="login-email" required placeholder="ejemplo@heylex.mx" 
                    value="residente@heylex.mx"
                    class="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-secondary-fixed focus:bg-surface-container-lowest text-sm outline-none transition-all">
                </div>
              </div>

              <div>
                <label class="block font-label-sm text-xs font-bold uppercase text-on-surface mb-1">Contraseña</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">lock</span>
                  <input type="password" id="login-password" required placeholder="••••••••" 
                    value="password123"
                    class="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-secondary-fixed focus:bg-surface-container-lowest text-sm outline-none transition-all">
                </div>
              </div>

              <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant/40 text-[11px] text-on-surface-variant space-y-1">
                <div class="font-bold text-primary flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm text-secondary">info</span> Cuentas de demostración disponibles:
                </div>
                <div>• <span class="font-mono text-primary font-bold">residente@heylex.mx</span> (Licencia Activa / Privilegios Completos)</div>
                <div>• <span class="font-mono text-error font-bold">suspendido@heylex.mx</span> (Licencia Suspendida por Cuota)</div>
                <div class="text-[10px] text-on-surface-variant/80">Contraseña para ambas: <span class="font-mono font-bold">password123</span></div>
              </div>

              <button type="submit" id="login-submit-btn" class="w-full h-12 bg-secondary-fixed hover:bg-secondary-fixed-dim text-primary font-label-md font-bold uppercase rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-xl">login</span>
                <span>Ingresar al Portal</span>
              </button>
            </form>
          </div>
        </div>

        <!-- ================= 2. DASHBOARD / PERFIL MODAL ================= -->
        <div id="heylex-profile-card" class="relative w-full max-w-2xl bg-surface-container-lowest text-on-surface rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden hidden transform transition-all duration-300 scale-95 my-auto max-h-[92vh] flex flex-col">
          
          <!-- Profile Top Header -->
          <div class="bg-primary text-on-primary p-5 sm:p-6 shrink-0 relative flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <img id="user-avatar-img" src="" alt="Avatar" class="w-14 h-14 rounded-full border-2 border-secondary-fixed object-cover bg-surface-container">
              <div>
                <div class="flex items-center gap-2">
                  <h3 id="profile-name" class="font-headline-md text-lg sm:text-xl font-bold leading-tight">Nombre Usuario</h3>
                  <span id="profile-role-badge" class="font-label-sm text-[10px] px-2 py-0.5 rounded bg-primary-container text-secondary-fixed font-bold uppercase">Propietario</span>
                </div>
                <p id="profile-community" class="font-body-sm text-xs text-primary-fixed mt-0.5">Residencial Cumbres Del Ángel - Casa 42-B</p>
                <p id="profile-phone" class="font-body-sm text-[11px] text-on-primary/70">Tel: +52 993 123 4567</p>
              </div>
            </div>

            <div class="flex items-center gap-2 ml-auto">
              <!-- Demo toggle license switch button -->
              <button id="toggle-license-btn" title="Simular cambio de estado de licencia" class="h-8 px-2.5 rounded bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 text-secondary-fixed font-label-sm text-[11px] flex items-center gap-1 transition-all">
                <span class="material-symbols-outlined text-sm">sync_alt</span>
                <span class="hidden sm:inline">Probar Suspensión</span>
              </button>
              <button id="logout-btn" title="Cerrar Sesión" class="h-8 w-8 rounded bg-error-container text-error hover:bg-error hover:text-on-error flex items-center justify-center transition-all">
                <span class="material-symbols-outlined text-base">logout</span>
              </button>
              <button class="heylex-modal-close-btn h-8 w-8 rounded-full bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 flex items-center justify-center text-on-primary transition-all">
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          <!-- License Alert Banner (Dynamic) -->
          <div id="license-status-banner" class="p-3 text-xs font-semibold flex items-center justify-between border-b">
            <!-- Will be filled dynamically -->
          </div>

          <!-- Navigation Tabs -->
          <div class="flex border-b border-surface-container-high bg-surface-container-low px-4 sm:px-6 shrink-0 gap-2 overflow-x-auto">
            <button id="tab-btn-access" class="portal-tab-btn active px-4 py-3 font-label-sm font-bold uppercase text-xs flex items-center gap-2 border-b-2 border-secondary text-primary">
              <span class="material-symbols-outlined text-lg">qr_code_scanner</span>
              <span>Mi Pase QR</span>
            </button>
            <button id="tab-btn-invites" class="portal-tab-btn px-4 py-3 font-label-sm font-bold uppercase text-xs flex items-center gap-2 border-b-2 border-transparent text-on-surface-variant hover:text-primary">
              <span class="material-symbols-outlined text-lg">group_add</span>
              <span>Invitaciones a Visitas</span>
            </button>
            <button id="tab-btn-details" class="portal-tab-btn px-4 py-3 font-label-sm font-bold uppercase text-xs flex items-center gap-2 border-b-2 border-transparent text-on-surface-variant hover:text-primary">
              <span class="material-symbols-outlined text-lg">badge</span>
              <span>Datos del Inmueble</span>
            </button>
          </div>

          <!-- Scrollable Tab Contents -->
          <div class="p-5 sm:p-6 overflow-y-auto space-y-4">
            
            <!-- TAB 1: MI PASE QR RESIDENTE -->
            <div id="tab-content-access" class="portal-tab-panel">
              <div id="qr-resident-blocked" class="hidden p-6 text-center bg-surface-container-low rounded-xl border border-error/30 space-y-3">
                <div class="w-14 h-14 rounded-full bg-error-container text-error flex items-center justify-center mx-auto">
                  <span class="material-symbols-outlined text-3xl font-bold">block</span>
                </div>
                <h4 class="font-headline-sm text-base font-bold text-error">Generación de QR Bloqueada</h4>
                <p id="qr-blocked-reason" class="font-body-sm text-xs text-on-surface-variant max-w-md mx-auto">
                  Tu licencia o privilegios se encuentran temporalmente suspendidos por la administración.
                </p>
                <div class="pt-2">
                  <a href="https://wa.me/529933784115?text=Hola%20Administracion%20HEYLEX,%20necesito%20aclarar%20mi%20estatus%20de%20residente" target="_blank" class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-secondary-fixed text-xs font-bold rounded-lg uppercase">
                    <span class="material-symbols-outlined text-sm">support_agent</span>
                    <span>Contactar a la Administración</span>
                  </a>
                </div>
              </div>

              <div id="qr-resident-enabled" class="space-y-4">
                <div class="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 flex flex-col sm:flex-row items-center gap-6">
                  
                  <!-- QR Code Canvas Display -->
                  <div class="flex flex-col items-center bg-white p-4 rounded-xl shadow-md border border-outline-variant/30 shrink-0">
                    <div id="resident-qrcode-container" class="w-[180px] h-[180px] flex items-center justify-center">
                      <span class="text-xs text-outline">Generando QR...</span>
                    </div>
                    <div class="mt-2 text-center">
                      <span id="qr-timer-badge" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-secondary-fixed font-mono text-xs font-bold">
                        <span class="material-symbols-outlined text-xs animate-spin">sync</span>
                        <span id="qr-seconds-counter">180s restantes</span>
                      </span>
                    </div>
                  </div>

                  <!-- QR Telemetry info -->
                  <div class="space-y-2 text-center sm:text-left flex-1">
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-primary font-label-sm text-[11px] font-bold">
                      <span class="material-symbols-outlined text-sm">encrypted</span>
                      <span>Código Dinámico Anti-Fraude</span>
                    </div>
                    <h4 class="font-headline-sm text-base font-bold text-primary">Pase de Acceso Inmediato en Caseta</h4>
                    <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                      Presenta este código frente al tótem lector o muéstralo al oficial de guardia en la entrada. Se actualiza periódicamente para evitar clonaciones.
                    </p>
                    <div class="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button id="regenerate-qr-btn" class="h-9 px-4 bg-primary text-secondary-fixed hover:bg-primary-container font-label-sm text-xs font-bold uppercase rounded-lg shadow-sm flex items-center gap-1.5 transition-all">
                        <span class="material-symbols-outlined text-base">refresh</span>
                        <span>Regenerar Nuevo QR</span>
                      </button>
                      <button id="share-resident-wa-btn" class="h-9 px-4 bg-green-600 hover:bg-green-700 text-white font-label-sm text-xs font-bold uppercase rounded-lg shadow-sm flex items-center gap-1.5 transition-all">
                        <span class="material-symbols-outlined text-base">chat</span>
                        <span>Enviar por WhatsApp</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <!-- TAB 2: INVITACIONES A VISITAS -->
            <div id="tab-content-invites" class="portal-tab-panel hidden space-y-4">
              <div id="invites-blocked-banner" class="hidden p-4 bg-error-container text-error rounded-xl text-xs font-semibold flex items-center gap-2">
                <span class="material-symbols-outlined">gpp_bad</span>
                <span>Tu estatus actual no permite emitir nuevas invitaciones. Regulariza tu membresía para habilitar visitas.</span>
              </div>

              <!-- Create Invitation Trigger & Form Accordion -->
              <div class="border border-outline-variant/40 rounded-xl overflow-hidden bg-surface-container-low">
                <div class="p-4 bg-surface-container flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-secondary text-xl">person_add</span>
                    <span class="font-headline-sm text-sm font-bold text-primary">Generar Nueva Invitación para Visitante</span>
                  </div>
                  <button id="toggle-invite-form-btn" class="text-xs font-bold text-primary flex items-center gap-1">
                    <span id="invite-form-toggle-text">Abrir Formulario</span>
                    <span id="invite-form-toggle-icon" class="material-symbols-outlined text-base">expand_more</span>
                  </button>
                </div>

                <div id="invite-form-collapse" class="hidden p-4 border-t border-outline-variant/30 bg-surface-container-lowest">
                  <form id="create-invite-form" class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block font-label-sm text-[11px] font-bold uppercase text-on-surface mb-1">Nombre Completo del Visitante *</label>
                        <input type="text" id="inv-visitor-name" required placeholder="Ej. Roberto Sánchez" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs outline-none focus:border-secondary-fixed">
                      </div>
                      <div>
                        <label class="block font-label-sm text-[11px] font-bold uppercase text-on-surface mb-1">Placas de Vehículo (Opcional)</label>
                        <input type="text" id="inv-vehicle-plate" placeholder="Ej. WTL-894-A" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs outline-none focus:border-secondary-fixed uppercase">
                      </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label class="block font-label-sm text-[11px] font-bold uppercase text-on-surface mb-1">Tipo de Ingreso</label>
                        <select id="inv-entry-type" class="w-full h-10 px-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs outline-none">
                          <option value="VEHICULAR">Vehicular (Auto/Moto)</option>
                          <option value="PEATONAL">Peatonal</option>
                        </select>
                      </div>
                      <div>
                        <label class="block font-label-sm text-[11px] font-bold uppercase text-on-surface mb-1">Vigencia Acceso</label>
                        <select id="inv-access-type" class="w-full h-10 px-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs outline-none">
                          <option value="SINGLE_USE">Un Solo Uso (Entrada única)</option>
                          <option value="TEMPORARY_DAY">Pase por 24 Horas</option>
                          <option value="WEEKEND">Fin de Semana (48 Horas)</option>
                        </select>
                      </div>
                      <div>
                        <label class="block font-label-sm text-[11px] font-bold uppercase text-on-surface mb-1">Notas / Motivo</label>
                        <input type="text" id="inv-notes" placeholder="Ej. Reunión familiar" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs outline-none focus:border-secondary-fixed">
                      </div>
                    </div>

                    <div class="pt-2 flex justify-end gap-2">
                      <button type="submit" id="create-invite-submit-btn" class="h-10 px-5 bg-secondary-fixed hover:bg-secondary-fixed-dim text-primary font-label-sm font-bold uppercase rounded-lg shadow-sm flex items-center gap-1.5 transition-all text-xs">
                        <span class="material-symbols-outlined text-base">qr_code_2</span>
                        <span>Crear y Generar Código QR</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- List of invitations -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h5 class="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">Historial de Invitaciones Activas</h5>
                  <span id="invites-count-badge" class="font-label-sm text-[11px] px-2 py-0.5 rounded bg-surface-container-high text-primary font-bold">1 activa</span>
                </div>
                <div id="invitations-list-container" class="space-y-2">
                  <!-- Rendered dynamically -->
                </div>
              </div>
            </div>

            <!-- TAB 3: DATOS DEL INMUEBLE & LICENCIA DETALLES -->
            <div id="tab-content-details" class="portal-tab-panel hidden space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-2">
                  <span class="font-label-sm text-[10px] text-secondary font-bold uppercase tracking-wider">Ubicación Registrada</span>
                  <div class="font-headline-sm text-sm font-bold text-primary" id="det-community-name">-</div>
                  <div class="text-xs text-on-surface-variant space-y-1">
                    <div><strong>Dirección:</strong> <span id="det-address">-</span></div>
                    <div><strong>Unidad/Lote:</strong> <span id="det-unit">-</span></div>
                    <div><strong>Zona/Privada:</strong> <span id="det-zone">-</span></div>
                  </div>
                </div>

                <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-2">
                  <span class="font-label-sm text-[10px] text-secondary font-bold uppercase tracking-wider">Detalles de Licencia y SaaS</span>
                  <div class="font-headline-sm text-sm font-bold text-primary" id="det-plan-name">-</div>
                  <div class="text-xs text-on-surface-variant space-y-1">
                    <div><strong>Vigencia de Licencia:</strong> <span id="det-valid-until">-</span></div>
                    <div><strong>Generación QR Propio:</strong> <span id="det-can-qr" class="font-bold">-</span></div>
                    <div><strong>Emisión de Invitaciones:</strong> <span id="det-can-inv" class="font-bold">-</span></div>
                  </div>
                </div>
              </div>

              <div class="p-4 bg-surface-container rounded-xl text-xs text-on-surface-variant flex items-center justify-between">
                <div>
                  <strong>¿Necesitas actualizar tus datos de residente o vehículo?</strong>
                  <p class="text-[11px]">Contacta con la administración del fraccionamiento para cambios en padrón.</p>
                </div>
                <a href="https://wa.me/529933784115?text=Hola%20HEYLEX,%20requiero%20asistencia%20con%20mi%20perfil%20residencial" target="_blank" class="px-3 py-1.5 bg-primary text-secondary-fixed rounded font-bold uppercase text-[11px] shrink-0">
                  Ayuda
                </a>
              </div>
            </div>

          </div>
        </div>

        <!-- ================= 3. INVITATION SHARE / QR MODAL ================= -->
        <div id="heylex-invite-qr-modal" class="relative w-full max-w-sm bg-surface-container-lowest text-on-surface rounded-2xl shadow-2xl border-2 border-secondary-fixed overflow-hidden hidden transform transition-all duration-300 scale-95 my-auto text-center p-6">
          <button id="close-invite-qr-btn" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:text-primary">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
          
          <div class="w-12 h-12 rounded-full bg-secondary-fixed text-primary flex items-center justify-center mx-auto mb-3">
            <span class="material-symbols-outlined text-2xl font-bold">qr_code_2</span>
          </div>

          <h4 class="font-headline-sm text-base font-bold text-primary mb-1">Pase de Acceso para Visita</h4>
          <p id="share-visitor-name" class="font-body-sm text-xs text-on-surface-variant mb-4">Roberto Sánchez</p>

          <div class="bg-white p-3 rounded-xl shadow border border-outline-variant/30 inline-block mb-4">
            <div id="share-qrcode-container" class="w-[180px] h-[180px] flex items-center justify-center"></div>
          </div>

          <div class="p-3 bg-surface-container-low rounded-lg text-left text-xs space-y-1 mb-4">
            <div><strong>Código:</strong> <span id="share-code-id" class="font-mono text-primary font-bold">HLX-VISIT-894A</span></div>
            <div><strong>Placas registradas:</strong> <span id="share-plate" class="font-mono">-</span></div>
            <div><strong>Destino:</strong> <span id="share-destination">-</span></div>
          </div>

          <div class="space-y-2">
            <button id="share-whatsapp-btn" class="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-label-sm font-bold uppercase rounded-lg shadow flex items-center justify-center gap-2 text-xs transition-all">
              <span class="material-symbols-outlined text-lg">share</span>
              <span>Compartir Pase por WhatsApp</span>
            </button>
            <button id="close-invite-preview-btn" class="w-full h-9 bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm font-semibold uppercase rounded-lg text-xs">
              Cerrar
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(modalContainer);
  }

  function bindEventListeners() {
    // Header triggers
    const desktopBtn = document.getElementById('portal-open-btn');
    if (desktopBtn) {
      desktopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openResidentPortal();
      });
    }

    const mobileBtn = document.getElementById('mobile-portal-btn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Close drawer if open
        const drawer = document.getElementById('mobile-drawer');
        if (drawer) {
          drawer.classList.remove('open');
          drawer.classList.add('closed');
        }
        openResidentPortal();
      });
    }

    // Backdrop & Close buttons
    const backdrop = document.getElementById('heylex-modal-backdrop');
    document.querySelectorAll('.heylex-modal-close-btn').forEach((btn) => {
      btn.addEventListener('click', closeAllModals);
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeAllModals();
      }
    });

    // Login Form Submit
    const loginForm = document.getElementById('heylex-login-form');
    loginForm.addEventListener('submit', handleLoginSubmit);

    // Logout Button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', handleLogout);

    // Toggle license simulation button
    const toggleLicBtn = document.getElementById('toggle-license-btn');
    toggleLicBtn.addEventListener('click', handleToggleLicense);

    // Tab buttons
    document.getElementById('tab-btn-access').addEventListener('click', () => switchTab('access'));
    document.getElementById('tab-btn-invites').addEventListener('click', () => switchTab('invites'));
    document.getElementById('tab-btn-details').addEventListener('click', () => switchTab('details'));

    // Regenerate QR Button
    document.getElementById('regenerate-qr-btn').addEventListener('click', generateResidentQR);

    // Share Resident QR by WhatsApp Button
    const shareResidentWaBtn = document.getElementById('share-resident-wa-btn');
    if (shareResidentWaBtn) {
      shareResidentWaBtn.addEventListener('click', handleShareResidentQrWhatsApp);
    }

    // Toggle Invite Form Accordion
    const toggleInviteBtn = document.getElementById('toggle-invite-form-btn');
    toggleInviteBtn.addEventListener('click', () => {
      const collapse = document.getElementById('invite-form-collapse');
      const isHidden = collapse.classList.contains('hidden');
      if (isHidden) {
        collapse.classList.remove('hidden');
        document.getElementById('invite-form-toggle-text').textContent = 'Ocultar Formulario';
        document.getElementById('invite-form-toggle-icon').textContent = 'expand_less';
      } else {
        collapse.classList.add('hidden');
        document.getElementById('invite-form-toggle-text').textContent = 'Abrir Formulario';
        document.getElementById('invite-form-toggle-icon').textContent = 'expand_more';
      }
    });

    // Create Invite Form
    const createInviteForm = document.getElementById('create-invite-form');
    createInviteForm.addEventListener('submit', handleCreateInviteSubmit);

    // Share modal close
    document.getElementById('close-invite-qr-btn').addEventListener('click', closeInviteModal);
    document.getElementById('close-invite-preview-btn').addEventListener('click', closeInviteModal);
  }

  function openResidentPortal() {
    const session = window.HeylexAPI.getCurrentSession();
    if (!session || !session.token) {
      showLoginModal();
    } else {
      showProfileDashboard(session.user);
    }
  }

  function showLoginModal() {
    const backdrop = document.getElementById('heylex-modal-backdrop');
    const loginCard = document.getElementById('heylex-login-card');
    const profileCard = document.getElementById('heylex-profile-card');
    const inviteModal = document.getElementById('heylex-invite-qr-modal');

    profileCard.classList.add('hidden');
    inviteModal.classList.add('hidden');
    loginCard.classList.remove('hidden');

    backdrop.classList.remove('hidden');
    setTimeout(() => {
      backdrop.classList.remove('opacity-0');
      loginCard.classList.remove('scale-95');
      loginCard.classList.add('scale-100');
    }, 10);
  }

  function showProfileDashboard(user) {
    const backdrop = document.getElementById('heylex-modal-backdrop');
    const loginCard = document.getElementById('heylex-login-card');
    const profileCard = document.getElementById('heylex-profile-card');
    const inviteModal = document.getElementById('heylex-invite-qr-modal');

    loginCard.classList.add('hidden');
    inviteModal.classList.add('hidden');
    profileCard.classList.remove('hidden');

    // Populate user profile info
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-role-badge').textContent = user.role;
    document.getElementById('profile-community').textContent = `${user.community.name} - ${user.community.unit}`;
    document.getElementById('profile-phone').textContent = `Tel: ${user.phone} | ${user.email}`;
    document.getElementById('user-avatar-img').src = user.avatar;

    // Populate Tab 3 details
    document.getElementById('det-community-name').textContent = user.community.name;
    document.getElementById('det-address').textContent = user.community.address;
    document.getElementById('det-unit').textContent = user.community.unit;
    document.getElementById('det-zone').textContent = user.community.zone;
    document.getElementById('det-plan-name').textContent = user.membership.licensePlan;
    document.getElementById('det-valid-until').textContent = user.membership.validUntil;
    document.getElementById('det-can-qr').textContent = user.membership.canGenerateOwnQr ? 'Habilitado (Activo)' : 'Bloqueado';
    document.getElementById('det-can-qr').className = user.membership.canGenerateOwnQr ? 'font-bold text-secondary' : 'font-bold text-error';
    document.getElementById('det-can-inv').textContent = user.membership.canInviteVisitors ? 'Habilitado (Activo)' : 'Bloqueado';
    document.getElementById('det-can-inv').className = user.membership.canInviteVisitors ? 'font-bold text-secondary' : 'font-bold text-error';

    // Render License Status Banner
    renderLicenseBanner(user.membership);

    // Update Access QR State
    updateAccessQrState(user.membership);

    // Refresh Invitations list
    refreshInvitationsList(user.membership);

    backdrop.classList.remove('hidden');
    setTimeout(() => {
      backdrop.classList.remove('opacity-0');
      profileCard.classList.remove('scale-95');
      profileCard.classList.add('scale-100');
    }, 10);

    // Initial QR Pass render if active
    if (user.membership.status === 'ACTIVE' && user.membership.canGenerateOwnQr) {
      generateResidentQR();
    }
  }

  function renderLicenseBanner(membership) {
    const banner = document.getElementById('license-status-banner');
    if (membership.status === 'ACTIVE') {
      banner.className = 'p-3 bg-secondary-fixed/20 text-primary border-b border-secondary-fixed/40 flex items-center justify-between text-xs font-semibold';
      banner.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary text-base">verified</span>
          <span><strong>Licencia Activa:</strong> ${membership.licensePlan} | Al corriente en cuotas</span>
        </div>
        <span class="px-2 py-0.5 rounded bg-secondary-fixed text-primary font-bold text-[10px] uppercase">ACTIVO</span>
      `;
    } else {
      banner.className = 'p-3 bg-error-container text-error border-b border-error/30 flex items-center justify-between text-xs font-semibold';
      banner.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-base">gpp_bad</span>
          <span><strong>Acceso Suspendido:</strong> ${membership.suspensionReason || 'Licencia o cuota administrativa vencida.'}</span>
        </div>
        <span class="px-2 py-0.5 rounded bg-error text-on-error font-bold text-[10px] uppercase">SUSPENDIDO</span>
      `;
    }
  }

  function updateAccessQrState(membership) {
    const enabledSection = document.getElementById('qr-resident-enabled');
    const blockedSection = document.getElementById('qr-resident-blocked');
    const blockedReason = document.getElementById('qr-blocked-reason');
    const invitesBlockedBanner = document.getElementById('invites-blocked-banner');
    const createInviteSubmitBtn = document.getElementById('create-invite-submit-btn');

    if (membership.status === 'ACTIVE' && membership.canGenerateOwnQr) {
      enabledSection.classList.remove('hidden');
      blockedSection.classList.add('hidden');
    } else {
      enabledSection.classList.add('hidden');
      blockedSection.classList.remove('hidden');
      blockedReason.textContent = membership.suspensionReason || 'Tu membresía o licencia residencial no cuenta con privilegios activos de acceso.';
      if (qrCountdownInterval) clearInterval(qrCountdownInterval);
    }

    if (membership.status === 'ACTIVE' && membership.canInviteVisitors) {
      invitesBlockedBanner.classList.add('hidden');
      if (createInviteSubmitBtn) createInviteSubmitBtn.disabled = false;
    } else {
      invitesBlockedBanner.classList.remove('hidden');
      if (createInviteSubmitBtn) createInviteSubmitBtn.disabled = true;
    }
  }

  async function generateResidentQR() {
    const container = document.getElementById('resident-qrcode-container');
    const counter = document.getElementById('qr-seconds-counter');
    container.innerHTML = `<span class="text-xs text-outline animate-pulse">Solicitando QR al servidor...</span>`;

    try {
      const res = await window.HeylexAPI.generateResidentPass();
      container.innerHTML = '';
      currentResidentPass = res;

      // Generate visual QR using QRCode.js
      new QRCode(container, {
        text: res.qrPayload,
        width: 170,
        height: 170,
        colorDark: '#002546',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });

      // Start countdown timer
      let secondsLeft = res.expiresInSeconds || 180;
      if (qrCountdownInterval) clearInterval(qrCountdownInterval);

      qrCountdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
          clearInterval(qrCountdownInterval);
          counter.textContent = 'Expirado';
          generateResidentQR(); // Auto refresh
        } else {
          counter.textContent = `${secondsLeft}s restantes`;
        }
      }, 1000);

      window.showToast?.('Pase QR Generado', 'Código seguro activo para ingreso en caseta.');
    } catch (err) {
      currentResidentPass = null;
      container.innerHTML = `<div class="text-xs text-error font-semibold p-2">${err.message}</div>`;
      if (qrCountdownInterval) clearInterval(qrCountdownInterval);
      counter.textContent = 'Bloqueado';
    }
  }

  function handleShareResidentQrWhatsApp() {
    const session = window.HeylexAPI.getCurrentSession();
    if (!session || !session.user) {
      alert('Debes iniciar sesión para compartir tu pase.');
      return;
    }

    if (session.user.membership.status !== 'ACTIVE') {
      alert('Tu licencia no está activa. No es posible compartir el código de acceso.');
      return;
    }

    const user = session.user;
    const dest = `${user.community.name} - ${user.community.unit}`;
    const code = currentResidentPass ? currentResidentPass.qrPayload : 'HLX-RES-ACTIVO';

    // Generar enlace interactivo o texto con código para caseta
    const msg = encodeURIComponent(
      `🛡️ *PASE DE ACCESO DIGITAL RESIDENTE HEYLEX*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Residente:* ${user.name}\n` +
      `📍 *Destino:* ${dest}\n` +
      `🔑 *Código de Entrada:* ${code}\n` +
      `⏱️ *Vigencia:* Código temporal y dinámico de caseta.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `ℹ️ _Presenta este código al oficial de guardia o escanéalo en el tótem de entrada para ingresar._`
    );

    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  async function refreshInvitationsList(membership) {
    const container = document.getElementById('invitations-list-container');
    const countBadge = document.getElementById('invites-count-badge');
    container.innerHTML = `<div class="text-xs text-on-surface-variant py-2">Cargando invitaciones...</div>`;

    try {
      const invites = await window.HeylexAPI.getInvitations();
      countBadge.textContent = `${invites.length} ${invites.length === 1 ? 'activa' : 'activas'}`;

      if (invites.length === 0) {
        container.innerHTML = `
          <div class="p-4 text-center bg-surface-container rounded-lg text-xs text-on-surface-variant">
            No tienes invitaciones vigentes. Genera una con el botón superior.
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      invites.forEach((inv) => {
        const item = document.createElement('div');
        item.className = 'p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm';
        item.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-primary-container text-secondary-fixed flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-base">${inv.entryType === 'VEHICULAR' ? 'directions_car' : 'directions_walk'}</span>
            </div>
            <div>
              <div class="font-bold text-primary text-sm">${inv.visitorName}</div>
              <div class="text-on-surface-variant text-[11px] flex items-center gap-2">
                <span>Placas: <strong>${inv.vehiclePlate || 'N/A'}</strong></span>
                <span>•</span>
                <span>${inv.accessType === 'SINGLE_USE' ? 'Un solo uso' : 'Temporal'}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 ml-auto">
            <button class="view-invite-qr-btn px-2.5 py-1.5 rounded bg-primary text-secondary-fixed hover:bg-primary-container font-label-sm text-[11px] font-bold flex items-center gap-1" data-id="${inv.id}">
              <span class="material-symbols-outlined text-sm">qr_code</span>
              <span>Ver QR</span>
            </button>
            <button class="revoke-invite-btn p-1.5 rounded bg-error-container text-error hover:bg-error hover:text-on-error transition-colors" data-id="${inv.id}" title="Revocar invitación">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        `;
        container.appendChild(item);
      });

      // Bind events on buttons
      container.querySelectorAll('.view-invite-qr-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const inv = invites.find((i) => i.id === id);
          if (inv) openInviteQRModal(inv);
        });
      });

      container.querySelectorAll('.revoke-invite-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (confirm('¿Deseas revocar y anular este pase de visita?')) {
            await window.HeylexAPI.revokeInvitation(id);
            refreshInvitationsList(membership);
            window.showToast?.('Invitación Cancelada', 'El código ya no podrá ser usado en la caseta.');
          }
        });
      });
    } catch (err) {
      container.innerHTML = `<div class="text-xs text-error">Error al cargar invitaciones</div>`;
    }
  }

  function openInviteQRModal(inv) {
    const modal = document.getElementById('heylex-invite-qr-modal');
    const profileCard = document.getElementById('heylex-profile-card');
    profileCard.classList.add('hidden');
    modal.classList.remove('hidden');

    document.getElementById('share-visitor-name').textContent = inv.visitorName;
    document.getElementById('share-code-id').textContent = inv.qrCode;
    document.getElementById('share-plate').textContent = inv.vehiclePlate || 'No registrada';
    
    const session = window.HeylexAPI.getCurrentSession();
    const dest = session ? `${session.user.community.name} - ${session.user.community.unit}` : 'Residencial';
    document.getElementById('share-destination').textContent = dest;

    // Render QR
    const qrContainer = document.getElementById('share-qrcode-container');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: inv.qrCode,
      width: 170,
      height: 170,
      colorDark: '#002546',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });

    // Share by WhatsApp button
    const shareBtn = document.getElementById('share-whatsapp-btn');
    shareBtn.onclick = () => {
      const msg = encodeURIComponent(
        `¡Hola ${inv.visitorName}! Te comparto tu Pase Digital HEYLEX para ingresar a ${dest}.\n\n` +
        `• Código de Acceso: ${inv.qrCode}\n` +
        `• Placas: ${inv.vehiclePlate || 'Peatonal'}\n` +
        `• Muestra este mensaje o el código QR al oficial de caseta para ingresar automáticamente.`
      );
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    setTimeout(() => {
      modal.classList.remove('scale-95');
      modal.classList.add('scale-100');
    }, 10);
  }

  function closeInviteModal() {
    const modal = document.getElementById('heylex-invite-qr-modal');
    const profileCard = document.getElementById('heylex-profile-card');
    modal.classList.add('hidden');
    profileCard.classList.remove('hidden');
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const errAlert = document.getElementById('login-error-alert');
    const submitBtn = document.getElementById('login-submit-btn');

    errAlert.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="material-symbols-outlined text-lg animate-spin">sync</span>
      <span>Autenticando...</span>
    `;

    try {
      const session = await window.HeylexAPI.login(email, pass);
      updateHeaderUserStatus(session);
      window.showToast?.('Bienvenido', `Sesión iniciada como ${session.user.name}`);
      showProfileDashboard(session.user);
    } catch (err) {
      errAlert.classList.remove('hidden');
      document.getElementById('login-error-msg').textContent = err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span class="material-symbols-outlined text-xl">login</span>
        <span>Ingresar al Portal</span>
      `;
    }
  }

  async function handleLogout() {
    await window.HeylexAPI.logout();
    if (qrCountdownInterval) clearInterval(qrCountdownInterval);
    updateHeaderUserStatus(null);
    closeAllModals();
    window.showToast?.('Sesión Finalizada', 'Has salido del portal de residentes.');
  }

  function handleToggleLicense() {
    const updatedUser = window.HeylexAPI.toggleMockLicense();
    if (updatedUser) {
      showProfileDashboard(updatedUser);
      window.showToast?.(
        'Modo Demo: Licencia Modificada',
        `Estatus cambiado a: ${updatedUser.membership.status === 'ACTIVE' ? 'ACTIVA (Permisos habilitados)' : 'SUSPENDIDA (Accesos bloqueados)'}`
      );
    }
  }

  async function handleCreateInviteSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('inv-visitor-name').value.trim();
    const plate = document.getElementById('inv-vehicle-plate').value.trim();
    const entryType = document.getElementById('inv-entry-type').value;
    const accessType = document.getElementById('inv-access-type').value;
    const notes = document.getElementById('inv-notes').value.trim();

    try {
      const res = await window.HeylexAPI.createInvitation({
        visitorName: name,
        vehiclePlate: plate,
        entryType,
        accessType,
        notes
      });

      // Clear form
      document.getElementById('create-invite-form').reset();
      document.getElementById('invite-form-collapse').classList.add('hidden');
      document.getElementById('invite-form-toggle-text').textContent = 'Abrir Formulario';
      document.getElementById('invite-form-toggle-icon').textContent = 'expand_more';

      // Refresh list & open share modal directly
      const session = window.HeylexAPI.getCurrentSession();
      refreshInvitationsList(session.user.membership);
      openInviteQRModal(res.invitation);
      window.showToast?.('Invitación Creada', 'Pase generado exitosamente para tu visitante.');
    } catch (err) {
      alert(err.message || 'Error al generar la invitación');
    }
  }

  function switchTab(tabId) {
    document.querySelectorAll('.portal-tab-btn').forEach((btn) => {
      btn.classList.remove('border-secondary', 'text-primary');
      btn.classList.add('border-transparent', 'text-on-surface-variant');
    });
    document.querySelectorAll('.portal-tab-panel').forEach((panel) => {
      panel.classList.add('hidden');
    });

    const activeBtn = document.getElementById(`tab-btn-${tabId}`);
    const activePanel = document.getElementById(`tab-content-${tabId}`);
    if (activeBtn && activePanel) {
      activeBtn.classList.add('border-secondary', 'text-primary');
      activeBtn.classList.remove('border-transparent', 'text-on-surface-variant');
      activePanel.classList.remove('hidden');
    }
  }

  function closeAllModals() {
    const backdrop = document.getElementById('heylex-modal-backdrop');
    const loginCard = document.getElementById('heylex-login-card');
    const profileCard = document.getElementById('heylex-profile-card');
    const inviteModal = document.getElementById('heylex-invite-qr-modal');

    backdrop.classList.add('opacity-0');
    loginCard.classList.remove('scale-100');
    loginCard.classList.add('scale-95');
    profileCard.classList.remove('scale-100');
    profileCard.classList.add('scale-95');
    inviteModal.classList.remove('scale-100');
    inviteModal.classList.add('scale-95');

    setTimeout(() => {
      backdrop.classList.add('hidden');
      loginCard.classList.add('hidden');
      profileCard.classList.add('hidden');
      inviteModal.classList.add('hidden');
    }, 280);

    if (qrCountdownInterval) clearInterval(qrCountdownInterval);
  }

  // Expose methods for testing
  window.HeylexPortal = {
    open: openResidentPortal,
    close: closeAllModals
  };
})();
