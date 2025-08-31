'use client'

import { useState } from 'react'
import { X, Calculator } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AttendanceCalculatorModal({ 
  isOpen, 
  onClose, 
  onCalculate,
  currentClassCode 
}) {
  const [formData, setFormData] = useState({
    partnerClassCode: '',
    department: 'কম্পিউটার বিজ্ঞান ও প্রকৌশল',
    totalClasses: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Bengali department options
  const departments = [
    'কম্পিউটার বিজ্ঞান ও প্রকৌশল',
    'ইলেকট্রিক্যাল ও ইলেকট্রনিক প্রকৌশল',
    'মেকানিক্যাল প্রকৌশল',
    'সিভিল প্রকৌশল',
    'ইন্ডাস্ট্রিয়াল প্রকৌশল ও ব্যবস্থাপনা',
    'কেমিক্যাল প্রকৌশল',
    'ম্যাটেরিয়ালস সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং',
    'বায়োমেডিক্যাল ইঞ্জিনিয়ারিং',
    'আর্কিটেকচার',
    'আরবান অ্যান্ড রিজিওনাল প্ল্যানিং',
    'বিল্ডিং ইঞ্জিনিয়ারিং অ্যান্ড কন্সট্রাকশন ম্যানেজমেন্ট',
    'ইলেকট্রনিক্স অ্যান্ড কমিউনিকেশন ইঞ্জিনিয়ারিং',
    'টেক্সটাইল ইঞ্জিনিয়ারিং',
    'লেদার ইঞ্জিনিয়ারিং',
    'ফুড টেকনোলজি অ্যান্ড রুরাল ইন্ডাস্ট্রিজ',
    'এনার্জি সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং',
    'ম্যাথ অ্যান্ড ফিজিক্যাল সায়েন্সেস',
    'কেমিস্ট্রি',
    'হিউম্যানিটিজ'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.partnerClassCode.trim()) {
        throw new Error('Partner class code is required')
      }
      if (!formData.totalClasses || parseInt(formData.totalClasses) < 1) {
        throw new Error('Total classes must be a valid number')
      }
      if (formData.partnerClassCode === currentClassCode) {
        throw new Error('Cannot combine with the same class')
      }

      await onCalculate({
        partnerClassCode: formData.partnerClassCode.toUpperCase(),
        department: formData.department,
        totalClasses: parseInt(formData.totalClasses)
      })

      onClose()
      toast.success('Generating combined attendance report...')
    } catch (error) {
      console.error('Calculator error:', error)
      toast.error(error.message || 'Failed to generate report')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calculator className="text-blue-600 dark:text-blue-400" size={24} />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Combined Attendance Calculator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Partner Class Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Partner Class Code *
            </label>
            <input
              type="text"
              required
              value={formData.partnerClassCode}
              onChange={(e) => setFormData(prev => ({ ...prev, partnerClassCode: e.target.value.toUpperCase() }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-center text-lg"
              placeholder="ABC123"
              maxLength={6}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the 6-character class code of the partner teacher&apos;s class
            </p>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department (Bangla) *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Total Classes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Number of Classes *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.totalClasses}
              onChange={(e) => setFormData(prev => ({ ...prev, totalClasses: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="e.g., 40"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Total classes conducted by both teachers combined
            </p>
          </div>

          {/* Current Class Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Current Class:</strong> {currentClassCode}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              This will be combined with the partner class above
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Calculator size={18} />
              {isSubmitting ? 'Calculating...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}