#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$repo_root/resume"
destination="$repo_root/files/Resume_Chen_Yixiang.pdf"
build_dir="$(mktemp -d "${TMPDIR:-/tmp}/resume-build.XXXXXX")"

cleanup() {
  rm -rf "$build_dir"
  rm -f "$destination.tmp"
}
trap cleanup EXIT

if ! command -v xelatex >/dev/null 2>&1; then
  echo "error: xelatex is required to build the resume locally" >&2
  echo "The GitHub Actions workflow can compile it without a local TeX installation." >&2
  exit 1
fi

if command -v latexmk >/dev/null 2>&1; then
  (
    cd "$source_dir"
    latexmk \
      -xelatex \
      -file-line-error \
      -halt-on-error \
      -interaction=nonstopmode \
      -outdir="$build_dir" \
      resume.tex
  )
else
  (
    cd "$source_dir"
    xelatex -file-line-error -halt-on-error -interaction=nonstopmode \
      -output-directory="$build_dir" resume.tex
    xelatex -file-line-error -halt-on-error -interaction=nonstopmode \
      -output-directory="$build_dir" resume.tex
  )
fi

"$repo_root/scripts/validate_resume.sh" "$build_dir/resume.pdf"

install -m 0644 "$build_dir/resume.pdf" "$destination.tmp"
mv "$destination.tmp" "$destination"
echo "Updated $destination"
