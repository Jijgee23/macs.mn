/**
 * Per-post look of the article page, chosen in the admin (Post.appearance, JSON).
 * Shared by the admin form (what can be chosen), the page (how it is applied) and the
 * server (validation). No server-only imports: the admin form is a client component.
 */

export type Appearance = {
  /** Title block: centred or left-aligned. */
  header: "center" | "left";
  /** Cover picture: framed 16:9 with a blurred backdrop, full width in its own ratio, or not shown on the page. */
  cover: "framed" | "wide" | "hidden";
  /** Width of the reading column. */
  width: "narrow" | "normal" | "wide";
  /** Size of the article text. */
  text: "sm" | "md" | "lg";
  /** Gallery under the article: two-column grid or one picture per row. */
  gallery: "grid" | "stack";
  /** Date and reading time under the category. */
  meta: boolean;
  /** "Share" row below the article. */
  share: boolean;
  /** "Related posts" section. */
  related: boolean;
  /** Reading-progress bar at the top of the window. */
  progress: boolean;
};

export const defaultAppearance: Appearance = {
  header: "center",
  cover: "framed",
  width: "normal",
  text: "md",
  gallery: "grid",
  meta: true,
  share: true,
  related: true,
  progress: true,
};

type Choice = { [K in keyof Appearance]: Appearance[K] extends string ? K : never }[keyof Appearance];

export const appearanceChoices: {
  key: Choice;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  { key: "header", label: "Гарчгийн байрлал", options: [{ id: "center", label: "Голд" }, { id: "left", label: "Зүүн" }] },
  {
    key: "cover",
    label: "Cover зураг",
    options: [
      { id: "framed", label: "Хүрээтэй 16:9" },
      { id: "wide", label: "Бүтэн өргөн" },
      { id: "hidden", label: "Харуулахгүй" },
    ],
  },
  { key: "width", label: "Текстийн өргөн", options: [{ id: "narrow", label: "Нарийн" }, { id: "normal", label: "Энгийн" }, { id: "wide", label: "Өргөн" }] },
  { key: "text", label: "Үсгийн хэмжээ", options: [{ id: "sm", label: "Жижиг" }, { id: "md", label: "Энгийн" }, { id: "lg", label: "Том" }] },
  { key: "gallery", label: "Зургийн цомог", options: [{ id: "grid", label: "2 баганатай" }, { id: "stack", label: "Нэг нэгээр" }] },
];

export const appearanceToggles: { key: "meta" | "share" | "related" | "progress"; label: string }[] = [
  { key: "meta", label: "Огноо, унших хугацаа" },
  { key: "share", label: "Хуваалцах хэсэг" },
  { key: "related", label: "Холбоотой нийтлэл" },
  { key: "progress", label: "Унших явцын зураас" },
];

/** Reads stored JSON (or admin input) into a full Appearance: unknown or missing values fall back to the default look. */
export function parseAppearance(value: unknown): Appearance {
  const v = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const out: Appearance = { ...defaultAppearance };
  for (const c of appearanceChoices) {
    const given = v[c.key];
    if (typeof given === "string" && c.options.some((o) => o.id === given)) (out as Record<string, unknown>)[c.key] = given;
  }
  for (const t of appearanceToggles) {
    if (typeof v[t.key] === "boolean") out[t.key] = v[t.key] as boolean;
  }
  return out;
}
