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
      className="w-full text-center text-xs p-0.5 border-0 bg-transparent cursor-pointer hover:bg-blue-50 font-medium"
      withPortal
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      readOnly={true}  // Prevents keyboard from appearing
      onFocus={(e) => e.target.blur()}  // Additional prevention for keyboard
      portalClassName="date-picker-portal"  // Custom class for styling
    />
  )
}