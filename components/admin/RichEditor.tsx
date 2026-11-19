"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, Extension, Mark, Node as TiptapNode, useEditor, type Editor } from "@tiptap/react";
import type { Node as ProseNode } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { uploadImage } from "./upload";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Captions,
  Columns2,
  Columns3,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Rows2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";

/** Text sizes of the rich editor: stored as <span class="fs-…">, styled by `.rich .fs-…` in globals.css. */
export const FONT_SIZES = [
  { id: "xs", label: "Тун жижиг" },
  { id: "sm", label: "Жижиг" },
  { id: "", label: "Энгийн" },
  { id: "lg", label: "Том" },
  { id: "xl", label: "Илүү том" },
  { id: "2xl", label: "Маш том" },
  { id: "3xl", label: "Гарчиг" },
] as const;

/** Picture widths and alignments of the rich editor: stored as classes on <img>, styled in globals.css. */
export const IMAGE_SIZES = [
  { id: "", label: "Автомат" },
  { id: "25", label: "25%" },
  { id: "33", label: "33%" },
  { id: "50", label: "50%" },
  { id: "75", label: "75%" },
  { id: "100", label: "100%" },
] as const;

const IMAGE_ALIGNS = ["left", "center", "right"];

const sizeAttr = {
  default: null,
  parseHTML: (el: HTMLElement) => {
    const w = /^(\d{1,3})(?:\.\d+)?%$/.exec(el.style.width)?.[1];
    return w ?? [...el.classList].find((c) => /^img-w\d+$/.test(c))?.slice(5) ?? null;
  },
  renderHTML: (attrs: Record<string, string | null>) => (attrs.size ? { style: `width: ${attrs.size}%` } : {}),
};
const alignAttr = {
  default: null,
  parseHTML: (el: HTMLElement) => IMAGE_ALIGNS.find((v) => el.classList.contains(`img-${v}`)) ?? null,
  renderHTML: (attrs: Record<string, string | null>) => (attrs.align ? { class: `img-${attrs.align}` } : {}),
};

const SizedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: sizeAttr,
      align: alignAttr,
    };
  },
});

/** Line spacing and text alignment of a block: stored as classes (lh-…, ta-…), styled in globals.css. */
export const LINE_HEIGHTS = [
  { id: "", label: "Мөрийн зай: анхны" },
  { id: "tight", label: "Нягт" },
  { id: "snug", label: "Бага зэрэг нягт" },
  { id: "relaxed", label: "Сул" },
  { id: "loose", label: "Маш сул" },
] as const;

export const TEXT_ALIGNS = [
  { id: "", label: "Байрлал: зүүн" },
  { id: "center", label: "Голд" },
  { id: "right", label: "Баруун" },
  { id: "justify", label: "Тэгшлэх" },
] as const;

const BLOCK_TYPES = ["paragraph", "heading", "bulletList", "orderedList", "blockquote"];

const classValue = (prefix: string, allowed: readonly string[]) => (el: HTMLElement) =>
  allowed.find((v) => el.classList.contains(`${prefix}${v}`)) ?? null;

const BlockStyle = Extension.create({
  name: "blockStyle",
  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: classValue("lh-", LINE_HEIGHTS.map((l) => l.id).filter(Boolean)),
            renderHTML: (attrs: { lineHeight?: string | null }) => (attrs.lineHeight ? { class: `lh-${attrs.lineHeight}` } : {}),
          },
          textAlign: {
            default: null,
            parseHTML: classValue("ta-", TEXT_ALIGNS.map((l) => l.id).filter(Boolean)),
            renderHTML: (attrs: { textAlign?: string | null }) => (attrs.textAlign ? { class: `ta-${attrs.textAlign}` } : {}),
          },
        },
      },
    ];
  },
});

/** A group of blocks laid out in 2 or 3 text columns (<div class="cols cols-2">). */
const Columns = TiptapNode.create({
  name: "columns",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      count: {
        default: "2",
        parseHTML: (el: HTMLElement) => (el.classList.contains("cols-3") ? "3" : "2"),
        renderHTML: (attrs: { count?: string }) => ({ class: `cols cols-${attrs.count === "3" ? "3" : "2"}` }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div.cols" }];
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) {
    return ["div", HTMLAttributes, 0];
  },
});

const FontSize = Mark.create({
  name: "fontSize",
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el: HTMLElement) => [...el.classList].find((c) => c.startsWith("fs-"))?.slice(3) ?? null,
        renderHTML: (attrs: { size?: string | null }) => (attrs.size ? { class: `fs-${attrs.size}` } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span", getAttrs: (el: HTMLElement) => ([...el.classList].some((c) => c.startsWith("fs-")) ? null : false) }];
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) {
    return ["span", HTMLAttributes, 0];
  },
});

/**
 * Rich text editor for post bodies. Produces HTML limited to what lib/sanitize.ts keeps:
 * headings, emphasis, lists, quotes and links. Images are managed in the post's Media section; the Image
 * extension stays only so older posts that already embed pictures keep them when edited.
 * With `images`, pictures can be inserted anywhere in the text (button with several files, drag & drop, paste).
 */
export function RichEditor({
  value,
  onChange,
  placeholder,
  lang,
  images = false,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  lang: "mn" | "en";
  /** Allow inserting uploaded pictures into the text. */
  images?: boolean;
}) {
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);
  // The editor options below are read once, so they call through this ref to reach the latest closure.
  const insertRef = useRef<(files: File[]) => void>(() => {});

  const insertFiles = async (files: File[]) => {
    const pictures = files.filter((f) => f.type.startsWith("image/"));
    if (!pictures.length) return;
    setError(null);
    setUploading((n) => n + pictures.length);
    // Upload in order, then insert them together: a single insert keeps every picture
    // (inserting one at a time makes the next replace the still-selected previous one).
    const urls: string[] = [];
    for (const file of pictures) {
      try {
        urls.push((await uploadImage(file)).url);
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (urls.length) {
      editorRef.current
        ?.chain()
        .focus()
        .insertContent(urls.map((src) => ({ type: "image", attrs: { src, alt: "" } })))
        .run();
    }
  };

  useEffect(() => {
    insertRef.current = insertFiles;
  });

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      SizedImage.configure({ HTMLAttributes: { loading: "lazy" } }),
      FontSize,
      BlockStyle,
      Columns,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rich min-h-[280px] px-4 py-3 outline-none",
        lang,
        "data-placeholder": placeholder ?? "",
      },
      handleDrop: images
        ? (_view, event) => {
            const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
            if (!files.length) return false;
            event.preventDefault();
            insertRef.current(files);
            return true;
          }
        : undefined,
      handlePaste: images
        ? (_view, event) => {
            const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
            if (!files.length) return false;
            event.preventDefault();
            insertRef.current(files);
            return true;
          }
        : undefined,
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  return (
    <div className="rounded-xl border border-line bg-surface focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
      {editor && (
        <Toolbar editor={editor} onPickImages={images ? () => fileInput.current?.click() : undefined} uploading={uploading} />
      )}
      {images && (
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            insertRef.current(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      )}
      {error && (
        <p role="alert" className="border-b border-line bg-brand-soft/50 px-3 py-1.5 text-xs text-brand">
          {error}
        </p>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  onPickImages,
  uploading,
}: {
  editor: Editor;
  onPickImages?: () => void;
  uploading: number;
}) {
  const currentSize = (editor.getAttributes("fontSize").size as string | undefined) ?? "";
  const setSize = (id: string) => {
    const chain = editor.chain().focus();
    if (id) chain.setMark("fontSize", { size: id }).run();
    else chain.unsetMark("fontSize").run();
  };
  const textblock = editor.state.selection.$from.parent;
  const lineHeight = (textblock.attrs.lineHeight as string | undefined) ?? "";
  const textAlign = (textblock.attrs.textAlign as string | undefined) ?? "";
  // Applies to every paragraph, heading, list and quote the selection touches.
  const setBlockAttr = (attr: "lineHeight" | "textAlign", value: string) =>
    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
          if (BLOCK_TYPES.includes(node.type.name)) tr.setNodeMarkup(pos, undefined, { ...node.attrs, [attr]: value || null });
        });
        return true;
      })
      .run();
  // The first columns block the selection touches (the cursor inside it, or a range that reaches it).
  const columnsAtCursor = (() => {
    const hits: { node: ProseNode; pos: number }[] = [];
    editor.state.doc.nodesBetween(editor.state.selection.from, editor.state.selection.to, (node, pos) => {
      if (!hits.length && node.type.name === "columns") hits.push({ node, pos });
      return !hits.length;
    });
    return hits[0] ?? null;
  })();
  const inColumns = !!columnsAtCursor;
  const columnCount = (columnsAtCursor?.node.attrs.count as string | undefined) ?? "";
  const setColumns = (count: "2" | "3") => {
    if (!columnsAtCursor) return void editor.chain().focus().wrapIn("columns", { count }).run();
    const { node, pos } = columnsAtCursor;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, count });
        return true;
      })
      .run();
  };
  const unwrapColumns = () => {
    if (!columnsAtCursor) return;
    const { node, pos } = columnsAtCursor;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.replaceWith(pos, pos + node.nodeSize, node.content);
        return true;
      })
      .run();
  };
  const imageActive = editor.isActive("image");
  const imageSize = (editor.getAttributes("image").size as string | undefined) ?? "";
  const imageAlign = (editor.getAttributes("image").align as string | undefined) ?? "";
  const setImageSize = (size: string) => {
    const n = Math.round(Number(size));
    const valid = Number.isFinite(n) && n >= 5;
    editor.chain().focus().updateAttributes("image", { size: valid ? String(Math.min(100, n)) : null }).run();
  };
  const setImageAlign = (align: string) =>
    editor.chain().focus().updateAttributes("image", { align: imageAlign === align ? null : align }).run();
  const setAlt = () => {
    const previous = (editor.getAttributes("image").alt as string | undefined) ?? "";
    const alt = window.prompt("Зургийн тайлбар (alt текст)", previous);
    if (alt !== null) editor.chain().focus().updateAttributes("image", { alt: alt.trim() }).run();
  };

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Холбоосын хаяг (https://…)", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "" || url.trim() === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = /^(https?:\/\/|mailto:|tel:|\/)/.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    if (editor.state.selection.empty && !editor.isActive("link")) {
      // Nothing selected: insert the address itself as a link.
      editor.chain().focus().insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).unsetMark("link").insertContent(" ").run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const buttons: { icon: LucideIcon; label: string; run: () => void; active?: boolean; disabled?: boolean }[][] = [
    [
      { icon: Heading2, label: "Гарчиг", run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
      { icon: Heading3, label: "Дэд гарчиг", run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    ],
    [
      { icon: Bold, label: "Тод", run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
      { icon: Italic, label: "Налуу", run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
      { icon: Underline, label: "Доогуур зураас", run: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
      { icon: Strikethrough, label: "Дундуур зураас", run: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
    ],
    [
      { icon: List, label: "Жагсаалт", run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
      { icon: ListOrdered, label: "Дугаартай жагсаалт", run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
      { icon: Quote, label: "Ишлэл", run: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
      { icon: Minus, label: "Хэвтээ зураас", run: () => editor.chain().focus().setHorizontalRule().run() },
    ],
    [
      { icon: Link2, label: "Холбоос", run: setLink, active: editor.isActive("link") },
      { icon: Link2Off, label: "Холбоос авах", run: () => editor.chain().focus().unsetLink().run(), disabled: !editor.isActive("link") },
    ],
    ...(onPickImages
      ? [
          [
            { icon: Columns2, label: "2 багана", run: () => setColumns("2"), active: inColumns && columnCount === "2" },
            { icon: Columns3, label: "3 багана", run: () => setColumns("3"), active: inColumns && columnCount === "3" },
            { icon: Rows2, label: "Баганыг болиулах", run: unwrapColumns, disabled: !inColumns },
          ],
        ]
      : []),
    ...(onPickImages
      ? [
          [
            { icon: ImagePlus, label: uploading ? `Зураг оруулж байна (${uploading})…` : "Зураг оруулах", run: onPickImages, disabled: uploading > 0 },
            { icon: AlignLeft, label: "Зураг зүүн талд (текст тойрно)", run: () => setImageAlign("left"), active: imageAlign === "left", disabled: !imageActive },
            { icon: AlignCenter, label: "Зураг голд", run: () => setImageAlign("center"), active: imageAlign === "center", disabled: !imageActive },
            { icon: AlignRight, label: "Зураг баруун талд (текст тойрно)", run: () => setImageAlign("right"), active: imageAlign === "right", disabled: !imageActive },
            { icon: Captions, label: "Зургийн тайлбар (alt)", run: setAlt, disabled: !imageActive },
          ],
        ]
      : []),
    [
      { icon: Undo2, label: "Буцаах", run: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo() },
      { icon: Redo2, label: "Дахих", run: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo() },
    ],
  ];

  return (
    <div className="sticky top-[7.25rem] z-10 rounded-t-xl border-b border-line bg-soft/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5" role="toolbar" aria-label="Форматлах">
        {onPickImages && (
          <select
            aria-label="Үсгийн хэмжээ"
            title="Үсгийн хэмжээ"
            value={currentSize}
            onChange={(e) => setSize(e.target.value)}
            className="h-8 rounded-md border border-line bg-surface px-1.5 text-xs text-ink outline-none focus:border-brand"
          >
            {FONT_SIZES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        )}
        {onPickImages && (
          <>
            <select
              aria-label="Мөр хоорондын зай"
              title="Мөр хоорондын зай"
              value={lineHeight}
              onChange={(e) => setBlockAttr("lineHeight", e.target.value)}
              className="h-8 rounded-md border border-line bg-surface px-1.5 text-xs text-ink outline-none focus:border-brand"
            >
              {LINE_HEIGHTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Текстийн байрлал"
              title="Текстийн байрлал"
              value={textAlign}
              onChange={(e) => setBlockAttr("textAlign", e.target.value)}
              className="h-8 rounded-md border border-line bg-surface px-1.5 text-xs text-ink outline-none focus:border-brand"
            >
              {TEXT_ALIGNS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </>
        )}
        {onPickImages && (
          <div className="flex items-center gap-1">
            <select
              aria-label="Зургийн хэмжээ"
              title="Зургийн хэмжээ (зураг сонгоод)"
              value={IMAGE_SIZES.some((f) => f.id === imageSize) ? imageSize : "custom"}
              disabled={!imageActive}
              onChange={(e) => e.target.value !== "custom" && setImageSize(e.target.value)}
              className="h-8 rounded-md border border-line bg-surface px-1.5 text-xs text-ink outline-none focus:border-brand disabled:opacity-40"
            >
              {IMAGE_SIZES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id ? `Зураг ${f.label}` : "Зураг: автомат"}
                </option>
              ))}
              {!IMAGE_SIZES.some((f) => f.id === imageSize) && <option value="custom">{`Зураг ${imageSize}%`}</option>}
            </select>
            <input
              type="number"
              inputMode="numeric"
              min={5}
              max={100}
              step={5}
              aria-label="Зургийн өргөн (%)"
              title="Зургийн өргөн, хувиар (5–100)"
              placeholder="%"
              disabled={!imageActive}
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value)}
              className="h-8 w-16 rounded-md border border-line bg-surface px-1.5 text-xs text-ink outline-none focus:border-brand disabled:opacity-40"
            />
          </div>
        )}
        {buttons.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5 border-r border-line pr-1 last:border-r-0">
            {group.map((b) => (
              <button
                key={b.label}
                type="button"
                title={b.label}
                aria-label={b.label}
                aria-pressed={b.active}
                disabled={b.disabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={b.run}
                className={`flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-30 ${
                  b.active ? "bg-ink text-bg" : "text-muted hover:bg-surface hover:text-ink"
                }`}
              >
                <b.icon className="size-4" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
