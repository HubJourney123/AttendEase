'use client'

import { memo } from 'react'
import DatePickerHeader from './DatePickerHeader'
import AttendanceCell from './AttendanceCell'

const AttendanceTable = memo(({
  dates = [],
  rollNumbers = [],
  attendanceData = {},
  onDateChange,
  onDeleteColumn,
  onToggleAttendance,
  getAttendanceStatus,
  calculatePercentage,
  calculateAttendanceMarks,
  getDetailedStats // Add this prop to get absent count
}) => {
  // Handle empty rollNumbers case
  if (!rollNumbers.length) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-4">
          No students found for this class
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          Please ensure the class has valid roll numbers configured
        </p>
      </div>
    )
  }

  // Ensure dates is an array with at least 24 elements
  const safeDates = Array.isArray(dates) && dates.length >= 24 ? dates : Array(24).fill(null)

  return (
    <div className="relative overflow-hidden border rounded-2xl shadow-sm bg-white dark:bg-gray-800 dark:border-gray-600">
      <div className="overflow-x-auto">
        <table className="relative w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              {/* Fixed Roll Column Header */}
              <th className="sticky left-0 z-20 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border-r-2 border-gray-300 dark:border-gray-600">
                <div className="px-4 py-3 text-sm font-semibold text-left min-w-[80px]">
                  Roll
                </div>
              </th>

              {/* Scrollable Date Headers with Delete Functionality */}
              {safeDates.map((date, index) => (
                <th key={index} className="border border-gray-300 dark:border-gray-600 px-1 py-1 dark:bg-gray-700 dark:text-gray-200 min-w-[65px] relative">
                  <DatePickerHeader
                    date={date}
                    index={index}
                    onDateChange={onDateChange}
                    onDeleteColumn={onDeleteColumn}
                  />
                </th>
              ))}

              {/* Absent Column */}
              <th className="border border-gray-300 dark:border-gray-600 px-2 py-3 font-semibold bg-gray-100 dark:bg-gray-700 dark:text-gray-200 min-w-[60px]">
                <div className="text-sm">Absent</div>
              </th>

              {/* Percentage Column */}
              <th className="border border-gray-300 dark:border-gray-600 px-2 py-3 font-semibold bg-gray-100 dark:bg-gray-700 dark:text-gray-200 min-w-[50px]">
                <div className="text-sm">%</div>
              </th>

              {/* Marks Column */}
              <th className="border border-gray-300 dark:border-gray-600 px-2 py-3 font-semibold bg-gray-100 dark:bg-gray-700 dark:text-gray-200 min-w-[60px]">
                <div className="text-sm">Marks</div>
              </th>
            </tr>
          </thead>

          <tbody>
            {rollNumbers.map((roll) => {
              const percentage = parseFloat(calculatePercentage(roll)) || 0
              const marks = calculateAttendanceMarks(percentage) || 0
              const stats = getDetailedStats(roll) // Get detailed stats including absent count

              return (
                <tr key={roll} className="hover:bg-gray-50 dark:hover:bg-gray-600 group">
                  {/* Fixed Roll Column */}
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 dark:text-gray-200 border-r-2 border-gray-300 dark:border-gray-600 group-hover:bg-gray-50 dark:group-hover:bg-gray-600">
                    <div className="px-4 py-2 font-medium text-sm">
                      {roll}
                    </div>
                  </td>

                  {/* Scrollable Attendance Cells */}
                  {safeDates.map((_, index) => (
                    <AttendanceCell
                      key={index}
                      roll={roll}
                      dateIndex={index}
                      hasDate={safeDates[index] !== null}
                      status={getAttendanceStatus(roll, index) || null}
                      onToggle={() => onToggleAttendance(roll, index)}
                    />
                  ))}

                  {/* Absent Count Cell */}
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 font-bold text-center bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
                    {stats.absent}
                  </td>

                  {/* Percentage Cell */}
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 font-bold text-center bg-gray-50 dark:bg-gray-700 dark:text-gray-200 text-sm">
                    {percentage.toFixed(1)}%
                  </td>

                  {/* Marks Cell with color coding */}
                  <td className={`border border-gray-300 dark:border-gray-600 px-2 py-2 font-bold text-center text-sm
                    ${marks >= 90 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      marks >= 70 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      marks >= 50 ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                      'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                    {marks}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
})

AttendanceTable.displayName = 'AttendanceTable'
export default AttendanceTable