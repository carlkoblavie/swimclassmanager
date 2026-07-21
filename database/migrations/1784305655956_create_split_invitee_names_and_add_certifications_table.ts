import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Teacher invitations collect a structured name and certifications;
    // certifications transfer to the membership when the invite is accepted.
    this.schema.alterTable('invitations', (table) => {
      table.string('invitee_first_name').nullable()
      table.string('invitee_last_name').nullable()
      table.json('certifications').nullable()
    })

    this.schema.alterTable('memberships', (table) => {
      table.json('certifications').nullable()
    })

    this.defer(async (db) => {
      const invitations = await db.from('invitations').whereNotNull('invitee_name')
      for (const invitation of invitations) {
        const [first, ...rest] = String(invitation.invitee_name).trim().split(/\s+/)
        await db
          .from('invitations')
          .where('id', invitation.id)
          .update({
            invitee_first_name: first || null,
            invitee_last_name: rest.join(' ') || null,
          })
      }
    })

    this.schema.alterTable('invitations', (table) => {
      table.dropColumn('invitee_name')
    })
  }

  async down() {
    this.schema.alterTable('invitations', (table) => {
      table.string('invitee_name').nullable()
    })

    this.defer(async (db) => {
      const invitations = await db.from('invitations').whereNotNull('invitee_first_name')
      for (const invitation of invitations) {
        const name = [invitation.invitee_first_name, invitation.invitee_last_name]
          .filter(Boolean)
          .join(' ')
        await db
          .from('invitations')
          .where('id', invitation.id)
          .update({ invitee_name: name || null })
      }
    })

    this.schema.alterTable('invitations', (table) => {
      table.dropColumn('invitee_first_name')
      table.dropColumn('invitee_last_name')
      table.dropColumn('certifications')
    })

    this.schema.alterTable('memberships', (table) => {
      table.dropColumn('certifications')
    })
  }
}
