import type { HttpContext } from '@adonisjs/core/http'
import Learner from '#models/learner'
import LearnerProfileTransformer from '#transformers/learner_profile_transformer'

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
            classQuery
              .preload('levelStage', (stageQuery) => stageQuery.preload('skills'))
              .preload('classInstructors', (instructorQuery) =>
                instructorQuery.preload('membership', (membershipQuery) =>
                  membershipQuery.preload('user')
                )
              )
          )
          .orderBy('createdAt', 'desc')
      )
      .firstOrFail()

    return inertia.render('learners/show', {
      profile: LearnerProfileTransformer.transform(learner),
    })
  }
}
