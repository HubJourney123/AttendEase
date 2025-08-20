'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AttendanceSheet from '@/components/AttendanceSheet'
import toast from 'react-hot-toast'

export default function ClassPage({ params }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [classData, setClassData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchClassData()
    }
  }, [status, router])

  const fetchClassData = async () => {
    try {
      const response = await fetch('/api/classes')
      const classes = await response.json()
      const currentClass = classes.find(c => c.id === params.id)
      
      if (currentClass) {
        setClassData(currentClass)
      } else {
        toast.error('Class not found')
        router.push('/dashboard')
      }
      setLoading(false)
    } catch (error) {
      toast.error('Failed to fetch class data')
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!classData) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AttendanceSheet classData={classData} />
    </div>
  )
}