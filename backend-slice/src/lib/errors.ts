export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    public message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const BadRequest         = (m = 'Bad request')                   => new HttpError(400, 'bad_request', m);
export const Unauthorized       = (m = 'Authentication required')        => new HttpError(401, 'unauthenticated', m);
export const Forbidden          = (m = 'Access denied')                  => new HttpError(403, 'forbidden', m);
export const NotFound           = (m = 'Not found')                      => new HttpError(404, 'not_found', m);
export const InvalidTransition  = (from: string, to: string, allowed: string[]) =>
  new HttpError(409, 'invalid_transition', `Cannot move from ${from} to ${to}`, { from, to, allowed });
export const RuleViolation      = (rule: string, m: string, details?: Record<string, unknown>) =>
  new HttpError(422, 'rule_violation', m, { rule, ...details });
export const ValidationFailed   = (fields: Record<string, string>) =>
  new HttpError(422, 'validation_failed', 'Validation failed', { fields });
