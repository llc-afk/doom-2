import './styles.css';

const ENGINE_FILE_BASE = `${import.meta.env.BASE_URL}engine/`;
const canvas = document.querySelector('#doom-canvas');
const loadingOverlay = document.querySelector('#loading-overlay');
const loadingMessage = document.querySelector('#loading-message');
const gameStatus = document.querySelector('#game-status');
const statusLight = document.querySelector('#status-light');
const fullscreenButton = document.querySelector('#fullscreen-button');
let engine;

function setGameState(state, message) {
  gameStatus.textContent = message;
  statusLight.classList.toggle('ready', state === 'ready');
  statusLight.classList.toggle('error', state === 'error');
  if (state === 'ready') loadingOverlay.classList.add('hidden');
  if (state === 'error') loadingMessage.textContent = 'Não foi possível carregar. Atualize a página para tentar novamente.';
}

fullscreenButton.addEventListener('click', async () => {
  try {
    const gameCard = document.querySelector('.game-card');
    if (document.fullscreenElement) await document.exitFullscreen();
    else await gameCard.requestFullscreen();
    canvas.focus({ preventScroll: true });
  } catch (error) {
    console.warn('Fullscreen is not available in this browser.', error);
  }
});

document.addEventListener('fullscreenchange', () => {
  const fullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.setAttribute('aria-label', fullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia');
  fullscreenButton.querySelector('span').textContent = fullscreen ? 'SAIR DA TELA CHEIA' : 'TELA CHEIA';
});

function resumeAudio() {
  const context = engine?.SDL2?.audioContext;
  if (context && context.state !== 'running' && context.state !== 'closed') {
    context.resume().catch((error) => console.warn('Unable to resume audio.', error));
  }
}

canvas.addEventListener('pointerdown', () => {
  canvas.focus({ preventScroll: true });
  resumeAudio();
});
canvas.addEventListener('keydown', resumeAudio);
// Keep the engine's arrow bindings and expose WASD as equivalent controls.
const movementKeys = {
  KeyW: ['ArrowUp', 38],
  KeyA: ['ArrowLeft', 37],
  KeyS: ['ArrowDown', 40],
  KeyD: ['ArrowRight', 39],
};
const heldMovementKeys = new Map();

function sendMovementKey(type, [key, keyCode], repeat = false) {
  canvas.dispatchEvent(new KeyboardEvent(type, {
    key, code: key, keyCode, which: keyCode, repeat,
    bubbles: true, cancelable: true,
  }));
}

for (const type of ['keydown', 'keyup']) {
  // Capture before SDL's document listeners so each physical key is handled once.
  window.addEventListener(type, (event) => {
    const binding = movementKeys[event.code];
    if (!binding || document.activeElement !== canvas) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    resumeAudio();
    if (type === 'keydown') heldMovementKeys.set(event.code, binding);
    else heldMovementKeys.delete(event.code);
    sendMovementKey(type, binding, event.repeat);
  }, true);
}

function releaseMovementKeys() {
  for (const binding of heldMovementKeys.values()) sendMovementKey('keyup', binding);
  heldMovementKeys.clear();
}
canvas.addEventListener('blur', releaseMovementKeys);
window.addEventListener('blur', releaseMovementKeys);

async function launchEngine() {
  try {
    // Load the prebuilt Emscripten module from public without bundling it.
    const { default: createDoomModule } = await import(/* @vite-ignore */ `${ENGINE_FILE_BASE}chocolate-doom.js`);
    engine = await createDoomModule({
      canvas,
      keyboardListeningElement: canvas,
      elementPointerLock: false,
      locateFile: (path) => `${ENGINE_FILE_BASE}${path}`,
      noInitialRun: true,
      preRun: [(module) => {
        module.FS.mkdir('/config');
        module.FS.mkdir('/savegames');
        module.FS.writeFile('/config/default.cfg', [
          'fullscreen 0',
          'window_width 320',
          'window_height 200',
          'grabmouse 0',
          'use_mouse 0',
          '',
        ].join('\n'));
        // Avoid the desktop SDL render-target upscale path in the web build.
        module.FS.writeFile('/config/chocolate-doom.cfg',
          'smooth_pixel_scaling 0\nforce_software_renderer 1\n');
      }],
      print: (text) => console.log(text),
      printErr: (text) => console.error(text),
      onAbort: (reason) => console.error('Engine aborted:', reason),
    });

    // The module promise waits for WASM and the bundled Freedoom data file.
    try {
      engine.callMain([
        '-window', '-nomouse', '-nograbmouse', '-iwad', '/iwads/freedoom2.wad',
        '-savedir', '/savegames',
        '-config', '/config/default.cfg',
        '-extraconfig', '/config/chocolate-doom.cfg',
      ]);
    } catch (error) {
      if (error !== 'unwind' && error !== 'SimulateInfiniteLoop') throw error;
    }
    setGameState('ready', 'JOGO PRONTO');
    canvas.focus({ preventScroll: true });
  } catch (error) {
    console.error('Failed to start Freedoom:', error);
    setGameState('error', 'ERRO AO CARREGAR');
  }
}

void launchEngine();
