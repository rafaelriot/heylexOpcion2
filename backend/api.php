<?php
// backend/api.php
declare(strict_types=1);

/**
 * HEYLEX Security Platform - API Front Controller
 * Arquitectura OOP / MVC modular
 */

require_once __DIR__ . '/Router.php';

$router = new Router();
$router->dispatch();
