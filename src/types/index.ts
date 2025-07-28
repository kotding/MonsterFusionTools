import { z } from "zod";

// Zod schema for form validation
export const dataSchema = z.object({
  name: z.string().min(1, "Name is required.").max(50, "Name must be 50 characters or less."),
  value: z.string().min(1, "Value is required."),
});

// TypeScript type derived from the Zod schema, including server-generated fields
export type Data = z.infer<typeof dataSchema> & {
  id: string;
  timestamp: number;
};

// Zod schema for gift code form validation
export const giftCodeSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters long.").max(30, "Code must be 30 characters or less."),
  reward: z.string().min(1, "Reward is required."),
});

// TypeScript type for GiftCode
export type GiftCode = z.infer<typeof giftCodeSchema> & {
  id: string;
  createdAt: number;
  isUsed: boolean;
};
