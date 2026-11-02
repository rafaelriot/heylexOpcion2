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
     * Resuelve IDs alfanuméricos a enteros (compatibilidad)
     */
    private function resolveResidentId(?string $raw): ?int {
        if ($raw === null || $raw === '') return null;
        $mockMap = [
            'usr_001' => 1665,
            'usr_002' => 1666,
            'usr_003' => 1667,
            'usr_004' => 1668
        ];
        return isset($mockMap[$raw]) ? $mockMap[$raw] : ((int)$raw > 0 ? (int)$raw : null);
    }

    /**
     * Endpoint /cuotas: GET lista cuotas, POST genera nueva cuota
     */
    public function cuotas(): void {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if ($method === 'GET') {
            $id_se = $this->getQueryInt('id_se', 2);
            $rawIdU = $_GET['id_u'] ?? null;
            $id_u = $this->resolveResidentId($rawIdU !== null ? (string)$rawIdU : null);
            $status = $this->getQueryString('status', '');

            $cuotas = $this->financeModel->getCuotas($id_se, $id_u, $status);
            Response::success(['cuotas' => $cuotas]);
        } elseif ($method === 'POST') {
            $input = $this->getJsonInput();
            $id_se = (int)($input['communityId'] ?? 2);
            $id_u = (int)($input['residentId'] ?? 0);
            $concept = trim((string)($input['concept'] ?? 'Cuota de Mantenimiento'));
            $type = trim((string)($input['type'] ?? 'ordinaria'));
            $amount = (float)($input['amount'] ?? 0.00);
            $dueDate = trim((string)($input['dueDate'] ?? date('Y-m-d', strtotime('+10 days'))));

            if ($id_u <= 0 || $amount <= 0) {
                Response::error('Datos de cuota incompletos o monto inválido.', 400);
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
        $id_se = $this->getQueryInt('id_se', 2);
        $rawIdU = $_GET['id_u'] ?? null;
        $id_u = $this->resolveResidentId($rawIdU !== null ? (string)$rawIdU : null);

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
        $id_ua = (int)($input['adminId'] ?? 1652);

        if ($id_cuo <= 0 || $monto <= 0) {
            Response::error('Parámetros de cuota o monto inválidos.', 400);
        }

        try {
            $result = $this->financeModel->registerPayment($id_cuo, $monto, $metodo, $referencia, $notas, $id_ua);
            Response::success($result, 'Pago registrado correctamente.');
        } catch (InvalidArgumentException $e) {
            Response::error($e->getMessage(), 404);
        } catch (Exception $e) {
            Response::error('Error al procesar el pago: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Endpoint /finance_metrics: GET métricas financieras consolidadas
     */
    public function metrics(): void {
        $this->requireMethod('GET');
        $id_se = $this->getQueryInt('id_se', 2);
        $metrics = $this->financeModel->getMetrics($id_se);
        Response::success($metrics);
    }
}
