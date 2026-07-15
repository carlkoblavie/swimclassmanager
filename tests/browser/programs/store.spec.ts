import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { SchoolFactory } from '#database/factories/school_factory'
import { ProgramFactory } from '#database/factories/program_factory'
import { seedRoles, joinSchool } from '#tests/helpers'
import { RoleName } from '#values/role'
import Program from '#models/program'
import type User from '#models/user'

async function manager(): Promise<User> {
  const user = await UserFactory.apply('completed').create()
  const school = await SchoolFactory.merge({ createdByUserId: user.id }).create()
  await joinSchool(user, school, RoleName.ADMINISTRATOR)
  return user
}

test.group('Programs store', (group) => {
  group.each.setup(async () => {
    const truncate = await testUtils.db().truncate()
    await seedRoles()
    return truncate
  })

  test('creates a program with levels and lands on the list', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    await browserContext.loginAs(await manager())

    const page = await visit(route('programs.create'))
    await page.getByLabel('Program name').fill('Learn to Swim')
    await page.getByLabel('Description', { exact: true }).fill('Our flagship program.')

    await page.getByRole('button', { name: 'Add level' }).click()
    await page.getByLabel('Level name').fill('Beginners')
    await page.getByLabel('Age group').fill('4-7')
    await page.getByLabel('Capacity').fill('10')
    await page.getByLabel('Fee (GHS)').fill('50')
    await page.getByLabel('Level description').fill('Intro level.')
    await page.getByRole('button', { name: 'Save level' }).click()

    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Stage name').fill('Water Discovery')
    await page.getByLabel('Skill name').fill('Face in Water')
    await page.getByLabel('Pass criteria').fill('Submerge face for 5 seconds')
    await page.getByLabel('Skill description (optional)').fill('Comfort with submersion.')
    await page.getByRole('button', { name: 'Add skill' }).click()
    await page.getByRole('button', { name: 'Add activity' }).click()
    await page.getByLabel('Activity name').fill('Bubble Blowing Contest')
    await page.getByLabel('Duration (mins)').fill('5')
    await page.getByLabel('Activity description (optional)').fill('Group breathing game.')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await page.getByRole('button', { name: 'Save stage' }).click()

    await page.getByRole('button', { name: 'Save as draft' }).click()

    await page.assertPath(route('programs.index'))
    await page.assertVisible('text=Program created')
    await page.assertVisible('text=Learn to Swim')
    await page.assertVisible(page.getByText('Draft', { exact: true }))
    await page.assertVisible('text=Water Discovery')

    await db.assertHas('programs', { name: 'Learn to Swim', activated_at: null })
    await db.assertHas('levels', { name: 'Beginners', default_fee: 5000, capacity: 10 })
    await db.assertHas('level_stages', { name: 'Water Discovery', position: 1 })
    await db.assertHas('level_stage_skills', {
      name: 'Face in Water',
      pass_criteria: 'Submerge face for 5 seconds',
      description: 'Comfort with submersion.',
    })
    await db.assertHas('level_stage_activities', {
      name: 'Bubble Blowing Contest',
      duration_minutes: 5,
      description: 'Group breathing game.',
    })
  })

  test('rejects duplicate skill names within a stage', async ({ visit, route, browserContext }) => {
    await browserContext.loginAs(await manager())

    const page = await visit(route('programs.create'))
    await page.getByRole('button', { name: 'Add level' }).click()
    await page.getByLabel('Level name').fill('Beginners')
    await page.getByLabel('Age group').fill('4-7')
    await page.getByLabel('Capacity').fill('10')
    await page.getByLabel('Fee (GHS)').fill('50')
    await page.getByLabel('Level description').fill('Intro level.')
    await page.getByRole('button', { name: 'Save level' }).click()

    await page.getByRole('button', { name: 'Add stage' }).click()
    await page.getByLabel('Skill name').fill('Back Float')
    await page.getByLabel('Pass criteria').fill('2 seconds unassisted')
    await page.getByRole('button', { name: 'Add skill' }).click()
    // Same name, different case: still a duplicate.
    await page.getByLabel('Skill name').fill('back float')
    await page.getByLabel('Pass criteria').fill('10 seconds unassisted')
    await page.getByRole('button', { name: 'Add skill' }).click()

    await page.assertVisible('text=A skill with this name already exists.')
    await page.assertVisible(page.getByText('1 skill', { exact: true }))
  })

  test('requires stage and skill fields in the stage builder', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    await browserContext.loginAs(await manager())

    const page = await visit(route('programs.create'))
    await page.getByRole('button', { name: 'Add level' }).click()
    await page.getByLabel('Level name').fill('Beginners')
    await page.getByLabel('Age group').fill('4-7')
    await page.getByLabel('Capacity').fill('10')
    await page.getByLabel('Fee (GHS)').fill('50')
    await page.getByLabel('Level description').fill('Intro level.')
    await page.getByRole('button', { name: 'Save level' }).click()

    await page.getByRole('button', { name: 'Add stage' }).click()
    // Skill fields left empty: adding the skill is rejected in place.
    await page.getByRole('button', { name: 'Add skill' }).click()
    await page.assertVisible(page.getByText('This field is required').first())
    // Stage name left empty: saving the stage is rejected too.
    await page.getByRole('button', { name: 'Save stage' }).click()
    await page.assertVisible(page.getByRole('button', { name: 'Save stage' }))

    await db.assertCount('level_stages', 0)
    await db.assertCount('level_stage_skills', 0)
  })

  test('publishes a program directly from the builder', async ({
    visit,
    route,
    browserContext,
    assert,
  }) => {
    await browserContext.loginAs(await manager())

    const page = await visit(route('programs.create'))
    await page.getByLabel('Program name').fill('Learn to Swim')
    await page.getByLabel('Description', { exact: true }).fill('Our flagship program.')

    await page.getByRole('button', { name: 'Add level' }).click()
    await page.getByLabel('Level name').fill('Beginners')
    await page.getByLabel('Age group').fill('4-7')
    await page.getByLabel('Capacity').fill('10')
    await page.getByLabel('Fee (GHS)').fill('50')
    await page.getByLabel('Level description').fill('Intro level.')
    await page.getByRole('button', { name: 'Save level' }).click()

    await page.getByRole('button', { name: 'Publish program' }).click()

    await page.assertPath(route('programs.index'))
    await page.assertVisible('text=Program published')
    await page.assertVisible(page.getByText('Active', { exact: true }))

    const program = await Program.findByOrFail('name', 'Learn to Swim')
    assert.isTrue(program.isActive)
  })

  test('rejects a duplicate program name (case-insensitive) and creates nothing', async ({
    visit,
    route,
    browserContext,
    db,
  }) => {
    await browserContext.loginAs(await manager())
    await ProgramFactory.merge({ name: 'Learn to Swim' }).create()

    const page = await visit(route('programs.create'))
    await page.getByLabel('Program name').fill('learn to swim')
    await page.getByLabel('Description', { exact: true }).fill('Duplicate attempt.')
    await page.getByRole('button', { name: 'Add level' }).click()
    await page.getByLabel('Level name').fill('Beginners')
    await page.getByLabel('Age group').fill('4-7')
    await page.getByLabel('Capacity').fill('10')
    await page.getByLabel('Fee (GHS)').fill('50')
    await page.getByLabel('Level description').fill('Intro level.')
    await page.getByRole('button', { name: 'Save level' }).click()
    await page.getByRole('button', { name: 'Save as draft' }).click()

    await page.assertPath(route('programs.create'))
    await page.assertVisible('text=A program with this name already exists')
    await db.assertCount('programs', 1)
  })

  test('rejects a program with no level', async ({ visit, route, browserContext, db }) => {
    await browserContext.loginAs(await manager())

    const page = await visit(route('programs.create'))
    await page.getByLabel('Program name').fill('Learn to Swim')
    await page.getByLabel('Description', { exact: true }).fill('No levels.')
    await page.getByRole('button', { name: 'Save as draft' }).click()

    await page.assertPath(route('programs.create'))
    await db.assertCount('programs', 0)
  })

  test('rejects an invalid submission ({case})')
    .with([
      { case: 'missing program name', fillName: false, fee: '50', capacity: '10' },
      { case: 'negative fee', fillName: true, fee: '-5', capacity: '10' },
      { case: 'non-whole capacity', fillName: true, fee: '50', capacity: '1.5' },
    ])
    .run(async ({ visit, route, browserContext, db }, row) => {
      await browserContext.loginAs(await manager())

      const page = await visit(route('programs.create'))
      if (row.fillName) {
        await page.getByLabel('Program name').fill('Learn to Swim')
      }
      await page.getByLabel('Description', { exact: true }).fill('A program.')
      await page.getByRole('button', { name: 'Add level' }).click()
      await page.getByLabel('Level name').fill('Beginners')
      await page.getByLabel('Age group').fill('4-7')
      await page.getByLabel('Capacity').fill(row.capacity)
      await page.getByLabel('Fee (GHS)').fill(row.fee)
      await page.getByLabel('Level description').fill('Intro level.')
      await page.getByRole('button', { name: 'Save level' }).click()
      await page.getByRole('button', { name: 'Save as draft' }).click()

      await page.assertPath(route('programs.create'))
      await db.assertCount('programs', 0)
    })
})
