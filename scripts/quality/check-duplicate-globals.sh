#!/usr/bin/env bash
set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required to run this check." >&2
  exit 2
fi

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

rg -n --glob '*.js' '^(const|let|var|function|class)[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*' scripts \
  | awk '
      {
        line=$0;
        split(line, parts, ":");
        ref=parts[1] ":" parts[2];
        sub(/^[^:]+:[0-9]+:/, "", line);
        sub(/^(const|let|var|function|class)[[:space:]]+/, "", line);
        sub(/[^A-Za-z0-9_$].*$/, "", line);
        print line "\t" ref;
      }
    ' > "$tmp_file"

duplicates="$(awk -F '\t' '
  {
    key=$1;
    refs[key]=(refs[key] ? refs[key] ", " $2 : $2);
    count[key]++;
  }
  END {
    for (k in count) {
      if (count[k] > 1) {
        print k " -> " refs[k];
      }
    }
  }
' "$tmp_file" | sort)"

if [ -n "$duplicates" ]; then
  echo "Duplicate top-level declarations found:"
  echo "$duplicates"
  exit 1
fi

echo "No duplicate top-level declarations found."
