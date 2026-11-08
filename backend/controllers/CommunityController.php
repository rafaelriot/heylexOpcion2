<?php
// backend/controllers/CommunityController.php
declare(strict_types=1);

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/CommunityModel.php';

class CommunityController extends BaseController {
    private CommunityModel $communityModel;

    public function __construct() {
        $this->communityModel = new CommunityModel();
    }

    /**
     * Endpoint /community_info: GET datos generales de la comunidad
     */
    public function info(): void {
        $this->requireMethod('GET');
        $id_se = $this->resolveCommunityId($this->requestedCommunityId());
        $data = $this->communityModel->getCommunity($id_se);
        Response::success($data);
    }

    /**
     * Endpoint /community_bank_info: GET datos bancarios SPEI dinámicos para portal de residentes
     */
    public function bankInfo(): void {
        $this->requireMethod('GET');
        $id_se = $this->resolveCommunityId($this->requestedCommunityId());
        $bank = $this->communityModel->getBankInfo($id_se);
        Response::success($bank);
    }
}

