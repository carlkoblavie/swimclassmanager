import { BaseSchema } from '@adonisjs/lucid/schema'
import { codeSegment } from '#values/account_code'

export default class extends BaseSchema {
  protected tableName = 'class_lessons'

  async up() {
    // A lesson is one dated occurrence of a class carrying that week's
    // curriculum (stage + skills + drills). Curriculum moves off the class.
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table
        .integer('level_stage_id')
        .unsigned()
        .notNullable()
        .references('level_stages.id')
        .onDelete('RESTRICT')
      table.date('date').notNullable()

      table.unique(['swimming_class_id', 'date'], {
        indexName: 'class_lessons_class_date_unique',
      })

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    this.schema.createTable('lesson_skills', (table) => {
      table.increments('id')
      table
        .integer('class_lesson_id')
        .unsigned()
        .notNullable()
        .references('class_lessons.id')
        .onDelete('CASCADE')
      table
        .integer('level_stage_skill_id')
        .unsigned()
        .notNullable()
        .references('level_stage_skills.id')
        .onDelete('RESTRICT')
      table.unique(['class_lesson_id', 'level_stage_skill_id'], {
        indexName: 'lesson_skills_lesson_skill_unique',
      })
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    this.schema.createTable('lesson_activities', (table) => {
      table.increments('id')
      table
        .integer('class_lesson_id')
        .unsigned()
        .notNullable()
        .references('class_lessons.id')
        .onDelete('CASCADE')
      table
        .integer('level_stage_activity_id')
        .unsigned()
        .notNullable()
        .references('level_stage_activities.id')
        .onDelete('RESTRICT')
      table.unique(['class_lesson_id', 'level_stage_activity_id'], {
        indexName: 'lesson_activities_lesson_activity_unique',
      })
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    // Class-level curriculum selections cannot be attributed to a dated
    // lesson, so they are dropped with their tables.
    this.schema.dropTable('class_activities')
    this.schema.dropTable('class_skills')

    this.schema.alterTable('swimming_classes', (table) => {
      table.dropColumn('level_stage_id')
    })

    // Class codes re-parent to the level (classes no longer hold a stage):
    // L01CL01 instead of ST01CL01, keeping each class's own CL number.
    this.defer(async (db) => {
      const classes = await db
        .from('swimming_classes')
        .orderBy('id')
        .select('id', 'code', 'level_id')
      const levels = await db.from('levels').select('id', 'code')
      const levelCodeById = new Map(levels.map((row) => [Number(row.id), String(row.code)]))

      for (const row of classes) {
        const levelCodeValue = levelCodeById.get(Number(row.level_id)) ?? 'L00'
        const parent = codeSegment(levelCodeValue, 'level') ?? 'L00'
        const own = codeSegment(String(row.code), 'class')
        if (own) {
          await db
            .from('swimming_classes')
            .where('id', row.id)
            .update({ code: `${parent}${own}` })
        }
      }
    })
  }

  async down() {
    this.schema.alterTable('swimming_classes', (table) => {
      table
        .integer('level_stage_id')
        .unsigned()
        .notNullable()
        .defaultTo(0)
        .references('level_stages.id')
        .onDelete('RESTRICT')
    })

    this.schema.createTable('class_skills', (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table
        .integer('level_stage_skill_id')
        .unsigned()
        .notNullable()
        .references('level_stage_skills.id')
        .onDelete('RESTRICT')
      table.unique(['swimming_class_id', 'level_stage_skill_id'], {
        indexName: 'class_skills_class_skill_unique',
      })
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    this.schema.createTable('class_activities', (table) => {
      table.increments('id')
      table
        .integer('swimming_class_id')
        .unsigned()
        .notNullable()
        .references('swimming_classes.id')
        .onDelete('CASCADE')
      table
        .integer('level_stage_activity_id')
        .unsigned()
        .notNullable()
        .references('level_stage_activities.id')
        .onDelete('RESTRICT')
      table.unique(['swimming_class_id', 'level_stage_activity_id'], {
        indexName: 'class_activities_class_activity_unique',
      })
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })

    this.schema.dropTable('lesson_activities')
    this.schema.dropTable('lesson_skills')
    this.schema.dropTable(this.tableName)
  }
}
