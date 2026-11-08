<?php
// backend/models/UserModel.php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

class UserModel extends BaseModel {
    public function findByEmail(string $email): ?array {
        $this->requireConnection();
        $stmt = $this->pdo->prepare("SELECT * FROM usuarios WHERE email_u = ? AND activo_u = 'y' LIMIT 1");
        $stmt->execute([trim($email)]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function findById(int $id): ?array {
        $this->requireConnection();
        $stmt = $this->pdo->prepare("SELECT * FROM usuarios WHERE id_u = ? AND activo_u = 'y' LIMIT 1");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function verifyAndRehashPassword(array $user, string $password): bool {
        $storedHash = (string)($user['pasword_u'] ?? '');
        $isBcrypt = password_verify($password, $storedHash);
        $isLegacyMd5 = (md5($password) === $storedHash);

        $isValid = $isBcrypt || $isLegacyMd5;
        if (!$isValid) {
            return false;
        }

        // Migración transparente a Bcrypt (Coste 12)
        if (!$isBcrypt && $isLegacyMd5) {
            try {
                $newHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
                $stmt = $this->pdo->prepare("UPDATE usuarios SET pasword_u = ? WHERE id_u = ?");
                $stmt->execute([$newHash, (int)$user['id_u']]);
            } catch (Exception $e) {
                // Silencioso para no detener el login
            }
        }

        return true;
    }

    /**
     * IDs de servicio (comunidades) a los que está asignado un usuario
     * @return int[]
     */
    public function getServiceIds(int $userId): array {
        $this->requireConnection();
        $stmt = $this->pdo->prepare("SELECT DISTINCT id_se FROM serviciosusuarios WHERE id_u = ?");
        $stmt->execute([$userId]);
        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public function getAssignment(int $userId): array {
        $this->requireConnection();
        $stmt = $this->pdo->prepare("
            SELECT su.id_se, s.nombre_se, s.direccion_se, s.telefono_se
            FROM serviciosusuarios su
            LEFT JOIN servicios s ON su.id_se = s.id_se
            WHERE su.id_u = ?
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        return [
            'id_se' => (int)($row['id_se'] ?? 2),
            'communityName' => $row['nombre_se'] ?? 'Residencial Cumbres Del Ángel',
            'communityAddress' => $row['direccion_se'] ?? 'Av. Universidad 402, Villahermosa, Tabasco',
            'phone' => $row['telefono_se'] ?? '+52 993 378 4115'
        ];
    }

    public function getMembershipDetails(int $userId, int $idSe, array $user): array {
        $this->requireConnection();
        // Buscar licencia activa en applicencias
        $stmtLic = $this->pdo->prepare("SELECT * FROM applicencias WHERE id_se = ? AND activo_lic = 'y' ORDER BY id_lic DESC LIMIT 1");
        $stmtLic->execute([$idSe]);
        $lic = $stmtLic->fetch();

        // Calcular adeudo vencido
        $stmtDebt = $this->pdo->prepare("SELECT COALESCE(SUM(monto_cuo), 0) FROM appcuotas WHERE id_u = ? AND estado_cuo = 'vencida'");
        $stmtDebt->execute([$userId]);
        $debt = (float)$stmtDebt->fetchColumn();

        $isSuspended = ($user['id_eu'] == 3 || $user['qractivo_u'] === 'n' || $debt > 0);

        return [
            'status' => $isSuspended ? 'SUSPENDED' : 'ACTIVE',
            'licensePlan' => $lic['tipo_lic'] ?? 'Plan Premium Residencial 2026',
            'validUntil' => (!empty($lic['fechavencimiento_lic']) && $lic['fechavencimiento_lic'] !== '0000-00-00') ? $lic['fechavencimiento_lic'] : '2026-12-31',
            'canGenerateOwnQr' => ($user['qractivo_u'] === 'y' && !$isSuspended),
            'canInviteVisitors' => ($user['activo_u'] === 'y' && !$isSuspended),
            'suspensionReason' => $isSuspended ? 'Acceso suspendido por mora administrativa.' : null,
            'debtAmount' => $debt
        ];
    }
}

