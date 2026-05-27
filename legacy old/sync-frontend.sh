#!/bin/bash
# Sync frontend-wsl → frontend/ (solo archivos del asistente-ia)
set -e
SRC=~/frontend-wsl
DEST=~/projects/totem-mvp1/frontend

FILES=(
  "components/asistente-ia/ChatDiscovery.tsx"
  "components/asistente-ia/WorkspacePanel.tsx"
  "app/asistente-ia/page.tsx"
  "app/explorar/page.tsx"
  "app/trip/page.tsx"
  "app/stats/page.tsx"
  "hooks/useChatSession.ts"
)

for f in "${FILES[@]}"; do
  mkdir -p "$DEST/$(dirname $f)"
  cp "$SRC/$f" "$DEST/$f"
  echo "✅ $f"
done

echo ""
echo "🎉 Sync completado — $(date)"
