import jsPDF from 'jspdf'
import 'jspdf-autotable'

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

  // Session (blank for handwriting) and Date Info
  pdf.setFontSize(10)
  pdf.text('Session: _______________', 15, 35)  // Blank line for handwriting
  pdf.text(`Starting Date: ${new Date().toLocaleDateString('en-GB')}`, pdf.internal.pageSize.getWidth() - 50, 35)
  
  // Course Info - Roll Sheet header
  pdf.setFont(undefined, 'bold')
  pdf.text('Roll Sheet', pdf.internal.pageSize.getWidth() / 2, 40, { align: 'center' })
  pdf.setFont(undefined, 'normal')

  // Prepare table headers
  const headers = ['SL.', 'Roll No.', 'Name of the Student']
  
  // Add date columns
  dates.forEach((date, index) => {
    if (date) {
      headers.push(date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }))
    }
  })
  headers.push('%', 'Marks')

  // Prepare rows
  const rows = []
  rollNumbers.forEach((roll, index) => {
    const row = [
      index + 1,  // Serial number
      roll,       // Roll number
      ''          // Name (empty for manual filling)
    ]
    
    // Add attendance for each date
    dates.forEach((date, dateIndex) => {
      if (date) {
        const status = getAttendanceStatus(roll, dateIndex)
        row.push(status)
      }
    })
    
    // Add percentage and marks
    const percentage = calculatePercentage(roll)
    const marks = calculateAttendanceMarks(parseFloat(percentage))
    row.push(`${percentage}%`)
    row.push(marks)
    
    rows.push(row)
  })

  // Generate table using autoTable - BLACK AND WHITE ONLY
  pdf.autoTable({
    head: [headers],
    body: rows,
    startY: 45,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 1,
      lineColor: [0, 0, 0],      // Black lines
      lineWidth: 0.1,
      textColor: [0, 0, 0],       // Black text only
      fontStyle: 'normal',
      fillColor: [255, 255, 255]  // White background
    },
    headStyles: {
      fillColor: [240, 240, 240],  // Light gray header
      textColor: [0, 0, 0],        // Black text
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },  // SL
      1: { halign: 'center', cellWidth: 20 },  // Roll No
      2: { halign: 'left', cellWidth: 45 },    // Name (slightly wider for manual writing)
    },
    didParseCell: function(data) {
      // Center align date columns (no color coding)
      if (data.column.index >= 3 && data.column.index < headers.length - 2) {
        data.cell.styles.halign = 'center'
        data.cell.styles.cellWidth = 12
        data.cell.styles.fontStyle = 'bold'  // Make P/A/L bold for visibility
      }
      
      // Style for percentage column
      if (data.column.index === headers.length - 2) {
        data.cell.styles.halign = 'center'
        data.cell.styles.fontStyle = 'bold'
      }
      
      // Style for marks column
      if (data.column.index === headers.length - 1) {
        data.cell.styles.halign = 'center'
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  // Footer information
  const finalY = pdf.lastAutoTable.finalY || 150
  pdf.setFontSize(10)
  pdf.text(`Course Code: ${classData.courseCode}`, 15, finalY + 10)
  pdf.text(`Course Title: ${classData.courseName}`, 15, finalY + 15)
  pdf.text(`Batch: ${classData.batch}`, 15, finalY + 20)
  
  // Only Teacher's signature line
  pdf.line(15, finalY + 35, 75, finalY + 35)
  pdf.text('Course Teacher', 35, finalY + 40)

  // Save the PDF
  const fileName = `Roll_Sheet_${classData.courseCode}_${classData.batch}.pdf`
  pdf.save(fileName)
}