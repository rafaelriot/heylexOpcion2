<?php
// backend/models/CommunityModel.php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

class CommunityModel extends BaseModel {
    /**
     * Asegura que existan las tablas y columnas necesarias para comunidades y datos bancarios
     */
    public function ensureSchema(): void {
        try {
            // Asegurar columnas bancarias en appcomunidades si no existen
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS appcomunidades (
                    id_com INT AUTO_INCREMENT PRIMARY KEY,
                    id_li INT DEFAULT 0,
                    codigo_li VARCHAR(255) DEFAULT '',
                    nombre_com VARCHAR(100) NOT NULL,
                    descripcion_com VARCHAR(255) DEFAULT '',
                    ubicacion_com VARCHAR(150) DEFAULT '',
                    tipo_com VARCHAR(50) DEFAULT 'fraccionamiento',
                    banco_com VARCHAR(100) DEFAULT 'BBVA México',
                    beneficiario_com VARCHAR(150) DEFAULT 'Fraccionamiento Residencial A.C.',
                    clabe_com VARCHAR(30) DEFAULT '012 790 00123456789 4',
                    whatsapp_com VARCHAR(25) DEFAULT '529933784115',
                    activo_com ENUM('y','n') DEFAULT 'y',
                    fechaalta_com DATETIME DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");

            // Si la tabla existía pero le faltaban columnas, agregarlas
            $cols = $this->pdo->query("DESCRIBE appcomunidades")->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array('banco_com', $cols)) {
                $this->pdo->exec("ALTER TABLE appcomunidades ADD COLUMN banco_com VARCHAR(100) DEFAULT 'BBVA México'");
            }
            if (!in_array('beneficiario_com', $cols)) {
                $this->pdo->exec("ALTER TABLE appcomunidades ADD COLUMN beneficiario_com VARCHAR(150) DEFAULT 'Fraccionamiento Residencial A.C.'");
            }
            if (!in_array('clabe_com', $cols)) {
                $this->pdo->exec("ALTER TABLE appcomunidades ADD COLUMN clabe_com VARCHAR(30) DEFAULT '012 790 00123456789 4'");
            }
            if (!in_array('whatsapp_com', $cols)) {
                $this->pdo->exec("ALTER TABLE appcomunidades ADD COLUMN whatsapp_com VARCHAR(25) DEFAULT '529933784115'");
            }

            // Insertar registro por defecto si está vacía
            $count = (int)$this->pdo->query("SELECT COUNT(*) FROM appcomunidades")->fetchColumn();
            if ($count === 0) {
                $this->pdo->exec("
                    INSERT INTO appcomunidades (id_com, nombre_com, descripcion_com, ubicacion_com, tipo_com, banco_com, beneficiario_com, clabe_com, whatsapp_com)
                    VALUES (2, 'Residencial Cumbres Del Ángel', 'Fraccionamiento Residencial Privado', 'Av. Universidad 402, Villahermosa, Tabasco', 'fraccionamiento', 'BBVA México', 'Fraccionamiento Cumbres A.C.', '012 790 00123456789 4', '529933784115')
                ");
            }
        } catch (Exception $e) {
            // Silencioso para fallback gracioso
        }
    }

    /**
     * Obtiene los datos completos de una comunidad por su ID de servicio
     */
    public function getCommunity(int $id_se = 2): array {
        $this->ensureSchema();

        $stmt = $this->pdo->prepare("SELECT * FROM appcomunidades WHERE id_com = ? OR id_li = ? LIMIT 1");
        $stmt->execute([$id_se, $id_se]);
        $row = $stmt->fetch();

        if ($row) {
            return [
                'id' => ($id_se === 2 ? 'com_001' : 'com_002'),
                'communityId' => (int)$row['id_com'],
                'name' => $row['nombre_com'],
                'description' => $row['descripcion_com'],
                'address' => $row['ubicacion_com'],
                'type' => $row['tipo_com'],
                'bank' => $row['banco_com'] ?: 'BBVA México',
                'beneficiary' => $row['beneficiario_com'] ?: 'Fraccionamiento Cumbres A.C.',
                'clabe' => $row['clabe_com'] ?: '012 790 00123456789 4',
                'whatsapp' => $row['whatsapp_com'] ?: '529933784115'
            ];
        }

        // Fallback a tabla servicios si existe
        $stmtS = $this->pdo->prepare("SELECT * FROM servicios WHERE id_se = ? LIMIT 1");
        $stmtS->execute([$id_se]);
        $serv = $stmtS->fetch();

        $name = $serv['nombre_se'] ?? 'Residencial Cumbres Del Ángel';
        $phone = !empty($serv['telefono_se']) ? $serv['telefono_se'] : '529933784115';

        return [
            'id' => ($id_se === 2 ? 'com_001' : 'com_002'),
            'communityId' => $id_se,
            'name' => $name,
            'description' => 'Fraccionamiento Residencial Privado',
            'address' => 'Av. Universidad 402, Villahermosa, Tabasco',
            'type' => 'fraccionamiento',
            'bank' => 'BBVA México',
            'beneficiary' => 'Fraccionamiento Cumbres A.C.',
            'clabe' => '012 790 00123456789 4',
            'whatsapp' => $phone
        ];
    }

    /**
     * Obtiene únicamente los datos bancarios SPEI para el portal de residentes
     */
    public function getBankInfo(int $id_se = 2): array {
        $comm = $this->getCommunity($id_se);
        return [
            'communityId' => $comm['communityId'],
            'communityName' => $comm['name'],
            'bank' => $comm['bank'],
            'beneficiary' => $comm['beneficiary'],
            'clabe' => $comm['clabe'],
            'whatsapp' => $comm['whatsapp'],
            'conceptExample' => 'Cuota Mantenimiento'
        ];
    }
}
