import type { DatabaseOrTransaction } from '../client';

export interface TenantContext {
  db: DatabaseOrTransaction;
  organizationId: string;
}
