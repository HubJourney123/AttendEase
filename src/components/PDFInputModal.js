'use client'

import { useState } from 'react'

export default function PDFInputModal({ isOpen, onClose, onGenerate, classData }) {
  const [formData, setFormData] = useState({
    department: 'Department of Computer Science and Engineering',
    year: '3rd Year',
    term: '1st Term'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitting...', formData)
    
    try {
      onGenerate(formData)
      console.log('PDF generation triggered')
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      alert('Failed to generate PDF: ' + error.message)
    }
  }

  const handleCancel = () => {
    console.log('Cancel clicked')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Generate PDF Report</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Department Name *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              placeholder="e.g., Department of Computer Science"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                Year *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                placeholder="e.g., 3rd Year"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                Term *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={formData.term}
                onChange={(e) => setFormData({...formData, term: e.target.value})}
                placeholder="e.g., 1st Term"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Generate PDF
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}