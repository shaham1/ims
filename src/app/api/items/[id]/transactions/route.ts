import { PrismaClient } from '../../../../../generated/prisma'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const itemId = parseInt(id)
    const transactions = await prisma.transaction.findMany({
      where: { item_id: itemId },
      orderBy: { time: 'desc' }
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
