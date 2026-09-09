import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Instructors are now assigned per school + curriculum stage: one lead and
    // any number of assistants. Classes and lessons follow their stage.
    this.schema.createTable('stage_instructors', (table) => {
      table.increments('id')
      table.integer('school_id').unsigned().notNullable().references('schools.id').onDelete('CASCADE')
      table
        .integer('level_stage_id')
        .unsigned()
        .notNullable()
        .references('level_stages.id')
        .onDelete('CASCADE')
      table.integer('membership_id').unsigned().nullable().references('memberships.id').onDelete('CASCADE')
      table.integer('invitation_id').unsigned().nullable().references('invitations.id').onDelete('CASCADE')
      table.integer('role').notNullable().defaultTo(2)

      table.unique(['school_id', 'level_stage_id', 'membership_id'], {
        indexName: 'stage_instructors_school_stage_membership_unique',
      })
      table.unique(['school_id', 'level_stage_id', 'invitation_id'], {
        indexName: 'stage_instructors_school_stage_invitation_unique',
      })

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    // Instructor assignment no longer lives on classes or lessons.
    this.schema.dropTableIfExists('lesson_instructors')
    this.schema.dropTableIfExists('class_instructors')
  }

  async down() {
    this.schema.dropTableIfExists('stage_instructors')

    this.schema.createTable('class_instructors', (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table.integer('membership_id').unsigned().nullable().references('memberships.id').onDelete('CASCADE')
      table.integer('invitation_id').unsigned().nullable().references('invitations.id').onDelete('CASCADE')
      table.integer('role').notNullable().defaultTo(2)
      table.unique(['swimming_class_id', 'membership_id'])
      table.unique(['swimming_class_id', 'invitation_id'])
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    this.schema.createTable('lesson_instructors', (table) => {
      table.increments('id')
      table
        .integer('class_lesson_id')
        .unsigned()
        .notNullable()
        .references('class_lessons.id')
        .onDelete('CASCADE')
      table.integer('membership_id').unsigned().nullable().references('memberships.id').onDelete('CASCADE')
      table.integer('invitation_id').unsigned().nullable().references('invitations.id').onDelete('CASCADE')
      table.integer('role').notNullable().defaultTo(2)
      table.unique(['class_lesson_id', 'membership_id'])
      table.unique(['class_lesson_id', 'invitation_id'])
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }
}
