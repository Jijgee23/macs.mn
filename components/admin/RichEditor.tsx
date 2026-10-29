"use client";

import { useId, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { uploadImage } from "./upload";

/**
 * Rich text editor for post bodies. Produces HTML limited to what lib/sanitize.ts keeps:
 * headings, emphasis, lists, quotes, links and uploaded images.
 */
export function RichEditor({
  value,
  onChange,
  placeholder,
  lang,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  lang: "mn" | "en";
}) {
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
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rich min-h-[280px] px-4 py-3 outline-none",
        lang,
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div className="rounded-xl border border-line bg-surface focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileInputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onImage = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name.replace(/\.\w+$/, "") }).run();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      input.value = "";
    }
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
      { icon: uploading ? Loader2 : ImagePlus, label: "Зураг оруулах", run: () => document.getElementById(fileInputId)?.click(), disabled: uploading },
    ],
    [
      { icon: Undo2, label: "Буцаах", run: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo() },
      { icon: Redo2, label: "Дахих", run: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo() },
    ],
  ];

  return (
    <div className="sticky top-[7.25rem] z-10 rounded-t-xl border-b border-line bg-soft/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5" role="toolbar" aria-label="Форматлах">
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
                <b.icon className={`size-4 ${b.icon === Loader2 ? "animate-spin" : ""}`} />
              </button>
            ))}
          </div>
        ))}
        <input
          id={fileInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => onImage(e.currentTarget)}
        />
      </div>
      {error && <p className="px-3 pb-2 text-xs text-brand">{error}</p>}
    </div>
  );
}
