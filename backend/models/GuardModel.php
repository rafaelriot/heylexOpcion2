<?php
// backend/models/GuardModel.php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

class GuardModel extends BaseModel {

    /**
     * Valida un pase QR en tiempo real para caseta (Residente o Visitante)
     */
    public function verifyPass(string $payload, int $id_se): array {
        $payload = trim($payload);

        // 1. Evaluar si es pase de Residente (HLX-RES|...) o token en usuarios
        if (str_starts_with($payload, 'HLX-RES|') || str_starts_with($payload, 'HLX-RES-')) {
            return $this->verifyResidentPass($payload, $id_se);
        }

        // 2. Evaluar si es pase de Visitante (HLX-VISIT-...)
        if (str_starts_with($payload, 'HLX-VISIT-') || str_starts_with($payload, 'HLX-VISIT|')) {
            return $this->verifyVisitorPass($payload, $id_se);
        }

        // 3. Búsqueda por tokenqr_u directo en usuarios
        $stmtUser = $this->pdo->prepare("SELECT * FROM usuarios WHERE tokenqr_u = ? LIMIT 1");
        $stmtUser->execute([$payload]);
        $user = $stmtUser->fetch();
        if ($user) {
            return $this->evaluateResidentAccess($user, $id_se);
        }

        // 4. Búsqueda por token en appvisitasprogramadas
        $stmtVisit = $this->pdo->prepare("SELECT * FROM appvisitasprogramadas WHERE token_vp = ? LIMIT 1");
        $stmtVisit->execute([$payload]);
        $visit = $stmtVisit->fetch();
        if ($visit) {
            return $this->evaluateVisitorAccess($visit, $id_se);
        }

        return [
            'ok' => true,
            'type' => 'DESCONOCIDO',
            'permitted' => false,
            'reason' => 'Código QR no reconocido en el sistema.',
            'payload' => $payload
        ];
    }

    /**
     * Evalúa credencial QR de un residente
     */
    private function verifyResidentPass(string $payload, int $id_se): array {
        $parts = explode('|', $payload);
        $residentId = isset($parts[1]) ? (int)$parts[1] : 0;

        if ($residentId > 0) {
            $stmt = $this->pdo->prepare("SELECT * FROM usuarios WHERE id_u = ? LIMIT 1");
            $stmt->execute([$residentId]);
            $user = $stmt->fetch();
            if ($user) {
                return $this->evaluateResidentAccess($user, $id_se);
            }
        }

        // Si no vino por ID directo, buscar por coincidencia en tokenqr_u
        $stmtToken = $this->pdo->prepare("SELECT * FROM usuarios WHERE tokenqr_u = ? OR ? LIKE CONCAT('%', tokenqr_u, '%') LIMIT 1");
        $stmtToken->execute([$payload, $payload]);
        $user = $stmtToken->fetch();
        if ($user) {
            return $this->evaluateResidentAccess($user, $id_se);
        }

        return [
            'ok' => true,
            'type' => 'RESIDENTE',
            'permitted' => false,
            'reason' => 'Credencial de residente no encontrada.',
            'payload' => $payload
        ];
    }

    /**
     * Valida estatus de cuotas y licencias del residente
     */
    private function evaluateResidentAccess(array $user, int $id_se): array {
        $id_u = (int)$user['id_u'];
        $fullName = trim("{$user['nombre_u']} {$user['apaterno_u']} {$user['amaterno_u']}");
        $unit = trim("{$user['calle_u']} {$user['numero_u']}") ?: 'General';
        $zone = $user['colonia_u'] ?: 'Residencial';

        // 1. Verificar si tiene cuotas vencidas (mora)
        $stmtCuotas = $this->pdo->prepare("SELECT COUNT(*) AS total_vencidas, SUM(monto_cuo) AS deuda_total FROM appcuotas WHERE id_u = ? AND estado_cuo = 'vencida'");
        $stmtCuotas->execute([$id_u]);
        $cuotas = $stmtCuotas->fetch();
        $totalVencidas = (int)($cuotas['total_vencidas'] ?? 0);
        $deudaTotal = (float)($cuotas['deuda_total'] ?? 0.00);

        // 2. Verificar estatus de usuario y QR
        $isUserSuspended = ((int)$user['id_eu'] === 3 || $user['qractivo_u'] === 'n' || $totalVencidas > 0);

        if ($isUserSuspended) {
            return [
                'ok' => true,
                'type' => 'RESIDENTE',
                'permitted' => false,
                'residentId' => $id_u,
                'name' => $fullName,
                'unit' => $unit,
                'zone' => $zone,
                'phone' => $user['telefonomovil_u'] ?: $user['telefonocasa_u'],
                'reason' => $totalVencidas > 0 
                    ? "Acceso Suspendido: Cuenta con {$totalVencidas} cuota(s) vencida(s) [\${$deudaTotal} MXN]." 
                    : "Acceso Suspendido por Administración.",
                'debtAmount' => $deudaTotal,
                'overdueCount' => $totalVencidas
            ];
        }

        return [
            'ok' => true,
            'type' => 'RESIDENTE',
            'permitted' => true,
            'residentId' => $id_u,
            'name' => $fullName,
            'unit' => $unit,
            'zone' => $zone,
            'phone' => $user['telefonomovil_u'] ?: $user['telefonocasa_u'],
            'reason' => 'Residente Al Corriente. Acceso Autorizado.',
            'debtAmount' => 0.00,
            'overdueCount' => 0
        ];
    }

    /**
     * Evalúa pase de visita
     */
    private function verifyVisitorPass(string $payload, int $id_se): array {
        // Extraer código después de HLX-VISIT-
        $cleanCode = trim(str_replace('HLX-VISIT-', '', $payload));

        $stmt = $this->pdo->prepare("
            SELECT 
                vp.*, 
                u.nombre_u, u.apaterno_u, u.amaterno_u, u.calle_u, u.numero_u, u.colonia_u, u.id_eu, u.qractivo_u
            FROM appvisitasprogramadas vp
            LEFT JOIN usuarios u ON vp.id_u = u.id_u
            WHERE vp.token_vp = :token OR vp.token_vp = :code
            LIMIT 1
        ");
        $stmt->execute([':token' => $payload, ':code' => $cleanCode]);
        $visit = $stmt->fetch();

        if (!$visit) {
            return [
                'ok' => true,
                'type' => 'VISITANTE',
                'permitted' => false,
                'reason' => 'El pase de visitante no existe o fue revocado.',
                'payload' => $payload
            ];
        }

        return $this->evaluateVisitorAccess($visit, $id_se);
    }

    /**
     * Valida estatus, vigencia y anfitrión de la visita
     */
    private function evaluateVisitorAccess(array $visit, int $id_se): array {
        $visitId = (int)$visit['id_vp'];
        $hostName = trim("{$visit['nombre_u']} {$visit['apaterno_u']} {$visit['amaterno_u']}") ?: 'Residente';
        $hostUnit = trim("{$visit['calle_u']} {$visit['numero_u']}") ?: 'General';
        $hostZone = $visit['colonia_u'] ?: 'Privada';
        $visitorName = $visit['nombre_vp'] ?: 'Visitante';
        $plate = $visit['observacionguardia_vp'] ?: '';
        $estatus = strtolower(trim((string)$visit['estatus_vp']));

        $now = date('Y-m-d H:i:s');
        $validFrom = $visit['fechainicio_vp'];
        $validTo = $visit['fechafin_vp'];

        // 1. Validar si el anfitrión está suspendido
        $hostId = (int)$visit['id_u'];
        $stmtCuotas = $this->pdo->prepare("SELECT COUNT(*) FROM appcuotas WHERE id_u = ? AND estado_cuo = 'vencida'");
        $stmtCuotas->execute([$hostId]);
        $hostOverdue = (int)$stmtCuotas->fetchColumn();

        if ($hostOverdue > 0 || (int)$visit['id_eu'] === 3) {
            return [
                'ok' => true,
                'type' => 'VISITANTE',
                'permitted' => false,
                'visitId' => $visitId,
                'visitorName' => $visitorName,
                'vehiclePlate' => $plate,
                'hostName' => $hostName,
                'hostUnit' => $hostUnit,
                'reason' => "Acceso Denegado: El residente anfitrión ({$hostName}, {$hostUnit}) tiene cuotas vencidas pendientes."
            ];
        }

        // 2. Validar estatus
        if ($estatus === 'usada') {
            return [
                'ok' => true,
                'type' => 'VISITANTE',
                'permitted' => false,
                'visitId' => $visitId,
                'visitorName' => $visitorName,
                'vehiclePlate' => $plate,
                'hostName' => $hostName,
                'hostUnit' => $hostUnit,
                'reason' => 'Pase de un solo uso ya utilizado anteriormente.'
            ];
        }

        if ($estatus === 'cancelada') {
            return [
                'ok' => true,
                'type' => 'VISITANTE',
                'permitted' => false,
                'visitId' => $visitId,
                'visitorName' => $visitorName,
                'vehiclePlate' => $plate,
                'hostName' => $hostName,
                'hostUnit' => $hostUnit,
                'reason' => 'Pase cancelado por el residente anfitrión.'
            ];
        }

        // 3. Validar vigencia temporal
        if ($validTo && $now > $validTo) {
            return [
                'ok' => true,
                'type' => 'VISITANTE',
                'permitted' => false,
                'visitId' => $visitId,
                'visitorName' => $visitorName,
                'vehiclePlate' => $plate,
                'hostName' => $hostName,
                'hostUnit' => $hostUnit,
                'reason' => "Pase Expirado: Venció el " . date('d/m/Y H:i', strtotime($validTo))
            ];
        }

        return [
            'ok' => true,
            'type' => 'VISITANTE',
            'permitted' => true,
            'visitId' => $visitId,
            'visitorName' => $visitorName,
            'vehiclePlate' => $plate,
            'entryType' => ($visit['tipocruce_vp'] ?? 'vehicular') === 'peatonal' ? 'PEATONAL' : 'VEHICULAR',
            'hostName' => $hostName,
            'hostUnit' => $hostUnit,
            'hostZone' => $hostZone,
            'validTo' => $validTo,
            'notes' => $visit['motivo_vp'] ?? 'Visita autorizada',
            'reason' => 'Pase de Visitante Válido. Acceso Autorizado.'
        ];
    }

    /**
     * Registra un evento de cruce en apphistorialaccesos
     */
    public function recordAccess(array $data, int $id_se, int $guardId): array {
        $type = ($data['type'] === 'VISITANTE') ? 'visita' : 'residente';
        $result = ($data['result'] === 'PERMITTED') ? 'permitido' : 'denegado';
        $movement = (strtolower($data['direction'] ?? 'entrada') === 'salida') ? 'salida' : 'entrada';
        $reason = trim((string)($data['reason'] ?? 'Acceso verificado en caseta'));
        $residentId = (int)($data['residentId'] ?? 0);
        $visitId = (int)($data['visitId'] ?? 0);

        $sql = "
            INSERT INTO apphistorialaccesos (
                tipo_ha, id_se, id_ur, id_uguardia_ha, id_vp,
                resultado_ha, motivo_ha, movimiento_ha, fecha_ha, activo_ha
            ) VALUES (
                :tipo, :id_se, :id_ur, :id_ug, :id_vp,
                :resultado, :motivo, :movimiento, NOW(), 'y'
            )
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':tipo' => $type,
            ':id_se' => $id_se,
            ':id_ur' => $residentId,
            ':id_ug' => $guardId,
            ':id_vp' => $visitId,
            ':resultado' => $result,
            ':motivo' => $reason,
            ':movimiento' => $movement
        ]);
        $id_ha = (int)$this->pdo->lastInsertId();

        // Si fue una visita de uso único y fue permitida, marcar como usada
        if ($visitId > 0 && $result === 'permitido') {
            $stmtUpd = $this->pdo->prepare("UPDATE appvisitasprogramadas SET estatus_vp = 'usada' WHERE id_vp = ?");
            $stmtUpd->execute([$visitId]);
        }

        return [
            'ok' => true,
            'accessId' => $id_ha,
            'type' => $type,
            'result' => $result,
            'movement' => $movement,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Registro rápido de proveedores, servicios o paquetería (Amazon, Uber, etc.)
     */
    public function registerDelivery(array $data, int $id_se, int $guardId): array {
        $company = trim((string)($data['company'] ?? 'Paquetería'));
        $visitorName = trim((string)($data['visitorName'] ?? $company));
        $plate = strtoupper(trim((string)($data['vehiclePlate'] ?? '')));
        $unit = trim((string)($data['unit'] ?? 'General'));
        $notes = trim((string)($data['notes'] ?? "Entrega / Servicio para {$unit}"));

        // Buscar residente por lote si existe
        $stmtUser = $this->pdo->prepare("SELECT id_u FROM usuarios WHERE calle_u LIKE :u OR numero_u LIKE :u LIMIT 1");
        $stmtUser->execute([':u' => "%{$unit}%"]);
        $residentId = (int)($stmtUser->fetchColumn() ?: 0);

        // 1. Insertar visita exprés
        $token = 'HLX-DELIV-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        $stmtVisit = $this->pdo->prepare("
            INSERT INTO appvisitasprogramadas (
                id_u, id_se, nombre_vp, token_vp, tipocruce_vp,
                observacionguardia_vp, fechainicio_vp, fechafin_vp, estatus_vp, fecharegistro_vp, motivo_vp
            ) VALUES (
                :id_u, :id_se, :nombre, :token, 'vehicular',
                :placa, NOW(), DATE_ADD(NOW(), INTERVAL 4 HOUR), 'usada', NOW(), :motivo
            )
        ");
        $stmtVisit->execute([
            ':id_u' => $residentId,
            ':id_se' => $id_se,
            ':nombre' => "{$company} - {$visitorName}",
            ':token' => $token,
            ':placa' => $plate,
            ':motivo' => $notes
        ]);
        $visitId = (int)$this->pdo->lastInsertId();

        // 2. Registrar cruce en bitácora
        return $this->recordAccess([
            'type' => 'VISITANTE',
            'residentId' => $residentId,
            'visitId' => $visitId,
            'direction' => 'ENTRADA',
            'result' => 'PERMITTED',
            'reason' => "Proveedor / Paquetería: {$company} a {$unit} (Placas: {$plate})"
        ], $id_se, $guardId);
    }

    /**
     * Consultar visitas activas y esperadas hoy para el buscador del guardia
     */
    public function getTodayVisits(int $id_se, string $search = ''): array {
        $sql = "
            SELECT 
                vp.id_vp,
                vp.nombre_vp,
                vp.token_vp,
                vp.tipocruce_vp,
                vp.observacionguardia_vp,
                vp.fechainicio_vp,
                vp.fechafin_vp,
                vp.estatus_vp,
                vp.motivo_vp,
                u.nombre_u,
                u.apaterno_u,
                u.amaterno_u,
                u.calle_u,
                u.numero_u,
                u.id_eu
            FROM appvisitasprogramadas vp
            LEFT JOIN usuarios u ON vp.id_u = u.id_u
            WHERE vp.id_se = :id_se 
              AND (vp.estatus_vp = 'activa' OR DATE(vp.fechainicio_vp) = CURDATE())
        ";

        if ($search !== '') {
            $sql .= " AND (vp.nombre_vp LIKE :s OR vp.observacionguardia_vp LIKE :s OR u.calle_u LIKE :s OR u.numero_u LIKE :s)";
        }

        $sql .= " ORDER BY vp.fechainicio_vp DESC LIMIT 50";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':id_se', $id_se, PDO::PARAM_INT);
        if ($search !== '') {
            $stmt->bindValue(':s', "%{$search}%", PDO::PARAM_STR);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll();

        return array_map(function(array $r) {
            $hostName = trim("{$r['nombre_u']} {$r['apaterno_u']} {$r['amaterno_u']}") ?: 'Residente';
            $hostUnit = trim("{$r['calle_u']} {$r['numero_u']}") ?: 'General';
            return [
                'id' => (int)$r['id_vp'],
                'visitorName' => $r['nombre_vp'] ?: 'Visitante',
                'qrCode' => $r['token_vp'] ?: '',
                'entryType' => ($r['tipocruce_vp'] ?? 'vehicular') === 'peatonal' ? 'PEATONAL' : 'VEHICULAR',
                'vehiclePlate' => $r['observacionguardia_vp'] ?? '',
                'validFrom' => $r['fechainicio_vp'],
                'validTo' => $r['fechafin_vp'],
                'status' => $r['estatus_vp'],
                'notes' => $r['motivo_vp'] ?? '',
                'hostName' => $hostName,
                'hostUnit' => $hostUnit
            ];
        }, $rows);
    }
}
