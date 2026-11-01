<?php
// backend/utils/Response.php
declare(strict_types=1);

class Response {
    public static function json(array $data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    public static function error(string $message, int $statusCode = 400, ?array $details = null): void {
        self::json([
            'ok' => false,
            'error' => $message,
            'details' => $details
        ], $statusCode);
    }

    public static function success(array $data = [], string $message = 'Success'): void {
        self::json(array_merge([
            'ok' => true,
            'message' => $message
        ], $data), 200);
    }
}

