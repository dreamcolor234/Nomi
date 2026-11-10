# Installed certification recovery verification

Status: 已实现未推送. The local installed application has been patched and verified; no GitHub workflow was started and no remote branch was pushed.

The initial source commit was blocked by the repository's repeated-fix direction-review gate. A separate [independent direction review](2026-11-10-certification-recovery-direction-check.md) recommends keeping the structural patch. The user explicitly approved this direction on November 10, 2026, with publication limited to the `dreamcolor234/Nomi` fork and no upstream PR. No commit bypass was used.

## User reproduction

The supplied screenshots showed an old `cdn-dragon3api-com` self-check with three image models, 0/3 progress, `Committed certification lost its canonical run record and was recovered fail-closed.`, and 4,597,469 seconds elapsed.

The installed public stores confirmed an operation created on September 17, 2026 and a reconstructed failure dated November 9, 2026. The exact CDN vendor and its models no longer existed. The permanent operation was finalized, all six modes were settled, and no promotion journal entry remained pending. The same image models were already usable on the current `DragonAPI` connection. This was an obsolete local projection, not a new provider rejection.

The credential-free real run/operation was replayed with the original packaged application in an isolated Windows profile. Before the patch, the failed old task remained visible in the durable projection. With the final package, two successive process launches retired the task, retained its revocation marker and preserved the operation ledger byte for byte. This replay made no generation request.

## Installed package

- Previous version: `0.24.1+refs.20261109.a781258dc`.
- Final installed version: `0.24.1+refs.20261109.a781258dc.recovery.20261110.2`.
- Final package SHA-256: `77c975519094514668e7990c87275a6a6dd28b28c98e1e466dbe3ed7ede68d4c`.
- Eight compiled modules changed: provider adapter store/catalog port, certification coordinator/promotion journal, catalog mutation/commit/ComfyUI staging, and the side-by-side seed exclusion policy. Package metadata identifies the local patch.
- All 14,602 other application files retain their original bytes. Existing native multimodal and canvas/reference fixes remain in the application. The catalog module was integrated with the installed native provider-normalization change using a three-way source merge and the same TypeScript emitter; Google native normalization was verified in the packaged process.
- The original package and certification metadata were backed up under `C:/Users/admin/AppData/Local/NomiLocalBackups/before-certification-recovery-20261110`.
- The application exited through its normal save-and-close flow before replacement. The real application restarted with the original settings and projects directories.

## Real installed checks

The fresh process reported ready, with no renderer crash. The old run was absent from get/list and its ID was durably revoked. The original operation ledger bytes, complete model catalog and encrypted credential records matched their pre-install snapshots.

The current `gpt-image-2.5-sunburst`, `gpt-image-2.5-sunburst-2k` and `gpt-image-2.5-sunburst-4k` rows remained usable. The video-only connection retained its 15 enabled usable models. Both user projects remained present, and the original project was reopened. No model capability, pricing, key or project migration was performed by this repair.

Both Chinese and English model-settings screens were captured and visually inspected. Neither displayed the retired CDN vendor, the old canonical-run error or the huge elapsed time. Chinese was restored afterwards. Local evidence:

- `.tmp/installed-recovery-verification.json`
- `.tmp/installed-recovery-zh.png`
- `.tmp/installed-recovery-en.png`
- `C:/Users/admin/AppData/Local/NomiLocalBuilds/certification-recovery-20261110/final/package-audit.json`
- Isolated `profile-before` and `profile-complete` recovery reports under the same local build directory. The final package also retained a genuine candidate failure receipt across restart while retiring the old CDN projection.

## Source validation and limits

See [independent acceptance](2026-11-10-certification-projection-acceptance.md) and [design/root-cause record](2026-11-10-certification-projection-revocation.md). Relevant persistence/recovery/service regressions, Electron compilation, root-cause contracts, ESLint and boundary checks passed.

The first full local gates run was not all green. Its log is `.tmp/certification-recovery-gates.log`; it included three new concept registrations, which were subsequently added and checked. Other failures include Windows/POSIX shell fixtures, a symlink `EPERM`, missing site/evidence assets and Git fixture objects from the partial clone. Vocabulary checks pass with the documented explicit `VOCAB_BASE_REF=origin/main` for this shallow checkout. Full test type checking also reports errors outside this task's changed files. These are not waived or described as passing, and no upstream merge is claimed.

The initial normal push hook caught an introduced regression: automatic candidate cleanup revoked a real failure receipt. This was fixed by explicit deletion intent at all five automatic cleanup sites, without admitting writes to revoked identities. Genuine failed/completed receipts also survive legacy recovery. The corrected seven-file lifecycle matrix passed all 100 tests; independent upgrade/recovery/catalog validation passed 39 tests, and seed isolation plus Windows anchor scanning passed 7 tests. The seed policy now explicitly excludes permanent certification audit data. The Windows anchor test path filter was corrected without weakening its production assertions.

The already-mounted renderer task cache keeps its existing merge behavior; this delivery verifies reopening/restart and fresh service reads. Unknown remote submissions and pending promotion audit records remain intact; the patch does not settle them, submit new work or add a new reconciliation UI. No paid model generation was needed or performed.
