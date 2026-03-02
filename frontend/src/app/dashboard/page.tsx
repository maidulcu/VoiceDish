'use client';

import { useEffect, useState } from 'react';

interface Order {
  id: number;
  created_at: string;
  customer_id: string;
  phone_number: string;
  transcript: string;
  order_json: string;
  status: string;
  total: string;
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const eventSource = new EventSource('http://localhost:8080/api/orders/stream');
    
    eventSource.onmessage = (event) => {
      console.log('SSE event:', event.data);
      fetchOrders();
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/orders');
      const data = await res.json();
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`http://localhost:8080/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-zinc-600">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <h1 className="text-2xl font-bold text-zinc-900">VoiceDish Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-zinc-900">Orders</h2>
          <p className="text-zinc-600">{orders.length} total orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center border border-zinc-200">
            <p className="text-zinc-500">No orders yet. Customers can start ordering via WhatsApp!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg bg-white border border-zinc-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-zinc-900">Order #{order.id}</h3>
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {new Date(order.created_at).toLocaleString()} • {order.phone_number}
                    </p>
                    <div className="mt-4 rounded bg-zinc-50 p-4">
                      <pre className="text-sm text-zinc-700 whitespace-pre-wrap">{order.order_json}</pre>
                    </div>
                    {order.transcript && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-700">
                          View transcript
                        </summary>
                        <p className="mt-2 text-sm text-zinc-600 italic">{order.transcript}</p>
                      </details>
                    )}
                    {order.total && order.total !== '0' && (
                      <p className="mt-3 text-lg font-semibold text-zinc-900">Total: {order.total} AED</p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(order.id, 'accepted')}
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, 'rejected')}
                          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {order.status === 'accepted' && (
                      <button
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Mark Ready
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
