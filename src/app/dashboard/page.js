'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CreateClassModal from '@/components/CreateClassModal'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [classes, setClasses] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchClasses()
    }
  }, [status, router])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      
      if (!response.ok) {
        console.error('Response not OK:', response.status)
        toast.error('Failed to fetch classes')
        setClasses([])
        setLoading(false)
        return
      }

      const data = await response.json()
      
      if (Array.isArray(data)) {
        setClasses(data)
      } else {
        console.error('Data is not an array:', data)
        setClasses([])
        if (data.error) {
          toast.error(data.error)
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Failed to fetch classes')
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const handleClassCreated = (newClass) => {
    setClasses([newClass, ...classes])
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
          My Classes
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Create New Class
        </button>
      </div>

      {!Array.isArray(classes) || classes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
          <p className="text-gray-500 text-lg mb-6 font-medium">
            No classes created yet
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Create Your First Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              onClick={() => router.push(`/class/${classItem.id}`)}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-6 border border-gray-100 hover:border-indigo-200 transform hover:-translate-y-1"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                {classItem.courseCode}
              </h2>
              <p className="text-gray-600 font-medium mb-3 line-clamp-2">
                {classItem.courseName}
              </p>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium">
                  Batch: {classItem.batch}
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  Roll: {classItem.startingRoll} - {classItem.endingRoll}
                </p>
              </div>
              <div className="mt-4">
                <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                  View Class
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClassCreated={handleClassCreated}
      />
    </div>
  )
}