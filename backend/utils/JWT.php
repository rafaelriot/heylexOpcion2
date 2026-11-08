<?php
// backend/utils/JWT.php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

class JWT {
    /** Vigencia por defecto: 30 días */
    private const DEFAULT_TTL = 2592000;

    private static function getSecretKey(): string {
        $envSecret = getenv('HEYLEX_JWT_SECRET');
        if (is_string($envSecret) && strlen($envSecret) >= 32) {
            return $envSecret;
        }
        // Sin secreto configurado no se emiten ni aceptan tokens (evita secretos hardcodeados)
        throw new RuntimeException('HEYLEX_JWT_SECRET no configurado (mínimo 32 caracteres). Ver backend/config/env.example.php');
    }

    public static function defaultTtl(): int {
        $ttl = (int)(getenv('HEYLEX_JWT_TTL') ?: 0);
        return $ttl > 0 ? $ttl : self::DEFAULT_TTL;
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public static function generate(array $payload, ?int $expirySeconds = null): string {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $now = time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + ($expirySeconds ?? self::defaultTtl());

        $encodedHeader = self::base64UrlEncode(json_encode($header));
        $encodedPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', "{$encodedHeader}.{$encodedPayload}", self::getSecretKey(), true);
        $encodedSignature = self::base64UrlEncode($signature);

        return "{$encodedHeader}.{$encodedPayload}.{$encodedSignature}";
    }

    public static function verify(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

        // Solo se acepta HS256 (evita ataques de tipo alg=none / confusión de algoritmo)
        $header = json_decode(self::base64UrlDecode($encodedHeader), true);
        if (!is_array($header) || ($header['alg'] ?? '') !== 'HS256') {
            return null;
        }

        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "{$encodedHeader}.{$encodedPayload}", self::getSecretKey(), true)
        );

        if (!hash_equals($expectedSignature, $encodedSignature)) {
            return null; // Invalid signature
        }

        $payload = json_decode(self::base64UrlDecode($encodedPayload), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null; // Expired or malformed
        }

        return $payload;
    }

    public static function getBearerToken(): ?string {
        $headers = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(
                array_map('ucwords', array_keys($requestHeaders)),
                array_values($requestHeaders)
            );
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }

        if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }

        return null;
    }
}

