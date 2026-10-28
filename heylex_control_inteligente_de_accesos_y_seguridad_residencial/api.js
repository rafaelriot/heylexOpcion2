/**
 * Heylex API Client & Mock Adapter
 * Simulates REST API endpoints until the real backend services are available.
 * Easily switch to real API by setting `USE_MOCK = false` and providing `API_BASE_URL`.
 */

const HeylexAPI = (function () {
  const USE_MOCK = true;
  const API_BASE_URL = 'https://api.heylex.mx/v1'; // Configurable al recibir la API real

  // Simulated Database in localStorage for persistent mock demo experience
  const STORAGE_KEY_AUTH = 'heylex_auth_session';
  const STORAGE_KEY_INVITES = 'heylex_user_invites';

  // Seed default mock users
  const MOCK_USERS = [
    {
      id: 'usr_001',
      email: 'residente@heylex.mx',
      password: 'password123',
      name: 'Ing. Carlos Mendoza R.',
      phone: '+52 993 123 4567',
      role: 'Propietario Residente',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      community: {
        id: 'com_tabasco_01',
        name: 'Residencial Cumbres Del Ángel',
        address: 'Av. Universidad 402, Villahermosa, Tabasco',
        zone: 'Privada Los Robles',
        unit: 'Casa 42-B'
      },
      membership: {
        status: 'ACTIVE', // 'ACTIVE' | 'SUSPENDED' | 'EXPIRED'
        licensePlan: 'Plan Premium Residencial 2026',
        validUntil: '2026-12-31',
        canGenerateOwnQr: true,
        canInviteVisitors: true,
        suspensionReason: null
      }
    },
    {
      id: 'usr_002',
      email: 'suspendido@heylex.mx',
      password: 'password123',
      name: 'Lic. Ana Sofía Garza',
      phone: '+52 993 987 6543',
      role: 'Inquilino / Residente',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
      community: {
        id: 'com_tabasco_01',
        name: 'Torre Altavista Condominios',
        address: 'Tabasco 2000, Villahermosa',
        zone: 'Torre B',
        unit: 'Depto 504'
      },
      membership: {
        status: 'SUSPENDED',
        licensePlan: 'Plan Básico Condominio',
        validUntil: '2026-10-15',
        canGenerateOwnQr: false,
        canInviteVisitors: false,
        suspensionReason: 'Cuota de administración y mantenimiento vencida (Octubre 2026).'
      }
    }
  ];

  function getStoredSession() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUTH);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function saveStoredSession(session) {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } else {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
    }
  }

  function getStoredInvites() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_INVITES);
      if (data) return JSON.parse(data);
    } catch (e) {}

    // Default sample invites
    const initial = [
      {
        id: 'inv_' + Math.random().toString(36).substr(2, 9),
        visitorName: 'Ing. Fernando Valenzuela',
        vehiclePlate: 'WTL-894-A',
        entryType: 'VEHICULAR',
        accessType: 'SINGLE_USE',
        validFrom: new Date(Date.now() - 3600000).toISOString(),
        validTo: new Date(Date.now() + 86400000).toISOString(),
        status: 'ACTIVE',
        qrCode: 'HLX-VISIT-894A-' + Date.now(),
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEY_INVITES, JSON.stringify(initial));
    return initial;
  }

  function saveStoredInvites(invites) {
    localStorage.setItem(STORAGE_KEY_INVITES, JSON.stringify(invites));
  }

  // Helper delay to simulate real network latency
  const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

  return {
    // 1. Iniciar Sesión (POST /api/v1/auth/login)
    async login(email, password) {
      if (!USE_MOCK) {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Error de autenticación');
        }
        const data = await res.json();
        saveStoredSession(data);
        return data;
      }

      await delay(500);
      const user = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );

      if (!user) {
        throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
      }

      const session = {
        token: 'mock_jwt_token_' + btoa(user.email) + '_' + Date.now(),
        refreshToken: 'mock_refresh_' + Math.random().toString(36).substr(2),
        expiresAt: Date.now() + 86400 * 1000,
        user: { ...user }
      };
      saveStoredSession(session);
      return session;
    },

    // 2. Cerrar sesión (POST /api/v1/auth/logout)
    async logout() {
      await delay(200);
      saveStoredSession(null);
      return { success: true };
    },

    // Obtener sesión activa local
    getCurrentSession() {
      return getStoredSession();
    },

    // 3. Obtener perfil de usuario y licencia (GET /api/v1/user/profile)
    async getProfile() {
      const session = getStoredSession();
      if (!session || !session.token) {
        throw new Error('No hay sesión activa.');
      }

      if (!USE_MOCK) {
        const res = await fetch(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (!res.ok) throw new Error('Error al consultar perfil');
        return await res.json();
      }

      await delay(300);
      return {
        success: true,
        user: session.user
      };
    },

    // 4. Cambiar estado de licencia de prueba (utilidad para que el cliente pruebe ambos estados)
    toggleMockLicense() {
      const session = getStoredSession();
      if (!session || !session.user) return null;
      const cur = session.user.membership.status;
      if (cur === 'ACTIVE') {
        session.user.membership.status = 'SUSPENDED';
        session.user.membership.canGenerateOwnQr = false;
        session.user.membership.canInviteVisitors = false;
        session.user.membership.suspensionReason = 'Demostración: Licencia suspendida por cuota administrativa pendiente.';
      } else {
        session.user.membership.status = 'ACTIVE';
        session.user.membership.canGenerateOwnQr = true;
        session.user.membership.canInviteVisitors = true;
        session.user.membership.suspensionReason = null;
      }
      saveStoredSession(session);
      return session.user;
    },

    // 5. Generar Código QR de Acceso Residente (POST /api/v1/access/generate-pass)
    async generateResidentPass() {
      const session = getStoredSession();
      if (!session || !session.token) {
        throw new Error('No has iniciado sesión.');
      }

      if (!USE_MOCK) {
        const res = await fetch(`${API_BASE_URL}/access/generate-pass`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`
          }
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'No se pudo generar el código QR');
        }
        return await res.json();
      }

      await delay(400);
      const user = session.user;

      // VALIDACIÓN CRÍTICA DE LICENCIA / PRIVILEGIOS
      if (user.membership.status !== 'ACTIVE' || !user.membership.canGenerateOwnQr) {
        const reason = user.membership.suspensionReason || 'Tu membresía o licencia no cuenta con privilegios activos de acceso.';
        const err = new Error(reason);
        err.code = 'LICENSE_INACTIVE';
        throw err;
      }

      const expirySeconds = 180; // 3 minutos de vigencia para mayor seguridad
      const validUntil = new Date(Date.now() + expirySeconds * 1000).toISOString();
      const payloadHash = `HLX-RES|${user.id}|${user.community.id}|${Date.now()}|SEC_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      return {
        success: true,
        qrPayload: payloadHash,
        validUntil: validUntil,
        expiresInSeconds: expirySeconds,
        communityName: user.community.name,
        residenceUnit: user.community.unit,
        holderName: user.name
      };
    },

    // 6. Listar invitaciones de visitantes (GET /api/v1/visitors/invitations)
    async getInvitations() {
      const session = getStoredSession();
      if (!session) throw new Error('No hay sesión activa.');

      if (!USE_MOCK) {
        const res = await fetch(`${API_BASE_URL}/visitors/invitations`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        return await res.json();
      }

      await delay(250);
      return getStoredInvites();
    },

    // 7. Crear invitación de visita (POST /api/v1/visitors/invitations)
    async createInvitation(data) {
      const session = getStoredSession();
      if (!session) throw new Error('No hay sesión activa.');

      const user = session.user;
      if (user.membership.status !== 'ACTIVE' || !user.membership.canInviteVisitors) {
        const err = new Error(user.membership.suspensionReason || 'No cuentas con privilegios para invitar visitantes.');
        err.code = 'LICENSE_INACTIVE';
        throw err;
      }

      if (!USE_MOCK) {
        const res = await fetch(`${API_BASE_URL}/visitors/invitations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`
          },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error al crear invitación');
        return await res.json();
      }

      await delay(400);
      const invites = getStoredInvites();
      const codeId = 'HLX-VISIT-' + Math.random().toString(36).substr(2, 7).toUpperCase();
      const newInvite = {
        id: 'inv_' + Date.now(),
        visitorName: data.visitorName,
        vehiclePlate: (data.vehiclePlate || '').toUpperCase().trim(),
        entryType: data.entryType || 'VEHICULAR',
        accessType: data.accessType || 'SINGLE_USE',
        validFrom: data.validFrom || new Date().toISOString(),
        validTo: data.validTo || new Date(Date.now() + 86400000).toISOString(),
        notes: data.notes || '',
        status: 'ACTIVE',
        qrCode: codeId,
        createdAt: new Date().toISOString()
      };

      invites.unshift(newInvite);
      saveStoredInvites(invites);
      return { success: true, invitation: newInvite };
    },

    // 8. Revocar invitación (DELETE /api/v1/visitors/invitations/:id)
    async revokeInvitation(id) {
      await delay(200);
      const invites = getStoredInvites().filter((inv) => inv.id !== id);
      saveStoredInvites(invites);
      return { success: true };
    }
  };
})();

// Export globally for browser window
window.HeylexAPI = HeylexAPI;
