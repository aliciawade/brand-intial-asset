import type { Brand } from "./src/lib/brand-types";

const brand: Brand = {
  slug: "evergreen-path",
  schoolName: "EverGreen Soul-Path Navigation Institute",
  communityName: "The Heartwood Atlas",
  tagline: "A school for choosing a next step.",
  audience: "Adults who want a calm structure for values, direction, and the next honest step. This is study, not a predicted future.",
  colors: {
    ink: "#14201A",
    muted: "#4E5C55",
    paper: "#F2F6F3",
    panel: "#FBFDFB",
    line: "#D5E2DA",
    accent: "#1F5A40",
    accentInk: "#F4FFF8",
  },
  tiers: [
    {
      id: "welcome",
      name: "Welcome",
      monthly: 7900,
      annual: 79000,
      blurb: "Entry to the school and every Welcome course.",
    },
    {
      id: "member",
      name: "Member Circle",
      monthly: 14900,
      annual: 149000,
      blurb: "Welcome, plus every Member Circle course.",
    },
    {
      id: "inner",
      name: "Inner Circle",
      monthly: 29900,
      annual: 299000,
      blurb: "Everything in Member Circle, plus Inner Circle courses.",
    },
    {
      id: "crown",
      name: "Founder's Crown",
      monthly: null,
      annual: 750000,
      blurb: "The full catalog, including Founder's Crown courses.",
      note: "Founder's Crown is billed once a year.",
    },
  ],
  sampleCourse: {
    title: "Sample course: A first look at path study",
    summary:
      "A short sample so you can see the campus. It helps you name a next step. It does not map your future or promise where a path will lead.",
    minTier: "welcome",
    modules: [
      {
        title: "A path is a choice you can take",
        summary: "What this school means by navigation.",
        lessons: [
          {
            title: "No map of your future",
            body: `Path study here is education and enrichment. A lesson can help you notice what you value and choose a next step you can actually take. It cannot tell you your destiny, diagnose you, or guarantee where the step leads.

You are the one who decides. If a choice affects your health, safety, money, or legal standing, talk with a qualified professional.

The work is to get specific enough that the next step fits in one ordinary day.`,
          },
          {
            title: "Write the next honest step",
            body: `Answer three lines.

What matters to you this season.
What is already true, without improving the story.
The smallest step that respects both.

If the step needs someone else's consent, write the question you will ask them instead of the outcome you want. A clear question is a complete lesson.`,
          },
        ],
      },
      {
        title: "Care while you study",
        summary: "What to do if direction-finding stirs fear or grief.",
        lessons: [
          {
            title: "When the question is tender",
            sensitive: true,
            body: `Asking where you are going can bring up loss. You do not have to finish the page today.

If you are in distress in the US, call or text 988. If you are in immediate danger, call 911. This lesson is not a crisis service, and it is not therapy.

When you want to continue, return to the smallest step that can be done in the next day. Leave the rest of the path unnamed.`,
          },
        ],
      },
    ],
  },
};

export { brand };
