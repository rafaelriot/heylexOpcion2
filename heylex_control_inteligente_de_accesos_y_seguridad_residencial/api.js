/**
 * Heylex API Client & Mock Adapter
 * Simulates REST API endpoints until the real backend services are available.
 * Easily switch to real API by setting `USE_MOCK = false` and providing `API_BASE_URL`.
 * Supports Multitenancy (Multiple communities/buildings, resident billing status, license toggling).
 */

const HeylexAPI = (function () {
  const USE_MOCK = true;
  const API_BASE_URL = 'https://api.heylex.mx/v1'; // Configurable al recibir la API real

  // Storage keys for persistent mock experience
  const STORAGE_KEY_AUTH = 'heylex_auth_session';
  const STORAGE_KEY_INVITES = 'heylex_user_invites';
  const STORAGE_KEY_COMMUNITIES = 'heylex_communities_db';
  const STORAGE_KEY_RESIDENTS = 'heylex_residents_db';

  // Seed default communities (Multitenant)
  const SEED_COMMUNITIES = [
    {
      id: 'com_001',
      name: 'Residencial Cumbres Del Ángel',
      type: 'Fraccionamiento Horizontal',
      address: 'Av. Universidad 402, Villahermosa, Tabasco',
      adminIds: ['usr_admin_01', 'usr_admin_02'],
      monthlyFee: 1850.00,
      currency: 'MXN',
      totalUnits: 45
    },
    {
      id: 'com_002',
      name: 'Torre Altavista Condominios',
      type: 'Edificio Vertical',
      address: 'Paseo Tabasco 2000, Villahermosa, Tabasco',
      adminIds: ['usr_admin_01'],
      monthlyFee: 2400.00,
      currency: 'MXN',
      totalUnits: 32
    },
    {
      id: 'com_003',
      name: 'Parque Logístico & Industrial Olmeca',
      type: 'Parque Industrial / Mixto',
      address: 'Carretera Villahermosa - Cárdenas Km 12',
      adminIds: ['usr_admin_02'],
      monthlyFee: 5200.00,
      currency: 'MXN',
      totalUnits: 18
    }
  ];

  // Seed default mock users (Admins & Residents)
  const SEED_USERS = [
    // 1. Administrador Multitenant (gestiona Cumbres y Altavista)
    {
      id: 'usr_admin_01',
      email: 'admin@heylex.mx',
      password: 'admin123',
      name: 'Lic. Roberto Morales (Admin)',
      phone: '+52 993 311 2233',
      role: 'ADMINISTRADOR',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      assignedCommunities: ['com_001', 'com_002']
    },
    // 2. Administrador Alterno (gestiona Cumbres y Parque Industrial)
    {
      id: 'usr_admin_02',
      email: 'superadmin@heylex.mx',
      password: 'admin123',
      name: 'Arq. Mariana Estrada (Admin)',
      phone: '+52 993 422 5566',
      role: 'ADMINISTRADOR',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
      assignedCommunities: ['com_001', 'com_003']
    },
    // 3. Residente Al Corriente (Cumbres)
    {
      id: 'usr_001',
      email: 'residente@heylex.mx',
      password: 'password123',
      name: 'Ing. Carlos Mendoza R.',
      phone: '+52 993 123 4567',
      role: 'RESIDENTE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      communityId: 'com_001',
      zone: 'Privada Los Robles',
      unit: 'Casa 42-B',
      licenseStatus: 'ACTIVE',
      monthsDue: 0,
      debtAmount: 0.00,
      lastPaymentDate: '2026-10-05',
      suspensionReason: null
    },
    // 4. Residente Moroso / Suspendido (Cumbres)
    {
      id: 'usr_002',
      email: 'suspendido@heylex.mx',
      password: 'password123',
      name: 'Lic. Ana Sofía Garza',
      phone: '+52 993 987 6543',
      role: 'RESIDENTE',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
      communityId: 'com_001',
      zone: 'Privada Los Robles',
      unit: 'Casa 18-A',
      licenseStatus: 'SUSPENDED',
      monthsDue: 2,
      debtAmount: 3700.00,
      lastPaymentDate: '2026-08-12',
      suspensionReason: 'Cuotas vencidas: Septiembre y Octubre 2026.'
    },
    // 5. Residente 3 (Cumbres) - Por vencer
    {
      id: 'usr_003',
      email: 'david.ruiz@heylex.mx',
      password: 'password123',
      name: 'Dr. David Ruiz Calderón',
      phone: '+52 993 555 1122',
      role: 'RESIDENTE',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      communityId: 'com_001',
      zone: 'Av. Las Palmas',
      unit: 'Lote 07',
      licenseStatus: 'ACTIVE',
      monthsDue: 0,
      debtAmount: 0.00,
      lastPaymentDate: '2026-10-01',
      suspensionReason: null
    },
    // 6. Residente 4 (Cumbres) - Moroso 3 meses
    {
      id: 'usr_004',
      email: 'valeria.ortiz@heylex.mx',
      password: 'password123',
      name: 'Sra. Valeria Ortiz Blanco',
      phone: '+52 993 666 3344',
      role: 'RESIDENTE',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
      communityId: 'com_001',
      zone: 'Privada Magnolia',
      unit: 'Casa 03-C',
      licenseStatus: 'SUSPENDED',
      monthsDue: 3,
      debtAmount: 5550.00,
      lastPaymentDate: '2026-07-28',
      suspensionReason: 'Tres cuotas de mantenimiento acumuladas.'
    },
    // 7. Residente Torre Altavista - Moroso
    {
      id: 'usr_005',
      email: 'torre.moroso@heylex.mx',
      password: 'password123',
      name: 'Lic. Guillermo Padrón',
      phone: '+52 993 777 8899',
      role: 'RESIDENTE',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
      communityId: 'com_002',
      zone: 'Torre B',
      unit: 'Depto 802',
      licenseStatus: 'SUSPENDED',
      monthsDue: 1,
      debtAmount: 2400.00,
      lastPaymentDate: '2026-09-04',
      suspensionReason: 'Mantenimiento de elevador y amenidades pendiente.'
    },
    // 8. Residente Torre Altavista - Al Corriente
    {
      id: 'usr_006',
      email: 'torre.activo@heylex.mx',
      password: 'password123',
      name: 'Dra. Carmen Villalobos',
      phone: '+52 993 888 9900',
      role: 'RESIDENTE',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=250&q=80',
      communityId: 'com_002',
      zone: 'Torre A',
      unit: 'Depto PH-01',
      licenseStatus: 'ACTIVE',
      monthsDue: 0,
      debtAmount: 0.00,
      lastPaymentDate: '2026-10-02',
      suspensionReason: null
    }
  ];

  function getStoredCommunities() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_COMMUNITIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length >= SEED_COMMUNITIES.length) {
          return parsed;
        }
      }
    } catch (e) {}
    localStorage.setItem(STORAGE_KEY_COMMUNITIES, JSON.stringify(SEED_COMMUNITIES));
    return SEED_COMMUNITIES;
  }

  function getStoredResidents() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RESIDENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Asegurar que las cuentas semilla (admins y residentes) siempre existan
          const merged = [...parsed];
          SEED_USERS.forEach((seed) => {
            const exists = merged.find((u) => u.email.toLowerCase() === seed.email.toLowerCase());
            if (!exists) {
              merged.push(seed);
            }
          });
          localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {}
    localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }

  function saveStoredResidents(residents) {
    localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(residents));
  }

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

  const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

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

      await delay(400);
      const residents = getStoredResidents();
      const user = residents.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );

      if (!user) {
        throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
      }

      // Populate community details for residents
      const communities = getStoredCommunities();
      let populatedUser = { ...user };
      if (user.role === 'RESIDENTE') {
        const com = communities.find((c) => c.id === user.communityId) || communities[0];
        populatedUser.community = {
          id: com.id,
          name: com.name,
          address: com.address,
          zone: user.zone,
          unit: user.unit
        };
        populatedUser.membership = {
          status: user.licenseStatus,
          licensePlan: 'Plan Premium Residencial 2026',
          validUntil: '2026-12-31',
          canGenerateOwnQr: user.licenseStatus === 'ACTIVE',
          canInviteVisitors: user.licenseStatus === 'ACTIVE',
          suspensionReason: user.suspensionReason
        };
      }

      const session = {
        token: 'mock_jwt_token_' + btoa(user.email) + '_' + Date.now(),
        refreshToken: 'mock_refresh_' + Math.random().toString(36).substr(2),
        expiresAt: Date.now() + 86400 * 1000,
        user: populatedUser
      };
      saveStoredSession(session);
      return session;
    },

    // 2. Cerrar sesión
    async logout() {
      await delay(150);
      saveStoredSession(null);
      return { success: true };
    },

    getCurrentSession() {
      return getStoredSession();
    },

    // 3. Perfil de Residente (GET /api/v1/user/profile)
    async getProfile() {
      const session = getStoredSession();
      if (!session) throw new Error('No hay sesión activa.');

      // Refresh latest license status from residents DB
      const residents = getStoredResidents();
      const freshUser = residents.find((r) => r.id === session.user.id);
      if (freshUser && session.user.role === 'RESIDENTE') {
        session.user.membership.status = freshUser.licenseStatus;
        session.user.membership.canGenerateOwnQr = freshUser.licenseStatus === 'ACTIVE';
        session.user.membership.canInviteVisitors = freshUser.licenseStatus === 'ACTIVE';
        session.user.membership.suspensionReason = freshUser.suspensionReason;
        saveStoredSession(session);
      }

      return { success: true, user: session.user };
    },

    // 4. Toggle demo status
    toggleMockLicense() {
      const session = getStoredSession();
      if (!session || !session.user) return null;
      const cur = session.user.membership.status;
      const newStatus = cur === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      session.user.membership.status = newStatus;
      session.user.membership.canGenerateOwnQr = newStatus === 'ACTIVE';
      session.user.membership.canInviteVisitors = newStatus === 'ACTIVE';
      session.user.membership.suspensionReason = newStatus === 'ACTIVE' ? null : 'Demostración: Licencia suspendida por cuota administrativa pendiente.';
      saveStoredSession(session);

      // Also persist in residents table
      const residents = getStoredResidents();
      const r = residents.find((x) => x.id === session.user.id);
      if (r) {
        r.licenseStatus = newStatus;
        r.suspensionReason = session.user.membership.suspensionReason;
        saveStoredResidents(residents);
      }
      return session.user;
    },

    // 5. Generar QR de Residente
    async generateResidentPass() {
      const session = getStoredSession();
      if (!session || !session.token) throw new Error('No has iniciado sesión.');

      // Re-validate against fresh DB
      const residents = getStoredResidents();
      const freshUser = residents.find((r) => r.id === session.user.id);
      const status = freshUser ? freshUser.licenseStatus : session.user.membership.status;

      if (status !== 'ACTIVE') {
        const reason = (freshUser && freshUser.suspensionReason) || 'Tu membresía o licencia no cuenta con privilegios activos de acceso.';
        const err = new Error(reason);
        err.code = 'LICENSE_INACTIVE';
        throw err;
      }

      const expirySeconds = 180;
      const validUntil = new Date(Date.now() + expirySeconds * 1000).toISOString();
      const payloadHash = `HLX-RES|${session.user.id}|${session.user.community?.id || 'com_001'}|${Date.now()}|SEC_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      return {
        success: true,
        qrPayload: payloadHash,
        validUntil,
        expiresInSeconds: expirySeconds,
        communityName: session.user.community?.name,
        residenceUnit: session.user.community?.unit,
        holderName: session.user.name
      };
    },

    // 6. Invitaciones
    async getInvitations() {
      const session = getStoredSession();
      if (!session) throw new Error('No hay sesión activa.');
      await delay(200);
      return getStoredInvites();
    },

    async createInvitation(data) {
      const session = getStoredSession();
      if (!session) throw new Error('No hay sesión activa.');

      const residents = getStoredResidents();
      const freshUser = residents.find((r) => r.id === session.user.id);
      const status = freshUser ? freshUser.licenseStatus : session.user.membership.status;

      if (status !== 'ACTIVE') {
        const err = new Error('No cuentas con privilegios para invitar visitantes.');
        err.code = 'LICENSE_INACTIVE';
        throw err;
      }

      await delay(350);
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

    async revokeInvitation(id) {
      await delay(150);
      const invites = getStoredInvites().filter((inv) => inv.id !== id);
      saveStoredInvites(invites);
      return { success: true };
    },

    /* =========================================================================
     * SERVICIOS DE ADMINISTRACIÓN MULTITENANT & CONTROL DE MOROSIDAD
     * ======================================================================= */

    // 7. Fraccionamientos asignados al Administrador (GET /api/v1/admin/communities)
    async getAdminCommunities() {
      const session = getStoredSession();
      if (!session || !session.user || session.user.role !== 'ADMINISTRADOR') {
        throw new Error('Acceso denegado: Se requieren permisos de Administrador.');
      }

      await delay(300);
      const allCommunities = getStoredCommunities();
      const assigned = session.user.assignedCommunities || [];
      
      // Filter communities assigned to this specific admin
      return allCommunities.filter((c) => assigned.includes(c.id));
    },

    // 8. Residentes por Fraccionamiento (GET /api/v1/admin/communities/{id}/residents)
    async getCommunityResidents(communityId, filter = 'ALL', search = '') {
      await delay(250);
      const allResidents = getStoredResidents().filter((u) => u.role === 'RESIDENTE');
      
      let filtered = allResidents.filter((r) => r.communityId === communityId);

      if (filter === 'ACTIVE') {
        filtered = filtered.filter((r) => r.licenseStatus === 'ACTIVE');
      } else if (filter === 'SUSPENDED') {
        filtered = filtered.filter((r) => r.licenseStatus === 'SUSPENDED');
      }

      if (search && search.trim() !== '') {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.unit.toLowerCase().includes(q) ||
            r.zone.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q)
        );
      }

      return filtered;
    },

    // 9. Métricas y KPIs Financieros (GET /api/v1/admin/communities/{id}/metrics)
    async getCommunityMetrics(communityId) {
      await delay(200);
      const residents = getStoredResidents().filter(
        (u) => u.role === 'RESIDENTE' && u.communityId === communityId
      );
      const community = getStoredCommunities().find((c) => c.id === communityId);

      const totalResidents = residents.length;
      const activeResidents = residents.filter((r) => r.licenseStatus === 'ACTIVE').length;
      const suspendedResidents = residents.filter((r) => r.licenseStatus === 'SUSPENDED').length;
      const totalDebt = residents.reduce((sum, r) => sum + (r.debtAmount || 0), 0);
      const monthlyExpected = totalResidents * (community ? community.monthlyFee : 2000);
      const collectionRate = totalResidents > 0 ? Math.round((activeResidents / totalResidents) * 100) : 100;

      return {
        communityName: community ? community.name : 'Fraccionamiento',
        totalResidents,
        activeResidents,
        suspendedResidents,
        totalDebt,
        monthlyFee: community ? community.monthlyFee : 0,
        monthlyExpected,
        collectionRate
      };
    },

    // 10. Cambiar Estatus de Licencia y Acceso (PATCH /api/v1/admin/residents/{id}/license-status)
    async updateResidentLicenseStatus(residentId, newStatus, reason = '') {
      await delay(350);
      const residents = getStoredResidents();
      const resident = residents.find((r) => r.id === residentId);

      if (!resident) throw new Error('Residente no encontrado');

      resident.licenseStatus = newStatus;
      if (newStatus === 'ACTIVE') {
        resident.debtAmount = 0.00;
        resident.monthsDue = 0;
        resident.lastPaymentDate = new Date().toISOString().split('T')[0];
        resident.suspensionReason = null;
      } else {
        resident.suspensionReason = reason || 'Acceso suspendido por administración.';
        if (resident.monthsDue === 0) resident.monthsDue = 1;
        if (resident.debtAmount === 0) resident.debtAmount = 2000.00;
      }

      saveStoredResidents(residents);

      // Si el residente tiene sesión activa, actualizarla
      const session = getStoredSession();
      if (session && session.user.id === residentId) {
        session.user.membership.status = newStatus;
        session.user.membership.canGenerateOwnQr = newStatus === 'ACTIVE';
        session.user.membership.canInviteVisitors = newStatus === 'ACTIVE';
        session.user.membership.suspensionReason = resident.suspensionReason;
        saveStoredSession(session);
      }

      return { success: true, resident };
    }
  };
})();

window.HeylexAPI = HeylexAPI;
