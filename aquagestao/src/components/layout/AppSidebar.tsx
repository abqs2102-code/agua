'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  Settings,
  LogOut,
  Droplets,
  Printer,
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['admin'],
  },
  {
    label: 'Clientes',
    href: '/admin/clientes',
    icon: Users,
    roles: ['admin', 'atendente'],
  },
  {
    label: 'Galões',
    href: '/admin/galoes',
    icon: Package,
    roles: ['admin', 'atendente'],
  },
  {
    label: 'Entregas',
    href: '/admin/entregas',
    icon: Truck,
    roles: ['admin', 'atendente'],
  },
  {
    label: 'Selos',
    href: '/atendente/selos',
    icon: Printer,
    roles: ['admin', 'atendente'],
  },
  {
    label: 'Configurações',
    href: '/admin/configuracoes',
    icon: Settings,
    roles: ['admin'],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useUser()

  const filteredItems = navItems.filter(item =>
    item.roles.includes(profile?.role ?? '')
  )

  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-40"
      style={{ background: '#061525' }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Droplets size={22} style={{ color: '#38BDF8' }} />
          <span className="text-xl font-bold text-white">
            Aqua<span style={{ color: '#38BDF8' }}>Gestão</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? 'rgba(13,146,120,0.2)' : 'transparent',
                color: active ? '#0D9278' : 'rgba(255,255,255,0.6)',
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-3 px-3">
          <p className="text-xs text-white/40 uppercase tracking-wider">
            {profile?.role}
          </p>
          <p className="text-sm text-white/80 font-medium truncate">
            {profile?.nome}
          </p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}