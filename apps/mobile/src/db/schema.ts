import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'account_id', type: 'string', isIndexed: true },
        { name: 'amount_cents', type: 'number' },
        { name: 'category', type: 'string' },
        { name: 'merchant', type: 'string', isOptional: true },
        { name: 'note', type: 'string', isOptional: true },
        { name: 'occurred_at', type: 'string', isIndexed: true },
        { name: 'is_discretionary', type: 'boolean' },
        { name: 'source', type: 'string' },
        { name: 'idempotency_key', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'bills',
      columns: [
        { name: 'account_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'amount_cents', type: 'number' },
        { name: 'variability', type: 'string' },
        { name: 'frequency', type: 'string' },
        { name: 'next_due_date', type: 'string', isIndexed: true },
        { name: 'category', type: 'string' },
        { name: 'active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
});
