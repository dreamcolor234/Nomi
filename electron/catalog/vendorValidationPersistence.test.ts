import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let userDataRoot = "";

vi.mock("electron", () => ({
  app: { getPath: () => userDataRoot, getAppPath: () => process.cwd() },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (value: string) => Buffer.from(value),
    decryptString: (value: Buffer) => value.toString(),
  },
}));

const now = "2026-09-05T00:00:00.000Z";

function seedPersistedFailure(): void {
  fs.writeFileSync(path.join(userDataRoot, "model-catalog.json"), JSON.stringify({
    version: 12,
    vendors: [{
      key: "relay",
      name: "Relay",
      enabled: false,
      baseUrlHint: "http://127.0.0.1:43123/v1",
      authType: "bearer",
      providerKind: "openai-compatible",
      createdAt: now,
      updatedAt: now,
    }],
    models: [{
      vendorKey: "relay",
      modelKey: "image-v1",
      labelZh: "Image V1",
      kind: "image",
      enabled: false,
      meta: { adapter: {
        state: "failed",
        runId: "failed-run",
        modes: [{ taskKind: "text_to_image", state: "failed", error: "old validation error" }],
        updatedAt: now,
      } },
      createdAt: now,
      updatedAt: now,
    }],
    mappings: [],
    apiKeysByVendor: {
      relay: {
        vendorKey: "relay",
        apiKey: Buffer.from("old-key").toString("base64"),
        enc: "safeStorage",
        enabled: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  }), "utf8");
  fs.writeFileSync(path.join(userDataRoot, "provider-adapters.json"), JSON.stringify({
    version: 1,
    revision: 1,
    runs: [{
      id: "failed-run",
      vendorKey: "relay",
      vendorName: "Relay",
      connectionFingerprint: "old",
      selectedModelKeys: ["image-v1"],
      stage: "failed",
      repairAttempt: 0,
      models: [{ modelKey: "image-v1", labelZh: "Image V1", kind: "image", modes: [] }],
      sourceUrls: [],
      createdAt: now,
      updatedAt: now,
    }],
    revisions: [{ id: "revision-old", vendorKey: "relay", digest: "old", draft: { provider: {}, sources: [], models: [] }, verifiedModes: [] }],
  }), "utf8");
}

beforeEach(() => {
  userDataRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nomi-vendor-validation-persist-"));
  seedPersistedFailure();
  vi.resetModules();
});

afterEach(() => fs.rmSync(userDataRoot, { recursive: true, force: true }));

describe("vendor validation persistence invalidation", () => {
  it("clears the failed catalog projection and durable run when the saved API is removed", async () => {
    const store = await import("./catalogStore");

    store.clearModelCatalogVendorApiKey("relay");

    const reopened = store.readCatalog();
    expect(reopened.models[0]?.meta).toMatchObject({ adapter: { state: "unverified" } });
    expect((reopened.models[0]?.meta as { adapter?: { runId?: string; modes?: unknown[] } }).adapter?.runId).toBeUndefined();
    expect((reopened.models[0]?.meta as { adapter?: { modes?: unknown[] } }).adapter?.modes).toBeUndefined();
    const adapterStore = new (await import("../providerAdapter/store")).ProviderAdapterStore(
      path.join(userDataRoot, "provider-adapters.json"),
    );
    expect(adapterStore.listRuns()).toEqual([]);
    expect(new (await import("../providerAdapter/store")).ProviderAdapterStore(
      path.join(userDataRoot, "provider-adapters.json"),
    ).snapshot().revisions).toEqual([]);
  });

  it("invalidates the same failure when the connection scope is corrected", async () => {
    const store = await import("./catalogStore");

    store.upsertModelCatalogVendor({ key: "relay", baseUrlHint: "http://127.0.0.1:43124/v1" });

    expect(store.readCatalog().models[0]?.meta).toMatchObject({ adapter: { state: "unverified" } });
    expect(new (await import("../providerAdapter/store")).ProviderAdapterStore(
      path.join(userDataRoot, "provider-adapters.json"),
    ).listRuns()).toEqual([]);
  });

  it("does not interpret an unreadable catalog as proof that the exact connection was deleted", async () => {
    const { defaultCatalog } = await import("../providerAdapter/serviceCatalog");
    expect(defaultCatalog.hasConnection?.("relay")).toBe(true);
    fs.writeFileSync(path.join(userDataRoot, "model-catalog.json"), "{");
    expect(defaultCatalog.hasConnection?.("relay")).toBeUndefined();
  });

  it.each(["scope", "clear-key", "disable-key", "delete", "missing-run", "transaction-key", "transaction-vendor"] as const)("records revocation across %s and two certification restarts", async (action) => {
    const { OperationLedger } = await import("../integrationCertification/operationLedger");
    const { ProviderAdapterCertificationCoordinator } = await import("../integrationCertification/providerAdapterCoordinator");
    const { ProviderAdapterStore } = await import("../providerAdapter/store");
    const store = await import("./catalogStore");
    const { defaultCatalog } = await import("../providerAdapter/serviceCatalog");
    const ledgerPath = path.join(userDataRoot, "integration-certification", "operations.json");
    const ledger = new OperationLedger(ledgerPath);
    let operation = ledger.begin({ runId: "failed-run", contractDigest: "a".repeat(64), idempotencyKey: "old-confirmation", lineageRootVendorKey: "relay",
      sourceVendorKey: "relay", selectedModels: [{ modelKey: "image-v1", labelZh: "Image", kind: "image" }], leaseOwner: "owner", leaseToken: "lease", attempt: 1,
      childRunRef: { runId: "failed-run", revisionDigest: "a".repeat(64) }, now }).operation!;
    for (const state of ["run_persisted", "catalog_staged", "committed"] as const) operation = ledger.markStartTransaction("failed-run", {
      state, expectedRevision: operation.revision, ...(state !== "run_persisted" ? { stagedVendorKey: "relay" } : {}), now,
    });
    const audit = fs.readFileSync(ledgerPath, "utf8");
    const projectionPath = path.join(userDataRoot, "provider-adapters.json");
    if (action === "missing-run") {
      const missing = JSON.parse(fs.readFileSync(projectionPath, "utf8"));
      missing.runs = [];
      fs.writeFileSync(projectionPath, JSON.stringify(missing));
    }
    if (action === "scope") store.upsertModelCatalogVendor({ key: "relay", baseUrlHint: "http://127.0.0.1:43124/v1" });
    else if (action === "clear-key" || action === "missing-run") store.clearModelCatalogVendorApiKey("relay");
    else if (action === "disable-key") store.upsertModelCatalogVendorApiKey("relay", { apiKey: "fixture-key", enabled: false });
    else if (action === "transaction-key") store.mutateCatalog((tx) => tx.deleteApiKey("relay"));
    else if (action === "transaction-vendor") store.mutateCatalog((tx) => tx.deleteVendor("relay"));
    else store.deleteModelCatalogVendor("relay");
    for (let restart = 0; restart < 2; restart += 1) {
      new ProviderAdapterCertificationCoordinator(new ProviderAdapterStore(projectionPath), defaultCatalog, () => "2026-11-10T00:00:00.000Z", {
        operationLedger: new OperationLedger(ledgerPath),
      }).recoverPreparedStarts();
      expect(new ProviderAdapterStore(projectionPath).listRuns()).toEqual([]);
    }
    expect(new ProviderAdapterStore(projectionPath).snapshot()).toMatchObject({ revokedRunIds: ["failed-run"] });
    expect(fs.readFileSync(ledgerPath, "utf8")).toBe(audit);
  });
});
