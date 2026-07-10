import db from '@adonisjs/lucid/services/db'
import string from '@adonisjs/core/helpers/string'
import { AuthorizationResponse, errors } from '@adonisjs/bouncer'
import School from '#models/school'
import Organisation from '#models/organisation'
import Membership from '#models/membership'
import Role from '#models/role'
import type User from '#models/user'
import { RoleName } from '#values/role'
import { permissions } from '#start/permissions'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export type SchoolFoundingPayload = {
  organisationId?: number
  organisationName?: string
  schoolName: string
  location: string
}

export default class SchoolFoundingService {
  async found(founder: User, data: SchoolFoundingPayload): Promise<School> {
    if (data.organisationId) {
      return this.addSchool(founder, data.organisationId, data)
    }

    return this.foundFirstSchool(founder, data)
  }

  /**
   * Found the first school in a new organisation, make the founder its
   * Administrator, and set both active organisation and active school.
   */
  async foundFirstSchool(founder: User, data: SchoolFoundingPayload): Promise<School> {
    return db.transaction(async (trx) => {
      const organisationName = data.organisationName || `${data.schoolName} Organisation`
      const organisationSlug = await this.uniqueOrganisationSlug(organisationName, trx)
      const organisation = await Organisation.create(
        {
          name: organisationName,
          slug: organisationSlug,
          isPremium: false,
          createdByUserId: founder.id,
        },
        { client: trx }
      )

      return this.createSchoolForOrganisation(founder, organisation, data, trx)
    })
  }

  /**
   * Add a school under an existing organisation. The founder must hold the
   * school.create permission through any school in that organisation.
   */
  async addSchool(
    founder: User,
    organisationId: number,
    data: SchoolFoundingPayload
  ): Promise<School> {
    if (!(await this.canCreateSchool(founder, organisationId))) {
      throw new errors.E_AUTHORIZATION_FAILURE(AuthorizationResponse.deny('Access denied', 403))
    }

    return db.transaction(async (trx) => {
      const organisation = await Organisation.findOrFail(organisationId, { client: trx })
      return this.createSchoolForOrganisation(founder, organisation, data, trx)
    })
  }

  private async createSchoolForOrganisation(
    founder: User,
    organisation: Organisation,
    data: SchoolFoundingPayload,
    trx: TransactionClientContract
  ): Promise<School> {
    const slug = await this.uniqueSchoolSlug(data.schoolName, organisation.id, trx)
    const school = await organisation.related('schools').create({
      name: data.schoolName,
      location: data.location,
      slug,
      createdByUserId: founder.id,
    })

    const membership = await school.related('memberships').create({ userId: founder.id })

    const administrator = await Role.findByOrFail('name', RoleName.ADMINISTRATOR, { client: trx })
    await membership.related('roles').attach([administrator.id])

    founder.useTransaction(trx)
    founder.activeOrganisationId = organisation.id
    founder.activeSchoolId = school.id
    await founder.save()

    return school
  }

  private async canCreateSchool(founder: User, organisationId: number): Promise<boolean> {
    const memberships = await Membership.query()
      .where('userId', founder.id)
      .whereHas('school', (schoolQuery) => schoolQuery.where('organisationId', organisationId))
      .preload('school')

    for (const membership of memberships) {
      const access = await permissions.createAccessFor(membership)
      if (access.allows('school.create')) {
        return true
      }
    }

    return false
  }

  private async uniqueOrganisationSlug(
    name: string,
    trx: TransactionClientContract
  ): Promise<string> {
    const base = string.slug(name, { lower: true, strict: true }) || 'organisation'
    let slug = base
    let suffix = 2

    while (await Organisation.findBy('slug', slug, { client: trx })) {
      slug = `${base}-${suffix}`
      suffix++
    }

    return slug
  }

  private async uniqueSchoolSlug(
    name: string,
    organisationId: number,
    trx: TransactionClientContract
  ): Promise<string> {
    const base = string.slug(name, { lower: true, strict: true }) || 'school'
    let slug = base
    let suffix = 2

    while (
      await School.query({ client: trx })
        .where('organisationId', organisationId)
        .where('slug', slug)
        .first()
    ) {
      slug = `${base}-${suffix}`
      suffix++
    }

    return slug
  }
}
