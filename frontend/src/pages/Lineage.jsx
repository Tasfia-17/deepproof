import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getLineage } from '../lib/api'

export default function Lineage() {
  const { hash } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hash) return
    getLineage(hash).then(({ data }) => { setData(data); setLoading(false) }).catch(() => setLoading(false))
  }, [hash])

  if (loading) return <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px' }}><div className="label">Loading…</div></main>
  if (!data) return <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px' }}><div className="label">Lineage not found</div></main>

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px' }}>
      <div className="label" style={{ marginBottom: 12 }}>Derivative Lineage</div>
      <h1 className="subheading" style={{ marginBottom: 8 }}>Content Family Tree</h1>
      <p style={{ color: 'var(--color-mid-gray-border)', marginBottom: 32 }}>Every edit, crop, and re-registration links child → parent on-chain.</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 12 }}>Root Content</div>
        <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, wordBreak: 'break-all', color: 'var(--color-white-outlined-text)', marginBottom: 12 }}>{data.root}</div>
        <span className={`badge badge-${data.rootVerdict}`}>{data.rootVerdict?.toUpperCase()}</span>
      </div>

      {data.children?.length > 0 && (
        <div>
          <div className="label" style={{ marginBottom: 16 }}>Derivatives ({data.children.length})</div>
          <div style={{ border: '1px solid var(--color-dark-grid)' }}>
            {data.children.map((c, i) => (
              <div key={i} style={{ padding: '16px 20px', borderBottom: i < data.children.length - 1 ? '1px solid var(--color-dark-grid)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span className={`badge badge-${c.verdict}`}>{c.verdict?.toUpperCase()}</span>
                  <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: 'var(--color-mid-gray-border)' }}>{new Date(c.timestamp * 1000).toLocaleString()}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, wordBreak: 'break-all', color: 'var(--color-white-outlined-text)' }}>{c.hash}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!data.children || data.children.length === 0) && (
        <div style={{ padding: '20px 24px', border: '1px solid var(--color-dark-grid)', background: 'var(--surface-dark-card)' }}>
          <div style={{ color: 'var(--color-mid-gray-border)', fontSize: 14 }}>No derivatives found.</div>
        </div>
      )}
    </main>
  )
}
