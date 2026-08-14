import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export default class Bill extends Model {
  static table = 'bills';

  @text('account_id') accountId: string | undefined;
  @text('name') name: string | undefined;
  @field('amount_cents') amountCents: number | undefined;
  @text('variability') variability: string | undefined;
  @text('frequency') frequency: string | undefined;
  @text('next_due_date') nextDueDate: string | undefined;
  @text('category') category: string | undefined;
  @field('active') active: boolean | undefined;
  
  @readonly @date('created_at') createdAt: Date | undefined;
  @readonly @date('updated_at') updatedAt: Date | undefined;
}
