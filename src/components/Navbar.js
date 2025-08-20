'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = () => {
    setIsMobileMenuOpen(false)
    signOut()
  }

  const handleSignIn = () => {
    setIsMobileMenuOpen(false)
    signIn('google')
  }

  return (
    <>
      {/* Main Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-lg shadow-lg' 
          : 'bg-white/95 backdrop-blur-md shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <Link 
              href={session ? "/dashboard" : "/"} 
              className="flex items-center space-x-3 group"
            >
              {/* Desktop Logo */}
              <div className="hidden md:block">
                <Image
                  src="/AE-long.svg"
                  alt="AttendEase"
                  width={180}
                  height={40}
                  className="h-10 w-auto transform transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
              
              {/* Mobile Logo */}
              <div className="block md:hidden">
                <Image
                  src="/AE-short.svg"
                  alt="AE"
                  width={40}
                  height={40}
                  className="h-10 w-10 transform transition-transform duration-300 group-hover:scale-110"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {session && (
                <>
                  <Link 
                    href="/dashboard"
                    className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      pathname === '/dashboard' 
                        ? 'text-blue-600' 
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    Dashboard
                    {pathname === '/dashboard' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></span>
                    )}
                  </Link>
                  
                  <Link 
                    href="/analytics"
                    className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      pathname === '/analytics' 
                        ? 'text-blue-600' 
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    Analytics
                    {pathname === '/analytics' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></span>
                    )}
                  </Link>
                </>
              )}

              {/* User Menu */}
              {session ? (
                <div className="flex items-center space-x-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                    <div className="text-right hidden lg:block">
                      <p className="text-sm font-semibold text-gray-800">
                        {session.user?.name?.split(' ')[0]}
                      </p>
                      
                    </div>
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {session.user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="relative overflow-hidden px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium text-sm shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10">Sign Out</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="relative overflow-hidden px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium text-sm shadow-md hover:shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center group"
            >
              <div className="space-y-1.5">
                <span className={`block h-0.5 w-5 bg-gray-600 transform transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}></span>
                <span className={`block h-0.5 w-5 bg-gray-600 transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}></span>
                <span className={`block h-0.5 w-5 bg-gray-600 transform transition-all duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 border-t border-gray-200' : 'max-h-0'
        }`}>
          <div className="px-4 py-4 bg-white/95 backdrop-blur-lg">
            {session ? (
              <>
                {/* User Info Mobile */}
                <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-gray-200">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-12 h-12 rounded-full ring-2 ring-white shadow-md object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {session.user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{session.user?.name}</p>
                    <p className="text-sm text-gray-500">{session.user?.email}</p>
                  </div>
                </div>

                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      pathname === '/dashboard'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  
                  <Link
                    href="/analytics"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      pathname === '/analytics'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Analytics
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full mt-4 px-4 py-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16"></div>
    </>
  )
}