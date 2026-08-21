import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import ClassLesson from '#models/class_lesson'

export default class ClassLessonCapacityService {
  async countByLevel(
    schoolId: number,
    levelIds: number[],
    client?: TransactionClientContract
  ): Promise<Map<number, number>> {
    const uniqueLevelIds = [...new Set(levelIds)]
    const counts = new Map<number, number>()

    if (uniqueLevelIds.length === 0) {
      return counts
    }

    const query = client ? ClassLesson.query({ client }) : ClassLesson.query()
    const rows = await query
      .join('swimming_classes', 'swimming_classes.id', 'class_lessons.swimming_class_id')
      .where('swimming_classes.school_id', schoolId)
      .whereIn('swimming_classes.level_id', uniqueLevelIds)
      .select('swimming_classes.level_id as levelId')
      .count('class_lessons.id as total')
      .groupBy('swimming_classes.level_id')

    for (const row of rows) {
      counts.set(Number(row.$extras.levelId), Number(row.$extras.total ?? 0))
    }

    return counts
  }

  async countForLevel(
    schoolId: number,
    levelId: number,
    client?: TransactionClientContract
  ): Promise<number> {
    const counts = await this.countByLevel(schoolId, [levelId], client)
    return counts.get(levelId) ?? 0
  }
}
