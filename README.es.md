# 🌐 Web Explorer

**Español 🇪🇸** | [**English 🇺🇸**](README.md)

[![CI](https://github.com/ifrahim07/web-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/ifrahim07/web-explorer/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/package-json/v/ifrahim07/web-explorer)](https://github.com/ifrahim07/web-explorer)
[![License](https://img.shields.io/github/license/ifrahim07/web-explorer)](https://github.com/ifrahim07/web-explorer/blob/master/LICENSE)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-brightgreen?logo=dependabot)](https://github.com/ifrahim07/web-explorer)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.58-2EAD33?logo=playwright)](https://playwright.dev/)

Un explorador web modular que simula el comportamiento de navegación humana usando [Playwright](https://playwright.dev/). Incluye ejecución paralela multi-instancia, identidades aleatorias, rotación de proxies, aceptación automática de cookies y más de 10 tipos de acciones humanas.

## 📋 Requisitos Previos

Elige **una** de las siguientes opciones:

| Opción | Requisitos | Inicio Rápido |
|--------|-----------|---------------|
| **A. Node.js** | [Node.js 18+](https://nodejs.org/) (incluye npm y npx) | `npm install` → `npm start` |
| **B. Docker** | Solo [Docker](https://docker.com/) (no necesita Node.js) | `docker build -t web-explorer .` → `docker run --rm web-explorer` |

## ✨ Características

| Característica | Descripción |
|----------------|-------------|
| 🎭 **Identidad Aleatoria** | Emulación de escritorio, móvil y tablet con user agents, viewports y escala aleatorios |
| 🌍 **Soporte de Idiomas** | Selección ponderada de idioma (80% español, 10% inglés US, 10% inglés UK) con zona horaria |
| 🍪 **Gestor de Cookies** | Detección automática en 3 capas: frameworks conocidos (OneTrust, Cookiebot, etc.) → búsqueda de texto multilingüe → escaneo de iframes |
| 🤖 **Modo Sigiloso** | Sobreescribe `navigator.webdriver`, plugins, idiomas y plataforma para evitar detección de bots |
| 🔒 **Rotación de Proxies** | Carga desde archivo, verificación de salud, rotación round-robin, reemplazo automático |
| 📊 **Informes de Sesión** | Informes por instancia con duración, páginas visitadas, desglose de acciones y lista de URLs |
| ⚡ **Multi-Instancia** | Instancias paralelas con lanzamientos escalonados e identidades independientes |

## 🎬 Módulos de Acción

| Módulo | Acciones | Probabilidad |
|--------|----------|-------------|
| `scroll.ts` | Scroll con rueda del ratón y pausas de lectura | 25% |
| `click.ts` | Clic en elementos interactivos aleatorios | 18% |
| `idle.ts` | Lectura, distracción, scroll lento, movimiento del ratón | 15% |
| `hover.ts` | Hover sobre imágenes, enlaces, botones, cards | 12% |
| `type.ts` | Buscar cajas de búsqueda, escribir con corrección de errores | 8% |
| `back.ts` | Botón de retroceso del navegador con guardas de seguridad | 8% |
| `media.ts` | Reproducir/pausar/silenciar/buscar/pantalla completa | 7% |
| `zoom.ts` | Zoom con teclado, pellizco móvil, ampliar imágenes | 7% |
| `cookies.ts` | Detección y aceptación de cookies | Siempre primero |
| `navigate.ts` | Navegación aleatoria por enlaces internos | Respaldo |

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/your-username/web-explorer.git
cd web-explorer

# Instalar dependencias
npm install

# Instalar navegadores de Playwright
npx playwright install chromium
```

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor, lee nuestra [Guía de Contribución](CONTRIBUTING.md) (en inglés) para empezar.

## ⚙️ Configuración

Todos los ajustes se gestionan desde `explorer.config.json`:

```json
{
  "url": "https://ejemplo.com",
  "instances": 3,
  "minPages": 5,
  "maxPages": 15,
  "minDuration": 60,
  "maxDuration": 180,
  "minActionsPerPage": 2,
  "maxActionsPerPage": 6,
  "headless": false,
  "browser": "chromium",
  "proxiesFile": "proxies.txt",
  "logLevel": "info"
}
```

| Clave | Tipo | Por defecto | Descripción |
|-------|------|-------------|-------------|
| `url` | string | — | **Obligatorio.** URL objetivo a explorar |
| `instances` | number | 2 | Instancias paralelas del navegador |
| `minPages` / `maxPages` | number | 5 / 10 | Rango de páginas por instancia |
| `minDuration` / `maxDuration` | number | 60 / 120 | Rango de duración en segundos |
| `minActionsPerPage` / `maxActionsPerPage` | number | 2 / 5 | Rango de acciones por página |
| `headless` | boolean | true | Ejecutar sin navegador visible |
| `browser` | string | chromium | `chromium`, `firefox` o `webkit` |
| `proxiesFile` | string | proxies.txt | Ruta al archivo de proxies |
| `logLevel` | string | info | `debug`, `info` o `warn` |

## 🚀 Uso

```bash
# Ejecutar con archivo de configuración (más simple)
npm start

# Sobreescribir ajustes por línea de comandos
npm start -- --url https://ejemplo.com --instances 2 --headless false

# Todos los flags disponibles
npm start -- \
  --url <url> \
  --instances <n> \
  --min-pages <n> --max-pages <n> \
  --min-duration <seg> --max-duration <seg> \
  --min-actions <n> --max-actions <n> \
  --headless <bool> \
  --browser <tipo> \
  --proxies <archivo> \
  --log-level <nivel>
```

## 🔒 Configuración de Proxies

Crea un archivo `proxies.txt` con un proxy por línea:

```
http://proxy1.ejemplo.com:8080
http://usuario:contraseña@proxy2.ejemplo.com:8080
socks5://proxy3.ejemplo.com:1080
```

Los proxies se verifican automáticamente al iniciar. Los proxies muertos se eliminan de la rotación.

## 🐳 Docker

```bash
# Construir
docker build -t web-explorer .

# Ejecutar
docker run --rm web-explorer

# Con configuración personalizada
docker run --rm -v ./explorer.config.json:/app/explorer.config.json web-explorer
```

## 🏗️ Arquitectura

```
src/
├── index.ts              # Punto de entrada — carga de config, orquestación
├── config/index.ts       # Config desde archivo JSON + flags CLI
├── browser/
│   ├── index.ts          # Lanzador de navegador y gestión de sesiones
│   ├── user-agents.ts    # Pool de cadenas de user agent
│   ├── devices.ts        # Pools de dispositivos móvil, tablet y escritorio
│   ├── locales.ts        # Perfiles de idioma con selección ponderada
│   ├── identity.ts       # Selector de identidad (UA + dispositivo + idioma)
│   └── stealth.ts        # Scripts de anti-detección
├── actions/
│   ├── index.ts          # Exportaciones barrel
│   ├── scroll.ts         # Scroll con rueda del ratón
│   ├── click.ts          # Clic en elementos aleatorios
│   ├── hover.ts          # Hover sobre elementos
│   ├── type.ts           # Escritura en cajas de búsqueda con errores
│   ├── navigate.ts       # Navegación por enlaces internos
│   ├── cookies.ts        # Gestor de consentimiento de cookies
│   ├── back.ts           # Botón de retroceso del navegador
│   ├── media.ts          # Interacción con vídeo/audio
│   ├── zoom.ts           # Zoom acercar/alejar/imagen
│   └── idle.ts           # Simulación de comportamiento inactivo
├── explorer/
│   ├── index.ts          # Clase Explorer — ciclo de vida de sesión
│   ├── loop.ts           # Bucle de exploración y selección de acciones
│   └── recovery.ts       # Recuperación por fallo de proxy
├── proxy/
│   ├── index.ts          # ProxyManager — rotación y ciclo de vida
│   ├── types.ts          # Definiciones de tipos de proxy
│   ├── loader.ts         # Parser de archivo
│   └── checker.ts        # Verificador de salud
├── humanizer/index.ts    # Utilidades de retardos, timing y aleatorización
├── logger/index.ts       # Logger de consola con colores
└── reporter/index.ts     # Generador de informes de sesión
```

## 📄 Licencia

ISC — Ifrahim IQBAL

---

## 👤 Autor

**Ifrahim IQBAL**
- GitHub: [@ifrahim07](https://github.com/ifrahim07)
