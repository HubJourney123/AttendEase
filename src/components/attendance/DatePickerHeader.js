'use client'

import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

export default function DatePickerHeader({ date, index, onDateChange }) {
  return (
    <DatePicker
      selected={date}
      onChange={(newDate) => onDateChange(newDate, index)}
      dateFormat="dd/MM"
      placeholderText="Date"
      className="w-full text-center text-xs p-1 border-0 bg-transparent cursor-pointer hover:bg-blue-50 font-medium"
      popperPlacement="bottom-start"
      withPortal  // This will show the calendar in a modal overlay
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"  // Makes month/year selection easier
    />
  )
}