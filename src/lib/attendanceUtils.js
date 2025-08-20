import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

export const generatePDF = (dates, rollNumbers, getAttendanceStatus, calculatePercentage, classData, calculateAttendanceMarks) => {
  toast.loading('Generating PDF...', { id: 'pdf-generation' })

  const printDiv = document.createElement('div')
  printDiv.style.position = 'absolute'
  printDiv.style.left = '-9999px'
  printDiv.style.backgroundColor = 'white'
  printDiv.style.padding = '20px'
  
  let tableHTML = `
    <div style="background: white; padding: 20px; font-family: Arial;">
      <h2 style="color: #333;">${classData.courseCode} - ${classData.courseName}</h2>
      <p style="color: #666;">Batch: ${classData.batch}</p>
      <p style="color: #666; font-size: 12px;">Generated: ${new Date().toLocaleDateString()}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Roll</th>`
  
  dates.forEach((date) => {
    if (date) {
      tableHTML += `<th style="border: 1px solid #ddd; padding: 4px; font-size: 12px;">${date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</th>`
    }
  })
  
  tableHTML += `<th style="border: 1px solid #ddd; padding: 8px;">%</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Marks</th></tr></thead><tbody>`
  
  rollNumbers.forEach(roll => {
    tableHTML += `<tr><td style="border: 1px solid #ddd; padding: 8px;">${roll}</td>`
    dates.forEach((date, index) => {
      if (date) {
        const status = getAttendanceStatus(roll, index)
        let bgColor, textColor
        switch(status) {
          case 'P':
            bgColor = '#d4edda'
            textColor = '#155724'
            break
          case 'A':
            bgColor = '#f8d7da'
            textColor = '#721c24'
            break
          case 'L':
            bgColor = '#fff3cd'
            textColor = '#856404'
            break
          default:
            bgColor = '#d4edda'
            textColor = '#155724'
        }
        tableHTML += `<td style="border: 1px solid #ddd; padding: 4px; text-align: center; background: ${bgColor}; color: ${textColor}; font-weight: bold;">${status}</td>`
      }
    })
    
    const percentage = parseFloat(calculatePercentage(roll))
    const marks = calculateAttendanceMarks(percentage)
    
    tableHTML += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${percentage}%</td>`
    tableHTML += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background: ${
      marks >= 90 ? '#d4edda' : marks >= 70 ? '#fff3cd' : marks >= 50 ? '#ffeaa7' : '#f8d7da'
    };">${marks}</td></tr>`
  })
  
  tableHTML += `</tbody></table>
    <div style="margin-top: 20px; font-size: 12px; color: #666;">
      <p><strong>Attendance Marks:</strong> ≥90%: 100 | 85-89%: 90 | 80-84%: 80 | 75-79%: 70 | 70-74%: 60 | 65-69%: 50 | 60-64%: 40 | &lt;60%: 0</p>
    </div>
  </div>`
  
  printDiv.innerHTML = tableHTML
  document.body.appendChild(printDiv)

  html2canvas(printDiv, {
    scale: 2,
    logging: false,
    backgroundColor: '#ffffff'
  }).then(canvas => {
    document.body.removeChild(printDiv)
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('l', 'mm', 'a4')
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height)
    
    pdf.addImage(imgData, 'PNG', 10, 10, canvas.width * ratio, canvas.height * ratio)
    pdf.save(`attendance_${classData.courseCode}_${classData.batch}.pdf`)
    
    toast.success('PDF generated!', { id: 'pdf-generation' })
  }).catch(error => {
    document.body.removeChild(printDiv)
    toast.error('PDF generation failed', { id: 'pdf-generation' })
  })
}

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
        .present { background: #d4edda; color: #155724; }
        .absent { background: #f8d7da; color: #721c24; }
        .late { background: #fff3cd; color: #856404; }
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
        const className = status === 'P' ? 'present' : status === 'A' ? 'absent' : 'late'
        html += `<td class="${className}">${status}</td>`
      }
    })
    
    const percentage = parseFloat(calculatePercentage(roll))
    const marks = calculateAttendanceMarks(percentage)
    
    html += `<td><strong>${percentage}%</strong></td>`
    html += `<td><strong>${marks}</strong></td></tr>`
  })
  
  html += `</tbody></table>
      <div class="legend">
        <p><strong>Marks:</strong> ≥90%: 100 | 85-89%: 90 | 80-84%: 80 | 75-79%: 70 | 70-74%: 60 | 65-69%: 50 | 60-64%: 40 | &lt;60%: 0</p>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body></html>`
  
  printWindow.document.write(html)
  printWindow.document.close()
}