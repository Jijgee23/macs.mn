"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, requireAdmin, verifyPassword } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = email ? await db.adminUser.findUnique({ where: { email } }) : null;
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Имэйл эсвэл нууц үг буруу байна" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.isLoggedIn = true;
  await session.save();

  redirect("/admin");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/admin/login");
}

export type RequestKind = "quote" | "contact";

const updateSchema = z.object({
  kind: z.enum(["quote", "contact"]),
  id: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]),
  note: z
    .string()
    .trim()
    .max(2000)
    .transform((v) => v || null),
});

/** Updates status/note on a quote request or a contact message. */
export async function updateRequest(formData: FormData) {
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    kind: formData.get("kind"),
    id: formData.get("id"),
    status: formData.get("status"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return;

  const { kind, id, ...data } = parsed.data;
  if (kind === "quote") {
    await db.quoteRequest.update({ where: { id }, data });
    revalidatePath("/admin");
  } else {
    await db.contactMessage.update({ where: { id }, data });
    revalidatePath("/admin/messages");
  }
}
