import './globals.css'

export const metadata = {
  title: 'VoiceDish Dashboard',
  description: 'Order management dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
