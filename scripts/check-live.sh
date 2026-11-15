#!/usr/bin/env bash
# Compares the main live pages with the files in this repository. Fails if any differ.
set -u
fail=0
for p in index.html app/index.html suppliers/index.html film/index.html settings.json terms.html; do
  url="https://beshowready.co.uk/${p%index.html}"
  live=$(curl -fsSL "$url?check=$(date +%s)" | sha256sum | cut -c1-16) || live="unreachable"
  here=$(sha256sum "public_html/$p" | cut -c1-16)
  if [ "$live" = "$here" ]; then echo "OK    $p $here"; else echo "DIFF  $p live=$live repo=$here"; fail=1; fi
done
exit $fail
