<?php
// backend/controllers/ComunicadoController.php
declare(strict_types=1);

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ComunicadoModel.php';

class ComunicadoController extends BaseController {
    private ComunicadoModel $comunicadoModel;

    public function __construct() {
        $this->comunicadoModel = new ComunicadoModel();
    }

    /**
     * Endpoint /comunicados: GET listado de comunicados activos
     */
    public function list(): void {
        $this->requireMethod('GET');
        $comunicados = $this->comunicadoModel->getActive();
        Response::success(['comunicados' => $comunicados]);
    }
}
