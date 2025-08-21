'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CreateClassModal from '@/components/CreateClassModal'
import toast from 'react-hot-toast'
import EditClassModal from '@/components/EditClassModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [classes, setClasses] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
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

  const handleEdit = (e, classItem) => {
  e.stopPropagation() // Prevent navigation
  setSelectedClass(classItem)
  setIsEditModalOpen(true)
}

const handleDelete = (e, classItem) => {
  e.stopPropagation() // Prevent navigation
  setSelectedClass(classItem)
  setIsDeleteModalOpen(true)
}

const handleClassUpdated = (updatedClass) => {
  setClasses(classes.map(c => c.id === updatedClass.id ? updatedClass : c))
}

const handleClassDeleted = (classId) => {
  setClasses(classes.filter(c => c.id !== classId))
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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-6 border border-gray-100 hover:border-indigo-200 transform hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={(e) => handleEdit(e, classItem)}
                  className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition"
                  title="Edit"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleDelete(e, classItem)}
                  className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition"
                  title="Delete"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                {classItem.courseCode}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 font-medium mb-3 line-clamp-2">
                {classItem.courseName}
              </p>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">
                  Batch: {classItem.batch}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">
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

      <EditClassModal
       isOpen={isEditModalOpen}
       onClose={() => setIsEditModalOpen(false)}
       onClassUpdated={handleClassUpdated}
       classData={selectedClass}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onClassDeleted={handleClassDeleted}
        classData={selectedClass}
      />
    </div>
  )
}