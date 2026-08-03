import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'school_age_groups'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('school_id')
        .unsigned()
        .notNullable()
        .references('schools.id')
        .onDelete('CASCADE')
      table.string('age_group_key').notNullable()
      table.string('display_name').notNullable()
      table.integer('min_age_year').unsigned().nullable()
      table.integer('max_age_year').unsigned().nullable()
      table.integer('position').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.unique(['school_id', 'age_group_key'], {
        indexName: 'school_age_groups_school_key_unique',
      })

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
