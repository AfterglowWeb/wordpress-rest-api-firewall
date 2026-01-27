#!/usr/bin/env bash
set -euo pipefail

ZIP_NAME="rest-api-firewall.zip"

rm -f "$ZIP_NAME"

zip -r "$ZIP_NAME" . \
  -x "*.zip" \
  -x "*.tar" \
  -x "*.tar.gz" \
  -x "*.env" \
  -x "*.env*" \
  -x "*.config.js" \
  -x "src/*" \
  -x "node_modules/*" \
  -x "*/node_modules/*" \
  -x ".*/*" \
  -x ".gitignore" \
  -x ".DS_Store" \
  -x "*/.DS_Store" \
  -x "._*" \
  -x "package.json" \
  -x "package-lock.json" \
  -x "yarn.lock" \
  -x "README.md" \