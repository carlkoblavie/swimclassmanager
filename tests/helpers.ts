import db from '@adonisjs/lucid/services/db'
import { RoleName } from '#values/role'
import { rolePermissions } from '#start/permissions'
import type School from '#models/school'
import Role from '#models/role'
import Membership from '#models/membership'
import type User from '#models/user'
import LevelStage from '#models/level_stage'
import LevelStageActivity from '#models/level_stage_activity'
import LevelStageSkill from '#models/level_stage_skill'
import { ProgramFactory } from '#database/factories/program_factory'
import { LevelFactory } from '#database/factories/level_factory'

/**
 * Idempotently ensure the default role catalog exists with each role's
 * permissions. Re-run after each `truncate()` in groups whose tests found a
 * school, assert the catalog, or exercise permission-gated routes.
 */
export async function seedRoles() {
  for (const name of Object.values(RoleName)) {
    const permissions = JSON.stringify(rolePermissions[name] ?? [])
    const existing = await db.from('roles').where('name', name).first()
    if (existing) {
      await db.from('roles').where('name', name).update({ permissions })
    } else {
      await db.table('roles').insert({ name, permissions })
    }
  }
}

/**
 * Make a user a member of a school with the named role, and set it as their
 * active school. Requires the role catalog to be seeded.
 */
export async function joinSchool(
  user: User,
  school: School,
  roleName: string
): Promise<Membership> {
  const membership = await Membership.create({ schoolId: school.id, userId: user.id })
  const role = await Role.findByOrFail('name', roleName)
  await membership.related('roles').attach([role.id])

  user.activeOrganisationId = school.organisationId
  user.activeSchoolId = school.id
  await user.save()

  return membership
}

/**
 * Seed an active program with one level, one stage, one skill, and one drill —
 * the minimum curriculum a day-based class can be created against.
 */
export async function seedCurriculum(
  names: {
    program?: string
    level?: string
    stage?: string
    skill?: string
    activity?: string
  } = {}
) {
  const program = await ProgramFactory.merge({ name: names.program ?? 'Aquatic Program' }).create()
  const level = await LevelFactory.merge({
    programId: program.id,
    name: names.level ?? 'Aquatic therapy',
    capacity: 10,
  }).create()
  const stage = await LevelStage.create({
    levelId: level.id,
    name: names.stage ?? 'Waist movement',
    position: 1,
    description: null,
  })
  const skill = await LevelStageSkill.create({
    levelStageId: stage.id,
    name: names.skill ?? 'Hip rotation',
    passCriteria: 'Smooth circles both directions',
    description: null,
  })
  const activity = await LevelStageActivity.create({
    levelStageSkillId: skill.id,
    name: names.activity ?? 'Standing twists',
    description: null,
    applicationNotes: null,
  })

  return { program, level, stage, skill, activity }
}
