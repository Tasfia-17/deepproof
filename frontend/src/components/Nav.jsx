import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/',          label: 'Home' },
  { to: '/upload',    label: 'Upload' },
  { to: '/detect',    label: 'Detect' },
  { to: '/verify',    label: 'Verify' },
  { to: '/nodes',     label: 'Nodes' },
  { to: '/audit',     label: 'Audit' },
]

export default function Nav() {
  const { pathname } = useLocation()
  return (
    <nav style={{
      background: 'var(--surface-subtle-panel)',
      borderBottom: '1px solid var(--color-dark-grid)',
      padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 52, position: 'sticky', top: 0, zIndex: 100,
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--color-lime-interface)', fontFamily: 'var(--font-jetbrains)', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em' }}>
          DEEPPROOF
        </span>
        <span style={{ color: 'var(--color-faint-grid)', fontFamily: 'var(--font-jetbrains)', fontSize: 10 }}>NEXUS</span>
      </Link>

      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {links.map(({ to, label }) => (
          <Link key={to} to={to} style={{
            textDecoration: 'none',
            fontFamily: 'var(--font-inter-tight)',
            fontSize: 13,
            fontWeight: 400,
            color: pathname === to ? 'var(--color-silver-whisper)' : 'var(--color-mid-gray-border)',
            borderBottom: pathname === to ? '1.5px solid var(--color-lime-interface)' : '1.5px solid transparent',
            paddingBottom: 2,
            transition: 'color 0.2s',
          }}>
            {label}
          </Link>
        ))}
        <Link to="/detect" className="btn-lime" style={{ padding: '8px 16px', fontSize: 12, textDecoration: 'none' }}>
          Launch App →
        </Link>
      </div>
    </nav>
  )
}
