import { z } from "zod";
import { CEREAL_TYPES } from "./cereal-types";
import { parsePosition } from "./position";

export const entryKindSchema = z.enum(["BIG_BAG", "OTHER"]);
export const cerealTypeSchema = z.enum(CEREAL_TYPES as [string, ...string[]]);

const entryBaseSchema = z.object({
  kind: entryKindSchema,
  position: z.string().optional().nullable(),
  cerealType: cerealTypeSchema.optional().nullable(),
  cerealTypeOther: z.string().max(50).optional().nullable(),
  year: z.number().int().min(1980).max(2100).optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  humidity: z.number().min(0).max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

function refineEntry(
  data: {
    kind?: "BIG_BAG" | "OTHER";
    position?: string | null;
    cerealType?: string | null;
    cerealTypeOther?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  if (data.position) {
    const parsed = parsePosition(data.position);
    if (!parsed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Position invalide (ex. A01, B15)",
        path: ["position"],
      });
    }
  }
  if (data.cerealType === "AUTRE" && !data.cerealTypeOther?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Précisez le type de céréale",
      path: ["cerealTypeOther"],
    });
  }
}

export const createEntrySchema = entryBaseSchema
  .extend({
    id: z.number().int().positive(),
  })
  .superRefine(refineEntry);

export const updateEntrySchema = entryBaseSchema
  .partial()
  .extend({
    kind: entryKindSchema.optional(),
  })
  .superRefine(refineEntry);

export const moveEntrySchema = z.object({
  position: z.string().nullable(),
});

export const decommissionEntrySchema = z.object({
  forKikiriki: z.boolean(),
});

export const createUserSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(100),
  role: z.enum(["ADMIN", "USER"]),
});

export const updateUserSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

export type SerializedEntry = {
  id: number;
  kind: "BIG_BAG" | "OTHER";
  position: string | null;
  cerealType: string | null;
  cerealTypeOther: string | null;
  year: number | null;
  weight: number | null;
  humidity: number | null;
  description: string | null;
  status: "ACTIVE" | "DECOMMISSIONED";
  decommissionForKikiriki: boolean;
  isPaid: boolean;
  decommissionedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { username: string };
  lastModifiedBy: { username: string };
};
