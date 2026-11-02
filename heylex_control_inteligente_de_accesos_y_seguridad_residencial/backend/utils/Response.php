<?php
// backend/utils/Response.php
declare(strict_types=1);

class Response {
    private static function getOriginHeader(): string {
        $httpOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (empty($httpOrigin)) {
            return '*';
        }

        // Validación de orígenes seguros autorizados
        $allowedPatterns = [
            '/^https?:\/\/localhost(:[0-9]+)?$/',
            '/^https?:\/\/127\.0\.0\.1(:[0-9]+)?$/',
            '/^https:\/\/.*\.trycloudflare\.com$/',
            '/^https?:\/\/(.*\.)?heylex\.mx$/'
        ];

        foreach ($allowedPatterns as $pattern) {
            if (preg_match($pattern, $httpOrigin)) {
                return $httpOrigin;
            }
        }

        return 'https://heylex.mx';
    }

    public static function json(array $data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: ' . self::getOriginHeader());
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        // Cabeceras de seguridad bancaria / SOC 2
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');

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

