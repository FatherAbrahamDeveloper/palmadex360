import jwt from "jsonwebtoken";

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return process.env.JWT_SECRET;
};

// Session token. `v` is the user's tokenVersion: bumping it (password reset,
// "sign out everywhere", deactivation) invalidates every token issued before.
export const generateToken = (user) =>
  jwt.sign(
    { id: user.id, companyId: user.companyId, v: user.tokenVersion ?? 0 },
    secret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

export const verifyToken = (token) => jwt.verify(token, secret());

// Short-lived token proving the password step passed, used for the two-factor step.
export const generateChallengeToken = (user) =>
  jwt.sign({ id: user.id, purpose: "2fa", v: user.tokenVersion ?? 0 }, secret(), { expiresIn: "5m" });

export const verifyChallengeToken = (token) => {
  const payload = jwt.verify(token, secret());
  if (payload.purpose !== "2fa") throw new Error("Wrong token purpose");
  return payload;
};
