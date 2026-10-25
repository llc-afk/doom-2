# Freedoom Phase 2 no navegador

Chocolate Doom compilado para WebAssembly, com Freedoom Phase 2 (`freedoom2.wad`) como conteúdo jogável gratuito. O site apresenta o jogo e inicia automaticamente depois que os arquivos terminam de carregar. Freedoom é compatível com Doom II, mas usa conteúdo original e não inclui os arquivos comerciais de Doom II.

O site pode ser publicado pelo GitHub Pages: o workflow em `.github/workflows/pages.yml` compila e publica `web/dist` a cada push na branch `main`. Em **Settings → Pages**, selecione **GitHub Actions** como fonte de publicação. Depois da primeira execução bem-sucedida, o endereço será `https://llc-afk.github.io/doom-2/`.

## Sobre o projeto

- Jogue Freedoom Phase 2 no navegador ou incorpore o site em um iframe.
- O jogo é executado localmente no navegador usando Chocolate Doom e WebAssembly.
- Para alterar o motor, recompile os arquivos WebAssembly seguindo as instruções abaixo.

If you only want to play or test the project locally, you usually do not need to care about `build:wasm`.

## Executar localmente

Com Node.js e npm instalados, execute:

### Requirements

- Git
- Node.js `^18.0.0 || >=20.0.0`
- npm

### Clone and Run

```bash
git clone <your-github-url>
cd <repository-directory>
npm install
npm run dev
```

Then:

1. Open the local URL printed by Vite.
2. Wait for the bundled assets to load; the game starts automatically.
3. Click the canvas to focus input and enable audio if required by the browser.

The prebuilt browser engine files under `web/public/engine/` are intentionally committed so a fresh clone can run without rebuilding the engine.

## Controles

- `W`, `A`, `S`, `D` ou setas: movimentar e virar
- `Ctrl`: disparar
- `Espaço`: usar / abrir
- `Shift`: correr
- Clique no jogo para ativar o teclado e o áudio.
- Use o botão **Tela cheia** para expandir o jogo.

## Incorporação em iframe

Run `npm run dev`, then serve this HTML from a separate local page (for example, save it as `iframe-test.html` in a temporary folder and run `python -m http.server 8080` there). Open `http://localhost:8080/iframe-test.html`:

```html
<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Freedoom iframe test</title>
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: black; }
  iframe { display: block; width: 100vw; height: 100vh; border: 0; }
</style>
<iframe
  src="http://127.0.0.1:5173/"
  title="Freedoom 2"
  allow="autoplay"
  sandbox="allow-scripts allow-same-origin"
></iframe>
</html>
```

Use the URL printed by Vite if it chooses another port. The sandbox is optional; if used, it must permit scripts and same-origin access for asset loading. Production hosting must also allow framing (no conflicting `X-Frame-Options` or CSP `frame-ancestors` policy).

Check that the game appears without pressing Play, the frame resizes without scrollbars, and clicking inside enables keyboard input. Audio may require a click or key press inside the frame even with `allow="autoplay"`. Move the cursor outside the frame and click the chat to continue typing there. There are no touch controls.

For a production test, run `npm run build` followed by `npm run preview` and change the iframe URL to the preview URL (normally `http://127.0.0.1:4173/`).

Only bundled Freedoom is loaded. There is no upload flow, custom IWAD selection, or pointer capture. Diagnostics go to the browser console; savegames remain in memory for the current session.

## Comandos

### `npm run dev`

Starts the local dev server for normal use.

Use this when:
- you just want to play or test the browser version
- you changed frontend files under `web/src`
- you changed copy, layout, styles, or UI behavior

### `npm run build`

Builds the production web app.

Use this when:
- you want the production `web/dist` output
- you want to verify the frontend production bundle

### `npm run build:wasm`

Rebuilds the Doom engine itself for the browser.

This compiles the Chocolate Doom C code into:
- `web/public/engine/chocolate-doom.js`
- `web/public/engine/chocolate-doom.wasm`
- `web/public/engine/chocolate-doom.data`

Use this only when:
- you changed engine source under `engine/vendor/chocolate-doom`
- you changed the Emscripten build in `engine/scripts/build_wasm.sh`
- you changed default engine-side assets like `engine/assets/freedoom2.wad`

If you only changed the web UI, you do not need `build:wasm`.

### `npm run clean`

Removes local build directories:
- `engine/build`
- `web/dist`

It intentionally keeps the tracked `web/public/engine/` bundle.

## Project Layout

- `web/`: minimal Vite embed, automatic startup, keyboard input and audio
- `engine/`: vendored Chocolate Doom source, default Freedoom asset, build scripts
- `licenses/`: license texts and attribution notices

## Advanced: Rebuilding the Engine as WebAssembly

This section is only for engine work.

### Additional Requirements

- Python 3
- Emscripten
- CMake
- Ninja

### Install Local Build Prerequisites

From the repository root:

```bash
git clone https://github.com/emscripten-core/emsdk.git .emsdk
cd .emsdk
./emsdk install 4.0.14
./emsdk activate 4.0.14
source ./emsdk_env.sh
cd ..
python3 -m pip install --upgrade --prefix ./.tooling cmake ninja
export PATH="$PWD/.tooling/bin:$PATH"
export PYTHONPATH="$(find "$PWD/.tooling/lib" -maxdepth 3 -type d -name site-packages | head -n 1)"
```

Then rebuild:

```bash
npm run build:wasm
```

Notes:

- `.emsdk/` and `.tooling/` are local prerequisites and are intentionally ignored by Git.
- On a fresh Emscripten setup, the first wasm build may also download the SDL2 port into the local Emscripten cache.
- The build preloads `engine/assets/freedoom2.wad` into `/iwads/freedoom2.wad` inside the Emscripten filesystem.

## Production Build

From the repository root:

```bash
npm install
npm run build
```

The production output is written to `web/dist/`.

## Troubleshooting

### `emcc` not found

Install and activate emsdk from the repository root:

```bash
git clone https://github.com/emscripten-core/emsdk.git .emsdk
cd .emsdk
./emsdk install 4.0.14
./emsdk activate 4.0.14
source ./emsdk_env.sh
cd ..
```

Then rerun `npm run build:wasm`.

### `cmake` not found

Install local build tools:

```bash
python3 -m pip install --upgrade --prefix ./.tooling cmake ninja
export PATH="$PWD/.tooling/bin:$PATH"
export PYTHONPATH="$(find "$PWD/.tooling/lib" -maxdepth 3 -type d -name site-packages | head -n 1)"
```

Then rerun `npm run build:wasm`.

### Browser keyboard input is missing

- Click inside the canvas after launch.
- Click outside the iframe to return focus to the chat.

## GitHub and Repo Hygiene

- Safe to commit: source code, `engine/assets/freedoom2.wad`, `web/public/engine/*`, docs in this README, and `licenses/`
- Do not commit: proprietary IWADs/WADs, local toolchains, caches, dependency folders, or build output
- `.gitignore` already excludes common local-only paths such as `.emsdk/`, `.tooling/`, `.playwright/`, `node_modules/`, `engine/build/`, and `web/dist/`
- The tracked `web/public/engine/` bundle is intentional so the repo stays clone-and-run friendly

## Licensing

- Engine and project integration: GPL-2.0-or-later
- Default game data: Freedoom
- Frontend and toolchain notices: see `licenses/`

See `licenses/THIRD_PARTY_NOTICES.md` for the bundled license summary.
