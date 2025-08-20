'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import AttendanceHeader from './attendance/AttendanceHeader'
import AttendanceTable from './attendance/AttendanceTable'
import AttendanceLegend from './attendance/AttendanceLegend'
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

  const rollNumbers = generateRollNumbers(classData)

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance?classId=${classData.id}`)
      const data = await response.json()
      
      const attendanceMap = {}
      const uniqueDates = new Set()
      
      data.forEach(record => {
        const dateObj = new Date(record.date)
        const dateStr = dateObj.toLocaleDateString()
        const key = `${record.rollNumber}-${dateStr}`
        attendanceMap[key] = record.status
        uniqueDates.add(dateStr)
      })
      
      const sortedDates = Array.from(uniqueDates).sort((a, b) => {
        return new Date(a) - new Date(b)
      })
      
      const newDates = [...dates]
      sortedDates.forEach((dateStr, index) => {
        if (index < 24) {
          const [month, day, year] = dateStr.split('/')
          newDates[index] = new Date(year, month - 1, day)
        }
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
    const dateStr = date ? date.toLocaleDateString() : null
    const existingIndex = dates.findIndex((d, i) => 
      d && i !== index && d.toLocaleDateString() === dateStr
    )
    
    if (existingIndex !== -1) {
      toast.error('Date already selected')
      return
    }

    const newDates = [...dates]
    newDates[index] = date
    setDates(newDates)
  }

  const toggleAttendance = async (rollNumber, dateIndex) => {
    const date = dates[dateIndex]
    if (!date) {
      toast.error('Please select a date first')
      return
    }

    const dateStr = date.toLocaleDateString()
    const key = `${rollNumber}-${dateStr}`
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
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classData.id,
          date: date.toISOString(),
          rollNumber,
          status: newStatus
        })
      })

      if (response.ok) {
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
      }
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const getAttendanceStatus = (rollNumber, dateIndex) => {
    const date = dates[dateIndex]
    if (!date) return ''
    
    const dateStr = date.toLocaleDateString()
    const key = `${rollNumber}-${dateStr}`
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
    // Count late as half present for percentage calculation
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

  const handleExportCSV = () => {
    exportToCSV(dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, getDetailedStats, calculateAttendanceMarks)
  }

  const handlePrintPDF = () => {
    generatePDF(dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, calculateAttendanceMarks)
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
      
      {/* Attendance Marks Info */}
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
    </div>
  )
}