#!/bin/bash
# Run this script AFTER you have created the first wiki page via the GitHub browser UI.
# Steps:
#   1. Go to https://github.com/JakeDHolland/Claude-Documentation/wiki
#   2. Click "Create the first page", add any title, click Save Page
#   3. Then run this script from the repo root:
#      bash push-wiki.sh YOUR_GITHUB_TOKEN

TOKEN=${1:-""}
if [ -z "$TOKEN" ]; then
  echo "Usage: bash push-wiki.sh <github_token>"
  exit 1
fi

TMPDIR=$(mktemp -d)
git clone "https://oauth2:${TOKEN}@github.com/JakeDHolland/Claude-Documentation.wiki.git" "$TMPDIR"
cp wiki/*.md "$TMPDIR/"
cd "$TMPDIR"
git config user.email "jake@a2zcloud.com"
git config user.name "Jake Holland"
git add .
git commit -m "Add Yoda integration documentation"
git push origin master || git push origin main
echo "Wiki updated successfully!"
