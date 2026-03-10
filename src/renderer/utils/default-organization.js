/**
 * Resolve preferred default organization id for the current user.
 *
 * Priority:
 * 1) user.default_organization_id
 * 2) user.personal_organization_id
 * 3) organizations[0]
 *
 * @param {Object} args
 * @param {Object|null|undefined} args.user
 * @param {Array<{id:number}>|null|undefined} args.organizations
 * @returns {number|null}
 */
export function resolveDefaultOrganizationId({ user, organizations }) {
  if (!Array.isArray(organizations) || organizations.length === 0) return null

  const candidates = [user?.default_organization_id, user?.personal_organization_id].filter(
    (v) => typeof v === 'number' && Number.isFinite(v) && v > 0
  )

  for (const id of candidates) {
    if (organizations.some((o) => o?.id === id)) return id
  }

  const first = organizations[0]?.id
  return typeof first === 'number' && Number.isFinite(first) && first > 0 ? first : null
}
