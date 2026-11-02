<?php
// backend/models/VisitModel.php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

class VisitModel extends BaseModel {
    /**
     * Obtiene visitas programadas creadas por residentes
     */
    public function getScheduledVisits(int $limit = 50): array {
        $stmt = $this->pdo->prepare("SELECT * FROM appvisitasprogramadas ORDER BY id_vp DESC LIMIT :lim");
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        return array_map(function(array $row) {
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
    }

    /**
     * Obtiene todas las visitas vinculadas con el anfitrión/residente
     */
    public function getAllVisits(int $limit = 100): array {
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
            LIMIT :lim
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        return array_map(function(array $r) {
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
    }

    /**
     * Crea una nueva visita programada
     */
    public function createVisit(array $data): array {
        $tokenQR = bin2hex(random_bytes(16));
        $stmt = $this->pdo->prepare("
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
        $id_se = (int)($data['communityId'] ?? 2);
        $id_u = (int)($data['residentId'] ?? 1665);
        $stmt->execute([
            $id_se,
            $id_u,
            $data['visitorName'] ?? 'Visitante',
            $data['reason'] ?? 'Visita Residencial',
            $data['visitorPhone'] ?? '',
            $data['visitType'] ?? 'unica',
            $data['validFromDate'] ?? date('Y-m-d'),
            $data['validFromTime'] ?? '00:00:00',
            $data['validUntilDate'] ?? date('Y-m-d', strtotime('+1 day')),
            $data['validUntilTime'] ?? '23:59:59',
            $tokenQR,
            $data['vehiclePlate'] ?? '',
            $data['visitorMessage'] ?? ''
        ]);

        return [
            'id' => (int)$this->pdo->lastInsertId(),
            'qrCode' => $tokenQR
        ];
    }
}
