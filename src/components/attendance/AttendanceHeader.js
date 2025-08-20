'use client'

export default function AttendanceHeader({ classData, rollNumbers, onExportCSV, onPrint, onBrowserPrint }) {
  return (
    <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">{classData.courseCode} - {classData.courseName}</h2>
        <p className="text-sm sm:text-base text-gray-600">Batch: {classData.batch}</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Total Students: {rollNumbers.length} | Tap cells to toggle P/A
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onExportCSV}
          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition"
        >
          CSV
        </button>
        <button
          onClick={onPrint}
          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition"
        >
          PDF
        </button>
        <button
          onClick={onBrowserPrint}
          className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition"
        >
          Print
        </button>
      </div>
    </div>
  )
}