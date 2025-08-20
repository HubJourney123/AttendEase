'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchClasses()
    }
  }, [status, router])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      const data = await response.json()
      setClasses(data)
      if (data.length > 0) {
        setSelectedClass(data[0])
        fetchAttendanceData(data[0].id)
      }
      setLoading(false)
    } catch (error) {
      toast.error('Failed to fetch classes')
      setLoading(false)
    }
  }

  const fetchAttendanceData = async (classId) => {
    try {
      const response = await fetch(`/api/attendance?classId=${classId}`)
      const data = await response.json()
      setAttendanceData(data)
      processAnalytics(data, classes.find(c => c.id === classId))
    } catch (error) {
      toast.error('Failed to fetch attendance data')
    }
  }

  const processAnalytics = (data, classInfo) => {
    if (!classInfo || !data || data.length === 0) {
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

    // Process date-wise attendance (Present students per date)
    const dateGroups = {}
    const studentStats = {}
    
    // Initialize student stats
    rolls.forEach(roll => {
      studentStats[roll] = { 
        roll, 
        present: 0, 
        absent: 0, 
        late: 0, 
        total: 0,
        percentage: 0 
      }
    })

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
      
      // Count present and late students (late counts as 0.5 present)
      if (record.status === 'P') {
        dateGroups[dateStr].presentCount++
        studentStats[record.rollNumber].present++
      } else if (record.status === 'L') {
        dateGroups[dateStr].presentCount += 0.5
        studentStats[record.rollNumber].late++
      } else {
        studentStats[record.rollNumber].absent++
      }
      
      studentStats[record.rollNumber].total++
    })

    // Calculate unique dates (total classes)
    const uniqueDates = [...new Set(data.map(r => new Date(r.date).toDateString()))]
    const totalClasses = uniqueDates.length

    // Calculate student percentages
    Object.values(studentStats).forEach(student => {
      if (totalClasses > 0) {
        student.total = totalClasses
        const effectivePresent = student.present + (student.late * 0.5)
        student.percentage = ((effectivePresent / totalClasses) * 100).toFixed(1)
      }
    })

    // Sort date-wise attendance by date
    const dateWiseAttendance = Object.values(dateGroups)
      .sort((a, b) => a.dateObj - b.dateObj)
      .map(item => ({
        date: item.date,
        presentStudents: Math.round(item.presentCount),
        totalStudents: item.totalStudents
      }))

    // Get perfect attendance students (100%)
    const perfectAttendance = Object.values(studentStats)
      .filter(s => parseFloat(s.percentage) === 100)
      .sort((a, b) => a.roll.localeCompare(b.roll))

    // Get at-risk students (below 60%)
    const atRiskStudents = Object.values(studentStats)
      .filter(s => parseFloat(s.percentage) < 60)
      .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage))

    // Calculate attendance distribution for pie chart
    const distribution = {
      excellent: 0,  // 90-100%
      good: 0,       // 80-89%
      average: 0,    // 70-79%
      poor: 0,       // 60-69%
      critical: 0    // Below 60%
    }

    Object.values(studentStats).forEach(student => {
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
    ].filter(item => item.value > 0) // Only show categories with students

    // Calculate average attendance
    const totalPresent = data.filter(r => r.status === 'P').length
    const totalLate = data.filter(r => r.status === 'L').length
    const totalRecords = totalClasses * rolls.length
    const effectiveTotalPresent = totalPresent + (totalLate * 0.5)
    const overallAttendanceRate = totalRecords > 0 
      ? ((effectiveTotalPresent / totalRecords) * 100).toFixed(1) 
      : 0

    const averageDailyAttendance = totalClasses > 0 
      ? (effectiveTotalPresent / totalClasses).toFixed(1)
      : 0

    setAnalyticsData({
      totalClasses,
      totalStudents: rolls.length,
      averageAttendance: averageDailyAttendance,
      dateWiseAttendance: dateWiseAttendance.slice(-30), // Last 30 classes
      attendanceDistribution,
      perfectAttendance,
      atRiskStudents,
      overallAttendanceRate
    })
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
            onChange={(e) => {
              const cls = classes.find(c => c.id === e.target.value)
              setSelectedClass(cls)
              if (cls) fetchAttendanceData(cls.id)
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.courseCode} - {cls.courseName} ({cls.batch})
              </option>
            ))}
          </select>
        </div>

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

        
        <div className="col-span-1 md:col-span-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Attendance Marks Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { range: '≥90% (100 marks)', count: 0, icon: '🏆' },
      { range: '85-89% (90 marks)', count: 0, icon: '⭐' },
      { range: '80-84% (80 marks)', count: 0, icon: '✨' },
      { range: '75-79% (70 marks)', count: 0, icon: '👍' },
      { range: '70-74% (60 marks)', count: 0, icon: '📊' },
      { range: '65-69% (50 marks)', count: 0, icon: '📈' },
      { range: '60-64% (40 marks)', count: 0, icon: '⚠️' },
      { range: '<60% (0 marks)', count: 0, icon: '❌' }
    ].map((item, index) => {
      // Calculate actual count from studentStats
      let count = 0
      Object.values(studentStats || {}).forEach(student => {
        const pct = parseFloat(student.percentage)
        if (index === 0 && pct >= 90) count++
        else if (index === 1 && pct >= 85 && pct < 90) count++
        else if (index === 2 && pct >= 80 && pct < 85) count++
        else if (index === 3 && pct >= 75 && pct < 80) count++
        else if (index === 4 && pct >= 70 && pct < 75) count++
        else if (index === 5 && pct >= 65 && pct < 70) count++
        else if (index === 6 && pct >= 60 && pct < 65) count++
        else if (index === 7 && pct < 60) count++
      })
      
      return (
        <div key={index} className="bg-white/20 backdrop-blur rounded-lg p-3">
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
          {/* Date-wise Attendance Graph - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Attendance Trend</h3>
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
          </div>

          {/* Attendance Distribution Pie Chart */}
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
          {/* Perfect Attendance Students */}
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
                <p className="text-gray-500 text-center py-8">No at-risk students</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}