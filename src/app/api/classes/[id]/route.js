import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET single class
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const classData = await prisma.class.findFirst({
      where: { 
        id: params.id,
        user: { email: session.user.email }
      }
    })
    
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }
    
    return NextResponse.json(classData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 })
  }
}

// UPDATE class
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const updatedClass = await prisma.class.update({
      where: { id: params.id },
      data: {
        courseCode: body.courseCode,
        courseName: body.courseName,
        batch: body.batch,
        startingRoll: body.startingRoll,
        endingRoll: body.endingRoll,
        excludedRolls: body.excludedRolls || null
      }
    })
    
    return NextResponse.json(updatedClass)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 })
  }
}

// DELETE class
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // This will also delete related attendance records due to cascade
    await prisma.class.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: "Class deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 })
  }
}