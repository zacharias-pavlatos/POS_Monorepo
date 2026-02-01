import type { DatabaseInstance } from '../client';

export interface TenantContext {
  db: DatabaseInstance;
  organizationId: string;
}
