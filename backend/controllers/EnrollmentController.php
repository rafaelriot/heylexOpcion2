<?php
// backend/controllers/EnrollmentController.php
declare(strict_types=1);

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/EnrollmentCodeModel.php';

class EnrollmentController extends BaseController {
    private EnrollmentCodeModel $enrollmentModel;

    public function __construct() {
        $this->enrollmentModel = new EnrollmentCodeModel();
    }

    /**
     * Endpoint /enrollment_codes: GET lista códigos, POST genera nuevo código
     */
    public function codes(): void {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if ($method === 'GET') {
            $id_se = $this->resolveCommunityId($this->requestedCommunityId());
            $codes = $this->enrollmentModel->getCodes(50, $id_se);
            Response::success(['codes' => $codes]);
        } elseif ($method === 'POST') {
            $input = $this->getJsonInput();
            $id_se = $this->resolveCommunityId(isset($input['communityId']) ? (int)$input['communityId'] : null);
            // El creador es siempre el administrador autenticado
            $id_uc = $this->authUserId();
            $type = (string)($input['type'] ?? 'residente');
            if (!in_array($type, ['residente', 'administrador'], true)) {
                Response::error('Tipo de código inválido.', 400);
            }
            $maxUses = max(1, min(500, (int)($input['maxUses'] ?? 10)));
            $days = max(1, min(365, (int)($input['days'] ?? 30)));

            $res = $this->enrollmentModel->createCode($id_se, $id_uc, $type, $maxUses, $days);
            Response::success($res, 'Código de enrolamiento generado');
        } else {
            Response::error('Method Not Allowed', 405);
        }
    }
}
