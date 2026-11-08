<?php
// backend/models/AmenidadModel.php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

class AmenidadModel extends BaseModel {
    /**
     * Obtiene recursos o amenidades activas
     */
    public function getActive(int $id_se): array {
        $stmt = $this->pdo->prepare("SELECT * FROM apprecursos WHERE activo_rec = 'y' AND id_se = ? ORDER BY nombre_rec ASC");
        $stmt->execute([$id_se]);
        return $stmt->fetchAll();
    }
}

