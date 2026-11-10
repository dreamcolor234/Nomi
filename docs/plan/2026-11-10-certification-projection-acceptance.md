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
