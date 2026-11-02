<?php
// backend/models/AmenidadModel.php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

class AmenidadModel extends BaseModel {
    /**
     * Obtiene recursos o amenidades activas
     */
    public function getActive(): array {
        $stmt = $this->pdo->prepare("SELECT * FROM apprecursos WHERE activo_rec = 'y' ORDER BY nombre_rec ASC");
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
