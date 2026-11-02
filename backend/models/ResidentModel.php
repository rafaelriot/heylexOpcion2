<?php
// backend/models/ResidentModel.php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

class ResidentModel extends BaseModel {
    /**
     * Obtiene el listado de residentes de una comunidad con cálculo de adeudos y meses vencidos
     */
    public function getResidents(int $id_se = 2, string $filter = 'ALL', string $search = ''): array {
        $filter = strtoupper(trim($filter));
        $search = trim($search);

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

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return array_map(function(array $r) use ($id_se) {
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
    }

    /**
     * Actualiza el estatus de un residente (ACTIVE / SUSPENDED)
     */
    public function updateStatus(int $residentId, string $status): bool {
        $id_eu = ($status === 'ACTIVE') ? 1 : 3;
        $qractivo = ($status === 'ACTIVE') ? 'y' : 'n';

        $stmt = $this->pdo->prepare("UPDATE usuarios SET id_eu = ?, qractivo_u = ? WHERE id_u = ?");
        return $stmt->execute([$id_eu, $qractivo, $residentId]);
    }
}
