import { BaseSchema } from '@adonisjs/lucid/schema'
import { LevelAudience } from '#values/level_audience'

export default class extends BaseSchema {
  protected tableName = 'levels'

  async up() {
    // Adult vs child selects the public signup form and, later, who the
    // learner record represents. Existing levels default to child.
    this.schema.alterTable(this.tableName, (table) => {
      table.string('audience').notNullable().defaultTo(LevelAudience.CHILD)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('audience')
    })
  }
}
