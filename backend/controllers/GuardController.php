<?php
// backend/controllers/GuardController.php
declare(strict_types=1);

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/GuardModel.php';

class GuardController extends BaseController {
    private GuardModel $guardModel;

    public function __construct() {
        $this->guardModel = new GuardModel();
    }

    /**
     * Endpoint /verify_pass: POST valida credencial QR o código de pase en caseta
     */
    public function verifyPass(): void {
        $this->requireMethod('POST');
        $input = $this->getJsonInput();
        $payload = trim((string)($input['qrPayload'] ?? ''));

        if ($payload === '') {
            Response::error('Debe enviar el código o payload QR a verificar.', 400);
        }

        $id_se = $this->resolveCommunityId($this->requestedCommunityId());
        $result = $this->guardModel->verifyPass($payload, $id_se);
        Response::success($result);
    }

    /**
     * Endpoint /record_access: POST registra cruce oficial en apphistorialaccesos
     */
    public function recordAccess(): void {
        $this->requireMethod('POST');
        $input = $this->getJsonInput();
        $id_se = $this->resolveCommunityId($this->requestedCommunityId());
        $guardId = $this->authUserId();

        $result = $this->guardModel->recordAccess($input, $id_se, $guardId);
        Response::success($result, 'Cruce registrado exitosamente en bitácora.');
    }

    /**
     * Endpoint /register_delivery: POST registra ingreso exprés de paquetería/proveedor
     */
    public function registerDelivery(): void {
        $this->requireMethod('POST');
        $input = $this->getJsonInput();
        $id_se = $this->resolveCommunityId($this->requestedCommunityId());
        $guardId = $this->authUserId();

        $result = $this->guardModel->registerDelivery($input, $id_se, $guardId);
        Response::success($result, 'Ingreso de paquetería registrado y autorizado.');
    }

    /**
     * Endpoint /guard_visits: GET visitas programadas para búsqueda rápida en caseta
     */
    public function todayVisits(): void {
        $this->requireMethod('GET');
        $id_se = $this->resolveCommunityId($this->requestedCommunityId());
        $search = $this->getQueryString('search', '');

        $visits = $this->guardModel->getTodayVisits($id_se, $search);
        Response::success(['visits' => $visits]);
    }
}

