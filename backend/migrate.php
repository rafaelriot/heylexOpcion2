<?php
// backend/migrate.php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

// Las migraciones solo pueden ejecutarse desde la línea de comandos:
//   C:\xampp\php\php.exe backend\migrate.php
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Forbidden: ejecute las migraciones por CLI (php backend/migrate.php).\n";
    exit;
}

$results = [];
$error = null;

try {
    // 1. Conectar a MySQL (incluso si la BD aún no está creada). Credenciales desde entorno / env.local.php
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') !== false ? (string)getenv('DB_PASS') : '';
    $dbName = getenv('DB_NAME') ?: 'seteinc_app';
    if (!preg_match('/^[A-Za-z0-9_]+$/', $dbName)) {
        throw new Exception('DB_NAME inválido.');
    }

    $pdoRoot = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Crear BD si no existe
    $pdoRoot->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

    // Conectar a la BD
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // 2. Comprobar si las tablas base existen; si no, cargar seteinc_app_desarrollo.sql
    $stmtCheck = $pdo->query("SHOW TABLES LIKE 'usuarios'");
    if (!$stmtCheck->fetch()) {
        $baseSchemaFile = dirname(__DIR__) . '/seteinc_app_desarrollo.sql';
        if (file_exists($baseSchemaFile)) {
            $rawBase = file_get_contents($baseSchemaFile);
            $cleanBase = preg_replace('/^--.*$/m', '', $rawBase);
            $cleanBase = preg_replace('/USE `?seteinc_app`?;/i', '', $cleanBase);
            $baseQueries = array_filter(array_map('trim', explode(';', $cleanBase)));
            foreach ($baseQueries as $bq) {
                if (!empty($bq)) {
                    try { $pdo->exec($bq); } catch (Exception $e) {}
                }
            }
        }
    }

    // 3. Cargar y ejecutar backend/sync_master_data.sql
    $sqlFile = __DIR__ . '/sync_master_data.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("El archivo $sqlFile no fue encontrado.");
    }

    $rawSql = file_get_contents($sqlFile);
    // Remover comentarios de línea y USE
    $cleanedSql = preg_replace('/^--.*$/m', '', $rawSql);
    $cleanedSql = preg_replace('/USE `?seteinc_app`?;/i', '', $cleanedSql);

    // Separar por punto y coma seguro
    $queries = array_filter(array_map('trim', explode(';', $cleanedSql)));

    $executedCount = 0;
    foreach ($queries as $q) {
        if (!empty($q)) {
            $pdo->exec($q);
            $executedCount++;
        }
    }

    // 3. Obtener conteo de registros por tabla
    $tables = [
        'usuarios' => "SELECT COUNT(*) FROM usuarios WHERE id_ro = 5",
        'serviciosusuarios' => "SELECT COUNT(*) FROM serviciosusuarios WHERE id_se = 2",
        'apphistorialaccesos' => "SELECT COUNT(*) FROM apphistorialaccesos",
        'appvisitasprogramadas' => "SELECT COUNT(*) FROM appvisitasprogramadas",
        'appinvitaciones' => "SELECT COUNT(*) FROM appinvitaciones",
        'appcuotas' => "SELECT COUNT(*) FROM appcuotas",
        'apppagos' => "SELECT COUNT(*) FROM apppagos"
    ];

    $counts = [];
    foreach ($tables as $t => $qCount) {
        try {
            $stmt = $pdo->query($qCount);
            $counts[$t] = (int)$stmt->fetchColumn();
        } catch (Exception $e) {
            $counts[$t] = 'Error: ' . $e->getMessage();
        }
    }

    $results = [
        'ok' => true,
        'executed_queries' => $executedCount,
        'counts' => $counts,
        'message' => 'Base de datos sincronizada con éxito.'
    ];

} catch (Exception $e) {
    $results = [
        'ok' => false,
        'error' => $e->getMessage()
    ];
}

// Salida CLI (JSON)
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
exit($results['ok'] ? 0 : 1);
