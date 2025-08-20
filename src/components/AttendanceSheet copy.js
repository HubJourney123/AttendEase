'use client'

import { useState, useEffect, useRef } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function AttendanceSheet({ classData }) {
  const [dates, setDates] = useState(Array(24).fill(null))
  const [attendanceData, setAttendanceData] = useState({})
  const [loading, setLoading] = useState(true)
  const tableRef = useRef(null)

  // Generate roll numbers
  const generateRollNumbers = () => {
    const rolls = []
    const start = parseInt(classData.startingRoll)
    const end = parseInt(classData.endingRoll)
    const excluded = classData.excludedRolls 
      ? classData.excludedRolls.split(',').map(r => r.trim())
      : []
    
    for (let i = start; i <= end; i++) {
      const roll = i.toString()
      if (!excluded.includes(roll)) {
        rolls.push(roll)
      }
    }
    return rolls
  }

  const rollNumbers = generateRollNumbers()

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
      toast.error('This date is already selected in another column')
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
    const newStatus = currentStatus === 'P' ? 'A' : 'P'

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
        toast.success(`Marked ${newStatus === 'P' ? 'Present' : 'Absent'}`, {
          duration: 1000,
          position: 'bottom-right'
        })
      }
    } catch (error) {
      toast.error('Failed to update attendance')
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
    let total = 0
    
    dates.forEach((date, index) => {
      if (date) {
        total++
        if (getAttendanceStatus(rollNumber, index) === 'P') {
          present++
        }
      }
    })
    
    if (total === 0) return '0.0'
    return ((present / total) * 100).toFixed(1)
  }

  // Fixed PDF generation function
  const handlePrint = () => {
    toast.loading('Generating PDF...', { id: 'pdf-generation' })

    // Create a hidden div with simple styles for PDF generation
    const printDiv = document.createElement('div')
    printDiv.style.position = 'absolute'
    printDiv.style.left = '-9999px'
    printDiv.style.backgroundColor = 'white'
    printDiv.style.padding = '20px'
    printDiv.style.fontFamily = 'Arial, sans-serif'
    
    // Build HTML table with inline styles (no complex CSS)
    let tableHTML = `
      <div style="background: white; padding: 20px;">
        <h2 style="color: black; font-size: 20px; margin-bottom: 10px;">
          ${classData.courseCode} - ${classData.courseName}
        </h2>
        <p style="color: #666; margin-bottom: 20px;">Batch: ${classData.batch}</p>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; color: black;">Roll</th>
    `
    
    // Add date headers
    dates.forEach((date, index) => {
      if (date) {
        tableHTML += `<th style="border: 1px solid #ddd; padding: 8px; text-align: center; color: black; min-width: 60px;">
          ${date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
        </th>`
      }
    })
    
    tableHTML += `<th style="border: 1px solid #ddd; padding: 8px; text-align: center; color: black;">%</th></tr></thead><tbody>`
    
    // Add data rows
    rollNumbers.forEach(roll => {
      tableHTML += `<tr><td style="border: 1px solid #ddd; padding: 8px; color: black;">${roll}</td>`
      
      dates.forEach((date, index) => {
        if (date) {
          const status = getAttendanceStatus(roll, index)
          const bgColor = status === 'P' ? '#d4edda' : '#f8d7da'
          const textColor = status === 'P' ? '#155724' : '#721c24'
          tableHTML += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center; background: ${bgColor}; color: ${textColor}; font-weight: bold;">${status}</td>`
        }
      })
      
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: black; font-weight: bold;">${calculatePercentage(roll)}%</td></tr>`
    })
    
    tableHTML += '</tbody></table></div>'
    
    printDiv.innerHTML = tableHTML
    document.body.appendChild(printDiv)

    // Use html2canvas on the simple HTML
    html2canvas(printDiv, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      // Remove the temporary div
      document.body.removeChild(printDiv)
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('l', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      
      const scaledWidth = imgWidth * ratio
      const scaledHeight = imgHeight * ratio
      const x = (pdfWidth - scaledWidth) / 2
      const y = 10
      
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight)
      pdf.save(`attendance_${classData.courseCode}_${classData.batch}_${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast.success('PDF generated successfully!', { id: 'pdf-generation' })
    }).catch(error => {
      document.body.removeChild(printDiv)
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF', { id: 'pdf-generation' })
    })
  }

  // Alternative: Use browser print dialog
  const handleBrowserPrint = () => {
    const printWindow = window.open('', '_blank')
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Sheet - ${classData.courseCode}</title>
        <style>
          @media print {
            @page { size: landscape; margin: 10mm; }
          }
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .present { background-color: #d4edda !important; color: #155724; }
          .absent { background-color: #f8d7da !important; color: #721c24; }
          h2 { color: #333; }
          .info { color: #666; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h2>${classData.courseCode} - ${classData.courseName}</h2>
        <div class="info">Batch: ${classData.batch} | Date: ${new Date().toLocaleDateString()}</div>
        <table>
          <thead>
            <tr>
              <th>Roll Number</th>`
    
    dates.forEach(date => {
      if (date) {
        html += `<th>${date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</th>`
      }
    })
    
    html += `<th>Attendance %</th></tr></thead><tbody>`
    
    rollNumbers.forEach(roll => {
      html += `<tr><td>${roll}</td>`
      dates.forEach((date, index) => {
        if (date) {
          const status = getAttendanceStatus(roll, index)
          html += `<td class="${status === 'P' ? 'present' : 'absent'}">${status}</td>`
        }
      })
      html += `<td><strong>${calculatePercentage(roll)}%</strong></td></tr>`
    })
    
    html += `</tbody></table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>`
    
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const exportToCSV = () => {
    try {
      let csv = 'Roll Number'
      dates.forEach((date) => {
        if (date) {
          csv += `,${date.toLocaleDateString()}`
        }
      })
      csv += ',Attendance %\n'
      
      rollNumbers.forEach(roll => {
        csv += roll
        dates.forEach((date, index) => {
          if (date) {
            csv += `,${getAttendanceStatus(roll, index)}`
          }
        })
        csv += `,${calculatePercentage(roll)}%\n`
      })
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_${classData.courseCode}_${classData.batch}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('CSV exported successfully!')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to export CSV')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{classData.courseCode} - {classData.courseName}</h2>
          <p className="text-gray-600">Batch: {classData.batch}</p>
          <p className="text-sm text-gray-500 mt-1">
            Total Students: {rollNumbers.length} | Click on cells to toggle Present/Absent
          </p>
        </div>
        <div className="space-x-2">
          <button
            onClick={exportToCSV}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
          >
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
          >
            Download PDF
          </button>
          <button
            onClick={handleBrowserPrint}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
          >
            Print
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
        <div ref={tableRef}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Roll</th>
                {[...Array(24)].map((_, index) => (
                  <th key={index} className="border border-gray-300 px-2 py-1 min-w-[100px]">
                    <DatePicker
                      selected={dates[index]}
                      onChange={(date) => handleDateChange(date, index)}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select Date"
                      className="w-full text-center text-sm p-1 border-0 bg-transparent cursor-pointer hover:bg-blue-50"
                      popperPlacement="bottom"
                      showYearDropdown
                      showMonthDropdown
                    />
                  </th>
                ))}
                <th className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">%</th>
              </tr>
            </thead>
            <tbody>
              {rollNumbers.map((roll) => (
                <tr key={roll} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium">{roll}</td>
                  {[...Array(24)].map((_, index) => {
                    const status = getAttendanceStatus(roll, index)
                    const hasDate = dates[index] !== null
                    const isPresent = status === 'P'
                    
                    return (
                      <td
                        key={index}
                        className={`border border-gray-300 text-center cursor-pointer transition-all duration-200 font-semibold
                          ${hasDate 
                            ? isPresent 
                              ? 'bg-green-100 hover:bg-green-200 text-green-800' 
                              : 'bg-red-100 hover:bg-red-200 text-red-800'
                            : 'bg-gray-50 cursor-not-allowed'
                          }`}
                        onClick={() => hasDate && toggleAttendance(roll, index)}
                      >
                        {hasDate ? status : ''}
                      </td>
                    )
                  })}
                  <td className="border border-gray-300 px-4 py-2 font-bold text-center bg-gray-50">
                    {calculatePercentage(roll)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}