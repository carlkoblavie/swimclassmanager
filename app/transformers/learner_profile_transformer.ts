import { DateTime } from 'luxon'
import { BaseTransformer } from '@adonisjs/core/transformers'
import type Enrollment from '#models/enrollment'
import type Learner from '#models/learner'
import { WEEKDAY_NAMES } from '#transformers/swimming_class_transformer'

export type LearnerProfile = {
  learner: {
    id: number
    name: string
    initials: string
    age: number
    gender: string
    dateOfBirth: string
    joined: string
    medicalInfo: string
    swimmingExperience: string | null
    residentialLocation: string
  }
  guardian: {
    name: string
    email: string
    phone: string
    whatsapp: string | null
    relation: string
  } | null
  currentEnrollment: {
    id: number
    levelName: string
    stageName: string
    stageLevelName: string | null
    stages: Array<{ name: string; status: string }>
    leadInstructor: string | null
    assistantInstructors: string[]
    class: {
      id: number
      name: string
      weekday: string | null
      startTime: string | null
      durationMinutes: number
      instructor: string | null
    } | null
    startDate: string | null
    paymentStatus: 'paid' | 'part_paid' | 'pending'
    price: number
    currency: string
    termName: string | null
    lessons: Array<{
      id: number
      date: string
      durationMinutes: number
      status: 'upcoming' | 'taught'
    }>
  } | null
  pathway: Array<{
    id: number
    levelName: string
    stageName: string
    status: string
  }>
  skills: Array<{
    id: number
    name: string
    passCriteria: string
  }>
}

function ageFromDateOfBirth(dateOfBirth: DateTime): number {
  const today = DateTime.now()
  let age = today.year - dateOfBirth.year
  if (today.ordinal < dateOfBirth.ordinal) {
    age -= 1
  }
  return age
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

function formatTime(value: string): string {
  const parsed = DateTime.fromFormat(value, 'HH:mm')
  return parsed.isValid ? parsed.toFormat('h:mm a') : value
}

function paymentStatus(enrollment: Enrollment): 'paid' | 'part_paid' | 'pending' {
  const payments =
    (enrollment.$preloaded as { termPayments?: Array<{ amount: number; amountPaid: number }> })
      .termPayments ?? []
  if (payments.length > 0 && payments.every((payment) => payment.amountPaid >= payment.amount)) {
    return 'paid'
  }
  if (payments.some((payment) => payment.amountPaid > 0)) {
    return 'part_paid'
  }
  return 'pending'
}

export default class LearnerProfileTransformer extends BaseTransformer<Learner> {
  constructor(
    resource: Learner,
    // Lead + assistant instructors of the learner's current stage (per school).
    protected currentStageInstructors: { lead: string | null; assistants: string[] } = {
      lead: null,
      assistants: [],
    }
  ) {
    super(resource)
  }

  toObject(): LearnerProfile {
    const preloaded = this.resource.$preloaded as {
      signup?: {
        contactName: string
        contactEmail: string
        contactPhone: string
        whatsapp: string | null
      }
      enrollments?: Enrollment[]
    }
    const enrollments = preloaded.enrollments ?? []
    const currentEnrollment =
      enrollments.find((enrollment) => enrollment.status === 'active') ?? enrollments[0]
    const currentPreloaded = currentEnrollment?.$preloaded as
      | {
          level?: { name: string }
          term?: { name: string; swimYear?: { name: string } }
          swimmingClass?: {
            id: number
            name: string
            weekday?: number | null
            startTime?: string
            durationMinutes: number
            levelStage?: {
              name: string
              skills?: Array<{ id: number; name: string; passCriteria: string }>
            }
            classInstructors?: Array<{
              membership?: { user?: { fullName: string | null; email: string } }
            }>
          }
          lessons?: Array<{
            id: number
            date: DateTime
            durationMinutes: number | null
            concludedAt: DateTime | null
          }>
          enrollmentStages?: Array<{
            status: string
            position: number
            levelStage?: { name: string; level?: { name: string } }
          }>
        }
      | undefined
    const swimmingClass = currentPreloaded?.swimmingClass
    const lessons = currentPreloaded?.lessons ?? []
    const levelSkills = swimmingClass?.levelStage?.skills ?? []
    const instructor = swimmingClass?.classInstructors?.find((item) => item.membership)?.membership
      ?.user
    const firstName = this.resource.firstName
    const lastName = this.resource.lastName

    return {
      learner: {
        id: this.resource.id,
        name: `${firstName} ${lastName}`,
        initials: initials(firstName, lastName),
        age: ageFromDateOfBirth(this.resource.dateOfBirth),
        gender: this.resource.gender,
        dateOfBirth: this.resource.dateOfBirth.toFormat('d LLL yyyy'),
        joined: this.resource.createdAt.toFormat('LLL yyyy'),
        medicalInfo: this.resource.medicalInfo,
        swimmingExperience: this.resource.swimmingExperience,
        residentialLocation: this.resource.residentialLocation,
      },
      guardian: preloaded.signup
        ? {
            name: preloaded.signup.contactName,
            email: preloaded.signup.contactEmail,
            phone: preloaded.signup.contactPhone,
            whatsapp: preloaded.signup.whatsapp,
            relation: this.resource.relation ?? 'Guardian',
          }
        : null,
      currentEnrollment: currentEnrollment
        ? {
            id: currentEnrollment.id,
            levelName: currentPreloaded?.level?.name ?? 'Level not set',
            stageName: swimmingClass?.levelStage?.name ?? 'Stage not set',
            // Stages the learner is assigned to (new stage-based enrollment).
            stageLevelName:
              (currentPreloaded?.enrollmentStages ?? [])[0]?.levelStage?.level?.name ?? null,
            stages: (currentPreloaded?.enrollmentStages ?? []).map((stage) => ({
              name: stage.levelStage?.name ?? 'Stage',
              status: stage.status,
            })),
            leadInstructor: this.currentStageInstructors.lead,
            assistantInstructors: this.currentStageInstructors.assistants,
            class: swimmingClass
              ? {
                  id: swimmingClass.id,
                  name: swimmingClass.name,
                  weekday:
                    swimmingClass.weekday === null || swimmingClass.weekday === undefined
                      ? null
                      : (WEEKDAY_NAMES[swimmingClass.weekday] ?? String(swimmingClass.weekday)),
                  startTime: swimmingClass.startTime ? formatTime(swimmingClass.startTime) : null,
                  durationMinutes: swimmingClass.durationMinutes,
                  instructor: instructor?.fullName?.trim() || instructor?.email || null,
                }
              : null,
            startDate: currentEnrollment.startDate?.toFormat('d LLL yyyy') ?? null,
            paymentStatus: paymentStatus(currentEnrollment),
            price: currentEnrollment.price,
            currency: currentEnrollment.currency,
            termName: currentPreloaded?.term
              ? `${currentPreloaded.term.swimYear?.name ?? ''} ${currentPreloaded.term.name}`.trim()
              : null,
            lessons: lessons.map((lesson) => ({
              id: lesson.id,
              date: lesson.date.toFormat('ccc d LLL'),
              durationMinutes: lesson.durationMinutes ?? swimmingClass?.durationMinutes ?? 0,
              status: lesson.concludedAt ? 'taught' : 'upcoming',
            })),
          }
        : null,
      pathway: enrollments.map((enrollment) => {
        const enrollmentPreloaded = enrollment.$preloaded as {
          level?: { name: string }
          swimmingClass?: { levelStage?: { name: string } }
        }
        return {
          id: enrollment.id,
          levelName: enrollmentPreloaded.level?.name ?? 'Level not set',
          stageName: enrollmentPreloaded.swimmingClass?.levelStage?.name ?? 'Stage not set',
          status: enrollment.status === 'active' ? 'Current' : enrollment.status,
        }
      }),
      skills: levelSkills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        passCriteria: skill.passCriteria,
      })),
    }
  }
}
