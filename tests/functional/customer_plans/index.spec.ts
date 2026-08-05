import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { SchoolFactory } from '#database/factories/school_factory'
import Organisation from '#models/organisation'
import SchoolLevelSetting from '#models/school_level_setting'
import SwimYear from '#models/swim_year'
import { DateTime } from 'luxon'
import { seedRoles, seedCurriculum } from '#tests/helpers'

async function publishedSchool() {
  const school = await SchoolFactory.merge({ slug: 'seaside-main' }).create()
  const organisation = await Organisation.findOrFail(school.organisationId)
  await organisation.merge({ slug: 'seaside-swim' }).save()
  return { organisation, school }
}

test.group('Customer plans API', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('lists active programs with available levels and the current swim year', async ({
    client,
    assert,
  }) => {
    const { school } = await publishedSchool()
    const { program, level } = await seedCurriculum()

    const swimYear = await SwimYear.create({
      schoolId: school.id,
      name: '2026',
      startsOn: DateTime.now().minus({ months: 1 }),
      endsOn: DateTime.now().plus({ months: 6 }),
    })
    await swimYear.related('terms').create({
      name: 'Term 1',
      position: 1,
      startsOn: DateTime.now().minus({ months: 1 }),
      endsOn: DateTime.now().plus({ months: 2 }),
    })
    await swimYear.related('terms').create({
      name: 'Term 2',
      position: 2,
      startsOn: DateTime.now().plus({ months: 2 }),
      endsOn: DateTime.now().plus({ months: 6 }),
    })

    const response = await client.get('/api/register/seaside-swim/seaside-main/plans')

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.school.slug, 'seaside-main')
    assert.equal(body.swimYear.name, '2026')
    assert.lengthOf(body.swimYear.terms, 1)
    assert.equal(body.swimYear.terms[0].name, 'Term 1')
    assert.lengthOf(body.programs, 1)
    assert.equal(body.programs[0].publicId, program.publicId)
    const card = body.programs[0].levels.find(
      (l: { publicId: string }) => l.publicId === level.publicId
    )
    assert.exists(card)
    assert.equal(card.audience, 'child')
    assert.equal(card.fee.currency, 'GHS')
    assert.equal(card.fee.raw, level.defaultFee)
  })

  test('a level marked unavailable for the school is excluded', async ({ client, assert }) => {
    const { school } = await publishedSchool()
    const { level } = await seedCurriculum()
    await SchoolLevelSetting.create({ schoolId: school.id, levelId: level.id, available: false })

    const response = await client.get('/api/register/seaside-swim/seaside-main/plans')

    response.assertStatus(200)
    assert.lengthOf(response.body().programs, 0)
  })

  test('a single program is fetched by its public id', async ({ client, assert }) => {
    await publishedSchool()
    const { program, level } = await seedCurriculum()

    const response = await client.get(
      `/api/register/seaside-swim/seaside-main/programs/${program.publicId}/levels`
    )

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.program.publicId, program.publicId)
    assert.equal(body.program.levels[0].publicId, level.publicId)
  })

  test('an unknown school returns 404', async ({ client }) => {
    const response = await client.get('/api/register/nope/nope/plans')
    response.assertStatus(404)
  })
})
