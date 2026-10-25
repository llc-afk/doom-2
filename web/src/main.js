import './styles.css';

const ENGINE_FILE_BASE = `${import.meta.env.BASE_URL}engine/`;
const canvas = document.querySelector('#doom-canvas');
const gameRoot = document.querySelector('#game-root');
const boot = document.querySelector('#boot');
const bootStatus = document.querySelector('#boot-status');
const startButton = document.querySelector('#start-button');
const hud = document.querySelector('#hud');
const fullscreenButton = document.querySelector('#fullscreen-button');
const touchPad = document.querySelector('#touch-pad');
const touchToggle = document.querySelector('#touch-toggle');
const touchDevice = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
let engine;
let started = false;

function showStatus(message) {
  if (message) bootStatus.textContent = message.toUpperCase();
}

function focusGame() {
  canvas.focus({ preventScroll: true });
  const audioContext = engine?.SDL2?.audioContext;
  if (audioContext && audioContext.state !== 'running' && audioContext.state !== 'closed') {
    audioContext.resume().catch((error) => console.warn('Unable to resume audio.', error));
  }
}

function requestPointerLock() {
  if (touchDevice || document.pointerLockElement === canvas || !canvas.requestPointerLock) return;
  try {
    const result = canvas.requestPointerLock();
    result?.catch?.((error) => console.info('Pointer lock is unavailable.', error));
  } catch (error) {
    console.info('Pointer lock is unavailable.', error);
  }
}

function requestFullscreen() {
  const request = document.fullscreenElement
    ? document.exitFullscreen?.call(document)
    : gameRoot.requestFullscreen?.call(gameRoot);
  request?.catch?.((error) => console.info('Fullscreen is unavailable.', error));
  return request;
}

fullscreenButton.addEventListener('click', () => {
  void requestFullscreen();
  focusGame();
});

document.addEventListener('fullscreenchange', () => {
  const fullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.setAttribute('aria-label', fullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia');
  fullscreenButton.textContent = fullscreen ? '×' : '⛶';
});

touchToggle.addEventListener('click', () => {
  const open = touchPad.classList.contains('hidden');
  touchPad.classList.toggle('hidden', !open);
  touchToggle.setAttribute('aria-expanded', String(open));
  touchToggle.classList.toggle('active', open);
});

const keyEvents = {
  ArrowUp: ['ArrowUp', 'ArrowUp', 38],
  ArrowDown: ['ArrowDown', 'ArrowDown', 40],
  ArrowLeft: ['ArrowLeft', 'ArrowLeft', 37],
  ArrowRight: ['ArrowRight', 'ArrowRight', 39],
  KeyA: ['a', 'KeyA', 65],
  KeyD: ['d', 'KeyD', 68],
  ControlLeft: ['Control', 'ControlLeft', 17],
  Space: [' ', 'Space', 32],
  ShiftLeft: ['Shift', 'ShiftLeft', 16],
};

function sendKey(type, code) {
  const [key, eventCode, keyCode] = keyEvents[code];
  const event = new KeyboardEvent(type, {
    key, code: eventCode, keyCode, which: keyCode,
    bubbles: true, cancelable: true,
  });
  try {
    Object.defineProperty(event, 'keyCode', { get: () => keyCode });
    Object.defineProperty(event, 'which', { get: () => keyCode });
  } catch {
    // The event already exposes these values in browsers that support them.
  }
  document.dispatchEvent(event);
}

for (const button of touchPad.querySelectorAll('[data-key]')) {
  const code = button.dataset.key;
  let held = false;
  const press = (event) => {
    event.preventDefault();
    if (held || !started) return;
    held = true;
    button.classList.add('pressed');
    focusGame();
    sendKey('keydown', code);
  };
  const release = (event) => {
    event?.preventDefault();
    if (!held) return;
    held = false;
    button.classList.remove('pressed');
    sendKey('keyup', code);
  };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('pointerdown', (event) => button.setPointerCapture(event.pointerId));
  window.addEventListener('blur', release);
}

canvas.addEventListener('pointerdown', () => {
  if (!started) return;
  focusGame();
  requestPointerLock();
});

window.addEventListener('keydown', (event) => {
  if (!started) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
});

function startGame() {
  if (started || !engine) return;
  started = true;
  boot.classList.add('hidden');
  hud.classList.remove('hidden');
  touchToggle.classList.toggle('hidden', !touchDevice);
  touchPad.classList.toggle('hidden', !touchDevice);
  focusGame();

  try {
    engine.callMain([
      '-window', '-width', '800', '-height', '600',
      '-iwad', '/iwads/freedoom2.wad',
      '-savedir', '/savegames',
      '-config', '/config/default.cfg',
      '-extraconfig', '/config/chocolate-doom.cfg',
    ]);
  } catch (error) {
    if (error !== 'unwind' && error !== 'SimulateInfiniteLoop') {
      console.error('Failed to start Freedoom:', error);
      started = false;
      boot.classList.remove('hidden');
      hud.classList.add('hidden');
      showStatus('Não foi possível iniciar. Tente novamente.');
      startButton.disabled = false;
      startButton.textContent = 'TENTAR NOVAMENTE';
    }
  }
}

startButton.addEventListener('click', startGame);

async function prepareEngine() {
  try {
    const { default: createDoomModule } = await import(/* @vite-ignore */ `${ENGINE_FILE_BASE}chocolate-doom.js`);
    engine = await createDoomModule({
      canvas,
      keyboardListeningElement: document,
      elementPointerLock: true,
      locateFile: (path) => `${ENGINE_FILE_BASE}${path}`,
      noInitialRun: true,
      preRun: [(module) => {
        module.FS.mkdir('/config');
        module.FS.mkdir('/savegames');
        module.FS.writeFile('/config/default.cfg', [
          'fullscreen 0',
          'window_width 800',
          'window_height 600',
          'use_mouse 1',
          'grabmouse 0',
          'key_strafeleft 97',
          'key_straferight 100',
          'mouse_sensitivity 5',
          '',
        ].join('\n'));
        module.FS.writeFile('/config/chocolate-doom.cfg', [
          'smooth_pixel_scaling 0',
          'force_software_renderer 1',
          'integer_scaling 0',
          'max_scaling_buffer_pixels 64000',
          '',
        ].join('\n'));
      }],
      print: (text) => console.log(text),
      printErr: (text) => console.error(text),
      setStatus: showStatus,
      onAbort: (reason) => {
        console.error('Engine aborted:', reason);
        showStatus('Erro ao carregar o jogo. Atualize a página para tentar novamente.');
      },
    });
    showStatus('Pronto para jogar');
    startButton.disabled = false;
    startButton.textContent = 'JOGAR';
  } catch (error) {
    console.error('Failed to load Freedoom:', error);
    showStatus('Falha ao carregar. Atualize a página para tentar novamente.');
    startButton.disabled = true;
    startButton.textContent = 'ERRO AO CARREGAR';
  }
}

void prepareEngine();
