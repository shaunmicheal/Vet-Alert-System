import { createContext } from 'react'

// Shared auth state. Kept in its own module so both the provider and the
// useAuth hook can import it without circular dependencies.
export const AuthContext = createContext(null)