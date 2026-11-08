<?php
// backend/models/FinanceModel.php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

class FinanceModel extends BaseModel {
    /**
     * Obtiene cuotas filtradas por comunidad, residente y estatus
     */
    public function getCuotas(int $id_se = 2, ?int $id_u = null, string $status = ''): array {
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

        if ($id_u !== null && $id_u > 0) {
            $sql .= " AND c.id_u = :id_u";
            $params[':id_u'] = $id_u;
        }

        if (!empty($status) && $status !== 'todas') {
            $sql .= " AND c.estado_cuo = :status";
            $params[':status'] = $status;
        }

        $sql .= " ORDER BY c.fechavencimiento_cuo DESC, c.id_cuo DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return array_map(function(array $r) {
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
    }

    /**
     * Crea una nueva cuota para un residente
     */
    public function createCuota(int $id_se, int $id_u, string $concept, string $type, float $amount, string $dueDate): int {
        $stmt = $this->pdo->prepare("
            INSERT INTO appcuotas (id_se, id_u, concepto_cuo, tipo_cuo, monto_cuo, fechavencimiento_cuo, estado_cuo, fechageneracion_cuo)
            VALUES (?, ?, ?, ?, ?, ?, 'pendiente', NOW())
        ");
        $stmt->execute([$id_se, $id_u, $concept, $type, $amount, $dueDate]);
        return (int)$this->pdo->lastInsertId();
    }

    /**
     * Obtiene el listado de pagos registrados
     */
    public function getPagos(int $id_se = 2, ?int $id_u = null, int $limit = 100): array {
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

        if ($id_u !== null && $id_u > 0) {
            $sql .= " AND p.id_u = :id_u";
            $params[':id_u'] = $id_u;
        }

        $sql .= " ORDER BY p.fechapago_pag DESC, p.id_pag DESC LIMIT :lim";
        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        return array_map(function(array $r) {
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
    }

    /**
     * Obtiene una cuota por su ID (o null si no existe)
     */
    public function getCuotaById(int $id_cuo): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM appcuotas WHERE id_cuo = ? LIMIT 1");
        $stmt->execute([$id_cuo]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Registra un pago verificando cuota y reactivando accesos si no quedan adeudos
     */
    public function registerPayment(int $id_cuo, float $monto, string $metodo, string $referencia, string $notas, int $id_ua): array {
        // Consultar cuota
        $stmtCuo = $this->pdo->prepare("SELECT * FROM appcuotas WHERE id_cuo = ? LIMIT 1");
        $stmtCuo->execute([$id_cuo]);
        $cuota = $stmtCuo->fetch();

        if (!$cuota) {
            throw new InvalidArgumentException('La cuota especificada no existe.');
        }

        $id_u = (int)$cuota['id_u'];
        $folio = 'REC-' . date('Y') . '-' . sprintf('%05d', rand(100, 99999));

        $this->pdo->beginTransaction();
        try {
            // 1. Insertar el pago
            $stmtIns = $this->pdo->prepare("
                INSERT INTO apppagos (
                    id_cuo, id_u, id_ua, folio_pag, monto_pag, metodo_pag,
                    referencia_pag, comprobante_url_pag, fechapago_pag, estado_pag, notas_pag, fecharegistro_pag
                ) VALUES (
                    ?, ?, ?, ?, ?, ?,
                    ?, '', NOW(), 'verificado', ?, NOW()
                )
            ");
            $stmtIns->execute([$id_cuo, $id_u, $id_ua, $folio, $monto, $metodo, $referencia, $notas]);
            $id_pag = (int)$this->pdo->lastInsertId();

            // 2. Marcar cuota como pagada
            $stmtUpd = $this->pdo->prepare("UPDATE appcuotas SET estado_cuo = 'pagada' WHERE id_cuo = ?");
            $stmtUpd->execute([$id_cuo]);

            // 3. Verificar si el residente aún tiene cuotas vencidas
            $stmtCheck = $this->pdo->prepare("SELECT COUNT(*) AS total_vencidas FROM appcuotas WHERE id_u = ? AND estado_cuo = 'vencida'");
            $stmtCheck->execute([$id_u]);
            $overdueCount = (int)$stmtCheck->fetchColumn();

            $accessReactivated = false;
            // Si ya no tiene vencidas, reactivar acceso automáticamente
            if ($overdueCount === 0) {
                $stmtReactivate = $this->pdo->prepare("UPDATE usuarios SET id_eu = 1, qractivo_u = 'y' WHERE id_u = ?");
                $stmtReactivate->execute([$id_u]);
                $accessReactivated = true;
            }

            $this->pdo->commit();

            return [
                'paymentId' => $id_pag,
                'folio' => $folio,
                'cuotaId' => $id_cuo,
                'residentId' => $id_u,
                'amount' => $monto,
                'overdueRemaining' => $overdueCount,
                'accessReactivated' => $accessReactivated
            ];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Calcula métricas financieras consolidadas (ingresos del mes, cartera vencida, tasa cobranza)
     */
    public function getMetrics(int $id_se = 2): array {
        // Total cobrado en el mes
        $stmtRec = $this->pdo->prepare("
            SELECT COALESCE(SUM(p.monto_pag), 0) AS total_mes
            FROM apppagos p
            INNER JOIN appcuotas c ON p.id_cuo = c.id_cuo
            WHERE c.id_se = ? AND MONTH(p.fechapago_pag) = MONTH(CURRENT_DATE()) AND YEAR(p.fechapago_pag) = YEAR(CURRENT_DATE())
        ");
        $stmtRec->execute([$id_se]);
        $totalMes = (float)$stmtRec->fetchColumn();

        // Cartera vencida
        $stmtVenc = $this->pdo->prepare("
            SELECT COALESCE(SUM(monto_cuo), 0) AS cartera_vencida, COUNT(*) AS count_vencidas
            FROM appcuotas
            WHERE id_se = ? AND estado_cuo = 'vencida'
        ");
        $stmtVenc->execute([$id_se]);
        $vencRow = $stmtVenc->fetch();
        $carteraVencida = (float)($vencRow['cartera_vencida'] ?? 0);
        $totalVencidas = (int)($vencRow['count_vencidas'] ?? 0);

        // Pendientes
        $stmtPend = $this->pdo->prepare("
            SELECT COALESCE(SUM(monto_cuo), 0) AS total_pendiente, COUNT(*) AS count_pendientes
            FROM appcuotas
            WHERE id_se = ? AND estado_cuo = 'pendiente'
        ");
        $stmtPend->execute([$id_se]);
        $pendRow = $stmtPend->fetch();
        $totalPendiente = (float)($pendRow['total_pendiente'] ?? 0);
        $countPendientes = (int)($pendRow['count_pendientes'] ?? 0);

        // Tasa de cobranza
        $totalEmitido = $totalMes + $carteraVencida + $totalPendiente;
        $tasaCobranza = $totalEmitido > 0 ? round(($totalMes / $totalEmitido) * 100, 1) : 100.0;

        return [
            'totalCollectedMonth' => $totalMes,
            'overdueDebt' => $carteraVencida,
            'overdueCount' => $totalVencidas,
            'pendingAmount' => $totalPendiente,
            'pendingCount' => $countPendientes,
            'collectionRate' => $tasaCobranza
        ];
    }
}

