<?php
// backend/config/env.php
declare(strict_types=1);

/**
 * Carga variables de entorno locales desde backend/config/env.local.php (no versionado).
 * Se usa un archivo PHP (que retorna un array) en lugar de un .env plano para que,
 * aun si se solicita por HTTP, el servidor lo ejecute y no exponga su contenido.
 * Las variables ya definidas en el entorno real tienen prioridad.
 */
(static function (): void {
    static $loaded = false;
    if ($loaded) {
        return;
    }
    $loaded = true;

    $file = __DIR__ . '/env.local.php';
    if (!is_file($file)) {
        return;
    }

    $vars = require $file;
    if (!is_array($vars)) {
        return;
    }

    foreach ($vars as $key => $value) {
        if (!is_string($key) || getenv($key) !== false) {
            continue;
        }
        putenv($key . '=' . (string)$value);
    }
})();

