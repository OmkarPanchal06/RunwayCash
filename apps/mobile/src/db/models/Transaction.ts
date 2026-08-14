import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export default class Transaction extends Model {
  static table = 'transactions';

  @text('account_id') accountId: string | undefined;
  @field('amount_cents') amountCents: number | undefined;
  @text('category') category: string | undefined;
  @text('merchant') merchant: string | undefined;
  @text('note') note: string | undefined;
  @text('occurred_at') occurredAt: string | undefined;
  @field('is_discretionary') isDiscretionary: boolean | undefined;
  @text('source') source: string | undefined;
  @text('idempotency_key') idempotencyKey: string | undefined;
  
  @readonly @date('created_at') createdAt: Date | undefined;
  @readonly @date('updated_at') updatedAt: Date | undefined;
}
