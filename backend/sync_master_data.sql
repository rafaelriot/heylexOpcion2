-- ==============================================================================
-- HEYLEX - SCRIPT MAESTRO DE CONSOLIDACIÓN Y SINCRONIZACIÓN DE DATOS
-- Base de Datos: seteinc_app
-- Integra: Padrón Residentes, Bitácora, Visitas, Códigos y Finanzas
-- ==============================================================================

USE `seteinc_app`;

-- 1. TABLAS FINANCIERAS CONDOMINALES (appcuotas y apppagos)
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


-- 2. PADRÓN DE RESIDENTES MODELO EN `usuarios` (id_ro = 5: Residente, id_se = 2: Cumbres)

-- 2.1 Actualizar / Insertar Residente 1: Ing. Carlos Mendoza R. (ID 1665)
INSERT INTO `usuarios` (
  `id_u`, `id_ro`, `id_eu`, `email_u`, `pasword_u`, `tokenqr_u`, `qractivo_u`,
  `nombre_u`, `apaterno_u`, `amaterno_u`, `telefonomovil_u`, `sexo_u`,
  `colonia_u`, `calle_u`, `numero_u`, `numerointerior_u`, `activo_u`, `fecharegistro_u`
) VALUES (
  1665, 5, 1, 'residente@heylex.mx', md5('password123'), 'HLX-RES-MENDOZA-42B', 'y',
  'Carlos', 'Mendoza', 'R.', '+52 993 123 4567', 'h',
  'Privada Los Robles', 'Roble Real', '42', 'B', 'y', NOW()
) ON DUPLICATE KEY UPDATE
  `nombre_u` = 'Carlos', `apaterno_u` = 'Mendoza', `amaterno_u` = 'R.',
  `email_u` = 'residente@heylex.mx', `pasword_u` = md5('password123'),
  `telefonomovil_u` = '+52 993 123 4567', `sexo_u` = 'h',
  `colonia_u` = 'Privada Los Robles', `calle_u` = 'Roble Real', `numero_u` = '42', `numerointerior_u` = 'B',
  `id_ro` = 5, `id_eu` = 1, `qractivo_u` = 'y', `activo_u` = 'y';

-- 2.2 Insertar Residente 2: Lic. Ana Sofía Garza (ID 1666)
INSERT INTO `usuarios` (
  `id_u`, `id_ro`, `id_eu`, `email_u`, `pasword_u`, `tokenqr_u`, `qractivo_u`,
  `nombre_u`, `apaterno_u`, `amaterno_u`, `telefonomovil_u`, `sexo_u`,
  `colonia_u`, `calle_u`, `numero_u`, `numerointerior_u`, `activo_u`, `fecharegistro_u`
) VALUES (
  1666, 5, 3, 'suspendido@heylex.mx', md5('password123'), 'HLX-RES-GARZA-18A', 'n',
  'Ana Sofía', 'Garza', 'Treviño', '+52 993 987 6543', 'm',
  'Privada Los Robles', 'Roble Real', '18', 'A', 'y', NOW()
) ON DUPLICATE KEY UPDATE
  `nombre_u` = 'Ana Sofía', `apaterno_u` = 'Garza', `amaterno_u` = 'Treviño',
  `email_u` = 'suspendido@heylex.mx', `pasword_u` = md5('password123'),
  `telefonomovil_u` = '+52 993 987 6543', `sexo_u` = 'm',
  `colonia_u` = 'Privada Los Robles', `calle_u` = 'Roble Real', `numero_u` = '18', `numerointerior_u` = 'A',
  `id_ro` = 5, `id_eu` = 3, `qractivo_u` = 'n', `activo_u` = 'y';

-- 2.3 Insertar Residente 3: Dr. David Ruiz Calderón (ID 1667)
INSERT INTO `usuarios` (
  `id_u`, `id_ro`, `id_eu`, `email_u`, `pasword_u`, `tokenqr_u`, `qractivo_u`,
  `nombre_u`, `apaterno_u`, `amaterno_u`, `telefonomovil_u`, `sexo_u`,
  `colonia_u`, `calle_u`, `numero_u`, `numerointerior_u`, `activo_u`, `fecharegistro_u`
) VALUES (
  1667, 5, 1, 'david.ruiz@heylex.mx', md5('password123'), 'HLX-RES-RUIZ-LOT07', 'y',
  'David', 'Ruiz', 'Calderón', '+52 993 555 1122', 'h',
  'Av. Las Palmas', 'Circuito Palmeras', '07', '', 'y', NOW()
) ON DUPLICATE KEY UPDATE
  `nombre_u` = 'David', `apaterno_u` = 'Ruiz', `amaterno_u` = 'Calderón',
  `email_u` = 'david.ruiz@heylex.mx', `pasword_u` = md5('password123'),
  `telefonomovil_u` = '+52 993 555 1122', `sexo_u` = 'h',
  `colonia_u` = 'Av. Las Palmas', `calle_u` = 'Circuito Palmeras', `numero_u` = '07', `numerointerior_u` = '',
  `id_ro` = 5, `id_eu` = 1, `qractivo_u` = 'y', `activo_u` = 'y';

-- 2.4 Insertar Residente 4: Sra. Valeria Ortiz Blanco (ID 1668)
INSERT INTO `usuarios` (
  `id_u`, `id_ro`, `id_eu`, `email_u`, `pasword_u`, `tokenqr_u`, `qractivo_u`,
  `nombre_u`, `apaterno_u`, `amaterno_u`, `telefonomovil_u`, `sexo_u`,
  `colonia_u`, `calle_u`, `numero_u`, `numerointerior_u`, `activo_u`, `fecharegistro_u`
) VALUES (
  1668, 5, 3, 'valeria.ortiz@heylex.mx', md5('password123'), 'HLX-RES-ORTIZ-03C', 'n',
  'Valeria', 'Ortiz', 'Blanco', '+52 993 666 3344', 'm',
  'Privada Magnolia', 'Paseo de las Flores', '03', 'C', 'y', NOW()
) ON DUPLICATE KEY UPDATE
  `nombre_u` = 'Valeria', `apaterno_u` = 'Ortiz', `amaterno_u` = 'Blanco',
  `email_u` = 'valeria.ortiz@heylex.mx', `pasword_u` = md5('password123'),
  `telefonomovil_u` = '+52 993 666 3344', `sexo_u` = 'm',
  `colonia_u` = 'Privada Magnolia', `calle_u` = 'Paseo de las Flores', `numero_u` = '03', `numerointerior_u` = 'C',
  `id_ro` = 5, `id_eu` = 3, `qractivo_u` = 'n', `activo_u` = 'y';

-- 3. VINCULACIÓN EN `serviciosusuarios` (id_se = 2: Cumbres Del Ángel)
INSERT IGNORE INTO `serviciosusuarios` (`id_se`, `id_u`) VALUES
(2, 1665),
(2, 1666),
(2, 1667),
(2, 1668);


-- 4. CÓDIGOS DE ENROLAMIENTO EN `appinvitaciones`
INSERT INTO `appinvitaciones` (
  `id_inv`, `id_se`, `id_uc`, `origen_inv`, `tipo_inv`, `invitacion_inv`,
  `usosmaximos_inv`, `usosactuales_inv`, `fechacreacion_inv`, `fechavencimiento_inv`, `estado_inv`, `activo_inv`
) VALUES
(101, 2, 1652, 'web', 'residente', 'INV-WQGX1M', 10, 4, '2026-06-10 14:54:04', '2026-12-31 23:59:59', 'activo', 'y'),
(102, 2, 1652, 'web', 'residente', 'INV-IB8LL3', 10, 6, '2026-10-01 18:21:30', '2026-11-30 23:59:59', 'activo', 'y'),
(103, 2, 1652, 'web', 'administrador', 'ADM-SEC2026', 5, 1, '2026-01-15 09:00:00', '2026-12-31 23:59:59', 'activo', 'y')
ON DUPLICATE KEY UPDATE
  `usosmaximos_inv` = VALUES(`usosmaximos_inv`),
  `usosactuales_inv` = VALUES(`usosactuales_inv`),
  `estado_inv` = VALUES(`estado_inv`);


-- 5. VISITAS PROGRAMADAS EN `appvisitasprogramadas`
INSERT INTO `appvisitasprogramadas` (
  `id_vp`, `id_se`, `id_u`, `origen_vp`, `nombre_vp`, `asunto_vp`, `telefono_vp`,
  `tipovisita_vp`, `fechainicial_vp`, `horainicial_vp`, `fechafinal_vp`, `horafinal_vp`,
  `tokenqr_vp`, `qractivo_vp`, `observacionguardia_vp`, `observacionvisitante_vp`, `estado_vp`
) VALUES
(501, 2, 1665, 'web', 'Roberto Sánchez', 'Reunión de Proyectos', '+52 993 444 8811', 'unica', '2026-11-01', '08:00:00', '2026-11-02', '23:59:59', 'HLX-VISIT-894A', 'y', 'Placas: WSR-4421', 'Presentar código en tótem', 'activo'),
(502, 2, 1665, 'web', 'Técnico de Fibra Telmex', 'Instalación de Servicio', '+52 993 111 2233', 'unica', '2026-11-01', '10:00:00', '2026-11-01', '18:00:00', 'HLX-VISIT-TELMEX', 'y', 'Placas: WSA-9011', 'Lleva escalera y herramientas', 'activo'),
(503, 2, 1667, 'web', 'Dra. Carmen Villalobos', 'Visita Médica Familiar', '+52 993 888 9900', 'periodo', '2026-11-01', '07:00:00', '2026-11-05', '20:00:00', 'HLX-VISIT-CARMEN', 'y', 'Placas: VHK-9920', 'Pase frecuente autorizado', 'activo')
ON DUPLICATE KEY UPDATE
  `nombre_vp` = VALUES(`nombre_vp`),
  `tokenqr_vp` = VALUES(`tokenqr_vp`),
  `estado_vp` = VALUES(`estado_vp`);


-- 6. EVENTOS DE BITÁCORA EN `apphistorialaccesos`
INSERT INTO `apphistorialaccesos` (
  `id_ha`, `tipo_ha`, `id_se`, `id_ur`, `id_uguardia_ha`, `id_vp`,
  `resultado_ha`, `motivo_ha`, `movimiento_ha`, `fecha_ha`, `activo_ha`
) VALUES
(201, 'usuario', 2, 1665, 721, 0, 'permitido', 'Usuario activo', 'entrada', '2026-10-31 15:42:10', 'y'),
(202, 'visita', 2, 1665, 721, 501, 'permitido', 'QR activo de visita', 'entrada', '2026-10-31 15:20:00', 'y'),
(203, 'visita', 2, 1665, 721, 502, 'denegado', 'QR expirado en horario', 'entrada', '2026-10-31 14:55:18', 'y'),
(204, 'usuario', 2, 1665, 721, 0, 'permitido', 'Salida de residente', 'salida', '2026-10-31 14:10:05', 'y'),
(205, 'usuario', 2, 1666, 721, 0, 'denegado', 'Acceso suspendido por mora', 'entrada', '2026-10-31 11:15:22', 'y')
ON DUPLICATE KEY UPDATE
  `resultado_ha` = VALUES(`resultado_ha`),
  `movimiento_ha` = VALUES(`movimiento_ha`);


-- 7. CUOTAS CONDOMINALES EN `appcuotas`
INSERT INTO `appcuotas` (
  `id_cuo`, `id_se`, `id_u`, `concepto_cuo`, `tipo_cuo`, `monto_cuo`, `fechavencimiento_cuo`, `estado_cuo`, `fechageneracion_cuo`
) VALUES
(1, 2, 1665, 'Mantenimiento Mensual Noviembre 2026', 'ordinaria', 1850.00, '2026-11-10', 'pendiente', '2026-11-01 00:00:00'),
(2, 2, 1665, 'Mantenimiento Mensual Octubre 2026', 'ordinaria', 1850.00, '2026-10-10', 'pagada', '2026-10-01 00:00:00'),
(3, 2, 1666, 'Mantenimiento Mensual Octubre 2026', 'ordinaria', 1850.00, '2026-10-10', 'vencida', '2026-10-01 00:00:00'),
(4, 2, 1666, 'Mantenimiento Mensual Septiembre 2026', 'ordinaria', 1850.00, '2026-09-10', 'vencida', '2026-09-01 00:00:00'),
(5, 2, 1668, 'Mantenimiento Mensual Agosto 2026', 'ordinaria', 1850.00, '2026-08-10', 'vencida', '2026-08-01 00:00:00'),
(6, 2, 1668, 'Mantenimiento Mensual Septiembre 2026', 'ordinaria', 1850.00, '2026-09-10', 'vencida', '2026-09-01 00:00:00'),
(7, 2, 1668, 'Mantenimiento Mensual Octubre 2026', 'ordinaria', 1850.00, '2026-10-10', 'vencida', '2026-10-01 00:00:00'),
(8, 2, 1667, 'Renta Palapa & Asador de Convivencia', 'amenidad', 650.00, '2026-11-05', 'pagada', '2026-11-01 10:00:00')
ON DUPLICATE KEY UPDATE
  `concepto_cuo` = VALUES(`concepto_cuo`),
  `monto_cuo` = VALUES(`monto_cuo`),
  `estado_cuo` = VALUES(`estado_cuo`);


-- 8. PAGOS Y RECIBOS VALIDADOS EN `apppagos`
INSERT INTO `apppagos` (
  `id_pag`, `id_cuo`, `id_u`, `id_ua`, `folio_pag`, `monto_pag`, `metodo_pag`,
  `referencia_pag`, `comprobante_url_pag`, `fechapago_pag`, `estado_pag`, `notas_pag`, `fecharegistro_pag`
) VALUES
(1, 2, 1665, 1652, 'REC-2026-00084', 1850.00, 'transferencia', 'SPEI-BBVA-7829104', 'recibos/rec_00084.pdf', '2026-10-05 11:22:15', 'verificado', 'Pago puntual con transferencia bancaria SPEI', '2026-10-05 11:30:00'),
(2, 8, 1667, 1652, 'REC-2026-00109', 650.00, 'efectivo', 'REC-CAJA-044', 'recibos/rec_00109.pdf', '2026-11-01 14:00:00', 'verificado', 'Liquidación en caseta de vigilancia para evento', '2026-11-01 14:05:00')
ON DUPLICATE KEY UPDATE
  `folio_pag` = VALUES(`folio_pag`),
  `monto_pag` = VALUES(`monto_pag`),
  `estado_pag` = VALUES(`estado_pag`);

