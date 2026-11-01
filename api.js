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
  const STORAGE_KEY_ENROLLMENT_CODES = 'heylex_enrollment_codes_db';
  const STORAGE_KEY_CUOTAS = 'heylex_cuotas_db';
  const STORAGE_KEY_PAGOS = 'heylex_pagos_db';

  // Seed default cuotas (Finanzas Condominales)
  const SEED_CUOTAS = [
    {
      id: 1,
      communityId: 'com_001',
      residentId: 'usr_001',
      residentName: 'Ing. Carlos Mendoza R.',
      unit: 'Casa 42-B',
      concept: 'Mantenimiento Mensual Noviembre 2026',
      type: 'ordinaria',
      amount: 1850.00,
      dueDate: '2026-11-10',
      status: 'pendiente',
      createdAt: '2026-11-01 00:00:00'
    },
    {
      id: 2,
      communityId: 'com_001',
      residentId: 'usr_001',
      residentName: 'Ing. Carlos Mendoza R.',
      unit: 'Casa 42-B',
      concept: 'Mantenimiento Mensual Octubre 2026',
      type: 'ordinaria',
      amount: 1850.00,
      dueDate: '2026-10-10',
      status: 'pagada',
      createdAt: '2026-10-01 00:00:00'
    },
    {
      id: 3,
      communityId: 'com_001',
      residentId: 'usr_002',
      residentName: 'Lic. Ana Sofía Garza',
      unit: 'Casa 18-A',
      concept: 'Mantenimiento Mensual Octubre 2026',
      type: 'ordinaria',
      amount: 1850.00,
      dueDate: '2026-10-10',
      status: 'vencida',
      createdAt: '2026-10-01 00:00:00'
    },
    {
      id: 4,
      communityId: 'com_001',
      residentId: 'usr_002',
      residentName: 'Lic. Ana Sofía Garza',
      unit: 'Casa 18-A',
      concept: 'Mantenimiento Mensual Septiembre 2026',
      type: 'ordinaria',
      amount: 1850.00,
      dueDate: '2026-09-10',
      status: 'vencida',
      createdAt: '2026-09-01 00:00:00'
    },
    {
      id: 5,
      communityId: 'com_001',
      residentId: 'usr_004',
      residentName: 'Sra. Valeria Ortiz Blanco',
      unit: 'Casa 03-C',
      concept: 'Mantenimiento Mensual Agosto 2026',
      type: 'ordinaria',
      amount: 1850.00,
      dueDate: '2026-08-10',
      status: 'vencida',
      createdAt: '2026-08-01 00:00:00'
    },
    {
      id: 6,
      communityId: 'com_001',
      residentId: 'usr_004',
      residentName: 'Sra. Valeria Ortiz Blanco',
      unit: 'Casa 03-C',
      concept: 'Mantenimiento Mensual Septiembre 2026',
      type: 'ordinaria',
      amount: 1850.00,
      dueDate: '2026-09-10',
      status: 'vencida',
      createdAt: '2026-09-01 00:00:00'
    },
    {
      id: 7,
      communityId: 'com_001',
      residentId: 'usr_004',
      residentName: 'Sra. Valeria Ortiz Blanco',
      unit: 'Casa 03-C',
      concept: 'Mantenimiento Mensual Octubre 2026',
      type: 'ordinaria',
      amount: 1850.00,
      dueDate: '2026-10-10',
      status: 'vencida',
      createdAt: '2026-10-01 00:00:00'
    },
    {
      id: 8,
      communityId: 'com_001',
      residentId: 'usr_003',
      residentName: 'Dr. David Ruiz Calderón',
      unit: 'Lote 07',
      concept: 'Renta Palapa & Asador de Convivencia',
      type: 'amenidad',
      amount: 650.00,
      dueDate: '2026-11-05',
      status: 'pagada',
      createdAt: '2026-11-01 10:00:00'
    }
  ];

  // Seed default pagos realizados
  const SEED_PAGOS = [
    {
      id: 1,
      cuotaId: 2,
      folio: 'REC-2026-00084',
      residentId: 'usr_001',
      residentName: 'Ing. Carlos Mendoza R.',
      unit: 'Casa 42-B',
      concept: 'Mantenimiento Mensual Octubre 2026',
      type: 'ordinaria',
      amount: 1850.00,
      paymentMethod: 'transferencia',
      reference: 'SPEI-BBVA-7829104',
      receiptUrl: 'recibos/rec_00084.pdf',
      paidAt: '2026-10-05 11:22:15',
      status: 'verificado',
      adminName: 'Ing. Carlos Morales (Admin)',
      notes: 'Pago puntual con transferencia bancaria SPEI'
    },
    {
      id: 2,
      cuotaId: 8,
      folio: 'REC-2026-00109',
      residentId: 'usr_003',
      residentName: 'Dr. David Ruiz Calderón',
      unit: 'Lote 07',
      concept: 'Renta Palapa & Asador de Convivencia',
      type: 'amenidad',
      amount: 650.00,
      paymentMethod: 'efectivo',
      reference: 'REC-CAJA-044',
      receiptUrl: 'recibos/rec_00109.pdf',
      paidAt: '2026-11-01 14:00:00',
      status: 'verificado',
      adminName: 'Lic. Mariana Gómez (Admin)',
      notes: 'Liquidación en caseta de vigilancia para evento'
    }
  ];

  function getStoredCuotas() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUOTAS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_CUOTAS, JSON.stringify(SEED_CUOTAS));
        return SEED_CUOTAS;
      }
      return JSON.parse(raw);
    } catch (e) {
      return SEED_CUOTAS;
    }
  }

  function saveStoredCuotas(cuotas) {
    try {
      localStorage.setItem(STORAGE_KEY_CUOTAS, JSON.stringify(cuotas));
    } catch (e) {
      console.error('Error saving cuotas to localStorage', e);
    }
  }

  function getStoredPagos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PAGOS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_PAGOS, JSON.stringify(SEED_PAGOS));
        return SEED_PAGOS;
      }
      return JSON.parse(raw);
    } catch (e) {
      return SEED_PAGOS;
    }
  }

  function saveStoredPagos(pagos) {
    try {
      localStorage.setItem(STORAGE_KEY_PAGOS, JSON.stringify(pagos));
    } catch (e) {
      console.error('Error saving pagos to localStorage', e);
    }
  }

  // Seed default enrollment codes
  const SEED_ENROLLMENT_CODES = [
    { id: 1, code: 'INV-WQGX1M', type: 'residente', used: 4, maxUses: 10, createdAt: '2026-06-10 14:54:04', expiresAt: '2026-12-31 23:59:59', status: 'activo' },
    { id: 2, code: 'INV-IB8LL3', type: 'residente', used: 6, maxUses: 10, createdAt: '2026-10-01 18:21:30', expiresAt: '2026-11-30 23:59:59', status: 'activo' },
    { id: 3, code: 'ADM-SEC2026', type: 'administrador', used: 1, maxUses: 5, createdAt: '2026-01-15 09:00:00', expiresAt: '2026-12-31 23:59:59', status: 'activo' }
  ];

  function getStoredEnrollmentCodes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ENROLLMENT_CODES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_ENROLLMENT_CODES, JSON.stringify(SEED_ENROLLMENT_CODES));
        return SEED_ENROLLMENT_CODES;
      }
      return JSON.parse(raw);
    } catch (e) {
      return SEED_ENROLLMENT_CODES;
    }
  }

  function saveStoredEnrollmentCodes(codes) {
    try {
      localStorage.setItem(STORAGE_KEY_ENROLLMENT_CODES, JSON.stringify(codes));
    } catch (e) {
      console.error('Error saving enrollment codes to localStorage', e);
    }
  }

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

  // Generic Male & Female Illustrated Avatars (from the 6-avatar corporate sheet)
  const MALE_AVATARS = [
    'avatars/male-1.png', // Hombre con barba y saco oscuro
    'avatars/male-2.png', // Hombre con lentes y camisa azul
    'avatars/male-3.png'  // Hombre con lentes, saco café y corbata roja
  ];

  const FEMALE_AVATARS = [
    'avatars/female-1.png', // Mujer con cabello oscuro y saco marino
    'avatars/female-2.png', // Mujer con cabello castaño claro y lentes
    'avatars/female-3.png'  // Mujer con chongo alto y blusa rosa
  ];

  // Automatic Gender Detector ('M' | 'F') from user object or full name
  function detectGender(userOrName) {
    if (userOrName && typeof userOrName === 'object') {
      const explicit = String(userOrName.gender || '').toUpperCase().trim();
      if (explicit === 'F' || explicit === 'MUJER' || explicit === 'FEMALE') return 'F';
      if (explicit === 'M' || explicit === 'HOMBRE' || explicit === 'MALE') return 'M';
    }

    const rawName =
      typeof userOrName === 'string'
        ? userOrName
        : (userOrName && userOrName.name) || '';

    const normalized = rawName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\([^)]*\)/g, ' ')
      .trim();

    if (!normalized) return 'M';

    const tokens = normalized
      .split(/[\s.]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    // 1. Check gender-specific courtesy/academic prefixes
    const femalePrefixes = ['sra', 'srta', 'dra', 'mtra', 'inga', 'arqa', 'licda', 'contadora', 'dona', 'profa'];
    const malePrefixes = ['sr', 'dr', 'mtro', 'don', 'prof'];

    for (const tk of tokens) {
      if (femalePrefixes.includes(tk)) return 'F';
      if (malePrefixes.includes(tk)) return 'M';
    }

    // 2. Strip neutral professional prefixes to inspect the given first name
    const neutralPrefixes = new Set([
      'ing', 'lic', 'arq', 'cp', 'c', 'p', 'c.p', 'residente', 'admin', 'administrador', 'propietario'
    ]);
    const nameTokens = tokens.filter((tk) => !neutralPrefixes.has(tk));
    const firstName = nameTokens[0] || tokens[0] || '';

    const femaleNames = new Set([
      'ana', 'sofia', 'valeria', 'carmen', 'mariana', 'maria', 'laura', 'fernanda',
      'gabriela', 'patricia', 'andrea', 'paola', 'lucia', 'elena', 'claudia', 'veronica',
      'alejandra', 'daniela', 'adriana', 'natalia', 'beatriz', 'silvia', 'rosa', 'teresa',
      'leticia', 'monica', 'isabel', 'guadalupe', 'rocio', 'karla', 'carla', 'diana',
      'brenda', 'camila', 'renata', 'ximena', 'paulina', 'marisol', 'alicia', 'irene',
      'sara', 'elizabeth', 'raquel', 'susana', 'lorena', 'norma', 'blanca', 'estela',
      'martha', 'marta', 'julia', 'cecilia', 'victoria', 'regina', 'vanessa', 'jessica'
    ]);

    const maleNames = new Set([
      'carlos', 'roberto', 'david', 'guillermo', 'fernando', 'alejandro', 'jorge', 'luis',
      'miguel', 'jose', 'juan', 'pedro', 'ricardo', 'eduardo', 'francisco', 'manuel',
      'arturo', 'sergio', 'raul', 'hector', 'daniel', 'rafael', 'javier', 'antonio',
      'jesus', 'angel', 'marco', 'marcos', 'martin', 'cesar', 'oscar', 'ruben', 'andres',
      'diego', 'pablo', 'gabriel', 'alberto', 'enrique', 'gerardo', 'mauricio', 'alfredo',
      'hugo', 'armando', 'omar', 'ivan', 'edgar', 'gustavo', 'rodrigo', 'ernesto', 'julio', 'victor'
    ]);

    if (femaleNames.has(firstName)) return 'F';
    if (maleNames.has(firstName)) return 'M';

    // 3. Heuristic fallback by Spanish name ending
    if (firstName.endsWith('a') && !['luca', 'borja', 'bautista', 'josue'].includes(firstName)) {
      return 'F';
    }
    return 'M';
  }

  function getAvatarVariantIndex(userOrName, poolLength) {
    if (userOrName && typeof userOrName === 'object' && typeof userOrName.avatarVariant === 'number') {
      return Math.abs(userOrName.avatarVariant - 1) % poolLength;
    }
    const key =
      typeof userOrName === 'string'
        ? userOrName
        : (userOrName && (userOrName.id || userOrName.name || userOrName.email)) || 'default';
    let sum = 0;
    for (let i = 0; i < key.length; i++) {
      sum = (sum + key.charCodeAt(i)) % 997;
    }
    return sum % poolLength;
  }

  function getAvatarForUser(userOrName) {
    const gender = detectGender(userOrName);
    const pool = gender === 'F' ? FEMALE_AVATARS : MALE_AVATARS;
    const idx = getAvatarVariantIndex(userOrName, pool.length);
    return pool[idx];
  }

  function normalizeUserRecord(user) {
    if (!user) return user;
    const gender = detectGender(user);
    return {
      ...user,
      gender,
      avatar: getAvatarForUser({ ...user, gender })
    };
  }

  // Seed default mock users (Admins & Residents)
  const SEED_USERS = [
    // 1. Administrador Multitenant (gestiona Cumbres y Altavista)
    {
      id: 'usr_admin_01',
      email: 'admin@heylex.mx',
      password: 'admin123',
      name: 'Lic. Roberto Morales (Admin)',
      gender: 'M',
      avatarVariant: 1,
      phone: '+52 993 311 2233',
      role: 'ADMINISTRADOR',
      avatar: MALE_AVATARS[0],
      assignedCommunities: ['com_001', 'com_002']
    },
    // 2. Administrador Alterno (gestiona Cumbres y Parque Industrial)
    {
      id: 'usr_admin_02',
      email: 'superadmin@heylex.mx',
      password: 'admin123',
      name: 'Arq. Mariana Estrada (Admin)',
      gender: 'F',
      avatarVariant: 1,
      phone: '+52 993 422 5566',
      role: 'ADMINISTRADOR',
      avatar: FEMALE_AVATARS[0],
      assignedCommunities: ['com_001', 'com_003']
    },
    // 3. Residente Al Corriente (Cumbres)
    {
      id: 'usr_001',
      email: 'residente@heylex.mx',
      password: 'password123',
      name: 'Ing. Carlos Mendoza R.',
      gender: 'M',
      avatarVariant: 1,
      phone: '+52 993 123 4567',
      role: 'RESIDENTE',
      avatar: MALE_AVATARS[0],
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
      gender: 'F',
      avatarVariant: 1,
      phone: '+52 993 987 6543',
      role: 'RESIDENTE',
      avatar: FEMALE_AVATARS[0],
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
      gender: 'M',
      avatarVariant: 2,
      phone: '+52 993 555 1122',
      role: 'RESIDENTE',
      avatar: MALE_AVATARS[1],
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
      gender: 'F',
      avatarVariant: 2,
      phone: '+52 993 666 3344',
      role: 'RESIDENTE',
      avatar: FEMALE_AVATARS[1],
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
      gender: 'M',
      avatarVariant: 3,
      phone: '+52 993 777 8899',
      role: 'RESIDENTE',
      avatar: MALE_AVATARS[2],
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
      gender: 'F',
      avatarVariant: 3,
      phone: '+52 993 888 9900',
      role: 'RESIDENTE',
      avatar: FEMALE_AVATARS[2],
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
          // Asegurar que las cuentas semilla siempre existan y normalizar sexo + avatar genérico
          const merged = parsed.map((u) => normalizeUserRecord(u));
          SEED_USERS.forEach((seed) => {
            const exists = merged.find((u) => u.email.toLowerCase() === seed.email.toLowerCase());
            if (!exists) {
              merged.push(normalizeUserRecord(seed));
            }
          });
          localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {}
    const normalizedSeed = SEED_USERS.map((u) => normalizeUserRecord(u));
    localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(normalizedSeed));
    return normalizedSeed;
  }

  function saveStoredResidents(residents) {
    localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(residents));
  }

  function getStoredSession() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUTH);
      if (!data) return null;
      const session = JSON.parse(data);
      if (session && session.user) {
        session.user = normalizeUserRecord(session.user);
      }
      return session;
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
    detectGender,
    getAvatarForUser,

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
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // Persistencia permanente (1 año / indefinido)
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
      const durationMs = data.accessType === 'WEEKEND' ? 48 * 3600 * 1000 : 24 * 3600 * 1000;
      const newInvite = {
        id: 'inv_' + Date.now(),
        visitorName: data.visitorName,
        vehiclePlate: (data.vehiclePlate || '').toUpperCase().trim(),
        entryType: data.entryType || 'VEHICULAR',
        accessType: data.accessType || 'SINGLE_USE',
        validFrom: data.validFrom || new Date().toISOString(),
        validTo: data.validTo || new Date(Date.now() + durationMs).toISOString(),
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
      try {
        const idSe = (communityId === 'com_001') ? 2 : 1;
        const queryParams = new URLSearchParams({
          action: 'residents',
          id_se: idSe,
          filter: filter || 'ALL',
          search: search || ''
        });
        const resp = await fetch(`backend/api.php?${queryParams.toString()}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.ok && Array.isArray(data.residents) && data.residents.length > 0) {
            // Sincronizar en localStorage como cache local
            const local = getStoredResidents();
            data.residents.forEach(r => {
              const idx = local.findIndex(x => String(x.id) === String(r.id) || x.email === r.email);
              if (idx !== -1) {
                local[idx] = { ...local[idx], ...r };
              } else {
                local.push(r);
              }
            });
            saveStoredResidents(local);
            return data.residents;
          }
        }
      } catch (e) {
        // Fallback transparente a localStorage
      }

      await delay(150);
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
      let residents = [];
      try {
        residents = await this.getCommunityResidents(communityId, 'ALL', '');
      } catch (e) {
        residents = getStoredResidents().filter(
          (u) => u.role === 'RESIDENTE' && u.communityId === communityId
        );
      }
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
      try {
        await fetch('backend/api.php?action=update_resident_status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            residentId,
            status: newStatus,
            reason
          })
        });
      } catch (e) {
        // Fallback local
      }

      await delay(200);
      const residents = getStoredResidents();
      const resident = residents.find((r) => String(r.id) === String(residentId));

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
      if (session && String(session.user.id) === String(residentId)) {
        session.user.membership.status = newStatus;
        session.user.membership.canGenerateOwnQr = newStatus === 'ACTIVE';
        session.user.membership.canInviteVisitors = newStatus === 'ACTIVE';
        session.user.membership.suspensionReason = resident.suspensionReason;
        saveStoredSession(session);
      }

      return { success: true, resident };
    },

    // 11. Comprobar salud y conexión de la API REST / MySQL
    async checkBackendHealth() {
      try {
        const resp = await fetch('backend/api.php?action=status');
        if (!resp.ok) throw new Error('Status endpoint failed');
        const data = await resp.json();
        return {
          available: true,
          dbConnected: Boolean(data.database_connected),
          serverTime: data.server_time
        };
      } catch (e) {
        return {
          available: false,
          dbConnected: false,
          error: e.message
        };
      }
    },

    // 12. Bitácora de Accesos en Caseta (GET /backend/api.php?action=access_logs)
    async getAccessLogs(limit = 100, filter = 'ALL', search = '') {
      let logs = [];
      try {
        const resp = await fetch(`backend/api.php?action=access_logs&limit=${limit}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.ok && Array.isArray(data.logs)) {
            logs = data.logs;
          }
        }
      } catch (e) {
        console.warn('API getAccessLogs fallback a demo local:', e);
      }

      if (!logs || logs.length === 0) {
        await delay(150);
        logs = [
          { id: 55, type: 'usuario', name: 'Santos Jim Gon', unit: 'Casa 42-B', vehiclePlate: 'WSR-4421', direction: 'entrada', result: 'permitido', reason: 'Usuario activo', timestamp: '2026-10-31 15:42:10', guardId: 721 },
          { id: 54, type: 'visita', name: 'Lic. Roberto Garza', unit: 'Lote 18-A', vehiclePlate: 'VHK-9920', direction: 'entrada', result: 'permitido', reason: 'QR activo', timestamp: '2026-10-31 15:20:00', guardId: 721 },
          { id: 53, type: 'visita', name: 'Repartidor DHL Express', unit: 'Casa 10', vehiclePlate: 'TB-1102', direction: 'entrada', result: 'denegado', reason: 'QR expirado', timestamp: '2026-10-31 14:55:18', guardId: 721 },
          { id: 52, type: 'usuario', name: 'Dra. Patricia Silva', unit: 'Casa 42-B', vehiclePlate: 'WSR-4421', direction: 'salida', result: 'permitido', reason: 'Usuario activo', timestamp: '2026-10-31 14:10:05', guardId: 721 },
          { id: 51, type: 'visita', name: 'Ing. Fernando Tapia', unit: 'Casa 05', vehiclePlate: 'WSA-7781', direction: 'entrada', result: 'permitido', reason: 'QR activo', timestamp: '2026-10-31 13:30:45', guardId: 721 },
          { id: 50, type: 'visita', name: 'Servicio Técnico Telmex', unit: 'Casa 14-C', vehiclePlate: 'WSR-9011', direction: 'salida', result: 'permitido', reason: 'Salida de visita', timestamp: '2026-10-31 12:45:00', guardId: 721 },
          { id: 49, type: 'usuario', name: 'Lic. Gerardo Núñez', unit: 'Lote 03', vehiclePlate: 'WSP-2234', direction: 'entrada', result: 'denegado', reason: 'Licencia inactiva', timestamp: '2026-10-31 11:15:22', guardId: 721 }
        ];
      }

      // Filtro inteligente
      if (filter && filter !== 'ALL') {
        const f = filter.toUpperCase();
        if (f === 'PERMITTED') logs = logs.filter(l => l.result === 'permitido');
        else if (f === 'DENIED') logs = logs.filter(l => l.result === 'denegado');
        else if (f === 'ENTRADA') logs = logs.filter(l => l.direction === 'entrada');
        else if (f === 'SALIDA') logs = logs.filter(l => l.direction === 'salida');
      }

      // Buscador
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        logs = logs.filter(l => 
          (l.name && l.name.toLowerCase().includes(q)) ||
          (l.unit && l.unit.toLowerCase().includes(q)) ||
          (l.vehiclePlate && l.vehiclePlate.toLowerCase().includes(q)) ||
          (l.reason && l.reason.toLowerCase().includes(q))
        );
      }

      return logs;
    },

    // 13. Visitas Programadas Totales (GET /backend/api.php?action=all_visits)
    async getAllVisits(filter = 'ALL', search = '') {
      let visits = [];
      try {
        const resp = await fetch('backend/api.php?action=all_visits');
        if (resp.ok) {
          const data = await resp.json();
          if (data.ok && Array.isArray(data.visits)) {
            visits = data.visits;
          }
        }
      } catch (e) {
        console.warn('API getAllVisits fallback a demo local:', e);
      }

      if (!visits || visits.length === 0) {
        await delay(150);
        const invites = getStoredInvites();
        visits = invites.map((inv, idx) => ({
          id: idx + 1,
          visitorName: inv.visitorName,
          visitorPhone: inv.visitorPhone,
          hostName: inv.hostResidentName || 'Ing. Carlos Mendoza',
          hostUnit: inv.hostUnit || 'Casa 42-B',
          visitType: inv.visitType || 'unica',
          validFrom: inv.validFrom,
          validUntil: inv.validUntil,
          vehiclePlate: inv.vehiclePlate || 'N/A',
          qrCode: inv.id,
          reason: inv.reason,
          status: inv.status
        }));
      }

      // Filtro inteligente
      if (filter && filter !== 'ALL') {
        const f = filter.toUpperCase();
        if (f === 'ACTIVE') visits = visits.filter(v => ['activo', 'VALID', 'ACTIVE'].includes(v.status));
        else if (f === 'USED') visits = visits.filter(v => ['usado', 'USED', 'expirado', 'EXPIRED'].includes(v.status));
        else if (f === 'CANCELLED') visits = visits.filter(v => ['cancelado', 'CANCELLED'].includes(v.status));
      }

      // Buscador
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        visits = visits.filter(v =>
          (v.visitorName && v.visitorName.toLowerCase().includes(q)) ||
          (v.hostName && v.hostName.toLowerCase().includes(q)) ||
          (v.hostUnit && v.hostUnit.toLowerCase().includes(q)) ||
          (v.vehiclePlate && v.vehiclePlate.toLowerCase().includes(q)) ||
          (v.reason && v.reason.toLowerCase().includes(q))
        );
      }

      return visits;
    },

    // 14. Códigos de Enrolamiento (GET/POST /backend/api.php?action=enrollment_codes)
    async getEnrollmentCodes(filter = 'ALL', search = '') {
      let codes = [];
      try {
        const resp = await fetch('backend/api.php?action=enrollment_codes');
        if (resp.ok) {
          const data = await resp.json();
          if (data.ok && Array.isArray(data.codes)) {
            codes = data.codes.map(c => ({
              id: c.id_inv,
              code: c.invitacion_inv,
              type: c.tipo_inv,
              used: parseInt(c.usosactuales_inv || 0, 10),
              maxUses: parseInt(c.usosmaximos_inv || 10, 10),
              createdAt: c.fechacreacion_inv,
              expiresAt: c.fechavencimiento_inv,
              status: c.estado_inv
            }));
          }
        }
      } catch (e) {
        console.warn('API getEnrollmentCodes fallback a demo local:', e);
      }

      if (!codes || codes.length === 0) {
        codes = getStoredEnrollmentCodes();
      }

      // Filtro inteligente
      if (filter && filter !== 'ALL') {
        const f = filter.toUpperCase();
        if (f === 'RESIDENT') codes = codes.filter(c => c.type === 'residente');
        else if (f === 'ADMIN') codes = codes.filter(c => c.type === 'administrador');
        else if (f === 'ACTIVE') codes = codes.filter(c => c.status === 'activo' && c.used < c.maxUses);
      }

      // Buscador
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        codes = codes.filter(c => 
          (c.code && c.code.toLowerCase().includes(q)) ||
          (c.type && c.type.toLowerCase().includes(q))
        );
      }

      return codes;
    },

    async createEnrollmentCode(payload = {}) {
      let createdCode = null;
      try {
        const resp = await fetch('backend/api.php?action=enrollment_codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.ok) {
            createdCode = data;
          }
        }
      } catch (e) {
        console.warn('API createEnrollmentCode fallback a demo local:', e);
      }

      const prefix = payload.type === 'administrador' ? 'ADM-' : 'INV-';
      const codeStr = (createdCode && createdCode.code) 
        ? createdCode.code 
        : prefix + Math.random().toString(36).substring(2, 10).toUpperCase();

      const days = parseInt(payload.days || 30, 10);
      const now = new Date();
      const expDate = new Date();
      expDate.setDate(now.getDate() + days);

      const newRecord = {
        id: (createdCode && createdCode.id) ? createdCode.id : Date.now(),
        code: codeStr,
        type: payload.type || 'residente',
        used: 0,
        maxUses: parseInt(payload.maxUses || 10, 10),
        createdAt: now.toISOString().replace('T', ' ').substring(0, 19),
        expiresAt: expDate.toISOString().replace('T', ' ').substring(0, 19),
        status: 'activo'
      };

      // Siempre persistir en localStorage para garantizar disponibilidad en UI
      const currentList = getStoredEnrollmentCodes();
      currentList.unshift(newRecord);
      saveStoredEnrollmentCodes(currentList);

      return {
        ok: true,
        code: codeStr,
        record: newRecord,
        message: 'Código de enrolamiento generado y persistido'
      };
    },

    // 19. Módulo Contable: Consultar Cuotas de Mantenimiento y Adeudos
    async getCuotas(filters = {}) {
      try {
        const queryParams = new URLSearchParams();
        if (filters.communityId) queryParams.append('id_se', filters.communityId === 'com_001' ? 2 : 1);
        if (filters.residentId) queryParams.append('id_u', filters.residentId);
        if (filters.status && filters.status !== 'todas') queryParams.append('status', filters.status);

        const resp = await fetch(`backend/api.php?action=cuotas&${queryParams.toString()}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.ok && Array.isArray(data.cuotas)) {
            return data.cuotas;
          }
        }
      } catch (e) {
        // Fallback a localStorage
      }

      await delay(120);
      let cuotas = getStoredCuotas();

      if (filters.communityId) {
        cuotas = cuotas.filter(c => c.communityId === filters.communityId);
      }
      if (filters.residentId) {
        cuotas = cuotas.filter(c => c.residentId === filters.residentId);
      }
      if (filters.status && filters.status !== 'todas') {
        cuotas = cuotas.filter(c => c.status === filters.status);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        cuotas = cuotas.filter(c => 
          (c.residentName && c.residentName.toLowerCase().includes(q)) ||
          (c.unit && c.unit.toLowerCase().includes(q)) ||
          (c.concept && c.concept.toLowerCase().includes(q))
        );
      }

      return cuotas;
    },

    // 20. Módulo Contable: Consultar Historial de Pagos y Comprobantes
    async getPagos(filters = {}) {
      try {
        const queryParams = new URLSearchParams();
        if (filters.communityId) queryParams.append('id_se', filters.communityId === 'com_001' ? 2 : 1);
        if (filters.residentId) queryParams.append('id_u', filters.residentId);

        const resp = await fetch(`backend/api.php?action=pagos&${queryParams.toString()}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.ok && Array.isArray(data.pagos)) {
            return data.pagos;
          }
        }
      } catch (e) {
        // Fallback a localStorage
      }

      await delay(120);
      let pagos = getStoredPagos();

      if (filters.residentId) {
        pagos = pagos.filter(p => p.residentId === filters.residentId);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        pagos = pagos.filter(p => 
          (p.folio && p.folio.toLowerCase().includes(q)) ||
          (p.residentName && p.residentName.toLowerCase().includes(q)) ||
          (p.reference && p.reference.toLowerCase().includes(q)) ||
          (p.unit && p.unit.toLowerCase().includes(q))
        );
      }

      return pagos;
    },

    // 21. Módulo Contable: Registrar Pago de Cuota y Reactivación Automática
    async registerPayment(paymentData) {
      const { cuotaId, residentId, amount, method, reference, notes, adminName } = paymentData;

      let backendResult = null;
      try {
        const resp = await fetch('backend/api.php?action=register_payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cuotaId,
            amount,
            method,
            reference,
            notes
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.ok) backendResult = data;
        }
      } catch (e) {
        // Continuar con persistencia local
      }

      await delay(250);
      const cuotas = getStoredCuotas();
      const cuotaIndex = cuotas.findIndex(c => String(c.id) === String(cuotaId));

      if (cuotaIndex === -1) {
        throw new Error('La cuota a liquidar no fue encontrada en el sistema.');
      }

      const targetCuota = cuotas[cuotaIndex];
      targetCuota.status = 'pagada';
      saveStoredCuotas(cuotas);

      // Generar registro contable del pago
      const folio = (backendResult && backendResult.folio)
        ? backendResult.folio
        : 'REC-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

      const now = new Date();
      const newPayment = {
        id: (backendResult && backendResult.paymentId) ? backendResult.paymentId : Date.now(),
        cuotaId: targetCuota.id,
        folio: folio,
        residentId: targetCuota.residentId,
        residentName: targetCuota.residentName,
        unit: targetCuota.unit,
        concept: targetCuota.concept,
        type: targetCuota.type,
        amount: parseFloat(amount || targetCuota.amount),
        paymentMethod: method || 'transferencia',
        reference: reference || ('SPEI-' + Math.random().toString(36).substring(2, 8).toUpperCase()),
        receiptUrl: `recibos/${folio.toLowerCase()}.pdf`,
        paidAt: now.toISOString().replace('T', ' ').substring(0, 19),
        status: 'verificado',
        adminName: adminName || 'Administración HEYLEX',
        notes: notes || 'Liquidación de cuota registrada con éxito.'
      };

      const pagos = getStoredPagos();
      pagos.unshift(newPayment);
      saveStoredPagos(pagos);

      // Evaluar si el residente ya liquidó todos sus adeudos vencidos
      const residents = getStoredResidents();
      const resident = residents.find(r => r.id === targetCuota.residentId);
      let accessReactivated = false;

      if (resident) {
        // Calcular cuotas vencidas restantes
        const remainingOverdue = cuotas.filter(c => c.residentId === targetCuota.residentId && c.status === 'vencida');
        const remainingDebt = remainingOverdue.reduce((sum, c) => sum + (c.amount || 0), 0);

        resident.debtAmount = remainingDebt;
        resident.monthsDue = remainingOverdue.length;
        resident.lastPaymentDate = now.toISOString().split('T')[0];

        // Si ya no tiene adeudos pendientes o vencidos, ¡reactivar automáticamente!
        if (remainingOverdue.length === 0) {
          resident.licenseStatus = 'ACTIVE';
          resident.suspensionReason = null;
          accessReactivated = true;

          // Si el usuario actual es este residente, reactivar sesión en vivo
          const session = getStoredSession();
          if (session && session.user && session.user.id === resident.id) {
            session.user.membership.status = 'ACTIVE';
            session.user.membership.canGenerateOwnQr = true;
            session.user.membership.canInviteVisitors = true;
            session.user.membership.suspensionReason = null;
            saveStoredSession(session);
          }
        }

        saveStoredResidents(residents);
      }

      return {
        ok: true,
        payment: newPayment,
        accessReactivated,
        message: accessReactivated 
          ? `¡Pago registrado exitosamente! El residente ha saldado sus adeudos y su acceso QR fue REACTIVADO automáticamente.`
          : `¡Pago registrado con éxito con Folio ${folio}!`
      };
    },

    // 22. Módulo Contable: Resumen de Métricas Financieras (KPIs de Cobranza)
    async getFinanceSummary(communityId = 'com_001') {
      try {
        const resp = await fetch(`backend/api.php?action=finance_metrics&id_se=${communityId === 'com_001' ? 2 : 1}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.ok) return data;
        }
      } catch (e) {
        // Fallback local
      }

      const cuotas = getStoredCuotas().filter(c => !communityId || c.communityId === communityId);
      const pagos = getStoredPagos();

      const totalCollectedMonth = pagos.reduce((sum, p) => sum + (p.amount || 0), 0);
      const overdueCuotas = cuotas.filter(c => c.status === 'vencida');
      const overdueDebt = overdueCuotas.reduce((sum, c) => sum + (c.amount || 0), 0);
      const pendingCuotas = cuotas.filter(c => c.status === 'pendiente');
      const pendingAmount = pendingCuotas.reduce((sum, c) => sum + (c.amount || 0), 0);

      const totalExpected = totalCollectedMonth + overdueDebt + pendingAmount;
      const collectionRate = totalExpected > 0 ? Math.round((totalCollectedMonth / totalExpected) * 100) : 100;

      return {
        totalCollectedMonth,
        overdueDebt,
        overdueCount: overdueCuotas.length,
        pendingAmount,
        pendingCount: pendingCuotas.length,
        collectionRate
      };
    },

    // 23. Módulo Contable: Generar Nueva Cuota
    async generateCuota(cuotaData) {
      const cuotas = getStoredCuotas();
      const newCuota = {
        id: Date.now(),
        communityId: cuotaData.communityId || 'com_001',
        residentId: cuotaData.residentId,
        residentName: cuotaData.residentName || 'Residente',
        unit: cuotaData.unit || 'Lote Condominal',
        concept: cuotaData.concept || 'Cuota de Mantenimiento',
        type: cuotaData.type || 'ordinaria',
        amount: parseFloat(cuotaData.amount || 1850),
        dueDate: cuotaData.dueDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        status: 'pendiente',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      cuotas.unshift(newCuota);
      saveStoredCuotas(cuotas);

      return {
        ok: true,
        cuota: newCuota,
        message: 'Cuota generada y enviada a cuenta del residente.'
      };
    }
  };
})();

window.HeylexAPI = HeylexAPI;
