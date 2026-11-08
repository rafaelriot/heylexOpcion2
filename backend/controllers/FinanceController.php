<?php
// backend/controllers/FinanceController.php
declare(strict_types=1);

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/FinanceModel.php';

class FinanceController extends BaseController {
    private FinanceModel $financeModel;

    public function __construct() {
        $this->financeModel = new FinanceModel();
    }

    /**
     * Determina el residente a consultar: un residente solo puede ver sus propios datos;
     * un administrador puede filtrar por cualquier residente (o ninguno = todos).
     */
    private function resolveResidentFilter(): ?int {
        if ($this->isResident()) {
            return $this->authUserId();
        }
        $raw = $_GET['id_u'] ?? null;
        return ($raw !== null && (int)$raw > 0) ? (int)$raw : null;
    }

    /**
     * Endpoint /cuotas: GET lista cuotas, POST genera nueva cuota
     */
    public function cuotas(): void {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if ($method === 'GET') {
            $id_se = $this->resolveCommunityId($this->requestedCommunityId());
            $id_u = $this->resolveResidentFilter();
            $status = $this->getQueryString('status', '');

            $cuotas = $this->financeModel->getCuotas($id_se, $id_u, $status);
            Response::success(['cuotas' => $cuotas]);
        } elseif ($method === 'POST') {
            if (!$this->isAdmin()) {
                Response::error('Solo un administrador puede generar cuotas.', 403);
            }
            $input = $this->getJsonInput();
            $id_se = $this->resolveCommunityId(isset($input['communityId']) ? (int)$input['communityId'] : null);
            $id_u = (int)($input['residentId'] ?? 0);
            $concept = trim((string)($input['concept'] ?? 'Cuota de Mantenimiento'));
            $type = trim((string)($input['type'] ?? 'ordinaria'));
            $amount = (float)($input['amount'] ?? 0.00);
            $dueDate = trim((string)($input['dueDate'] ?? date('Y-m-d', strtotime('+10 days'))));

            if ($id_u <= 0 || $amount <= 0) {
                Response::error('Datos de cuota incompletos o monto inválido.', 400);
            }
            $date = DateTime::createFromFormat('Y-m-d', $dueDate);
            if (!$date || $date->format('Y-m-d') !== $dueDate) {
                Response::error('Fecha de vencimiento inválida (formato AAAA-MM-DD).', 400);
            }
            if (!in_array($id_se, (new UserModel())->getServiceIds($id_u), true)) {
                Response::error('El residente no pertenece a la comunidad indicada.', 400);
            }

            $id_cuo = $this->financeModel->createCuota($id_se, $id_u, $concept, $type, $amount, $dueDate);
            Response::success([
                'id' => $id_cuo,
                'concept' => $concept,
                'amount' => $amount,
                'dueDate' => $dueDate
            ], 'Cuota generada exitosamente');
        } else {
            Response::error('Method Not Allowed', 405);
        }
    }

    /**
     * Endpoint /pagos: GET lista pagos
     */
    public function pagos(): void {
        $this->requireMethod('GET');
        $id_se = $this->resolveCommunityId($this->requestedCommunityId());
        $id_u = $this->resolveResidentFilter();

        $pagos = $this->financeModel->getPagos($id_se, $id_u);
        Response::success(['pagos' => $pagos]);
    }

    /**
     * Endpoint /register_payment: POST registra pago y actualiza estatus
     */
    public function registerPayment(): void {
        $this->requireMethod('POST');
        $input = $this->getJsonInput();

        $id_cuo = (int)($input['cuotaId'] ?? 0);
        $monto = (float)($input['amount'] ?? 0.00);
        $metodo = trim((string)($input['method'] ?? 'transferencia'));
        $referencia = trim((string)($input['reference'] ?? 'SPEI-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6))));
        $notas = trim((string)($input['notes'] ?? 'Pago verificado por administración'));
        // El administrador que registra es siempre el usuario autenticado (no se acepta del cliente)
        $id_ua = $this->authUserId();

        if ($id_cuo <= 0 || $monto <= 0) {
            Response::error('Parámetros de cuota o monto inválidos.', 400);
        }

        $cuota = $this->financeModel->getCuotaById($id_cuo);
        if (!$cuota) {
            Response::error('La cuota especificada no existe.', 404);
        }
        if (!$this->canAccessCommunity((int)$cuota['id_se'])) {
            Response::error('La cuota no pertenece a una comunidad bajo su administración.', 403);
        }
        if ($cuota['estado_cuo'] === 'pagada') {
            Response::error('La cuota ya se encuentra pagada.', 409);
        }

        try {
            $result = $this->financeModel->registerPayment($id_cuo, $monto, $metodo, $referencia, $notas, $id_ua);
            Response::success($result, 'Pago registrado correctamente.');
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage(), 404);
        }
    }

    /**
     * Endpoint /finance_metrics: GET métricas financieras consolidadas
     */
    public function metrics(): void {
        $this->requireMethod('GET');
        $id_se = $this->resolveCommunityId($this->requestedCommunityId());
        $metrics = $this->financeModel->getMetrics($id_se);
        Response::success($metrics);
    }
}
