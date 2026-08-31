#!/usr/bin/env bash
#
# Wrapper de Chromium para renderizar WebGL em maquinas sem GPU.
#
# A partir do Chromium 138 o fallback automatico para WebGL por software foi
# descontinuado: sem `--enable-unsafe-swiftshader` o contexto WebGL simplesmente
# nao e criado e a cena 3D sai preta, sem erro. O Remotion 4 ainda nao anexa
# essa flag na opcao `swangle`, entao ela e injetada aqui.
#
# Uso:
#   export REMOTION_BROWSER_EXECUTABLE="$PWD/scripts/chromium-swiftshader.sh"
#   export CHROMIUM_BIN=/caminho/para/headless_shell   # opcional
#
set -euo pipefail

CANDIDATES=(
  "${CHROMIUM_BIN:-}"
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
  "$(command -v chrome-headless-shell || true)"
  "$(command -v chromium || true)"
  "$(command -v google-chrome || true)"
)

BIN=""
for candidate in "${CANDIDATES[@]}"; do
  if [[ -n "$candidate" && -x "$candidate" ]]; then
    BIN="$candidate"
    break
  fi
done

if [[ -z "$BIN" ]]; then
  echo "chromium-swiftshader: nenhum binario do Chromium encontrado. Defina CHROMIUM_BIN." >&2
  exit 1
fi

exec "$BIN" --enable-unsafe-swiftshader "$@"
