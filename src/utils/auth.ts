import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { createHash, randomBytes } from "crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET!);

export const hashPassword = async (password: string) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const comparePasswords = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const signAccessToken = async (payload: {
  sub: string;
  role: string;
}) => {
  return await new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);
};

export const createPasswordResetToken = () => {
  const token = randomBytes(32).toString("hex");
  const hashedToken = createHash("sha256").update(token).digest("hex");
  return { token, hashedToken };
};

export const hashResetToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};
