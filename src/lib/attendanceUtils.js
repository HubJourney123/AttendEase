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
    
    // Header
    pdf.setFontSize(14)
    pdf.setFont(undefined, 'bold')
    pdf.text('Khulna University of Engineering & Technology', pageWidth / 2, 12, { align: 'center' })
    
    pdf.setFontSize(11)
    pdf.setFont(undefined, 'normal')
    pdf.text(pdfInfo.department || 'Department Name', pageWidth / 2, 17, { align: 'center' })
    pdf.text(`${pdfInfo.year} ${pdfInfo.term} B. Sc. Engineering`, pageWidth / 2, 22, { align: 'center' })

    pdf.setFontSize(9)
    pdf.text('Session: _______________', 15, 28)
    pdf.text(`Starting Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 50, 28)
    
    pdf.setFont(undefined, 'bold')
    pdf.text('Roll Sheet', pageWidth / 2, 33, { align: 'center' })
    pdf.setFont(undefined, 'normal')

    // Table settings
    let startY = 38
    const cellHeight = 5
    const startX = 10
    
    // Function to check if roll should be last on page
    const isPageBreakRoll = (roll) => {
      const lastThreeDigits = parseInt(roll.slice(-3))
      const lastTwoDigits = parseInt(roll.slice(-2))
      
      // Check for 30, 60, 90, 120, 150, 180, etc.
      return (lastThreeDigits % 30 === 0 && lastThreeDigits > 0) || 
             (lastTwoDigits === 30 || lastTwoDigits === 60 || lastTwoDigits === 90)
    }
    
    // Group rolls by pages
    const pageGroups = []
    let currentGroup = []
    
    rollNumbers.forEach((roll, index) => {
      currentGroup.push({ roll, index })
      
      // Break page if this roll should be last on page OR we've hit 30 students
      if (isPageBreakRoll(roll) || currentGroup.length >= 30) {
        pageGroups.push([...currentGroup])
        currentGroup = []
      }
    })
    
    // Add remaining rolls if any
    if (currentGroup.length > 0) {
      pageGroups.push(currentGroup)
    }
    
    // Function to draw header
    const drawHeader = (yPos) => {
      pdf.setFillColor(240, 240, 240)
      
      // Fixed columns
      pdf.rect(startX, yPos, 8, cellHeight, 'FD')
      pdf.rect(startX + 8, yPos, 18, cellHeight, 'FD')
      pdf.rect(startX + 26, yPos, 40, cellHeight, 'FD')
      
      pdf.setFontSize(8)
      pdf.setFont(undefined, 'bold')
      pdf.text('SL.', startX + 4, yPos + 3.5, { align: 'center' })
      pdf.text('Roll No.', startX + 17, yPos + 3.5, { align: 'center' })
      pdf.text('Name of the Student', startX + 46, yPos + 3.5, { align: 'center' })
      
      // Date columns
      let xPos = startX + 66
      const dateWidth = 9
      
      dates.forEach((date, index) => {
        if (date && index < 24) {
          pdf.rect(xPos, yPos, dateWidth, cellHeight, 'FD')
          pdf.setFontSize(6)
          const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
          pdf.text(dateStr, xPos + dateWidth/2, yPos + 3.5, { align: 'center' })
          xPos += dateWidth
        }
      })
      
      // % and Marks columns
      pdf.rect(xPos, yPos, 10, cellHeight, 'FD')
      pdf.setFontSize(7)
      pdf.text('%', xPos + 5, yPos + 3.5, { align: 'center' })
      pdf.rect(xPos + 10, yPos, 12, cellHeight, 'FD')
      pdf.text('Marks', xPos + 16, yPos + 3.5, { align: 'center' })
      
      return cellHeight
    }
    
    // Draw pages
    pageGroups.forEach((group, pageIndex) => {
      if (pageIndex > 0) {
        pdf.addPage()
      }
      
      let yPosition = startY
      yPosition += drawHeader(yPosition)
      pdf.setFont(undefined, 'normal')
      
      // Draw rows for this page
      group.forEach(({ roll, index }) => {
        // SL
        pdf.rect(startX, yPosition, 8, cellHeight)
        pdf.setFontSize(7)
        pdf.text((index + 1).toString(), startX + 4, yPosition + 3.5, { align: 'center' })
        
        // Roll No
        pdf.rect(startX + 8, yPosition, 18, cellHeight)
        pdf.text(roll, startX + 17, yPosition + 3.5, { align: 'center' })
        
        // Name (empty)
        pdf.rect(startX + 26, yPosition, 40, cellHeight)
        
        // Attendance marks
        let xPosRow = startX + 66
        const dateWidth = 9
        
        dates.forEach((date, dateIndex) => {
          if (date && dateIndex < 24) {
            pdf.rect(xPosRow, yPosition, dateWidth, cellHeight)
            const status = getAttendanceStatus(roll, dateIndex)
            pdf.setFont(undefined, 'bold')
            pdf.setFontSize(7)
            pdf.text(status, xPosRow + dateWidth/2, yPosition + 3.5, { align: 'center' })
            pdf.setFont(undefined, 'normal')
            xPosRow += dateWidth
          }
        })
        
        // Percentage
        const percentage = calculatePercentage(roll)
        pdf.rect(xPosRow, yPosition, 10, cellHeight)
        pdf.setFont(undefined, 'bold')
        pdf.setFontSize(7)
        pdf.text(`${percentage}%`, xPosRow + 5, yPosition + 3.5, { align: 'center' })
        
        // Marks
        const marks = calculateAttendanceMarks(parseFloat(percentage))
        pdf.rect(xPosRow + 10, yPosition, 12, cellHeight)
        pdf.text(marks.toString(), xPosRow + 16, yPosition + 3.5, { align: 'center' })
        pdf.setFont(undefined, 'normal')
        
        yPosition += cellHeight
      })
      
      // Footer on last page only
      if (pageIndex === pageGroups.length - 1 && yPosition < pageHeight - 25) {
        yPosition += 5
        pdf.setFontSize(9)
        pdf.text(`Course Code: ${classData.courseCode}`, 15, yPosition)
        pdf.text(`Course Title: ${classData.courseName}`, 15, yPosition + 4)
        pdf.text(`Batch: ${classData.batch}`, 15, yPosition + 8)
        
        pdf.line(15, yPosition + 18, 65, yPosition + 18)
        pdf.text('Course Teacher', 32, yPosition + 22)
      }
    })

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