# Resume source

`resume.tex` is the canonical source for the CV published at
`/files/Resume_Chen_Yixiang.pdf` on the website.

## Update workflow

1. Edit `resume/resume.tex` and any supporting files.
2. If XeLaTeX and Poppler are installed locally, run `make resume` from the
   repository root. This compiles into a temporary directory, validates the
   resulting PDF, and only then replaces the public PDF.
3. Commit and push the source changes. On pushes to `master`, GitHub Actions
   compiles and validates the resume, updates the public PDF in a bot commit,
   and requests a GitHub Pages rebuild.

The original template is distributed under the license in `resume/LICENSE`.
The large Adobe CJK font files and unused example documents from the original
download are deliberately excluded because the published resume is English and
does not depend on them.
