<?php
// backend/models/BaseModel.php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

abstract class BaseModel {
    protected ?PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getConnection();
    }

    public function isConnected(): bool {
        return $this->pdo !== null;
    }

    protected function requireConnection(): void {
        if (!$this->isConnected()) {
            throw new RuntimeException('Base de datos no disponible.');
        }
    }
}

