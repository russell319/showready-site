# showready-site

The live files for beshowready.co.uk. Everything in `public_html/` is uploaded to Fasthosts by GitHub Actions.

How a build goes live:
1. A new build is committed to `main` (by Claude once GitHub is connected, or by Russell with GitHub Desktop).
2. GitHub asks Russell to approve the upload (Actions tab, "Review deployments"). Nothing goes live without that click.
3. Changed files are uploaded by FTPS; `.htaccess` on the server is never touched.
4. The check job compares the live pages with this repository and goes red if any differ.

Rollback: on GitHub, open the commit that broke things, choose "Revert", and approve the upload.
