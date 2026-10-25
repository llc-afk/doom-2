#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENGINE_ROOT="${PROJECT_ROOT}/engine/vendor/crispy-doom"
BUILD_ROOT="${PROJECT_ROOT}/engine/build/crispy-wasm"
OUTPUT_ROOT="${PROJECT_ROOT}/web/public/engine"

if ! command -v emcc >/dev/null 2>&1 && [ -f "${PROJECT_ROOT}/.emsdk/emsdk_env.sh" ]; then
  # shellcheck disable=SC1091
  source "${PROJECT_ROOT}/.emsdk/emsdk_env.sh" >/dev/null
fi

for tool in emcc emcmake cmake ninja; do
  if ! command -v "${tool}" >/dev/null 2>&1; then
    echo "${tool} is required to build Crispy Doom for WebAssembly." >&2
    exit 1
  fi
done

mkdir -p "${BUILD_ROOT}" "${OUTPUT_ROOT}"

EM_LINK_FLAGS="-sALLOW_MEMORY_GROWTH=1 -sFORCE_FILESYSTEM=1 -sEXIT_RUNTIME=0 -sEMULATE_FUNCTION_POINTER_CASTS=1 -sEXPORTED_RUNTIME_METHODS=[FS,callMain]"

emcmake cmake \
  -S "${ENGINE_ROOT}" \
  -B "${BUILD_ROOT}" \
  -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_EXECUTABLE_SUFFIX=.js \
  -DENABLE_SDL2_MIXER=OFF \
  -DENABLE_SDL2_NET=OFF \
  "-DCMAKE_EXE_LINKER_FLAGS=${EM_LINK_FLAGS}"

cmake --build "${BUILD_ROOT}" --target crispy-doom --parallel

cp "${BUILD_ROOT}/src/crispy-doom.js" "${OUTPUT_ROOT}/crispy-doom.js"
cp "${BUILD_ROOT}/src/crispy-doom.wasm" "${OUTPUT_ROOT}/crispy-doom.wasm"

echo "Crispy Doom WebAssembly build complete: ${OUTPUT_ROOT}"
