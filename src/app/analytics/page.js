'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts'

export default function Analytics() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [studentStats, setStudentStats] = useState({})
  const [analyticsData, setAnalyticsData] = useState({
    totalClasses: 0,
    totalStudents: 0,
    averageAttendance: 0,
    dateWiseAttendance: [],
    attendanceDistribution: [],
    perfectAttendance: [],
    atRiskStudents: [],
    overallAttendanceRate: 0
  })

  // Calculate attendance marks
  const calculateAttendanceMarks = (percentage) => {
    if (percentage >= 90) return 100
    if (percentage >= 85) return 90
    if (percentage >= 80) return 80
    if (percentage >= 75) return 70
    if (percentage >= 70) return 60
    if (percentage >= 65) return 50
    if (percentage >= 60) return 40
    return 0
  }

  // Process analytics data
  const processAnalytics = useCallback((data, classInfo) => {
    console.log('Processing analytics with:', { dataLength: data?.length, classInfo })
    
    if (!classInfo || !data) {
      console.log('No class info or data available')
      setAnalyticsData({
        totalClasses: 0,
        totalStudents: 0,
        averageAttendance: 0,
        dateWiseAttendance: [],
        attendanceDistribution: [],
        perfectAttendance: [],
        atRiskStudents: [],
        overallAttendanceRate: 0
      })
      return
    }

    // Generate roll numbers
    const rolls = []
    const start = parseInt(classInfo.startingRoll)
    const end = parseInt(classInfo.endingRoll)
    const excluded = classInfo.excludedRolls 
      ? classInfo.excludedRolls.split(',').map(r => r.trim())
      : []
    
    for (let i = start; i <= end; i++) {
      const roll = i.toString()
      if (!excluded.includes(roll)) {
        rolls.push(roll)
      }
    }

    console.log('Generated rolls:', rolls.length)

    // If no attendance data yet, show empty state with student count
    if (data.length === 0) {
      setAnalyticsData({
        totalClasses: 0,
        totalStudents: rolls.length,
        averageAttendance: 0,
        dateWiseAttendance: [],
        attendanceDistribution: [],
        perfectAttendance: [],
        atRiskStudents: rolls.map(roll => ({
          roll,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
          percentage: '0.0'
        })),
        overallAttendanceRate: 0
      })
      setStudentStats({})
      return
    }

    // Process date-wise attendance
    const dateGroups = {}
    const studentStatsLocal = {}
    
    // Initialize student stats for all rolls
    rolls.forEach(roll => {
      studentStatsLocal[roll] = { 
        roll, 
        present: 0, 
        absent: 0, 
        late: 0, 
        total: 0,
        percentage: '0.0'
      }
    })

    // Get unique dates
    const uniqueDates = new Set()
    data.forEach(record => {
      const dateStr = new Date(record.date).toDateString()
      uniqueDates.add(dateStr)
    })
    const totalClasses = uniqueDates.size

    console.log('Total unique classes:', totalClasses)

    // Process attendance records
    data.forEach(record => {
      const date = new Date(record.date)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = { 
          date: dateStr, 
          presentCount: 0,
          totalStudents: rolls.length,
          dateObj: date
        }
      }
      
      // Update date groups
      if (record.status === 'P') {
        dateGroups[dateStr].presentCount++
        if (studentStatsLocal[record.rollNumber]) {
          studentStatsLocal[record.rollNumber].present++
        }
      } else if (record.status === 'L') {
        dateGroups[dateStr].presentCount += 0.5
        if (studentStatsLocal[record.rollNumber]) {
          studentStatsLocal[record.rollNumber].late++
        }
      } else {
        if (studentStatsLocal[record.rollNumber]) {
          studentStatsLocal[record.rollNumber].absent++
        }
      }
    })

    // Calculate student percentages
    Object.values(studentStatsLocal).forEach(student => {
      if (totalClasses > 0) {
        student.total = totalClasses
        const effectivePresent = student.present + (student.late * 0.5)
        student.percentage = ((effectivePresent / totalClasses) * 100).toFixed(1)
      }
    })

    setStudentStats(studentStatsLocal)

    // Sort date-wise attendance
    const dateWiseAttendance = Object.values(dateGroups)
      .sort((a, b) => a.dateObj - b.dateObj)
      .map(item => ({
        date: item.date,
        presentStudents: Math.round(item.presentCount),
        totalStudents: item.totalStudents
      }))

    console.log('Date-wise attendance:', dateWiseAttendance)

    // Get perfect attendance students
    const perfectAttendance = Object.values(studentStatsLocal)
      .filter(s => parseFloat(s.percentage) === 100)
      .sort((a, b) => a.roll.localeCompare(b.roll))

    // Get at-risk students
    const atRiskStudents = Object.values(studentStatsLocal)
      .filter(s => parseFloat(s.percentage) < 60)
      .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage))

    // Calculate attendance distribution
    const distribution = {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0,
      critical: 0
    }

    Object.values(studentStatsLocal).forEach(student => {
      const pct = parseFloat(student.percentage)
      if (pct >= 90) distribution.excellent++
      else if (pct >= 80) distribution.good++
      else if (pct >= 70) distribution.average++
      else if (pct >= 60) distribution.poor++
      else distribution.critical++
    })

    const attendanceDistribution = [
      { name: '90-100%', value: distribution.excellent, color: '#10B981' },
      { name: '80-89%', value: distribution.good, color: '#3B82F6' },
      { name: '70-79%', value: distribution.average, color: '#F59E0B' },
      { name: '60-69%', value: distribution.poor, color: '#FB923C' },
      { name: 'Below 60%', value: distribution.critical, color: '#EF4444' }
    ].filter(item => item.value > 0)

    // Calculate averages
    const totalPresent = data.filter(r => r.status === 'P').length
    const totalLate = data.filter(r => r.status === 'L').length
    const totalRecords = totalClasses * rolls.length
    const effectiveTotalPresent = totalPresent + (totalLate * 0.5)
    const overallAttendanceRate = totalRecords > 0 
      ? ((effectiveTotalPresent / totalRecords) * 100).toFixed(1) 
      : '0.0'

    const averageDailyAttendance = totalClasses > 0 
      ? (effectiveTotalPresent / totalClasses).toFixed(1)
      : '0.0'

    const finalData = {
      totalClasses,
      totalStudents: rolls.length,
      averageAttendance: averageDailyAttendance,
      dateWiseAttendance: dateWiseAttendance.slice(-30),
      attendanceDistribution: attendanceDistribution.length > 0 ? attendanceDistribution : [
        { name: 'No Data', value: 1, color: '#9CA3AF' }
      ],
      perfectAttendance,
      atRiskStudents,
      overallAttendanceRate
    }

    console.log('Final analytics data:', finalData)
    setAnalyticsData(finalData)
  }, [])

  // Fetch attendance data
  const fetchAttendanceData = useCallback(async (classId, classInfo) => {
    console.log('Fetching attendance for class:', classId)
    try {
      const response = await fetch(`/api/attendance?classId=${classId}`)
      const data = await response.json()
      console.log('Fetched attendance data:', data)
      
      if (Array.isArray(data)) {
        setAttendanceData(data)
        processAnalytics(data, classInfo)
      } else {
        console.error('Invalid attendance data format:', data)
        processAnalytics([], classInfo)
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
      toast.error('Failed to fetch attendance data')
      processAnalytics([], classInfo)
    }
  }, [processAnalytics])

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch('/api/classes')
      const data = await response.json()
      console.log('Fetched classes:', data)
      
      if (Array.isArray(data) && data.length > 0) {
        setClasses(data)
        setSelectedClass(data[0])
        // Pass the class info directly to fetchAttendanceData
        await fetchAttendanceData(data[0].id, data[0])
      } else {
        console.log('No classes found')
        setClasses([])
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch classes:', error)
      toast.error('Failed to fetch classes')
      setLoading(false)
    }
  }, [fetchAttendanceData])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchClasses()
    }
  }, [status, router, fetchClasses])

  // Handle class selection change
  const handleClassChange = async (classId) => {
    const cls = classes.find(c => c.id === classId)
    console.log('Selected class:', cls)
    setSelectedClass(cls)
    if (cls) {
      await fetchAttendanceData(cls.id, cls)
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm">
              <span style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If no classes available
  if (classes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Track attendance patterns and student performance</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Classes Found</h2>
            <p className="text-gray-600 mb-6">Create a class first to view analytics</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track attendance patterns and student performance</p>
        </div>

        {/* Class Selector */}
        <div className="mb-6">
          <select
            value={selectedClass?.id || ''}
            onChange={(e) => handleClassChange(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.courseCode} - {cls.courseName} ({cls.batch})
              </option>
            ))}
          </select>
        </div>

        {/* Rest of your component remains the same... */}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-bl-full"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📚</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  Total
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Classes</h3>
              <p className="text-2xl font-bold text-gray-800">{analyticsData.totalClasses}</p>
              <p className="text-xs text-gray-500 mt-1">Conducted so far</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10 rounded-bl-full"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">👥</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  Students
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Students</h3>
              <p className="text-2xl font-bold text-gray-800">{analyticsData.totalStudents}</p>
              <p className="text-xs text-gray-500 mt-1">Enrolled in class</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 opacity-10 rounded-bl-full"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📊</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white">
                  Average
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Avg Daily Attendance</h3>
              <p className="text-2xl font-bold text-gray-800">{analyticsData.averageAttendance}</p>
              <p className="text-xs text-gray-500 mt-1">Students per class</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-600 opacity-10 rounded-bl-full"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">✅</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  Overall
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Overall Attendance</h3>
              <p className="text-2xl font-bold text-gray-800">{analyticsData.overallAttendanceRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Class average</p>
            </div>
          </div>
        </div>

        {/* Attendance Marks Distribution Card */}
        <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Attendance Marks Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { range: '≥90% (100 marks)', icon: '🏆', index: 0 },
              { range: '85-89% (90 marks)', icon: '⭐', index: 1 },
              { range: '80-84% (80 marks)', icon: '✨', index: 2 },
              { range: '75-79% (70 marks)', icon: '👍', index: 3 },
              { range: '70-74% (60 marks)', icon: '📊', index: 4 },
              { range: '65-69% (50 marks)', icon: '📈', index: 5 },
              { range: '60-64% (40 marks)', icon: '⚠️', index: 6 },
              { range: '<60% (0 marks)', icon: '❌', index: 7 }
            ].map((item) => {
              let count = 0
              Object.values(studentStats || {}).forEach(student => {
                const pct = parseFloat(student.percentage)
                if (item.index === 0 && pct >= 90) count++
                else if (item.index === 1 && pct >= 85 && pct < 90) count++
                else if (item.index === 2 && pct >= 80 && pct < 85) count++
                else if (item.index === 3 && pct >= 75 && pct < 80) count++
                else if (item.index === 4 && pct >= 70 && pct < 75) count++
                else if (item.index === 5 && pct >= 65 && pct < 70) count++
                else if (item.index === 6 && pct >= 60 && pct < 65) count++
                else if (item.index === 7 && pct < 60) count++
              })
              
              return (
                <div key={item.index} className="bg-white/20 backdrop-blur rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                  <p className="text-xs">{item.range}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Date-wise Attendance Graph */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Attendance Trend</h3>
            {analyticsData.dateWiseAttendance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.dateWiseAttendance}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Number of Present Students', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="presentStudents"
                    name="Present Students"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorPresent)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No attendance data available yet
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.attendanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-1">
              {analyticsData.attendanceDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value} students</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Student Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Perfect Attendance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Perfect Attendance (100%)</h3>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                {analyticsData.perfectAttendance.length} Students
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {analyticsData.perfectAttendance.length > 0 ? (
                <div className="space-y-2">
                  {analyticsData.perfectAttendance.map((student, index) => (
                    <div key={student.roll} className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-800">{student.roll}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-600 font-semibold">100%</span>
                        <svg className="w-5 h-5 text-green-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No students with perfect attendance</p>
              )}
            </div>
          </div>

          {/* At Risk Students */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">At Risk Students (&lt;60%)</h3>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                {analyticsData.atRiskStudents.length} Students
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {analyticsData.atRiskStudents.length > 0 ? (
                <div className="space-y-2">
                {analyticsData.atRiskStudents.map((student, index) => (
                   <div key={student.roll} className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                     <div className="flex items-center">
                       <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                         !
                       </div>
                       <div>
                         <span className="font-medium text-gray-800">{student.roll}</span>
                         <div className="text-xs text-gray-500">
                           P: {student.present} | A: {student.absent} | L: {student.late}
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center">
                       <span className="text-red-600 font-semibold">{student.percentage}%</span>
                       <svg className="w-5 h-5 text-red-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                       </svg>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-gray-500 text-center py-8">
                 {analyticsData.totalClasses === 0 
                   ? "No attendance data yet" 
                   : "No at-risk students"}
               </p>
             )}
           </div>
         </div>
       </div>

       {/* Summary Statistics (Additional info when no data) */}
       {analyticsData.totalClasses === 0 && (
         <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
           <div className="flex items-start">
             <svg className="w-6 h-6 text-yellow-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <div>
               <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Attendance Data Yet</h3>
               <p className="text-yellow-700">
                 Start taking attendance in the class "{selectedClass?.courseCode}" to see analytics.
                 Once you mark attendance, you'll see:
               </p>
               <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                 <li>• Daily attendance trends</li>
                 <li>• Student performance distribution</li>
                 <li>• Automatic marks calculation based on attendance percentage</li>
                 <li>• Identification of at-risk students</li>
               </ul>
               <button
                 onClick={() => router.push(`/class/${selectedClass?.id}`)}
                 className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition"
               >
                 Go to Attendance Sheet
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   </div>
 )
}