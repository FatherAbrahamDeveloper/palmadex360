import {
  createCompany,
  createUser,
  findUserByEmail,
} from "../repositories/user.repository.js";

import {
  hashPassword,
  comparePassword,
} from "../utils/password.js";

import { generateToken } from "../utils/jwt.js";


export const register = async (payload) => {
  const email = payload.email?.trim().toLowerCase();

  if (!email) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const company = await createCompany({
    name: payload.companyName?.trim() || null,
    email: payload.companyEmail?.trim().toLowerCase() || null,
    phone: payload.companyPhone?.trim() || null,
  });

  const passwordHash = await hashPassword(payload.password);

  const user = await createUser({
    firstName: payload.firstName?.trim() || null,
    lastName: payload.lastName?.trim() || null,
    email,
    passwordHash,
    role: "SUPER_ADMIN",
    companyId: company.id,
  });

  return {
    token: generateToken(user),
    user,
  };
};


export const login = async (email, password) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const valid = await comparePassword(
    password,
    user.passwordHash
  );

  if (!valid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return {
    token: generateToken(user),
    user,
  };
};
