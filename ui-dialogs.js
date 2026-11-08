/**
 * HeylexUI - Sistema de Diálogos Corporativos y Modales Emergentes
 * Reemplaza alert(), confirm() y prompt() por componentes visuales consistentes
 * con la paleta de colores y estilo institucional de HEYLEX.
 */

(function () {
  const HeylexUI = {
    // Alerta modal informativa o de error
    alert({ title = 'Aviso HEYLEX', message = '', type = 'info', okText = 'Entendido' }) {
      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[100] bg-[#002546]/80 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-200';
        
        let icon = 'info';
        let iconBg = 'bg-primary-container text-secondary-fixed';
        let btnColor = 'bg-primary text-secondary-fixed hover:bg-primary-container';

        if (type === 'error') {
          icon = 'error';
          iconBg = 'bg-red-100 text-red-700';
          btnColor = 'bg-red-700 text-white hover:bg-red-800';
        } else if (type === 'success') {
          icon = 'check_circle';
          iconBg = 'bg-lime-100 text-[#576500]';
          btnColor = 'bg-primary text-secondary-fixed hover:bg-primary-container';
        } else if (type === 'warning') {
          icon = 'warning';
          iconBg = 'bg-amber-100 text-amber-800';
        }

        overlay.innerHTML = `
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 transform transition-all duration-200 scale-95 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center font-bold shrink-0">
                <span class="material-symbols-outlined text-2xl">${icon}</span>
              </div>
              <div>
                <h3 class="font-bold text-primary text-base font-['Montserrat']">${title}</h3>
                <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Notificación HEYLEX</span>
              </div>
            </div>
            <p class="text-xs text-gray-600 leading-relaxed font-['Montserrat'] whitespace-pre-line">${message}</p>
            <div class="pt-2 flex justify-end">
              <button id="heylex-alert-ok-btn" class="h-10 px-5 rounded-lg ${btnColor} font-bold text-xs uppercase shadow transition-all font-['Montserrat']">
                ${okText}
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);
        setTimeout(() => {
          overlay.querySelector('.transform').classList.remove('scale-95');
          overlay.querySelector('.transform').classList.add('scale-100');
        }, 10);

        const btn = overlay.querySelector('#heylex-alert-ok-btn');
        btn.focus();
        btn.onclick = () => {
          overlay.remove();
          resolve(true);
        };
      });
    },

    // Confirmación modal (reemplaza window.confirm)
    confirm({ 
      title = '¿Confirmar Acción?', 
      message = '', 
      confirmText = 'Confirmar', 
      cancelText = 'Cancelar', 
      isDestructive = false 
    }) {
      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[100] bg-[#002546]/80 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-200';

        const iconBg = isDestructive ? 'bg-red-100 text-red-700' : 'bg-lime-100 text-[#576500]';
        const icon = isDestructive ? 'help_outline' : 'help';
        const confirmBtnColor = isDestructive 
          ? 'bg-red-700 hover:bg-red-800 text-white' 
          : 'bg-primary hover:bg-primary-container text-secondary-fixed';

        overlay.innerHTML = `
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 transform transition-all duration-200 scale-95 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center font-bold shrink-0">
                <span class="material-symbols-outlined text-2xl">${icon}</span>
              </div>
              <div>
                <h3 class="font-bold text-primary text-base font-['Montserrat']">${title}</h3>
                <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Confirmación Requerida</span>
              </div>
            </div>
            <p class="text-xs text-gray-600 leading-relaxed font-['Montserrat'] whitespace-pre-line">${message}</p>
            <div class="pt-2 flex items-center justify-end gap-2">
              <button id="heylex-confirm-cancel-btn" class="h-10 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase transition-all font-['Montserrat']">
                ${cancelText}
              </button>
              <button id="heylex-confirm-accept-btn" class="h-10 px-5 rounded-lg ${confirmBtnColor} font-bold text-xs uppercase shadow transition-all font-['Montserrat']">
                ${confirmText}
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);
        setTimeout(() => {
          overlay.querySelector('.transform').classList.remove('scale-95');
          overlay.querySelector('.transform').classList.add('scale-100');
        }, 10);

        overlay.querySelector('#heylex-confirm-cancel-btn').onclick = () => {
          overlay.remove();
          resolve(false);
        };

        overlay.querySelector('#heylex-confirm-accept-btn').onclick = () => {
          overlay.remove();
          resolve(true);
        };
      });
    },

    // Modal interactivo de creación de códigos de enrolamiento
    promptEnrollmentCode() {
      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[100] bg-[#002546]/80 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-200';

        overlay.innerHTML = `
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 transform transition-all duration-200 scale-95 space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-gray-100">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center font-bold shadow-sm">
                  <span class="material-symbols-outlined text-2xl">vpn_key</span>
                </div>
                <div>
                  <h3 class="font-bold text-primary text-base font-['Montserrat']">Generar Código de Enrolamiento</h3>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Alta de Nuevos Colonos o Administradores</span>
                </div>
              </div>
              <button id="close-enroll-modal-btn" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div class="space-y-4 font-['Montserrat']">
              <div>
                <label class="block text-xs font-bold uppercase text-gray-700 mb-2">Selecciona el Tipo de Integrante</label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="cursor-pointer border-2 border-primary bg-primary/5 rounded-xl p-3 flex flex-col gap-1 transition-all" id="label-role-resident">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs text-primary flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm">home</span> Residente
                      </span>
                      <input type="radio" name="enroll-role" value="residente" checked class="accent-primary">
                    </div>
                    <span class="text-[10px] text-gray-500 leading-tight">Para nuevos vecinos. Habilita pases QR e invitaciones de visitas.</span>
                  </label>

                  <label class="cursor-pointer border-2 border-gray-200 hover:border-gray-300 rounded-xl p-3 flex flex-col gap-1 transition-all" id="label-role-admin">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs text-gray-700 flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm">admin_panel_settings</span> Administrador
                      </span>
                      <input type="radio" name="enroll-role" value="administrador" class="accent-primary">
                    </div>
                    <span class="text-[10px] text-gray-500 leading-tight">Para comité o mesa directiva. Acceso total a este panel.</span>
                  </label>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Usos Máximos</label>
                  <select id="enroll-max-uses" class="w-full h-10 px-3 rounded-lg border border-gray-300 text-xs font-semibold text-gray-800 outline-none focus:border-primary bg-white">
                    <option value="1">1 uso (Personal / Único)</option>
                    <option value="5">5 usos</option>
                    <option value="10" selected>10 usos (Recomendado)</option>
                    <option value="25">25 usos</option>
                    <option value="50">50 usos (Masivo)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Vigencia del Código</label>
                  <select id="enroll-days-valid" class="w-full h-10 px-3 rounded-lg border border-gray-300 text-xs font-semibold text-gray-800 outline-none focus:border-primary bg-white">
                    <option value="7">7 días</option>
                    <option value="15">15 días</option>
                    <option value="30" selected>30 días (1 mes)</option>
                    <option value="90">90 días (3 meses)</option>
                    <option value="365">1 año</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
              <button id="cancel-enroll-modal-btn" class="h-10 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase transition-all font-['Montserrat']">
                Cancelar
              </button>
              <button id="submit-enroll-modal-btn" class="h-10 px-5 rounded-lg bg-secondary-fixed text-primary hover:bg-secondary-fixed-dim font-bold text-xs uppercase shadow transition-all flex items-center gap-1.5 font-['Montserrat']">
                <span class="material-symbols-outlined text-base">vpn_key</span>
                <span>Crear Código</span>
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);
        setTimeout(() => {
          overlay.querySelector('.transform').classList.remove('scale-95');
          overlay.querySelector('.transform').classList.add('scale-100');
        }, 10);

        // Radio button styling toggle
        const rRes = overlay.querySelector('#label-role-resident');
        const rAdm = overlay.querySelector('#label-role-admin');
        const radios = overlay.querySelectorAll('input[name="enroll-role"]');
        radios.forEach(r => {
          r.onchange = () => {
            if (r.value === 'residente') {
              rRes.className = 'cursor-pointer border-2 border-primary bg-primary/5 rounded-xl p-3 flex flex-col gap-1 transition-all';
              rAdm.className = 'cursor-pointer border-2 border-gray-200 hover:border-gray-300 rounded-xl p-3 flex flex-col gap-1 transition-all';
            } else {
              rAdm.className = 'cursor-pointer border-2 border-primary bg-primary/5 rounded-xl p-3 flex flex-col gap-1 transition-all';
              rRes.className = 'cursor-pointer border-2 border-gray-200 hover:border-gray-300 rounded-xl p-3 flex flex-col gap-1 transition-all';
            }
          };
        });

        const closeModal = (data = null) => {
          overlay.remove();
          resolve(data);
        };

        overlay.querySelector('#close-enroll-modal-btn').onclick = () => closeModal(null);
        overlay.querySelector('#cancel-enroll-modal-btn').onclick = () => closeModal(null);

        overlay.querySelector('#submit-enroll-modal-btn').onclick = () => {
          const selectedRole = overlay.querySelector('input[name="enroll-role"]:checked').value;
          const maxUses = parseInt(overlay.querySelector('#enroll-max-uses').value, 10);
          const days = parseInt(overlay.querySelector('#enroll-days-valid').value, 10);
          closeModal({ type: selectedRole, maxUses, days });
        };
      });
    },

    // Modal corporativo multipropósito (Finanzas, Recibos, Emisión de Cuotas)
    modal({ 
      title = 'Diálogo HEYLEX', 
      content = '', 
      confirmText = 'Aceptar', 
      cancelText = 'Cancelar', 
      maxWidth = 'max-w-lg', 
      onOpen = null 
    }) {
      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[100] bg-[#002546]/80 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-200';

        let headerIcon = 'point_of_sale';
        let badgeText = 'Módulo Administrativo HEYLEX';
        if (title.toLowerCase().includes('recibo')) {
          headerIcon = 'receipt_long';
          badgeText = 'Comprobante Digital Oficial';
        } else if (title.toLowerCase().includes('cuota')) {
          headerIcon = 'add_circle';
          badgeText = 'Gestión Contable Residencial';
        }

        overlay.innerHTML = `
          <div class="bg-white rounded-2xl ${maxWidth} w-full p-6 shadow-2xl border border-gray-200 transform transition-all duration-200 scale-95 space-y-4 max-h-[90vh] flex flex-col font-['Montserrat']">
            <div class="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center font-bold shadow-sm shrink-0">
                  <span class="material-symbols-outlined text-2xl">${headerIcon}</span>
                </div>
                <div>
                  <h3 class="font-bold text-primary text-base leading-tight">${title}</h3>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">${badgeText}</span>
                </div>
              </div>
              <button id="heylex-generic-modal-close" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div class="overflow-y-auto pr-1 flex-1 space-y-3" id="heylex-generic-modal-body">
              ${typeof content === 'string' ? content : ''}
            </div>

            <div class="pt-3 flex items-center justify-end gap-2 border-t border-gray-100 shrink-0">
              <button id="heylex-generic-modal-cancel" class="h-10 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase transition-all font-['Montserrat']">
                ${cancelText}
              </button>
              <button id="heylex-generic-modal-confirm" class="h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase shadow transition-all flex items-center gap-1.5 shadow-emerald-600/20 font-['Montserrat']">
                <span class="material-symbols-outlined text-base">check_circle</span>
                <span>${confirmText}</span>
              </button>
            </div>
          </div>
        `;

        if (content instanceof HTMLElement) {
          overlay.querySelector('#heylex-generic-modal-body').appendChild(content);
        }

        document.body.appendChild(overlay);

        setTimeout(() => {
          overlay.querySelector('.transform')?.classList.remove('scale-95');
          overlay.querySelector('.transform')?.classList.add('scale-100');
        }, 10);

        const card = overlay.querySelector('.transform');

        const closeModal = (confirmed) => {
          if (card) {
            card.classList.remove('scale-100');
            card.classList.add('scale-95');
          }
          overlay.classList.add('opacity-0');
          // Resolvemos antes de desmontar para que código síncrono del llamador pueda leer el formulario
          resolve(confirmed);
          setTimeout(() => {
            overlay.remove();
          }, 150);
        };

        const closeBtn = overlay.querySelector('#heylex-generic-modal-close');
        const cancelBtn = overlay.querySelector('#heylex-generic-modal-cancel');
        const confirmBtn = overlay.querySelector('#heylex-generic-modal-confirm');

        if (closeBtn) closeBtn.onclick = () => closeModal(false);
        if (cancelBtn) cancelBtn.onclick = () => closeModal(false);
        if (confirmBtn) confirmBtn.onclick = () => closeModal(true);

        const onKeyDown = (e) => {
          if (e.key === 'Escape') {
            document.removeEventListener('keydown', onKeyDown);
            closeModal(false);
          }
        };
        document.addEventListener('keydown', onKeyDown);

        if (typeof onOpen === 'function') {
          try {
            onOpen(overlay);
          } catch (err) {
            console.error('[HeylexUI.modal onOpen error]:', err);
          }
        }
      });
    }
  };

  window.HeylexUI = HeylexUI;
})();

