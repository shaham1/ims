import { PrismaClient } from '../../../../../generated/prisma'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { student_id, student_name, quantity = 1 } = await request.json()
    const { id } = await params
    const itemId = parseInt(id)

    // Check if item exists and is available
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
    if (quantity > item.quantity - netBorrows) {
      return NextResponse.json({ error: 'Insufficient items available to borrow' }, { status: 400 })
    }

    // Create borrow transaction
    await prisma.transaction.create({
      data: {
        student_id,
        student_name: student_name,
        type: 'borrow',
        item_id: itemId,
        quantity
      }
    })

    return NextResponse.json({ message: 'Item borrowed successfully' })
  } catch (error) {
    console.error('Error borrowing item:', error)
    return NextResponse.json({ error: 'Failed to borrow item' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
