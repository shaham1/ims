"use client"

import React, { useEffect, useState } from "react"

interface Item {
  id: number
  name: string
  category: string
  quantity: number
  quantity_available: number
}

export default function InventoryDashboard() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items")
      if (!res.ok) {
        throw new Error("Failed to fetch items")
      }
      const data = await res.json()
      setItems(data)
    } catch (err: any) {
      setError(err.message || "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleBorrow = (itemId: number) => {
    setBorrowItemId(itemId)
    setBorrowModalOpen(true)
    setBorrowStudentId('')
    setBorrowStudentName('')
    setBorrowError(null)
  }

  const handleBorrowSubmit = async () => {
    if (!borrowItemId) return
    if (!borrowStudentId.trim()) {
      setBorrowError('Please enter a student ID')
      return
    }
    setBorrowLoading(true)
    setBorrowError(null)
    try {
      const res = await fetch(`/api/items/${borrowItemId}/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: borrowStudentId, student_name: borrowStudentName, quantity: borrowQuantity })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to borrow item")
      }
      setBorrowModalOpen(false)
      setMessageText("Item borrowed successfully")
      setMessageModalOpen(true)
      fetchItems() // Refresh items
    } catch (err: any) {
      setBorrowError(err.message)
    } finally {
      setBorrowLoading(false)
    }
  }

  const closeBorrowModal = () => {
    setBorrowModalOpen(false)
    setBorrowError(null)
  }

  const handleReturn = (itemId: number) => {
    setReturnItemId(itemId)
    setReturnModalOpen(true)
    setReturnDamaged(false)
    setReturnError(null)
  }

  const handleReturnSubmit = async () => {
    if (!returnItemId) return
    setReturnLoading(true)
    setReturnError(null)
    try {
      const res = await fetch(`/api/items/${returnItemId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ damaged: returnDamaged, student_id: returnStudentId, student_name: returnStudentName, quantity: returnQuantity })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to return item")
      }
      setReturnModalOpen(false)
      setMessageText("Item returned successfully")
      setMessageModalOpen(true)
      fetchItems() // Refresh items
    } catch (err: any) {
      setReturnError(err.message)
    } finally {
      setReturnLoading(false)
    }
  }

  const closeReturnModal = () => {
    setReturnModalOpen(false)
    setReturnError(null)
  }

  const [modalOpen, setModalOpen] = React.useState(false)
  const [modalTransactions, setModalTransactions] = React.useState<any[]>([])
  const [modalLoading, setModalLoading] = React.useState(false)
  const [modalError, setModalError] = React.useState<string | null>(null)

  // Borrow modal states
  const [borrowModalOpen, setBorrowModalOpen] = React.useState(false)
  const [borrowStudentId, setBorrowStudentId] = React.useState('')
  const [borrowStudentName, setBorrowStudentName] = React.useState('')
  const [borrowQuantity, setBorrowQuantity] = React.useState(1)
  const [borrowLoading, setBorrowLoading] = React.useState(false)
  const [borrowError, setBorrowError] = React.useState<string | null>(null)

  // Return modal states
  const [returnModalOpen, setReturnModalOpen] = React.useState(false)
  const [returnStudentId, setReturnStudentId] = React.useState('')
  const [returnStudentName, setReturnStudentName] = React.useState('')
  const [returnQuantity, setReturnQuantity] = React.useState(1)
  const [returnDamaged, setReturnDamaged] = React.useState(false)
  const [returnLoading, setReturnLoading] = React.useState(false)
  const [returnError, setReturnError] = React.useState<string | null>(null)

  // Message modal states
  const [messageModalOpen, setMessageModalOpen] = React.useState(false)
  const [messageText, setMessageText] = React.useState('')

  // Current item IDs for modals
  const [borrowItemId, setBorrowItemId] = React.useState<number | null>(null)
  const [returnItemId, setReturnItemId] = React.useState<number | null>(null)

  const openTransactionsModal = async (itemId: number) => {
    setModalOpen(true)
    setModalLoading(true)
    setModalError(null)
    try {
      // Fix: Use encodeURIComponent for itemId in URL
      const res = await fetch(`/api/items/${encodeURIComponent(itemId)}/transactions`)
      if (!res.ok) {
        throw new Error('Failed to fetch transactions')
      }
      const data = await res.json()
      setModalTransactions(data)
    } catch (err: any) {
      setModalError(err.message || 'Unknown error')
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalTransactions([])
    setModalError(null)
  }

  if (loading) {
    return <div>Loading inventory...</div>
  }

  if (error) {
    return <div>Error loading inventory: {error}</div>
  }

  return (
    <div className="p-4 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-red-400">Inventory Management</h1>
      <table className="min-w-full border border-red-500">
        <thead>
          <tr className="bg-gray-800">
            <th className="border border-red-500 px-4 py-2 text-left text-red-300">ID</th>
            <th className="border border-red-500 px-4 py-2 text-left text-red-300">Name</th>
            <th className="border border-red-500 px-4 py-2 text-left text-red-300">Category</th>
            <th className="border border-red-500 px-4 py-2 text-left text-red-300">Quantity</th>
            <th className="border border-red-500 px-4 py-2 text-left text-red-300">Available</th>
            <th className="border border-red-500 px-4 py-2 text-left text-red-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="border border-red-500 px-4 py-2 text-center text-gray-300">
                No items found.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-700">
                <td className="border border-red-500 px-4 py-2 text-gray-100">{item.id}</td>
                <td className="border border-red-500 px-4 py-2 text-gray-100">{item.name}</td>
                <td className="border border-red-500 px-4 py-2 text-gray-100">{item.category}</td>
                <td className="border border-red-500 px-4 py-2 text-gray-100">{item.quantity}</td>
                <td className="border border-red-500 px-4 py-2 text-gray-100">{item.quantity_available}</td>
                <td className="border border-red-500 px-4 py-2 text-gray-100">
                  <button onClick={() => handleBorrow(item.id)} disabled={item.quantity_available <= 0} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded mr-2 disabled:opacity-50">Borrow</button>
                  <button onClick={() => handleReturn(item.id)} disabled={item.quantity_available >= item.quantity} className="bg-gray-700 hover:bg-gray-800 text-gray-100 px-3 py-1 rounded mr-2 disabled:opacity-50">Return</button>
                  <button onClick={() => openTransactionsModal(item.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Transactions</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto relative">
            <h2 className="text-xl font-bold mb-4 text-red-400">Transaction History</h2>
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">×</button>
            {modalLoading ? (
              <div>Loading transactions...</div>
            ) : modalError ? (
              <div>Error: {modalError}</div>
            ) : (
              <table className="min-w-full border border-red-500">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="border border-red-500 px-4 py-2 text-left text-red-300">ID</th>
                    <th className="border border-red-500 px-4 py-2 text-left text-red-300">Student ID</th>
                    <th className="border border-red-500 px-4 py-2 text-left text-red-300">Student Name</th>
                    <th className="border border-red-500 px-4 py-2 text-left text-red-300">Time</th>
                    <th className="border border-red-500 px-4 py-2 text-left text-red-300">Type</th>
                    <th className="border border-red-500 px-4 py-2 text-left text-red-300">Quantity</th>
                    <th className="border border-red-500 px-4 py-2 text-left text-red-300">Damaged</th>
                  </tr>
                </thead>
                <tbody>
                  {modalTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-red-500 px-4 py-2 text-center text-gray-300">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    modalTransactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-gray-600">
                        <td className="border border-red-500 px-4 py-2 text-gray-100">{tx.id}</td>
                        <td className="border border-red-500 px-4 py-2 text-gray-100">{tx.student_id}</td>
                        <td className="border border-red-500 px-4 py-2 text-gray-100">{tx.student_name}</td>
                        <td className="border border-red-500 px-4 py-2 text-gray-100">{new Date(tx.time).toLocaleString()}</td>
                        <td className="border border-red-500 px-4 py-2 text-gray-100">{tx.type}</td>
                        <td className="border border-red-500 px-4 py-2 text-gray-100">{tx.quantity}</td>
                        <td className="border border-red-500 px-4 py-2 text-gray-100">{tx.damaged ? 'Yes' : 'No'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {borrowModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-red-400">Borrow Item</h2>
            <button onClick={closeBorrowModal} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">×</button>
      <div className="mb-4">
        <label className="block text-gray-100 mb-2">Student ID:</label>
        <input
          type="text"
          value={borrowStudentId}
          onChange={(e) => setBorrowStudentId(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-red-500 rounded"
          placeholder="Enter student ID"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-100 mb-2">Student Name:</label>
        <input
          type="text"
          value={borrowStudentName}
          onChange={(e) => setBorrowStudentName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-red-500 rounded"
          placeholder="Enter student name"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-100 mb-2">Quantity:</label>
        <input
          type="number"
          min={1}
          value={borrowQuantity}
          onChange={(e) => setBorrowQuantity(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-red-500 rounded"
          placeholder="Enter quantity"
        />
      </div>
      {borrowError && <div className="mb-4 text-red-400">{borrowError}</div>}
      <button
        onClick={handleBorrowSubmit}
        disabled={borrowLoading}
        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {borrowLoading ? 'Borrowing...' : 'Borrow'}
      </button>
          </div>
        </div>
      )}

      {returnModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-red-400">Return Item</h2>
            <button onClick={closeReturnModal} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">×</button>
            <div className="mb-4">
              <label className="block text-gray-100 mb-2">Student ID:</label>
              <input
                type="text"
                value={returnStudentId}
                onChange={(e) => setReturnStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-red-500 rounded"
                placeholder="Enter student ID"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-100 mb-2">Student Name:</label>
              <input
                type="text"
                value={returnStudentName}
                onChange={(e) => setReturnStudentName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-red-500 rounded"
                placeholder="Enter student name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-100 mb-2">Quantity:</label>
              <input
                type="number"
                min={1}
                value={returnQuantity}
                onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-red-500 rounded"
                placeholder="Enter quantity"
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center text-gray-100">
                <input
                  type="checkbox"
                  checked={returnDamaged}
                  onChange={(e) => setReturnDamaged(e.target.checked)}
                  className="mr-2"
                />
                Item is damaged
              </label>
            </div>
            {returnError && <div className="mb-4 text-red-400">{returnError}</div>}
            <button
              onClick={handleReturnSubmit}
              disabled={returnLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {returnLoading ? 'Returning...' : 'Return'}
            </button>
          </div>
        </div>
      )}

      {messageModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-red-400">Message</h2>
            <p className="text-gray-100 mb-4">{messageText}</p>
            <button
              onClick={() => setMessageModalOpen(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
