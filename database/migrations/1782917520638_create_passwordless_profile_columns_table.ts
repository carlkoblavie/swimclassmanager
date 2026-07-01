import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('phone').nullable()
      table.string('country').nullable()
      table.timestamp('profile_completed_at').nullable()
    })

    const hasPassword = await this.schema.hasColumn(this.tableName, 'password')
    if (hasPassword) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('password')
      })
    }
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('phone')
      table.dropColumn('country')
      table.dropColumn('profile_completed_at')
      table.string('password').nullable()
    })
  }
}
