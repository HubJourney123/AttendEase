import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('classId')

  try {
    const attendance = await prisma.attendance.findMany({
      where: { classId },
      orderBy: [{ date: 'asc' }, { rollNumber: 'asc' }]
    })
    return NextResponse.json(attendance)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { classId, date, rollNumber, status } = body

    const attendance = await prisma.attendance.upsert({
      where: {
        classId_date_rollNumber: {
          classId,
          date: new Date(date),
          rollNumber
        }
      },
      update: { status },
      create: {
        classId,
        date: new Date(date),
        rollNumber,
        status
      }
    })

    return NextResponse.json(attendance)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 })
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { classId, date } = body

    if (!classId || !date) {
      return NextResponse.json(
        { error: "Missing classId or date" },
        { status: 400 }
      )
    }

    // Delete all attendance records for the specified date and class
    const deletedRecords = await prisma.attendance.deleteMany({
      where: {
        classId: classId,
        date: new Date(date)
      }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: deletedRecords.count,
      message: `Deleted ${deletedRecords.count} attendance records for date ${new Date(date).toLocaleDateString()}` 
    })

  } catch (error) {
    console.error('Error deleting attendance:', error)
    return NextResponse.json(
      { error: "Failed to delete attendance records" },
      { status: 500 }
    )
  }
}