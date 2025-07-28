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
