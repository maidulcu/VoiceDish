export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-zinc-900">VoiceDish</h1>
          <nav className="flex gap-6">
            <a href="#features" className="text-zinc-600 hover:text-zinc-900">Features</a>
            <a href="#how-it-works" className="text-zinc-600 hover:text-zinc-900">How it Works</a>
            <a href="/dashboard" className="text-zinc-600 hover:text-zinc-900">Dashboard</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h2 className="text-5xl font-bold tracking-tight text-zinc-900">
            Order food with your voice
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-zinc-600">
            Zero-latency voice ordering through WhatsApp. Customers speak their order,
            AI transcribes and extracts menu items instantly.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <a
              href="/dashboard"
              className="rounded-full bg-zinc-900 px-8 py-3 font-medium text-white transition hover:bg-zinc-800"
            >
              Merchant Dashboard
            </a>
            <a
              href="#contact"
              className="rounded-full border border-zinc-300 px-8 py-3 font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Contact Sales
            </a>
          </div>
        </section>

        <section id="features" className="bg-white py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h3 className="text-center text-3xl font-bold text-zinc-900">Features</h3>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 p-6">
                <div className="text-4xl">⚡</div>
                <h4 className="mt-4 text-xl font-semibold text-zinc-900">Zero Latency</h4>
                <p className="mt-2 text-zinc-600">Process orders instantly with Groq-powered AI transcription.</p>
              </div>
              <div className="rounded-xl border border-zinc-200 p-6">
                <div className="text-4xl">📱</div>
                <h4 className="mt-4 text-xl font-semibold text-zinc-900">WhatsApp Native</h4>
                <p className="mt-2 text-zinc-600">No app install needed. Works with the apps customers already use.</p>
              </div>
              <div className="rounded-xl border border-zinc-200 p-6">
                <div className="text-4xl">🎯</div>
                <h4 className="mt-4 text-xl font-semibold text-zinc-900">Smart Extraction</h4>
                <p className="mt-2 text-zinc-600">LLM extracts menu items, quantities, and special requests automatically.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h3 className="text-center text-3xl font-bold text-zinc-900">How it Works</h3>
            <div className="mt-12 grid gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white mx-auto">1</div>
                <p className="mt-4 text-zinc-700">Customer sends voice message via WhatsApp</p>
              </div>
              <div className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white mx-auto">2</div>
                <p className="mt-4 text-zinc-700">AI transcribes audio to text</p>
              </div>
              <div className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white mx-auto">3</div>
                <p className="mt-4 text-zinc-700">LLM extracts order details</p>
              </div>
              <div className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white mx-auto">4</div>
                <p className="mt-4 text-zinc-700">Merchant sees order in dashboard</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-zinc-200 bg-white py-12">
          <div className="mx-auto max-w-5xl px-6 text-center text-zinc-500">
            <p>&copy; 2026 VoiceDish. Built for UAE restaurants.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
