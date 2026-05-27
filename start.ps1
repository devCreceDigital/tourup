Get-ChildItem -Recurse -Directory -Filter "node_modules" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
pnpm install
pnpm dev:web
