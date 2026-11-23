# Audit and cleanup report — 2026-11-24

A full pass over the repository: release pipeline, CI, security, dependencies,
open issues/PRs, and cleanup. Everything below is either merged to `master`,
changed in repository settings, or explicitly still open.

## Starting point

- Released version: **1.0.18** (2026-11-17).
- 12 open issues, 10 open PRs.
- **Release and OCR CI were hard-blocked**: upstream `microsoft/onnxruntime`
  removed the 1.31.0 archives, and both workflows downloaded them.
- `cli/Cargo.lock` was stale; `cargo --locked` failed on a clean checkout.
- No `fmt`/CLI/Windows checks in CI; OCR ran on every dependency bump.
- Secret scanning and code scanning were off; the default workflow token was
  write; the existing branch ruleset matched no branch.
- The updater command accepted a caller-supplied URL and could skip checksum
  verification; the webview had no CSP.

## What changed

### Release pipeline

| Change | Why | PR |
|---|---|---|
| Fetch ONNX Runtime from the **v1.0.18 bundles** (portable zips, `.deb`, `.dmg`), verify against that release's `SHA256SUMS` | Upstream deleted 1.31.0; the exact known-good library was already in our own release | #220 |
| One shared `fetch-ort` composite action, `--locked` builds, Windows + Linux + macOS OCR validated | The two workflows had drifted and were both dead | #220 |
| Refreshed `cli/Cargo.lock`; added a CLI CI job (`fmt`, `test`, `clippy`) | `--locked` failed on a clean checkout; the CLI workspace was only built at tag time | #211 |
| Removed `Cargo.lock` from the OCR path filter | Every Dependabot bump paid for three ~10-minute real-model jobs | #211 |
| Restored `Rust (Windows)` compile check | My #211 rewrite accidentally dropped the job #196 added; Windows-only code stopped compiling before release | #231 |

Note: an initial `ort-vendor-1.31.0` release was published to carry the
archives. It was **removed**: the Releases page is for Kensaku releases. #220
replaced it by extracting the runtime from the existing 1.0.18 assets.

### Security

| Change | Why | PR / setting |
|---|---|---|
| `download_update` must match the asset from `check_for_update`, use an https URL under this repository, and have a `SHA256SUMS` entry; missing checksum now fails | Any webview JS could otherwise download and execute an arbitrary URL | #213 |
| Strict production CSP + `devCsp` for Vite; inline theme script moved to `public/theme-boot.js`; asset protocol disabled | `csp: null` was the only containment layer over a high-privilege command surface; the protocol was unused | #213 |
| Secret scanning + push protection enabled | Public repo, both were off | repository setting |
| Default workflow token set to **read** | CI/OCR only need read; release declares its own writes | repository setting |
| Existing ruleset applied to `~DEFAULT_BRANCH` (deletion + non-fast-forward) | It was active but matched no branch | repository setting |
| CodeQL runs **daily only**, no PR cost; Rust uses `build-mode: none` | Default setup added a 15–20-minute Rust analysis to every PR | #223, #226 |
| Dependabot switched from `npm` to `bun`; `package-lock.json` removed; major bumps ignored | Dependabot wrote a lockfile CI never reads, so every npm PR failed before tests | #224 |

### Product bugs and quality

| Change | Why | PR |
|---|---|---|
| `useStats` timeout + single in-flight request | A blocked `get_stats` latched the UI on "Waiting for backend" (#206) | #221 |
| PP-OCR dictionary bundled in the app | It was the only OCR artifact with no mirror; blocked networks failed the whole pack (#208) | #222 |
| `make ort` / `tools/stage-ort.ps1` | Local builds don't bundle ONNX Runtime, so OCR never loaded (#197) | #225 |
| Windows volume-root pruning | `C:\` scans walked WinSxS, ProgramData, every profile's AppData, recycle/recovery trees (#207) | #230 |

### Dependencies

Merged: `interprocess` (#199), grouped cargo updates (#219), grouped npm
updates (#227), `zip` (#228), `rusqlite` 0.43 (#229, with the CLI lock refresh).

Closed as superseded: #214–#218 (npm-ecosystem PRs that could never pass the
bun frozen-lockfile step).

### Community

- Reviewed #210, #198, #194 with concrete blockers (all still open, waiting on
  their authors).
- Replied to every open issue with a diagnosis or next step.
- Closed **#208** (fixed by #222), **#197** (fixed by #225), **#174** (fix
  shipped in 1.0.18), **#71** (decision: no OXR integration).
- Added status notes to **#206** and **#207** describing what is fixed and
  what remains.
- Deleted the three stale Dependabot branches and the local `rusqlite-bump`
  branch.

## Current state

- `master` CI, OCR, and the daily CodeQL workflow are green, including the
  restored Windows compile job.
- `v1.0.18` is still the only/latest release. **No version was bumped and no
  tag was created.**
- Open PRs: **#210, #198, #194** (cross-repo, changes requested).
- Open issues: **#209, #207, #206, #205, #163, #138, #73, #67**.

## Still open, and why

| Item | Status | Why it is not merged |
|---|---|---|
| #206 backend | Open | Paused embed-worker restart and semantic delete-after-insert need a large-corpus run; the visible stats latch is fixed in #221 |
| #207 streaming walk / startup | Open | Refactor of the indexing hot path; needs a 400k-file Windows corpus and cancellation/ordering tests. Volume-root pruning is merged in #230 |
| #210 setup dedupe | Open | Windows test, UNC handling, offline-folder behavior, and i18n fixes requested from the author |
| #198 macOS daemon | Open | Needs a health check before the macOS early return, a non-tautological test, and doc updates |
| #194 themes | Open | `prefers-reduced-transparency` and an ARCHITECTURE typo |
| #209 | Open | Blocked on #210 |
| #138 | Open | Blocked on #194 |
| #205, #67, #163 | Open | Feature requests / design work, not scheduled |
| #73 | Open | Tracking macOS signing/notarization; #198 is only a mitigation |
| CSP smoke test | Pending | The app has not been launched with the new CSP; revert #213 if the window is blank |

## Next release checklist

1. Smoke-test the built app (CSP, OCR, search).
2. Run the three-platform OCR workflow and the real-model Indra tests.
3. Bump `package.json`, `src-tauri/Cargo.toml`, `tauri.conf.json`,
   `src-tauri/Cargo.lock`, and refresh `cli/Cargo.lock`.
4. Update `CHANGELOG.md` with the security and reliability changes.
5. Tag `v1.0.19`, verify the draft assets and signatures, publish.
