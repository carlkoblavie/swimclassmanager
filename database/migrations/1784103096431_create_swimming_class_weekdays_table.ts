import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'swimming_class_weekdays'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table.integer('weekday').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['swimming_class_id', 'weekday'], {
        indexName: 'swimming_class_weekdays_class_weekday_unique',
      })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
