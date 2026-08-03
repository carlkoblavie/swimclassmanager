import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('bank_packs', (table) => {
      table.increments('id')
      table.string('key').notNullable().unique()
      table.string('name').notNullable()
      table.text('description').nullable()
      table.string('version').notNullable()
      table.string('plan_tier').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('school_bank_packs', (table) => {
      table.increments('id')
      table
        .integer('school_id')
        .unsigned()
        .notNullable()
        .references('schools.id')
        .onDelete('CASCADE')
      table
        .integer('bank_pack_id')
        .unsigned()
        .notNullable()
        .references('bank_packs.id')
        .onDelete('CASCADE')
      table.string('enabled_version').notNullable()
      table.string('last_synced_version').nullable()
      table.boolean('is_enabled').notNullable().defaultTo(true)

      table.unique(['school_id', 'bank_pack_id'], {
        indexName: 'school_bank_packs_school_pack_unique',
      })

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('school_bank_packs')
    this.schema.dropTable('bank_packs')
  }
}
