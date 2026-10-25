import './styles.css';

const ASSET_BASE = `${import.meta.env.BASE_URL}engine/`;
const canvas = document.querySelector('#canvas');
const gameRoot = document.querySelector('#game-root');
const boot = document.querySelector('#boot');
const bootStatus = document.querySelector('#boot-status');
const startButton = document.querySelector('#start-button');
const bootLog = document.querySelector('#boot-log');
const hud = document.querySelector('#hud');
const fullscreenButton = document.querySelector('#fullscreen-button');
const touchPad = document.querySelector('#touch-pad');
const touchToggle = document.querySelector('#touch-toggle');
const touchDevice = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const preloadFiles = ['freedoom2.wad', 'default.cfg', 'chocolate-doom.cfg'];
let ready = false;
let started = false;

function log(message, error = false) {
  const row = document.createElement('div');
  row.className = error ? 'error' : '';
  row.textContent = String(message);
  bootLog.appendChild(row);
  bootLog.scrollTop = bootLog.scrollHeight;
}

function setStatus(message) {
  if (message) bootStatus.textContent = String(message).toUpperCase();
}

function focusGame() {
  canvas.focus({ preventScroll: true });
  const context = window.Module?.SDL2?.audioContext;
  if (context && context.state === 'suspended') context.resume().catch((error) => log(error, true));
}

function enterFullscreen() {
  if (document.fullscreenElement) return;
  const request = gameRoot.requestFullscreen || gameRoot.webkitRequestFullscreen;
  try {
    const result = request?.call(gameRoot);
    result?.catch?.((error) => log(`Tela cheia indisponível: ${error}`, true));
  } catch (error) {
    log(`Tela cheia indisponível: ${error}`, true);
  }
}

fullscreenButton.addEventListener('click', () => {
  if (document.fullscreenElement) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    exit?.call(document);
  } else enterFullscreen();
  focusGame();
});

document.addEventListener('fullscreenchange', () => {
  const fullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.setAttribute('aria-label', fullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia');
  fullscreenButton.textContent = fullscreen ? '×' : '⛶';
});

touchToggle.addEventListener('click', () => {
  const show = touchPad.classList.contains('hidden');
  touchPad.classList.toggle('hidden', !show);
  touchToggle.setAttribute('aria-expanded', String(show));
  touchToggle.classList.toggle('active', show);
});

const keys = {
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  ControlLeft: { key: 'Control', code: 'ControlLeft', keyCode: 17 },
  Space: { key: ' ', code: 'Space', keyCode: 32 },
  ShiftLeft: { key: 'Shift', code: 'ShiftLeft', keyCode: 16 },
  KeyA: { key: 'a', code: 'KeyA', keyCode: 65 },
  KeyD: { key: 'd', code: 'KeyD', keyCode: 68 },
  Digit1: { key: '1', code: 'Digit1', keyCode: 49 },
  Digit2: { key: '2', code: 'Digit2', keyCode: 50 },
  Digit3: { key: '3', code: 'Digit3', keyCode: 51 },
  Enter: { key: 'Enter', code: 'Enter', keyCode: 13 },
  Escape: { key: 'Escape', code: 'Escape', keyCode: 27 },
};

function sendKey(type, name) {
  const value = keys[name];
  if (!value) return;
  const event = new KeyboardEvent(type, {
    key: value.key,
    code: value.code,
    keyCode: value.keyCode,
    which: value.keyCode,
    bubbles: true,
    cancelable: true,
  });
  try {
    Object.defineProperty(event, 'keyCode', { get: () => value.keyCode });
    Object.defineProperty(event, 'which', { get: () => value.keyCode });
  } catch {
    // Some browsers expose these legacy properties as non-configurable.
  }
  document.dispatchEvent(event);
  canvas.dispatchEvent(event);
}

for (const button of touchPad.querySelectorAll('[data-key]')) {
  const name = button.dataset.key;
  let held = false;
  const press = (event) => {
    event.preventDefault();
    if (!started || held) return;
    held = true;
    button.classList.add('pressed');
    focusGame();
    sendKey('keydown', name);
  };
  const release = (event) => {
    event?.preventDefault();
    if (!held) return;
    held = false;
    button.classList.remove('pressed');
    sendKey('keyup', name);
  };
  button.addEventListener('pointerdown', (event) => {
    button.setPointerCapture(event.pointerId);
    press(event);
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  window.addEventListener('blur', release);
}

canvas.addEventListener('pointerdown', () => {
  if (!started) return;
  focusGame();
});
canvas.addEventListener('click', () => {
  if (!started || touchDevice || document.pointerLockElement === canvas) return;
  try {
    const result = canvas.requestPointerLock?.();
    result?.catch?.(() => {});
  } catch {
    // The game remains playable with the keyboard if pointer lock is denied.
  }
});

window.addEventListener('keydown', (event) => {
  if (!started) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
});

function startGame() {
  if (!ready || started) return;
  started = true;
  startButton.disabled = true;
  startButton.textContent = 'INICIANDO…';
  focusGame();
  hud.classList.remove('hidden');
  touchToggle.classList.toggle('hidden', !touchDevice);
  touchPad.classList.toggle('hidden', !touchDevice);
  if (touchDevice) touchPad.classList.add('show');
  enterFullscreen();

  try {
    log('[main] iniciando o motor');
    window.callMain([
      '-iwad', 'freedoom2.wad',
      '-width', '800', '-height', '600',
      '-nogui', '-nomusic',
      '-config', 'default.cfg',
      '-extraconfig', 'chocolate-doom.cfg',
      '-savedir', '/savefiles',
    ]);
    boot.classList.add('hidden');
  } catch (error) {
    log(`[main] falha ao iniciar: ${error?.message || error}`, true);
    started = false;
    startButton.disabled = false;
    startButton.textContent = 'TENTAR NOVAMENTE';
    hud.classList.add('hidden');
    touchPad.classList.add('hidden');
    document.exitFullscreen?.().catch?.(() => {});
  }
}

startButton.addEventListener('click', startGame);

window.onerror = (message, _source, line) => {
  log(`ERRO: ${message} (linha ${line})`, true);
  return false;
};
window.addEventListener('unhandledrejection', (event) => {
  log(`ERRO: ${event.reason?.message || event.reason}`, true);
});

window.Module = {
  canvas,
  noInitialRun: true,
  noExitRuntime: true,
  print: (message) => log(message),
  printErr: (message) => log(message, true),
  setStatus,
  monitorRunDependencies: (remaining) => {
    if (remaining > 0) setStatus(`Carregando jogo (${remaining})`);
  },
  preRun: () => {
    const fs = window.Module.FS;
    try { fs.mkdir('/savefiles'); } catch {}
    preloadFiles.forEach((file) => {
      const path = `${ASSET_BASE}${file}`;
      log(`[preload] ${file}`);
      fs.createPreloadedFile('/', file, path, true, true);
    });
  },
  onRuntimeInitialized: () => {
    ready = true;
    setStatus('Pronto para jogar');
    startButton.disabled = false;
    startButton.textContent = 'JOGAR';
    log('[runtime] motor pronto');
  },
  onAbort: (reason) => log(`[engine] ${reason}`, true),
  onExit: (status) => log(`[engine] encerrou com código ${status}`, true),
};

log('[boot] carregando motor…');
const engineScript = document.createElement('script');
engineScript.src = `${ASSET_BASE}websockets-doom.js`;
engineScript.onerror = () => {
  setStatus('Erro ao carregar o motor');
  startButton.textContent = 'ERRO AO CARREGAR';
  log('[boot] não foi possível carregar o motor', true);
};
document.body.appendChild(engineScript);
