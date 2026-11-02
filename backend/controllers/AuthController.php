<?php
// backend/controllers/AuthController.php
declare(strict_types=1);

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/CommunityModel.php';
require_once __DIR__ . '/../utils/JWT.php';

class AuthController extends BaseController {
    private UserModel $userModel;
    private CommunityModel $communityModel;

    public function __construct() {
        $this->userModel = new UserModel();
        $this->communityModel = new CommunityModel();
    }

    /**
     * Endpoint de salud y diagnóstico del servidor
     */
    public function status(): void {
        Response::success([
            'database_connected' => true,
            'server_time' => date('Y-m-d H:i:s'),
            'app' => 'HEYLEX Security Platform API',
            'version' => '2.0.0-OOP',
            'security_standard' => 'SEGURIDAD DE NIVEL BANCARIO'
        ]);
    }

    /**
     * Autenticación con verificación Bancaria (Bcrypt / Argon2 / MD5 legacy transitorio)
     */
    public function login(): void {
        $this->requireMethod('POST');
        $input = $this->getJsonInput();
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($email) || empty($password)) {
            Response::error('Debe ingresar correo y contraseña.', 400);
        }

        $user = $this->userModel->findByEmail($email);
        if (!$user) {
            Response::error('Usuario o contraseña incorrectos.', 401);
        }

        if (!$this->userModel->verifyAndRehashPassword($user, $password)) {
            Response::error('Usuario o contraseña incorrectos.', 401);
        }

        // Obtener asignación de servicio y comunidad
        $su = $this->userModel->getAssignment((int)$user['id_u']);
        $id_se = (int)($su['id_se'] ?? 2);
        $communityData = $this->communityModel->getCommunity($id_se);

        $unitDisplay = trim("{$user['calle_u']} {$user['numero_u']}" . (!empty($user['numerointerior_u']) ? "-{$user['numerointerior_u']}" : ''));
        if (empty($unitDisplay)) $unitDisplay = 'Casa 42-B';
        $zoneDisplay = !empty($user['colonia_u']) ? $user['colonia_u'] : 'Privada Los Robles';

        // Detalles dinámicos de membresía
        $membership = $this->userModel->getMembershipDetails((int)$user['id_u'], $id_se, $user);

        $token = JWT::generate([
            'id_u' => (int)$user['id_u'],
            'email' => $user['email_u'],
            'role' => (int)$user['id_ro'],
            'id_se' => $id_se
        ]);

        $userData = [
            'id' => (int)$user['id_u'],
            'name' => trim("{$user['nombre_u']} {$user['apaterno_u']} {$user['amaterno_u']}"),
            'email' => $user['email_u'],
            'role' => ($user['id_ro'] == 4 ? 'ADMINISTRADOR' : ($user['id_ro'] == 3 ? 'GUARDIA' : 'RESIDENTE')),
            'gender' => ($user['sexo_u'] === 'm' ? 'female' : 'male'),
            'unit' => $unitDisplay,
            'qrCode' => $user['tokenqr_u'],
            'phone' => $user['telefonomovil_u'] ?: ($user['telefonocasa_u'] ?: '+52 993 123 4567'),
            'community' => [
                'id' => $communityData['id'],
                'name' => $communityData['name'],
                'address' => $communityData['address'],
                'zone' => $zoneDisplay,
                'unit' => $unitDisplay
            ],
            'membership' => [
                'status' => $membership['status'],
                'licensePlan' => $membership['licensePlan'],
                'validUntil' => $membership['validUntil'],
                'canGenerateOwnQr' => $membership['canGenerateOwnQr'],
                'canInviteVisitors' => $membership['canInviteVisitors'],
                'suspensionReason' => $membership['suspensionReason'],
                'debtAmount' => $membership['debtAmount']
            ]
        ];

        Response::success([
            'token' => $token,
            'user' => $userData
        ], 'Inicio de sesión exitoso');
    }
}
