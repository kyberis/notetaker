import { isWillIdpOAuthConfigured } from "@/lib/idp-base";

export function requiresRegistrationApproval(): boolean {
  const v = process.env.REGISTRATION_REQUIRES_APPROVAL?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return true;
}

export function isRegistrationApproved(user: {
  registrationApprovedAt?: Date | string | null;
}): boolean {
  if (!requiresRegistrationApproval()) return true;
  const at = user.registrationApprovedAt;
  if (!at) return false;
  if (at instanceof Date) return !Number.isNaN(at.getTime());
  return String(at).trim().length > 0;
}

export function registrationApprovedAtForCreate(): Date | null {
  if (!requiresRegistrationApproval()) return new Date();
  if (isWillIdpOAuthConfigured()) return new Date();
  return null;
}
