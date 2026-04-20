import { z } from "zod";

export const clientSchema = z.object({
  name: z
    .string()
    .min(3, { error: "Name is too short" })
    .max(50, { error: "Name is too long" }),
  email: z.email({ error: "Email is invalid" }).optional(),
  phoneNumber: z
    .string()
    .min(10, { error: "Phone number is too short" })
    .max(10, { error: "Phone number is too long" })
    .regex(/^(020|050|024|054|055|053|023|026|027|056|057|030)\d{7}$/, {
      error: "Phone number not valid",
    })
    .optional(),
  address: z.string().min(3, { error: "Address is too short" }),
});

export type ClientInput = z.infer<typeof clientSchema>;
