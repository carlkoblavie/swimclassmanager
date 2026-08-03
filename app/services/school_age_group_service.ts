import SchoolAgeGroup from '#models/school_age_group'

const DEFAULT_AGE_GROUPS = [
  {
    ageGroupKey: 'six_and_below',
    displayName: '6 and below',
    minAgeYear: null,
    maxAgeYear: 6,
  },
  {
    ageGroupKey: 'six_to_seventeen',
    displayName: '6 to 17',
    minAgeYear: 6,
    maxAgeYear: 17,
  },
  {
    ageGroupKey: 'adult',
    displayName: '18+',
    minAgeYear: 18,
    maxAgeYear: null,
  },
]

export default class SchoolAgeGroupService {
  async allForSchool(schoolId: number): Promise<SchoolAgeGroup[]> {
    await this.ensureDefaults(schoolId)

    return SchoolAgeGroup.query()
      .where('schoolId', schoolId)
      .orderBy('position')
      .orderBy('displayName')
  }

  async forSchool(schoolId: number): Promise<SchoolAgeGroup[]> {
    await this.ensureDefaults(schoolId)

    return SchoolAgeGroup.query()
      .where('schoolId', schoolId)
      .where('isActive', true)
      .orderBy('position')
      .orderBy('displayName')
  }

  async ensureDefaults(schoolId: number): Promise<void> {
    const existing = await SchoolAgeGroup.query().where('schoolId', schoolId).first()
    if (existing) {
      return
    }

    await SchoolAgeGroup.createMany(
      DEFAULT_AGE_GROUPS.map((group, index) => ({
        schoolId,
        ...group,
        position: index + 1,
        isActive: true,
      }))
    )
  }
}
