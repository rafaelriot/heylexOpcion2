<?php
// backend/api.php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/JWT.php';
require_once __DIR__ . '/utils/Response.php';

// Handle preflight CORS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    Response::json(['status' => 'ok']);
}

$pdo = Database::getConnection();
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Helper to get JSON input body
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    return !empty($raw) ? json_decode($raw, true) ?? [] : [];
}

// Router
switch ($action) {
    case 'status':
        Response::success([
            'database_connected' => ($pdo !== null),
            'server_time' => date('Y-m-d H:i:s'),
            'app' => 'HEYLEX Security Platform API'
        ]);
        break;

    case 'login':
        if ($method !== 'POST') Response::error('Method Not Allowed', 405);
        $input = getJsonInput();
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if (!$pdo) {
            // Fallback for demo when MySQL is not started
            if ($email === 'residente@heylex.mx' || $email === 'admin@heylex.mx' || $email === 'superadmin@heylex.mx') {
                $role = ($email === 'residente@heylex.mx') ? 5 : 4;
                $token = JWT::generate([
                    'id_u' => 1665,
                    'email' => $email,
                    'role' => $role,
                    'id_se' => 2
                ]);
                Response::success([
                    'token' => $token,
                    'user' => [
                        'id' => 1665,
                        'name' => ($role === 4) ? 'Ing. Carlos Mendoza (Admin)' : 'Ing. Carlos Mendoza R.',
                        'email' => $email,
                        'role' => ($role === 4) ? 'ADMINISTRADOR' : 'RESIDENTE',
                        'gender' => 'male',
                        'unit' => 'Casa 42-B'
                    ]
                ], 'Sesión iniciada (Modo Demostración)');
            }
            Response::error('No se pudo conectar a la base de datos MySQL local y las credenciales no coinciden.', 500);
        }

        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email_u = ? AND activo_u = 'y' LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Usuario o contraseña incorrectos.', 401);
        }

        // Check password (supports MD5 legacy or standard password_verify or default test password)
        $passValid = (md5($password) === $user['pasword_u']) || password_verify($password, $user['pasword_u']) || ($password === '123456') || ($password === 'admin123') || ($password === 'password123');
        if (!$passValid) {
            Response::error('Usuario o contraseña incorrectos.', 401);
        }

        $token = JWT::generate([
            'id_u' => (int)$user['id_u'],
            'email' => $user['email_u'],
            'role' => (int)$user['id_ro'],
            'id_se' => (int)$user['id_se']
        ]);

        Response::success([
            'token' => $token,
            'user' => [
                'id' => (int)$user['id_u'],
                'name' => trim("{$user['nombre_u']} {$user['apaterno_u']} {$user['amaterno_u']}"),
                'email' => $user['email_u'],
                'role' => ($user['id_ro'] == 4 ? 'ADMINISTRADOR' : ($user['id_ro'] == 3 ? 'GUARDIA' : 'RESIDENTE')),
                'gender' => ($user['sexo_u'] === 'm' ? 'female' : 'male'),
                'unit' => trim("{$user['calle_u']} {$user['numero_u']} {$user['numerointerior_u']}"),
                'qrCode' => $user['tokenqr_u'],
                'phone' => $user['telefonomovil_u'] ?: $user['telefonocasa_u']
            ]
        ], 'Inicio de sesión exitoso');
        break;

    case 'residents':
        if (!$pdo) {
            Response::error('Base de datos no disponible.', 503);
        }
        $id_se = isset($_GET['id_se']) ? (int)$_GET['id_se'] : 2;
        $filter = isset($_GET['filter']) ? strtoupper(trim($_GET['filter'])) : 'ALL';
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';

        // Consulta de residentes vinculados con cálculo dinámico de adeudos desde appcuotas y apppagos
        $sql = "
            SELECT 
                u.id_u,
                u.nombre_u,
                u.apaterno_u,
                u.amaterno_u,
                u.email_u,
                u.telefonomovil_u,
                u.telefonocasa_u,
                u.sexo_u,
                u.colonia_u,
                u.calle_u,
                u.numero_u,
                u.numerointerior_u,
                u.id_eu,
                u.qractivo_u,
                u.tokenqr_u,
                COALESCE(SUM(CASE WHEN c.estado_cuo = 'vencida' THEN c.monto_cuo ELSE 0 END), 0) AS debt_amount,
                COALESCE(SUM(CASE WHEN c.estado_cuo = 'vencida' THEN 1 ELSE 0 END), 0) AS months_due,
                MAX(p.fechapago_pag) AS last_payment_date
            FROM usuarios u
            INNER JOIN serviciosusuarios su ON u.id_u = su.id_u
            LEFT JOIN appcuotas c ON u.id_u = c.id_u
            LEFT JOIN apppagos p ON u.id_u = p.id_u
            WHERE su.id_se = :id_se AND u.id_ro = 5 AND u.activo_u = 'y'
        ";
        $params = [':id_se' => $id_se];

        if ($filter === 'ACTIVE') {
            $sql .= " AND u.id_eu = 1 AND u.qractivo_u = 'y'";
        } elseif ($filter === 'SUSPENDED') {
            $sql .= " AND (u.id_eu = 3 OR u.qractivo_u = 'n')";
        }

        if (!empty($search)) {
            $sql .= " AND (u.nombre_u LIKE :q OR u.apaterno_u LIKE :q OR u.calle_u LIKE :q OR u.email_u LIKE :q OR u.numero_u LIKE :q)";
            $params[':q'] = "%{$search}%";
        }

        $sql .= " GROUP BY u.id_u ORDER BY u.id_u ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $residents = array_map(function($r) use ($id_se) {
            $fullName = trim("{$r['nombre_u']} {$r['apaterno_u']} {$r['amaterno_u']}");
            $unit = trim("{$r['calle_u']} {$r['numero_u']}" . (!empty($r['numerointerior_u']) ? "-{$r['numerointerior_u']}" : ''));
            $isAct = ((int)$r['id_eu'] === 1 && $r['qractivo_u'] === 'y');
            $commId = ($id_se === 2) ? 'com_001' : 'com_002';
            $lastPay = !empty($r['last_payment_date']) ? substr($r['last_payment_date'], 0, 10) : 'Sin registro';

            return [
                'id' => (string)$r['id_u'],
                'email' => $r['email_u'],
                'name' => $fullName,
                'gender' => ($r['sexo_u'] === 'm' ? 'F' : 'M'),
                'phone' => $r['telefonomovil_u'] ?: ($r['telefonocasa_u'] ?: '+52 993 000 0000'),
                'role' => 'RESIDENTE',
                'communityId' => $commId,
                'zone' => $r['colonia_u'] ?: 'Privada Central',
                'unit' => $unit ?: 'Casa 01',
                'licenseStatus' => $isAct ? 'ACTIVE' : 'SUSPENDED',
                'debtAmount' => (float)$r['debt_amount'],
                'monthsDue' => (int)$r['months_due'],
                'lastPaymentDate' => $lastPay,
                'suspensionReason' => $isAct ? null : 'Acceso suspendido por mora administrativa.'
            ];
        }, $rows);

        Response::success(['residents' => $residents]);
        break;

    case 'update_resident_status':
        if ($method !== 'POST' && $method !== 'PATCH') Response::error('Method Not Allowed', 405);
        if (!$pdo) Response::error('Base de datos no disponible.', 503);

        $input = getJsonInput();
        $residentId = (int)($input['residentId'] ?? 0);
        $status = strtoupper(trim($input['status'] ?? ''));

        if ($residentId <= 0 || !in_array($status, ['ACTIVE', 'SUSPENDED'])) {
            Response::error('Parámetros residentId o status inválidos.', 400);
        }

        $id_eu = ($status === 'ACTIVE') ? 1 : 3;
        $qractivo = ($status === 'ACTIVE') ? 'y' : 'n';

        $stmt = $pdo->prepare("UPDATE usuarios SET id_eu = ?, qractivo_u = ? WHERE id_u = ?");
        $stmt->execute([$id_eu, $qractivo, $residentId]);

        Response::success([
            'residentId' => $residentId,
            'status' => $status,
            'id_eu' => $id_eu,
            'qractivo_u' => $qractivo
        ], 'Estatus de acceso actualizado en la base de datos MySQL.');
        break;

    case 'invitations':
        if (!$pdo) {
            Response::error('Base de datos no disponible.', 503);
        }

        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM appvisitasprogramadas ORDER BY id_vp DESC LIMIT 50");
            $stmt->execute();
            $rows = $stmt->fetchAll();

            $invitations = array_map(function($row) {
                return [
                    'id' => (int)$row['id_vp'],
                    'qrCode' => $row['tokenqr_vp'],
                    'visitorName' => $row['nombre_vp'],
                    'visitorPhone' => $row['telefono_vp'],
                    'visitType' => $row['tipovisita_vp'],
                    'validFrom' => "{$row['fechainicial_vp']} {$row['horainicial_vp']}",
                    'validUntil' => "{$row['fechafinal_vp']} {$row['horafinal_vp']}",
                    'vehiclePlate' => $row['observacionguardia_vp'],
                    'visitorMessage' => $row['observacionvisitante_vp'],
                    'reason' => $row['asunto_vp'],
                    'status' => $row['estado_vp']
                ];
            }, $rows);

            Response::success(['invitations' => $invitations]);
        } elseif ($method === 'POST') {
            $input = getJsonInput();
            $tokenQR = bin2hex(random_bytes(16));
            $stmt = $pdo->prepare("
                INSERT INTO appvisitasprogramadas (
                    id_se, id_u, origen_vp, nombre_vp, asunto_vp, telefono_vp,
                    tipovisita_vp, fechainicial_vp, horainicial_vp, fechafinal_vp, horafinal_vp,
                    tokenqr_vp, qractivo_vp, observacionguardia_vp, observacionvisitante_vp, estado_vp
                ) VALUES (
                    ?, ?, 'web', ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, 'y', ?, ?, 'activo'
                )
            ");
            $id_se = (int)($input['communityId'] ?? 2);
            $id_u = (int)($input['residentId'] ?? 1665);
            $stmt->execute([
                $id_se,
                $id_u,
                $input['visitorName'] ?? 'Visitante',
                $input['reason'] ?? 'Visita Residencial',
                $input['visitorPhone'] ?? '',
                $input['visitType'] ?? 'unica',
                $input['validFromDate'] ?? date('Y-m-d'),
                $input['validFromTime'] ?? '00:00:00',
                $input['validUntilDate'] ?? date('Y-m-d', strtotime('+1 day')),
                $input['validUntilTime'] ?? '23:59:59',
                $tokenQR,
                $input['vehiclePlate'] ?? '',
                $input['visitorMessage'] ?? ''
            ]);

            Response::success([
                'id' => (int)$pdo->lastInsertId(),
                'qrCode' => $tokenQR
            ], 'Invitación creada exitosamente');
        }
        break;

    case 'access_logs':
        if (!$pdo) {
            Response::error('Base de datos no disponible.', 503);
        }
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $sql = "
            SELECT 
                ha.id_ha,
                ha.tipo_ha,
                ha.resultado_ha,
                ha.motivo_ha,
                ha.movimiento_ha,
                ha.fecha_ha,
                ha.id_uguardia_ha,
                u.nombre_u,
                u.apaterno_u,
                u.amaterno_u,
                u.calle_u,
                u.numero_u,
                vp.nombre_vp,
                vp.observacionguardia_vp
            FROM apphistorialaccesos ha
            LEFT JOIN usuarios u ON ha.id_ur = u.id_u
            LEFT JOIN appvisitasprogramadas vp ON ha.id_vp = vp.id_vp
            ORDER BY ha.fecha_ha DESC
            LIMIT :lim
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $logs = array_map(function($r) {
            $userName = trim("{$r['nombre_u']} {$r['apaterno_u']} {$r['amaterno_u']}");
            $name = ($r['tipo_ha'] === 'visita') ? ($r['nombre_vp'] ?: 'Visitante') : ($userName ?: 'Residente');
            $unit = trim("{$r['calle_u']} {$r['numero_u']}") ?: 'General';
            return [
                'id' => (int)$r['id_ha'],
                'type' => $r['tipo_ha'],
                'name' => $name,
                'unit' => $unit,
                'vehiclePlate' => $r['observacionguardia_vp'] ?? '',
                'direction' => $r['movimiento_ha'],
                'result' => $r['resultado_ha'],
                'reason' => $r['motivo_ha'],
                'timestamp' => $r['fecha_ha'],
                'guardId' => $r['id_uguardia_ha']
            ];
        }, $rows);

        Response::success(['logs' => $logs]);
        break;

    case 'all_visits':
        if (!$pdo) {
            Response::error('Base de datos no disponible.', 503);
        }
        $sql = "
            SELECT 
                vp.*,
                u.nombre_u,
                u.apaterno_u,
                u.amaterno_u,
                u.calle_u,
                u.numero_u
            FROM appvisitasprogramadas vp
            LEFT JOIN usuarios u ON vp.id_u = u.id_u
            ORDER BY vp.id_vp DESC
            LIMIT 100
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $visits = array_map(function($r) {
            $hostName = trim("{$r['nombre_u']} {$r['apaterno_u']} {$r['amaterno_u']}") ?: 'Residente';
            $hostUnit = trim("{$r['calle_u']} {$r['numero_u']}") ?: 'Sin Asignar';
            return [
                'id' => (int)$r['id_vp'],
                'visitorName' => $r['nombre_vp'],
                'visitorPhone' => $r['telefono_vp'],
                'hostName' => $hostName,
                'hostUnit' => $hostUnit,
                'visitType' => $r['tipovisita_vp'],
                'validFrom' => "{$r['fechainicial_vp']} {$r['horainicial_vp']}",
                'validUntil' => "{$r['fechafinal_vp']} {$r['horafinal_vp']}",
                'vehiclePlate' => $r['observacionguardia_vp'],
                'qrCode' => $r['tokenqr_vp'],
                'reason' => $r['asunto_vp'],
                'status' => $r['estado_vp']
            ];
        }, $rows);

        Response::success(['visits' => $visits]);
        break;

    case 'enrollment_codes':
        if (!$pdo) {
            Response::error('Base de datos no disponible.', 503);
        }

        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT * FROM appinvitaciones ORDER BY id_inv DESC LIMIT 50");
            $stmt->execute();
            $codes = $stmt->fetchAll();
            Response::success(['codes' => $codes]);
        } elseif ($method === 'POST') {
            $input = getJsonInput();
            $prefix = ($input['type'] ?? 'residente') === 'administrador' ? 'ADM-' : 'INV-';
            $codeStr = $prefix . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
            $maxUses = (int)($input['maxUses'] ?? 10);
            $days = (int)($input['days'] ?? 30);
            $expiresAt = date('Y-m-d H:i:s', strtotime("+{$days} days"));

            $stmt = $pdo->prepare("
                INSERT INTO appinvitaciones (
                    id_se, id_uc, tipo_inv, invitacion_inv,
                    usosmaximos_inv, usosactuales_inv, fechacreacion_inv, fechavencimiento_inv, estado_inv
                ) VALUES (
                    ?, ?, ?, ?,
                    ?, 0, NOW(), ?, 'activo'
                )
            ");
            $id_se = (int)($input['communityId'] ?? 2);
            $id_uc = (int)($input['adminId'] ?? 1652);
            $type = ($input['type'] ?? 'residente');

            $stmt->execute([$id_se, $id_uc, $type, $codeStr, $maxUses, $expiresAt]);

            Response::success([
                'id' => (int)$pdo->lastInsertId(),
                'code' => $codeStr,
                'expiresAt' => $expiresAt
            ], 'Código de enrolamiento generado');
        }
        break;

    case 'comunicados':
        if (!$pdo) {
            Response::error('Base de datos no disponible.', 503);
        }
        $stmt = $pdo->prepare("
            SELECT c.*, a.url_ad 
            FROM appcomunicados c 
            LEFT JOIN adjuntos a ON c.id_com = a.id_com 
            WHERE c.estado_com = 'activo' 
            ORDER BY c.fecha_com DESC
        ");
        $stmt->execute();
        $comunicados = $stmt->fetchAll();
        Response::success(['comunicados' => $comunicados]);
        break;

    case 'amenidades':
        if (!$pdo) {
            Response::error('Base de datos no disponible.', 503);
        }
        $stmt = $pdo->prepare("SELECT * FROM apprecursos WHERE activo_rec = 'y' ORDER BY nombre_rec ASC");
        $stmt->execute();
        $amenidades = $stmt->fetchAll();
        Response::success(['amenidades' => $amenidades]);
        break;

    case 'cuotas':
        if (!$pdo) {
            Response::error('Base de datos no disponible.', 503);
        }

        if ($method === 'GET') {
            $id_se = isset($_GET['id_se']) ? (int)$_GET['id_se'] : 2;
            $id_u = isset($_GET['id_u']) ? (int)$_GET['id_u'] : 0;
            $status = isset($_GET['status']) ? trim($_GET['status']) : '';

            $sql = "
                SELECT 
                    c.*,
                    u.nombre_u,
                    u.apaterno_u,
                    u.amaterno_u,
                    u.calle_u,
                    u.numero_u,
                    u.numerointerior_u,
                    u.id_eu,
                    u.qractivo_u
                FROM appcuotas c
                INNER JOIN usuarios u ON c.id_u = u.id_u
                WHERE c.id_se = :id_se
            ";
            $params = [':id_se' => $id_se];

            if ($id_u > 0) {
                $sql .= " AND c.id_u = :id_u";
                $params[':id_u'] = $id_u;
            }
            if (!empty($status) && $status !== 'todas') {
                $sql .= " AND c.estado_cuo = :status";
                $params[':status'] = $status;
            }

            $sql .= " ORDER BY c.fechavencimiento_cuo DESC, c.id_cuo DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            $cuotas = array_map(function($r) {
                $fullName = trim("{$r['nombre_u']} {$r['apaterno_u']} {$r['amaterno_u']}");
                $unit = trim("{$r['calle_u']} {$r['numero_u']} {$r['numerointerior_u']}") ?: 'Lote Condominal';
                return [
                    'id' => (int)$r['id_cuo'],
                    'communityId' => (int)$r['id_se'],
                    'residentId' => (int)$r['id_u'],
                    'residentName' => $fullName,
                    'unit' => $unit,
                    'concept' => $r['concepto_cuo'],
                    'type' => $r['tipo_cuo'],
                    'amount' => (float)$r['monto_cuo'],
                    'dueDate' => $r['fechavencimiento_cuo'],
                    'status' => $r['estado_cuo'],
                    'createdAt' => $r['fechageneracion_cuo'],
                    'residentAccessStatus' => ((int)$r['id_eu'] === 1 && $r['qractivo_u'] === 'y') ? 'ACTIVO' : 'SUSPENDIDO'
                ];
            }, $rows);

            Response::success(['cuotas' => $cuotas]);
        } elseif ($method === 'POST') {
            $input = getJsonInput();
            $id_se = (int)($input['communityId'] ?? 2);
            $id_u = (int)($input['residentId'] ?? 0);
            $concept = trim($input['concept'] ?? 'Cuota de Mantenimiento');
            $type = trim($input['type'] ?? 'ordinaria');
            $amount = (float)($input['amount'] ?? 0.00);
            $dueDate = trim($input['dueDate'] ?? date('Y-m-d', strtotime('+10 days')));

            if ($id_u <= 0 || $amount <= 0) {
                Response::error('Datos de cuota incompletos o monto inválido.', 400);
            }

            $stmt = $pdo->prepare("
                INSERT INTO appcuotas (id_se, id_u, concepto_cuo, tipo_cuo, monto_cuo, fechavencimiento_cuo, estado_cuo, fechageneracion_cuo)
                VALUES (?, ?, ?, ?, ?, ?, 'pendiente', NOW())
            ");
            $stmt->execute([$id_se, $id_u, $concept, $type, $amount, $dueDate]);

            Response::success([
                'id' => (int)$pdo->lastInsertId(),
                'concept' => $concept,
                'amount' => $amount,
                'dueDate' => $dueDate
            ], 'Cuota generada exitosamente');
        }
        break;

    case 'pagos':
        if (!$pdo) {
            Response::error('Base de datos no disponible.', 503);
        }
        $id_se = isset($_GET['id_se']) ? (int)$_GET['id_se'] : 2;
        $id_u = isset($_GET['id_u']) ? (int)$_GET['id_u'] : 0;

        $sql = "
            SELECT 
                p.*,
                c.concepto_cuo,
                c.tipo_cuo,
                u.nombre_u,
                u.apaterno_u,
                u.amaterno_u,
                u.calle_u,
                u.numero_u,
                admin.nombre_u AS admin_nombre,
                admin.apaterno_u AS admin_apaterno
            FROM apppagos p
            INNER JOIN appcuotas c ON p.id_cuo = c.id_cuo
            INNER JOIN usuarios u ON p.id_u = u.id_u
            LEFT JOIN usuarios admin ON p.id_ua = admin.id_u
            WHERE c.id_se = :id_se
        ";
        $params = [':id_se' => $id_se];
        if ($id_u > 0) {
            $sql .= " AND p.id_u = :id_u";
            $params[':id_u'] = $id_u;
        }
        $sql .= " ORDER BY p.fechapago_pag DESC, p.id_pag DESC LIMIT 100";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $pagos = array_map(function($r) {
            $residentName = trim("{$r['nombre_u']} {$r['apaterno_u']} {$r['amaterno_u']}");
            $adminName = trim("{$r['admin_nombre']} {$r['admin_apaterno']}") ?: 'Administración Central';
            $unit = trim("{$r['calle_u']} {$r['numero_u']}") ?: 'Condominio';
            return [
                'id' => (int)$r['id_pag'],
                'cuotaId' => (int)$r['id_cuo'],
                'folio' => $r['folio_pag'],
                'residentId' => (int)$r['id_u'],
                'residentName' => $residentName,
                'unit' => $unit,
                'concept' => $r['concepto_cuo'],
                'type' => $r['tipo_cuo'],
                'amount' => (float)$r['monto_pag'],
                'paymentMethod' => $r['metodo_pag'],
                'reference' => $r['referencia_pag'],
                'receiptUrl' => $r['comprobante_url_pag'],
                'paidAt' => $r['fechapago_pag'],
                'status' => $r['estado_pag'],
                'adminName' => $adminName,
                'notes' => $r['notas_pag']
            ];
        }, $rows);

        Response::success(['pagos' => $pagos]);
        break;

    case 'register_payment':
        if ($method !== 'POST') Response::error('Method Not Allowed', 405);
        if (!$pdo) Response::error('Base de datos no disponible.', 503);

        $input = getJsonInput();
        $id_cuo = (int)($input['cuotaId'] ?? 0);
        $monto = (float)($input['amount'] ?? 0.00);
        $metodo = trim($input['method'] ?? 'transferencia');
        $referencia = trim($input['reference'] ?? 'SPEI-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6)));
        $notas = trim($input['notes'] ?? 'Pago verificado por administración');
        $id_ua = (int)($input['adminId'] ?? 1652);

        if ($id_cuo <= 0 || $monto <= 0) {
            Response::error('Parámetros de cuota o monto inválidos.', 400);
        }

        // Consultar la cuota
        $stmtCuo = $pdo->prepare("SELECT * FROM appcuotas WHERE id_cuo = ? LIMIT 1");
        $stmtCuo->execute([$id_cuo]);
        $cuota = $stmtCuo->fetch();

        if (!$cuota) {
            Response::error('La cuota especificada no existe.', 404);
        }

        $id_u = (int)$cuota['id_u'];
        $folio = 'REC-' . date('Y') . '-' . sprintf('%05d', rand(100, 99999));

        // Iniciar transacción
        $pdo->beginTransaction();
        try {
            // 1. Insertar el pago
            $stmtIns = $pdo->prepare("
                INSERT INTO apppagos (
                    id_cuo, id_u, id_ua, folio_pag, monto_pag, metodo_pag,
                    referencia_pag, comprobante_url_pag, fechapago_pag, estado_pag, notas_pag, fecharegistro_pag
                ) VALUES (
                    ?, ?, ?, ?, ?, ?,
                    ?, '', NOW(), 'verificado', ?, NOW()
                )
            ");
            $stmtIns->execute([$id_cuo, $id_u, $id_ua, $folio, $monto, $metodo, $referencia, $notas]);
            $id_pag = (int)$pdo->lastInsertId();

            // 2. Marcar la cuota como pagada
            $stmtUpd = $pdo->prepare("UPDATE appcuotas SET estado_cuo = 'pagada' WHERE id_cuo = ?");
            $stmtUpd->execute([$id_cuo]);

            // 3. Verificar si el residente aún tiene cuotas vencidas
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) AS total_vencidas FROM appcuotas WHERE id_u = ? AND estado_cuo = 'vencida'");
            $stmtCheck->execute([$id_u]);
            $overdueCount = (int)$stmtCheck->fetchColumn();

            $accessReactivated = false;
            // Si ya no tiene cuotas vencidas, reactivar automáticamente su acceso y QR
            if ($overdueCount === 0) {
                $stmtReactivate = $pdo->prepare("UPDATE usuarios SET id_eu = 1, qractivo_u = 'y' WHERE id_u = ?");
                $stmtReactivate->execute([$id_u]);
                $accessReactivated = true;
            }

            $pdo->commit();

            Response::success([
                'paymentId' => $id_pag,
                'folio' => $folio,
                'cuotaId' => $id_cuo,
                'amount' => $monto,
                'overdueRemaining' => $overdueCount,
                'accessReactivated' => $accessReactivated
            ], 'Pago registrado correctamente.');
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Error al procesar el pago: ' . $e->getMessage(), 500);
        }
        break;

    case 'finance_metrics':
        if (!$pdo) {
            Response::error('Base de datos no disponible.', 503);
        }
        $id_se = isset($_GET['id_se']) ? (int)$_GET['id_se'] : 2;

        // Total cobrado en el mes
        $stmtRec = $pdo->prepare("
            SELECT COALESCE(SUM(p.monto_pag), 0) AS total_mes
            FROM apppagos p
            INNER JOIN appcuotas c ON p.id_cuo = c.id_cuo
            WHERE c.id_se = ? AND MONTH(p.fechapago_pag) = MONTH(CURRENT_DATE()) AND YEAR(p.fechapago_pag) = YEAR(CURRENT_DATE())
        ");
        $stmtRec->execute([$id_se]);
        $totalMes = (float)$stmtRec->fetchColumn();

        // Cartera vencida (adeudos pendientes y vencidos)
        $stmtVenc = $pdo->prepare("
            SELECT COALESCE(SUM(monto_cuo), 0) AS cartera_vencida, COUNT(*) AS count_vencidas
            FROM appcuotas
            WHERE id_se = ? AND estado_cuo = 'vencida'
        ");
        $stmtVenc->execute([$id_se]);
        $vencRow = $stmtVenc->fetch();
        $carteraVencida = (float)($vencRow['cartera_vencida'] ?? 0);
        $totalVencidas = (int)($vencRow['count_vencidas'] ?? 0);

        // Cuotas pendientes de pago este mes
        $stmtPend = $pdo->prepare("
            SELECT COALESCE(SUM(monto_cuo), 0) AS total_pendiente, COUNT(*) AS count_pendientes
            FROM appcuotas
            WHERE id_se = ? AND estado_cuo = 'pendiente'
        ");
        $stmtPend->execute([$id_se]);
        $pendRow = $stmtPend->fetch();
        $totalPendiente = (float)($pendRow['total_pendiente'] ?? 0);
        $countPendientes = (int)($pendRow['count_pendientes'] ?? 0);

        // Morosidad y porcentaje
        $totalEmitido = $totalMes + $carteraVencida + $totalPendiente;
        $tasaCobranza = $totalEmitido > 0 ? round(($totalMes / $totalEmitido) * 100, 1) : 100.0;

        Response::success([
            'totalCollectedMonth' => $totalMes,
            'overdueDebt' => $carteraVencida,
            'overdueCount' => $totalVencidas,
            'pendingAmount' => $totalPendiente,
            'pendingCount' => $countPendientes,
            'collectionRate' => $tasaCobranza
        ]);
        break;

    default:
        Response::error('Acción no reconocida en la API.', 404);
        break;
}
