<?php
// backend/config/database.php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

class Database {
    private static ?PDO $instance = null;

    private static string $host = '127.0.0.1';
    private static string $port = '3306';
    private static string $dbName = 'seteinc_app';
    private static string $user = 'root';
    private static string $pass = '';

    public static function getConnection(): ?PDO {
        if (self::$instance === null) {
            try {
                $host = getenv('DB_HOST') ?: self::$host;
                $port = getenv('DB_PORT') ?: self::$port;
                $dbName = getenv('DB_NAME') ?: self::$dbName;
                $user = getenv('DB_USER') ?: self::$user;
                $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : self::$pass;

                $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                // If database is unreachable, return null so the API can return a graceful error / fallback
                return null;
            }
        }
        return self::$instance;
    }
}

