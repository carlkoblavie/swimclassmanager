import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'purchases'

  async up() {
    const paidPurchases = await this.db
      .from(this.tableName)
      .where('status', 'paid')
      .select('id', 'signup_id', 'swim_year_id', 'paid_at')

    for (const purchase of paidPurchases) {
      const enrollments = await this.db
        .from('enrollments')
        .join('learners', 'learners.id', 'enrollments.learner_id')
        .where('learners.signup_id', purchase.signup_id)
        .where('enrollments.swim_year_id', purchase.swim_year_id)
        .select(
          'enrollments.id as enrollment_id',
          'enrollments.learner_id',
          'enrollments.level_id',
          'enrollments.price',
          'enrollments.currency'
        )

      for (const enrollment of enrollments) {
        const existingItem = await this.db
          .from('purchase_items')
          .where('enrollment_id', enrollment.enrollment_id)
          .first()

        if (!existingItem) {
          const level = await this.db
            .from('levels')
            .where('id', enrollment.level_id)
            .select('public_id', 'name')
            .first()

          if (level) {
            await this.db.table('purchase_items').insert({
              purchase_id: purchase.id,
              enrollment_id: enrollment.enrollment_id,
              learner_id: enrollment.learner_id,
              level_id: enrollment.level_id,
              level_public_id: level.public_id,
              level_name: level.name,
              amount: enrollment.price,
              currency: enrollment.currency,
              created_at: purchase.paid_at ?? new Date().toISOString(),
              updated_at: null,
            })
          }
        }
      }

      await this.db
        .from('enrollments')
        .whereIn(
          'id',
          this.db.from('purchase_items').where('purchase_id', purchase.id).select('enrollment_id')
        )
        .update({ status: 'active', reserved_until: null })
    }
  }

  async down() {}
}
