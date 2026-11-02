<?php
// backend/models/ComunicadoModel.php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

class ComunicadoModel extends BaseModel {
    /**
     * Obtiene comunicados activos con sus adjuntos
     */
    public function getActive(): array {
        $stmt = $this->pdo->prepare("
            SELECT c.*, CONCAT(COALESCE(a.directorio_ad, ''), COALESCE(a.archivo_ad, '')) AS url_ad 
            FROM appcomunicados c 
            LEFT JOIN adjuntos a ON c.id_com = a.id_com 
            WHERE c.estado_com = 'activo' 
            ORDER BY c.fecha_com DESC
        ");
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
