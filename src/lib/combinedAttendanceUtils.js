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
    let currentY = 20;

    // Department mapping from Bangla to English
    const departmentMapping = {
      'কম্পিউটার বিজ্ঞান ও প্রকৌশল': 'Department of Computer Science and Engineering',
      'ইলেকট্রিক্যাল ও ইলেকট্রনিক প্রকৌশল': 'Department of Electrical and Electronic Engineering',
      'মেকানিক্যাল প্রকৌশল': 'Department of Mechanical Engineering',
      'সিভিল প্রকৌশল': 'Department of Civil Engineering',
      'ইন্ডাস্ট্রিয়াল প্রকৌশল ও ব্যবস্থাপনা': 'Department of Industrial Engineering and Management',
      'কেমিক্যাল প্রকৌশল': 'Department of Chemical Engineering',
      'ম্যাটেরিয়ালস সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং': 'Department of Materials Science and Engineering',
      'বায়োমেডিক্যাল ইঞ্জিনিয়ারিং': 'Department of Biomedical Engineering',
      'আর্কিটেকচার': 'Department of Architecture',
      'আরবান অ্যান্ড রিজিওনাল প্ল্যানিং': 'Department of Urban and Regional Planning',
      'বিল্ডিং ইঞ্জিনিয়ারিং অ্যান্ড কন্সট্রাকশন ম্যানেজমেন্ট': 'Department of Building Engineering and Construction Management',
      'ইলেকট্রনিক্স অ্যান্ড কমিউনিকেশন ইঞ্জিনিয়ারিং': 'Department of Electronics and Communication Engineering',
      'টেক্সটাইল ইঞ্জিনিয়ারিং': 'Department of Textile Engineering',
      'লেদার ইঞ্জিনিয়ারিং': 'Department of Leather Engineering',
      'ফুড টেকনোলজি অ্যান্ড রুরাল ইন্ডাস্ট্রিজ': 'Department of Food Technology and Rural Industries',
      'এনার্জি সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং': 'Department of Energy Science and Engineering',
      'ম্যাথ অ্যান্ড ফিজিক্যাল সায়েন্সেস': 'Department of Math and Physical Sciences',
      'কেমিস্ট্রি': 'Department of Chemistry',
      'হিউম্যানিটিজ': 'Department of Humanities'
    };

    const departmentEnglish = departmentMapping[departmentBangla] || departmentBangla;

    // Header
    pdf.setFontSize(16);
    pdf.setFont('times', 'bold');
    pdf.text('Khulna University of Engineering & Technology', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    // Department name in English
    pdf.setFontSize(14);
    pdf.setFont('times', 'normal');
    pdf.text(departmentEnglish, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // Course details
    pdf.setFontSize(11);
    pdf.setFont('times', 'normal');
    const courseText = `Course No: ${courseInfo.courseCode || 'N/A'}    Title of the Course: ${courseInfo.courseName || 'N/A'}`;
    pdf.text(courseText, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    pdf.setFontSize(10);
    pdf.text(`Batch: ${courseInfo.batch || 'N/A'}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // Prepare table data
    const tableData = [];
    let slNo = 1;

    combinedData.forEach((student) => {
      const totalAttendance = totalClasses - student.totalAbsent;
      const attendancePercentage = ((totalAttendance / totalClasses) * 100).toFixed(1);
      
      tableData.push([
        slNo++,
        student.rollNumber,
        student.name || '', // Name column (empty as per requirement)
        totalAttendance, // Total number of attendance (present classes)
        `${attendancePercentage}%`
      ]);
    });

    // Calculate if all data can fit on one page
    const maxRowsPerPage = Math.floor((297 - currentY - 40) / 6); // A4 height - header - footer, 6mm per row
    const actualRows = Math.min(tableData.length, maxRowsPerPage);

    // Create single-page table
    autoTable(pdf, {
      startY: currentY,
      head: [[
        'SL. No.',
        'Roll No.',
        'Name of the student',
        'Total Number of Attendance',
        'Percentage of Attendance'
      ]],
      body: tableData.slice(0, actualRows), // Show only rows that fit
      theme: 'grid',
      styles: {
        fontSize: Math.min(10, Math.max(6, 180 / tableData.length)), // Dynamic font size
        cellPadding: 2,
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
        fontSize: Math.min(10, Math.max(6, 180 / tableData.length))
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },  // SL No
        1: { halign: 'center', cellWidth: 25 },  // Roll No
        2: { halign: 'left', cellWidth: 60 },    // Name
        3: { halign: 'center', cellWidth: 35 },  // Total Attendance
        4: { halign: 'center', cellWidth: 30 }   // Percentage
      },
      didParseCell: function(data) {
        // Gray out rows with less than 60% attendance
        if (data.section === 'body') {
          const rowData = tableData[data.row.index];
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
    const finalY = pdf.lastAutoTable.finalY || currentY + 100;
    const signatureY = Math.max(finalY + 10, 250); // Ensure enough space
    
    // Teacher signature section
    pdf.setFontSize(10);
    pdf.setFont('times', 'normal');
    pdf.text('Teacher\'s Name & Signature', 15, signatureY);
    
    // Two signature lines for two teachers
    pdf.text('(1)', 15, signatureY + 10);
    pdf.line(25, signatureY + 13, 85, signatureY + 13); // First signature line
    
    pdf.text('(2)', 15, signatureY + 20);
    pdf.line(25, signatureY + 23, 85, signatureY + 23); // Second signature line

    // Warning if data was truncated
    if (tableData.length > actualRows) {
      pdf.setFontSize(8);
      pdf.setTextColor(255, 0, 0); // Red text
      pdf.text(`Note: Showing first ${actualRows} of ${tableData.length} students to fit on single page`, 15, signatureY + 35);
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