# Certification projection revocation

## ★0 Prior decisions and existing mechanisms

- `docs/fixes/2026-09-05-vendor-validation-error-persists.root-cause.json`: connection invalidation removes current run/revision projections, preserving audit ledgers. Keep that separation and record the revocation explicitly.
- `docs/fixes/2026-08-28-idempotent-certification-ledger.root-cause.json`: permanent idempotency and unknown submissions survive restart. Never delete or invent terminal ledger entries to clean the UI.
- `electron/providerAdapter/serviceRunLifecycle.ts`: terminal failures initialize stage timing. Reuse that rule for reconstructed terminal failures.
- 出口：`electron/providerAdapter/service.ts` canonical start and recovery preserve old idempotency identity; a new explicit certification gets a new identity. Revocation must never silently start another request.

## ★1 User result and measurement

When users remove or correct a connection, its revoked self-check must stay removed after restarting. An old unavailable CDN connection must not appear as a new 0/3 failure. Real missing records continue reporting recovery failure, without claiming a provider rejection.

Real case: run `adapter-run-1a804942-b37f-4f78-a7db-f9aebc240bba`, absent `cdn-dragon3api-com`, created 2026-09-17, reconstructed 2026-11-09. Coordinator holds the credential-free public fixture in `.tmp/cdn-certification-real-fixture.json`; do not publish its full content. Other cases: correction of a scope/key on a connection that remains present; a genuinely lost canonical run on an unchanged connection.

Metrics: projection resurrection 0, audit modifications 0, old credential/catalog changes 0, known revoked async writes 0 admitted. Instruments: `projectionRecovery.test.ts`, store tests, catalog invalidation tests and real Windows replay. Timing oracle: same old createdAt, terminal elapsed 0 at recovery, not 53 days. Visual verification remains with coordinator.

### ★1b Related surfaces

Recent tasks and model detail read the same adapter run projection. No new widgets, layout or copy. Canonical duplicate start reports revoked identity instead of allocating a replacement.

### ★1c Existing users

State v1 gains optional run-ID revocation metadata. Existing files without it load normally. A conservative recovery migration only retires settled records belonging to absent exact connections with no pending promotion. No model, pricing, mapping, credential or project migration. Downgrades do not understand new revocation metadata and cannot guarantee this fix.

## ★2 Owner

`ProviderAdapterStore` owns current projections and their revocation. `OperationLedger` and `PromotionJournal` own audit/settlement, never presentation. Deletion and identity allocation stay distinct. Generated door map is recorded in the root-cause contract; legitimate workers share one write admission boundary.

The shared catalog transaction also carries deletion intent. `disconnect` (the compatible default used by user deletion) revokes current projections; `discard-candidate` removes service-owned temporary catalog state while preserving its genuine result receipt. All five production automatic-deletion calls use the latter: adapter registration, staging and failure cleanup, normal onboarding superseded candidates, and ComfyUI superseded candidates. This is source intent, not permission for a revoked run to write again.

Concept registration follows those distinct responsibilities: `certification.run-projection` registers the store and its revocation write boundary; `certification.start-recovery` registers the coordinator's restart disposition; `certification.promotion-replay` registers the existing `PromotionJournal` class that owns journal mutation and replay. The latter uses the unique class anchor instead of the generic method name `replay`, which also names unrelated repository methods. These three registry JSON files document existing production ownership and add no runtime behavior or audit state; the catalog's existing certification-ownership concept continues deciding who owns a model execution contract.

## ★3 Alternatives

1. Only skip absent vendors: smaller but misses key/scope invalidation of present connections.
2. Reuse cancelled/finalized ledger states: rejected because presentation revocation is not remote settlement.
3. Record revoked run identities in the existing store: chosen; same transaction deletes projections, all writers consult the marker, audit stays intact.

No new store or second registry. Exact connection existence comes from a read-only catalog port, not enabled/key state. Existing native journal replay receives a skip predicate before audit mutation for revoked local publications.

## ★4 States

Revoked: absent from the server's current tasks and after reopening; old identity cannot be revived. Genuine missing: failed recovery with current terminal timing. Unknown/submitted: audit retained and duplicate/new unsafe submission still blocked. Pending publication: withheld locally without fabricating aborted/finalized evidence. Empty/available/successful current runs retain existing behavior. Cancellation semantics unchanged.

## 5 Interruptions

Deletion and revocation commit atomically in the projection store. Crash before commit leaves old projection, after commit leaves revocation. Fresh processes read revocation. Delayed worker writes reject. No provider create is part of recovery; audit uncertainty is not retried. Pending journal entries stay pending when the local projection is revoked.

## 6 Data and failure

Only local catalog/projection/audit records are read. Ledger and journal remain validated by their existing owners. Legacy absence alone cannot retire ambiguous work. Invalid/unknown state continues failing closed. A missing exact vendor is not matched by hostname, sibling or same model label.

## ★7 Performance

No new user operation. Revocations add one identity set to the existing projection read/write. Recovery builds one pending-run set per pass; catalog existence is a pure read. No polling, network, rendering loop or generation added.

## 8 Real conditions

Windows credential-free old fixture captured by coordinator. Implementation tests use temporary directories and genuine store/ledger classes. Real UI replay, zh/en screenshots and application build are coordinated separately. No paid verification is necessary for a local persistence fix.

## ★9 Acceptance and rollback

- Existing deleted CDN record and absent-run form both converge across two restarts, even if the same key is later reused for a new connection.
- Real failed/completed receipts survive automatic candidate disposal and restart. Legacy cleanup distinguishes the structural recovery marker from genuine results and never uses an error-message string.
- Scope changes, key disable/clear and delete remove projections permanently; unrelated connections stay unchanged.
- Revoked async upsert/input writes and canonical duplicate starts cannot resurrect or allocate work.
- Unrevoked missing run on an existing or uncertain catalog target remains fail-closed.
- Unknown/submitted work and pending promotion are unchanged in audit; no create, verify, promotion or schedule runs for revoked IDs.
- Legacy cleanup does not retire empty ambiguous modes, unavailable catalog evidence or a pending journal.
- All recovery failure paths initialize terminal timing; old createdAt remains unchanged.
- Core store, coordinator, catalog invalidation, promotion journal, service and view-model regressions pass, followed by app/electron type checks and relevant gates.

Independent acceptance: coordinating agent assigns a separate line after implementation freeze. Rollback: revert the eventual task commit; no configuration rollback, credential rotation or model migration. Do not erase revocation records during rollback.

## 真实场景复现

- 用户的流程：打开模型自检任务，旧 CDN 的三模型显示 0/3、canonical run missing 和巨大秒数。
- 我走的：重放协调线捕获的无凭据旧 run/ledger，目标连接已不存在，执行两次新实例恢复。
- 差别：测试不发供应商请求；Windows UI由协调线复验。
- 修前：恢复会创建/保留旧失败投影，elapsed使用53天记录年龄。
- 修后：最终安装包用同份真实旧记录连续启动两次，旧任务保持消失且审计字节不变；随后本机正式安装并重启，中英文设置页面均无旧失败卡。模型目录及加密凭据与修复前一致，见 `2026-11-10-certification-installed-verification.md`。

## 系统改进

Durable revocation evidence closes deletion/restart/async-writer lifecycle, and conservative legacy recovery separates current task projection from immutable submission audit.

## Read-face audit and precise limits

- Store `getRun`, `latestRun`, `listRuns`, `snapshot` and `getRunInput` refresh through the same revocation-aware load. Worker/service consumers already tolerate missing runs; terminal compensation reads missing as no work. Tests cover late writes and a stale external writer reinserting a revoked row.
- `HttpApiProviderConnector.get/latest/list` and `ConnectionCertificationService` delegate to these store reads; IPC and `OnboardingDrawer` consume their projections. `appIntegration` lists active runs through the same service. No caller is allowed to reinterpret a revoked row as a new intent.
- `useProviderAdapterTasks` unions server results into renderer memory. An already mounted settings surface may retain an old row until remount/restart. This change does not claim to synchronize that separate renderer cache; no UI module is changed.
- The generated door census also lists unrelated methods named `listRuns`/`replay` in production-run, proposal and experience repositories. They do not read `provider-adapters.json` and their behavior is unchanged.
- Ledger tombstones/archives contain permanent identity summaries, not source ownership, and are not scanned by `recoverPreparedStarts`; they cannot resurrect a projection. Their hashes and contents remain unchanged. Legacy migration only scans validated active operation records.
- A legacy missing run without `activeRevision` cannot identify an orphan revision safely: revisions carry no runId. Legacy cleanup removes only directly associated revisions; it never deletes another run's pending draft by guessing vendor ownership. Explicit vendor invalidation retains its existing complete per-vendor revision/input cleanup.
- Unknown remote submissions remain readable through the unchanged `OperationLedger.getByRunId`, permanent idempotency bindings and existing audit records. Revocation does not provide a new accounting UI or automatic reconciliation; uncertain historic work still requires manual review.
- Read-only, newer-version or unreadable catalog state yields unknown existence, so it never counts as proof of a deleted legacy owner.

## Implementation validation

Before implementation, the new recovery/store slice failed 7 assertions: explicit revocation, both legacy presence shapes, exact captured Windows case, old timing, pending replay, and delayed write admission. After implementation the current core slice passes 34 tests across 3 files. Surrounding journal/terminal/view-model slice passes 6 files / 64 tests; service alone passes 47. The initial parallel service batch hit a Vitest source-map decoding infrastructure error; the same service file passed alone without code changes.

Electron production types, ESLint, diff whitespace, boundary ratchet and root-cause contracts pass. The full `tsconfig.test.json` check is separately recorded: 10 errors remain in unrelated production-run fixtures and removed lab-script imports; the changed production and test paths report no errors. Evidence logs are in `.tmp/certification-recovery-*.log`, kept out of the public patch because they include local execution context.

Final production scope contains seven behavior modules: `providerAdapter/store`, `providerAdapter/serviceCatalog`, `integrationCertification/providerAdapterCoordinator`, `integrationCertification/promotionJournal`, `catalog/catalogStore`, `catalog/catalogCommit`, and `catalog/comfyuiWorkflowImportStore`; `providerAdapter/types.ts` adds only the optional state field. The coordinator's `settings/sideBySideInstallSeed` update explicitly keeps `integration-certification/operations.json` installation-bound and unseeded, with its existing five-test policy suite; it is the eighth emitted module and does not change the audit or seed any execution history into another installation.

## Candidate-cleanup regression caught before publishing

The upgrade compatibility check exposed an introduced regression: `serviceCatalog.fail` automatically discarded a failed candidate using the same transaction deletion operation as user disconnection. The new invalidator consequently revoked the run before its real failed receipt was written. The existing upgrade assertion failed with `undefined` instead of `failed`; two added receipt tests independently proved legacy recovery would also hide genuine failed/completed results after automatic cleanup.

The repair carries explicit deletion intent at the earliest shared catalog mutation boundary and updates every automatic caller. Legacy retirement now accepts only a missing run or a failed projection carrying `recovery.reasonCode=certification_start_rolled_back`; genuine existing results remain intact. The original upgrade assertion is retained and its real failure now also runs through restart recovery. The final corresponding slice passes seven files / 100 tests, Electron types and the vocabulary gate with `VOCAB_BASE_REF=origin/main`.

Independent source acceptance: `docs/plan/2026-11-10-certification-projection-acceptance.md` (`/root/public_transport_review`). The real installed application replay remains coordinated delivery evidence; no completion claim is based on source tests alone.
