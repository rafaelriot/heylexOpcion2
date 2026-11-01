-- ==============================================================================
-- HEYLEX - MÓDULO CONTABLE Y FINANCIERO CONDOMINAL
-- Script de Migración: Tablas `appcuotas` y `apppagos`
-- Base de Datos: seteinc_app
-- ==============================================================================

USE `seteinc_app`;

-- 1. TABLA: `appcuotas` (Programación y registro de cuotas por lote/residente)
CREATE TABLE IF NOT EXISTS `appcuotas` (
  `id_cuo` double UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_se` double UNSIGNED NOT NULL COMMENT 'ID Servicio / Fraccionamiento (FK servicios)',
  `id_u` double UNSIGNED NOT NULL COMMENT 'ID Residente Titular (FK usuarios)',
  `concepto_cuo` varchar(150) NOT NULL COMMENT 'Ej. Cuota Mantenimiento Noviembre 2026',
  `tipo_cuo` enum('ordinaria','extraordinaria','amenidad','multa') NOT NULL DEFAULT 'ordinaria',
  `monto_cuo` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fechavencimiento_cuo` date NOT NULL,
  `estado_cuo` enum('pendiente','pagada','vencida','cancelada') NOT NULL DEFAULT 'pendiente',
  `fechageneracion_cuo` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cuo_servicio` (`id_se`),
  INDEX `idx_cuo_usuario` (`id_u`),
  INDEX `idx_cuo_estado` (`estado_cuo`),
  INDEX `idx_cuo_vencimiento` (`fechavencimiento_cuo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de cuotas de mantenimiento y adeudos de residentes';

-- 2. TABLA: `apppagos` (Libro mayor de transacciones, folios de recibos y comprobantes)
CREATE TABLE IF NOT EXISTS `apppagos` (
  `id_pag` double UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_cuo` double UNSIGNED NOT NULL COMMENT 'FK appcuotas',
  `id_u` double UNSIGNED NOT NULL COMMENT 'ID Residente que efectúa el pago',
  `id_ua` double UNSIGNED NOT NULL COMMENT 'ID Administrador que aprobó/registró el cobro',
  `folio_pag` varchar(50) NOT NULL UNIQUE COMMENT 'Folio oficial, ej. REC-2026-00101',
  `monto_pag` decimal(10,2) NOT NULL DEFAULT 0.00,
  `metodo_pag` enum('transferencia','efectivo','tarjeta','deposito') NOT NULL DEFAULT 'transferencia',
  `referencia_pag` varchar(100) NOT NULL DEFAULT '' COMMENT 'Clave de rastreo SPEI o autorización POS',
  `comprobante_url_pag` varchar(255) NOT NULL DEFAULT '' COMMENT 'Ruta de archivo digital (foto o PDF)',
  `fechapago_pag` datetime NOT NULL,
  `estado_pag` enum('verificado','en_revision','rechazado') NOT NULL DEFAULT 'verificado',
  `notas_pag` text DEFAULT NULL,
  `fecharegistro_pag` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pag_cuo` (`id_cuo`),
  INDEX `idx_pag_usuario` (`id_u`),
  INDEX `idx_pag_admin` (`id_ua`),
  INDEX `idx_pag_fecha` (`fechapago_pag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de pagos y recibos validados';

-- ==============================================================================
-- 3. DATOS SEMILLA PARA PRUEBAS (Fraccionamiento Residencial Cumbres Del Ángel: id_se = 2)
-- ==============================================================================

-- Cuotas de demostración
INSERT INTO `appcuotas` (`id_cuo`, `id_se`, `id_u`, `concepto_cuo`, `tipo_cuo`, `monto_cuo`, `fechavencimiento_cuo`, `estado_cuo`, `fechageneracion_cuo`) VALUES
(1, 2, 48, 'Mantenimiento Mensual Noviembre 2026', 'ordinaria', 1850.00, '2026-11-10', 'pendiente', '2026-11-01 00:00:00'),
(2, 2, 48, 'Mantenimiento Mensual Octubre 2026', 'ordinaria', 1850.00, '2026-10-10', 'pagada', '2026-10-01 00:00:00'),
(3, 2, 52, 'Mantenimiento Mensual Noviembre 2026', 'ordinaria', 1850.00, '2026-11-10', 'pendiente', '2026-11-01 00:00:00'),
(4, 2, 52, 'Mantenimiento Mensual Octubre 2026', 'ordinaria', 1850.00, '2026-10-10', 'vencida', '2026-10-01 00:00:00'),
(5, 2, 52, 'Mantenimiento Mensual Septiembre 2026', 'ordinaria', 1850.00, '2026-09-10', 'vencida', '2026-09-01 00:00:00'),
(6, 2, 49, 'Mantenimiento Mensual Noviembre 2026', 'ordinaria', 1850.00, '2026-11-10', 'vencida', '2026-10-01 00:00:00'),
(7, 2, 50, 'Mantenimiento Mensual Noviembre 2026', 'ordinaria', 1850.00, '2026-11-10', 'pagada', '2026-11-01 00:00:00'),
(8, 2, 50, 'Reserva Palapa & Asador Familiar', 'amenidad', 650.00, '2026-11-05', 'pagada', '2026-11-01 12:30:00');

-- Pagos registrados y recibos
INSERT INTO `apppagos` (`id_pag`, `id_cuo`, `id_u`, `id_ua`, `folio_pag`, `monto_pag`, `metodo_pag`, `referencia_pag`, `comprobante_url_pag`, `fechapago_pag`, `estado_pag`, `notas_pag`, `fecharegistro_pag`) VALUES
(1, 2, 48, 1652, 'REC-2026-00084', 1850.00, 'transferencia', 'SPEI-BBVA-7829104', 'recibos/rec_00084.pdf', '2026-10-05 11:22:15', 'verificado', 'Pago puntual con descuento aplicado por pronto pago', '2026-10-05 11:30:00'),
(2, 7, 50, 1652, 'REC-2026-00109', 1850.00, 'transferencia', 'SPEI-SANT-9932184', 'recibos/rec_00109.pdf', '2026-11-01 09:15:32', 'verificado', 'Pago anticipado mes corriente', '2026-11-01 09:30:00'),
(3, 8, 50, 1652, 'REC-2026-00110', 650.00, 'efectivo', 'REC-CAJA-044', 'recibos/rec_00110.pdf', '2026-11-01 14:00:00', 'verificado', 'Pago en administración de caseta para evento del fin de semana', '2026-11-01 14:05:00');

