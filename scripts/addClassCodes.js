// scripts/addClassCodes.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const generateClassCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function addClassCodesToExisting() {
  try {
    const classesWithoutCode = await prisma.class.findMany({
      where: { 
        OR: [
          { classCode: null },
          { classCode: '' }
        ]
      }
    })

    console.log(`Found ${classesWithoutCode.length} classes without codes`)

    for (const classItem of classesWithoutCode) {
      let classCode
      let codeExists = true
      
      // Generate unique code
      while (codeExists) {
        classCode = generateClassCode()
        const existing = await prisma.class.findFirst({
          where: { classCode }
        })
        codeExists = !!existing
      }

      await prisma.class.update({
        where: { id: classItem.id },
        data: { classCode }
      })
      
      console.log(`Added code ${classCode} to class ${classItem.courseCode} (${classItem.courseName})`)
    }

    console.log('Done! All classes now have unique codes.')
  } catch (error) {
    console.error('Error:', error)
  }
}

addClassCodesToExisting()
  .finally(() => prisma.$disconnect())