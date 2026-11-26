#!/bin/bash
# Redeploy the site to Cloudflare Pages (project ras-portfolio). Private: a password gate (tools/cf-functions,
# secret SITE_PASSWORD; the owner's copy is in the Keychain item "RA.S portfolio site").
# Usage: ~/WORK/PORTFOLIO_SITE/tools/deploy.sh            (production, branch main)
#        ~/WORK/PORTFOLIO_SITE/tools/deploy.sh preview    (preview deployment, also behind Access)
set -euo pipefail
SITE="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d)"; trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/public" "$STAGE/functions"
rsync -a --exclude .git --exclude tools --exclude '*.bak*' --exclude .DS_Store \
      --exclude README.md --exclude .gitignore --exclude node_modules "$SITE/" "$STAGE/public/"
cp "$SITE/tools/cf-functions/_middleware.js" "$STAGE/functions/"    # the gate; never ship the site without it
BRANCH=main; [ "${1:-}" = preview ] && BRANCH=preview
export NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"
cd "$STAGE" && npx -y wrangler@4 pages deploy public --project-name ras-portfolio --branch "$BRANCH" --commit-dirty=true
