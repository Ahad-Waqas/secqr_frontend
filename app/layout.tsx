import { UserProvider } from '@/contexts/user-context'
import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/toaster'
import { Inter } from "next/font/google"

export const metadata: Metadata = {
  title: 'SECQR - Secure QR Management System',
  description: 'A comprehensive QR code management system with role-based access control',
}
const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
        {children}
        <Toaster />
        </UserProvider>
      </body>
    </html>
  )
}
