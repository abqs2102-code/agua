import { AppSidebar } from '@/components/layout/AppSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen" style={{ background: '#F5F2EC' }}>
      <AppSidebar />
      <main className="ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}