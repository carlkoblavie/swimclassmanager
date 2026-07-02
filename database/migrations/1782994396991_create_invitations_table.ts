import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('club_id').unsigned().notNullable().references('clubs.id').onDelete('CASCADE')
      table.string('email').notNullable()
      table.integer('role_id').unsigned().notNullable().references('roles.id').onDelete('RESTRICT')
      table.string('token').notNullable().unique()
      table.timestamp('expires_at').notNullable()
      table.timestamp('accepted_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['club_id', 'email'], { indexName: 'invitations_club_email_unique' })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
