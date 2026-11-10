# Installed certification recovery verification

Status: 已实现未推送. The local installed application has been patched and verified; no GitHub workflow was started and no remote branch was pushed.

The initial source commit was blocked by the repository's repeated-fix direction-review gate. A separate [independent direction review](2026-11-10-certification-recovery-direction-check.md) recommends keeping the structural patch. The user explicitly approved this direction on November 10, 2026, with publication limited to the `dreamcolor234/Nomi` fork and no upstream PR. No commit bypass was used.

## User reproduction

The supplied screenshots showed an old `cdn-dragon3api-com` self-check with three image models, 0/3 progress, `Committed certification lost its canonical run record and was recovered fail-closed.`, and 4,597,469 seconds elapsed.

The installed public stores confirmed an operation created on September 17, 2026 and a reconstructed failure dated November 9, 2026. The exact CDN vendor and its models no longer existed. The permanent operation was finalized, all six modes were settled, and no promotion journal entry remained pending. The same image models were already usable on the current `DragonAPI` connection. This was an obsolete local projection, not a new provider rejection.

The credential-free real run/operation was replayed with the original packaged application in an isolated Windows profile. Before the patch, the failed old task remained visible in the durable projection. With the final package, two successive process launches retired the task, retained its revocation marker and preserved the operation ledger byte for byte. This replay made no generation request.

## Installed package

- Previous version: `0.24.1+refs.20261109.a781258dc`.
- Installed version: `0.24.1+refs.20261109.a781258dc.recovery.20261110`.
- Package SHA-256: `dcdb7c1e25d24a596be3f4816c2205125f6783a3de85c43137feac6e76244bad`.
- Four compiled modules changed: provider adapter store/catalog port and certification coordinator/promotion journal. Package metadata identifies the local patch.
- All 14,606 other application files retain their original bytes. Existing native multimodal and canvas/reference fixes remain in the application.
- The original package and certification metadata were backed up under `C:/Users/admin/AppData/Local/NomiLocalBackups/before-certification-recovery-20261110`.
- The application exited through its normal save-and-close flow before replacement. The real application restarted with the original settings and projects directories.

## Real installed checks

The fresh process reported ready, with no renderer crash. The old run was absent from get/list and its ID was durably revoked. The original operation ledger bytes, complete model catalog and encrypted credential records matched their pre-install snapshots.

The current `gpt-image-2.5-sunburst`, `gpt-image-2.5-sunburst-2k` and `gpt-image-2.5-sunburst-4k` rows remained usable. The video-only connection retained its 15 enabled usable models. Both user projects remained present, and the original project was reopened. No model capability, pricing, key or project migration was performed by this repair.

Both Chinese and English model-settings screens were captured and visually inspected. Neither displayed the retired CDN vendor, the old canonical-run error or the huge elapsed time. Chinese was restored afterwards. Local evidence:

- `.tmp/installed-recovery-verification.json`
- `.tmp/installed-recovery-zh.png`
- `.tmp/installed-recovery-en.png`
- `C:/Users/admin/AppData/Local/NomiLocalBuilds/certification-recovery-20261110/package-audit.json`
- Isolated `profile-before`, `profile-final` recovery reports under the same local build directory.

## Source validation and limits

See [independent acceptance](2026-11-10-certification-projection-acceptance.md) and [design/root-cause record](2026-11-10-certification-projection-revocation.md). Relevant persistence/recovery/service regressions, Electron compilation, root-cause contracts, ESLint and boundary checks passed.

The full local gates run is not all green. Its log is `.tmp/certification-recovery-gates.log`; failures include Windows/POSIX shell fixtures, Windows path-separator expectations, a symlink `EPERM`, and missing Git fixture objects from the partial clone. Full test type checking also reports errors outside this task's changed files. These are not waived or described as passing, and no upstream merge is claimed.

The already-mounted renderer task cache keeps its existing merge behavior; this delivery verifies reopening/restart and fresh service reads. Unknown remote submissions and pending promotion audit records remain intact; the patch does not settle them, submit new work or add a new reconciliation UI. No paid model generation was needed or performed.
