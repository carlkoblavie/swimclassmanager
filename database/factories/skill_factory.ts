import factory from '@adonisjs/lucid/factories'
import Skill from '#models/skill'
import { SchoolFactory } from './school_factory.js'

export const SkillFactory = factory
  .define(Skill, async ({ faker, $trx }) => {
    const school = $trx ? await SchoolFactory.client($trx).create() : await SchoolFactory.create()

    return {
      schoolId: school.id,
      name: `${faker.word.adjective()} ${faker.word.noun()}`,
      description: faker.lorem.sentence(),
      isDefault: false,
      createdByUserId: school.createdByUserId,
    }
  })
  .state('platformDefault', (skill) => {
    skill.schoolId = null
    skill.isDefault = true
    skill.createdByUserId = null
  })
  .build()
