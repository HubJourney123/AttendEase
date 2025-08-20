import { Inter } from 'next/font/google'
import './globals.css'
import 'react-datepicker/dist/react-datepicker.css'
import Providers from '@/components/Providers'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AttendEase - Smart Attendance Management',
  description: 'Modern attendance tracking system for teachers',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}