/**
 * HEYLEX Caseta - Módulo Operativo de Control de Acceso y Seguridad
 * Gestiona verificación de credenciales QR, apertura de pluma,
 * registro de paquetería, búsqueda de visitas y bitácora forense.
 */

(function () {
  'use strict';

  // State
  let currentCommunityId = 'com_001';
  let currentSession = null;
  let currentVerification = null;
  let audioContext = null;
  let soundEnabled = localStorage.getItem('heylex_caseta_sound_enabled') !== 'false';
  let cameraStream = null;

  // DOM Elements
  const el = {
    clock: document.getElementById('live-clock'),
    date: document.getElementById('live-date'),
    soundBtn: document.getElementById('btn-toggle-sound'),
    soundIcon: document.getElementById('sound-icon'),
    selectCommunity: document.getElementById('select-community'),
    guardAvatar: document.getElementById('guard-avatar'),
    guardName: document.getElementById('guard-name'),
    btnLogout: document.getElementById('btn-guard-logout'),
    loginModal: document.getElementById('modal-guard-login'),
    loginForm: document.getElementById('guard-login-form'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabViews: document.querySelectorAll('.tab-view'),
    // Scanner
    qrInput: document.getElementById('qr-manual-input'),
    btnVerify: document.getElementById('btn-verify-code'),
    quickTestBtns: document.querySelectorAll('.quick-test-btn'),
    cardIdle: document.getElementById('card-state-idle'),
    cardResult: document.getElementById('card-state-result'),
    resultBanner: document.getElementById('result-banner'),
    resultIcon: document.getElementById('result-icon'),
    resultStatusText: document.getElementById('result-status-text'),
    resultTypeBadge: document.getElementById('result-type-badge'),
    resultAvatar: document.getElementById('result-avatar'),
    resultRoleChip: document.getElementById('result-role-chip'),
    resultPlate: document.getElementById('result-plate'),
    resultName: document.getElementById('result-name'),
    resultUnit: document.getElementById('result-unit'),
    resultZone: document.getElementById('result-zone'),
    resultPhone: document.getElementById('result-phone'),
    resultEntryType: document.getElementById('result-entry-type'),
    resultValidity: document.getElementById('result-validity'),
    resultReasonCard: document.getElementById('result-reason-card'),
    resultReasonText: document.getElementById('result-reason-text'),
    resultDebtDetails: document.getElementById('result-debt-details'),
    resultDebtAmount: document.getElementById('result-debt-amount'),
    resultDebtCount: document.getElementById('result-debt-count'),
    resultHostCard: document.getElementById('result-host-card'),
    resultHostName: document.getElementById('result-host-name'),
    resultHostUnit: document.getElementById('result-host-unit'),
    // Action buttons
    btnGrant: document.getElementById('btn-grant-access'),
    btnExit: document.getElementById('btn-record-exit'),
    btnReject: document.getElementById('btn-reject-access'),
    btnReset: document.getElementById('btn-reset-view'),
    btnEmergency: document.getElementById('btn-emergency-gate'),
    // Camera
    btnOpenCamera: document.getElementById('btn-open-camera'),
    btnCloseCamera: document.getElementById('btn-close-camera'),
    cameraModal: document.getElementById('camera-scanner-modal'),
    cameraVideo: document.getElementById('camera-video'),
    // Visits
    searchVisits: document.getElementById('search-visits-input'),
    visitsTbody: document.getElementById('visits-table-body'),
    // Delivery
    deliveryForm: document.getElementById('form-delivery'),
    deliveryCompany: document.getElementById('delivery-company'),
    companyPresetBtns: document.querySelectorAll('.preset-company-btn'),
    deliveryVisitorName: document.getElementById('delivery-visitor-name'),
    deliveryPlate: document.getElementById('delivery-plate'),
    deliveryUnit: document.getElementById('delivery-unit'),
    deliveryNotes: document.getElementById('delivery-notes'),
    // Logs
    logsTbody: document.getElementById('logs-table-body'),
    btnRefreshLogs: document.getElementById('btn-refresh-logs')
  };

  /* =========================================================================
   * 1. AUDIO SYNTHESIZER (Web Audio API - Cero dependencias externas)
   * ======================================================================= */
  function getAudioContext() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioContext = new AudioCtx();
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  }

  function playTone(freq, duration, type = 'sine', startTime = 0) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  function playSuccessChime() {
    playTone(587.33, 0.12, 'sine', 0);     // D5
    playTone(880.00, 0.35, 'triangle', 0.1); // A5
  }

  function playDeniedBuzzer() {
    playTone(180, 0.22, 'sawtooth', 0);
    playTone(130, 0.35, 'sawtooth', 0.15);
  }

  function playBeep() {
    playTone(1050, 0.05, 'sine', 0);
  }

  function updateSoundUI() {
    if (soundEnabled) {
      el.soundIcon.textContent = 'volume_up';
      el.soundBtn.classList.remove('text-red-400');
    } else {
      el.soundIcon.textContent = 'volume_off';
      el.soundBtn.classList.add('text-red-400');
    }
    localStorage.setItem('heylex_caseta_sound_enabled', soundEnabled ? 'true' : 'false');
  }

  /* =========================================================================
   * 2. LIVE DIGITAL CLOCK
   * ======================================================================= */
  function startClock() {
    function tick() {
      const now = new Date();
      if (el.clock) {
        el.clock.textContent = now.toLocaleTimeString('es-MX', { hour12: false });
      }
      if (el.date) {
        const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
        const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        el.date.textContent = `${days[now.getDay()]} ${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`;
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  /* =========================================================================
   * 3. AUTENTICACIÓN Y SESIÓN DEL OFICIAL DE CASETA
   * ======================================================================= */
  async function initSession() {
    currentSession = window.HeylexAPI.getCurrentSession();
    
    // Si no hay sesión o es de un residente simple, requerir login de oficial
    const allowedRoles = ['GUARDIA', 'ADMINISTRADOR', 'ROLE_ADMIN', 'ROLE_GUARD'];
    const userRole = (currentSession?.user?.role || '').toUpperCase();

    if (!currentSession || !allowedRoles.includes(userRole)) {
      showLoginModal();
    } else {
      hideLoginModal();
      populateGuardProfile();
    }
  }

  function showLoginModal() {
    el.loginModal.classList.remove('hidden');
  }

  function hideLoginModal() {
    el.loginModal.classList.add('hidden');
    if (el.qrInput) el.qrInput.focus();
  }

  function populateGuardProfile() {
    if (!currentSession || !currentSession.user) return;
    const u = currentSession.user;
    if (el.guardName) el.guardName.textContent = u.name || 'Oficial en Turno';
    if (el.guardAvatar && u.avatar) el.guardAvatar.src = u.avatar;
  }

  /* =========================================================================
   * 4. TAB NAVIGATION
   * ======================================================================= */
  function switchTab(tabId) {
    el.tabButtons.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active', 'bg-brand-accent', 'text-brand-navy', 'shadow-md');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('active', 'bg-brand-accent', 'text-brand-navy', 'shadow-md');
        btn.classList.add('text-slate-400');
      }
    });

    el.tabViews.forEach(view => {
      if (view.id === `view-${tabId}`) {
        view.classList.remove('hidden');
      } else {
        view.classList.add('hidden');
      }
    });

    if (tabId === 'scanner') {
      setTimeout(() => el.qrInput?.focus(), 100);
    } else if (tabId === 'visits') {
      loadVisits();
    } else if (tabId === 'logs') {
      loadLogs();
    }
  }

  /* =========================================================================
   * 5. ESCÁNER & MOTOR DE VERIFICACIÓN (Pases, QR y Cruces)
   * ======================================================================= */
  async function handleVerify(payload) {
    const code = (payload || el.qrInput.value || '').trim();
    if (!code) {
      window.HeylexUI.alert({
        title: 'Campo Requerido',
        message: 'Por favor ingresa o escanea un código QR antes de verificar.',
        type: 'warning'
      });
      return;
    }

    playBeep();

    try {
      const res = await window.HeylexAPI.verifyPass(code, currentCommunityId);
      currentVerification = {
        code,
        ...res
      };
      renderVerificationResult(currentVerification);
    } catch (err) {
      console.error('Error al verificar pase:', err);
      window.HeylexUI.alert({
        title: 'Error de Verificación',
        message: err.message || 'No fue posible conectar con el servidor de caseta.',
        type: 'error'
      });
    }
  }

  function renderVerificationResult(data) {
    el.cardIdle.classList.add('hidden');
    el.cardResult.classList.remove('hidden');

    const isPermitted = data.permitted === true;
    const isResident = (data.type || '').toUpperCase() === 'RESIDENTE';

    // 1. Audio and Glow Feedback
    if (isPermitted) {
      playSuccessChime();
      el.cardResult.classList.add('status-glow-permitted');
      el.cardResult.classList.remove('status-glow-denied');
    } else {
      playDeniedBuzzer();
      el.cardResult.classList.add('status-glow-denied');
      el.cardResult.classList.remove('status-glow-permitted');
    }

    // 2. Banner Styling
    if (isPermitted) {
      el.resultBanner.className = 'p-4 sm:p-5 flex items-center justify-between gap-4 bg-emerald-600 text-white transition-colors duration-300';
      el.resultIcon.textContent = 'check_circle';
      el.resultStatusText.textContent = 'ACCESO CONCEDIDO';
      el.resultTypeBadge.className = 'px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-800 text-white shadow';
    } else {
      el.resultBanner.className = 'p-4 sm:p-5 flex items-center justify-between gap-4 bg-red-600 text-white transition-colors duration-300';
      el.resultIcon.textContent = 'cancel';
      el.resultStatusText.textContent = 'ACCESO DENEGADO';
      el.resultTypeBadge.className = 'px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-red-900 text-white shadow';
    }
    el.resultTypeBadge.textContent = isResident ? 'RESIDENTE' : (data.type || 'VISITANTE');

    // 3. Avatar, Role Chip & Plates
    el.resultAvatar.src = data.photo || (isResident ? 'avatars/male-1.png' : 'avatars/male-2.png');
    el.resultRoleChip.textContent = isResident ? 'RESIDENTE' : 'VISITA';
    el.resultRoleChip.className = isResident 
      ? 'absolute -bottom-2 -right-2 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-brand-accent text-brand-navy shadow'
      : 'absolute -bottom-2 -right-2 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-400 text-slate-900 shadow';

    el.resultPlate.textContent = data.vehiclePlate || 'SIN PLACAS / PEATONAL';
    el.resultName.textContent = data.name || data.visitorName || 'Usuario No Identificado';
    el.resultUnit.textContent = data.unit || data.hostUnit || 'General';
    el.resultZone.textContent = data.zone || data.hostZone || 'Residencial Cumbres';
    el.resultPhone.textContent = data.phone || 'Teléfono no disponible';
    el.resultEntryType.textContent = (data.entryType || 'VEHICULAR').toUpperCase();
    el.resultValidity.textContent = isPermitted ? 'Vigencia: Activa y Autorizada' : 'Vigencia: Inactiva / Denegada';

    // 4. Reason Card
    if (isPermitted) {
      el.resultReasonCard.className = 'p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-1';
      el.resultDebtDetails.classList.add('hidden');
    } else {
      el.resultReasonCard.className = 'p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 space-y-2';
      if (data.overdueCount > 0 || data.debtAmount > 0) {
        el.resultDebtDetails.classList.remove('hidden');
        el.resultDebtAmount.textContent = `$${Number(data.debtAmount || 0).toLocaleString()} MXN`;
        el.resultDebtCount.textContent = data.overdueCount || 1;
      } else {
        el.resultDebtDetails.classList.add('hidden');
      }
    }
    el.resultReasonText.textContent = data.reason || (isPermitted ? 'Acceso autorizado conforme a protocolo.' : 'Acceso no permitido.');

    // 5. Host details for visitors
    if (!isResident && data.hostName) {
      el.resultHostCard.classList.remove('hidden');
      el.resultHostName.textContent = data.hostName;
      el.resultHostUnit.textContent = `${data.hostUnit || ''} (${data.hostZone || 'Privada Los Robles'})`;
    } else {
      el.resultHostCard.classList.add('hidden');
    }

    // 6. Action button states
    if (isPermitted) {
      el.btnGrant.classList.remove('opacity-50', 'pointer-events-none');
    } else {
      // Allow override if guard decides, but visual is distinct
      el.btnGrant.classList.remove('opacity-50', 'pointer-events-none');
    }
  }

  function resetScannerView() {
    currentVerification = null;
    el.cardResult.classList.add('hidden');
    el.cardResult.classList.remove('status-glow-permitted', 'status-glow-denied');
    el.cardIdle.classList.remove('hidden');
    if (el.qrInput) {
      el.qrInput.value = '';
      el.qrInput.focus();
    }
  }

  /* =========================================================================
   * 6. CRUCE REGISTRATION & HARDWARE PLUMA
   * ======================================================================= */
  async function confirmCross(direction = 'entrada', overrideResult = null) {
    if (!currentVerification) {
      window.HeylexUI.alert({
        title: 'Sin Verificación Activa',
        message: 'Escanea primero un código antes de abrir la pluma o registrar cruce.',
        type: 'warning'
      });
      return;
    }

    const v = currentVerification;
    const finalResult = overrideResult || (v.permitted ? 'PERMITTED' : 'DENIED');

    try {
      const payload = {
        type: v.type || 'RESIDENTE',
        result: finalResult,
        direction,
        residentId: v.residentId || 0,
        visitId: v.visitId || 0,
        name: v.name || v.visitorName || 'Usuario',
        unit: v.unit || v.hostUnit || 'General',
        vehiclePlate: v.vehiclePlate || 'N/A',
        reason: v.reason || 'Cruce registrado en caseta'
      };

      await window.HeylexAPI.recordAccess(payload);

      if (finalResult === 'PERMITTED') {
        window.HeylexUI.toast({
          title: 'Pluma Abierta',
          message: `Cruce de ${direction.toUpperCase()} registrado para ${payload.name}.`,
          type: 'success'
        });
      } else {
        window.HeylexUI.toast({
          title: 'Cruce Rechazado',
          message: `Evento denegado asentado en bitácora forense.`,
          type: 'warning'
        });
      }

      resetScannerView();
    } catch (e) {
      window.HeylexUI.alert({
        title: 'Error de Bitácora',
        message: 'No fue posible asentar el cruce en el historial: ' + e.message,
        type: 'error'
      });
    }
  }

  /* =========================================================================
   * 7. APERTURA MANUAL DE EMERGENCIA (Mandatory Reason Dialog)
   * ======================================================================= */
  async function handleEmergencyGate() {
    const motivo = await window.HeylexUI.prompt({
      title: 'Apertura Manual de Emergencia',
      message: 'Indica el motivo justificado y circunstancia que amerita forzar la apertura de la pluma (Ambulancia, Policía, Bomberos, Falla Mecánica, Cero Energía):',
      placeholder: 'Ej. Ingreso de Ambulancia Cruz Roja por emergencia médica'
    });

    if (motivo === null) return; // Cancelado

    const cleanMotivo = motivo.trim();
    if (!cleanMotivo) {
      window.HeylexUI.alert({
        title: 'Motivo Obligatorio',
        message: 'Por estricto protocolo de seguridad, no es posible forzar la pluma sin asentar el motivo del oficial.',
        type: 'warning'
      });
      return;
    }

    try {
      await window.HeylexAPI.recordAccess({
        type: 'visita',
        result: 'PERMITTED',
        direction: 'entrada',
        name: 'APERTURA DE EMERGENCIA FORZADA',
        unit: 'Caseta General',
        vehiclePlate: 'EMERGENCIA',
        reason: `[PROTOCOLO DE EMERGENCIA]: ${cleanMotivo}`
      });

      playSuccessChime();
      window.HeylexUI.alert({
        title: 'Pluma Abierta por Emergencia',
        message: 'La barrera ha sido liberada y el evento quedó firmado digitalmente con tus credenciales de oficial en la bitácora.',
        type: 'success'
      });
      resetScannerView();
    } catch (err) {
      window.HeylexUI.alert({ title: 'Error', message: err.message, type: 'error' });
    }
  }

  /* =========================================================================
   * 8. WEBRTC LIVE CAMERA SCANNER
   * ======================================================================= */
  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      window.HeylexUI.alert({
        title: 'Cámara No Disponible',
        message: 'Este navegador o terminal no cuenta con soporte WebRTC para cámara.',
        type: 'warning'
      });
      return;
    }

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      el.cameraVideo.srcObject = cameraStream;
      await el.cameraVideo.play();
      el.cameraModal.classList.remove('hidden');

      // Si existe BarcodeDetector en el navegador, intentar escaneo continuo
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const interval = setInterval(async () => {
          if (!cameraStream) {
            clearInterval(interval);
            return;
          }
          try {
            const barcodes = await detector.detect(el.cameraVideo);
            if (barcodes.length > 0) {
              const raw = barcodes[0].rawValue;
              stopCamera();
              handleVerify(raw);
            }
          } catch (e) {}
        }, 400);
      }
    } catch (err) {
      window.HeylexUI.alert({
        title: 'Acceso a Cámara Denegado',
        message: 'Permite el acceso a la cámara en el navegador o utiliza el lector de código de barras USB.',
        type: 'warning'
      });
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    el.cameraModal.classList.add('hidden');
  }

  /* =========================================================================
   * 9. VISITAS DEL DÍA (Search & Direct Entry)
   * ======================================================================= */
  async function loadVisits(search = '') {
    if (!el.visitsTbody) return;
    el.visitsTbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">Cargando visitas programadas...</td></tr>`;

    try {
      const visits = await window.HeylexAPI.getGuardVisits(search, currentCommunityId);
      if (!visits || visits.length === 0) {
        el.visitsTbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">No hay visitas programadas registradas para hoy.</td></tr>`;
        return;
      }

      el.visitsTbody.innerHTML = visits.map(v => {
        const isActive = (v.estatus_vp || '').toLowerCase() === 'activa';
        const statusBadge = isActive
          ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40">Activa</span>`
          : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400">${v.estatus_vp || 'Usada'}</span>`;

        return `
          <tr class="hover:bg-brand-card/70 transition-colors">
            <td class="p-3 font-bold text-white">${v.nombre_vp || 'Visitante'}</td>
            <td class="p-3 font-mono text-amber-300 font-bold">${v.placas_vp || 'N/A'}</td>
            <td class="p-3 text-slate-300">${v.residente_nombre || 'Residente'}</td>
            <td class="p-3 text-slate-300">${v.residente_unidad || 'General'}</td>
            <td class="p-3 text-slate-400 text-[11px]">${v.fechafin_vp ? new Date(v.fechafin_vp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}</td>
            <td class="p-3">${statusBadge}</td>
            <td class="p-3 text-right">
              ${isActive ? `
                <button class="btn-direct-entry px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow transition-all" data-id="${v.id_vp}" data-name="${v.nombre_vp}" data-plate="${v.placas_vp}" data-unit="${v.residente_unidad}">
                  Dar Entrada
                </button>
              ` : `<span class="text-slate-500 text-xs">—</span>`}
            </td>
          </tr>
        `;
      }).join('');

      // Wire up direct entry buttons
      el.visitsTbody.querySelectorAll('.btn-direct-entry').forEach(btn => {
        btn.onclick = async () => {
          const name = btn.dataset.name;
          const plate = btn.dataset.plate;
          const unit = btn.dataset.unit;
          const visitId = btn.dataset.id;

          await window.HeylexAPI.recordAccess({
            type: 'VISITANTE',
            result: 'PERMITTED',
            direction: 'entrada',
            visitId,
            name,
            unit,
            vehiclePlate: plate,
            reason: 'Acceso autorizado desde tabla de visitas del día'
          });

          playSuccessChime();
          window.HeylexUI.toast({
            title: 'Visita Autorizada',
            message: `Pluma abierta para ${name}.`,
            type: 'success'
          });
          loadVisits(el.searchVisits.value);
        };
      });

    } catch (e) {
      el.visitsTbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-400">Error al cargar visitas: ${e.message}</td></tr>`;
    }
  }

  /* =========================================================================
   * 10. REGISTRO DE PAQUETERÍA Y DELIVERY EXPRÉS
   * ======================================================================= */
  function initDelivery() {
    el.companyPresetBtns.forEach(btn => {
      btn.onclick = () => {
        el.companyPresetBtns.forEach(b => {
          b.classList.remove('bg-brand-accent', 'text-brand-navy', 'border-brand-accent');
          b.classList.add('bg-brand-dark', 'text-white');
        });
        btn.classList.add('bg-brand-accent', 'text-brand-navy', 'border-brand-accent');
        btn.classList.remove('bg-brand-dark', 'text-white');
        el.deliveryCompany.value = btn.textContent.trim();
      };
    });

    // Default select first button (Amazon)
    if (el.companyPresetBtns[0]) {
      el.companyPresetBtns[0].click();
    }

    el.deliveryForm.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        company: el.deliveryCompany.value,
        visitorName: el.deliveryVisitorName.value.trim() || el.deliveryCompany.value,
        vehiclePlate: el.deliveryPlate.value.trim().toUpperCase(),
        unit: el.deliveryUnit.value.trim(),
        notes: el.deliveryNotes.value.trim()
      };

      if (!payload.vehiclePlate || !payload.unit) {
        window.HeylexUI.alert({
          title: 'Datos Requeridos',
          message: 'Es obligatorio indicar las placas del vehículo y el lote destino.',
          type: 'warning'
        });
        return;
      }

      try {
        await window.HeylexAPI.registerDelivery(payload);
        playSuccessChime();
        window.HeylexUI.alert({
          title: 'Ingreso Autorizado',
          message: `Se abrió la pluma para ${payload.company} con placas ${payload.vehiclePlate} rumbo a ${payload.unit}.`,
          type: 'success'
        });

        // Reset fields
        el.deliveryVisitorName.value = '';
        el.deliveryPlate.value = '';
        el.deliveryUnit.value = '';
        el.deliveryNotes.value = '';

        // Switch to logs
        switchTab('logs');
      } catch (err) {
        window.HeylexUI.alert({
          title: 'Error de Registro',
          message: err.message,
          type: 'error'
        });
      }
    };
  }

  /* =========================================================================
   * 11. BITÁCORA FORENSE EN VIVO
   * ======================================================================= */
  async function loadLogs() {
    if (!el.logsTbody) return;
    el.logsTbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">Consultando historial forense...</td></tr>`;

    try {
      const logs = await window.HeylexAPI.getAccessLogs(30);
      if (!logs || logs.length === 0) {
        el.logsTbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">Sin eventos de cruce recientes.</td></tr>`;
        return;
      }

      el.logsTbody.innerHTML = logs.map(l => {
        const isPermitted = (l.result || '').toLowerCase() === 'permitido';
        const resultBadge = isPermitted
          ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40">Permitido</span>`
          : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-950 text-red-400 border border-red-500/40">Denegado</span>`;

        const isEntry = (l.direction || '').toLowerCase() === 'entrada';
        const movementBadge = isEntry
          ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-950 text-blue-400 border border-blue-500/30">Entrada</span>`
          : `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-400 border border-amber-500/30">Salida</span>`;

        return `
          <tr class="hover:bg-brand-card/70 transition-colors">
            <td class="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">${l.timestamp || 'Ahora'}</td>
            <td class="p-3 uppercase font-bold text-slate-300 text-[10px]">${l.type || 'Visita'}</td>
            <td class="p-3 font-bold text-white">${l.name || 'Usuario'}</td>
            <td class="p-3 text-slate-300">${l.unit || 'General'}</td>
            <td class="p-3 font-mono text-amber-300 font-bold">${l.vehiclePlate || 'N/A'}</td>
            <td class="p-3">${movementBadge}</td>
            <td class="p-3">${resultBadge}</td>
            <td class="p-3 text-slate-400 text-[11px] max-w-xs truncate">${l.reason || 'Cruce en caseta'}</td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      el.logsTbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-red-400">Error al consultar bitácora: ${e.message}</td></tr>`;
    }
  }

  /* =========================================================================
   * 12. EVENT LISTENERS & INICIALIZACIÓN GENERAL
   * ======================================================================= */
  function setupEventListeners() {
    // Sound FX toggle
    el.soundBtn.onclick = () => {
      soundEnabled = !soundEnabled;
      updateSoundUI();
      if (soundEnabled) playBeep();
    };

    // Community selector
    el.selectCommunity.onchange = (e) => {
      currentCommunityId = e.target.value;
      window.HeylexUI.toast({
        title: 'Fraccionamiento Cambiado',
        message: `Caseta conectada a: ${e.target.options[e.target.selectedIndex].text}`,
        type: 'info'
      });
      resetScannerView();
      loadVisits();
    };

    // Logout
    el.btnLogout.onclick = async () => {
      const confirm = await window.HeylexUI.confirm({
        title: 'Cerrar Turno de Guardia',
        message: '¿Estás seguro de que deseas cerrar tu turno de caseta?',
        confirmText: 'Cerrar Turno',
        cancelText: 'Permanecer Activo'
      });
      if (confirm) {
        await window.HeylexAPI.logout();
        currentSession = null;
        showLoginModal();
      }
    };

    // Login form
    el.loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;

      try {
        const session = await window.HeylexAPI.login(email, pass);
        const role = (session.user?.role || '').toUpperCase();
        if (role === 'RESIDENTE') {
          await window.HeylexAPI.logout();
          window.HeylexUI.alert({
            title: 'Acceso No Autorizado',
            message: 'La cuenta ingresada pertenece a un Residente. El módulo de caseta solo permite acceso a Oficiales de Seguridad y Administradores.',
            type: 'error'
          });
          return;
        }

        currentSession = session;
        hideLoginModal();
        populateGuardProfile();
        window.HeylexUI.toast({
          title: 'Sesión Iniciada',
          message: `Bienvenido Oficial ${session.user.name}`,
          type: 'success'
        });
        playSuccessChime();
      } catch (err) {
        window.HeylexUI.alert({
          title: 'Credenciales Inválidas',
          message: err.message || 'No fue posible iniciar sesión con esos datos.',
          type: 'error'
        });
      }
    };

    // Tabs
    el.tabButtons.forEach(btn => {
      btn.onclick = () => switchTab(btn.dataset.tab);
    });

    // Scanner input Enter key
    el.qrInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleVerify();
      }
    };

    // Barcode scanner button
    el.btnVerify.onclick = () => handleVerify();

    // Quick test simulation buttons
    el.quickTestBtns.forEach(btn => {
      btn.onclick = () => {
        const code = btn.dataset.code;
        el.qrInput.value = code;
        handleVerify(code);
      };
    });

    // Action buttons in Verification Card
    el.btnGrant.onclick = () => confirmCross('entrada', 'PERMITTED');
    el.btnExit.onclick = () => confirmCross('salida', 'PERMITTED');
    el.btnReject.onclick = () => confirmCross('entrada', 'DENIED');
    el.btnReset.onclick = () => resetScannerView();
    el.btnEmergency.onclick = () => handleEmergencyGate();

    // Camera scanner
    el.btnOpenCamera.onclick = () => startCamera();
    el.btnCloseCamera.onclick = () => stopCamera();

    // Visits search
    let visitSearchTimeout;
    el.searchVisits.oninput = (e) => {
      clearTimeout(visitSearchTimeout);
      visitSearchTimeout = setTimeout(() => {
        loadVisits(e.target.value);
      }, 300);
    };

    // Refresh logs
    el.btnRefreshLogs.onclick = () => loadLogs();

    // Global Key Listener for Barcode Gun Hardware Scanner (Typing characters rapidly anywhere on the page)
    let buffer = '';
    let lastKeyTime = Date.now();
    window.addEventListener('keydown', (e) => {
      // Si el usuario está escribiendo en un input text normal, dejarlo fluir
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length > 2) {
          e.preventDefault();
          el.qrInput.value = buffer;
          handleVerify(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    });
  }

  // Auto-init on page load
  document.addEventListener('DOMContentLoaded', () => {
    updateSoundUI();
    startClock();
    initSession();
    setupEventListeners();
    initDelivery();
  });

})();

