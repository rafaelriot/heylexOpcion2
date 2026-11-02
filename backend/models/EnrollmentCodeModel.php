<?php
// backend/models/EnrollmentCodeModel.php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

class EnrollmentCodeModel extends BaseModel {
    /**
     * Obtiene códigos de enrolamiento generados
     */
    public function getCodes(int $limit = 50): array {
        $stmt = $this->pdo->prepare("SELECT * FROM appinvitaciones ORDER BY id_inv DESC LIMIT :lim");
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Genera un nuevo código de enrolamiento
     */
    public function createCode(int $id_se, int $id_uc, string $type = 'residente', int $maxUses = 10, int $days = 30): array {
        $prefix = ($type === 'administrador') ? 'ADM-' : 'INV-';
        $codeStr = $prefix . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$days} days"));

        $stmt = $this->pdo->prepare("
            INSERT INTO appinvitaciones (
                id_se, id_uc, tipo_inv, invitacion_inv,
                usosmaximos_inv, usosactuales_inv, fechacreacion_inv, fechavencimiento_inv, estado_inv
            ) VALUES (
                ?, ?, ?, ?,
                ?, 0, NOW(), ?, 'activo'
            )
        ");
        $stmt->execute([$id_se, $id_uc, $type, $codeStr, $maxUses, $expiresAt]);

        return [
            'id' => (int)$this->pdo->lastInsertId(),
            'code' => $codeStr,
            'expiresAt' => $expiresAt
        ];
    }
}

