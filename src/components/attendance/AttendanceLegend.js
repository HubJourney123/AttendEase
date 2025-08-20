'use client'

export default function AttendanceLegend() {
  return (
    <div className="mt-4 flex flex-col sm:flex-row justify-between text-xs sm:text-sm text-gray-600">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-300 mr-1"></span>
          <span>Present (P)</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 bg-red-100 border border-red-300 mr-1"></span>
          <span>Absent (A)</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 bg-yellow-100 border border-yellow-300 mr-1"></span>
          <span>Late (L)</span>
        </div>
      </div>
      <div className="mt-2 sm:mt-0">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  )
}