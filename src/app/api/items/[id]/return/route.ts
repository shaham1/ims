import { PrismaClient } from '../../../../../generated/prisma'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const itemId = parseInt(id)

    // Check if item exists
    const item = await prisma.item.findUnique({ where: { id: itemId } })
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Calculate net borrows
    const transactions = await prisma.transaction.findMany({
      where: { item_id: itemId }
    })
    let netBorrows = 0
    for (const tx of transactions) {
      if (tx.type === 'borrow') netBorrows += tx.quantity
      else if (tx.type === 'return') netBorrows -= tx.quantity
    }
    if (netBorrows <= 0) {
      return NextResponse.json({ error: 'No items to return' }, { status: 400 })
    }

    // Parse damaged flag, quantity, student_id, and student_name from request body
    const { damaged = false, quantity = 1, student_id, student_name } = await request.json()

    if (!student_id || !student_name) {
      return NextResponse.json({ error: 'Student ID and name are required' }, { status: 400 })
    }

    if (quantity > netBorrows) {
      return NextResponse.json({ error: 'Return quantity exceeds borrowed quantity' }, { status: 400 })
    }

    // Create return transaction
    await prisma.transaction.create({
      data: {
        student_id,
        student_name,
        type: 'return',
        item_id: itemId,
        damaged,
        quantity
      }
    })

    return NextResponse.json({ message: 'Item returned successfully' })
  } catch (error) {
    console.error('Error returning item:', error)
    return NextResponse.json({ error: 'Failed to return item' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
