import { SignJWT, jwtVerify } from "jose";

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production!");
    }
    return new TextEncoder().encode("fallback-secret-for-development-only-123456");
  }

  return new TextEncoder().encode(secret);
};

export async function signToken(payload: { userId: string; email: string }, expiresIn: string = "7d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecretKey());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as { userId: string; email: string };
  } catch (error) {
    return null;
  }
}
