# Upstream Provenance

## Crispy Doom

- Upstream: `https://github.com/fabiangreffrath/crispy-doom`
- Vendored release: `crispy-doom-7.2`
- Vendored commit: `fdeabe4c23a833534b70aa84a22f1685aae7125d`
- License: GPL-2.0-or-later
- Local changes:
  - Doom's blocking main loop is driven by `emscripten_set_main_loop()` in the browser
  - SDL audio header included for the SDL2 WebAssembly build
  - `EMULATE_FUNCTION_POINTER_CASTS` enabled for browser runtime compatibility
  - High-resolution rendering enabled by default (`crispy_hires 1`, 640×400)

## Legacy Chocolate Doom source

The repository also retains the previously vendored Chocolate Doom source at
`engine/vendor/chocolate-doom` (commit
`3e0cd5dc0cd0d5b6788100a2fbc1cdd4ce014b35`, GPL-2.0-or-later). It is no longer
used to build the deployed browser engine.

## Freedoom

- Upstream: `https://github.com/freedoom/freedoom`
- Source tree commit inspected for provenance: `d7ad12f26d644aedc4d94b598087223d3e4a38dd`
- Bundled release asset: `freedoom-0.13.0.zip`
- Default IWAD shipped here: `freedoom2.wad`
- License: see `licenses/FREEDOOM-COPYING.txt`

## Browser engine binary

The public `crispy-doom.js` and `crispy-doom.wasm` bundle is built from the
vendored source using `npm run build:wasm`. The GPL-2.0 text is included in
`engine/vendor/crispy-doom/COPYING.md`.
