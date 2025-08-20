'use client'

import { memo } from 'react'

const AttendanceCell = memo(({ roll, dateIndex, hasDate, status, onToggle }) => {
  // Determine styling based on status
  const getStatusStyle = () => {
    if (!hasDate) return 'bg-gray-50 cursor-not-allowed'
    
    switch(status) {
      case 'P':
        return 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-800 dark:text-green-200'
      case 'A':
        return 'bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-800 dark:text-red-200'
      case 'L':
        return 'bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
      default:
        return 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-800 dark:text-green-200'
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