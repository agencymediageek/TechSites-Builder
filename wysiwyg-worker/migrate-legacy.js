/**
 * migrate-legacy.js — Migrate per-site WYSIWYG Worker data to universal Worker
 *
 * Run with: node migrate-legacy.js
 * Requires: wrangler authenticated, jq installed
 *
 * Migrates data from 8 legacy Workers to the universal KV namespace.
 */

import { execSync } from 'child_process';

const UNIVERSAL_KV_ID = process.env.TS_WYSIWYG_KV_ID;
if (!UNIVERSAL_KV_ID) {
  console.error('❌ TS_WYSIWYG_KV_ID env var required');
  process.exit(1);
}

// Map of legacy Worker name → domain served
const LEGACY_WORKERS = [
  { worker: 'mokha-wysiwyg-standalone-api', domain: 'cafe-model.pages.dev' },
  { worker: 'agency-wysiwyg-standalone-review-api', domain: 'agency-review.pages.dev' },
  { worker: 'dentist-wysiwyg-standalone-review-api', domain: 'dentist-review.pages.dev' },
  { worker: 'real-estate-model-wysiwyg-api', domain: 'real-estate-model.pages.dev' },
  { worker: 'trial-model-dubai-wysiwyg-api', domain: 'trial-model-dubai.pages.dev' },
  { worker: 'techsites-wysiwyg-sandbox-api', domain: 'sandbox.techsites.ai' },
  { worker: 'techsites-editor-api', domain: 'editor.techsites.ai' },
  { worker: 'techsites-editor-api-production', domain: 'editor-prod.techsites.ai' },
];

function getSiteId(domain) {
  return Buffer.from(domain).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

console.log('🚀 TechSites WYSIWYG Universal Migration');
console.log(`   Target KV: ${UNIVERSAL_KV_ID}`);
console.log('');

for (const { worker, domain } of LEGACY_WORKERS) {
  const siteId = getSiteId(domain);
  console.log(`📦 Migrating ${worker} → ${domain} (siteId: ${siteId})`);

  try {
    // List all KV keys in the legacy worker's namespace
    // Note: This requires knowing the KV namespace ID of each legacy worker
    // Get from: wrangler kv namespace list
    console.log(`   ⚠️  Manual step required: Get KV namespace ID for ${worker}`);
    console.log(`   Then run:`);
    console.log(`   wrangler kv key list --namespace-id=<LEGACY_NS_ID> | \\`);
    console.log(`     jq -r '.[].name' | while read key; do`);
    console.log(`       value=$(wrangler kv key get "$key" --namespace-id=<LEGACY_NS_ID>)`);
    console.log(`       new_key="${siteId}:page:$key"`);
    console.log(`       wrangler kv key put "$new_key" "$value" --namespace-id=${UNIVERSAL_KV_ID}`);
    console.log(`     done`);

    // Register site key in universal KV
    // (The site key is a UUID that the site sends in X-Site-Key header)
    const siteKey = `ts-${domain.replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    run(`wrangler kv key put "key:${siteKey}" "${siteId}" --namespace-id=${UNIVERSAL_KV_ID} --remote`);
    console.log(`   ✅ Site key registered: ${siteKey}`);
    console.log(`   📋 Update ${domain} HTML to use: <meta name="ts-site-key" content="${siteKey}">`);

  } catch (err) {
    console.error(`   ❌ Error processing ${worker}:`, err.message);
  }

  console.log('');
}

console.log('═══════════════════════════════════════════════════════');
console.log('✅ Migration script complete');
console.log('');
console.log('Next steps:');
console.log('1. Complete manual KV migrations for each legacy worker');
console.log('2. Update each site HTML to use new X-Site-Key');
console.log('3. Deploy wysiwyg-universal Worker: wrangler deploy');
console.log('4. Test each migrated site');
console.log('5. Delete legacy Workers after verification (30-day window)');
