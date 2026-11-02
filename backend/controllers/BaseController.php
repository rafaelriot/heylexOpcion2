<?php
// backend/controllers/BaseController.php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';

abstract class BaseController {
    /**
     * Obtiene el payload JSON enviado en php://input
     */
    protected function getJsonInput(): array {
        $raw = file_get_contents('php://input');
        return !empty($raw) ? json_decode($raw, true) ?? [] : [];
    }

    /**
     * Valida que el método HTTP coincida con los permitidos
     */
    protected function requireMethod(string|array $methods): void {
        $methods = (array)$methods;
        $current = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if (!in_array($current, $methods, true)) {
            Response::error('Method Not Allowed', 405);
        }
    }

    /**
     * Obtiene parámetro entero de $_GET con valor por defecto
     */
    protected function getQueryInt(string $key, int $default = 0): int {
        return isset($_GET[$key]) ? (int)$_GET[$key] : $default;
    }

    /**
     * Obtiene parámetro string de $_GET con valor por defecto
     */
    protected function getQueryString(string $key, string $default = ''): string {
        return isset($_GET[$key]) ? trim((string)$_GET[$key]) : $default;
    }
}

