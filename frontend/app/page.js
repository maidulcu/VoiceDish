import './globals.css'

export const dynamic = 'force-dynamic'

async function getOrders() {
  const API_URL = process.env.API_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${API_URL}/api/orders`, { 
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    if (!res.ok) return []
    return res.json()
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return []
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'confirmed': return 'bg-blue-100 text-blue-800'
    case 'preparing': return 'bg-orange-100 text-orange-800'
    case 'delivered': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default async function Dashboard() {
  const orders = await getOrders()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">VoiceDish Orders</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No orders yet. Send a voice note to start!
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.user_phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <ul className="list-disc list-inside">
                          {JSON.parse(order.items).map((item, idx) => (
                            <li key={idx}>
                              {item.quantity}x {item.name}
                              {item.notes && <span className="text-gray-400 text-xs ml-1">({item.notes})</span>}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.total_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {order.google_maps_link ? (
                          <a href={order.google_maps_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            View Location
                          </a>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
