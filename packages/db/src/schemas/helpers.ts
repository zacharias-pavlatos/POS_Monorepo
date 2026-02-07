import { text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
};
export const auditFields = {
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
};
