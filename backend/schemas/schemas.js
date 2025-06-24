import z from "zod/v4";

const userSchema = z.object({
  username: z
    .string()
    .min(4, "Username must have at least 4 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  name: z
    .string()
    .min(2, "Name must have at least 2 letters")
    .regex(/^[a-zA-Z]+$/, "Name can only contain letters"),
  lastname: z
    .string()
    .min(2, "Lastname must have at least 2 letters")
    .regex(/^[a-zA-Z]+$/, "Lastname can only contain letters"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must have at least 8 characters")
    .regex(
      /^(?=.*[A-Z])(?=.*\d).*$/,
      "Password must contain at least one uppercase letter and one number"
    ),
  type: z
    .number()
    .int()
    .min(1, "Type must be a non-negative integer")
    .max(2, "Type must be 1 or 2"),
});

const hotelSchema = z.object({
  hotelName: z.string().min(1, "Hotel name is required"),
  rate: z.number().min(0, "Rate must be a positive number"),
  price: z
    .number()
    .min(50, "Price must be a positive number")
    .max(10000, "Price must be less than 10000"),
  direction: z.string().min(1, "Direction is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  description: z.string().min(1, "Description is required"),
  photos: z.record(z.string(), z.string()),
  services: z.record(z.string(), z.string()),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
});
const reservationSchema = z.object({
  hotelId: z.number().int().min(1, "Hotel ID must be a positive integer"),
  fechaIn: z.iso.date().refine((dateStr) => new Date(dateStr) > new Date(), {
    message: "Check-in date must be in the future",
  }),
  fechaOut: z.iso.date().refine((dateStr) => new Date(dateStr) > new Date(), {
    message: "Check-out date must be in the future",
  }),
  price: z.number().positive("Price must be a positive number"),
  paymentMethod: z.enum(["credit_card", "paypal", "bank_transfer"]),
});
const disponibilitySchema = z.object({
  hotelId: z.number().int().min(1, "Hotel ID must be a positive integer"),
  fechaIn: z.iso.date().refine((dateStr) => new Date(dateStr) > new Date(), {
    message: "Check-in date must be in the future",
  }),
  fechaOut: z.iso.date().refine((dateStr) => new Date(dateStr) > new Date(), {
    message: "Check-out date must be in the future",
  }),
  reason: z.string().min(1, "Reason is required"),
});
const paymentSchema = z.object({
  rsvId: z.string().uuid("Invalid reservation ID format"),
});
export const validateUserSchema = (input) => {
  return userSchema.safeParse(input);
};
export const validateHotelsSchema = (input) => {
  console.log(input);
  return hotelSchema.safeParse(input);
};
export const validateReservationSchema = (input) => {
  return reservationSchema.safeParse(input);
};
export const validateDisponibilitySchema = (input) => {
  return disponibilitySchema.safeParse(input);
};
export const validatePaymentSchema = (input) => {
  return paymentSchema.safeParse(input);
};
