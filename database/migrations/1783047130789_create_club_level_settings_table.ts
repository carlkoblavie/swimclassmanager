import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'club_level_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('club_id').unsigned().notNullable().references('clubs.id').onDelete('CASCADE')
      table.integer('level_id').unsigned().notNullable().references('levels.id').onDelete('CASCADE')
      table.integer('fee').nullable()
      table.boolean('available').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['club_id', 'level_id'], {
        indexName: 'club_level_settings_club_level_unique',
      })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
