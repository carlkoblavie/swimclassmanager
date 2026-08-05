import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('signups', (table) => {
      table.string('registrant_role').nullable()
    })

    this.schema.alterTable('learners', (table) => {
      table.string('relation').nullable()
    })
  }

  async down() {
    this.schema.alterTable('signups', (table) => {
      table.dropColumn('registrant_role')
    })

    this.schema.alterTable('learners', (table) => {
      table.dropColumn('relation')
    })
  }
}
