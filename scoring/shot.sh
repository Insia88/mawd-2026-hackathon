#!/bin/bash
# 사용: bash _작업메모/shot.sh 1 3 4   (장 번호). mockups/ 폴더에 PNG로 저장한다.
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
BASE="file:///C:/경로/prototype/index.html"
NAMES=(x 01-cover 02-today 03-draft-desk 04-risk-check 05-post-scores 06-calendar 07-plan 08-rules 09-assembly-context 10-seoul-post-scores)
OUT="$(cd "$(dirname "$0")/.." && pwd)/mockups"
for n in "$@"; do
  "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1440,900 --virtual-time-budget=8000 --user-data-dir="$TEMP/aide-shot-profile" --screenshot="$(cygpath -w "$OUT/${NAMES[$n]}.png")" "$BASE?only=$n" >/dev/null 2>&1
done
ls "$OUT"
