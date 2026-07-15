---
capability: organisations
---

# Organisations — State

## Requirements

### Creating an organisation with the first school

- Given a signed-in person with no organisation or school, when they create their first school with an organisation name, school name, and location, then the organisation is created, the school is created inside it, and the person lands in that school with the organisation active.
- Given required organisation or school information is missing, when they try to create the first school, then it is rejected and neither organisation nor school is created.

### Active organisation context

- Given a person belongs to schools across multiple organisations, when they choose an organisation, then that organisation becomes their active organisation.
- Given a person accepts an invitation to a school in another organisation, when the invitation is accepted, then that organisation becomes active and the invited school becomes active.

### Multiple schools under an organisation

- Given an Administrator or Head Coach of a school in an organisation, when they add another school to that organisation with a name and location, then the new school is created under the same organisation.
- Given a person who is not an Administrator or Head Coach of a school in an organisation, when they try to add a school to that organisation, then they are not permitted to.

### Organisation premium status

- Given an organisation exists, then it has a premium or non-premium status and starts as non-premium.
- Given an organisation is premium, when its schools use capabilities gated by premium status, then those schools are treated as premium through the organisation.
