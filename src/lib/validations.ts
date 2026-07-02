import { z } from "zod";
import { parsePosition } from "./position";

export const entryKindSchema = z.enum(["BIG_BAG", "OTHER"]);

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hex invalide (ex. #FF0000)");

export const createBigBagVarietySchema = z.object({
  name: z.string().min(1).max(100),
  color: hexColorSchema,
  isBarred: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateBigBagVarietySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: hexColorSchema.optional(),
  isBarred: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const reorderBigBagVarietiesSchema = z.object({
  ids: z.array(z.string().cuid()).min(1),
});

export const createOwnerSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateOwnerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const reorderOwnersSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type SerializedBigBagVariety = {
  id: string;
  name: string;
  color: string;
  isBarred: boolean;
};

export type SerializedOwner = {
  id: string;
  name: string;
};

const entryBaseSchema = z.object({
  kind: entryKindSchema,
  position: z.string().optional().nullable(),
  bigBagVarietyId: z.string().cuid().optional().nullable(),
  ownerId: z.string().min(1).optional().nullable(),
  year: z.number().int().min(1980).max(2100).optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  humidity: z.number().min(0).max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

function refineEntry(
  data: {
    kind?: "BIG_BAG" | "OTHER";
    position?: string | null;
    bigBagVarietyId?: string | null;
    ownerId?: string | null;
    year?: number | null;
  },
  ctx: z.RefinementCtx,
  options?: { requireBigBagFields?: boolean; requireOwner?: boolean },
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

  if (options?.requireBigBagFields && data.kind === "BIG_BAG") {
    if (!data.bigBagVarietyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le type de graine est obligatoire",
        path: ["bigBagVarietyId"],
      });
    }
  }

  if (options?.requireOwner && !data.ownerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le propriétaire est obligatoire",
      path: ["ownerId"],
    });
  }
}

export const createEntrySchema = entryBaseSchema
  .extend({
    id: z.number().int().positive(),
  })
  .superRefine((data, ctx) =>
    refineEntry(data, ctx, { requireBigBagFields: true, requireOwner: true }),
  );

export const updateEntrySchema = entryBaseSchema
  .partial()
  .extend({
    kind: entryKindSchema.optional(),
  })
  .superRefine(refineEntry);

export const moveEntrySchema = z.object({
  position: z.string().nullable(),
});

export const decommissionReasonSchema = z.enum(["KIKIRIKI", "OIL_PRESSING", "GENERAL"]);

export type DecommissionReason = z.infer<typeof decommissionReasonSchema>;

export const decommissionEntrySchema = z.object({
  reason: decommissionReasonSchema,
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
  bigBagVariety: SerializedBigBagVariety | null;
  owner: SerializedOwner;
  year: number | null;
  weight: number | null;
  humidity: number | null;
  description: string | null;
  status: "ACTIVE" | "DECOMMISSIONED";
  decommissionReason: "KIKIRIKI" | "OIL_PRESSING" | "GENERAL" | null;
  isPaid: boolean;
  decommissionedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { username: string };
  lastModifiedBy: { username: string };
};
