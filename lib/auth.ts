import { MOCK_USERS } from "./mockData";
import type { User } from "@/types";

const AUTH_KEY = "uniwell_auth";

/** Simulate login — checks email + password against mock users */
export function loginUser(
  email: string,
  password: string
): { success: true; user: User } | { success: false; error: string } {
  const match = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!match) {
    return { success: false, error: "Invalid email or password." };
  }

  // Strip password before storing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...user } = match;
  saveSession(user);
  return { success: true, user };
}

/** Save user session to localStorage */
export function saveSession(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }
}

/** Load user session from localStorage */
export function loadSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

/** Clear session on logout */
export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
}
