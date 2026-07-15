/**
 * Hierarchy codes: each tier's code is its parent's type segment plus its own
 * segment, with the account (organisation) initials only at the top.
 *
 *   Program  SAGP01   (account initials + P-number)
 *   Level    P01L01   (parent program segment + L-number)
 *   Stage    L01ST01  (parent level segment + ST-number)
 *   Class    ST01CL01 (parent stage segment + CL-number)
 *
 * Numbers are continuous per type across the whole platform: the second level
 * ever created is L02 no matter which program it belongs to.
 */

const SEGMENT_PATTERNS = {
  program: /P(\d+)/i,
  level: /L(\d+)/i,
  stage: /ST-?(\d+)/i,
  class: /CL-?(\d+)/i,
} as const

export type CodeTier = keyof typeof SEGMENT_PATTERNS

export function accountInitials(name: string): string {
  const initials = name
    .split(/[^a-zA-Z0-9]+/)
    .filter((word) => word.length > 0)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  if (initials.length >= 2) {
    return initials
  }

  const letters = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return letters.slice(0, 3) || 'ACC'
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** The tier's own segment within a code, e.g. "P01" out of "SAG-P01". */
export function codeSegment(code: string, tier: CodeTier): string | null {
  const match = SEGMENT_PATTERNS[tier].exec(code)
  return match ? match[0].toUpperCase() : null
}

/** The next continuous number for a tier, given every existing code of that tier. */
export function nextTierNumber(existingCodes: string[], tier: CodeTier): number {
  let max = 0
  for (const code of existingCodes) {
    const match = SEGMENT_PATTERNS[tier].exec(code)
    if (match) {
      max = Math.max(max, Number(match[1]))
    }
  }
  return max + 1
}

export function programCode(accountName: string, sequence: number): string {
  return `${accountInitials(accountName)}P${pad(sequence)}`
}

export function levelCode(parentProgramCode: string, sequence: number): string {
  const parent = codeSegment(parentProgramCode, 'program') ?? parentProgramCode.toUpperCase()
  return `${parent}L${pad(sequence)}`
}

export function stageCode(parentLevelCode: string, sequence: number): string {
  const parent = codeSegment(parentLevelCode, 'level') ?? parentLevelCode.toUpperCase()
  return `${parent}ST${pad(sequence)}`
}

export function classCode(parentStageCode: string, sequence: number): string {
  const parent = codeSegment(parentStageCode, 'stage') ?? parentStageCode.toUpperCase()
  return `${parent}CL${pad(sequence)}`
}
