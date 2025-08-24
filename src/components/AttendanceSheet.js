'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import AttendanceHeader from './attendance/AttendanceHeader'
import AttendanceTable from './attendance/AttendanceTable'
import AttendanceLegend from './attendance/AttendanceLegend'
import PDFInputModal from './PDFInputModal'
import { 
  generateRollNumbers, 
  exportToCSV, 
  generatePDF, 
  openPrintDialog,
  calculateAttendanceMarks 
} from '@/lib/attendanceUtils'


export default function AttendanceSheet({ classData }) {
  const [dates, setDates] = useState(Array(24).fill(null))
  const [attendanceData, setAttendanceData] = useState({})
  const [loading, setLoading] = useState(true)
  const tableRef = useRef(null)
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false)
  const [pdfInfo, setPDFInfo] = useState(null)

  const rollNumbers = generateRollNumbers(classData)

  // Helper function to format date consistently
  const formatDateKey = (date) => {
    if (!date) return null
    const d = new Date(date)
    // Use ISO date format (YYYY-MM-DD) for consistency
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance?classId=${classData.id}`)
      const data = await response.json()
      
      const attendanceMap = {}
      const dateColumnMap = new Map()
      
      // Group attendance by date
      data.forEach(record => {
        const dateObj = new Date(record.date)
        const dateKey = formatDateKey(dateObj)
        const key = `${record.rollNumber}-${dateKey}`
        attendanceMap[key] = record.status
        
        // Track which dates have data
        if (!dateColumnMap.has(dateKey)) {
          dateColumnMap.set(dateKey, dateObj)
        }
      })
      
      // Sort dates and populate the dates array
      const sortedDates = Array.from(dateColumnMap.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, 24) // Maximum 24 dates
      
      const newDates = Array(24).fill(null)
      sortedDates.forEach((entry, index) => {
        newDates[index] = entry[1]
      })
      
      setDates(newDates)
      setAttendanceData(attendanceMap)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
      toast.error('Failed to load attendance data')
      setLoading(false)
    }
  }

  const handleDateChange = async (date, index) => {
    if (!date) return
    
    const dateKey = formatDateKey(date)
    
    // Check if this date is already selected in another column
    const existingIndex = dates.findIndex((d, i) => 
      d && i !== index && formatDateKey(d) === dateKey
    )
    
    if (existingIndex !== -1) {
      toast.error('Date already selected')
      return
    }

    const newDates = [...dates]
    const oldDate = dates[index]
    newDates[index] = date
    setDates(newDates)

    // If there was no old date, save default attendance (all present)
    if (!oldDate) {
      // Save all students as present for this new date
      for (const rollNumber of rollNumbers) {
        await saveAttendance(rollNumber, date, 'P')
      }
      
      // Update local state
      const newDateKey = formatDateKey(date)
      const updatedAttendance = { ...attendanceData }
      rollNumbers.forEach(roll => {
        updatedAttendance[`${roll}-${newDateKey}`] = 'P'
      })
      setAttendanceData(updatedAttendance)
      
      toast.success('Date added with all present', { duration: 1000 })
    }
  }

  const saveAttendance = async (rollNumber, date, status) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classData.id,
          date: date.toISOString(),
          rollNumber,
          status
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save attendance')
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
    }
  }

  const toggleAttendance = async (rollNumber, dateIndex) => {
    const date = dates[dateIndex]
    if (!date) {
      toast.error('Please select a date first')
      return
    }

    const dateKey = formatDateKey(date)
    const key = `${rollNumber}-${dateKey}`
    const currentStatus = attendanceData[key] || 'P'
    
    // Cycle through P -> A -> L -> P
    let newStatus
    switch(currentStatus) {
      case 'P':
        newStatus = 'A'
        break
      case 'A':
        newStatus = 'L'
        break
      case 'L':
        newStatus = 'P'
        break
      default:
        newStatus = 'P'
    }

    try {
      await saveAttendance(rollNumber, date, newStatus)
      
      setAttendanceData(prev => ({
        ...prev,
        [key]: newStatus
      }))
      
      const statusMessage = {
        'P': 'Present',
        'A': 'Absent',
        'L': 'Late'
      }
      
      toast.success(`Marked ${statusMessage[newStatus]}`, {
        duration: 500,
        position: 'bottom-center',
        icon: newStatus === 'P' ? '✅' : newStatus === 'A' ? '❌' : '⏰'
      })
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const getAttendanceStatus = (rollNumber, dateIndex) => {
    const date = dates[dateIndex]
    if (!date) return ''
    
    const dateKey = formatDateKey(date)
    const key = `${rollNumber}-${dateKey}`
    return attendanceData[key] || 'P'
  }

  const calculatePercentage = (rollNumber) => {
    let present = 0
    let late = 0
    let total = 0
    
    dates.forEach((date, index) => {
      if (date) {
        total++
        const status = getAttendanceStatus(rollNumber, index)
        if (status === 'P') {
          present++
        } else if (status === 'L') {
          late++
        }
      }
    })
    
    if (total === 0) return '0.0'
    const effectivePresent = present + (late * 0.5)
    return ((effectivePresent / total) * 100).toFixed(1)
  }

  const getDetailedStats = (rollNumber) => {
    let present = 0
    let absent = 0
    let late = 0
    
    dates.forEach((date, index) => {
      if (date) {
        const status = getAttendanceStatus(rollNumber, index)
        if (status === 'P') present++
        else if (status === 'A') absent++
        else if (status === 'L') late++
      }
    })
    
    return { present, absent, late }
  }

  const handlePrintPDF = () => {
  setIsPDFModalOpen(true)
}

const handleGeneratePDF = (info) => {
  setPDFInfo(info)
  generatePDF(dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, info)
  setIsPDFModalOpen(false)
  toast.success('PDF generated successfully!')
}

  const handleExportCSV = () => {
    exportToCSV(dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, getDetailedStats, calculateAttendanceMarks)
  }

  

  const handleBrowserPrint = () => {
    openPrintDialog(dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, calculateAttendanceMarks)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-4">
      <AttendanceHeader
        classData={classData}
        rollNumbers={rollNumbers}
        onExportCSV={handleExportCSV}
        onPrint={handlePrintPDF}
        onBrowserPrint={handleBrowserPrint}
      />
      
      <div ref={tableRef}>
        <AttendanceTable
          dates={dates}
          rollNumbers={rollNumbers}
          attendanceData={attendanceData}
          onDateChange={handleDateChange}
          onToggleAttendance={toggleAttendance}
          getAttendanceStatus={getAttendanceStatus}
          calculatePercentage={calculatePercentage}
          calculateAttendanceMarks={calculateAttendanceMarks}
        />
      </div>
      
      <AttendanceLegend />
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-sm text-blue-900 mb-2">Attendance Marks Criteria:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-blue-800">
          <div>≥90%: 100 marks</div>
          <div>85-89%: 90 marks</div>
          <div>80-84%: 80 marks</div>
          <div>75-79%: 70 marks</div>
          <div>70-74%: 60 marks</div>
          <div>65-69%: 50 marks</div>
          <div>60-64%: 40 marks</div>
          <div>&lt;60%: 0 marks</div>
        </div>
      </div>

      <PDFInputModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        onGenerate={handleGeneratePDF}
        classData={classData}
      />
    </div>
  )
}