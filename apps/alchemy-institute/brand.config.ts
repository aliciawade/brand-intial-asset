import type { Brand } from "./src/lib/brand-types";

const brand: Brand = {
  slug: "alchemy-institute",
  schoolName: "The Alchemy Institute",
  communityName: "The Crucible Collective",
  tagline: "A school for inner refinement.",
  audience: "Adults who want a structured way to study change, habit, and meaning without being promised a result.",
  colors: {
    ink: "#1A1814",
    muted: "#5C564C",
    paper: "#F4F0E6",
    panel: "#FFFCF6",
    line: "#E2D8C4",
    accent: "#6E5420",
    accentInk: "#FFF8EC",
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
      note: "Founder's Crown is billed once a year.",
    },
  ],
  sampleCourse: {
    title: "Sample course: How study works at the Institute",
    summary:
      "A short sample of the campus. It explains what inner refinement means here: study and reflection, not a promise that your life will change on a schedule.",
    minTier: "welcome",
    modules: [
      {
        title: "What refinement means here",
        summary: "The metaphor, and the limit on what a course can do.",
        lessons: [
          {
            title: "A practice, not a transformation guarantee",
            body: `At this Institute, alchemy is a study of attention, habit, and meaning. It is not a laboratory process, a medical treatment, or a promise that effort will produce a particular life outcome.

You will read, write, and choose one next step. That is the whole method of this sample. If you need help with health, money, or the law, use a qualified professional instead of a lesson.

Keep the work ordinary enough to finish.`,
          },
          {
            title: "Name one thing you are willing to practice",
            body: `Write a single sentence that starts with “This week I will.” End it with an action you can see, such as a ten-minute walk, a page of notes, or one conversation you have been postponing.

Do not write a new identity. Write a practice. Come back after you have done it once and note only what you noticed. The note is the study. A result beyond that is not offered.`,
          },
        ],
      },
      {
        title: "Care while you study",
        summary: "What to do if reflection feels like too much.",
        lessons: [
          {
            title: "When the work feels heavy",
            sensitive: true,
            body: `Looking at habits and meaning can stir shame or grief. Stop for the day if that happens. A course can wait.

If you are in distress in the US, call or text 988. If you are in immediate danger, call 911. This lesson is not therapy and not a crisis service.

When you are steady, write one kind thing you can do for your body in the next hour. Keep it simple.`,
          },
        ],
      },
    ],
  },
};

export { brand };
