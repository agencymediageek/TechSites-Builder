#!/bin/bash
# deploy-worker.sh — Deploy any TechSites Builder Worker
#
# Usage: ./scripts/deploy-worker.sh <worker-name>
#
# Workers: ts-builder-proxy, wysiwyg-universal, techsites-hub

set -euo pipefail

WORKER="${1:-}"

if [ -z "$WORKER" ]; then
  echo "Usage: $0 <worker-name>"
  echo "Available: ts-builder-proxy, wysiwyg-universal"
  exit 1
fi

WORKER_DIR="workers/$WORKER"

if [ ! -d "$WORKER_DIR" ]; then
  echo "❌ Worker directory not found: $WORKER_DIR"
  exit 1
fi

echo "🚀 Deploying $WORKER..."
cd "$WORKER_DIR"
wrangler deploy
echo "✅ $WORKER deployed"
echo "🔍 Tail logs: wrangler tail $WORKER"
