<?php
// backend/models/AccessLogModel.php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

class AccessLogModel extends BaseModel {
    /**
     * Obtiene el historial de accesos
     */
    public function getLogs(int $limit = 100): array {
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
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        return array_map(function(array $r) {
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
    }
}

