<?php
// backend/controllers/AccessLogController.php
declare(strict_types=1);

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/AccessLogModel.php';

class AccessLogController extends BaseController {
    private AccessLogModel $accessLogModel;

    public function __construct() {
        $this->accessLogModel = new AccessLogModel();
    }

    /**
     * Listado del historial de accesos
     */
    public function list(): void {
        $this->requireMethod('GET');
        $limit = $this->getQueryInt('limit', 100);
        $logs = $this->accessLogModel->getLogs($limit);
        Response::success(['logs' => $logs]);
    }
}

