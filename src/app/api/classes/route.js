import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('GET /api/classes - Session:', session)
    
    if (!session?.user?.email) {
      console.log('No session or email found')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from database using email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    console.log('User found:', user)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const classes = await prisma.class.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })
    console.log('Classes found:', classes.length)
    
    return NextResponse.json(classes || [])
  } catch (error) {
    console.error('Error in GET /api/classes:', error)
    return NextResponse.json(
      { error: "Failed to fetch classes", details: error.message }, 
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('POST /api/classes - Session:', session)
    
    if (!session?.user?.email) {
      console.log('No session or email found')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from database using email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    console.log('User found:', user)

    if (!user) {
      console.log('User not found in database')
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    console.log('Request body:', body)

    // Validate required fields
    if (!body.courseCode || !body.courseName || !body.batch || 
        !body.startingRoll || !body.endingRoll) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      )
    }

    const newClass = await prisma.class.create({
      data: {
        courseCode: body.courseCode,
        courseName: body.courseName,
        batch: body.batch,
        startingRoll: body.startingRoll,
        endingRoll: body.endingRoll,
        excludedRolls: body.excludedRolls || null,
        userId: user.id
      }
    })
    console.log('Class created:', newClass)
    
    return NextResponse.json(newClass)
  } catch (error) {
    console.error('Error in POST /api/classes - Full error:', error)
    return NextResponse.json(
      { error: "Failed to create class", details: error.message }, 
      { status: 500 }
    )
  }
}