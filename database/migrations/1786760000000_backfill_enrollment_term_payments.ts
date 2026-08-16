import { BaseSchema } from '@adonisjs/lucid/schema'
import { randomUUID } from 'node:crypto'
import { EnrollmentStatus } from '#values/enrollment_status'
import { PaymentStatus } from '#values/payment_status'

export default class extends BaseSchema {
  protected tableName = 'term_payments'

  async up() {
    const enrollments = await this.db
      .from('enrollments')
      .leftJoin('terms', 'terms.id', 'enrollments.term_id')
      .select(
        'enrollments.id as enrollment_id',
        'enrollments.term_id',
        'enrollments.price',
        'enrollments.currency',
        'enrollments.status',
        'terms.swim_year_id'
      )

    for (const enrollment of enrollments) {
      if (!enrollment.term_id) {
        continue
      }

      const existing = await this.db
        .from(this.tableName)
        .where('enrollment_id', enrollment.enrollment_id)
        .where('term_id', enrollment.term_id)
        .first()

      if (existing) {
        continue
      }

      const paid = enrollment.status === EnrollmentStatus.ACTIVE
      await this.db.table(this.tableName).insert({
        enrollment_id: enrollment.enrollment_id,
        term_id: enrollment.term_id,
        public_id: randomUUID(),
        amount: enrollment.price,
        amount_paid: paid ? enrollment.price : 0,
        currency: enrollment.currency,
        status: paid ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
        paid_at: paid ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: null,
      })
    }
  }

  async down() {}
}
