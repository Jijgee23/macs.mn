import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Cleans post HTML from the admin editor before it is stored. Only the formatting the
 * editor can produce survives; images must come from our /media/ route or https;
 * links get safe rel/target. Run on every save — pages render the stored HTML as is.
 */
export function sanitizePostHtml(input: string) {
  return sanitizeHtml(input, {
    allowedTags: ["p", "br", "h2", "h3", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "img", "hr", "code", "pre", "span", "div"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "class", "style"],
      span: ["class"],
      p: ["class"],
      h2: ["class"],
      h3: ["class"],
      ul: ["class"],
      ol: ["class"],
      blockquote: ["class"],
      div: ["class"],
    },
    allowedStyles: { img: { width: [/^\d{1,3}%$/] } },
    allowedClasses: {
      span: ["fs-xs", "fs-sm", "fs-lg", "fs-xl", "fs-2xl", "fs-3xl"],
      p: ["lh-tight", "lh-snug", "lh-relaxed", "lh-loose", "ta-center", "ta-right", "ta-justify"],
      h2: ["lh-tight", "lh-snug", "lh-relaxed", "lh-loose", "ta-center", "ta-right", "ta-justify"],
      h3: ["lh-tight", "lh-snug", "lh-relaxed", "lh-loose", "ta-center", "ta-right", "ta-justify"],
      ul: ["lh-tight", "lh-snug", "lh-relaxed", "lh-loose", "ta-center", "ta-right", "ta-justify"],
      ol: ["lh-tight", "lh-snug", "lh-relaxed", "lh-loose", "ta-center", "ta-right", "ta-justify"],
      blockquote: ["lh-tight", "lh-snug", "lh-relaxed", "lh-loose", "ta-center", "ta-right", "ta-justify"],
      div: ["cols", "cols-2", "cols-3", "cg", "cg-col", "cg-2", "cg-3", "cg-4", "cg-r-1-2", "cg-r-2-1", "cg-r-2-1-1", "cg-r-1-2-1", "cg-r-1-1-2"],
      img: ["img-w25", "img-w33", "img-w50", "img-w75", "img-w100", "img-left", "img-center", "img-right"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => frame.tag === "img" && !/^(\/media\/[\w-]+|https:\/\/)/.test(frame.attribs.src ?? ""),
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const external = /^https?:\/\//.test(href) && !/^https?:\/\/(www\.)?macs\.mn(\/|$)/.test(href);
        const attrs: Record<string, string> = external ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
        return { tagName, attribs: attrs };
      },
    },
  });
}

/** Plain-text length check, so "<p></p>" doesn't count as content. */
export const textLength = (html: string) => sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim().length;

/**
 * Wraps runs of two or more consecutive, non-floated pictures in <div class="img-row"> so they sit side
 * by side, centred. Expects HTML already cleaned by sanitizePostHtml (its <img> tags have a fixed shape).
 */
export function groupImageRows(html: string) {
  const img = String.raw`<img\b(?![^>]*\bimg-(?:left|right)\b)[^>]*>`;
  return html.replace(new RegExp(String.raw`(?:${img}\s*){2,}`, "g"), (run) => `<div class="img-row">${run.trim()}</div>`);
}

/** Picture addresses in document order (the order the full-screen viewer pages through). */
export function imageSrcs(html: string) {
  return [...html.matchAll(/<img\b[^>]*?\bsrc="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
}
