# Manual de Consumo de APIs REST — HEYLEX Security Platform

Bienvenido al manual oficial de referencia para el consumo e integración de las **APIs REST de HEYLEX**. Este documento está diseñado para desarrolladores de aplicaciones web, aplicaciones móviles (iOS / Android) e integradores de hardware de caseta (tótems con lectores QR, cámaras LPR, barreras vehiculares y torniquetes peatonales).

---

## 1. Arquitectura y Convenciones Globales

### 1.1 URLs Base del Servicio
Dependiendo de tu entorno de ejecución, las solicitudes deben dirigirse a:

- **Entorno Local (XAMPP):**  
  `http://localhost/heylexOpcion2/backend/api.php`  
  *(o `http://localhost:8000/backend/api.php` si inicias con el script `.bat`)*
- **Entorno de Producción (Hostinger / Servidor en Vivo):**  
  `https://tudominio.com/backend/api.php`

### 1.2 Mecanismo de Enrutamiento
Las acciones de la API se despachan mediante el parámetro de consulta `action`:
```http
https://tudominio.com/backend/api.php?action=<nombre_del_endpoint>
```

### 1.3 Cabeceras HTTP Obligatorias
Toda solicitud debe incluir las siguientes cabeceras:

```http
Content-Type: application/json
Accept: application/json
```

Para endpoints privados (todos excepto `status` y `login`), se debe incluir el token JWT obtenido tras iniciar sesión:
```http
Authorization: Bearer <TU_JWT_TOKEN>
```

---

## 2. Sistema de Autenticación y Roles (RBAC)

HEYLEX utiliza tokens **JWT (JSON Web Tokens)** firmados con el algoritmo seguro **HS256**. La vigencia por defecto del token es de **30 días** (configurable mediante `HEYLEX_JWT_TTL`).

### Matriz de Roles y Niveles de Acceso

| ID Rol | Rol | Descripción y Alcance |
| :---: | :--- | :--- |
| **`4`** | **ADMINISTRADOR** | Control total del fraccionamiento: gestión de residentes, emisión de cuotas, registro de cobros, generación de códigos de enrolamiento y métricas financieras. |
| **`3`** | **GUARDIA** | Operación en caseta: consulta de bitácora forense de accesos, validación de pases QR de visitantes y consulta de visitas activas. |
| **`5`** | **RESIDENTE** | Usuario final: consulta de credencial QR propia, generación de pases para visitas, visualización de cuotas y estado de cuenta personal. |

> [!IMPORTANT]
> **Protección Anti-IDOR y Aislamiento por Comunidad:**  
> Los identificadores de fraccionamiento (`id_se`) y del usuario no son aceptados ciegamente desde el cliente. El backend deriva los permisos directamente de las afirmaciones criptográficas del JWT y de la tabla `serviciosusuarios`. Un residente nunca puede consultar datos de otro usuario ni de otra privada residencial.

---

## 3. Catálogo Detallado de Endpoints

### 3.1 Módulo: Diagnóstico y Autenticación

---

#### `GET ?action=status`
Comprueba la salud del backend y el estado de la conexión con MySQL. No requiere autenticación.

- **Método:** `GET`
- **Permisos:** Público (sin token)
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "message": "Servicio de autenticación activo",
    "database_connected": true,
    "server_time": "2026-11-08 03:15:20"
  }
  ```

---

#### `POST ?action=login`
Inicia sesión de usuario (Administrador, Guardia o Residente), genera el token JWT y devuelve los datos de perfil, membresía y comunidad.

- **Método:** `POST`
- **Permisos:** Público (sin token)
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "email": "admin@heylex.mx",
    "password": "admin123"
  }
  ```
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "message": "Autenticación exitosa",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91IjoxLCJlbWFpbCI6...",
    "expiresIn": 2592000,
    "user": {
      "id": 1,
      "name": "Ing. Carlos Morales",
      "email": "admin@heylex.mx",
      "role": "ADMINISTRADOR",
      "gender": "male",
      "unit": "Casa 42-B",
      "qrCode": "HLX-ADMIN-001",
      "phone": "+52 993 123 4567",
      "community": {
        "id": 2,
        "name": "Residencial Cumbres Del Ángel",
        "address": "Av. Paseo de las Lomas #100, Villahermosa, Tabasco",
        "zone": "Privada Los Robles",
        "unit": "Casa 42-B"
      },
      "membership": {
        "status": "ACTIVE",
        "canGenerateOwnQr": true,
        "canInviteVisitors": true,
        "licensePlan": "Plan Residencial Premium",
        "validUntil": "2027-11-08",
        "monthsDue": 0,
        "debtAmount": 0.00
      }
    }
  }
  ```
- **Respuesta de Error (`401 Unauthorized`):**
  ```json
  {
    "ok": false,
    "error": "Usuario o contraseña incorrectos."
  }
  ```

---

### 3.2 Módulo: Padrón de Residentes

---

#### `GET ?action=residents`
Obtiene el padrón de residentes del fraccionamiento, incluyendo el cálculo dinámico de cartera vencida y meses de adeudo.

- **Método:** `GET`
- **Permisos:** Requiere rol `ADMINISTRADOR` (4)
- **Parámetros URL (Opcionales):**
  - `id_se`: ID de la comunidad (ej. `2`).
  - `filter`: `ALL` (todos), `ACTIVE` (al corriente), `SUSPENDED` (morosos/suspendidos).
  - `search`: Búsqueda textual por nombre, correo, lote o teléfono.
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "residents": [
      {
        "id": 2,
        "name": "Ing. Carlos Mendoza R.",
        "email": "carlos.mendoza@cumbresdelangel.com",
        "phone": "9931234567",
        "unit": "Casa 42-B",
        "zone": "Privada Los Robles",
        "licenseStatus": "ACTIVE",
        "monthsDue": 0,
        "debtAmount": 0.00,
        "qrCode": "HLX-RES-MENDOZA",
        "lastPaymentDate": "2026-11-08"
      }
    ]
  }
  ```

---

#### `POST ?action=update_resident_status`
Suspende o reactiva los privilegios de un residente (bloqueando o habilitando su código QR en caseta).

- **Método:** `POST` o `PATCH`
- **Permisos:** Requiere rol `ADMINISTRADOR` (4)
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "residentId": 2,
    "status": "SUSPENDED" 
  }
  ```
  *(Valores admitidos para `status`: `"ACTIVE"` o `"SUSPENDED"`)*
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "message": "Estatus del residente actualizado correctamente.",
    "residentId": 2,
    "status": "SUSPENDED"
  }
  ```

---

### 3.3 Módulo: Caseta, Visitas y Bitácora Forense

---

#### `GET ?action=access_logs`
Consulta los registros forenses de aperturas, accesos concedidos y denegados en caseta.

- **Método:** `GET`
- **Permisos:** Requiere rol `ADMINISTRADOR` (4) o `GUARDIA` (3)
- **Parámetros URL:**
  - `limit`: Número máximo de registros a devolver (por defecto `100`, máx. `500`).
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "logs": [
      {
        "id": 105,
        "accessType": "ENTRADA",
        "status": "PERMITTED",
        "method": "QR_APP",
        "holderName": "Ing. Carlos Mendoza R.",
        "holderType": "RESIDENTE",
        "unit": "Casa 42-B",
        "lane": "Carril 1 (Residentes)",
        "timestamp": "2026-11-08 02:45:10"
      }
    ]
  }
  ```

---

#### `GET ?action=invitations`
Lista las visitas programadas y pases de acceso QR activos.
- Si quien consulta es un **Residente**, la API filtra automáticamente devolviendo solo sus propias invitaciones.
- Si consulta un **Administrador** o **Guardia**, devuelve las visitas de la comunidad.

- **Método:** `GET`
- **Permisos:** `ADMINISTRADOR` (4), `GUARDIA` (3), `RESIDENTE` (5)
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "invitations": [
      {
        "id": 14,
        "visitorName": "Lic. Alejandro Torres",
        "qrCode": "HLX-VISIT-884920",
        "entryType": "VEHICULAR",
        "vehiclePlate": "WSS-992-A",
        "accessType": "SINGLE_USE",
        "validFrom": "2026-11-08 10:00:00",
        "validTo": "2026-11-08 23:59:59",
        "status": "activa",
        "residentName": "Ing. Carlos Mendoza R."
      }
    ]
  }
  ```

---

#### `POST ?action=invitations`
Crea una nueva invitación con pase QR dinámico para un visitante.

- **Método:** `POST`
- **Permisos:** `RESIDENTE` (5) o `ADMINISTRADOR` (4)
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "visitorName": "Mariana Gómez Fuentes",
    "entryType": "VEHICULAR",
    "vehiclePlate": "WSS-123-B",
    "accessType": "SINGLE_USE",
    "validHours": 24,
    "notes": "Reunión familiar"
  }
  ```
  *(Opciones de `entryType`: `"VEHICULAR"`, `"PEATONAL"`. Opciones de `accessType`: `"SINGLE_USE"`, `"WEEKEND"`, `"TEMPORARY"`)*
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "message": "Invitación creada exitosamente",
    "invitation": {
      "id": 15,
      "qrCode": "HLX-VISIT-491028",
      "visitorName": "Mariana Gómez Fuentes",
      "validTo": "2026-11-09 03:20:00"
    }
  }
  ```

---

#### `GET ?action=all_visits`
Listado forense unificado de todas las visitas de la comunidad con detalles del anfitrión y vehículo.

- **Método:** `GET`
- **Permisos:** `ADMINISTRADOR` (4), `GUARDIA` (3)

---

### 3.4 Módulo: Enrolamiento de Colonos

---

#### `GET ?action=enrollment_codes`
Obtiene las claves activas de enrolamiento para registro autónomo de nuevos colonos.

- **Método:** `GET`
- **Permisos:** `ADMINISTRADOR` (4)
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "codes": [
      {
        "id": 3,
        "code": "INV-RES-9482",
        "type": "residente",
        "used": 1,
        "maxUses": 10,
        "status": "activo",
        "createdAt": "2026-11-01 10:00:00",
        "expiresAt": "2026-12-01 10:00:00"
      }
    ]
  }
  ```

---

#### `POST ?action=enrollment_codes`
Genera una nueva clave de enrolamiento con límite de usos y fecha de caducidad.

- **Método:** `POST`
- **Permisos:** `ADMINISTRADOR` (4)
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "type": "residente",
    "maxUses": 10,
    "days": 30
  }
  ```
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "message": "Código de enrolamiento generado",
    "code": "INV-RES-6184",
    "type": "residente",
    "maxUses": 10,
    "expiresAt": "2026-12-08 03:20:00"
  }
  ```

---

### 3.5 Módulo: Finanzas, Cuotas y Cobranza

---

#### `GET ?action=cuotas`
Consulta el listado de cuotas ordinarias, extraordinarias, amenidades y multas.

- **Método:** `GET`
- **Permisos:** `ADMINISTRADOR` (4) o `RESIDENTE` (5)
- **Parámetros URL (Opcionales):**
  - `status`: `todas`, `pendiente`, `vencida`, `pagada`.
  - `id_u`: ID del residente (solo admin; para residentes se filtra automáticamente el usuario en sesión).
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "cuotas": [
      {
        "id": 5,
        "residentId": 2,
        "residentName": "Ing. Carlos Mendoza R.",
        "unit": "Casa 42-B",
        "concept": "Mantenimiento Mensual Noviembre 2026",
        "type": "ordinaria",
        "amount": 1850.00,
        "dueDate": "2026-11-20",
        "status": "pendiente"
      }
    ]
  }
  ```

---

#### `POST ?action=cuotas`
Emite y programa una nueva cuota individual o por lote.

- **Método:** `POST`
- **Permisos:** Requiere rol `ADMINISTRADOR` (4)
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "residentId": 2,
    "concept": "Cuota Mantenimiento Diciembre 2026",
    "type": "ordinaria",
    "amount": 1850.00,
    "dueDate": "2026-12-15"
  }
  ```
  *(Tipos admitidos: `"ordinaria"`, `"extraordinaria"`, `"amenidad"`, `"multa"`)*

---

#### `GET ?action=pagos`
Devuelve el historial contable de pagos verificados y comprobantes digitales.

- **Método:** `GET`
- **Permisos:** `ADMINISTRADOR` (4) o `RESIDENTE` (5)
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "pagos": [
      {
        "id": 8,
        "folio": "REC-2026-68583",
        "cuotaId": 4,
        "residentId": 2,
        "residentName": "Ing. Carlos Mendoza R.",
        "unit": "Casa 42-B",
        "concept": "Mantenimiento Mensual Octubre 2026",
        "amount": 1850.00,
        "paymentMethod": "transferencia",
        "reference": "SPEI-BBVA-7829104",
        "paidAt": "2026-10-05 11:22:15",
        "status": "verificado",
        "adminName": "Administración HEYLEX"
      }
    ]
  }
  ```

---

#### `POST ?action=register_payment`
Registra la liquidación de una cuota en una transacción atómica: emite el folio oficial del recibo, marca la cuota como `pagada` y **reactiva automáticamente el acceso QR en caseta** (`id_eu = 1`, `qractivo_u = 'y'`) si el residente ya no cuenta con más adeudos vencidos.

- **Método:** `POST`
- **Permisos:** Requiere rol `ADMINISTRADOR` (4)
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "cuotaId": 5,
    "amount": 1850.00,
    "method": "transferencia",
    "reference": "SPEI-BBVA-849201",
    "notes": "Pago validado en cuenta de banco BBVA"
  }
  ```
  *(Métodos admitidos: `"transferencia"`, `"efectivo"`, `"tarjeta"`, `"deposito"`)*
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "message": "Pago registrado correctamente.",
    "paymentId": 9,
    "folio": "REC-2026-10492",
    "cuotaId": 5,
    "amount": 1850.00,
    "overdueRemaining": 0,
    "accessReactivated": true
  }
  ```

---

#### `GET ?action=finance_metrics`
Obtiene las métricas consolidadas de cobranza y finanzas de la comunidad.

- **Método:** `GET`
- **Permisos:** Requiere rol `ADMINISTRADOR` (4)
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "totalCollectedMonth": 92500.00,
    "overdueDebt": 12950.00,
    "pendingAmount": 37000.00,
    "collectionRate": 87.7
  }
  ```

---

### 3.6 Módulo: Comunidad, Información Bancaria y Amenidades

---

#### `GET ?action=community_info`
Devuelve el nombre, dirección, logotipo y reglas del fraccionamiento.

- **Método:** `GET`
- **Permisos:** Cualquier usuario autenticado (`ADMINISTRADOR`, `GUARDIA`, `RESIDENTE`)

---

#### `GET ?action=community_bank_info`
Devuelve los datos de la cuenta bancaria de la administración para transferencias SPEI (banco, CLABE interbancaria, beneficiario y WhatsApp de soporte).

- **Método:** `GET`
- **Permisos:** Cualquier usuario autenticado
- **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "ok": true,
    "bank": "BBVA México",
    "clabe": "012790001234567890",
    "beneficiary": "Administración Residencial Cumbres Del Ángel AC",
    "whatsapp": "+52 993 123 4567"
  }
  ```

---

#### `GET ?action=comunicados`
Lista de circulares, avisos oficiales y alertas vecinales emitidas por la mesa directiva.

- **Método:** `GET`
- **Permisos:** Cualquier usuario autenticado

---

#### `GET ?action=amenidades`
Catálogo de amenidades y áreas de uso común (palapas, albercas, gimnasio, canchas).

- **Método:** `GET`
- **Permisos:** Cualquier usuario autenticado

---

## 4. Ejemplos de Implementación

### 4.1 Consumo en JavaScript (`fetch`)

Función utilitaria estándar para realizar peticiones autenticadas a la API:

```javascript
const API_BASE_URL = 'https://tudominio.com/backend/api.php';

// 1. Iniciar sesión y guardar token
async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Credenciales inválidas');
  }

  // Guardar token para peticiones posteriores
  localStorage.setItem('heylex_jwt_token', data.token);
  return data.user;
}

// 2. Realizar petición autenticada a un endpoint privado
async function apiRequest(action, options = {}) {
  const token = localStorage.getItem('heylex_jwt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}?action=${action}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (response.status === 401) {
    localStorage.removeItem('heylex_jwt_token');
    alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    window.location.reload();
    return;
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
}

// 3. Ejemplo: Registrar un pago como Administrador
async function cobrarCuota(cuotaId, monto, metodo, referencia) {
  const resultado = await apiRequest('register_payment', {
    method: 'POST',
    body: JSON.stringify({
      cuotaId: Number(cuotaId),
      amount: parseFloat(monto),
      method: metodo,
      reference: referencia,
      notes: 'Pago recibido vía pasarela digital'
    })
  });

  console.log(`Pago registrado con Folio: ${resultado.folio}`);
  if (resultado.accessReactivated) {
    console.log('¡Acceso QR reactivado automáticamente en caseta!');
  }
  return resultado;
}
```

---

### 4.2 Consumo con cURL (Terminal / Postman)

#### Paso 1: Iniciar sesión y obtener Token
```bash
curl -X POST "https://tudominio.com/backend/api.php?action=login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@heylex.mx","password":"admin123"}'
```

#### Paso 2: Consultar residentes con el Token obtenido
```bash
curl -X GET "https://tudominio.com/backend/api.php?action=residents" \
     -H "Authorization: Bearer <TU_TOKEN_JWT>" \
     -H "Content-Type: application/json"
```

#### Paso 3: Registrar el pago de una cuota
```bash
curl -X POST "https://tudominio.com/backend/api.php?action=register_payment" \
     -H "Authorization: Bearer <TU_TOKEN_JWT>" \
     -H "Content-Type: application/json" \
     -d '{
       "cuotaId": 5,
       "amount": 1850.00,
       "method": "transferencia",
       "reference": "SPEI-BBVA-123456",
       "notes": "Liquidación verificada"
     }'
```

---

### 4.3 Consumo mediante el SDK de Frontend (`window.HeylexAPI`)

El archivo [`api.js`](file:///c:/xampp/htdocs/heylexOpcion2/api.js) ya incluye un SDK listo para usar en tu aplicación web o PWA:

```javascript
// Iniciar sesión
const session = await window.HeylexAPI.login('admin@heylex.mx', 'admin123');

// Consultar cuotas
const cuotas = await window.HeylexAPI.getCuotas({ status: 'pendiente' });

// Registrar pago
const res = await window.HeylexAPI.registerPayment({
  cuotaId: 5,
  amount: 1850.00,
  method: 'transferencia',
  reference: 'SPEI-789'
});

// Emitir código de enrolamiento para nuevo vecino
const nuevoCodigo = await window.HeylexAPI.createEnrollmentCode({
  type: 'residente',
  maxUses: 10,
  days: 30
});
```

---

## 5. Códigos de Estado y Manejo de Errores

La API utiliza códigos de estado HTTP estándar junto con un cuerpo JSON normalizado:

| Código HTTP | Significado | Causa común |
| :---: | :--- | :--- |
| **`200 OK`** | Operación exitosa | La consulta o actualización se completó satisfactoriamente. |
| **`400 Bad Request`** | Parámetros inválidos | Faltan campos requeridos en el JSON o el tipo de dato es incorrecto. |
| **`401 Unauthorized`** | No autenticado | Token ausente, firma inválida o vigencia expirada. |
| **`403 Forbidden`** | Sin permisos (RBAC / IDOR) | El rol del usuario no tiene autorización para esta acción o intenta acceder a otra comunidad. |
| **`404 Not Found`** | Recurso no encontrado | La cuota, residente, acción o invitación especificada no existe en la BD. |
| **`405 Method Not Allowed`** | Método no permitido | Se envió `GET` a un endpoint que exige `POST`, o viceversa. |
| **`409 Conflict`** | Conflicto de estado | Por ejemplo, intentar pagar una cuota que ya se encuentra pagada. |
| **`500 Internal Error`** | Error de servidor | Fallo en la conexión a MySQL o error en tiempo de ejecución (registrado en el log interno). |

### Formato de Error Estándar:
```json
{
  "ok": false,
  "error": "Descripción legible del motivo del rechazo.",
  "details": null
}
```

---

## 6. Integración con Hardware de Caseta (Tótems y Barreras)

Para tótems de entrada con cámaras o lectores láser de códigos QR:

1. **Lectura del QR:** El tótem lee la cadena del pase (ej. `HLX-RES|2|2|1731038400|SEC_892F`).
2. **Validación:** El software de caseta envía una petición `GET ?action=invitations` o consulta el pase en la bitácora con sus credenciales de guardia (`id_ro = 3`).
3. **Acción de Barrera:**
   - Si `status == "activa"` o el residente tiene `licenseStatus == "ACTIVE"`:
     - El software activa el relevador de la pluma automática (pulso de apertura).
     - Se registra el evento en `access_logs`.
   - Si `licenseStatus == "SUSPENDIDO"`:
     - La pantalla del tótem muestra: *"Acceso suspendido: Por favor comuníquese a la administración"*.
     - La barrera permanece cerrada.

---

## 7. Módulo de Caseta y Guardias de Seguridad (Endpoints Operativos)

### 7.1 Verificar Pase o Credencial QR en Caseta
- **Ruta:** `POST /backend/api.php?action=verify_pass`
- **Permisos:** Guardia (`id_ro = 3`) o Administrador (`id_ro = 4`).
- **Body JSON:**
```json
{
  "qrPayload": "HLX-RES|1|2|1731038400|SEC_892F",
  "id_se": 2
}
```
- **Respuesta (Acceso Permitido):**
```json
{
  "ok": true,
  "type": "RESIDENTE",
  "permitted": true,
  "residentId": 1,
  "name": "Ing. Carlos Mendoza R.",
  "unit": "Casa 42-B",
  "zone": "Privada Los Robles",
  "reason": "Residente Al Corriente. Acceso Autorizado.",
  "debtAmount": 0,
  "overdueCount": 0
}
```
- **Respuesta (Acceso Denegado por Morosidad):**
```json
{
  "ok": true,
  "type": "RESIDENTE",
  "permitted": false,
  "residentId": 2,
  "name": "Lic. Ana Sofía Garza",
  "unit": "Casa 18-A",
  "zone": "Privada Los Robles",
  "reason": "Acceso Suspendido: Cuenta con 2 cuota(s) vencida(s) [$3,700 MXN].",
  "debtAmount": 3700.00,
  "overdueCount": 2
}
```

### 7.2 Asentar Evento de Cruce en Bitácora Forense
- **Ruta:** `POST /backend/api.php?action=record_access`
- **Permisos:** Guardia o Administrador.
- **Body JSON:**
```json
{
  "type": "RESIDENTE",
  "result": "PERMITTED",
  "direction": "entrada",
  "residentId": 1,
  "visitId": 0,
  "reason": "Acceso verificado en caseta"
}
```
- **Respuesta:**
```json
{
  "ok": true,
  "message": "Cruce registrado exitosamente en bitácora.",
  "data": {
    "ok": true,
    "accessId": 56,
    "type": "residente",
    "result": "permitido",
    "movement": "entrada",
    "timestamp": "2026-11-07 22:30:15"
  }
}
```

### 7.3 Registro Rápido de Paquetería y Delivery Exprés
- **Ruta:** `POST /backend/api.php?action=register_delivery`
- **Permisos:** Guardia o Administrador.
- **Body JSON:**
```json
{
  "company": "Amazon",
  "visitorName": "Juan Pérez",
  "vehiclePlate": "WSR-8820",
  "unit": "Casa 42-B",
  "notes": "Entrega de paquete sellado"
}
```

### 7.4 Búsqueda de Visitas Programadas del Día
- **Ruta:** `GET /backend/api.php?action=guard_visits&id_se=2&search=carlos`
- **Permisos:** Guardia o Administrador.
- **Respuesta:**
```json
{
  "ok": true,
  "visits": [
    {
      "id_vp": 12,
      "nombre_vp": "Lic. Fernando Tapia",
      "placas_vp": "WSA-7781",
      "tipocruce_vp": "vehicular",
      "estatus_vp": "activa",
      "motivo_vp": "Reunión de trabajo",
      "fechainicio_vp": "2026-11-07 10:00:00",
      "fechafin_vp": "2026-11-07 18:00:00",
      "residente_nombre": "Carlos Mendoza",
      "residente_unidad": "Casa 42-B",
      "residente_privada": "Privada Los Robles"
    }
  ]
}
```

