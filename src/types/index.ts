import { z } from "zod";
import { REWARD_TYPES, ARTIFACT_RARITIES, ARTIFACT_PIECE_TYPES } from "./rewards";

// Schema for the artifact information object
export const artifactInfoSchema = z.object({
  Artifact_PieceType: z.enum(ARTIFACT_PIECE_TYPES).default("None"),
  Artifact_Rarity: z.enum(ARTIFACT_RARITIES).default("None"),
  ClassChar: z.string().default("A"),
});

// Base schema for a single reward
export const rewardSchema = z.object({
  rewardType: z.enum(REWARD_TYPES),
  rewardAmount: z.coerce.number().min(1, "Amount must be at least 1."),
  monsterId: z.coerce.number().default(0),
  artifactInfo: artifactInfoSchema.default({}),
});

// Zod schema for manual gift code form validation
export const manualGiftCodeSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters.").max(50, "Code must be 50 characters or less."),
  listRewards: z.array(rewardSchema).min(1, "At least one reward is required."),
  maxClaimCount: z.coerce.number().min(1, "Max claims must be at least 1.").default(1),
  expireDays: z.coerce.number().min(1, "Expiration must be at least 1 day.").default(365),
});

// Zod schema for batch gift code form validation
export const batchGiftCodeSchema = z.object({
  prefix: z.string().max(20, "Prefix must be 20 characters or less.").default("moonlight"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1.").max(100, "Max 100 codes at a time."),
  listRewards: z.array(rewardSchema).min(1, "At least one reward is required."),
  maxClaimCount: z.coerce.number().min(1, "Max claims must be at least 1.").default(1),
  expireDays: z.coerce.number().min(1, "Expiration must be at least 1 day.").default(365),
});


// Base type for a single reward, can be inferred from the schema
export type Reward = z.infer<typeof rewardSchema>;

// This represents the final structure of a gift code object in Firebase
export type GiftCode = {
  id: string; // The code itself is the ID
  code: string;
  currClaimCount: number;
  day: number; // Assuming this is always 1 for now
  expire: string; // ISO Date String
  listRewards: Reward[];
  maxClaimCount: number;
};
