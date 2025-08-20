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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Create New Class</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Course Code *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="CSE 2113"
              value={formData.courseCode}
              onChange={(e) => setFormData({...formData, courseCode: e.target.value})}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Course Name *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Computer Programming"
              value={formData.courseName}
              onChange={(e) => setFormData({...formData, courseName: e.target.value})}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Batch *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2k23"
              value={formData.batch}
              onChange={(e) => setFormData({...formData, batch: e.target.value})}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Starting Roll *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2313001"
              value={formData.startingRoll}
              onChange={(e) => setFormData({...formData, startingRoll: e.target.value})}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Ending Roll *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2313030"
              value={formData.endingRoll}
              onChange={(e) => setFormData({...formData, endingRoll: e.target.value})}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Excluded Rolls (optional, comma separated)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2313005, 2313013"
              value={formData.excludedRolls}
              onChange={(e) => setFormData({...formData, excludedRolls: e.target.value})}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}