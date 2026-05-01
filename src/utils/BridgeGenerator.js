/**
 * Utility to generate bridge files for Manager Mode.
 * These files allow the renderit.manager to connect and update data.
 */

export function generateBridgeFiles(siteUrl, version = '1.0.0') {
  const secret = generateSecret();
  const date = new Date().toISOString();
  const origin = new URL(siteUrl).origin;

  return {
    'bridge.php': generatePhpBridge(secret, origin, version, date),
    'bridge.asp': generateAspBridge(secret, origin, version, date),
    '.bridge.env': generateEnvBridge(secret, siteUrl, version, date)
  };
}

/**
 * Generates a cryptographically secure 32-character alphanumeric secret.
 */
function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(32);
  globalThis.crypto.getRandomValues(array);
  
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(array[i] % chars.length);
  }
  return secret;
}

function generatePhpBridge(secret, origin, version, date) {
  return `<?php
/**
 * Renderit Bridge PHP
 * Gerado pelo renderit.builder em ${date}
 * renderit.builder v${version} — Modo Manager
 */

define('BRIDGE_SECRET', '${secret}');
define('ALLOWED_ORIGINS', ['${origin}']);
define('DATA_DIR', __DIR__ . '/data/');
define('BACKUP_DIR', __DIR__ . '/renderit_backups/');

// O bridge-core.php deve estar no mesmo diretório
if (file_exists(__DIR__ . '/bridge-core.php')) {
    require_once __DIR__ . '/bridge-core.php';
} else {
    header('HTTP/1.1 500 Internal Server Error');
    echo "Error: bridge-core.php not found. Please ensure all bridge files are uploaded.";
}
`;
}

function generateAspBridge(secret, origin, version, date) {
  return `<%
' Renderit Bridge ASP (VBScript)
' Gerado pelo renderit.builder em ${date}
' renderit.builder v${version} — Modo Manager

Const BRIDGE_SECRET = "${secret}"
Const ALLOWED_ORIGIN = "${origin}"
Const DATA_DIR = "/data/"
Const BACKUP_DIR = "/renderit_backups/"

' Nota: A lógica de processamento deve estar no arquivo de core equivalente
%>`;
}

function generateEnvBridge(secret, siteUrl, version, date) {
  return `BRIDGE_SECRET=${secret}
BRIDGE_SITE_URL=${siteUrl}
BRIDGE_BUILD_DATE=${date}
BRIDGE_BUILDER_VERSION=${version}
`;
}
