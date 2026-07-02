import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'signups'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('club_id').unsigned().notNullable().references('clubs.id').onDelete('CASCADE')
      table.string('contact_name').notNullable()
      table.string('contact_email').notNullable()
      table.string('contact_phone').notNullable()
      table.string('whatsapp').nullable()
      table.text('message').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('club_id', 'signups_club_id_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
