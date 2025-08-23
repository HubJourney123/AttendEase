import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
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

// Generate PDF
export const generatePDF = (dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, calculateAttendanceMarks, pdfInfo) => {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth()
    
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

    // Prepare table headers
    const headers = [['SL.', 'Roll No.', 'Name of the Student']]
    
    // Add date columns
    dates.forEach((date) => {
      if (date) {
        headers[0].push(date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }))
      }
    })
    headers[0].push('%', 'Marks')

    // Prepare body rows
    const body = []
    rollNumbers.forEach((roll, index) => {
      const row = [
        (index + 1).toString(),
        roll,
        ''  // Empty name field
      ]
      
      // Add attendance for each date
      dates.forEach((date, dateIndex) => {
        if (date) {
          const status = getAttendanceStatus(roll, dateIndex)
          row.push(status || '')
        }
      })
      
      // Add percentage and marks
      const percentage = calculatePercentage(roll)
      const marks = calculateAttendanceMarks(parseFloat(percentage))
      row.push(`${percentage}%`)
      row.push(marks.toString())
      
      body.push(row)
    })

    // Generate table
    pdf.autoTable({
      head: headers,
      body: body,
      startY: 45,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        textColor: [0, 0, 0],
        fontStyle: 'normal',
        fillColor: [255, 255, 255]
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },   // SL
        1: { halign: 'center', cellWidth: 20 },   // Roll No
        2: { halign: 'left', cellWidth: 45 }      // Name
      },
      didParseCell: function(data) {
        // Style for date columns
        if (data.column.index >= 3 && data.column.index < headers[0].length - 2) {
          data.cell.styles.halign = 'center'
          data.cell.styles.cellWidth = 12
          data.cell.styles.fontStyle = 'bold'
        }
        
        // Style for percentage column
        if (data.column.index === headers[0].length - 2) {
          data.cell.styles.halign = 'center'
          data.cell.styles.fontStyle = 'bold'
        }
        
        // Style for marks column
        if (data.column.index === headers[0].length - 1) {
          data.cell.styles.halign = 'center'
          data.cell.styles.fontStyle = 'bold'
        }
      }
    })

    // Footer
    const finalY = pdf.lastAutoTable.finalY || 150
    pdf.setFontSize(10)
    pdf.text(`Course Code: ${classData.courseCode}`, 15, finalY + 10)
    pdf.text(`Course Title: ${classData.courseName}`, 15, finalY + 15)
    pdf.text(`Batch: ${classData.batch}`, 15, finalY + 20)
    
    // Teacher signature line
    pdf.line(15, finalY + 35, 75, finalY + 35)
    pdf.text('Course Teacher', 35, finalY + 40)

    // Save PDF
    const fileName = `Roll_Sheet_${classData.courseCode}_${classData.batch}.pdf`
    pdf.save(fileName)
    
    toast.success('PDF generated successfully!')
  } catch (error) {
    console.error('PDF generation error:', error)
    toast.error('Failed to generate PDF: ' + error.message)
  }
}

// Open print dialog
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
        <h2>Department of Computer Science and Engineering</h2>
        <h2>B. Sc. Engineering</h2>
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