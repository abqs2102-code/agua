export default function EntregadorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen"
      style={{ background: '#F5F2EC' }}
    >
      {/* Header mobile */}
      <div
        className="fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: '#061525' }}
      >
        <div className="text-lg font-bold text-white">
          Aqua<span style={{ color: '#38BDF8' }}>Gestão</span>
        </div>
        <div
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{ background: 'rgba(56,189,248,0.15)', color: '#38BDF8' }}
        >
          Entregador
        </div>
      </div>

      {/* Conteúdo com padding do header */}
      <div className="pt-14 pb-6">
        {children}
      </div>
    </div>
  )
}