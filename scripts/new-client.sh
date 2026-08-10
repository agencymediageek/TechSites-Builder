#!/bin/bash
# new-client.sh — Provision a new TechSites Builder client site
#
# Usage: ./scripts/new-client.sh <domain> <niche> <license> [plan]
#
# Required env vars:
#   CF_API_TOKEN  — Cloudflare API token with Zone:DNS:Edit permission
#   CF_ZONE_ID    — techsites.ai zone ID
#   TS_SITES_KV_ID — Cloudflare KV namespace ID for TS_SITES_KV
#
# Example:
#   CF_API_TOKEN=xxx CF_ZONE_ID=xxx TS_SITES_KV_ID=xxx \
#   ./scripts/new-client.sh "mycafe.techsites.ai" "food-beverage" "TS-A3F9-B2K1-9XZ4" "starter"

set -euo pipefail

DOMAIN="${1:-}"
NICHE="${2:-}"
LICENSE="${3:-}"
PLAN="${4:-starter}"

# ─── Validate args ────────────────────────────────────────────────────────────
if [ -z "$DOMAIN" ] || [ -z "$NICHE" ] || [ -z "$LICENSE" ]; then
  echo "❌ Usage: $0 <domain> <niche> <license> [plan]"
  echo ""
  echo "  domain  — e.g. mycafe.techsites.ai or mycafe.com"
  echo "  niche   — one of: law-finance, health-wellness, food-beverage,"
  echo "             beauty-luxury, tech-saas, fitness-sport, real-estate,"
  echo "             education, pet-care, travel-hospitality,"
  echo "             professional-services, retail-ecommerce"
  echo "  license — e.g. TS-A3F9-B2K1-9XZ4"
  echo "  plan    — starter | pro | business | enterprise (default: starter)"
  exit 1
fi

# ─── Validate niche ───────────────────────────────────────────────────────────
VALID_NICHES="law-finance health-wellness food-beverage beauty-luxury tech-saas fitness-sport real-estate education pet-care travel-hospitality professional-services retail-ecommerce"
if ! echo "$VALID_NICHES" | grep -qw "$NICHE"; then
  echo "❌ Invalid niche: $NICHE"
  echo "   Valid options: $VALID_NICHES"
  exit 1
fi

echo "🚀 Provisioning TechSites Builder client:"
echo "   Domain:  $DOMAIN"
echo "   Niche:   $NICHE"
echo "   License: $LICENSE"
echo "   Plan:    $PLAN"
echo ""

# ─── Calculate matrix seed ────────────────────────────────────────────────────
echo "📐 Calculating matrix seed..."
SEED=$(node -e "
  const key = process.argv[1];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  hash = Math.abs(hash);
  const indices = [];
  let rem = hash;
  for (let i = 0; i < 6; i++) {
    indices.push(rem % 6);
    rem = Math.floor(rem / 6);
  }
  const components = ['menu', 'home', 'about', 'howto', 'contact', 'footer'];
  const labels = indices.map((v, i) => components[i] + '-' + v);
  console.log(JSON.stringify({ indices, labels }));
" "$LICENSE")

SEED_INDICES=$(echo "$SEED" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(JSON.stringify(d.indices));")
SEED_LABELS=$(echo "$SEED" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.labels.join(', '));")

echo "   Seed:    $SEED_INDICES"
echo "   Blocks:  $SEED_LABELS"
echo ""

# ─── Create site config in KV ─────────────────────────────────────────────────
echo "💾 Writing site config to Cloudflare KV..."
CREATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

SITE_CONFIG=$(cat <<EOF
{
  "domain": "$DOMAIN",
  "seed": $SEED_INDICES,
  "niche": "$NICHE",
  "plan": "$PLAN",
  "license": "$LICENSE",
  "status": "active",
  "content": {
    "business_name": "",
    "tagline": "",
    "phone": "",
    "address": "",
    "email": "",
    "hero_title": "Welcome to Our Business",
    "hero_subtitle": "We provide excellent service",
    "hero_cta": "Contact Us"
  },
  "customDomains": [],
  "createdAt": "$CREATED_AT",
  "publishedAt": null
}
EOF
)

wrangler kv key put "site:$DOMAIN" "$SITE_CONFIG" \
  --namespace-id="${TS_SITES_KV_ID}" \
  --remote

echo "✅ Site config written to KV"

# ─── Add DNS CNAME (only for techsites.ai subdomains) ─────────────────────────
if [[ "$DOMAIN" == *.techsites.ai ]]; then
  SUBDOMAIN="${DOMAIN%.techsites.ai}"
  echo "🌐 Adding DNS CNAME for $DOMAIN..."

  RESPONSE=$(curl -s -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"CNAME\",
      \"name\": \"$SUBDOMAIN\",
      \"content\": \"techsites-hub-production.workers.dev\",
      \"proxied\": true,
      \"comment\": \"TechSites Builder — $PLAN — $CREATED_AT\"
    }")

  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ DNS CNAME added → techsites-hub-production.workers.dev"
  else
    echo "⚠️  DNS add may have failed (record may already exist):"
    echo "$RESPONSE" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.errors);"
  fi
else
  echo "ℹ️  Custom domain detected ($DOMAIN) — add DNS manually:"
  echo "   CNAME $DOMAIN → techsites-hub-production.workers.dev (proxied)"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Client provisioned successfully!"
echo ""
echo "   Live URL:  https://$DOMAIN"
echo "   Editor:    https://$DOMAIN?edit=1"
echo "   Dashboard: https://hub.techsites.ai/sites/$DOMAIN"
echo ""
echo "   DNS propagation: 60-300 seconds (Cloudflare)"
echo "   First load:      <10ms (Worker edge serving)"
echo "═══════════════════════════════════════════════════════"
