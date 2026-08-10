#!/bin/bash
# upload-blocks.sh — Upload all HTML blocks and design tokens to Cloudflare KV
#
# Usage: TS_SITES_KV_ID=xxx ./scripts/upload-blocks.sh
#
# Uploads:
#   templates/components/**/*.html  → KV key: "block:{section}/{name}"
#   templates/tokens/niches/*.css   → KV key: "tokens:{niche}"
#   templates/shell.html            → KV key: "template:shell"

set -euo pipefail

if [ -z "${TS_SITES_KV_ID:-}" ]; then
  echo "❌ TS_SITES_KV_ID env var required"
  exit 1
fi

echo "📦 Uploading HTML blocks..."
BLOCK_COUNT=0

for file in templates/components/**/*.html; do
  if [ -f "$file" ]; then
    # Extract: "templates/components/menus/menu-3.html" → "menus/menu-3"
    name=$(echo "$file" | sed 's|templates/components/||' | sed 's|\.html$||')
    echo "  ↑ block:$name"
    wrangler kv key put "block:$name" \
      --path="$file" \
      --namespace-id="${TS_SITES_KV_ID}" \
      --remote
    BLOCK_COUNT=$((BLOCK_COUNT + 1))
  fi
done

echo "✅ $BLOCK_COUNT blocks uploaded"
echo ""

echo "🎨 Uploading design tokens..."
TOKEN_COUNT=0

for file in templates/tokens/niches/*.css; do
  if [ -f "$file" ]; then
    niche=$(basename "$file" .css)
    echo "  ↑ tokens:$niche"
    wrangler kv key put "tokens:$niche" \
      --path="$file" \
      --namespace-id="${TS_SITES_KV_ID}" \
      --remote
    TOKEN_COUNT=$((TOKEN_COUNT + 1))
  fi
done

echo "✅ $TOKEN_COUNT token files uploaded"
echo ""

if [ -f "templates/shell.html" ]; then
  echo "🐚 Uploading HTML shell..."
  wrangler kv key put "template:shell" \
    --path="templates/shell.html" \
    --namespace-id="${TS_SITES_KV_ID}" \
    --remote
  echo "✅ Shell uploaded"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ All assets uploaded to Cloudflare KV"
echo "   Blocks:  $BLOCK_COUNT"
echo "   Tokens:  $TOKEN_COUNT"
echo "═══════════════════════════════════════════════════════"
