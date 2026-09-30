import { afterEach, describe, expect, it } from "vitest";

import {
  isRegistrationApproved,
  registrationApprovedAtForCreate,
  requiresRegistrationApproval,
} from "./registration-approval";

describe("Will registration approval", () => {
  afterEach(() => {
    delete process.env.REGISTRATION_REQUIRES_APPROVAL;
  });

  it("defaults the gate on", () => {
    delete process.env.REGISTRATION_REQUIRES_APPROVAL;
    expect(requiresRegistrationApproval()).toBe(true);
  });

  it("accepts falsey env values", () => {
    for (const v of ["0", "false", "no", "off"]) {
      process.env.REGISTRATION_REQUIRES_APPROVAL = v;
      expect(requiresRegistrationApproval()).toBe(false);
      expect(isRegistrationApproved({ registrationApprovedAt: null })).toBe(true);
    }
  });

  it("requires a timestamp when the gate is on", () => {
    process.env.REGISTRATION_REQUIRES_APPROVAL = "true";
    expect(isRegistrationApproved({ registrationApprovedAt: null })).toBe(false);
    expect(
      isRegistrationApproved({
        registrationApprovedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("auto-approves creates when the env is off", () => {
    process.env.REGISTRATION_REQUIRES_APPROVAL = "false";
    const at = registrationApprovedAtForCreate();
    expect(at).toBeInstanceOf(Date);
  });
});
