// src/app/api/classes/by-code/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: "Class code required" }, { status: 400 })
  }

  // Validate code format (6 alphanumeric characters)
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid class code format" }, { status: 400 })
  }

  try {
    const classData = await prisma.class.findFirst({
      where: { classCode: code },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Return class data (this will be used by the calculator)
    return NextResponse.json(classData)
  } catch (error) {
    console.error('Error fetching class by code:', error)
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 })
  }
}