# Upstream Provenance

## Chocolate Doom

- Upstream: `https://github.com/chocolate-doom/chocolate-doom`
- Vendored commit: `3e0cd5dc0cd0d5b6788100a2fbc1cdd4ce014b35`
- License: GPL-2.0-or-later
- Local changes:
  - Emscripten runtime exports fixed for modern builds
  - Browser pause/resume entry points added
  - Doom main loop switched to `emscripten_set_main_loop_arg()`

## Freedoom

- Upstream: `https://github.com/freedoom/freedoom`
- Source tree commit inspected for provenance: `d7ad12f26d644aedc4d94b598087223d3e4a38dd`
- Bundled release asset: `freedoom-0.13.0.zip`
- Default IWAD shipped here: `freedoom2.wad`
- License: see `licenses/FREEDOOM-COPYING.txt`

## Browser launcher binary

The web page currently uses the tested WebAssembly launcher and engine bundle
from the sibling `doom-web` project, with Freedoom Phase 2 loaded as its IWAD.
The binary is distributed under GPL-2.0. Its corresponding source provenance
is documented in `doom-web` at
`https://github.com/llc-afk/doom-web/blob/main/README.md`:

- Deployment bundle: `Saketh-Chandra/doom-wasm-pwa@5b1e1fe7385b6f0b19d60dece6adbf88f6842e20`
- Source revision: `Saketh-Chandra/doom-wasm-pwa@a77edfd8bbc7`
- Upstream port: `https://github.com/cloudflare/doom-wasm`

The corresponding license is included in `licenses/CHOCOLATE-DOOM-GPL-2.0.md`.
