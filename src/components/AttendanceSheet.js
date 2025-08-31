'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import AttendanceHeader from './attendance/AttendanceHeader'
import AttendanceTable from './attendance/AttendanceTable'
import AttendanceLegend from './attendance/AttendanceLegend'
import AttendanceCalculatorModal from './AttendanceCalculatorModal'
import { generateCombinedAttendancePDF } from '@/lib/combinedAttendanceUtils'
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
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false)

  const rollNumbers = generateRollNumbers(classData)

  // Helper function to format date consistently
  const formatDateKey = (date) => {
    if (!date) return null
    const d = new Date(date)
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

  // Helper function to delete attendance by date
  const deleteAttendanceByDate = async (date) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classData.id,
          date: date.toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to delete attendance')
      }
    } catch (error) {
      console.error('Error deleting attendance:', error)
      throw error
    }
  }



const handleCalculatorSubmit = async (calculatorData) => {
  try {
    toast.loading('Fetching partner class data...')

    // Fetch partner class data
    const response = await fetch(`/api/classes/by-code?code=${calculatorData.partnerClassCode}`)
    if (!response.ok) {
      throw new Error('Partner class not found')
    }
    const partnerClass = await response.json()

    // Fetch partner class attendance
    const attendanceResponse = await fetch(`/api/attendance?classId=${partnerClass.id}`)
    const partnerAttendance = await attendanceResponse.json()

    // Get current class attendance data
    const currentAttendance = Object.entries(attendanceData)

    // Create combined attendance map
    const combinedAttendanceMap = new Map()

    // Initialize all roll numbers with zero absents
    rollNumbers.forEach(rollNumber => {
      combinedAttendanceMap.set(rollNumber, {
        rollNumber,
        name: '',
        absents: 0
      })
    })

    // Count absents from current class
    currentAttendance.forEach(([key, status]) => {
      const [rollNumber] = key.split('-')
      if (status === 'A' && combinedAttendanceMap.has(rollNumber)) {
        combinedAttendanceMap.get(rollNumber).absents += 1
      }
    })

    // Count absents from partner class
    partnerAttendance.forEach(record => {
      if (record.status === 'A') {
        const rollNumber = record.rollNumber
        if (combinedAttendanceMap.has(rollNumber)) {
          combinedAttendanceMap.get(rollNumber).absents += 1
        } else {
          // Add new roll number if not in current class
          combinedAttendanceMap.set(rollNumber, {
            rollNumber,
            name: '',
            absents: 1
          })
        }
      }
    })

    // Convert to sorted array
    const combinedData = Array.from(combinedAttendanceMap.values())
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
      .map(student => ({
        rollNumber: student.rollNumber,
        name: student.name,
        totalAbsent: student.absents
      }))

    toast.dismiss()
    
    // Generate PDF with combined data
    generateCombinedAttendancePDF(
      combinedData, 
      {
        courseCode: classData.courseCode,
        courseName: classData.courseName,
        batch: classData.batch
      }, 
      calculatorData.department, 
      calculatorData.totalClasses
    )

  } catch (error) {
    toast.dismiss()
    console.error('Calculator error:', error)
    toast.error(error.message || 'Failed to generate combined report')
  }
}


  // Add new date (for empty columns)
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

    // Update local state immediately
    const newDates = [...dates]
    newDates[index] = date
    setDates(newDates)

    try {
      // Save all students as present for this new date
      const savePromises = rollNumbers.map(rollNumber => 
        saveAttendance(rollNumber, date, 'P')
      )
      await Promise.all(savePromises)

      // Update local attendance state
      const newDateKey = formatDateKey(date)
      const updatedAttendance = { ...attendanceData }
      rollNumbers.forEach(roll => {
        updatedAttendance[`${roll}-${newDateKey}`] = 'P'
      })
      setAttendanceData(updatedAttendance)

      toast.success('Date added with all present', { duration: 1000 })
    } catch (error) {
      console.error('Error adding date:', error)
      toast.error('Failed to add date')
      // Revert local state on error
      const revertDates = [...dates]
      revertDates[index] = null
      setDates(revertDates)
    }
  }

  // Edit existing date (from modal) - FIXED VERSION
  const handleEditDate = async (newDate, index) => {
    if (!newDate) return

    const newDateKey = formatDateKey(newDate)
    const oldDate = dates[index]
    
    if (!oldDate) {
      toast.error('No existing date to edit')
      return
    }

    const oldDateKey = formatDateKey(oldDate)

    // Check if this date is already selected in another column
    const existingIndex = dates.findIndex((d, i) => 
      d && i !== index && formatDateKey(d) === newDateKey
    )

    if (existingIndex !== -1) {
      toast.error('Date already selected')
      return
    }

    // Update local state FIRST for immediate UI update
    const newDates = [...dates]
    newDates[index] = newDate
    setDates(newDates)

    // Update attendance data keys immediately
    const updatedAttendance = { ...attendanceData }
    
    // Transfer all attendance data from old date key to new date key
    rollNumbers.forEach(rollNumber => {
      const oldKey = `${rollNumber}-${oldDateKey}`
      const newKey = `${rollNumber}-${newDateKey}`
      const existingStatus = attendanceData[oldKey] || 'P'
      
      updatedAttendance[newKey] = existingStatus
      delete updatedAttendance[oldKey] // Remove old date data
    })
    
    setAttendanceData(updatedAttendance)

    try {
      // Delete old date from database first
      await deleteAttendanceByDate(oldDate)

      // Save all attendance records with new date
      const savePromises = rollNumbers.map(rollNumber => {
        const oldKey = `${rollNumber}-${oldDateKey}`
        const existingStatus = attendanceData[oldKey] || 'P'
        return saveAttendance(rollNumber, newDate, existingStatus)
      })
      
      await Promise.all(savePromises)

      toast.success('Date updated successfully')
    } catch (error) {
      console.error('Error updating date:', error)
      toast.error('Failed to update date')
      
      // Revert changes on error
      const revertDates = [...dates]
      revertDates[index] = oldDate
      setDates(revertDates)
      
      // Revert attendance data
      const revertAttendance = { ...attendanceData }
      rollNumbers.forEach(rollNumber => {
        const oldKey = `${rollNumber}-${oldDateKey}`
        const newKey = `${rollNumber}-${newDateKey}`
        const status = updatedAttendance[newKey]
        
        revertAttendance[oldKey] = status
        delete revertAttendance[newKey]
      })
      setAttendanceData(revertAttendance)
    }
  }

  // Delete column (from modal)
  const handleDeleteColumn = async (index) => {
    const dateToDelete = dates[index]
    if (!dateToDelete) {
      toast.error('No date to delete')
      return
    }

    try {
      // Delete from database
      await deleteAttendanceByDate(dateToDelete)

      // Update local state
      const newDates = [...dates]
      newDates[index] = null
      setDates(newDates)

      // Remove attendance data for this date
      const dateKey = formatDateKey(dateToDelete)
      const updatedAttendance = { ...attendanceData }
      
      rollNumbers.forEach(roll => {
        delete updatedAttendance[`${roll}-${dateKey}`]
      })
      setAttendanceData(updatedAttendance)

      toast.success('Column deleted successfully')
    } catch (error) {
      console.error('Error deleting column:', error)
      toast.error('Failed to delete column')
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
      throw error
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
    generatePDF(
      dates, 
      rollNumbers, 
      getAttendanceStatus, 
      calculatePercentage, 
      classData, 
      info,
      getDetailedStats
    )
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
        onOpenCalculator={() => setIsCalculatorModalOpen(true)} // Add this line
      />

      <div ref={tableRef}>
        <AttendanceTable
          dates={dates}
          rollNumbers={rollNumbers}
          attendanceData={attendanceData}
          onDateChange={handleDateChange}
          onEditDate={handleEditDate}
          onDeleteColumn={handleDeleteColumn}
          onToggleAttendance={toggleAttendance}
          getAttendanceStatus={getAttendanceStatus}
          calculatePercentage={calculatePercentage}
          calculateAttendanceMarks={calculateAttendanceMarks}
          getDetailedStats={getDetailedStats}
        />
      </div>

      <AttendanceLegend />

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">Attendance Marks Criteria:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-blue-800 dark:text-blue-200">
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

      {/* Add the modal to your JSX at the bottom: */}
      <AttendanceCalculatorModal
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
        onCalculate={handleCalculatorSubmit}
        currentClassCode={classData.classCode}
      />


    </div>
  )
}