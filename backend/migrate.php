<?php
// backend/migrate.php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

$isCli = (php_sapi_name() === 'cli');
$results = [];
$error = null;

try {
    // 1. Conectar a MySQL (incluso si la BD seteinc_app aún no está creada)
    $host = '127.0.0.1';
    $port = '3306';
    $user = 'root';
    $pass = '';

    $pdoRoot = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Crear BD si no existe
    $pdoRoot->exec("CREATE DATABASE IF NOT EXISTS `seteinc_app` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

    // Conectar a seteinc_app
    $pdo = new PDO("mysql:host={$host};port={$port};dbname=seteinc_app;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // 2. Cargar y ejecutar backend/sync_master_data.sql
    $sqlFile = __DIR__ . '/sync_master_data.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("El archivo $sqlFile no fue encontrado.");
    }

    $rawSql = file_get_contents($sqlFile);
    // Remover comentarios de línea y USE
    $cleanedSql = preg_replace('/^--.*$/m', '', $rawSql);
    $cleanedSql = preg_replace('/USE `?seteinc_app`?;/i', '', $cleanedSql);

    // Separar por punto y coma seguro
    $queries = array_filter(array_map('trim', explode(';', $cleanedSql)));

    $executedCount = 0;
    foreach ($queries as $q) {
        if (!empty($q)) {
            $pdo->exec($q);
            $executedCount++;
        }
    }

    // 3. Obtener conteo de registros por tabla
    $tables = [
        'usuarios' => "SELECT COUNT(*) FROM usuarios WHERE id_ro = 5",
        'serviciosusuarios' => "SELECT COUNT(*) FROM serviciosusuarios WHERE id_se = 2",
        'apphistorialaccesos' => "SELECT COUNT(*) FROM apphistorialaccesos",
        'appvisitasprogramadas' => "SELECT COUNT(*) FROM appvisitasprogramadas",
        'appinvitaciones' => "SELECT COUNT(*) FROM appinvitaciones",
        'appcuotas' => "SELECT COUNT(*) FROM appcuotas",
        'apppagos' => "SELECT COUNT(*) FROM apppagos"
    ];

    $counts = [];
    foreach ($tables as $t => $qCount) {
        try {
            $stmt = $pdo->query($qCount);
            $counts[$t] = (int)$stmt->fetchColumn();
        } catch (Exception $e) {
            $counts[$t] = 'Error: ' . $e->getMessage();
        }
    }

    $results = [
        'ok' => true,
        'executed_queries' => $executedCount,
        'counts' => $counts,
        'message' => 'Base de datos sincronizada con éxito.'
    ];

} catch (Exception $e) {
    $results = [
        'ok' => false,
        'error' => $e->getMessage()
    ];
}

// Salida CLI o HTML
if ($isCli || isset($_GET['format']) && $_GET['format'] === 'json') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>HEYLEX - Sincronizador de Base de Datos</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-8 flex items-center justify-center font-sans">
  <div class="max-w-xl w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-6 space-y-6">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
        HLX
      </div>
      <div>
        <h1 class="text-xl font-black text-white">Sincronizador de Datos MySQL</h1>
        <p class="text-xs text-slate-400">Plataforma Residencial HEYLEX &bull; Base: seteinc_app</p>
      </div>
    </div>

    <?php if ($results['ok']): ?>
      <div class="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-2">
        <div class="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <span>&#10003;</span>
          <span><?php echo htmlspecialchars($results['message']); ?></span>
        </div>
        <p class="text-xs text-emerald-300/80">Se ejecutaron <?php echo $results['executed_queries']; ?> sentencias SQL de migración y consolidación.</p>
      </div>

      <div class="space-y-3">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">Registros Sincronizados en MySQL:</h2>
        <div class="divide-y divide-slate-700 text-xs">
          <div class="py-2 flex justify-between">
            <span class="text-slate-300">Padrón de Residentes (usuarios id_ro=5):</span>
            <span class="font-mono font-bold text-emerald-400"><?php echo $results['counts']['usuarios']; ?></span>
          </div>
          <div class="py-2 flex justify-between">
            <span class="text-slate-300">Vínculos Fraccionamiento (serviciosusuarios id_se=2):</span>
            <span class="font-mono font-bold text-emerald-400"><?php echo $results['counts']['serviciosusuarios']; ?></span>
          </div>
          <div class="py-2 flex justify-between">
            <span class="text-slate-300">Bitácora de Caseta (apphistorialaccesos):</span>
            <span class="font-mono font-bold text-emerald-400"><?php echo $results['counts']['apphistorialaccesos']; ?></span>
          </div>
          <div class="py-2 flex justify-between">
            <span class="text-slate-300">Visitas Programadas (appvisitasprogramadas):</span>
            <span class="font-mono font-bold text-emerald-400"><?php echo $results['counts']['appvisitasprogramadas']; ?></span>
          </div>
          <div class="py-2 flex justify-between">
            <span class="text-slate-300">Códigos de Enrolamiento (appinvitaciones):</span>
            <span class="font-mono font-bold text-emerald-400"><?php echo $results['counts']['appinvitaciones']; ?></span>
          </div>
          <div class="py-2 flex justify-between">
            <span class="text-slate-300">Cuotas Condominales (appcuotas):</span>
            <span class="font-mono font-bold text-emerald-400"><?php echo $results['counts']['appcuotas']; ?></span>
          </div>
          <div class="py-2 flex justify-between">
            <span class="text-slate-300">Pagos y Recibos Validados (apppagos):</span>
            <span class="font-mono font-bold text-emerald-400"><?php echo $results['counts']['apppagos']; ?></span>
          </div>
        </div>
      </div>

      <div class="pt-4 flex gap-3">
        <a href="../admin.html" class="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase text-center transition-all shadow-lg shadow-emerald-600/30">
          Ir al Panel de Administración
        </a>
        <a href="migrate.php" class="py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase text-center transition-all">
          Reejecutar
        </a>
      </div>

    <?php else: ?>
      <div class="p-4 bg-rose-950/60 border border-rose-500/40 rounded-xl space-y-2">
        <div class="text-rose-400 font-bold text-sm">Error de Conexión o Migración</div>
        <p class="text-xs text-rose-300/80"><?php echo htmlspecialchars($results['error']); ?></p>
        <p class="text-[11px] text-slate-400 pt-2">
          <strong>Sugerencia:</strong> Asegúrate de que el módulo MySQL esté iniciado en el panel de control de XAMPP (puerto 3306).
        </p>
      </div>

      <div class="pt-2">
        <a href="migrate.php" class="block w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase text-center transition-all">
          Reintentar Conexión
        </a>
      </div>
    <?php endif; ?>

  </div>
</body>
</html>

