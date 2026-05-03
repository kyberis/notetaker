/**
 * Bump this when the Terms or Privacy text materially changes. Users with
 * `acceptedTermsVersion < CURRENT_TERMS_VERSION` are routed to /accept-terms
 * to re-consent. GDPR Art. 7(1) requires demonstrable consent: the
 * `acceptedTermsAt` + `acceptedTermsVersion` columns on User are how we
 * demonstrate it.
 */
export const CURRENT_TERMS_VERSION = "1.0";

/** How long after `User.deletedAt` we hard-delete data. */
export const ACCOUNT_DELETION_GRACE_DAYS = 30;
