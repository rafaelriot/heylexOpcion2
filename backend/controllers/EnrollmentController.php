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
            $codes = $this->enrollmentModel->getCodes(50);
            Response::success(['codes' => $codes]);
        } elseif ($method === 'POST') {
            $input = $this->getJsonInput();
            $id_se = (int)($input['communityId'] ?? 2);
            $id_uc = (int)($input['adminId'] ?? 1652);
            $type = (string)($input['type'] ?? 'residente');
            $maxUses = (int)($input['maxUses'] ?? 10);
            $days = (int)($input['days'] ?? 30);

            $res = $this->enrollmentModel->createCode($id_se, $id_uc, $type, $maxUses, $days);
            Response::success($res, 'Código de enrolamiento generado');
        } else {
            Response::error('Method Not Allowed', 405);
        }
    }
}

