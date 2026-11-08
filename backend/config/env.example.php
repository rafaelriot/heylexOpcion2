<?php
// backend/config/env.example.php
// Copia este archivo como env.local.php (no se versiona) y ajusta los valores.
// Las variables de entorno reales del servidor tienen prioridad sobre este archivo.
return [
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '3306',
    'DB_NAME' => 'seteinc_app',
    'DB_USER' => 'root',
    'DB_PASS' => '',

    // Secreto para firmar los JWT. OBLIGATORIO. Genera uno con:
    //   php -r "echo bin2hex(random_bytes(32));"
    'HEYLEX_JWT_SECRET' => 'cambia-esto-por-un-secreto-aleatorio-de-64-caracteres',

    // Vigencia del token en segundos (por defecto 30 días)
    'HEYLEX_JWT_TTL' => '2592000',
];

