"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface UserContextType {
  currentUser: {
    id: string
    name: string
    email: string
    role: string
    permissions?: string[]
    region?: string | null
    assignedAccounts?: string[] | null
    department?: string
    hierarchy?: number
  } | null
  setCurrentUser: (user: UserContextType["currentUser"]) => void
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => null,
})

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserContextType["currentUser"]>({
    id: "admin",
    name: "Admin User",
    email: "admin@paysa.com",
    role: "admin",
    permissions: ["all"],
    region: null,
    assignedAccounts: null,
    department: "Operations",
    hierarchy: 1,
  })

  return <UserContext.Provider value={{ currentUser, setCurrentUser }}>{children}</UserContext.Provider>
}

export const useUser = () => useContext(UserContext)
