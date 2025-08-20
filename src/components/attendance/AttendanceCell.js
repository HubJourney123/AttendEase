'use client'

import { memo } from 'react'

const AttendanceCell = memo(({ roll, dateIndex, hasDate, status, onToggle }) => {
  // Determine styling based on status
  const getStatusStyle = () => {
    if (!hasDate) return 'bg-gray-50 cursor-not-allowed'
    
    switch(status) {
      case 'P':
        return 'bg-green-100 hover:bg-green-200 text-green-800'
      case 'A':
        return 'bg-red-100 hover:bg-red-200 text-red-800'
      case 'L':
        return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
      default:
        return 'bg-green-100 hover:bg-green-200 text-green-800'
    }
  }
  
  return (
    <td
      className={`border border-gray-300 text-center cursor-pointer transition-all duration-200 ${getStatusStyle()}`}
      onClick={hasDate ? onToggle : undefined}
    >
      <div className="px-1 py-2 text-sm font-semibold">
        {hasDate ? status : ''}
      </div>
    </td>
  )
})

AttendanceCell.displayName = 'AttendanceCell'
export default AttendanceCell