# Regla de Interfaz de Usuario: Ventanas Emergentes, Diálogos y Modales

## Principio General
Toda interacción que requiera confirmación, aviso, alerta de error o captura de datos debe mantener estrictamente la identidad visual, colores y tipografía del sistema de diseño HEYLEX.

## Directrices Obligatorias
1. **Prohibición de Diálogos Nativos:**
   - Queda estrictamente prohibido utilizar `window.alert()`, `window.confirm()` y `window.prompt()`.
   - Estas funciones nativas rompen la experiencia de usuario y muestran encabezados genéricos del navegador como `"localhost dice:"`.

2. **Uso Obligatorio de `HeylexUI`:**
   - Para avisos y errores: Utilizar `HeylexUI.alert({ title, message, type })`.
   - Para confirmaciones destructivas o de acción: Utilizar `await HeylexUI.confirm({ title, message, confirmText, cancelText, isDestructive })`.
   - Para notificaciones efímeras: Utilizar el sistema de Toast flotante (`HeylexUI.toast()` o `window.showToast()`).

3. **Estándares Visuales de los Modales:**
   - **Backdrop:** Fondo translúcido `bg-primary/80` con desenfoque de fondo `backdrop-blur-md`.
   - **Tarjeta:** Fondo blanco `bg-surface-container-lowest`, esquinas redondeadas `rounded-2xl`, borde sutil `border border-outline-variant/30` y sombra profunda `shadow-2xl`.
   - **Cabecera:** Icono distintivo según el tipo de acción (verde lima `#d4f034` para éxito/información, rojo `error-container` para acciones destructivas).
   - **Tipografía:** Familia `Montserrat, sans-serif`.
   - **Botones:** Botón primario con fondo `bg-primary` y texto en `#d4f034`, o `bg-error` para cancelaciones definitivas; botón secundario neutro con borde `border-gray-300`.

