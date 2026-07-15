# new-api Source Provenance

MatrixAPI maintains a pinned copy of the upstream gateway source in
`output/new-api-src` so the React console and Go binary can be built together
as one reproducible image.

- Upstream repository: `https://github.com/QuantumNous/new-api.git`
- Upstream tag: `v1.0.0-rc.18`
- Upstream commit: `c9943d37ad93477dd937fc4901cc3c4e0fd8aaab`
- Imported: `2026-07-10`
- License: GNU Affero General Public License v3.0

All upstream copyright headers, license files, project metadata, and
QuantumNous/new-api attribution are preserved. MatrixAPI changes are limited
to deployment integration, MatrixAPI-owned presentation, route compatibility,
and product policy constraints such as Alipay-only payment presentation.

To refresh the baseline, clone the required upstream revision outside this
repository, verify its tag and commit, export only tracked files, and replace
the maintained tree without copying nested `.git`, build output, dependencies,
environment files, logs, uploads, or runtime data. Reapply the MatrixAPI patch
set, then run the frontend, static, Docker, and browser regression gates before
accepting the update.
