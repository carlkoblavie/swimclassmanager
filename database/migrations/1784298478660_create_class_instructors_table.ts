import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'class_instructors'

  async up() {
    // A class can have many instructors; each row is either an accepted
    // membership or a still-pending teacher invitation (exactly one set).
    // Accepting the invitation converts the row to a membership.
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table
        .integer('membership_id')
        .unsigned()
        .nullable()
        .references('memberships.id')
        .onDelete('CASCADE')
      table
        .integer('invitation_id')
        .unsigned()
        .nullable()
        .references('invitations.id')
        .onDelete('CASCADE')

      table.unique(['swimming_class_id', 'membership_id'], {
        indexName: 'class_instructors_class_membership_unique',
      })
      table.unique(['swimming_class_id', 'invitation_id'], {
        indexName: 'class_instructors_class_invitation_unique',
      })

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    // Carry over each class's single instructor slot (accepted or pending).
    this.defer(async (db) => {
      const now = new Date().toISOString()
      const classes = await db
        .from('swimming_classes')
        .select('id', 'instructor_membership_id', 'pending_instructor_invitation_id')

      for (const row of classes) {
        if (row.instructor_membership_id) {
          await db.table('class_instructors').insert({
            swimming_class_id: row.id,
            membership_id: row.instructor_membership_id,
            invitation_id: null,
            created_at: now,
          })
        } else if (row.pending_instructor_invitation_id) {
          await db.table('class_instructors').insert({
            swimming_class_id: row.id,
            membership_id: null,
            invitation_id: row.pending_instructor_invitation_id,
            created_at: now,
          })
        }
      }
    })

    this.schema.alterTable('swimming_classes', (table) => {
      table.dropColumn('instructor_membership_id')
      table.dropColumn('pending_instructor_invitation_id')
    })
  }

  async down() {
    this.schema.alterTable('swimming_classes', (table) => {
      table
        .integer('instructor_membership_id')
        .unsigned()
        .nullable()
        .references('memberships.id')
        .onDelete('SET NULL')
      table
        .integer('pending_instructor_invitation_id')
        .unsigned()
        .nullable()
        .references('invitations.id')
        .onDelete('SET NULL')
    })

    this.defer(async (db) => {
      const rows = await db
        .from('class_instructors')
        .orderBy('id')
        .select('swimming_class_id', 'membership_id', 'invitation_id')

      for (const row of rows) {
        await db
          .from('swimming_classes')
          .where('id', row.swimming_class_id)
          .whereNull('instructor_membership_id')
          .whereNull('pending_instructor_invitation_id')
          .update({
            instructor_membership_id: row.membership_id,
            pending_instructor_invitation_id: row.membership_id ? null : row.invitation_id,
          })
      }
    })

    this.schema.dropTable(this.tableName)
  }
}
