import type { Mapping, Model, Vendor } from './types';

/** The catalog transaction port; deletion intent is distinct from removing a row. */
export type CatalogMutation = {
  upsertVendor: (payload: unknown) => Vendor;
  upsertApiKey: (vendorKey: string, payload: unknown) => void;
  deleteApiKey: (vendorKey: string) => void;
  /** User disconnection revokes projections; candidate disposal preserves its real receipt. */
  deleteVendor: (vendorKey: string, intent?: 'disconnect' | 'discard-candidate') => void;
  upsertModel: (payload: unknown) => Model;
  upsertMapping: (payload: unknown) => Mapping;
  deleteModelMappings: (vendorKey: string, modelKey: string) => void;
};
