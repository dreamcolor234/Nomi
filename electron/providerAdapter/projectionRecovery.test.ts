import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProviderAdapterStore } from './store';
import type { ProviderAdapterRun } from './types';
import type { ProviderAdapterCatalogPort } from './serviceCatalog';
import { ProviderAdapterCertificationCoordinator } from '../integrationCertification/providerAdapterCoordinator';
import { OperationLedger, writeCertificationJsonAtomic } from '../integrationCertification/operationLedger';
import { PromotionJournal } from '../integrationCertification/promotionJournal';
import { certificationModeOperationKey } from '../integrationCertification/modeIdentity';
import type { CertificationOperationRecord } from '../integrationCertification/types';
import { adapterRunElapsedSeconds } from '../../src/ui/onboarding/adapterVerificationViewModel';

const directories: string[] = [];
const START = '2026-09-17T05:26:01.953Z';
const RECOVER = '2026-11-09T10:30:31.647Z';
const VENDOR = 'old-relay';
const RUN = 'old-run';
afterEach(() => { for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true }); });

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nomi-projection-recovery-'));
  directories.push(directory);
  const storePath = path.join(directory, 'provider-adapters.json');
  const ledgerPath = path.join(directory, 'integration-certification', 'operations.json');
  const journalPath = path.join(directory, 'integration-certification', 'promotion-journal.json');
  const store = new ProviderAdapterStore(storePath);
  const ledger = new OperationLedger(ledgerPath);
  const journal = new PromotionJournal(journalPath);
  let exists = true;
  const catalog: ProviderAdapterCatalogPort & { hasConnection: (key: string) => boolean } = {
    register: vi.fn(), stage: vi.fn(), load: vi.fn(),
    promote: vi.fn(() => ({ status: 'no-lease' as const })), fail: vi.fn(),
    hasConnection: (key) => exists && key === VENDOR,
  };
  const coordinator = () => new ProviderAdapterCertificationCoordinator(new ProviderAdapterStore(storePath), catalog, () => RECOVER, {
    operationLedger: new OperationLedger(ledgerPath), promotionJournal: new PromotionJournal(journalPath),
  });
  const run: ProviderAdapterRun = {
    id: RUN, vendorKey: VENDOR, vendorName: VENDOR, lineageRootVendorKey: VENDOR,
    connectionFingerprint: 'fixture', selectedModelKeys: ['image-v1'], stage: 'queued', repairAttempt: 0,
    models: [{ modelKey: 'image-v1', labelZh: 'Image', kind: 'image', modes: [] }], sourceUrls: [], createdAt: START, updatedAt: START,
  };
  const begun = ledger.begin({ runId: RUN, contractDigest: 'a'.repeat(64), idempotencyKey: 'old-intent', lineageRootVendorKey: VENDOR,
    sourceVendorKey: VENDOR, selectedModels: [{ modelKey: 'image-v1', labelZh: 'Image', kind: 'image' }],
    leaseOwner: RUN, leaseToken: 'lease', attempt: 1, childRunRef: { runId: RUN, revisionDigest: 'a'.repeat(64) }, now: START });
  let operation = begun.operation!;
  for (const state of ['run_persisted', 'catalog_staged', 'committed'] as const) {
    operation = ledger.markStartTransaction(RUN, { state, expectedRevision: operation.revision,
      ...(state !== 'run_persisted' ? { stagedVendorKey: VENDOR } : {}), now: START });
  }
  const mode = (state: 'settled' | 'unknown' | 'submitted') => {
    operation = ledger.getByRunId(RUN)!;
    operation = ledger.markSubmitting(RUN, { operationKey: certificationModeOperationKey('image-v1', 'text_to_image', 1),
      modelKey: 'image-v1', taskKind: 'text_to_image', attempt: 1, providerIdempotency: 'unknown', expectedRevision: operation.revision, now: START });
    if (state === 'unknown') operation = ledger.markUnknown(RUN, { expectedRevision: operation.revision, userAction: 'reconcile_or_contact_provider', now: START });
    else if (state === 'submitted') operation = ledger.markSubmitted(RUN, { expectedRevision: operation.revision, remoteTaskId: 'remote-1', now: START });
    else {
      operation = ledger.markSettled(RUN, { expectedRevision: operation.revision, result: { ok: true, taskKind: 'text_to_image' }, now: START });
      operation = ledger.markCheckpoint(RUN, { checkpoint: 'finalized', expectedRevision: operation.revision, now: START });
    }
  };
  const pending = () => journal.prepare({ journalId: `promotion-${RUN}`, runId: RUN, lineageRootVendorKey: VENDOR, leaseToken: 'lease',
    proposedRevisionId: 'revision-old', contractDigest: 'a'.repeat(64), verifiedModes: [{ modelKey: 'image-v1', taskKind: 'text_to_image' }],
    childRunRef: { runId: RUN, revisionDigest: 'a'.repeat(64) }, terminalStage: 'completed', now: START });
  return { directory, storePath, ledgerPath, journalPath, store, ledger, journal, run, catalog, coordinator, mode, pending, absent: () => { exists = false; } };
}

describe('certification projection recovery', () => {
  it('does not resurrect an explicitly revoked run on a still-present connection after two restarts', () => {
    const f = fixture();
    f.store.upsertRun(f.run);
    f.store.setRunInput({ runId: RUN, docs: 'private local input', updatedAt: START });
    const audit = fs.readFileSync(f.ledgerPath, 'utf8');
    f.store.deleteRunsForVendors(new Set([VENDOR]));
    f.coordinator().recoverPreparedStarts();
    f.coordinator().recoverPreparedStarts();
    expect(new ProviderAdapterStore(f.storePath).listRuns()).toEqual([]);
    expect(new ProviderAdapterStore(f.storePath).getRunInput(RUN)).toBeUndefined();
    expect(fs.readFileSync(f.ledgerPath, 'utf8')).toBe(audit);
  });

  it.each([true, false])('retires a finalized legacy orphan with projection present=%s and preserves its audit', (present) => {
    const f = fixture();
    f.mode('settled');
    f.absent();
    if (present) f.store.upsertRun({ ...f.run, stage: 'failed', updatedAt: RECOVER,
      recovery: { reasonCode: 'certification_start_rolled_back', userAction: 'restart_certification' }, error: 'Opaque recovered failure' });
    const audit = fs.readFileSync(f.ledgerPath, 'utf8');
    f.coordinator().recoverPreparedStarts();
    f.coordinator().recoverPreparedStarts();
    expect(new ProviderAdapterStore(f.storePath).listRuns()).toEqual([]);
    expect(new ProviderAdapterStore(f.storePath).snapshot()).toMatchObject({ revokedRunIds: [RUN] });
    expect(fs.readFileSync(f.ledgerPath, 'utf8')).toBe(audit);
  });

  it.each(['failed', 'completed'] as const)('preserves a genuine %s receipt after its automatic candidate cleanup', (stage) => {
    const f = fixture(); f.mode('settled'); f.absent();
    const receipt = { ...f.run, stage, updatedAt: RECOVER, error: stage === 'failed' ? 'Real contract self-check failed' : undefined };
    f.store.upsertRun(receipt);
    const audit = fs.readFileSync(f.ledgerPath, 'utf8');
    f.coordinator().recoverPreparedStarts(); f.coordinator().recoverPreparedStarts();
    expect(f.store.getRun(RUN)).toMatchObject({ id: RUN, stage });
    expect(f.store.getRun(RUN)?.error).toBe(receipt.error);
    expect(f.store.isRunProjectionRevoked(RUN)).toBe(false);
    expect(fs.readFileSync(f.ledgerPath, 'utf8')).toBe(audit);
  });

  it('keeps genuine missing runs fail-closed and uses recovery time instead of 53 days of history', () => {
    const f = fixture();
    f.coordinator().recoverPreparedStarts();
    const recovered = f.store.getRun(RUN)!;
    expect(recovered.stage).toBe('failed');
    expect(recovered.createdAt).toBe(START);
    expect(recovered.stageStartedAt).toBe(RECOVER);
    expect(adapterRunElapsedSeconds(recovered)).toBe(0);
    expect(f.catalog.load).not.toHaveBeenCalled();
  });

  it.each(['unknown', 'submitted'] as const)('never retires ambiguous legacy %s work merely because its connection is gone', (state) => {
    const f = fixture();
    f.mode(state); f.absent();
    const audit = fs.readFileSync(f.ledgerPath, 'utf8');
    f.coordinator().recoverPreparedStarts();
    expect(f.store.getRun(RUN)).toBeDefined();
    expect(fs.readFileSync(f.ledgerPath, 'utf8')).toBe(audit);
  });

  it('does not infer settlement from an empty mode set or unfinished checkpoint', () => {
    const f = fixture(); f.absent();
    f.coordinator().recoverPreparedStarts();
    expect(f.store.getRun(RUN)).toBeDefined();
  });

  it('preserves a pending promotion and skips its local publication after explicit revocation', () => {
    const f = fixture(); f.mode('settled'); f.pending(); f.store.upsertRun(f.run);
    const audit = fs.readFileSync(f.ledgerPath, 'utf8');
    const pending = fs.readFileSync(f.journalPath, 'utf8');
    f.store.deleteRunsForVendors(new Set([VENDOR]));
    const c = f.coordinator(); c.recoverPreparedStarts();
    expect(() => c.replayPromotions()).not.toThrow();
    const restarted = f.coordinator(); restarted.recoverPreparedStarts();
    expect(() => restarted.replayPromotions()).not.toThrow();
    expect(f.catalog.promote).not.toHaveBeenCalled();
    expect(fs.readFileSync(f.journalPath, 'utf8')).toBe(pending);
    expect(fs.readFileSync(f.ledgerPath, 'utf8')).toBe(audit);
    expect(f.store.listRuns()).toEqual([]);
  });

  it('does not migrate an absent legacy connection when a promotion is pending', () => {
    const f = fixture(); f.mode('settled'); f.pending(); f.absent();
    f.coordinator().recoverPreparedStarts();
    expect(f.store.getRun(RUN)).toBeDefined();
  });

  it('keeps revoked unknown audit readable and blocks a new certification in its lineage', () => {
    const f = fixture(); f.mode('unknown'); f.store.upsertRun(f.run);
    const audit = fs.readFileSync(f.ledgerPath, 'utf8');
    f.store.deleteRunsForVendors(new Set([VENDOR])); f.coordinator().recoverPreparedStarts();
    expect(f.store.listRuns()).toEqual([]);
    expect(f.ledger.getByRunId(RUN)?.submissionState).toBe('unknown');
    expect(f.ledger.canonicalRunForIdempotencyKey('old-intent')).toBe(RUN);
    expect(() => f.ledger.begin({ runId: 'new-run', contractDigest: 'b'.repeat(64), idempotencyKey: 'new-intent', lineageRootVendorKey: VENDOR,
      leaseOwner: 'new-run', leaseToken: 'new-lease', attempt: 1, childRunRef: { runId: 'new-run', revisionDigest: 'b'.repeat(64) }, now: RECOVER }))
      .toThrow(/unresolved remote submission/i);
    expect(fs.readFileSync(f.ledgerPath, 'utf8')).toBe(audit);
  });

  it('rejects a duplicate old intent after revocation without materializing a replacement run', async () => {
    const f = fixture();
    const input = { vendorName: 'Fixture', baseUrl: 'https://relay.example/v1', authType: 'bearer' as const, apiKey: 'fixture-only',
      models: [{ modelKey: 'image-v1', kind: 'image' as const }],
      certification: { contractDigest: 'c'.repeat(64), idempotencyKey: 'duplicate-intent', remoteIdempotency: 'unknown' as const } };
    const c = f.coordinator();
    await c.prepareStart(input, 'duplicate-original', VENDOR);
    f.store.upsertRun({ ...f.run, id: 'duplicate-original' });
    f.store.deleteRunsForVendors(new Set([VENDOR]));
    await expect(c.prepareStart(input, 'must-not-materialize', VENDOR)).rejects.toThrow(/revoked/i);
    expect(f.ledger.canonicalRunForIdempotencyKey('duplicate-intent')).toBe('duplicate-original');
    expect(f.ledger.getByRunId('must-not-materialize')).toBeUndefined();
    expect(f.store.listRuns()).toEqual([]);
    expect(f.catalog.stage).not.toHaveBeenCalled();
  });

  it('does not resurrect a retired legacy identity when its exact connection is added again', () => {
    const f = fixture(); f.mode('settled'); f.absent();
    f.coordinator().recoverPreparedStarts();
    f.catalog.hasConnection = () => true;
    f.coordinator().recoverPreparedStarts();
    expect(f.store.listRuns()).toEqual([]);
  });

  it('does not infer an absent exact owner when the catalog port has no existence evidence', () => {
    const f = fixture(); f.mode('settled'); f.catalog.hasConnection = undefined as unknown as () => boolean;
    f.coordinator().recoverPreparedStarts();
    expect(f.store.getRun(RUN)?.stage).toBe('failed');
  });

  it.each([false, true])('uses terminal recovery timing for an interrupted intent with existing projection=%s', (exists) => {
    const f = fixture();
    const operation = f.ledger.getByRunId(RUN)!;
    writeCertificationJsonAtomic(f.ledgerPath, { version: 3, operations: [{ ...operation,
      startTransaction: { ...operation.startTransaction, state: 'intent', stagedVendorKey: undefined } }], tombstones: [], archives: [] });
    if (exists) f.store.upsertRun(f.run);
    f.coordinator().recoverPreparedStarts();
    const recovered = f.store.getRun(RUN)!;
    expect(recovered.stage).toBe('failed');
    expect(recovered.createdAt).toBe(START);
    expect(recovered.stageStartedAt).toBe(RECOVER);
    expect(adapterRunElapsedSeconds(recovered)).toBe(0);
  });

  const realFixturePath = path.resolve('.tmp/cdn-certification-real-fixture.json');
  it.skipIf(!fs.existsSync(realFixturePath))('replays the captured old Windows CDN projection without changing the ledger', () => {
    const real = JSON.parse(fs.readFileSync(realFixturePath, 'utf8')) as { run: ProviderAdapterRun; operation: CertificationOperationRecord };
    const f = fixture(); f.absent();
    f.store.upsertRun(real.run);
    writeCertificationJsonAtomic(f.ledgerPath, { version: 3, operations: [real.operation], tombstones: [], archives: [] });
    const audit = fs.readFileSync(f.ledgerPath, 'utf8');
    f.coordinator().recoverPreparedStarts(); f.coordinator().recoverPreparedStarts();
    expect(f.store.listRuns()).toEqual([]);
    expect(fs.readFileSync(f.ledgerPath, 'utf8')).toBe(audit);
  });
});
