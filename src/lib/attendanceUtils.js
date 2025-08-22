import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import html2canvas from 'html2canvas'

// Generate roll numbers function
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

// Calculate attendance marks
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
    
    toast.success('CSV exported with marks!')
  } catch (error) {
    toast.error('Export failed')
  }
}

// Generate PDF
export const generatePDF = (dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, calculateAttendanceMarks, pdfInfo) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  // University Header
  pdf.setFontSize(16)
  pdf.setFont(undefined, 'bold')
  pdf.text('Khulna University of Engineering & Technology', pdf.internal.pageSize.getWidth() / 2, 15, { align: 'center' })
  
  pdf.setFontSize(12)
  pdf.setFont(undefined, 'normal')
  pdf.text(pdfInfo.department || 'Department Name', pdf.internal.pageSize.getWidth() / 2, 22, { align: 'center' })
  pdf.text(`${pdfInfo.year} ${pdfInfo.term} B. Sc. Engineering`, pdf.internal.pageSize.getWidth() / 2, 28, { align: 'center' })

  // Session and Date Info
  pdf.setFontSize(10)
  pdf.text('Session: _______________', 15, 35)
  pdf.text(`Starting Date: ${new Date().toLocaleDateString('en-GB')}`, pdf.internal.pageSize.getWidth() - 50, 35)
  
  // Roll Sheet header
  pdf.setFont(undefined, 'bold')
  pdf.text('Roll Sheet', pdf.internal.pageSize.getWidth() / 2, 40, { align: 'center' })
  pdf.setFont(undefined, 'normal')

  // Prepare table headers
  const headers = ['SL.', 'Roll No.', 'Name of the Student']
  
  dates.forEach((date) => {
    if (date) {
      headers.push(date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }))
    }
  })
  headers.push('%', 'Marks')

  // Prepare rows
  const rows = []
  rollNumbers.forEach((roll, index) => {
    const row = [
      index + 1,
      roll,
      ''
    ]
    
    dates.forEach((date, dateIndex) => {
      if (date) {
        const status = getAttendanceStatus(roll, dateIndex)
        row.push(status)
      }
    })
    
    const percentage = calculatePercentage(roll)
    const marks = calculateAttendanceMarks(parseFloat(percentage))
    row.push(`${percentage}%`)
    row.push(marks)
    
    rows.push(row)
  })

  // Generate table
  pdf.autoTable({
    head: [headers],
    body: rows,
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
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'left', cellWidth: 45 },
    },
    didParseCell: function(data) {
      if (data.column.index >= 3 && data.column.index < headers.length - 2) {
        data.cell.styles.halign = 'center'
        data.cell.styles.cellWidth = 12
        data.cell.styles.fontStyle = 'bold'
      }
      
      if (data.column.index === headers.length - 2) {
        data.cell.styles.halign = 'center'
        data.cell.styles.fontStyle = 'bold'
      }
      
      if (data.column.index === headers.length - 1) {
        data.cell.styles.halign = 'center'
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  const finalY = pdf.lastAutoTable.finalY || 150
  pdf.setFontSize(10)
  pdf.text(`Course Code: ${classData.courseCode}`, 15, finalY + 10)
  pdf.text(`Course Title: ${classData.courseName}`, 15, finalY + 15)
  pdf.text(`Batch: ${classData.batch}`, 15, finalY + 20)
  
  pdf.line(15, finalY + 35, 75, finalY + 35)
  pdf.text('Course Teacher', 35, finalY + 40)

  const fileName = `Roll_Sheet_${classData.courseCode}_${classData.batch}.pdf`
  pdf.save(fileName)
}

// Open print dialog
export const openPrintDialog = (dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, calculateAttendanceMarks) => {
  const printWindow = window.open('', '_blank')
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance - ${classData.courseCode}</title>
      <style>
        @media print { @page { size: landscape; margin: 10mm; } }
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 4px; text-align: center; }
        th { background: #f0f0f0; font-weight: bold; }
        .legend { margin-top: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <h2>${classData.courseCode} - ${classData.courseName}</h2>
      <p>Batch: ${classData.batch} | Date: ${new Date().toLocaleDateString()}</p>
      <table>
        <thead>
          <tr>
            <th>Roll</th>`
  
  dates.forEach(date => {
    if (date) {
      html += `<th>${date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</th>`
    }
  })
  
  html += `<th>%</th><th>Marks</th></tr></thead><tbody>`
  
  rollNumbers.forEach(roll => {
    html += `<tr><td>${roll}</td>`
    dates.forEach((date, index) => {
      if (date) {
        const status = getAttendanceStatus(roll, index)
        html += `<td><strong>${status}</strong></td>`
      }
    })
    
    const percentage = parseFloat(calculatePercentage(roll))
    const marks = calculateAttendanceMarks(percentage)
    
    html += `<td><strong>${percentage}%</strong></td>`
    html += `<td><strong>${marks}</strong></td></tr>`
  })
  
  html += `</tbody></table>
      <script>window.onload = function() { window.print(); }</script>
    </body></html>`
  
  printWindow.document.write(html)
  printWindow.document.close()
}