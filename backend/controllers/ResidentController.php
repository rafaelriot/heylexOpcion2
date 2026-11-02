<?php
// backend/controllers/ResidentController.php
declare(strict_types=1);

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ResidentModel.php';

class ResidentController extends BaseController {
    private ResidentModel $residentModel;

    public function __construct() {
        $this->residentModel = new ResidentModel();
    }

    /**
     * Listado de residentes con cálculo dinámico de cartera vencida
     */
    public function list(): void {
        $this->requireMethod('GET');
        $id_se = $this->getQueryInt('id_se', 2);
        $filter = $this->getQueryString('filter', 'ALL');
        $search = $this->getQueryString('search', '');

        $residents = $this->residentModel->getResidents($id_se, $filter, $search);
        Response::success(['residents' => $residents]);
    }

    /**
     * Alterna o actualiza el estatus del residente (ACTIVE / SUSPENDED)
     */
    public function updateStatus(): void {
        $this->requireMethod(['POST', 'PATCH']);
        $input = $this->getJsonInput();
        $residentId = (int)($input['residentId'] ?? 0);
        $status = strtoupper(trim((string)($input['status'] ?? '')));

        if ($residentId <= 0 || !in_array($status, ['ACTIVE', 'SUSPENDED'], true)) {
            Response::error('Parámetros residentId o status inválidos.', 400);
        }

        $ok = $this->residentModel->updateStatus($residentId, $status);
        if (!$ok) {
            Response::error('No se pudo actualizar el estatus en la base de datos.', 500);
        }

        Response::success([
            'residentId' => $residentId,
            'status' => $status
        ], 'Estatus de acceso actualizado en la base de datos MySQL.');
    }
}

