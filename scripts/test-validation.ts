import { registerSchema } from "../lib/validation/register";
import { loginSchema } from "../lib/validation/login";
import { transferSchema } from "../lib/validation/transfer";

const registerResult = registerSchema.safeParse({
  firstName: "John",
  lastName: "Doe",
  email: "JOHN@EXAMPLE.COM",
  phone: "+44 7000 000000",
  password: "Testing123",
  confirmPassword: "Testing123",
  terms: true,
});

console.log("REGISTER:", registerResult);

const loginResult = loginSchema.safeParse({
  email: "john@example.com",
  password: "Testing123",
});

console.log("LOGIN:", loginResult);

const transferResult = transferSchema.safeParse({
  accountNumber: "1234567890",
  amount: 250,
  narration: "Rent contribution",
});

console.log("TRANSFER:", transferResult);
