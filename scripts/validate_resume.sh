#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 path/to/resume.pdf" >&2
  exit 2
fi

pdf="$1"

for command_name in pdfinfo pdftotext pdftoppm; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "error: $command_name is required to validate the resume" >&2
    exit 1
  fi
done

if [[ ! -s "$pdf" ]]; then
  echo "error: PDF does not exist or is empty: $pdf" >&2
  exit 1
fi

page_count="$(pdfinfo "$pdf" | awk '/^Pages:/ { print $2 }')"
if [[ ! "$page_count" =~ ^[1-9][0-9]*$ ]]; then
  echo "error: invalid PDF page count: ${page_count:-unknown}" >&2
  exit 1
fi

byte_count="$(wc -c < "$pdf" | tr -d ' ')"
if (( byte_count < 10000 )); then
  echo "error: PDF is unexpectedly small ($byte_count bytes)" >&2
  exit 1
fi

validation_dir="$(mktemp -d "${TMPDIR:-/tmp}/resume-validation.XXXXXX")"
cleanup() {
  rm -rf "$validation_dir"
}
trap cleanup EXIT

pdftotext "$pdf" "$validation_dir/resume.txt"
if ! grep -q '[[:alnum:]]' "$validation_dir/resume.txt"; then
  echo "error: PDF contains no extractable text" >&2
  exit 1
fi

pdftoppm -f 1 -singlefile -png -r 120 \
  "$pdf" "$validation_dir/resume-preview" >/dev/null 2>&1
if [[ ! -s "$validation_dir/resume-preview.png" ]]; then
  echo "error: PDF preview rendering failed" >&2
  exit 1
fi

echo "Validated $pdf ($page_count page(s), $byte_count bytes)"
