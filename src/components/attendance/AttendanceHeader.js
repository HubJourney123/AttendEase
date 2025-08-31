'use client'

import { FileText, Download, Calculator, Printer, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function AttendanceHeader({ 
  classData, 
  rollNumbers, 
  onExportCSV, 
  onPrint, 
  onBrowserPrint,
  onOpenCalculator
}) {
  const [copiedCode, setCopiedCode] = useState(false)

  const handleCopyClassCode = async () => {
    if (!classData.classCode) return
    
    try {
      await navigator.clipboard.writeText(classData.classCode)
      setCopiedCode(true)
      toast.success('Class code copied!')
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = classData.classCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedCode(true)
      toast.success('Class code copied!')
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Class Information */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {classData.courseName}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
              <span>
                <strong>Course Code:</strong> {classData.courseCode}
              </span>
              <span>
                <strong>Batch:</strong> {classData.batch}
              </span>
              <span>
                <strong>Students:</strong> {rollNumbers.length}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenCalculator}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              title="Combined Attendance Calculator"
            >
              <Calculator size={18} />
              <span className="hidden sm:inline">Calculator</span>
            </button>
            
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              title="Export to CSV"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              title="Generate PDF Report"
            >
              <FileText size={18} />
              <span className="hidden sm:inline">Generate PDF</span>
            </button>
            
            <button
              onClick={onBrowserPrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
              title="Print Preview"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Class Code Display */}
        {classData.classCode && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Class Code:</p>
              <p className="text-lg font-mono font-bold text-blue-800 dark:text-blue-200">
                {classData.classCode}
              </p>
            </div>
            <button
              onClick={handleCopyClassCode}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Copy class code"
            >
              {copiedCode ? <Check size={18} /> : <Copy size={18} />}
              <span className="hidden sm:inline">{copiedCode ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}