export const TIER_ORDER = ["welcome", "member", "inner", "crown"] as const;

export type TierId = (typeof TIER_ORDER)[number];

export type BrandTier = {
  id: TierId;
  name: string;
  monthly: number | null;
  annual: number;
  blurb: string;
  note?: string;
};

export type BrandLesson = {
  title: string;
  body: string;
  sensitive?: boolean;
};

export type BrandModule = {
  title: string;
  summary: string;
  lessons: BrandLesson[];
};

export type Brand = {
  slug: string;
  schoolName: string;
  communityName: string;
  tagline: string;
  audience: string;
  colors: {
    ink: string;
    muted: string;
    paper: string;
    panel: string;
    line: string;
    accent: string;
    accentInk: string;
  };
  tiers: BrandTier[];
  sampleCourse: {
    title: string;
    summary: string;
    minTier: TierId;
    modules: BrandModule[];
  };
};
