'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { Trash2, Calendar } from 'lucide-react'

export default function DatePickerHeader({ date, index, onDateChange, onDeleteColumn }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const confirmDelete = (e) => {
    e.stopPropagation()
    onDeleteColumn(index)
    setShowDeleteConfirm(false)
  }

  const cancelDelete = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(false)
  }

  if (showDeleteConfirm) {
    return (
      <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-700">
        <div className="text-xs text-red-700 dark:text-red-300 mb-2 text-center">
          Delete this column?
        </div>
        <div className="flex gap-1 justify-center">
          <button
            onClick={confirmDelete}
            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
          >
            Yes
          </button>
          <button
            onClick={cancelDelete}
            className="px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
          >
            No
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group">
      <div className="flex items-center justify-between">
        <DatePicker
          selected={date}
          onChange={(newDate) => onDateChange(newDate, index)}
          dateFormat="dd/MM"
          placeholderText="Date"
          className="w-full text-center text-xs p-1 border-0 bg-transparent cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
          withPortal
          showYearDropdown
          showMonthDropdown
        />
        
        {date && (
          <button
            onClick={handleDelete}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
            title="Delete this column"
          >
            <Trash2 size={8} />
          </button>
        )}
      </div>
    </div>
  )
}