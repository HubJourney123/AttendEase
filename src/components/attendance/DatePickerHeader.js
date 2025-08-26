'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import ColumnManagementModal from './ColumnManagementModal'

export default function DatePickerHeader({ 
  date, 
  index, 
  onDateChange, 
  onEditDate,
  onDeleteColumn 
}) {
  const [showModal, setShowModal] = useState(false)

  const handleDateClick = (e) => {
    // If there's already a date, show management modal
    if (date) {
      e.preventDefault()
      setShowModal(true)
    }
  }

  const handleDateChange = (newDate) => {
    // Only allow direct date change if no date exists (new column)
    if (!date) {
      onDateChange(newDate, index)
    }
  }

  return (
    <>
      <div 
        className="relative cursor-pointer"
        onClick={handleDateClick}
      >
        {date ? (
          // If date exists, show it as clickable text
          <div className="w-full text-center text-xs p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded font-medium text-gray-800 dark:text-gray-200 min-h-[32px] flex items-center justify-center border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700 transition-all">
            {date.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: '2-digit' 
            })}
          </div>
        ) : (
          // If no date, show date picker
          <DatePicker
            selected={date}
            onChange={handleDateChange}
            dateFormat="dd/MM"
            placeholderText="+ Date"
            className="w-full text-center text-xs p-2 border-0 bg-transparent cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium text-gray-600 dark:text-gray-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            withPortal
            showYearDropdown
            showMonthDropdown
          />
        )}
      </div>

      <ColumnManagementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentDate={date}
        onEditDate={onEditDate}
        onDeleteColumn={onDeleteColumn}
        columnIndex={index}
      />
    </>
  )
}