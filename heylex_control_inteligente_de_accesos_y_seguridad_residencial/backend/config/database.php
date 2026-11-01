<?php
// backend/config/database.php
declare(strict_types=1);

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
                $dsn = "mysql:host=" . self::$host . ";port=" . self::$port . ";dbname=" . self::$dbName . ";charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                self::$instance = new PDO($dsn, self::$user, self::$pass, $options);
            } catch (PDOException $e) {
                // If database is unreachable, return null so the API can return a graceful error / fallback
                return null;
            }
        }
        return self::$instance;
    }
}

