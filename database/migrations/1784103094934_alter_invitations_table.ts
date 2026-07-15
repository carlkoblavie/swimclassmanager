import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invitations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('invitee_name').nullable()
      table.string('invitee_phone').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('invitee_name')
      table.dropColumn('invitee_phone')
    })
  }
}
