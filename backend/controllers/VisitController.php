<?php
// backend/controllers/VisitController.php
declare(strict_types=1);

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/VisitModel.php';

class VisitController extends BaseController {
    private VisitModel $visitModel;

    public function __construct() {
        $this->visitModel = new VisitModel();
    }

    /**
     * Endpoint /invitations: GET lista visitas, POST crea nueva visita
     */
    public function invitations(): void {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if ($method === 'GET') {
            $invitations = $this->visitModel->getScheduledVisits(50);
            Response::success(['invitations' => $invitations]);
        } elseif ($method === 'POST') {
            $input = $this->getJsonInput();
            $res = $this->visitModel->createVisit($input);
            Response::success($res, 'Invitación creada exitosamente');
        } else {
            Response::error('Method Not Allowed', 405);
        }
    }

    /**
     * Endpoint /all_visits: listado unificado de visitas con anfitrión
     */
    public function allVisits(): void {
        $this->requireMethod('GET');
        $visits = $this->visitModel->getAllVisits(100);
        Response::success(['visits' => $visits]);
    }
}
