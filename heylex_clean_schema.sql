-- ==============================================================================
-- HEYLEX SECURITY PLATFORM - BASE DE DATOS LIGERA, MODERNA Y OPTIMIZADA
-- Compatible con: MySQL 5.7+ / MariaDB 10.3+ / MySQL 8.0+
-- Base de Datos: seteinc_app
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `seteinc_app` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `seteinc_app`;

-- ==============================================================================
-- 1. ESTRUCTURAS DE TABLAS (14 TABLAS ESENCIALES)
-- ==============================================================================

-- Estructura: `adjuntos`
--
-- Base de datos: `seteinc_app`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `adjuntos`
--

CREATE TABLE `adjuntos` (
  `id_ad` double UNSIGNED NOT NULL,
  `id_re` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Reporte',
  `id_co` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Comentario',
  `id_mo` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Movimiento',
  `id_rg` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Resguardo',
  `id_u` double UNSIGNED NOT NULL COMMENT 'ID Usuario',
  `id_com` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Comunicado',
  `documento_ad` enum('y','n') NOT NULL DEFAULT 'n',
  `pdf_ad` enum('y','n') NOT NULL DEFAULT 'n',
  `nombre_ad` varchar(255) NOT NULL,
  `archivo_ad` varchar(255) NOT NULL,
  `directorio_ad` varchar(255) NOT NULL,
  `fecha_ad` datetime NOT NULL DEFAULT current_timestamp(),
  `activo_ad` enum('y','n') NOT NULL DEFAULT 'y',
  `idalta_ad` double UNSIGNED NOT NULL DEFAULT 0,
  `fechaalta_ad` datetime NOT NULL DEFAULT current_timestamp(),
  `idmodif_ad` double UNSIGNED DEFAULT NULL,
  `fechamodif_ad` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Estructura: `appcomunicados`
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `appcomunicados`
--

CREATE TABLE `appcomunicados` (
  `id_com` double UNSIGNED NOT NULL COMMENT 'ID Comunicado',
  `id_se` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Servicio',
  `id_ua` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Usuario autor',
  `origen_com` enum('web','androidapp','iosapp') NOT NULL DEFAULT 'web',
  `titulo_com` varchar(100) NOT NULL,
  `contenido_com` text NOT NULL,
  `tipo_com` enum('general','aviso','finanzas','seguridad') NOT NULL DEFAULT 'general',
  `prioridad_com` enum('baja','normal','alta','urgente') NOT NULL DEFAULT 'normal',
  `requiereconfirmacion_com` enum('y','n') NOT NULL DEFAULT 'n',
  `fecha_com` datetime NOT NULL DEFAULT current_timestamp(),
  `fechavigencia_com` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `audiencia_com` enum('todos','residentes','administradores','personal') NOT NULL DEFAULT 'todos',
  `estado_com` enum('borrador','pendiente','activo','publicado','cancelado','archivado','expirado') NOT NULL DEFAULT 'borrador',
  `activo_com` enum('y','n') NOT NULL DEFAULT 'y',
  `idalta_com` double UNSIGNED NOT NULL DEFAULT 0,
  `fechaalta_com` datetime NOT NULL DEFAULT current_timestamp(),
  `idmodif_com` double UNSIGNED DEFAULT NULL,
  `fechamodif_com` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Estructura: `appcomunidades`
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `appcomunidades`
--

CREATE TABLE `appcomunidades` (
  `id_com` double UNSIGNED NOT NULL COMMENT 'ID Comunidad',
  `id_li` double UNSIGNED NOT NULL DEFAULT 0,
  `codigo_li` varchar(255) NOT NULL,
  `nombre_com` varchar(50) NOT NULL DEFAULT '',
  `descripcion_com` varchar(255) NOT NULL DEFAULT '',
  `ubicacion_com` varchar(50) NOT NULL DEFAULT '',
  `tipo_com` enum('fraccionamiento','condominio','estacionamiento','fabrica','residencial','edificio') NOT NULL DEFAULT 'fraccionamiento',
  `activo_com` enum('y','n') NOT NULL DEFAULT 'y',
  `idalta_com` double UNSIGNED NOT NULL DEFAULT 0,
  `fechaalta_com` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `idmodif_com` double UNSIGNED DEFAULT NULL,
  `fechamodif_com` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Estructura: `apphistorialaccesos`
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `apphistorialaccesos`
--

CREATE TABLE `apphistorialaccesos` (
  `id_ha` double UNSIGNED NOT NULL COMMENT 'ID historial acceso',
  `tipo_ha` enum('usuario','residente','visita','desconocido') NOT NULL DEFAULT 'usuario',
  `id_se` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Servicio',
  `id_ur` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Usuario Residente',
  `id_ug` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Usuario Guardia',
  `id_vp` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Visita Programada',
  `resultado_ha` enum('permitido','denegado') NOT NULL DEFAULT 'permitido',
  `motivo_ha` varchar(255) NOT NULL DEFAULT '',
  `movimiento_ha` enum('entrada','salida') NOT NULL DEFAULT 'entrada',
  `fecha_ha` datetime NOT NULL DEFAULT current_timestamp(),
  `id_uguardia_ha` double UNSIGNED NOT NULL DEFAULT 0,
  `activo_ha` enum('y','n') NOT NULL DEFAULT 'y',
  `idalta_ha` double UNSIGNED NOT NULL DEFAULT 0,
  `fechaalta_ha` datetime NOT NULL DEFAULT current_timestamp(),
  `idmodif_ha` double UNSIGNED DEFAULT NULL,
  `fechamodif_ha` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Estructura: `appinvitaciones`
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `appinvitaciones`
--

CREATE TABLE `appinvitaciones` (
  `id_inv` bigint(20) UNSIGNED NOT NULL COMMENT 'ID Invitacion',
  `id_se` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Servicio',
  `id_uc` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Usuario Creador',
  `origen_inv` enum('web','androidapp','iosapp') NOT NULL DEFAULT 'web',
  `tipo_inv` enum('residente','administrador') NOT NULL DEFAULT 'residente',
  `invitacion_inv` varchar(50) NOT NULL,
  `usosmaximos_inv` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `usosactuales_inv` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `fechacreacion_inv` date NOT NULL DEFAULT '0000-00-00',
  `fechavencimiento_inv` date NOT NULL DEFAULT '0000-00-00',
  `estado_inv` enum('activo','inactivo','expirado') NOT NULL DEFAULT 'activo',
  `activo_inv` enum('y','n') NOT NULL DEFAULT 'y',
  `idalta_inv` double UNSIGNED NOT NULL DEFAULT 0,
  `fechaalta_inv` datetime NOT NULL DEFAULT current_timestamp(),
  `idmodif_inv` double UNSIGNED DEFAULT NULL,
  `fechamodif_inv` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Estructura: `applicencias`
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `applicencias`
--

CREATE TABLE `applicencias` (
  `id_li` double UNSIGNED NOT NULL COMMENT 'ID Licencia',
  `id_cl` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Cliente',
  `id_se` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Servicio',
  `tipo_li` enum('standard','pro','enterprise','trial','demo','suscripcion','educativa') NOT NULL DEFAULT 'trial',
  `clave_li` varchar(255) NOT NULL,
  `validarchecksum_li` enum('y','n') NOT NULL DEFAULT 'y',
  `fechacreacion_li` date NOT NULL DEFAULT '0000-00-00',
  `fechaactivacion_li` date NOT NULL DEFAULT '0000-00-00',
  `fechavencimiento_li` date NOT NULL DEFAULT '0000-00-00',
  `estado_li` enum('activo','inactivo','expirado') NOT NULL DEFAULT 'activo',
  `maximasactivaciones_li` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `activacionesactuales_li` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `activo_li` enum('y','n') NOT NULL DEFAULT 'y',
  `idalta_li` double UNSIGNED NOT NULL DEFAULT 0,
  `fechaalta_li` datetime NOT NULL DEFAULT current_timestamp(),
  `idmodif_li` double DEFAULT NULL,
  `fechamodif_li` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Estructura: `apprecursos`
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `apprecursos`
--

CREATE TABLE `apprecursos` (
  `id_rec` double UNSIGNED NOT NULL COMMENT 'ID Recurso',
  `id_se` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Servicio',
  `id_cl` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Cliente',
  `nombre_rec` varchar(100) NOT NULL DEFAULT '',
  `descripcion_rec` varchar(255) NOT NULL,
  `tipo_rec` enum('Equipo','Inmueble','Mobiliario','Otro') NOT NULL,
  `capacidad_rec` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `costo_rec` decimal(10,4) UNSIGNED NOT NULL DEFAULT 0.0000,
  `estado_rec` enum('disponible','mantenimiento','inactivo') NOT NULL,
  `activo_rec` enum('y','n') NOT NULL DEFAULT 'y',
  `idalta_rec` double UNSIGNED NOT NULL DEFAULT 0,
  `fechalta_rec` datetime NOT NULL DEFAULT current_timestamp(),
  `idmodif_rec` double UNSIGNED DEFAULT NULL,
  `fechamodif_rec` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Estructura: `appvisitasprogramadas`
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `appvisitasprogramadas`
--

CREATE TABLE `appvisitasprogramadas` (
  `id_vp` double UNSIGNED NOT NULL COMMENT 'ID Visita Programada',
  `id_se` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Servicio',
  `id_u` double UNSIGNED NOT NULL DEFAULT 0,
  `origen_vp` enum('web','androidapp','iosapp') NOT NULL DEFAULT 'web',
  `nombre_vp` varchar(100) NOT NULL DEFAULT '',
  `asunto_vp` varchar(255) NOT NULL,
  `telefono_vp` varchar(20) NOT NULL DEFAULT '',
  `tipovisita_vp` enum('unica','periodo') NOT NULL DEFAULT 'unica',
  `fechainicial_vp` date NOT NULL DEFAULT '0000-00-00',
  `horainicial_vp` time NOT NULL DEFAULT '00:00:00',
  `fechafinal_vp` date NOT NULL DEFAULT '0000-00-00',
  `horafinal_vp` time NOT NULL DEFAULT '00:00:00',
  `tokenqr_vp` varchar(50) NOT NULL DEFAULT '',
  `qractivo_vp` enum('y','n') NOT NULL DEFAULT 'y',
  `observacionguardia_vp` text NOT NULL DEFAULT '',
  `observacionvisitante_vp` text NOT NULL DEFAULT '',
  `fechaexpiracion_qr` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `estado_vp` enum('pendiente','activo','usado','expirado','cancelado') NOT NULL DEFAULT 'pendiente',
  `idalta_vp` double UNSIGNED NOT NULL DEFAULT 0,
  `fechaalta_vp` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `idmodif_vp` double UNSIGNED DEFAULT NULL,
  `fechamodif_vp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Estructura: `roles`
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_ro` double UNSIGNED NOT NULL,
  `rol_ro` varchar(50) NOT NULL DEFAULT '',
  `descripcion_ro` varchar(255) NOT NULL DEFAULT '',
  `activo_ro` enum('y','n') NOT NULL DEFAULT 'y',
  `fechaalta_ro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Estructura: `servicios`
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id_se` double UNSIGNED NOT NULL,
  `id_cl` double UNSIGNED NOT NULL COMMENT 'ID Cliente',
  `id_li` double UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ID Licencia',
  `id_zo` double UNSIGNED NOT NULL DEFAULT 0,
  `nombre_se` varchar(50) NOT NULL DEFAULT '',
  `telefono_se` varchar(255) NOT NULL DEFAULT '',
  `compania_se` varchar(50) NOT NULL,
  `activo_se` enum('y','n') NOT NULL DEFAULT 'y',
  `orden_se` int(10) UNSIGNED NOT NULL DEFAULT 1000,
  `idalta_se` double UNSIGNED NOT NULL DEFAULT 0,
  `fechaalta_se` datetime NOT NULL DEFAULT current_timestamp(),
  `idmodif_se` double UNSIGNED DEFAULT NULL,
  `fechamodif_se` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Estructura: `serviciosusuarios`
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `serviciosusuarios`
--

CREATE TABLE `serviciosusuarios` (
  `id_us` double UNSIGNED NOT NULL,
  `id_se` double UNSIGNED NOT NULL COMMENT 'ID Servicio',
  `id_u` double UNSIGNED NOT NULL COMMENT 'ID Usuario',
  `id_su` double UNSIGNED NOT NULL COMMENT 'ID Supervisor',
  `entrada_us` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `salida_us` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `idalta_us` double UNSIGNED NOT NULL DEFAULT 0,
  `fechaalta_su` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `idmodif_su` double UNSIGNED DEFAULT NULL,
  `fechamodif_su` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Tabla: usuarios (Padrón Residencial y Personal de Vigilancia HEYLEX)
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_u` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_ro` int(10) unsigned NOT NULL DEFAULT 5 COMMENT '3: Guardia, 4: Admin, 5: Residente',
  `id_eu` int(10) unsigned NOT NULL DEFAULT 1 COMMENT '1: Activo, 3: Suspendido por mora',
  `email_u` varchar(100) NOT NULL,
  `pasword_u` varchar(255) NOT NULL DEFAULT '',
  `tokenqr_u` varchar(100) NOT NULL DEFAULT '',
  `qractivo_u` enum('y','n') NOT NULL DEFAULT 'y',
  `nombre_u` varchar(60) NOT NULL DEFAULT '',
  `apaterno_u` varchar(60) NOT NULL DEFAULT '',
  `amaterno_u` varchar(60) NOT NULL DEFAULT '',
  `sexo_u` enum('h','m') NOT NULL DEFAULT 'h',
  `telefonomovil_u` varchar(30) NOT NULL DEFAULT '',
  `telefonocasa_u` varchar(30) NOT NULL DEFAULT '',
  `colonia_u` varchar(100) NOT NULL DEFAULT '',
  `calle_u` varchar(100) NOT NULL DEFAULT '',
  `numero_u` varchar(20) NOT NULL DEFAULT '',
  `numerointerior_u` varchar(20) NOT NULL DEFAULT '',
  `activo_u` enum('y','n') NOT NULL DEFAULT 'y',
  `fecharegistro_u` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_u`),
  UNIQUE KEY `idx_usuario_email` (`email_u`),
  KEY `idx_usuario_rol` (`id_ro`),
  KEY `idx_usuario_estatus` (`id_eu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Padrón de usuarios HEYLEX';

-- ==============================================================================
-- 2. CLAVES PRIMARIAS E ÍNDICES
-- ==============================================================================
--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `adjuntos`
--
ALTER TABLE `adjuntos`
  ADD PRIMARY KEY (`id_ad`);
--
-- Indices de la tabla `appcomunicados`
--
ALTER TABLE `appcomunicados`
  ADD PRIMARY KEY (`id_com`);
--
-- Indices de la tabla `appcomunidades`
--
ALTER TABLE `appcomunidades`
  ADD PRIMARY KEY (`id_com`),
  ADD UNIQUE KEY `codigo` (`codigo_li`);
--
-- Indices de la tabla `apphistorialaccesos`
--
ALTER TABLE `apphistorialaccesos`
  ADD PRIMARY KEY (`id_ha`);
--
-- Indices de la tabla `appinvitaciones`
--
ALTER TABLE `appinvitaciones`
  ADD PRIMARY KEY (`id_inv`);
--
-- Indices de la tabla `applicencias`
--
ALTER TABLE `applicencias`
  ADD PRIMARY KEY (`id_li`),
  ADD UNIQUE KEY `codigo` (`clave_li`);
--
-- Indices de la tabla `apprecursos`
--
ALTER TABLE `apprecursos`
  ADD PRIMARY KEY (`id_rec`);
--
-- Indices de la tabla `appvisitasprogramadas`
--
ALTER TABLE `appvisitasprogramadas`
  ADD PRIMARY KEY (`id_vp`);
--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_ro`);
--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id_se`),
  ADD UNIQUE KEY `nombre_se` (`nombre_se`);
--
-- Indices de la tabla `serviciosusuarios`
--
ALTER TABLE `serviciosusuarios`
  ADD PRIMARY KEY (`id_us`);
--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `adjuntos`
--
ALTER TABLE `adjuntos`
  MODIFY `id_ad` double UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=712;
--
-- AUTO_INCREMENT de la tabla `appcomunicados`
--
ALTER TABLE `appcomunicados`
  MODIFY `id_com` double UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID Comunicado', AUTO_INCREMENT=28;
--
-- AUTO_INCREMENT de la tabla `appcomunidades`
--
ALTER TABLE `appcomunidades`
  MODIFY `id_com` double UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID Comunidad';
--
-- AUTO_INCREMENT de la tabla `apphistorialaccesos`
--
ALTER TABLE `apphistorialaccesos`
  MODIFY `id_ha` double UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID historial acceso', AUTO_INCREMENT=60;
--
-- AUTO_INCREMENT de la tabla `appinvitaciones`
--
ALTER TABLE `appinvitaciones`
  MODIFY `id_inv` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID Invitacion', AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT de la tabla `applicencias`
--
ALTER TABLE `applicencias`
  MODIFY `id_li` double UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID Licencia', AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT de la tabla `apprecursos`
--
ALTER TABLE `apprecursos`
  MODIFY `id_rec` double UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID Recurso', AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT de la tabla `appvisitasprogramadas`
--
ALTER TABLE `appvisitasprogramadas`
  MODIFY `id_vp` double UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID Visita Programada', AUTO_INCREMENT=18;
--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_ro` double UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id_se` double UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;
--
-- AUTO_INCREMENT de la tabla `serviciosusuarios`
--
ALTER TABLE `serviciosusuarios`
  MODIFY `id_us` double UNSIGNED NOT NULL AUTO_INCREMENT;

-- ==============================================================================
-- 3. CATÁLOGOS BASE Y SERVICIOS RESIDENCIALES
-- ==============================================================================
INSERT INTO `servicios` (`id_se`, `id_cl`, `id_li`, `id_zo`, `nombre_se`, `telefono_se`, `compania_se`, `activo_se`, `orden_se`, `idalta_se`, `fechaalta_se`, `idmodif_se`, `fechamodif_se`) VALUES
(1, 1, 0, 1, 'Fraccionamiento Residencial Modelo', '9931234567', '', 'y', 1, 1, NOW(), NULL, NULL),
(2, 2, 0, 1, 'Residencial Cumbres Del Ángel', '529933784115', '', 'y', 2, 1, NOW(), NULL, NULL);
--
-- Volcado de datos para la tabla `adjuntos`
--

INSERT INTO `adjuntos` VALUES(1, 0, 11, 0, 0, 3, 0, 'n', 'n', 'image', 'p_1660071910.jpg', 'imagenes/', '2022-08-09 15:05:12', 'y', 0, '2022-08-09 15:05:12', NULL, NULL);
INSERT INTO `adjuntos` VALUES(2, 0, 0, 0, 0, 56, 0, 'n', 'n', '16603336599612803771304947018706', 'p_1660333670.jpg', 'imagenes/', '2022-08-12 15:47:51', 'y', 0, '2022-08-12 15:47:51', NULL, NULL);
INSERT INTO `adjuntos` VALUES(3, 0, 16, 0, 0, 56, 0, 'n', 'n', '16603341027622510690025533701600', 'p_1660334116.jpg', 'imagenes/', '2022-08-12 15:55:16', 'y', 0, '2022-08-12 15:55:16', NULL, NULL);
INSERT INTO `adjuntos` VALUES(4, 0, 19, 0, 0, 3, 0, 'n', 'n', 'image', 'p_1660346866.jpg', 'imagenes/', '2022-08-12 19:27:47', 'y', 0, '2022-08-12 19:27:47', NULL, NULL);
INSERT INTO `adjuntos` VALUES(5, 0, 0, 0, 0, 0, 0, 'n', 'n', '16605291095793007779833415112637', 'p_1660529124.jpg', 'imagenes/', '2022-08-14 22:05:25', 'y', 0, '2022-08-14 22:05:25', NULL, NULL);
INSERT INTO `adjuntos` VALUES(6, 0, 0, 0, 0, 0, 0, 'n', 'n', '16605291293991885824616582143268', 'p_1660529138.jpg', 'imagenes/', '2022-08-14 22:05:39', 'y', 0, '2022-08-14 22:05:39', NULL, NULL);
INSERT INTO `adjuntos` VALUES(7, 0, 36, 0, 0, 93, 0, 'n', 'n', '16637966198511229739330192035198', 'p_1663796694.jpg', 'imagenes/', '2022-09-21 17:44:57', 'y', 0, '2022-09-21 17:44:57', NULL, NULL);
INSERT INTO `adjuntos` VALUES(679, 0, 0, 0, 0, 2, 0, 'y', 'n', 'foto 01', 'doc_1763969227.png', 'imagenes/', '2025-11-24 02:27:07', 'y', 0, '2025-11-24 02:27:07', NULL, NULL);
INSERT INTO `adjuntos` VALUES(680, 0, 0, 0, 0, 2, 0, 'y', 'n', 'foto 02', 'doc_1763969234.png', 'imagenes/', '2025-11-24 02:27:14', 'y', 0, '2025-11-24 02:27:14', NULL, NULL);
INSERT INTO `adjuntos` VALUES(681, 0, 0, 0, 0, 2, 0, 'y', 'y', 'PDF 01', 'doc_1763969243.pdf', 'imagenes/', '2025-11-24 02:27:23', 'y', 0, '2025-11-24 02:27:23', NULL, NULL);
INSERT INTO `adjuntos` VALUES(682, 0, 0, 0, 0, 2, 0, 'y', 'y', 'PDF 02', 'doc_1763969287.pdf', 'imagenes/', '2025-11-24 02:28:07', 'y', 0, '2025-11-24 02:28:07', NULL, NULL);
INSERT INTO `adjuntos` VALUES(683, 0, 0, 0, 0, 2, 1, 'n', 'n', 'IMG_1763437732', 'comunicado_1763437732.png', 'imagenes/', '2026-03-01 14:49:17', 'y', 2, '2026-03-01 14:49:17', NULL, NULL);
INSERT INTO `adjuntos` VALUES(684, 0, 0, 0, 0, 2, 1, 'n', 'n', 'IMG_1763437735', 'comunicado_1763437735.png', 'imagenes/', '2026-03-01 14:49:17', 'y', 2, '2026-03-01 14:49:17', NULL, NULL);
INSERT INTO `adjuntos` VALUES(685, 0, 0, 0, 0, 2, 1, 'n', 'n', 'IMG_1763437737', 'comunicado_1763437737.png', 'imagenes/', '2026-03-01 14:52:27', 'y', 2, '2026-03-01 14:52:27', NULL, NULL);
INSERT INTO `adjuntos` VALUES(686, 0, 0, 0, 0, 2, 1, 'n', 'n', 'IMG_1763437740', 'comunicado_1763437740.png', 'imagenes/', '2026-03-01 14:52:27', 'y', 2, '2026-03-01 14:52:27', NULL, NULL);
INSERT INTO `adjuntos` VALUES(687, 0, 0, 0, 0, 1652, 3, 'n', 'n', 'imagen_1777271443929', 'comunicado_1777271447.jpg', 'imagenes/', '2026-04-27 02:30:48', 'y', 1652, '2026-04-27 00:30:47', NULL, NULL);
INSERT INTO `adjuntos` VALUES(688, 0, 0, 0, 0, 1652, 6, 'n', 'n', 'FOTO_102', 'comunicado_1778489914.png', 'imagenes/', '2026-05-11 04:58:34', 'y', 1652, '2026-05-11 02:58:34', NULL, NULL);
INSERT INTO `adjuntos` VALUES(689, 0, 0, 0, 0, 1652, 6, 'n', 'n', 'FOTO_103', 'comunicado_1778489915.png', 'imagenes/', '2026-05-11 04:58:35', 'y', 1652, '2026-05-11 02:58:34', NULL, NULL);
INSERT INTO `adjuntos` VALUES(710, 0, 0, 0, 0, 1652, 22, 'n', 'n', '', 'comunicado_1781083877.jpg', 'imagenes/', '2026-06-10 05:31:17', 'y', 1652, '2026-06-10 03:31:17', NULL, NULL);
INSERT INTO `adjuntos` VALUES(711, 0, 0, 0, 0, 1652, 22, 'n', 'n', '', 'comunicado_1781083878.jpg', 'imagenes/', '2026-06-10 05:31:18', 'y', 1652, '2026-06-10 03:31:18', NULL, NULL);
--
-- Volcado de datos para la tabla `appcomunicados`
--

INSERT INTO `appcomunicados` VALUES(1, 2, 1652, 'androidapp', 'AVISO: Mantenimiento de áreas comunes y jornada de limpieza', 'Estimados vecinos del Fraccionamiento [Nombre del Fraccionamiento],\n\nReciban un cordial saludo de parte de la Administración.\n\nPor medio de la presente, queremos informarles que el próximo lunes 27 de abril, se llevarán a cabo labores de mantenimiento preventivo y limpieza profunda en nuestras áreas comunes, incluyendo la zona de juegos infantiles y la casa club.\n\nHorario de trabajos: 08:00 a 16:00 horas.\n\nSolicitud: Les pedimos de la manera más atenta retirar vehículos o pertenencias personales de dichas áreas antes de la fecha mencionada.\n\nEstas acciones son vitales para mantener la plusvalía y el buen estado de nuestro fraccionamiento. Agradecemos su colaboración y paciencia ante los inconvenientes menores que esto pueda generar.\n\nAtentamente,\n[Nombre del Administrador/a]\nAdministración Fraccionamiento [Nombre]\n[Teléfono/Correo de contacto]\n[Fecha de acuerdo]', 'aviso', 'normal', 'y', '2026-04-25 02:07:32', '0000-00-00 00:00:00', 'todos', 'publicado', 'y', 1652, '2026-04-25 02:07:32', NULL, NULL);
INSERT INTO `appcomunicados` VALUES(2, 2, 1652, 'androidapp', 'RECOMENDACIONES DE SEGURIDAD - Ingreso de visitas', 'A toda la comunidad,\n\nCon el objetivo de reforzar la seguridad en nuestro fraccionamiento, la Administración y el Comité de Vigilancia solicitan su apoyo con las siguientes medidas, especialmente ante el aumento de actividades en la zona:\n\nRegistro Previo: Todo residente debe notificar al personal de caseta sobre la llegada de visitas, proveedores o servicios de entrega (delivery) con antelación.\n\nIdentificación: Se solicitará identificación oficial en caseta a toda persona ajena al fraccionamiento, sin excepciones.\n\nVelocidad: Recordamos que el límite de velocidad dentro del fraccionamiento es de 20 km/h.\n\nLa seguridad es tarea de todos. Si detectan personas o vehículos sospechosos, por favor repórtenlo inmediatamente al personal de seguridad.\n\nAtentamente,\n\nLa Administración\nFecha de acuerdo: 25/04/2026', 'seguridad', 'alta', 'y', '2026-04-25 17:47:43', '0000-00-00 00:00:00', 'todos', 'publicado', 'y', 1652, '2026-04-25 17:46:43', 1652, '2026-04-25 17:47:43');
INSERT INTO `appcomunicados` VALUES(3, 2, 1652, 'androidapp', 'Recordatorio: Pago de cuotas de mantenimiento [Mes/Año]', 'Estimado/a propietario/a,\n\nEsperando que se encuentre bien, le recordamos que el pago correspondiente a la cuota de mantenimiento del mes de [Mes] vence el próximo [Fecha límite, ej. día 10 del mes].\n\nSu pago puntual nos permite cubrir los servicios de seguridad 24/7, alumbrado, recolección de basura y mantenimiento de jardines.\n\nMonto: $[Cantidad]\nMétodos de pago: [Transferencia, depósito, efectivo en caseta]\nCuenta: [Datos bancarios]\nImportante: Por favor enviar su comprobante al correo: [Correo electrónico]\n\nSi usted ya realizó su pago, agradecemos omita este mensaje.\n\nAtentamente,\n\n[Nombre del Administrador/a]\nAdministración Fraccionamiento [Nombre]', 'finanzas', 'normal', 'y', '2026-04-27 00:30:45', '0000-00-00 00:00:00', 'todos', 'publicado', 'y', 1652, '2026-04-27 00:30:45', NULL, NULL);
INSERT INTO `appcomunicados` VALUES(23, 2, 1681, 'androidapp', 'Eventos y reuniones', 'Favor de dar aviso a vigilancia y entregar lista con nombres de sus invitados para evitar se de acceso a personas que en realidad no están invitados', 'seguridad', 'normal', 'y', '2026-08-07 21:35:23', '0000-00-00 00:00:00', 'todos', 'publicado', 'y', 1681, '2026-08-07 21:35:23', NULL, NULL);
INSERT INTO `appcomunicados` VALUES(24, 2, 1652, 'androidapp', 'COMUNICADO OFICIAL No. 05/2026', 'Fraccionamiento: [Nombre del Fraccionamiento]\nFecha: 1 de octubre de 2026\nPara: Residentes, propietarios y arrendatarios\nAsunto: Mantenimiento de áreas verdes y recordatorio sobre el uso de espacios comunes\n\nEstimados vecinos,\nEsperando que se encuentren muy bien, nos dirigimos a ustedes por este medio para informarles sobre las próximas acciones de mejora y recordar algunas normas básicas para la sana convivencia en nuestro fraccionamiento.\n\n1. Mantenimiento de áreas comunes\nEl próximo lunes 5 de octubre de 2026, el equipo de jardinería y mantenimiento realizará trabajos de poda general, corte de pasto y fumigación preventiva en el parque central y los camellones principales.\n• Horario de los trabajos: De 8:00 a.m. a 3:00 p.m.\n• Recomendación: Les pedimos precaución al transitar por estas zonas y mantener a sus mascotas con correa. Asimismo, les solicitamos retirar cualquier objeto personal o juguetes de los jardines frontales comunes para facilitar las labores.\n\n2. Uso correcto de los contenedores de basura\nHemos notado un incremento de basura fuera de su lugar en el área de los contenedores principales.\n• Les recordamos que las bolsas de basura deben depositarse dentro de los tambos y contenedores cerrados, no a los lados.\n• Los residuos voluminosos (muebles, escombro o ramas grandes) no deben dejarse en la vía pública; cada vecino es responsable de coordinar su recolección especial.\n\n3. Límite de velocidad\nReiteramos que el límite de velocidad máximo permitido dentro del fraccionamiento es de 20 km/h. Por la seguridad de los niños y adultos mayores que caminan por las calles, les pedimos extremar precauciones al conducir.\nAgradecemos de antemano su colaboración para mantener nuestro fraccionamiento limpio, seguro y en orden. Quedamos a su disposición para cualquier duda o reporte a través del correo electrónico administracion@fraccionamiento.com o al WhatsApp de la oficina administrativa [Número de teléfono].\n\nAtentamente,\nLa Administración del Fraccionamiento\n[Nombre del Administrador]', 'general', 'normal', 'y', '2026-10-01 00:42:47', '0000-00-00 00:00:00', 'todos', 'publicado', 'y', 1652, '2026-10-01 00:42:47', NULL, NULL);
INSERT INTO `appcomunicados` VALUES(25, 2, 1702, 'androidapp', 'problema de basura fuera de los botes', 'les deseo un excelente día a todos los vecinos, y a la vez se les pide de favor sacar la basura los días establecidos ya que los perros riegan la basura y da mala imagen a la comunidad. de antemano gracias', 'aviso', 'normal', 'y', '2026-10-14 05:52:44', '0000-00-00 00:00:00', 'todos', 'publicado', 'y', 1702, '2026-10-14 05:52:44', NULL, NULL);
INSERT INTO `appcomunicados` VALUES(26, 2, 1705, 'androidapp', 'Elementos de Seguridad nego acceso a visitante', 'el elemento de seguridad nego acceso a mi visita, argumentando que llegó a la hora de su comida.', 'general', 'urgente', 'y', '2026-10-23 09:00:20', '0000-00-00 00:00:00', 'todos', 'publicado', 'y', 1705, '2026-10-23 09:00:20', NULL, NULL);
INSERT INTO `appcomunicados` VALUES(27, 2, 1708, 'androidapp', 'Mantenimiento areas verdes.', 'Se les informa que el lunes 26 de octubre se les dara mantenimiento a la zona de areas verdes. Favor de tener sus mascotas bajo control y permitan trabajar al personal de mantenimiento sin contratiempos.', 'aviso', 'normal', 'y', '2026-10-24 08:11:32', '0000-00-00 00:00:00', 'todos', 'publicado', 'y', 1708, '2026-10-24 08:11:32', NULL, NULL);
--
-- Volcado de datos para la tabla `applicencias`
--

INSERT INTO `applicencias` VALUES(1, 2, 2, 'standard', 'KD7XM-4Z8PQ-TN6KY-R3V2A-9F4C', 'y', '2026-04-20', '2026-04-20', '0000-00-00', 'activo', 0, 92, 'y', 0, '2026-04-20 09:00:00', 1708, '2026-10-24 07:44:57');
--
-- Volcado de datos para la tabla `apprecursos`
--

INSERT INTO `apprecursos` VALUES(1, 2, 2, 'Salón de fiestas', 'Salón de fiestas para 100 personas', 'Inmueble', 100, 0.0000, 'disponible', 'y', 2, '2026-03-02 04:19:59', NULL, NULL);
INSERT INTO `apprecursos` VALUES(2, 2, 2, 'Cancha de Basquetbol / Voleybol', 'Cancha de Basquetbol / Voleybol', 'Inmueble', 200, 0.0000, 'disponible', 'y', 2, '2026-03-02 04:19:59', NULL, NULL);
INSERT INTO `apprecursos` VALUES(3, 2, 2, 'Alberca', 'Alberca privada', 'Inmueble', 20, 0.0000, 'mantenimiento', 'y', 2, '2026-03-02 04:28:28', NULL, NULL);
INSERT INTO `apprecursos` VALUES(4, 2, 2, 'Asador', 'Asador ', 'Mobiliario', 4, 0.0000, 'disponible', 'y', 0, '2026-03-02 04:28:28', NULL, NULL);
INSERT INTO `apprecursos` VALUES(5, 2, 2, 'Mesas', 'Mesas plegables', 'Mobiliario', 6, 0.0000, 'disponible', 'y', 2, '2026-03-02 04:31:59', NULL, NULL);
INSERT INTO `apprecursos` VALUES(6, 2, 2, 'Cancha de tenis', 'Cancha de tenis', 'Inmueble', 40, 0.0000, 'disponible', 'y', 2, '2026-03-02 16:18:23', NULL, NULL);
--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` VALUES(0, '(Sin rol)', '', 'n', '2022-06-13 11:21:01');
INSERT INTO `roles` VALUES(1, 'Administrativo', 'Personal administrativo', 'y', '2022-06-13 11:21:09');
INSERT INTO `roles` VALUES(2, 'Supervisor', 'Supervisores', 'y', '2022-06-13 11:21:09');
INSERT INTO `roles` VALUES(3, 'Guardia', 'Guardias', 'y', '2022-06-13 11:21:14');
INSERT INTO `roles` VALUES(4, 'Administrador', 'Administrador App', 'y', '2026-02-24 22:02:39');
INSERT INTO `roles` VALUES(5, 'Residente', 'Residente App', 'y', '2026-02-24 22:02:39');

-- ==============================================================================
-- 4. MÓDULO CONTABLE, USUARIOS RESIDENCIALES Y DATOS HEYLEX
-- ==============================================================================
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
INSERT IGNORE INTO `serviciosusuarios` (`id_se`, `id_u`) VALUES
(2, 1665),
(2, 1666),
(2, 1667),
(2, 1668);
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

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
