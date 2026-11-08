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
            $id_se = $this->resolveCommunityId($this->requestedCommunityId());
            // Un residente solo ve las invitaciones que él creó
            $id_u = $this->isResident() ? $this->authUserId() : null;
            $invitations = $this->visitModel->getScheduledVisits(50, $id_se, $id_u);
            Response::success(['invitations' => $invitations]);
        } elseif ($method === 'POST') {
            if (!$this->isResident() && !$this->isAdmin()) {
                Response::error('No tiene permisos para crear invitaciones.', 403);
            }
            $input = $this->getJsonInput();
            if ($this->isResident()) {
                // El residente siempre invita a su nombre y en su comunidad
                $input['residentId'] = $this->authUserId();
                $input['communityId'] = $this->resolveCommunityId();
            } else {
                $input['communityId'] = $this->resolveCommunityId(isset($input['communityId']) ? (int)$input['communityId'] : null);
                $input['residentId'] = (int)($input['residentId'] ?? 0) ?: $this->authUserId();
            }
            try {
                $res = $this->visitModel->createVisit($input);
            } catch (InvalidArgumentException $e) {
                Response::error($e->getMessage(), 400);
            }
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
        $id_se = $this->resolveCommunityId($this->requestedCommunityId());
        $visits = $this->visitModel->getAllVisits(100, $id_se);
        Response::success(['visits' => $visits]);
    }
}
