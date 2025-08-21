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
      popperPlacement="bottom-start"  // Changed from "bottom"
      popperModifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 5],  // Adjust vertical offset
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundariesElement: 'viewport',
            padding: 10,
          },
        },
        {
          name: 'flip',
          enabled: true,  // Allow flipping to top if no space below
          options: {
            fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
          },
        },
      ]}
      showYearDropdown
      showMonthDropdown
      portalId="datepicker-portal"  // Use portal to render outside table
    />
  )
}