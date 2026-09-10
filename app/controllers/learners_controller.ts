import type { HttpContext } from '@adonisjs/core/http'
import Learner from '#models/learner'
import LearnerProfileTransformer from '#transformers/learner_profile_transformer'
import StageInstructorService from '#services/stage_instructor_service'
import { ClassInstructorRole } from '#values/class_instructor_role'

export default class LearnersController {
  async show({ auth, inertia, params }: HttpContext) {
    const schoolId = auth.getUserOrFail().activeSchoolId!
    const learner = await Learner.query()
      .where('id', params.id)
      .whereHas('signup', (signupQuery) => signupQuery.where('schoolId', schoolId))
      .preload('signup')
      .preload('enrollments', (enrollmentQuery) =>
        enrollmentQuery
          .where('schoolId', schoolId)
          .preload('level', (levelQuery) => levelQuery.preload('program'))
          .preload('term', (termQuery) => termQuery.preload('swimYear'))
          .preload('termPayments', (paymentQuery) => paymentQuery.preload('term'))
          .preload('lessons', (lessonQuery) => lessonQuery.orderBy('date'))
          .preload('swimmingClass', (classQuery) =>
            classQuery.preload('levelStage', (stageQuery) => stageQuery.preload('skills'))
          )
          .preload('enrollmentStages', (stageQuery) =>
            stageQuery.preload('levelStage', (ls) => ls.preload('level')).orderBy('position')
          )
          .orderBy('createdAt', 'desc')
      )
      .firstOrFail()

    // Instructors follow the stage: find the lead + assistants of the learner's
    // current stage (or first assigned) for this school.
    const currentEnrollment =
      learner.enrollments.find((enrollment) => enrollment.status === 'active') ??
      learner.enrollments[0]
    const stageRows = currentEnrollment?.enrollmentStages ?? []
    const currentStage =
      stageRows.find((stage) => stage.status === 'current') ?? stageRows[0] ?? null

    const stageInstructors = { lead: null as string | null, assistants: [] as string[] }
    if (currentStage) {
      const map = await new StageInstructorService().mapForSchool(schoolId, [
        currentStage.levelStageId,
      ])
      const instructors = map.get(currentStage.levelStageId) ?? []
      stageInstructors.lead =
        instructors.find((instructor) => instructor.role === ClassInstructorRole.LEAD)?.label ?? null
      stageInstructors.assistants = instructors
        .filter((instructor) => instructor.role !== ClassInstructorRole.LEAD)
        .map((instructor) => instructor.label)
    }

    return inertia.render('learners/show', {
      profile: LearnerProfileTransformer.transform(learner, stageInstructors),
    })
  }
}
