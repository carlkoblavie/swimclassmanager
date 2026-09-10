import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
import EnrollmentException from '#exceptions/enrollment_exception'
import Enrollment from '#models/enrollment'
import EnrollmentStage from '#models/enrollment_stage'
import LevelStage from '#models/level_stage'
import type School from '#models/school'
import { EnrollmentStageStatus } from '#values/enrollment_stage_status'

type AssignStagesInput = {
  enrollmentId: number
  levelStageIds: number[]
}

type AdvanceStageInput = {
  enrollmentId: number
}

export default class EnrollmentStageService {
  /** Remove all of a learner's stage assignments (undo the assignment). */
  async clearStages(school: School, enrollmentId: number): Promise<void> {
    const enrollment = await Enrollment.query()
      .where('id', enrollmentId)
      .where('schoolId', school.id)
      .first()
    if (!enrollment) {
      throw new EnrollmentException('Enrollment not found for this school.')
    }
    await EnrollmentStage.query().where('enrollmentId', enrollment.id).delete()
  }

  /**
   * Assign a learner's enrollment to a set of stages in their level. Stages are
   * ordered by the stage's own position; the earliest not-yet-completed stage
   * becomes `current`, the rest `upcoming`. Already-completed stages keep their
   * status. Payment is not consulted.
   */
  async assignStages(school: School, input: AssignStagesInput): Promise<void> {
    await db.transaction(async (trx) => {
      const enrollment = await Enrollment.query({ client: trx })
        .where('id', input.enrollmentId)
        .where('schoolId', school.id)
        .first()
      if (!enrollment) {
        throw new EnrollmentException('Enrollment not found for this school.')
      }

      const stageIds = [...new Set(input.levelStageIds)]
      if (stageIds.length === 0) {
        throw new EnrollmentException('Choose at least one stage.')
      }

      // A learner progresses through one level at a time, so all the selected
      // stages must belong to the same level (any level in the catalog).
      const stages = await LevelStage.query({ client: trx })
        .whereIn('id', stageIds)
        .orderBy('position')
      if (stages.length !== stageIds.length) {
        throw new EnrollmentException('One or more selected stages no longer exist.')
      }
      const levelIds = new Set(stages.map((stage) => stage.levelId))
      if (levelIds.size > 1) {
        throw new EnrollmentException('Choose stages from a single level.')
      }

      // Stages are progressive: the selection must be a contiguous run starting
      // from the level's first stage (no gaps like 1, 3, 5).
      const levelStages = await LevelStage.query({ client: trx })
        .where('levelId', stages[0].levelId)
        .orderBy('position')
      const expectedPrefixIds = levelStages.slice(0, stages.length).map((stage) => stage.id)
      const selectedIdsInOrder = stages.map((stage) => stage.id)
      const isPrefix = expectedPrefixIds.every((id, index) => id === selectedIdsInOrder[index])
      if (!isPrefix) {
        throw new EnrollmentException(
          'Assign stages in order, starting from the first — no gaps allowed.'
        )
      }

      const existing = await EnrollmentStage.query({ client: trx }).where(
        'enrollmentId',
        enrollment.id
      )
      const existingByStage = new Map(existing.map((row) => [row.levelStageId, row]))

      // Drop rows no longer selected.
      const desiredIds = new Set(stages.map((stage) => stage.id))
      const toDelete = existing.filter((row) => !desiredIds.has(row.levelStageId))
      if (toDelete.length > 0) {
        await EnrollmentStage.query({ client: trx })
          .whereIn(
            'id',
            toDelete.map((row) => row.id)
          )
          .delete()
      }

      // Upsert the desired stages, ordered by the stage position. Existing rows
      // keep their status (e.g. completed); new ones start as upcoming.
      for (const [index, stage] of stages.entries()) {
        const row = existingByStage.get(stage.id) ?? new EnrollmentStage()
        row.useTransaction(trx)
        if (row.$isNew) {
          row.enrollmentId = enrollment.id
          row.levelStageId = stage.id
          row.status = EnrollmentStageStatus.UPCOMING
        }
        row.position = index
        await row.save()
      }

      await this.ensureCurrent(enrollment.id, trx)
    })
  }

  /**
   * Mark the learner's current stage completed and promote the next upcoming
   * stage (by position) to current.
   */
  async advanceStage(school: School, input: AdvanceStageInput): Promise<void> {
    await db.transaction(async (trx) => {
      const enrollment = await Enrollment.query({ client: trx })
        .where('id', input.enrollmentId)
        .where('schoolId', school.id)
        .first()
      if (!enrollment) {
        throw new EnrollmentException('Enrollment not found for this school.')
      }

      const rows = await EnrollmentStage.query({ client: trx })
        .where('enrollmentId', enrollment.id)
        .orderBy('position')

      const current = rows.find((row) => row.status === EnrollmentStageStatus.CURRENT)
      if (!current) {
        throw new EnrollmentException('This learner has no current stage to complete.')
      }

      current.useTransaction(trx)
      current.status = EnrollmentStageStatus.COMPLETED
      current.completedAt = DateTime.now()
      await current.save()

      const next = rows.find(
        (row) => row.position > current.position && row.status !== EnrollmentStageStatus.COMPLETED
      )
      if (next) {
        next.useTransaction(trx)
        next.status = EnrollmentStageStatus.CURRENT
        next.startedAt = next.startedAt ?? DateTime.now()
        await next.save()
      }
    })
  }

  /** Ensure exactly one stage is `current` when any non-completed stage exists. */
  protected async ensureCurrent(
    enrollmentId: number,
    trx: TransactionClientContract
  ): Promise<void> {
    const rows = await EnrollmentStage.query({ client: trx })
      .where('enrollmentId', enrollmentId)
      .orderBy('position')

    const hasCurrent = rows.some((row) => row.status === EnrollmentStageStatus.CURRENT)
    if (hasCurrent) {
      return
    }
    const firstOpen = rows.find((row) => row.status !== EnrollmentStageStatus.COMPLETED)
    if (firstOpen) {
      firstOpen.useTransaction(trx)
      firstOpen.status = EnrollmentStageStatus.CURRENT
      firstOpen.startedAt = firstOpen.startedAt ?? DateTime.now()
      await firstOpen.save()
    }
  }
}
