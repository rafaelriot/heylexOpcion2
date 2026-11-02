/**
 * Heylex Resident Portal & Auth Controller
 * Coordinates login, user profile modal, license privilege validation,
 * resident QR pass generation with live countdown, and visitor QR invitations.
 */

(function () {
  // Global modal state & timer references
  let qrCountdownInterval = null;
  let currentResidentPass = null;
  let deferredInstallPrompt = null;

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initServiceWorker();
    initPortalUI();
    initPwaInstallPrompt();
    checkExistingSession();
  });

  // Registro de Service Worker para PWA
  function initServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then((reg) => console.log('ServiceWorker HEYLEX registrado:', reg.scope))
          .catch((err) => console.warn('ServiceWorker HEYLEX fallback:', err));
      });
    }
  }

  // Controlador de instalación PWA en celular
  function initPwaInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      showPwaInstallBanner(false);
    });

    // Detectar iOS Safari (iPhone / iPad) si no está en modo standalone
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isIos && !isStandalone) {
      const dismissed = localStorage.getItem('heylex_pwa_ios_dismissed');
      if (!dismissed) {
        setTimeout(() => showPwaInstallBanner(true), 2000);
      }
    }
  }

  function showPwaInstallBanner(isIos = false) {
    if (document.getElementById('heylex-pwa-install-banner')) return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    const banner = document.createElement('div');
    banner.id = 'heylex-pwa-install-banner';
    banner.className = 'fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#001c38] text-white p-4 rounded-2xl shadow-2xl border-2 border-secondary-fixed/50 backdrop-blur-lg flex flex-col gap-3 transition-all duration-300';

    banner.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <img src="icons/icon-192.png" alt="HEYLEX App" class="w-11 h-11 rounded-xl shadow-md border border-secondary-fixed shrink-0">
          <div>
            <h4 class="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Instalar HEYLEX App</span>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-secondary-fixed text-primary">Móvil</span>
            </h4>
            <p class="text-[11px] text-gray-300 leading-tight">Accede a tu código QR en 1 segundo directo desde tu pantalla de inicio.</p>
          </div>
        </div>
        <button id="pwa-close-banner-btn" class="text-gray-400 hover:text-white p-1">
          <span class="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      <div class="pt-1">
        ${isIos 
          ? `<div class="p-2.5 bg-white/5 rounded-xl text-[11px] text-gray-200 border border-white/10 flex items-center gap-2">
               <span class="material-symbols-outlined text-secondary-fixed text-lg">ios_share</span>
               <span>Para instalar en iPhone: Pulsa <strong>Compartir</strong> y luego <strong>"Agregar al inicio" ➕</strong></span>
             </div>`
          : `<button id="pwa-install-action-btn" class="w-full py-2.5 px-4 rounded-xl bg-secondary-fixed hover:bg-secondary-fixed/90 text-primary font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-secondary-fixed/20 transition-all">
               <span class="material-symbols-outlined text-sm font-bold">download</span>
               <span>Instalar en Este Celular</span>
             </button>`
        }
      </div>
    `;

    document.body.appendChild(banner);

    const closeBtn = banner.querySelector('#pwa-close-banner-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        banner.remove();
        if (isIos) localStorage.setItem('heylex_pwa_ios_dismissed', '1');
      });
    }

    const installBtn = banner.querySelector('#pwa-install-action-btn');
    if (installBtn && deferredInstallPrompt) {
      installBtn.addEventListener('click', async () => {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          banner.remove();
        }
        deferredInstallPrompt = null;
      });
    }
  }

  function checkExistingSession() {
    const session = window.HeylexAPI.getCurrentSession();
    updateHeaderUserStatus(session);
    updatePersistentResidentDock(session);

    // Si se abre desde la app instalada en el celular (PWA standalone) o tiene parámetro ?view=qr
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const urlParams = new URLSearchParams(window.location.search);
    const viewQr = urlParams.get('view') === 'qr';

    if (session && session.user && session.user.role === 'RESIDENTE' && (isStandalone || viewQr)) {
      setTimeout(() => {
        openResidentPortal();
      }, 350);
    }
  }

  // Widget permanente flotante de acceso rápido para usuario logueado
  function updatePersistentResidentDock(session) {
    let dock = document.getElementById('heylex-persistent-dock');
    if (!session || !session.user) {
      if (dock) dock.remove();
      return;
    }

    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'heylex-persistent-dock';
      document.body.appendChild(dock);
    }

    const user = session.user;
    const isResident = user.role === 'RESIDENTE';
    const avatar = window.HeylexAPI.getAvatarForUser ? window.HeylexAPI.getAvatarForUser(user) : (user.avatar || 'avatars/male-1.png');
    const roleBadge = isResident ? 'RESIDENTE' : 'ADMINISTRADOR';

    dock.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 max-w-sm z-40 bg-primary/95 text-white p-3.5 rounded-2xl shadow-2xl border border-secondary-fixed/40 backdrop-blur-md flex items-center justify-between gap-3 transition-all duration-300';
    
    dock.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0">
        <img src="${avatar}" alt="${user.name}" class="w-10 h-10 rounded-full object-cover border-2 border-secondary-fixed shrink-0 bg-primary">
        <div class="min-w-0">
          <div class="text-xs font-bold truncate text-white">${user.name}</div>
          <div class="text-[10px] text-gray-300 truncate flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-secondary-fixed shrink-0"></span>
            <span>${isResident ? (user.unit || 'Casa') + ' • ' + roleBadge : roleBadge}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        ${isResident 
          ? `<button id="dock-open-qr-btn" class="px-3 py-1.5 rounded-xl bg-secondary-fixed hover:bg-secondary-fixed/90 text-primary font-bold text-xs uppercase flex items-center gap-1 shadow transition-all">
               <span class="material-symbols-outlined text-sm">qr_code_2</span>
               <span>Mi QR</span>
             </button>`
          : `<a href="admin.html" class="px-3 py-1.5 rounded-xl bg-secondary-fixed hover:bg-secondary-fixed/90 text-primary font-bold text-xs uppercase flex items-center gap-1 shadow transition-all">
               <span class="material-symbols-outlined text-sm">dashboard</span>
               <span>Admin</span>
             </a>`
        }
        <button id="dock-logout-btn" class="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all" title="Cerrar Sesión">
          <span class="material-symbols-outlined text-sm">logout</span>
        </button>
      </div>
    `;

    const openQrBtn = dock.querySelector('#dock-open-qr-btn');
    if (openQrBtn) {
      openQrBtn.addEventListener('click', () => {
        openResidentPortal();
      });
    }

    const logoutBtn = dock.querySelector('#dock-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const confirmed = await window.HeylexUI.confirm({
          title: 'Cerrar Sesión',
          message: '¿Estás seguro de que deseas salir de tu cuenta HEYLEX?',
          confirmText: 'Sí, Cerrar Sesión',
          cancelText: 'Cancelar',
          type: 'warning'
        });
        if (confirmed) {
          await window.HeylexAPI.logout();
          updateHeaderUserStatus(null);
          updatePersistentResidentDock(null);
          closeAllModals();
          window.HeylexUI.alert({
            title: 'Sesión Finalizada',
            message: 'Has cerrado sesión exitosamente.',
            type: 'info'
          });
        }
      });
    }
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
                      <button id="regenerate-qr-btn" class="h-9 px-3.5 bg-primary text-secondary-fixed hover:bg-primary-container font-label-sm text-xs font-bold uppercase rounded-lg shadow-sm flex items-center gap-1.5 transition-all">
                        <span class="material-symbols-outlined text-base">refresh</span>
                        <span>Regenerar QR</span>
                      </button>
                      <button id="download-resident-png-btn" class="h-9 px-3.5 bg-surface-container-highest hover:bg-outline-variant/50 text-primary font-label-sm text-xs font-bold uppercase rounded-lg shadow-sm flex items-center gap-1.5 transition-all border border-outline-variant/40">
                        <span class="material-symbols-outlined text-base">download</span>
                        <span>Descargar PNG</span>
                      </button>
                      <button id="share-resident-wa-btn" class="h-9 px-3.5 bg-green-600 hover:bg-green-700 text-white font-label-sm text-xs font-bold uppercase rounded-lg shadow-sm flex items-center gap-1.5 transition-all">
                        <span class="material-symbols-outlined text-base">chat</span>
                        <span>Enviar Pase</span>
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

              <!-- ESTADO DE CUENTA Y CUOTAS DE MANTENIMIENTO DEL RESIDENTE -->
              <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald-600 text-lg">receipt_long</span>
                    <span class="font-label-sm text-xs text-primary font-bold uppercase tracking-wider">Estado de Cuenta & Cuotas Condominales</span>
                  </div>
                  <span id="det-resident-balance-badge" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">Al Corriente</span>
                </div>

                <div id="det-cuotas-list" class="space-y-2 max-h-48 overflow-y-auto text-xs">
                  <!-- Injected via JS -->
                </div>

                <!-- Datos bancarios para transferencia SPEI -->
                <div class="p-3 bg-white rounded-lg border border-gray-200 text-[11px] text-gray-600 space-y-1">
                  <div class="font-bold text-gray-800 flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs text-primary">account_balance</span>
                    <span>Datos de Transferencia SPEI (Administración)</span>
                  </div>
                  <div><strong>Banco:</strong> BBVA México | <strong>Beneficiario:</strong> Fraccionamiento Cumbres A.C.</div>
                  <div><strong>CLABE Interbancaria:</strong> <span class="font-mono font-bold text-primary">012 790 00123456789 4</span></div>
                  <div><strong>Concepto Obligatorio:</strong> <span id="det-spei-concept" class="font-mono text-gray-800 font-bold">Casa 42-B Cuota</span></div>
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
          
          <div class="w-12 h-12 rounded-full bg-secondary-fixed text-primary flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span class="material-symbols-outlined text-2xl font-bold">qr_code_2</span>
          </div>

          <h4 class="font-headline-sm text-base font-bold text-primary mb-0.5">Pase de Acceso para Visita</h4>
          <p id="share-visitor-name" class="font-body-sm text-xs font-semibold text-secondary mb-3">Roberto Sánchez</p>

          <div class="bg-white p-3 rounded-xl shadow border border-outline-variant/30 inline-block mb-3">
            <div id="share-qrcode-container" class="w-[180px] h-[180px] flex items-center justify-center"></div>
          </div>

          <div class="p-3 bg-surface-container-low rounded-lg text-left text-xs space-y-1.5 mb-4 border border-outline-variant/30">
            <div class="flex items-center justify-between gap-2">
              <span class="text-on-surface-variant font-semibold">Código:</span>
              <span id="share-code-id" class="font-mono text-primary font-bold">HLX-VISIT-894A</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-on-surface-variant font-semibold">Ingreso / Placas:</span>
              <span id="share-plate" class="font-mono font-semibold text-on-surface">-</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-on-surface-variant font-semibold">Vigencia:</span>
              <span id="share-validity" class="font-semibold text-primary text-right">-</span>
            </div>
            <div class="pt-1 border-t border-outline-variant/30">
              <span class="text-on-surface-variant font-semibold">Destino:</span>
              <span id="share-destination" class="font-medium text-on-surface block truncate">-</span>
            </div>
          </div>

          <div class="space-y-2">
            <button id="share-whatsapp-btn" class="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-label-sm font-bold uppercase rounded-lg shadow flex items-center justify-center gap-2 text-xs transition-all">
              <span class="material-symbols-outlined text-lg">share</span>
              <span>Compartir Tarjeta por WhatsApp</span>
            </button>
            <button id="download-invite-png-btn" class="w-full h-10 bg-primary hover:bg-primary-container text-secondary-fixed font-label-sm font-bold uppercase rounded-lg shadow-sm flex items-center justify-center gap-2 text-xs transition-all">
              <span class="material-symbols-outlined text-lg">download</span>
              <span>Descargar Pase (PNG)</span>
            </button>
            <button id="close-invite-preview-btn" class="w-full h-9 bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm font-semibold uppercase rounded-lg text-xs">
              Volver a Invitaciones
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

    // Toggle license simulation button (if exists)
    const toggleLicBtn = document.getElementById('toggle-license-btn');
    if (toggleLicBtn) {
      toggleLicBtn.addEventListener('click', handleToggleLicense);
    }

    // Tab buttons
    document.getElementById('tab-btn-access').addEventListener('click', () => switchTab('access'));
    document.getElementById('tab-btn-invites').addEventListener('click', () => switchTab('invites'));
    document.getElementById('tab-btn-details').addEventListener('click', () => switchTab('details'));

    // Regenerate QR Button
    document.getElementById('regenerate-qr-btn').addEventListener('click', generateResidentQR);

    // Download Resident QR PNG Button
    const downloadResidentPngBtn = document.getElementById('download-resident-png-btn');
    if (downloadResidentPngBtn) {
      downloadResidentPngBtn.addEventListener('click', handleDownloadResidentQrPng);
    }

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

    const avatarImg = document.getElementById('user-avatar-img');
    const resolvedAvatar = window.HeylexAPI.getAvatarForUser
      ? window.HeylexAPI.getAvatarForUser(user)
      : user.avatar;
    const detectedSex = window.HeylexAPI.detectGender
      ? window.HeylexAPI.detectGender(user)
      : 'M';
    avatarImg.src = resolvedAvatar;
    avatarImg.alt = `Avatar ${detectedSex === 'F' ? 'Mujer' : 'Hombre'} - ${user.name}`;
    avatarImg.title = `${user.name} (${detectedSex === 'F' ? 'Perfil Femenino' : 'Perfil Masculino'})`;
    avatarImg.onerror = () => {
      if (window.HeylexAPI.getAvatarForUser) {
        avatarImg.src = window.HeylexAPI.getAvatarForUser({ name: user.name, gender: detectedSex });
      }
    };

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

    // Cargar Estado de Cuenta y Cuotas del Residente
    loadResidentFinanceDetails(user);

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

  /* =========================================================================
   * VISUAL PASS CARD GENERATOR (HTML5 CANVAS -> PNG & WEB SHARE API)
   * ======================================================================= */

  function formatAccessTypeLabel(accessType) {
    switch (accessType) {
      case 'SINGLE_USE':
        return 'Un Solo Uso (Entrada única)';
      case 'TEMPORARY_DAY':
        return 'Pase por 24 Horas';
      case 'WEEKEND':
        return 'Fin de Semana (48 Horas)';
      default:
        return 'Acceso Temporal';
    }
  }

  function formatShortDateTime(isoStr) {
    if (!isoStr) return 'Vigencia estándar';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function truncateCanvasText(ctx, text, maxWidth) {
    const str = String(text || '-');
    if (ctx.measureText(str).width <= maxWidth) return str;
    let truncated = str;
    while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '…';
  }

  function extractQrDrawable(containerId, fallbackText) {
    const container = document.getElementById(containerId);
    if (container) {
      const qrCanvas = container.querySelector('canvas');
      if (qrCanvas && qrCanvas.width > 0) return qrCanvas;
      const qrImg = container.querySelector('img');
      if (qrImg && qrImg.complete && qrImg.naturalWidth > 0) return qrImg;
    }
    // Offscreen fallback if DOM QR is not ready
    const tempDiv = document.createElement('div');
    new QRCode(tempDiv, {
      text: fallbackText || 'HLX-PASS',
      width: 260,
      height: 260,
      colorDark: '#002546',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
    return tempDiv.querySelector('canvas') || tempDiv.querySelector('img');
  }

  function buildPassCardCanvas(cardData) {
    const W = 640;
    const H = 940;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 1. Deep Navy Outer Backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#001c38');
    bgGrad.addColorStop(0.5, '#002546');
    bgGrad.addColorStop(1, '#0d3b66');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle ambient lime glow at top right
    const radGrad = ctx.createRadialGradient(W - 80, 80, 10, W - 80, 80, 260);
    radGrad.addColorStop(0, 'rgba(212, 240, 52, 0.18)');
    radGrad.addColorStop(1, 'rgba(212, 240, 52, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Main Pass Card Container
    const cardX = 28;
    const cardY = 28;
    const cardW = W - 56;
    const cardH = H - 56;

    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d4f034';
    ctx.stroke();

    // 3. Card Top Header Banner
    ctx.save();
    drawRoundedRect(ctx, cardX, cardY, cardW, 134, 22);
    ctx.clip();
    const hdrGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + 134);
    hdrGrad.addColorStop(0, '#002546');
    hdrGrad.addColorStop(1, '#0d3b66');
    ctx.fillStyle = hdrGrad;
    ctx.fillRect(cardX, cardY, cardW, 134);

    // Bottom lime accent stripe inside header
    ctx.fillStyle = '#d4f034';
    ctx.fillRect(cardX, cardY + 129, cardW, 5);
    ctx.restore();

    // Brand Logo Box inside Header
    drawRoundedRect(ctx, cardX + 28, cardY + 26, 52, 52, 12);
    ctx.fillStyle = '#d4f034';
    ctx.fill();

    // Draw HEYLEX "H" icon inside logo box
    ctx.strokeStyle = '#002546';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cardX + 43, cardY + 38);
    ctx.lineTo(cardX + 43, cardY + 66);
    ctx.moveTo(cardX + 65, cardY + 38);
    ctx.lineTo(cardX + 65, cardY + 66);
    ctx.moveTo(cardX + 43, cardY + 52);
    ctx.lineTo(cardX + 65, cardY + 52);
    ctx.stroke();

    // Brand Title & Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 26px Montserrat, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HEYLEX', cardX + 94, cardY + 53);

    ctx.fillStyle = '#d4f034';
    ctx.font = '700 11px Montserrat, sans-serif';
    ctx.fillText('CONTROL INTELIGENTE DE ACCESOS', cardX + 94, cardY + 72);

    // Status Pill Badge (Top Right)
    const badgeW = 148;
    const badgeH = 30;
    const badgeX = cardX + cardW - badgeW - 28;
    const badgeY = cardY + 32;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 15);
    ctx.fillStyle = '#d4f034';
    ctx.fill();

    ctx.fillStyle = '#002546';
    ctx.font = '800 11px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cardData.badgeText || 'PASE AUTORIZADO', badgeX + badgeW / 2, badgeY + 19);

    // Pass Category Strip Text inside Header
    ctx.fillStyle = '#d3e4ff';
    ctx.font = '600 13px Montserrat, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(cardData.passSubtitle || 'PASE DIGITAL DE VISITANTE • CASETA RESIDENCIAL', cardX + 28, cardY + 108);

    // 4. QR Code Frame & Optical Brackets
    const qrBoxW = 290;
    const qrBoxH = 315;
    const qrBoxX = (W - qrBoxW) / 2;
    const qrBoxY = cardY + 154;

    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 20);
    ctx.fillStyle = '#f8f9fc';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e0e3e6';
    ctx.stroke();

    // White inner QR pad
    const padSize = 236;
    const padX = (W - padSize) / 2;
    const padY = qrBoxY + 18;
    drawRoundedRect(ctx, padX, padY, padSize, padSize, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Draw QR Code Image/Canvas
    const qrSource = extractQrDrawable(cardData.qrContainerId, cardData.code);
    if (qrSource) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(qrSource, padX + 16, padY + 16, padSize - 32, padSize - 32);
      ctx.restore();
    }

    // Corner viewfinder brackets around QR pad
    const bLen = 18;
    ctx.strokeStyle = '#002546';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(padX - 4, padY + bLen);
    ctx.lineTo(padX - 4, padY - 4);
    ctx.lineTo(padX + bLen, padY - 4);
    // Top-right
    ctx.moveTo(padX + padSize - bLen, padY - 4);
    ctx.lineTo(padX + padSize + 4, padY - 4);
    ctx.lineTo(padX + padSize + 4, padY + bLen);
    // Bottom-left
    ctx.moveTo(padX - 4, padY + padSize - bLen);
    ctx.lineTo(padX - 4, padY + padSize + 4);
    ctx.lineTo(padX + bLen, padY + padSize + 4);
    // Bottom-right
    ctx.moveTo(padX + padSize - bLen, padY + padSize + 4);
    ctx.lineTo(padX + padSize + 4, padY + padSize + 4);
    ctx.lineTo(padX + padSize + 4, padY + padSize - bLen);
    ctx.stroke();

    // Token Pill inside QR Frame bottom
    const tokW = 250;
    const tokH = 34;
    const tokX = (W - tokW) / 2;
    const tokY = qrBoxY + qrBoxH - 46;
    drawRoundedRect(ctx, tokX, tokY, tokW, tokH, 10);
    ctx.fillStyle = '#002546';
    ctx.fill();

    ctx.fillStyle = '#d4f034';
    ctx.font = '700 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(truncateCanvasText(ctx, cardData.displayCode || cardData.code, tokW - 20), W / 2, tokY + 22);

    // 5. Visitor & Destination Details Panel
    const infoX = cardX + 28;
    const infoY = qrBoxY + qrBoxH + 20;
    const infoW = cardW - 56;
    const infoH = 295;

    drawRoundedRect(ctx, infoX, infoY, infoW, infoH, 18);
    ctx.fillStyle = '#f2f4f7';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#c3c6d0';
    ctx.stroke();

    const leftCol = infoX + 24;
    const maxTextW = infoW - 48;

    // Row 1: Visitor / Holder Name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#576500';
    ctx.font = '700 11px Montserrat, sans-serif';
    ctx.fillText(cardData.holderLabel || 'VISITANTE AUTORIZADO', leftCol, infoY + 30);

    ctx.fillStyle = '#002546';
    ctx.font = '800 21px Montserrat, sans-serif';
    ctx.fillText(truncateCanvasText(ctx, cardData.holderName, maxTextW), leftCol, infoY + 56);

    // Divider line
    ctx.strokeStyle = '#dce3eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftCol, infoY + 72);
    ctx.lineTo(infoX + infoW - 24, infoY + 72);
    ctx.stroke();

    // Row 2: Destination Community & Unit
    ctx.fillStyle = '#42474f';
    ctx.font = '700 11px Montserrat, sans-serif';
    ctx.fillText('UBICACIÓN / DESTINO RESIDENCIAL', leftCol, infoY + 96);

    ctx.fillStyle = '#191c1e';
    ctx.font = '700 15px Montserrat, sans-serif';
    ctx.fillText(truncateCanvasText(ctx, cardData.destination, maxTextW), leftCol, infoY + 118);

    ctx.fillStyle = '#42474f';
    ctx.font = '500 12px Montserrat, sans-serif';
    ctx.fillText(truncateCanvasText(ctx, cardData.addressOrZone || '', maxTextW), leftCol, infoY + 138);

    // Row 3 (Two Columns): Entry Type / Plate & Validity
    const col2X = infoX + Math.floor(infoW / 2) + 10;
    const halfColW = Math.floor(infoW / 2) - 34;

    ctx.fillStyle = '#42474f';
    ctx.font = '700 11px Montserrat, sans-serif';
    ctx.fillText('MODALIDAD / PLACAS', leftCol, infoY + 174);
    ctx.fillText('VIGENCIA DEL PASE', col2X, infoY + 174);

    ctx.fillStyle = '#002546';
    ctx.font = '700 14px Montserrat, sans-serif';
    ctx.fillText(truncateCanvasText(ctx, cardData.entryAndPlate, halfColW), leftCol, infoY + 196);
    ctx.fillText(truncateCanvasText(ctx, cardData.validityTitle, halfColW), col2X, infoY + 196);

    ctx.fillStyle = '#576500';
    ctx.font = '600 11px Montserrat, sans-serif';
    ctx.fillText(truncateCanvasText(ctx, cardData.notes || 'Ingreso monitoreado 24/7', halfColW), leftCol, infoY + 214);
    ctx.fillText(truncateCanvasText(ctx, cardData.validitySub, halfColW), col2X, infoY + 214);

    // Divider line 2
    ctx.strokeStyle = '#dce3eb';
    ctx.beginPath();
    ctx.moveTo(leftCol, infoY + 232);
    ctx.lineTo(infoX + infoW - 24, infoY + 232);
    ctx.stroke();

    // Row 4: Host / Authorized By
    ctx.fillStyle = '#42474f';
    ctx.font = '700 10px Montserrat, sans-serif';
    ctx.fillText('AUTORIZADO POR ANFITRIÓN:', leftCol, infoY + 254);

    ctx.fillStyle = '#002546';
    ctx.font = '700 13px Montserrat, sans-serif';
    ctx.fillText(truncateCanvasText(ctx, cardData.authorizedBy, maxTextW), leftCol, infoY + 274);

    // 6. Footer Security Instructions
    const footerY = infoY + infoH + 30;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#42474f';
    ctx.font = '600 12px Montserrat, sans-serif';
    ctx.fillText('Muestra este código QR en el lector óptico de caseta o al oficial en turno.', W / 2, footerY);

    ctx.fillStyle = '#002546';
    ctx.font = '800 13px Montserrat, sans-serif';
    ctx.fillText('HEYLEX Parking & Security Systems   •   ...Tu lugar seguro', W / 2, footerY + 24);

    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('No se pudo generar la imagen PNG.'));
        }, 'image/png');
      } else {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const binStr = atob(dataUrl.split(',')[1]);
          const len = binStr.length;
          const arr = new Uint8Array(len);
          for (let i = 0; i < len; i++) arr[i] = binStr.charCodeAt(i);
          resolve(new Blob([arr], { type: 'image/png' }));
        } catch (err) {
          reject(err);
        }
      }
    });
  }

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function downloadPassAsPng(cardData, filename) {
    try {
      const canvas = buildPassCardCanvas(cardData);
      const blob = await canvasToBlob(canvas);
      triggerBlobDownload(blob, filename);
      window.showToast?.('Pase Descargado (PNG)', `Se guardó la tarjeta ${filename} en tu dispositivo.`);
    } catch (err) {
      window.HeylexUI.alert({
        title: 'Error de Descarga',
        message: err.message || 'Error al descargar el pase en PNG.',
        type: 'error'
      });
    }
  }

  async function sharePassCard(cardData, whatsappText, filename) {
    try {
      const canvas = buildPassCardCanvas(cardData);
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], filename, { type: 'image/png' });

      // 1. Try Native Web Share API with PNG File attachment (Mobile iOS/Android & supported browsers)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Pase de Acceso Digital HEYLEX',
            text: whatsappText
          });
          window.showToast?.('Pase Compartido', 'Tarjeta visual enviada exitosamente.');
          return;
        } catch (shareErr) {
          if (shareErr && shareErr.name === 'AbortError') {
            return; // User cancelled native share sheet
          }
          // Fall through to desktop clipboard + download + wa.me fallback
        }
      }

      // 2. Desktop / Fallback: Copy image to clipboard (if supported) + Download PNG + Open WhatsApp
      let copiedToClipboard = false;
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          copiedToClipboard = true;
        } catch (clipErr) {
          copiedToClipboard = false;
        }
      }

      triggerBlobDownload(blob, filename);

      if (copiedToClipboard) {
        window.showToast?.(
          'Tarjeta Copiada y Descargada',
          'Pega la imagen (Ctrl+V) directamente en el chat de WhatsApp.'
        );
      } else {
        window.showToast?.(
          'Tarjeta PNG Descargada',
          'Adjunta la imagen descargada en tu conversación de WhatsApp.'
        );
      }

      const encodedMsg = encodeURIComponent(whatsappText);
      window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
    } catch (err) {
      window.HeylexUI.alert({
        title: 'Error al Compartir',
        message: err.message || 'No fue posible compartir el pase.',
        type: 'error'
      });
    }
  }

  function getResidentPassCardData() {
    const session = window.HeylexAPI.getCurrentSession();
    if (!session || !session.user) return null;
    const user = session.user;
    const fullCode = currentResidentPass ? currentResidentPass.qrPayload : `HLX-RES|${user.id}`;
    const shortToken = fullCode.split('|').pop() || 'RES-ACTIVO';

    return {
      qrContainerId: 'resident-qrcode-container',
      code: fullCode,
      displayCode: `TOKEN: HLX-RES-${shortToken}`,
      badgeText: 'RESIDENTE ACTIVO',
      passSubtitle: 'CREDENCIAL DIGITAL DE RESIDENTE • ACCESO CASETA',
      holderLabel: 'TITULAR RESIDENTE',
      holderName: user.name,
      destination: `${user.community.name} - ${user.community.unit}`,
      addressOrZone: `${user.community.zone} • ${user.community.address}`,
      entryAndPlate: 'Acceso Residente Verificado',
      validityTitle: 'Dinámico Anti-Fraude',
      validitySub: `Renovación automática (180s)`,
      notes: user.membership.licensePlan || 'Membresía Activa',
      authorizedBy: `${user.name} (Titular verificado)`
    };
  }

  function getVisitorPassCardData(inv) {
    const session = window.HeylexAPI.getCurrentSession();
    const user = session && session.user ? session.user : null;
    const dest = user ? `${user.community.name} - ${user.community.unit}` : 'Residencial HEYLEX';
    const zoneAndAddress = user
      ? `${user.community.zone} • ${user.community.address}`
      : 'Control de Acceso Caseta Principal';
    const entryMode = inv.entryType === 'PEATONAL' ? 'PEATONAL' : 'VEHICULAR';
    const plateStr = inv.vehiclePlate ? `Placas: ${inv.vehiclePlate}` : 'Sin placas (Peatonal)';

    return {
      qrContainerId: 'share-qrcode-container',
      code: inv.qrCode,
      displayCode: inv.qrCode,
      badgeText: 'PASE AUTORIZADO',
      passSubtitle: 'PASE DIGITAL DE VISITANTE • CASETA RESIDENCIAL',
      holderLabel: 'VISITANTE AUTORIZADO',
      holderName: inv.visitorName,
      destination: dest,
      addressOrZone: zoneAndAddress,
      entryAndPlate: `${entryMode} • ${plateStr}`,
      validityTitle: formatAccessTypeLabel(inv.accessType),
      validitySub: `Vence: ${formatShortDateTime(inv.validTo)}`,
      notes: inv.notes ? `Motivo: ${inv.notes}` : 'Ingreso registrado en bitácora',
      authorizedBy: user ? `${user.name} (${user.community.unit})` : 'Residente Autorizado'
    };
  }

  async function handleDownloadResidentQrPng() {
    const session = window.HeylexAPI.getCurrentSession();
    if (!session || !session.user || session.user.membership.status !== 'ACTIVE') {
      window.HeylexUI.alert({
        title: 'Licencia Requerida',
        message: 'Tu membresía o licencia debe estar activa para descargar tu pase QR de residente.',
        type: 'warning'
      });
      return;
    }
    const cardData = getResidentPassCardData();
    if (!cardData) return;
    const cleanName = session.user.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    await downloadPassAsPng(cardData, `Pase-Residente-HEYLEX-${cleanName}.png`);
  }

  async function handleShareResidentQrWhatsApp() {
    const session = window.HeylexAPI.getCurrentSession();
    if (!session || !session.user) {
      window.HeylexUI.alert({
        title: 'Inicio de Sesión Requerido',
        message: 'Debes iniciar sesión con tu cuenta de residente para compartir tu pase.',
        type: 'info'
      });
      return;
    }

    if (session.user.membership.status !== 'ACTIVE') {
      window.HeylexUI.alert({
        title: 'Acceso Restringido',
        message: 'Tu licencia o cuota no se encuentra activa. No es posible emitir códigos de acceso.',
        type: 'warning'
      });
      return;
    }

    const user = session.user;
    const dest = `${user.community.name} - ${user.community.unit}`;
    const code = currentResidentPass ? currentResidentPass.qrPayload : 'HLX-RES-ACTIVO';
    const cardData = getResidentPassCardData();
    const quickQrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(code)}&size=300&dark=002546&ecLevel=M`;

    const whatsappText =
      `🛡️ *PASE DE ACCESO DIGITAL RESIDENTE HEYLEX*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Residente:* ${user.name}\n` +
      `📍 *Destino:* ${dest} (${user.community.zone})\n` +
      `🔑 *Código de Entrada:* ${code}\n` +
      `⏱️ *Vigencia:* Código temporal y dinámico de caseta.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📲 *Ver Imagen del Código QR:*\n${quickQrUrl}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `ℹ️ _Presenta la tarjeta QR adjunta o el enlace anterior al oficial de guardia o en el tótem de entrada._`;

    const cleanName = user.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    await sharePassCard(cardData, whatsappText, `Pase-Residente-HEYLEX-${cleanName}.png`);
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
          const confirmed = await window.HeylexUI.confirm({
            title: '¿Revocar Invitación?',
            message: '¿Deseas revocar y anular este pase de visita? El código QR quedará invalidado de inmediato en la caseta.',
            confirmText: 'Sí, Revocar',
            cancelText: 'Conservar',
            isDestructive: true
          });
          if (confirmed) {
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

    const entryMode = inv.entryType === 'PEATONAL' ? 'Peatonal' : 'Vehicular';
    const plateInfo = inv.vehiclePlate ? `${entryMode} • ${inv.vehiclePlate}` : `${entryMode} (Sin placas)`;
    const validityText = formatAccessTypeLabel(inv.accessType);

    document.getElementById('share-visitor-name').textContent = inv.visitorName;
    document.getElementById('share-code-id').textContent = inv.qrCode;
    document.getElementById('share-plate').textContent = plateInfo;
    const validityEl = document.getElementById('share-validity');
    if (validityEl) {
      validityEl.textContent = validityText;
    }

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

    const cleanVisitor = (inv.visitorName || 'Visita')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-');
    const filename = `Pase-HEYLEX-${cleanVisitor}-${inv.qrCode}.png`;
    const quickQrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(inv.qrCode)}&size=300&dark=002546&ecLevel=M`;

    // Download PNG button
    const downloadBtn = document.getElementById('download-invite-png-btn');
    if (downloadBtn) {
      downloadBtn.onclick = async () => {
        const cardData = getVisitorPassCardData(inv);
        await downloadPassAsPng(cardData, filename);
      };
    }

    // Share by WhatsApp (Web Share API with image file or Clipboard + Download + WhatsApp)
    const shareBtn = document.getElementById('share-whatsapp-btn');
    shareBtn.onclick = async () => {
      const cardData = getVisitorPassCardData(inv);
      const hostName = session && session.user ? session.user.name : 'Anfitrión Residente';
      const whatsappText =
        `🛡️ *PASE DIGITAL DE ACCESO HEYLEX*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Visitante:* ${inv.visitorName}\n` +
        `📍 *Destino:* ${dest}\n` +
        `🚗 *Ingreso:* ${plateInfo}\n` +
        `⏱️ *Vigencia:* ${validityText} (Hasta ${formatShortDateTime(inv.validTo)})\n` +
        `🔑 *Código QR:* ${inv.qrCode}\n` +
        `🏡 *Autoriza:* ${hostName}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📲 *Ver Imagen del Código QR:*\n${quickQrUrl}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `ℹ️ _Presenta la tarjeta QR adjunta o el enlace anterior en el lector óptico de caseta o al oficial de guardia._`;

      await sharePassCard(cardData, whatsappText, filename);
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
      updatePersistentResidentDock(session);
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
    const confirmed = await window.HeylexUI.confirm({
      title: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas cerrar tu sesión en este dispositivo?',
      confirmText: 'Sí, Salir',
      cancelText: 'Permanecer',
      type: 'warning'
    });
    if (!confirmed) return;

    await window.HeylexAPI.logout();
    if (qrCountdownInterval) clearInterval(qrCountdownInterval);
    updateHeaderUserStatus(null);
    updatePersistentResidentDock(null);
    closeAllModals();
    window.showToast?.('Sesión Finalizada', 'Has salido del portal.');
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
      window.HeylexUI.alert({
        title: 'Error al Generar Invitación',
        message: err.message || 'No fue posible crear la invitación para el visitante.',
        type: 'error'
      });
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

  // ==============================================================
  // MÓDULO CONTABLE RESIDENTE: ESTADO DE CUENTA Y RECIBOS
  // ==============================================================
  async function loadResidentFinanceDetails(user) {
    const listEl = document.getElementById('det-cuotas-list');
    const badgeEl = document.getElementById('det-resident-balance-badge');
    const conceptEl = document.getElementById('det-spei-concept');
    if (!listEl) return;

    if (conceptEl) {
      conceptEl.textContent = `${user.community.unit || 'Casa'} Cuota Mantenimiento`;
    }

    try {
      const cuotas = await window.HeylexAPI.getCuotas({ residentId: user.id });
      const pagos = await window.HeylexAPI.getPagos({ residentId: user.id });

      const overdueCuotas = cuotas.filter(c => c.status === 'vencida');
      if (overdueCuotas.length > 0) {
        const totalDue = overdueCuotas.reduce((sum, c) => sum + (c.amount || 0), 0);
        badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800';
        badgeEl.textContent = `Adeudo: $${totalDue.toFixed(2)} MXN (${overdueCuotas.length} cuotas)`;
      } else {
        badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800';
        badgeEl.textContent = 'Al Corriente';
      }

      if (cuotas.length === 0) {
        listEl.innerHTML = `<div class="p-3 text-center text-gray-400">Sin cuotas registradas en este período.</div>`;
        return;
      }

      listEl.innerHTML = cuotas.map(c => {
        let badgeColor = 'bg-amber-100 text-amber-800';
        let label = 'Pendiente';
        if (c.status === 'pagada') {
          badgeColor = 'bg-emerald-100 text-emerald-800';
          label = 'Pagada';
        } else if (c.status === 'vencida') {
          badgeColor = 'bg-rose-100 text-rose-800';
          label = 'Vencida';
        }

        const isPaid = (c.status === 'pagada');
        const actionBtn = isPaid
          ? `<button class="resident-view-receipt-btn px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[10px] flex items-center gap-1 transition-all" data-cuota-id="${c.id}">
               <span class="material-symbols-outlined text-xs text-primary">receipt</span>
               <span>Ver Recibo</span>
             </button>`
          : `<span class="text-[10px] text-gray-500 font-mono">Vence: ${c.dueDate}</span>`;

        return `
          <div class="p-2.5 bg-white rounded-lg border border-gray-200 flex items-center justify-between gap-2 shadow-xs">
            <div>
              <div class="font-bold text-gray-800">${c.concept}</div>
              <div class="text-[11px] font-mono text-gray-600 font-semibold">$${Number(c.amount).toFixed(2)} MXN</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${badgeColor}">${label}</span>
              ${actionBtn}
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.resident-view-receipt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cuotaId = btn.getAttribute('data-cuota-id');
          const p = pagos.find(x => String(x.cuotaId) === String(cuotaId));
          if (p) {
            openResidentReceiptModal(p);
          } else {
            window.HeylexUI.alert({
              title: 'Recibo en Proceso',
              message: 'El recibo está siendo emitido por la administración.',
              type: 'info'
            });
          }
        });
      });

    } catch (e) {
      listEl.innerHTML = `<div class="p-2 text-rose-600">Error al consultar estado de cuenta: ${e.message}</div>`;
    }
  }

  function openResidentReceiptModal(payment) {
    const receiptHtml = `
      <div class="space-y-4 text-left font-sans">
        <div class="p-4 bg-primary text-white rounded-xl flex items-center justify-between shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-black text-secondary-fixed">
              HLX
            </div>
            <div>
              <h4 class="font-bold text-sm tracking-wide">RECIBO DE CUOTA CONDOMINAL</h4>
              <p class="text-[10px] text-gray-300">COMPROBANTE OFICIAL RESIDENTE</p>
            </div>
          </div>
          <div class="text-right">
            <span class="block text-[10px] uppercase font-bold text-secondary-fixed">Folio</span>
            <span class="font-mono text-sm font-black">${payment.folio}</span>
          </div>
        </div>

        <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Residente:</span>
            <span class="font-bold text-gray-900">${payment.residentName}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Unidad:</span>
            <span class="font-bold text-gray-900">${payment.unit}</span>
          </div>
          <div class="col-span-2 border-t border-gray-200 pt-2">
            <span class="block text-[10px] font-bold uppercase text-gray-500">Concepto:</span>
            <span class="font-semibold text-gray-800">${payment.concept}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Método:</span>
            <span class="font-bold uppercase text-gray-800">${payment.paymentMethod}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Referencia:</span>
            <span class="font-mono text-gray-800 font-bold">${payment.reference || 'AUT-INTERNA'}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Fecha:</span>
            <span class="font-mono text-gray-800">${payment.paidAt}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold uppercase text-gray-500">Estatus:</span>
            <span class="font-bold text-emerald-700 uppercase">Validado y Conciliado</span>
          </div>
        </div>

        <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
          <span class="text-xs font-bold uppercase text-emerald-800">Total Liquidado:</span>
          <span class="text-2xl font-black text-emerald-800">$${Number(payment.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
        </div>
      </div>
    `;

    window.HeylexUI.modal({
      title: `Recibo Oficial: ${payment.folio}`,
      content: receiptHtml,
      confirmText: 'Imprimir / Guardar Recibo',
      cancelText: 'Cerrar'
    }).then(confirmed => {
      if (confirmed) window.print();
    });
  }

  // Expose methods for testing
  window.HeylexPortal = {
    open: openResidentPortal,
    close: closeAllModals
  };
})();
