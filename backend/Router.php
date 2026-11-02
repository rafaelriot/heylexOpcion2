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

class Router {
    /** @var array<string, array{string, string}> */
    private array $routes = [];

    public function __construct() {
        $this->registerRoutes();
    }

    private function registerRoutes(): void {
        $this->routes = [
            'status'                 => [AuthController::class, 'status'],
            'login'                  => [AuthController::class, 'login'],
            
            'residents'              => [ResidentController::class, 'list'],
            'update_resident_status' => [ResidentController::class, 'updateStatus'],
            
            'access_logs'            => [AccessLogController::class, 'list'],
            
            'invitations'            => [VisitController::class, 'invitations'],
            'all_visits'             => [VisitController::class, 'allVisits'],
            
            'enrollment_codes'       => [EnrollmentController::class, 'codes'],
            
            'cuotas'                 => [FinanceController::class, 'cuotas'],
            'pagos'                  => [FinanceController::class, 'pagos'],
            'register_payment'       => [FinanceController::class, 'registerPayment'],
            'finance_metrics'        => [FinanceController::class, 'metrics'],
            
            'community_info'         => [CommunityController::class, 'info'],
            'community_bank_info'    => [CommunityController::class, 'bankInfo'],
            
            'comunicados'            => [ComunicadoController::class, 'list'],
            'amenidades'             => [AmenidadController::class, 'list']
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
            Response::error("Acción '{$action}' no reconocida en la API.", 404);
        }

        [$controllerClass, $method] = $this->routes[$action];

        try {
            $controller = new $controllerClass();
            $controller->$method();
        } catch (Throwable $e) {
            Response::error('Error interno del servidor: ' . $e->getMessage(), 500);
        }
    }
}
