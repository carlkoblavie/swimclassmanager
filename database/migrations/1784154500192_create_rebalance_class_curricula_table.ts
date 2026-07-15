import { BaseSchema } from '@adonisjs/lucid/schema'
import { codeSegment } from '#values/account_code'

export default class extends BaseSchema {
  protected tableName = 'swimming_classes'

  async up() {
    // Skills move up to the class (picked with its stage at creation);
    // lessons keep only the date and that week's activities.
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('level_stage_id')
        .unsigned()
        .nullable()
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

    this.defer(async (db) => {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

      // Each class adopts the stage of its earliest lesson; classes with no
      // lessons cannot be mapped and are removed (service-created classes
      // always start with one).
      const lessons = await db
        .from('class_lessons')
        .orderBy('date')
        .select('id', 'swimming_class_id', 'level_stage_id')
      const stageByClass = new Map<number, number>()
      for (const lesson of lessons) {
        if (!stageByClass.has(Number(lesson.swimming_class_id))) {
          stageByClass.set(Number(lesson.swimming_class_id), Number(lesson.level_stage_id))
        }
      }

      const classes = await db
        .from('swimming_classes')
        .orderBy('id')
        .select('id', 'code', 'level_id')
      for (const row of classes) {
        const stageId = stageByClass.get(Number(row.id))
        if (!stageId) {
          await db.from('class_lessons').where('swimming_class_id', row.id).delete()
          await db.from('swimming_classes').where('id', row.id).delete()
          continue
        }
        await db.from('swimming_classes').where('id', row.id).update({ level_stage_id: stageId })
      }

      // Lessons' skills become the class's skills (union per class).
      const lessonSkills = await db
        .from('lesson_skills')
        .join('class_lessons', 'class_lessons.id', 'lesson_skills.class_lesson_id')
        .select(
          'class_lessons.swimming_class_id as class_id',
          'lesson_skills.level_stage_skill_id as skill_id'
        )
      const seen = new Set<string>()
      for (const row of lessonSkills) {
        const key = `${row.class_id}-${row.skill_id}`
        if (seen.has(key)) {
          continue
        }
        seen.add(key)
        await db.table('class_skills').insert({
          swimming_class_id: row.class_id,
          level_stage_skill_id: row.skill_id,
          created_at: now,
          updated_at: null,
        })
      }

      // Class codes re-parent to the stage segment, keeping their CL number.
      const stages = await db.from('level_stages').select('id', 'code')
      const stageCodeById = new Map(stages.map((row) => [Number(row.id), String(row.code)]))
      const survivors = await db
        .from('swimming_classes')
        .select('id', 'code', 'level_stage_id')
      for (const row of survivors) {
        const stageCodeValue = stageCodeById.get(Number(row.level_stage_id)) ?? 'ST00'
        const parent = codeSegment(stageCodeValue, 'stage') ?? 'ST00'
        const own = codeSegment(String(row.code), 'class')
        if (own) {
          await db
            .from('swimming_classes')
            .where('id', row.id)
            .update({ code: `${parent}${own}` })
        }
      }
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable('level_stage_id')
    })

    this.schema.dropTable('lesson_skills')

    this.schema.alterTable('class_lessons', (table) => {
      table.dropColumn('level_stage_id')
    })
  }

  async down() {
    this.schema.alterTable('class_lessons', (table) => {
      table
        .integer('level_stage_id')
        .unsigned()
        .notNullable()
        .defaultTo(0)
        .references('level_stages.id')
        .onDelete('RESTRICT')
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

    this.schema.dropTable('class_skills')

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('level_stage_id')
    })
  }
}
