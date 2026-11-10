# Certification projection revocation — independent acceptance

- Acceptance line: `/root/public_transport_review` (independent of `/root/implement_model_config`).
- Reviewed: 2026-11-10, Windows, task worktree `certification-recovery/Nomi-native-multimodal`.
- Contract: `docs/fixes/2026-11-10-certification-projection-revocation.root-cause.json`.
- Design and acceptance scope: `docs/plan/2026-11-10-certification-projection-revocation.md`, especially ★9.
- Verdict: source and automated acceptance passed within the fresh-process/fresh-read scope below. Real installed-app restart and zh/en visual confirmation remain the coordinator's separate delivery evidence.

## Findings and verified invariant

No blocking finding remained in the reviewed implementation. Revocation belongs to the run projection store, is keyed by exact run ID, and is persisted in the same transaction that removes the projection. It does not change permanent submission/idempotency evidence.

The legacy migration requires every condition: a finalized operation, at least one mode, all modes settled, no pending promotion for that run, and positive evidence that the exact owning connection is absent. A sibling hostname, same model label, disabled/keyless connection, unreadable catalog, or unavailable catalog-existence port is not deletion evidence.

The review followed catalog invalidation, store load/get/list/latest, upsert/update/input/finalization writes, canonical duplicate start, startup recovery, promotion replay and terminal compensation. Late writes cannot reinsert revoked run IDs. New run IDs on the same connection remain writable. Old idempotency bindings continue pointing to their old canonical run; no replacement generation is allocated.

Pending promotion replay checks revocation before changing journal state. Unknown/submitted modes remain in the permanent ledger, including their original task identity, and still block unsafe new certification in the same lineage. The change does not mark them cancelled, finalized, verified or remotely settled.

## Independent checks executed

1. `pnpm exec vitest run electron/providerAdapter/projectionRecovery.test.ts electron/providerAdapter/store.test.ts electron/catalog/vendorValidationPersistence.test.ts --reporter=verbose` — **33 passed**, 3 files, no skipped case. The captured real Windows CDN fixture test executed and passed.
2. `pnpm exec vitest run electron/integrationCertification/promotionJournal.test.ts electron/providerAdapter/service.test.ts electron/providerAdapter/terminalGuaranteeStore.test.ts src/ui/onboarding/adapterVerificationViewModel.test.ts src/ui/onboarding/adapterTaskVisibility.test.ts --reporter=dot` — **80 passed**, 5 files.
3. `pnpm run check:root-cause-contracts` — **54 checker tests passed** and the changed high-risk production paths passed contract coverage.
4. `git diff --check` — passed.
5. After the small `defaultCatalog.hasConnection` read-only-state safeguard was added, independently reviewed its exact diff and ran `pnpm exec vitest run electron/catalog/vendorValidationPersistence.test.ts --reporter=verbose` — **10 passed**, including the malformed/unreadable catalog case. No unrelated full-suite rerun was necessary.

The real fixture is coordinator-captured and credential-free: old run `adapter-run-1a804942-b37f-4f78-a7db-f9aebc240bba`, missing exact CDN connection, finalized ledger, six settled modes and no pending promotion. Its private local fixture path is `.tmp/cdn-certification-real-fixture.json`; the fixture content is not copied into this public report. The test replayed two newly instantiated recoveries and asserted absence of the revived task plus byte-for-byte preservation of the permanent ledger.

## Acceptance checklist

| Boundary / counterexample | Result |
|---|---|
| Deleted finalized legacy owner, both existing synthesized failure and already-missing projection | Retired once; stays absent after two recoveries; audit bytes unchanged |
| Scope change, key clear, key disable, vendor deletion, transaction key/vendor deletion | Explicit revocation survives fresh recovery |
| Explicit invalidation when the projection is already missing but canonical ledger identity remains | Identity is still revoked; no recreation |
| Retired exact vendor key is later reused | Old run ID does not revive |
| A different new run ID on the same vendor | Remains writable |
| Late upsert, update, input write or promotion finalization | Rejected at shared store boundary |
| A stale persisted row appears alongside its revocation marker | Fresh get/list/latest suppress it |
| Same old idempotency intent submitted after revocation | Canonical old binding retained; replacement not staged |
| Exact owner still exists or absence cannot be established | Missing canonical run continues fail-closed |
| Empty mode evidence or non-finalized operation | No inferred settlement or automatic legacy retirement |
| Unknown/submitted ledger mode | Evidence unchanged; unsafe new submission still blocked |
| Pending promotion with explicit revocation | No catalog promotion; journal and ledger bytes unchanged through repeated recovery |
| Legacy missing owner with pending promotion | Not automatically retired |
| Genuine recovery failure after a long offline interval | Old createdAt preserved; terminal stage timing starts at recovery; elapsed is not 53-day record age |

## Explicit scope and remaining delivery evidence

- The accepted user path is startup recovery and all fresh service reads/writes. No live application, credentials, models, pricing, mappings or projects were modified by this acceptance line; no provider generation request was made.
- The already-mounted renderer task cache currently merges paged snapshots by union. It can retain an old task until settings are reopened or the application restarts. The coordinator explicitly excluded changing that pre-existing cache behavior from this repair; no pagination/list merge semantics or UI widgets are changed here.
- Archived ledger tombstones are not scanned by `recoverPreparedStarts` and have no owner data from which to resurrect a run. They remain permanent idempotency evidence. Legacy revisions without a surviving run/activeRevision cannot safely be assigned to a revoked identity; they are not guessed away by vendor-wide deletion during migration.
- Source tests and a real old-data replay are evidence of local persistence behavior, not evidence that every provider model works. Installed-build restart, existing current-model preservation and zh/en visual results are to be attached by the coordinating line before claiming user-visible completion.

## Push-gate discovery: Windows structural-test path filtering

The first ordinary pre-push run exposed a pre-existing cross-platform test-entry defect in `electron/shared/modelArchetypes/anchorPolicy.structure.test.ts`. Its source walker uses `path.join`, so Windows emits backslashes; exclusion via `endsWith('/index.ts')` and `endsWith('/types.ts')` failed to exclude those framework-owned files. The scanner then treated the legitimate derived `consumesAnchors` assignment in `index.ts` as an authored profile value. Neither this test nor that production file was changed by the initial certification repair.

The coordinating line authorized this acceptance line to change only that test's file-name filter to the already-imported `path.basename`. Both production invariants and all assertion bodies remain unchanged; no production, registry or seed file was edited by this line. This restores the same intended exclusion on Windows and POSIX instead of weakening the authored-profile rule.

- Red: `pnpm exec vitest run electron/shared/modelArchetypes/anchorPolicy.structure.test.ts --reporter=verbose` — 1 failed / 1 passed; `.tmp/anchor-policy-windows-red.log` records the Windows `electron\\shared\\modelArchetypes\\index.ts` false positive.
- Green: the identical command after the one-line filter change — 2 passed; `.tmp/anchor-policy-windows-green.log`.
- `git diff --check` passed. No commit or push was performed by this line.

The separate push failures in the side-by-side configuration scan and old-model re-verification were reported to the coordinating/implementation lines. Their corrections received the supplemental acceptance below; a full ordinary pre-push rerun remains the coordinating line's responsibility.

## Supplemental acceptance: automatic candidate disposal and real receipts

The ordinary push gate exposed an introduced class-boundary regression: automatic candidate cleanup called the same catalog deletion transaction as an explicit user disconnect. Recording every such deletion as projection revocation erased the genuine failed self-check receipt before the service could persist it. The old-model upgrade assertion was preserved, and its scenario now additionally runs startup recovery before reading the failure.

The implementation makes this existing intent explicit at the shared transaction boundary: user-facing deletion and the default transaction intent remain `disconnect`, while automatic candidate disposal passes `discard-candidate`. Independent source census found exactly five production automatic deletion calls, all converted:

| Owner | Existing automatic action | Checked intent |
|---|---|---|
| `providerAdapter/serviceCatalog.ts` `register` | Delete superseded unpublished candidate connections | `discard-candidate` |
| `providerAdapter/serviceCatalog.ts` `stage` | Delete superseded unpublished candidate connections | `discard-candidate` |
| `providerAdapter/serviceCatalog.ts` `fail` | Remove the unpublished failed temporary candidate | `discard-candidate` |
| `catalog/catalogCommit.ts` `commitOnboardedModelsToCatalog` | Remove superseded manual-onboarding candidates | `discard-candidate` |
| `catalog/comfyuiWorkflowImportStore.ts` `stageComfyWorkflow` | Remove superseded workflow candidates | `discard-candidate` |

The four superseded lists come from `planStagedVendorIdentity`, which excludes published connections. The failure cleanup retains its existing candidate-lineage and no-published-execution guards. Explicit user deletion still records revocation, as do key/scope invalidation paths. No error-message string determines migration: only a missing projection or the typed synthesized `failed` recovery receipt can be retired. Genuine failed and completed receipts remain readable even when their temporary candidate no longer exists.

After implementation freeze, this line independently executed:

- `pnpm exec vitest run electron/catalog/upgradeKeepsWorkingModels.test.ts electron/providerAdapter/projectionRecovery.test.ts electron/catalog/vendorValidationPersistence.test.ts --reporter=verbose` — **39 passed**, 3 files; `.tmp/certification-recovery-candidate-independent.log`. Includes all old-release request baselines, failed re-verification after restart, genuine failed/completed receipts across two recoveries, explicit disconnect versus candidate disposal, unknown/pending protection, and the captured real Windows CDN fixture (executed, not skipped).
- `pnpm exec vitest run electron/settings/sideBySideInstallSeed.test.ts electron/shared/modelArchetypes/anchorPolicy.structure.test.ts --reporter=verbose` — **7 passed**, 2 files; `.tmp/certification-recovery-seed-anchor-independent.log`.
- Independently inspected the coordinating line's seed change: `operations.json` is deliberately not seeded; the actual nested `integration-certification/operations.json` fixture stays absent from Preview and unchanged in the stable source. Audit is not copied as configuration.
- `git diff --check` passed after the supplemental production freeze and before this report update.

Supplemental verdict: the previously red old-model preservation, side-by-side seed decision and Windows path scanner cases now pass. No blocking finding remains in the revised source/targeted-test scope. The acceptance line made no supplemental production edits and performed no commit, push, live-state change or provider request. Installed final-build restart and ordinary push results remain separate coordinated evidence.

## Second push-gate discovery: Windows TypeScript-host path identity

The next ordinary push selected the pre-existing `src/workbench/sessionCleanupCensus.test.ts` and exposed a second platform-specific test-entry defect. Its real source census used native Windows absolute paths as in-memory map keys, while TypeScript normalized root names to forward slashes before calling `CompilerHost.getSourceFile`. Every actual source lookup missed, producing an empty AST census. The existing relative-path inline parser fixtures passed, but the nonempty-census assertion correctly failed; no production cleanup violation was found.

Under the coordinating line's explicit test-only authorization, this line normalized both the in-memory map keys and host lookup to TypeScript's slash format within the existing `parseProgram` boundary. Original registry, production-source and forbidden-cleanup assertions were retained. A backslash and forward-slash source fixture now each traverses the real AST census and must detect the forbidden `closeWhiteboard` call; no mocked result, dropped assertion or production change was used.

- Original solo red: **1 failed / 66 passed**, `.tmp/session-cleanup-windows-red.log`.
- Red after adding the two separator regression cases but before the parser repair: **2 failed / 67 passed**, `.tmp/session-cleanup-windows-class-red.log`; both the actual Windows census and backslash fixture failed.
- Identical solo command after repair, `pnpm exec vitest run src/workbench/sessionCleanupCensus.test.ts --reporter=verbose`: **69 passed**, `.tmp/session-cleanup-windows-green.log`.
- `pnpm exec eslint src/workbench/sessionCleanupCensus.test.ts` and `git diff --check` passed.

This line changed only the test and this report, with no commit/push or live mutation. The coordinating line separately owns the type-only catalog-store size reduction and its emitted-JavaScript parity check.
