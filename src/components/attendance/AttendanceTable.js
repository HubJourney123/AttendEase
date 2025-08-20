'use client'

import { memo } from 'react'
import DatePickerHeader from './DatePickerHeader'
import AttendanceCell from './AttendanceCell'

const AttendanceTable = memo(({ 
  dates, 
  rollNumbers, 
  attendanceData,
  onDateChange,
  onToggleAttendance,
  getAttendanceStatus,
  calculatePercentage,
  calculateAttendanceMarks 
}) => {
  return (
    <div className="relative overflow-hidden border rounded-lg shadow-sm bg-white">
      <div className="overflow-x-auto">
        <table className="relative w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {/* Fixed Roll Column Header */}
              <th className="sticky left-0 z-20 bg-gray-100 border-r-2 border-gray-300">
                <div className="px-3 py-2 text-sm font-semibold text-left min-w-[80px]">
                  Roll
                </div>
              </th>
              
              {/* Scrollable Date Headers */}
              {[...Array(24)].map((_, index) => (
                <th key={index} className="border border-gray-300 px-1 py-1 min-w-[65px]">
                  <DatePickerHeader
                    date={dates[index]}
                    index={index}
                    onDateChange={onDateChange}
                  />
                </th>
              ))}
              
              {/* Percentage Column */}
              <th className="border border-gray-300 px-2 py-2 font-semibold bg-gray-100 min-w-[50px]">
                <div className="text-sm">%</div>
              </th>
              
              {/* Marks Column */}
              <th className="border border-gray-300 px-2 py-2 font-semibold bg-gray-100 min-w-[60px]">
                <div className="text-sm">Marks</div>
              </th>
            </tr>
          </thead>
          
          <tbody>
            {rollNumbers.map((roll) => {
              const percentage = parseFloat(calculatePercentage(roll))
              const marks = calculateAttendanceMarks(percentage)
              
              return (
                <tr key={roll} className="hover:bg-gray-50 group">
                  {/* Fixed Roll Column */}
                  <td className="sticky left-0 z-10 bg-white border-r-2 border-gray-300 group-hover:bg-gray-50">
                    <div className="px-3 py-2 font-medium text-sm">
                      {roll}
                    </div>
                  </td>
                  
                  {/* Scrollable Attendance Cells */}
                  {[...Array(24)].map((_, index) => (
                    <AttendanceCell
                      key={index}
                      roll={roll}
                      dateIndex={index}
                      hasDate={dates[index] !== null}
                      status={getAttendanceStatus(roll, index)}
                      onToggle={() => onToggleAttendance(roll, index)}
                    />
                  ))}
                  
                  {/* Percentage Cell */}
                  <td className="border border-gray-300 px-2 py-2 font-bold text-center bg-gray-50 text-sm">
                    {calculatePercentage(roll)}%
                  </td>
                  
                  {/* Marks Cell with color coding */}
                  <td className={`border border-gray-300 px-2 py-2 font-bold text-center text-sm
                    ${marks >= 90 ? 'bg-green-100 text-green-800' : 
                      marks >= 70 ? 'bg-yellow-100 text-yellow-800' : 
                      marks >= 50 ? 'bg-orange-100 text-orange-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {marks}%
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