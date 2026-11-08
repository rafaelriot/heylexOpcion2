<?php
// backend/Router.php
declare(strict_types=1);

require_once __DIR__ . '/utils/Response.php';

// Controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/ResidentController.php';
require_once __DIR__ . '/controllers/AccessLogController.php';
require_once __DIR__ . '/controllers/VisitController.php';
require_once __DIR__ . '/controllers/EnrollmentController.php';
require_once __DIR__ . '/controllers/FinanceController.php';
require_once __DIR__ . '/controllers/CommunityController.php';
require_once __DIR__ . '/controllers/ComunicadoController.php';
require_once __DIR__ . '/controllers/AmenidadController.php';
require_once __DIR__ . '/controllers/GuardController.php';

class Router {
    /** Marca de ruta pública (no requiere JWT) */
    private const PUBLIC = null;
    /** Cualquier usuario autenticado */
    private const ANY = [];

    /**
     * action => [Controller, método, roles permitidos | PUBLIC | ANY]
     * @var array<string, array{0: string, 1: string, 2: ?array}>
     */
    private array $routes = [];

    public function __construct() {
        $this->registerRoutes();
    }

    private function registerRoutes(): void {
        $admin    = [BaseController::ROLE_ADMIN];
        $guard    = BaseController::ROLE_GUARD;
        $resident = BaseController::ROLE_RESIDENT;

        $this->routes = [
            'status'                 => [AuthController::class, 'status', self::PUBLIC],
            'login'                  => [AuthController::class, 'login', self::PUBLIC],

            'residents'              => [ResidentController::class, 'list', $admin],
            'update_resident_status' => [ResidentController::class, 'updateStatus', $admin],

            'access_logs'            => [AccessLogController::class, 'list', [BaseController::ROLE_ADMIN, $guard]],

            // GET: residente (propias) / guardia / admin; POST: residente / admin (validado en el controlador)
            'invitations'            => [VisitController::class, 'invitations', [BaseController::ROLE_ADMIN, $guard, $resident]],
            'all_visits'             => [VisitController::class, 'allVisits', [BaseController::ROLE_ADMIN, $guard]],

            'enrollment_codes'       => [EnrollmentController::class, 'codes', $admin],

            // GET: residente (propias) / admin; POST: solo admin (validado en el controlador)
            'cuotas'                 => [FinanceController::class, 'cuotas', [BaseController::ROLE_ADMIN, $resident]],
            'pagos'                  => [FinanceController::class, 'pagos', [BaseController::ROLE_ADMIN, $resident]],
            'register_payment'       => [FinanceController::class, 'registerPayment', $admin],
            'finance_metrics'        => [FinanceController::class, 'metrics', $admin],

            'community_info'         => [CommunityController::class, 'info', self::ANY],
            'community_bank_info'    => [CommunityController::class, 'bankInfo', self::ANY],

            'comunicados'            => [ComunicadoController::class, 'list', self::ANY],
            'amenidades'             => [AmenidadController::class, 'list', self::ANY],

            // Caseta y control de acceso operativo (Guardia y Admin)
            'verify_pass'            => [GuardController::class, 'verifyPass', [BaseController::ROLE_ADMIN, $guard]],
            'record_access'          => [GuardController::class, 'recordAccess', [BaseController::ROLE_ADMIN, $guard]],
            'register_delivery'      => [GuardController::class, 'registerDelivery', [BaseController::ROLE_ADMIN, $guard]],
            'guard_visits'           => [GuardController::class, 'todayVisits', [BaseController::ROLE_ADMIN, $guard]]
        ];
    }

    /**
     * Despacha la solicitud actual al controlador y método correspondiente
     */
    public function dispatch(): void {
        // Manejo de preflight CORS OPTIONS
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            Response::json(['status' => 'ok']);
        }

        $action = trim((string)($_GET['action'] ?? ''));

        if ($action === '' || !isset($this->routes[$action])) {
            Response::error('Acción no reconocida en la API.', 404);
        }

        [$controllerClass, $method, $roles] = $this->routes[$action];

        try {
            $controller = new $controllerClass();
            if ($roles !== self::PUBLIC) {
                $controller->authenticate($roles);
            }
            $controller->$method();
        } catch (Throwable $e) {
            // El detalle se registra en el log del servidor, nunca se expone al cliente
            error_log(sprintf('[HEYLEX API] action=%s %s: %s in %s:%d', $action, get_class($e), $e->getMessage(), $e->getFile(), $e->getLine()));
            Response::error('Error interno del servidor.', 500);
        }
    }
}
