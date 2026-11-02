<?php
// backend/controllers/AmenidadController.php
declare(strict_types=1);

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/AmenidadModel.php';

class AmenidadController extends BaseController {
    private AmenidadModel $amenidadModel;

    public function __construct() {
        $this->amenidadModel = new AmenidadModel();
    }

    /**
     * Endpoint /amenidades: GET listado de recursos o amenidades
     */
    public function list(): void {
        $this->requireMethod('GET');
        $amenidades = $this->amenidadModel->getActive();
        Response::success(['amenidades' => $amenidades]);
    }
}
