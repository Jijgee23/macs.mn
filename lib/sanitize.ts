import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Cleans post HTML from the admin editor before it is stored. Only the formatting the
 * editor can produce survives; images must come from our /media/ route or https;
 * links get safe rel/target. Run on every save — pages render the stored HTML as is.
 */
export function sanitizePostHtml(input: string) {
  return sanitizeHtml(input, {
    allowedTags: ["p", "br", "h2", "h3", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "img", "hr", "code", "pre"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
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
