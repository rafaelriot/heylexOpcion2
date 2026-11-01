@echo off
chcp 65001 >nul
title HEYLEX - Servidor Local y Puente Seguro HTTPS
cls

echo =====================================================================
echo           HEYLEX SECURITY PLATFORM - SERVIDOR Y PUENTE MOVIL
echo =====================================================================
echo.

set PHP_BIN=C:\xampp\php\php.exe
if not exist "%PHP_BIN%" (
    where php >nul 2>nul
    if %errorlevel% equ 0 (
        set PHP_BIN=php
    ) else (
        echo [ERROR] No se encontro PHP en C:\xampp\php\php.exe ni en el PATH.
        echo Por favor instala o inicia XAMPP.
        pause
        exit /b 1
    )
)

echo [*] Paso 1: Iniciando servidor PHP en http://0.0.0.0:8000 ...
start "HEYLEX - Servidor PHP Local" /min "%PHP_BIN%" -S 0.0.0.0:8000

echo [*] Servidor PHP activo en http://localhost:8000 y en tu red local.
echo.

if not exist "%~dp0cloudflared.exe" (
    echo [*] Descargando Cloudflare Tunnel para enlace HTTPS seguro en celular...
    curl.exe -L -o "%~dp0cloudflared.exe" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
)

echo [*] Paso 2: Creando puente seguro HTTPS con Cloudflare Tunnel...
echo [*] Este puente permite abrir HEYLEX en celulares (Android / iPhone),
echo     instalar la PWA como app nativa y mantener la sesion abierta.
echo.
echo ---------------------------------------------------------------------
echo Busca la linea que dice:
echo "https://XXXXX.trycloudflare.com"
echo.
echo Abre ese enlace en el navegador de tu celular (Chrome o Safari).
echo ---------------------------------------------------------------------
echo.

"%~dp0cloudflared.exe" tunnel --url http://127.0.0.1:8000

pause
