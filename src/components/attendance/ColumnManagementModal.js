'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { Calendar, Edit2, Trash2, X } from 'lucide-react'

export default function ColumnManagementModal({ 
  isOpen, 
  onClose, 
  currentDate, 
  onEditDate, 
  onDeleteColumn,
  columnIndex 
}) {
  const [selectedDate, setSelectedDate] = useState(currentDate)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isOpen) return null

  const handleEditDate = () => {
    if (selectedDate && selectedDate !== currentDate) {
      onEditDate(selectedDate, columnIndex)
      onClose()
    }
  }

  const handleDelete = () => {
    onDeleteColumn(columnIndex)
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Manage Column
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Current Date Display */}
        <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Current Date:</p>
          <p className="font-medium text-gray-800 dark:text-gray-100">
            {currentDate ? currentDate.toLocaleDateString() : 'No date selected'}
          </p>
        </div>

        {!showDeleteConfirm ? (
          <>
            {/* Edit Date Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Change Date:
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                <DatePicker
                  selected={selectedDate}
                  onChange={setSelectedDate}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select new date"
                  className="w-full text-center py-2 bg-transparent text-gray-800 dark:text-gray-100"
                  calendarClassName="!z-50"
                  popperClassName="!z-50"
                  showYearDropdown
                  showMonthDropdown
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Edit Date Button */}
              <button
                onClick={handleEditDate}
                disabled={!selectedDate || selectedDate === currentDate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
              >
                <Edit2 size={18} />
                Update Date
              </button>

              {/* Delete Column Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
              >
                <Trash2 size={18} />
                Delete Column
              </button>

              {/* Cancel Button */}
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          /* Delete Confirmation */
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Delete Column?
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This will permanently delete the column and all attendance data for{' '}
              <span className="font-medium">
                {currentDate?.toLocaleDateString()}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}