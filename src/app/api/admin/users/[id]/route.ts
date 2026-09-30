import { NextResponse } from "next/server";
import { z } from "zod";

import { approveUserRegistration, setUserActive } from "@/lib/admin/users";
import { requireAdmin } from "@/lib/auth/session";
import { withApi } from "@/lib/http";

const IdSchema = z.string().min(1).max(64);

const PatchSchema = z
  .object({
    isActive: z.boolean().optional(),
    registrationApproved: z.boolean().optional(),
  })
  .refine(
    (data) => data.isActive !== undefined || data.registrationApproved === true,
    { message: "Nothing to update." },
  );

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  return withApi(async () => {
    const { user } = await requireAdmin();
    const { id } = await ctx.params;
    const targetId = IdSchema.parse(id);
    const body = PatchSchema.parse(await req.json().catch(() => ({})));

    if (body.registrationApproved === true) {
      const approved = await approveUserRegistration({
        actorId: user.id,
        targetId,
      });
      return NextResponse.json({ user: approved });
    }

    const updated = await setUserActive({
      actorId: user.id,
      targetId,
      isActive: body.isActive!,
    });

    return NextResponse.json({ user: updated });
  });
}
