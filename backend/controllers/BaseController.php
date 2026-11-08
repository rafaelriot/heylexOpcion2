<?php
// backend/controllers/BaseController.php
declare(strict_types=1);

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../models/UserModel.php';

abstract class BaseController {
    // Roles (tabla `roles`)
    public const ROLE_GUARD = 3;
    public const ROLE_ADMIN = 4;
    public const ROLE_RESIDENT = 5;

    /** Payload del JWT del usuario autenticado (id_u, email, role, id_se) */
    protected array $auth = [];

    /** @var int[]|null Cache de comunidades asignadas al usuario autenticado */
    private ?array $authServiceIds = null;

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

    /* =====================================================================
     * Autenticación y autorización
     * ===================================================================== */

    /**
     * Exige un JWT válido (Authorization: Bearer ...) y, opcionalmente, uno de los roles indicados.
     * @param int[] $roles Roles permitidos; vacío = cualquier usuario autenticado
     */
    public function authenticate(array $roles = []): array {
        $token = JWT::getBearerToken();
        $payload = $token ? JWT::verify($token) : null;

        if (!$payload || empty($payload['id_u'])) {
            Response::error('No autenticado. Inicie sesión nuevamente.', 401);
        }

        if ($roles && !in_array((int)($payload['role'] ?? 0), $roles, true)) {
            Response::error('No tiene permisos para realizar esta acción.', 403);
        }

        return $this->auth = $payload;
    }

    protected function authUserId(): int {
        return (int)($this->auth['id_u'] ?? 0);
    }

    protected function authRole(): int {
        return (int)($this->auth['role'] ?? 0);
    }

    protected function isAdmin(): bool {
        return $this->authRole() === self::ROLE_ADMIN;
    }

    protected function isResident(): bool {
        return $this->authRole() === self::ROLE_RESIDENT;
    }

    /**
     * ¿El usuario autenticado puede operar sobre la comunidad indicada?
     * Su comunidad del token siempre; un administrador además las que tenga asignadas.
     */
    protected function canAccessCommunity(int $id_se): bool {
        if ($id_se <= 0) {
            return false;
        }
        if ($id_se === (int)($this->auth['id_se'] ?? 0)) {
            return true;
        }
        if (!$this->isAdmin()) {
            return false;
        }
        if ($this->authServiceIds === null) {
            $this->authServiceIds = (new UserModel())->getServiceIds($this->authUserId());
        }
        return in_array($id_se, $this->authServiceIds, true);
    }

    /**
     * Resuelve la comunidad de la petición. Nunca se confía en el valor del cliente:
     * si no se indica se usa la del token; si se indica otra, debe estar autorizada.
     */
    protected function resolveCommunityId(?int $requested = null): int {
        $own = (int)($this->auth['id_se'] ?? 0);
        if ($requested === null || $requested <= 0) {
            return $own;
        }
        if (!$this->canAccessCommunity($requested)) {
            Response::error('No tiene acceso a esta comunidad.', 403);
        }
        return $requested;
    }

    /** id_se solicitado por query string (o null si no se envió) */
    protected function requestedCommunityId(): ?int {
        return isset($_GET['id_se']) ? (int)$_GET['id_se'] : null;
    }
}
