import type { Brand } from "./src/lib/brand-types";

const brand: Brand = {
  slug: "witch-ology",
  schoolName: "The Witch-Ology Institute",
  communityName: "The Witch-Ology Society",
  tagline: "A structured school for modern craft study.",
  audience: "Adults who want a grounded place to study the craft, with one clear next step after each lesson.",
  colors: {
    ink: "#1C1416",
    muted: "#5E534E",
    paper: "#F6F1EA",
    panel: "#FFFCF8",
    line: "#E4D5C8",
    accent: "#7A2E40",
    accentInk: "#FFF8F6",
  },
  tiers: [
    {
      id: "welcome",
      name: "Welcome",
      monthly: 9900,
      annual: 99000,
      blurb: "Entry to the school and every Welcome course.",
    },
    {
      id: "member",
      name: "Member Circle",
      monthly: 19900,
      annual: 199000,
      blurb: "Welcome, plus every Member Circle course.",
    },
    {
      id: "inner",
      name: "Inner Circle",
      monthly: 39900,
      annual: 399000,
      blurb: "Everything in Member Circle, plus Inner Circle courses.",
    },
    {
      id: "crown",
      name: "Founder's Crown",
      monthly: null,
      annual: 1000000,
      blurb: "The full catalog, including Founder's Crown courses.",
      note: "Practitioner certification is a two-year path. This plan is billed once a year.",
    },
  ],
  sampleCourse: {
    title: "Sample course: What Witch-Ology study is",
    summary:
      "A short sample so you can see how a course opens. It explains the school and offers one reflection. It does not promise a result.",
    minTier: "welcome",
    modules: [
      {
        title: "The shape of this school",
        summary: "What the Institute teaches, and what it refuses to claim.",
        lessons: [
          {
            title: "Study, not a guarantee",
            body: `Witch-Ology study is education and enrichment. A lesson can give you language, history, and a practice to try. It cannot promise love, money, protection, health, or a particular outcome.

This campus is for adults. It is not medical, psychological, legal, or financial advice. If a decision affects your health, safety, or legal standing, talk with a qualified professional.

The work here is ordinary and specific: read, reflect, and choose one next step you can actually do.`,
          },
          {
            title: "One reflection to begin",
            body: `Set aside ten quiet minutes. Write three sentences.

What drew you to study the craft.
What you want to understand better.
What you will not ask a course to fix.

Keep the page. In a later lesson you can look back and see whether your reason got clearer. Clarity is the aim of this sample. A result beyond that is not offered or owed.`,
          },
        ],
      },
      {
        title: "Care while you study",
        summary: "What to do if a lesson stirs hard feelings.",
        lessons: [
          {
            title: "When study stirs something up",
            sensitive: true,
            body: `Reflection can bring up grief, fear, or old memories. That can happen in any serious study. Pause if you need to. You can close the lesson and come back later.

If you are in distress in the US, call or text 988. If you are in immediate danger, call 911. This lesson is not a crisis service, and it is not therapy.

When you are steady, write one sentence about what felt heavy and one ordinary thing you will do in the next hour, such as drinking water, stepping outside, or texting a friend.`,
          },
        ],
      },
    ],
  },
};

export { brand };
