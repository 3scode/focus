interface StoredUser {
  email: string
  name: string
  passwordHash: string
  createdAt: string
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("auth_users")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem("auth_users", JSON.stringify(users))
}

export async function registerUser(email: string, password: string, name: string): Promise<StoredUser> {
  const users = getUsers()
  if (users.some((u) => u.email === email)) {
    throw new Error("Email sudah terdaftar")
  }
  const passwordHash = await hashPassword(password)
  const user: StoredUser = { email, name, passwordHash, createdAt: new Date().toISOString() }
  saveUsers([...users, user])
  return user
}

export async function authenticateUser(email: string, password: string): Promise<StoredUser> {
  const users = getUsers()
  const user = users.find((u) => u.email === email)
  if (!user) throw new Error("Email tidak terdaftar")
  const passwordHash = await hashPassword(password)
  if (user.passwordHash !== passwordHash) throw new Error("Password salah")
  return user
}

interface SessionUser {
  email: string
  name: string
}

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("auth_session")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(user: SessionUser): void {
  localStorage.setItem("auth_session", JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem("auth_session")
}
