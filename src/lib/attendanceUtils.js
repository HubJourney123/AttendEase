import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

// Generate roll numbers
export const generateRollNumbers = (classData) => {
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

// Calculate attendance marks based on percentage
export const calculateAttendanceMarks = (percentage) => {
  if (percentage >= 90) return 100
  if (percentage >= 85) return 90
  if (percentage >= 80) return 80
  if (percentage >= 75) return 70
  if (percentage >= 70) return 60
  if (percentage >= 65) return 50
  if (percentage >= 60) return 40
  return 0
}

// Export to CSV
export const exportToCSV = (dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, getDetailedStats, calculateAttendanceMarks) => {
  try {
    let csv = 'Roll Number'
    dates.forEach((date) => {
      if (date) {
        csv += `,${date.toLocaleDateString()}`
      }
    })
    csv += ',Present,Absent,Late,Attendance %,Marks\n'
    
    rollNumbers.forEach(roll => {
      csv += roll
      dates.forEach((date, index) => {
        if (date) {
          csv += `,${getAttendanceStatus(roll, index)}`
        }
      })
      
      const percentage = parseFloat(calculatePercentage(roll))
      const marks = calculateAttendanceMarks(percentage)
      
      if (getDetailedStats) {
        const stats = getDetailedStats(roll)
        csv += `,${stats.present},${stats.absent},${stats.late}`
      }
      
      csv += `,${percentage}%,${marks}\n`
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
    console.error('Export error:', error)
    toast.error('Export failed')
  }
}

// Generate PDF - Alternative approach without autoTable
export const generatePDF = (dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, calculateAttendanceMarks, pdfInfo) => {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // University Header
    pdf.setFontSize(16)
    pdf.setFont(undefined, 'bold')
    pdf.text('Khulna University of Engineering & Technology', pageWidth / 2, 15, { align: 'center' })
    
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'normal')
    pdf.text(pdfInfo.department || 'Department Name', pageWidth / 2, 22, { align: 'center' })
    pdf.text(`${pdfInfo.year} ${pdfInfo.term} B. Sc. Engineering`, pageWidth / 2, 28, { align: 'center' })

    // Session and Date Info
    pdf.setFontSize(10)
    pdf.text('Session: _______________', 15, 35)
    pdf.text(`Starting Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 50, 35)
    
    // Roll Sheet header
    pdf.setFont(undefined, 'bold')
    pdf.text('Roll Sheet', pageWidth / 2, 40, { align: 'center' })
    pdf.setFont(undefined, 'normal')

    // Manual table creation as fallback
    let yPosition = 50
    const cellHeight = 6
    const startX = 10
    
    // Draw headers
    pdf.setFillColor(240, 240, 240)
    pdf.rect(startX, yPosition, 10, cellHeight, 'F')
    pdf.rect(startX + 10, yPosition, 20, cellHeight, 'F')
    pdf.rect(startX + 30, yPosition, 45, cellHeight, 'F')
    
    pdf.setFontSize(8)
    pdf.setFont(undefined, 'bold')
    pdf.text('SL.', startX + 5, yPosition + 4, { align: 'center' })
    pdf.text('Roll No.', startX + 20, yPosition + 4, { align: 'center' })
    pdf.text('Name of the Student', startX + 52, yPosition + 4, { align: 'center' })
    
    // Date headers
    let xPos = startX + 75
    dates.forEach((date, index) => {
      if (date && index < 20) { // Limit to prevent overflow
        pdf.rect(xPos, yPosition, 10, cellHeight, 'F')
        pdf.setFontSize(7)
        pdf.text(date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }), xPos + 5, yPosition + 4, { align: 'center' })
        xPos += 10
      }
    })
    
    // % and Marks headers
    pdf.rect(xPos, yPosition, 12, cellHeight, 'F')
    pdf.text('%', xPos + 6, yPosition + 4, { align: 'center' })
    pdf.rect(xPos + 12, yPosition, 15, cellHeight, 'F')
    pdf.text('Marks', xPos + 19, yPosition + 4, { align: 'center' })
    
    // Draw table borders for headers
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.1)
    pdf.line(startX, yPosition, xPos + 27, yPosition)
    pdf.line(startX, yPosition + cellHeight, xPos + 27, yPosition + cellHeight)
    
    yPosition += cellHeight
    pdf.setFont(undefined, 'normal')
    
    // Draw rows
    rollNumbers.forEach((roll, index) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = 20
      }
      
      // SL
      pdf.rect(startX, yPosition, 10, cellHeight)
      pdf.text((index + 1).toString(), startX + 5, yPosition + 4, { align: 'center' })
      
      // Roll No
      pdf.rect(startX + 10, yPosition, 20, cellHeight)
      pdf.text(roll, startX + 20, yPosition + 4, { align: 'center' })
      
      // Name (empty)
      pdf.rect(startX + 30, yPosition, 45, cellHeight)
      
      // Attendance marks
      let xPosRow = startX + 75
      dates.forEach((date, dateIndex) => {
        if (date && dateIndex < 20) {
          pdf.rect(xPosRow, yPosition, 10, cellHeight)
          const status = getAttendanceStatus(roll, dateIndex)
          pdf.setFont(undefined, 'bold')
          pdf.text(status, xPosRow + 5, yPosition + 4, { align: 'center' })
          pdf.setFont(undefined, 'normal')
          xPosRow += 10
        }
      })
      
      // Percentage
      const percentage = calculatePercentage(roll)
      pdf.rect(xPosRow, yPosition, 12, cellHeight)
      pdf.setFont(undefined, 'bold')
      pdf.text(`${percentage}%`, xPosRow + 6, yPosition + 4, { align: 'center' })
      
      // Marks
      const marks = calculateAttendanceMarks(parseFloat(percentage))
      pdf.rect(xPosRow + 12, yPosition, 15, cellHeight)
      pdf.text(marks.toString(), xPosRow + 19, yPosition + 4, { align: 'center' })
      pdf.setFont(undefined, 'normal')
      
      yPosition += cellHeight
    })
    
    // Footer
    yPosition += 10
    if (yPosition > pageHeight - 40) {
      pdf.addPage()
      yPosition = 20
    }
    
    pdf.setFontSize(10)
    pdf.text(`Course Code: ${classData.courseCode}`, 15, yPosition)
    pdf.text(`Course Title: ${classData.courseName}`, 15, yPosition + 5)
    pdf.text(`Batch: ${classData.batch}`, 15, yPosition + 10)
    
    // Teacher signature line
    pdf.line(15, yPosition + 25, 75, yPosition + 25)
    pdf.text('Course Teacher', 35, yPosition + 30)

    // Save PDF
    const fileName = `Roll_Sheet_${classData.courseCode}_${classData.batch}.pdf`
    pdf.save(fileName)
    
    toast.success('PDF generated successfully!')
  } catch (error) {
    console.error('PDF generation error:', error)
    toast.error('Failed to generate PDF: ' + error.message)
  }
}

// Keep openPrintDialog as before
export const openPrintDialog = (dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, calculateAttendanceMarks) => {
  try {
    const printWindow = window.open('', '_blank')
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance - ${classData.courseCode}</title>
        <style>
          @media print { 
            @page { size: landscape; margin: 10mm; } 
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
          }
          h1 { 
            text-align: center; 
            font-size: 18px; 
          }
          h2 { 
            text-align: center; 
            font-size: 14px; 
            font-weight: normal; 
          }
          .info { 
            display: flex; 
            justify-content: space-between; 
            margin: 20px 0; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
          }
          th, td { 
            border: 1px solid #000; 
            padding: 4px; 
            text-align: center; 
            font-size: 10px;
          }
          th { 
            background: #f0f0f0; 
            font-weight: bold; 
          }
          td.name { 
            text-align: left; 
            width: 150px; 
          }
          .footer { 
            margin-top: 40px; 
          }
          .signature { 
            margin-top: 50px; 
            display: inline-block; 
            width: 200px; 
            border-top: 1px solid #000; 
            text-align: center; 
            padding-top: 5px; 
          }
        </style>
      </head>
      <body>
        <h1>Khulna University of Engineering & Technology</h1>
        <h2>${pdfInfo?.department || 'Department of Computer Science and Engineering'}</h2>
        <h2>${pdfInfo?.year || '3rd Year'} ${pdfInfo?.term || '1st Term'} B. Sc. Engineering</h2>
        <div class="info">
          <span>Session: _______________</span>
          <span>Roll Sheet</span>
          <span>Date: ${new Date().toLocaleDateString('en-GB')}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>SL.</th>
              <th>Roll No.</th>
              <th class="name">Name of the Student</th>`
    
    dates.forEach(date => {
      if (date) {
        html += `<th>${date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</th>`
      }
    })
    
    html += `<th>%</th><th>Marks</th></tr></thead><tbody>`
    
    rollNumbers.forEach((roll, index) => {
      html += `<tr>
        <td>${index + 1}</td>
        <td>${roll}</td>
        <td class="name"></td>`
      
      dates.forEach((date, dateIndex) => {
        if (date) {
          const status = getAttendanceStatus(roll, dateIndex)
          html += `<td><strong>${status}</strong></td>`
        }
      })
      
      const percentage = parseFloat(calculatePercentage(roll))
      const marks = calculateAttendanceMarks(percentage)
      
      html += `<td><strong>${percentage}%</strong></td>`
      html += `<td><strong>${marks}</strong></td></tr>`
    })
    
    html += `</tbody></table>
        <div class="footer">
          <p>Course Code: ${classData.courseCode}</p>
          <p>Course Title: ${classData.courseName}</p>
          <p>Batch: ${classData.batch}</p>
          <div class="signature">Course Teacher</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>`
    
    printWindow.document.write(html)
    printWindow.document.close()
  } catch (error) {
    console.error('Print error:', error)
    toast.error('Failed to open print dialog')
  }
}