import { PrismaClient } from '../../../generated/prisma'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const items = await prisma.item.findMany()
    const transactions = await prisma.transaction.findMany({
      orderBy: { time: 'desc' }
    })

    // Map item id to latest transaction with student_id and calculate net borrows
    const itemIdToStudentId = new Map<number, string | null>()
    const itemIdToNetBorrows = new Map<number, number>()
    for (const tx of transactions) {
      if (!itemIdToStudentId.has(tx.item_id)) {
        itemIdToStudentId.set(tx.item_id, tx.student_id)
      }
      if (tx.type === 'borrow') {
        itemIdToNetBorrows.set(tx.item_id, (itemIdToNetBorrows.get(tx.item_id) || 0) + tx.quantity)
      } else if (tx.type === 'return') {
        itemIdToNetBorrows.set(tx.item_id, (itemIdToNetBorrows.get(tx.item_id) || 0) - tx.quantity)
      }
    }

    const itemsWithData = items.map(item => {
      const netBorrows = itemIdToNetBorrows.get(item.id) || 0
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        quantity_available: item.quantity - netBorrows
      }
    })

    return NextResponse.json(itemsWithData)
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
