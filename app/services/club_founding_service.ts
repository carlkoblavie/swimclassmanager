import db from '@adonisjs/lucid/services/db'
import string from '@adonisjs/core/helpers/string'
import Club from '#models/club'
import Role from '#models/role'
import type User from '#models/user'
import { RoleName } from '#values/role'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export default class ClubFoundingService {
  /**
   * Found a club: create the club, make the founder its Administrator, and set
   * it as the founder's active club — all in one transaction.
   */
  async found(founder: User, data: { name: string; location: string }): Promise<Club> {
    return db.transaction(async (trx) => {
      const slug = await this.uniqueSlug(data.name, trx)
      const club = await Club.create(
        { name: data.name, location: data.location, slug, createdByUserId: founder.id },
        { client: trx }
      )

      const membership = await club.related('memberships').create({ userId: founder.id })

      const administrator = await Role.findByOrFail('name', RoleName.ADMINISTRATOR, { client: trx })
      await membership.related('roles').attach([administrator.id])

      founder.useTransaction(trx)
      founder.activeClubId = club.id
      await founder.save()

      return club
    })
  }

  /**
   * A URL-safe slug derived from the club name, made unique with a numeric
   * suffix when the base slug is already taken.
   */
  private async uniqueSlug(name: string, trx: TransactionClientContract): Promise<string> {
    const base = string.slug(name, { lower: true, strict: true })
    let slug = base
    let suffix = 2

    while (await Club.findBy('slug', slug, { client: trx })) {
      slug = `${base}-${suffix}`
      suffix++
    }

    return slug
  }
}
