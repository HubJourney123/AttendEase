'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function DeleteConfirmModal({ isOpen, onClose, onClassDeleted, classData }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/classes/${classData.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Class deleted successfully!')
        onClassDeleted(classData.id)
        onClose()
      } else {
        toast.error('Failed to delete class')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !classData) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Confirm Delete</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          Are you sure you want to delete this class?
        </p>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
          <p className="font-semibold dark:text-white">{classData.courseCode} - {classData.courseName}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Batch: {classData.batch}</p>
        </div>
        <p className="text-red-600 text-sm mb-6">
          ⚠️ This action cannot be undone. All attendance records for this class will be permanently deleted.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Class'}
          </button>
        </div>
      </div>
    </div>
  )
}