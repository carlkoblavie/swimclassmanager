import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  types: {},
  columns: {
    // Certification lists are stored as JSON arrays of names; the models add
    // prepare/consume to (de)serialize.
    certifications: {
      tsType: 'string[]',
      decorators: [{ name: '@column' }],
    },
  },
  tables: {},
} satisfies SchemaRules
