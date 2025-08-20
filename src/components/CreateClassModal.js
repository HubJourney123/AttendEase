'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function CreateClassModal({ isOpen, onClose, onClassCreated }) {
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    batch: '',
    startingRoll: '',
    endingRoll: '',
    excludedRolls: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      console.log('Submitting form data:', formData)
      
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok) {
        toast.success('Class created successfully!')
        onClassCreated(data)
        onClose()
        setFormData({
          courseCode: '',
          courseName: '',
          batch: '',
          startingRoll: '',
          endingRoll: '',
          excludedRolls: ''
        })
      } else {
        // Show detailed error message
        const errorMessage = data.details 
          ? `Failed to create class: ${data.details}`
          : data.error || 'Failed to create class'
        toast.error(errorMessage)
        console.error('Error response:', data)
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(`An error occurred: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          Create New Class
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Course Code *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition"
              placeholder="CSE 2113"
              value={formData.courseCode}
              onChange={(e) => setFormData({...formData, courseCode: e.target.value})}
            />
          </div>
          
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Course Name *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition"
              placeholder="Computer Programming"
              value={formData.courseName}
              onChange={(e) => setFormData({...formData, courseName: e.target.value})}
            />
          </div>
          
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Batch *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition"
              placeholder="2k23"
              value={formData.batch}
              onChange={(e) => setFormData({...formData, batch: e.target.value})}
            />
          </div>
          
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Starting Roll *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition"
              placeholder="2313001"
              value={formData.startingRoll}
              onChange={(e) => setFormData({...formData, startingRoll: e.target.value})}
            />
          </div>
          
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Ending Roll *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition"
              placeholder="2313030"
              value={formData.endingRoll}
              onChange={(e) => setFormData({...formData, endingRoll: e.target.value})}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Excluded Rolls (optional, comma separated)
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition"
              placeholder="2313005, 2313013"
              value={formData.excludedRolls}
              onChange={(e) => setFormData({...formData, excludedRolls: e.target.value})}
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-medium transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}