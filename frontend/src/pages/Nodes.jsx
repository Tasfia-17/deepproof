import { useState, useEffect } from 'react'
import { getNodes } from '../lib/api'

export default function Nodes() {
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNodes().then(({ data }) => { setNodes(data.nodes || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px' }}>
      <div className="label" style={{ marginBottom: 12 }}>Node Network</div>
      <h1 className="subheading" style={{ marginBottom: 8 }}>Active Detection Nodes</h1>
      <p style={{ color: 'var(--color-mid-gray-border)', marginBottom: 32 }}>
        Nodes stake 0G tokens and run TEE-sealed inference. Slashed for dishonest verdicts.
      </p>

      {loading && <div className="label">Loading…</div>}

      {!loading && nodes.length === 0 && (
        <div style={{ padding: '24px', border: '1px solid var(--color-dark-grid)', color: 'var(--color-mid-gray-border)' }}>
          No active nodes yet. Be the first — stake 1000 0G tokens to join.
        </div>
      )}

      {nodes.length > 0 && (
        <div style={{ border: '1px solid var(--color-dark-grid)' }}>
          {nodes.map((n, i) => (
            <div key={i} style={{ padding: '16px 20px', borderBottom: i < nodes.length - 1 ? '1px solid var(--color-dark-grid)' : 'none', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, wordBreak: 'break-all' }}>{n.address}</span>
              <span style={{ color: 'var(--color-lime-interface)', fontFamily: 'var(--font-jetbrains)', fontSize: 12 }}>{n.stakedAmount} 0G</span>
              <span style={{ color: 'var(--color-mid-gray-border)', fontSize: 12 }}>{n.totalVerifications} verifications</span>
              <span className="badge badge-authentic">ACTIVE</span>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
