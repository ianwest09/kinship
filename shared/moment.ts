export type ActivityType =
  "listening" | "looking" | "conversation" | "hands-on" | "quiet";
export interface Profile {
  references: string;
  interests: string;
  language: string;
  activity: ActivityType;
  duration: 5 | 10 | 15;
  atmosphere: "calm" | "cheerful" | "reflective" | "playful";
  avoid: string;
  practical: string;
}
export interface Entity {
  id: string;
  name: string;
  type: string;
  seedNames?: string[];
}
export interface Moment {
  title: string;
  why: string;
  opening: string;
  invitations: string[];
  activity: string;
  closing: string;
  adaptation: string;
  duration: number;
  source: "demo" | "qloo" | "general";
  reference?: Entity;
  note: string;
  model: string;
}
export interface Progress {
  step: number;
  status: "working" | "done" | "skipped" | "error";
  detail: string;
}
export const emptyProfile: Profile = {
  references: "",
  interests: "",
  language: "",
  activity: "conversation",
  duration: 10,
  atmosphere: "calm",
  avoid: "",
  practical: "",
};
export const exampleProfile: Profile = {
  ...emptyProfile,
  references: "Miriam Makeba",
  interests: "Gardening",
  activity: "looking",
  atmosphere: "calm",
};
