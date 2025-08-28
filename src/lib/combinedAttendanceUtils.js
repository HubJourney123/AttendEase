// src/lib/combinedAttendanceUtils.js
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'

export const generateCombinedAttendancePDF = (
  combinedData,
  courseInfo,
  departmentBangla,
  totalClasses
) => {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;

    // Helper function to add new page with header
    const addNewPage = () => {
      pdf.addPage();
      currentY = 20;
      drawHeader();
    };

    // Header function with Bengali text
    const drawHeader = () => {
      // University name in Bengali
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়', pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;

      // Department name in Bengali (from user selection)
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(departmentBangla, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;

      // Course details
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const courseText = `Course No: ${courseInfo.courseCode || 'N/A'}    Title of the Course: ${courseInfo.courseName || 'N/A'}`;
      pdf.text(courseText, pageWidth / 2, currentY, { align: 'center' });
      currentY += 6;

      pdf.setFontSize(10);
      pdf.text(`Batch: ${courseInfo.batch || 'N/A'}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
    };

    // Initial header
    drawHeader();

    // Prepare table data
    const tableData = [];
    let slNo = 1;

    combinedData.forEach((student) => {
      const totalAttendance = totalClasses - student.totalAbsent;
      const attendancePercentage = ((totalAttendance / totalClasses) * 100).toFixed(1);
      
      tableData.push([
        slNo++,
        student.rollNumber,
        student.name || '', // Name column (empty as per image requirement)
        totalAttendance, // Total number of attendance (present classes)
        `${attendancePercentage}%`
      ]);
    });

    // Split data into pages (30 students per page)
    const studentsPerPage = 30;
    const totalPages = Math.ceil(tableData.length / studentsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) addNewPage();

      const startIndex = page * studentsPerPage;
      const endIndex = Math.min(startIndex + studentsPerPage, tableData.length);
      const pageData = tableData.slice(startIndex, endIndex);

      // Create table with autoTable
      autoTable(pdf, {
        startY: currentY,
        head: [[
          'SL. No.',
          'Roll No.',
          'Name of the student',
          'Total Number of Attendance',
          'Percentage of Attendance'
        ]],
        body: pageData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          halign: 'center',
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },  // SL No
          1: { halign: 'center', cellWidth: 25 },  // Roll No
          2: { halign: 'left', cellWidth: 80 },    // Name (wider for empty space)
          3: { halign: 'center', cellWidth: 35 },  // Total Attendance
          4: { halign: 'center', cellWidth: 30 }   // Percentage
        },
        didParseCell: function(data) {
          // Gray out rows with less than 60% attendance
          if (data.section === 'body') {
            const rowData = pageData[data.row.index];
            const percentage = parseFloat(rowData[4].replace('%', ''));
            if (percentage < 60) {
              data.cell.styles.fillColor = [220, 220, 220]; // Light gray background
              data.cell.styles.textColor = [80, 80, 80]; // Darker gray text
            }
          }
        },
        margin: { top: 10, left: 15, right: 15 },
        tableWidth: 'auto',
        pageBreak: 'avoid'
      });

      // Add teacher signature section
      const isLastPage = page === totalPages - 1;
      const hasFullPage = pageData.length >= 30;
      
      // Add signatures on last page OR when page has 30 students
      if (isLastPage || hasFullPage) {
        const finalY = pdf.lastAutoTable.finalY || currentY + 100;
        const signatureY = Math.min(finalY + 30, pageHeight - 40);
        
        // Teacher signature section
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Teacher\'s Name & Signature', 15, signatureY);
        
        // Two signature lines for two teachers
        pdf.text('(1)', 15, signatureY + 15);
        pdf.line(25, signatureY + 13, 85, signatureY + 13); // First signature line
        
        pdf.text('(2)', 15, signatureY + 25);
        pdf.line(25, signatureY + 23, 85, signatureY + 23); // Second signature line
      }
    }

    // Generate filename with timestamp
    const timestamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const fileName = `Combined_Attendance_${courseInfo.courseCode}_${courseInfo.batch}_${timestamp}.pdf`;
    
    // Save the PDF
    pdf.save(fileName);

    toast.success('Combined attendance PDF generated successfully!');
  } catch (error) {
    console.error('PDF generation error:', error);
    toast.error('Failed to generate PDF: ' + error.message);
  }
};

// Helper function to format date consistently
export const formatDateKey = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Helper function to combine attendance data from two classes
export const combineAttendanceData = (currentAttendance, partnerAttendance, rollNumbers) => {
  const combinedMap = new Map();

  // Initialize all roll numbers with zero absents
  rollNumbers.forEach(rollNumber => {
    combinedMap.set(rollNumber, {
      rollNumber,
      absents: 0,
      name: '' // Empty as per requirement
    });
  });

  // Count absents from current class
  currentAttendance.forEach(([key, status]) => {
    const [rollNumber] = key.split('-');
    if (status === 'A' && combinedMap.has(rollNumber)) {
      combinedMap.get(rollNumber).absents += 1;
    }
  });

  // Count absents from partner class
  partnerAttendance.forEach(record => {
    if (record.status === 'A') {
      const rollNumber = record.rollNumber;
      if (combinedMap.has(rollNumber)) {
        combinedMap.get(rollNumber).absents += 1;
      }
    }
  });

  // Convert to sorted array
  return Array.from(combinedMap.values())
    .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
    .map(student => ({
      rollNumber: student.rollNumber,
      name: student.name,
      totalAbsent: student.absents
    }));
};

// Validate class code format
export const isValidClassCode = (code) => {
  return /^[A-Z0-9]{6}$/.test(code);
};