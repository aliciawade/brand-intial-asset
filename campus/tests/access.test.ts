import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canAccessCourse } from "../src/lib/access";

const now = new Date("2026-11-11T12:00:00.000Z");
const future = "2026-12-11T12:00:00.000Z";
const past = "2026-10-11T12:00:00.000Z";

describe("canAccessCourse", () => {
  it("lets an admin open any course without a subscription", () => {
    assert.equal(
      canAccessCourse({ role: "admin", status: null, tier: null, periodEnd: null, minTier: "crown", now }),
      true,
    );
  });

  it("keeps lesson text closed without an active subscription", () => {
    assert.equal(
      canAccessCourse({ role: "learner", status: null, tier: null, periodEnd: null, minTier: "welcome", now }),
      false,
    );
    assert.equal(
      canAccessCourse({ role: "learner", status: "past_due", tier: "inner", periodEnd: future, minTier: "welcome", now }),
      false,
    );
    assert.equal(
      canAccessCourse({ role: "learner", status: "canceled", tier: "member", periodEnd: future, minTier: "welcome", now }),
      false,
    );
  });

  it("stacks access upward and stops at the paid period", () => {
    assert.equal(
      canAccessCourse({ role: "learner", status: "active", tier: "member", periodEnd: future, minTier: "welcome", now }),
      true,
    );
    assert.equal(
      canAccessCourse({ role: "learner", status: "trialing", tier: "welcome", periodEnd: future, minTier: "welcome", now }),
      true,
    );
    assert.equal(
      canAccessCourse({ role: "learner", status: "active", tier: "member", periodEnd: future, minTier: "inner", now }),
      false,
    );
    assert.equal(
      canAccessCourse({ role: "learner", status: "active", tier: "crown", periodEnd: future, minTier: "inner", now }),
      true,
    );
    assert.equal(
      canAccessCourse({ role: "learner", status: "active", tier: "member", periodEnd: past, minTier: "welcome", now }),
      false,
    );
  });
});
