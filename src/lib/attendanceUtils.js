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

export const generatePDF = (
  dates,
  rollNumbers,
  getAttendanceStatus,
  calculatePercentage,
  classData,
  pdfInfo
) => {
  try {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const validDates = dates.filter((d) => d);

    // ---------- HEADER ----------
    pdf.setFontSize(14);
    pdf.setFont('times', "bold");
    pdf.text(
      "Khulna University of Engineering & Technology",
      pageWidth / 2,
      12,
      { align: "center" }
    );

    pdf.setFontSize(11);
    pdf.setFont('times', 'normal');
    pdf.text(pdfInfo.department || 'Department Name', pageWidth / 2, 17, { align: 'center' });
    pdf.text(`${pdfInfo.year} ${pdfInfo.term} B. Sc. Engineering`, pageWidth / 2, 22, { align: 'center' });

    pdf.setFontSize(9);
    pdf.text('Session: _______________', 15, 25);
    pdf.text(`Starting Date: ________________`, pageWidth - 60, 25);



    pdf.setFont('times', "bold");
    pdf.text("Roll Sheet", pageWidth / 2, 28, { align: "center" });
    pdf.setFont('times', "normal");

    // ---------- TABLE SETTINGS ----------
    let startY = 32;
    const cellHeight = 5;
    const startX = 10;

    const isPageBreakRoll = (roll) => {
      const lastThreeDigits = parseInt(roll.slice(-3));
      const lastTwoDigits = parseInt(roll.slice(-2));
      return (
        (lastThreeDigits % 30 === 0 && lastThreeDigits > 0) ||
        lastTwoDigits === 30 ||
        lastTwoDigits === 60 ||
        lastTwoDigits === 90
      );
    };

    const pageGroups = [];
    let currentGroup = [];

    rollNumbers.forEach((roll, index) => {
      currentGroup.push({ roll, index });
      if (isPageBreakRoll(roll) || currentGroup.length >= 30) {
        pageGroups.push([...currentGroup]);
        currentGroup = [];
      }
    });

    if (currentGroup.length > 0) pageGroups.push(currentGroup);

  // ---------- DRAW HEADER ----------
// ---------- DRAW HEADER ----------
const drawHeader = (yPos) => {
  // Fixed columns background
  pdf.setFillColor(240, 240, 240);
  pdf.setDrawColor(0, 0, 0);

  // SL
  pdf.rect(startX, yPos, 8, cellHeight, "FD");
  // Roll
  pdf.rect(startX + 8, yPos, 18, cellHeight, "FD");
  // Name
  pdf.rect(startX + 26, yPos, 40, cellHeight, "FD");

  pdf.setFontSize(8);
  pdf.setFont('times', "bold");
  pdf.setTextColor(0, 0, 0);
  pdf.text("SL.", startX + 4, yPos + 3.5, { align: "center" });
  pdf.text("Roll No.", startX + 17, yPos + 3.5, { align: "center" });
  pdf.text("Name of the Student", startX + 46, yPos + 3.5, { align: "center" });

  // Date columns
  let xPos = startX + 66;
  const dateWidth = 9;
  validDates.forEach((date) => {
    pdf.setFillColor(240, 240, 240); // gray background for header
    pdf.rect(xPos, yPos, dateWidth, cellHeight, "FD");

    // Draw date text
    pdf.setFontSize(6);
    pdf.setTextColor(0, 0, 0); // ensure black text
    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
    });
    pdf.text(dateStr, xPos + dateWidth / 2, yPos + 3.5, { align: "center" });

    xPos += dateWidth;
  });

  // % column
  pdf.setFillColor(240, 240, 240);
  pdf.rect(xPos, yPos, 12, cellHeight, "FD");
  pdf.setFontSize(7);
  pdf.setTextColor(0, 0, 0);
  pdf.text("%", xPos + 6, yPos + 3.5, { align: "center" });

  // ✅ Reset fill & text colors for student rows
  pdf.setFillColor(255, 255, 255);
  pdf.setTextColor(0, 0, 0);

  return cellHeight;
};


// ---------- DRAW PAGES ----------
pageGroups.forEach((group, pageIndex) => {
  if (pageIndex > 0) pdf.addPage();

      let yPosition = startY;
      yPosition += drawHeader(yPosition);

      group.forEach(({ roll, index }) => {
        // SL
        pdf.rect(startX, yPosition, 8, cellHeight);
        pdf.setFontSize(7);
        pdf.text((index + 1).toString(), startX + 4, yPosition + 3.5, {
          align: "center",
        });

        // Roll No
        pdf.rect(startX + 8, yPosition, 18, cellHeight);
        pdf.text(roll, startX + 17, yPosition + 3.5, { align: "center" });

        // Name
        pdf.rect(startX + 26, yPosition, 40, cellHeight);

        // Attendance per date
        let xPosRow = startX + 66;
        const dateWidth = 9;
        validDates.forEach((date, dateIndex) => {
          pdf.rect(xPosRow, yPosition, dateWidth, cellHeight);
          const status = getAttendanceStatus(roll, dateIndex);
          pdf.setFontSize(7);
          pdf.text(status, xPosRow + dateWidth / 2, yPosition + 3.5, {
            align: "center",
          });
          xPosRow += dateWidth;
        });

        // Percentage only
        const percentage = calculatePercentage(roll);
        pdf.rect(xPosRow, yPosition, 12, cellHeight);
        pdf.text(`${percentage}%`, xPosRow + 6, yPosition + 3.5, {
          align: "center",
        });

        yPosition += cellHeight;
      });

      // ---------- FOOTER (last page only) ----------
      if (pageIndex === pageGroups.length - 1) {
        const footerY = pageHeight - 20;

        // Left side: course info
        pdf.setFontSize(9);
        pdf.text(`Course Code: ${classData.courseCode}`, 15, footerY);
        pdf.text(`Course Title: ${classData.courseName}`, 15, footerY + 4);
        pdf.text(`Batch: ${classData.batch}`, 15, footerY + 8);

        // ✅ Right side: signature box
        const sigX = pageWidth - 65;
        pdf.line(sigX, footerY, sigX + 50, footerY); // signature line
        pdf.text("Course Teacher", sigX + 25, footerY + 4, { align: "center" });
      }
    });

    // ---------- SAVE ----------
    const fileName = `Roll_Sheet_${classData.courseCode}_${classData.batch}.pdf`;
    pdf.save(fileName);

    toast.success("PDF generated successfully!");
  } catch (error) {
    console.error("PDF generation error:", error);
    toast.error("Failed to generate PDF: " + error.message);
  }
};


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