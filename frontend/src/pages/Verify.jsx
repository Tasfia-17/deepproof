import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { verifyHash, certificateUrl } from '../lib/api'

export default function Verify() {
  const { hash } = useParams()
  const [input, setInput] = useState(hash || '')
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const lookup = async (h) => {
    if (!h) return
    setLoading(true); setError(null); setRecord(null)
    try {
      const { data } = await verifyHash(h)
      setRecord(data)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (hash) lookup(hash) }, [hash])

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 32px' }}>
      <div className="label" style={{ marginBottom: 12 }}>0G Chain Lookup</div>
      <h1 className="subheading" style={{ marginBottom: 8 }}>Verify Provenance</h1>
      <p style={{ color: 'var(--color-mid-gray-border)', marginBottom: 32 }}>Enter a SHA-256 hash to look up its on-chain provenance record.</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <input placeholder="SHA-256 hash (64 hex chars)" value={input} onChange={e => setInput(e.target.value)}
          style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && lookup(input)} />
        <button className="btn-lime" onClick={() => lookup(input)} disabled={loading || !input}>
          {loading ? 'Looking up…' : 'Verify →'}
        </button>
      </div>

      {error && <div style={{ padding: '12px 16px', border: '1px solid #7a2020', color: '#ff6b6b', fontFamily: 'var(--font-jetbrains)', fontSize: 12, marginBottom: 20 }}>NOT FOUND: {error}</div>}

      {record && (
        <div>
          <div className="divider" style={{ marginBottom: 24 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <span className={`badge badge-${record.verdict}`}>{record.verdict?.toUpperCase()}</span>
            <span style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 40, color: record.verdict === 'authentic' ? 'var(--color-lime-interface)' : '#ff6b6b' }}>{record.confidence}%</span>
          </div>
          {[
            ['SHA-256', record.sha256],
            ['Model', record.modelVersion],
            ['Registrar', record.registrar],
            ['Timestamp', new Date(record.timestamp * 1000).toLocaleString()],
            ['Storage Root', record.storageRootHash],
          ].map(([k, v]) => v && (
            <div key={k} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--color-dark-grid)' }}>
              <span style={{ color: 'var(--color-mid-gray-border)', fontSize: 12, minWidth: 120 }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, wordBreak: 'break-all' }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <a href={record.storageUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12, textDecoration: 'none' }}>View Evidence on 0G →</a>
            <a href={certificateUrl(record.sha256)} className="btn-lime" style={{ fontSize: 12, textDecoration: 'none' }}>Download Certificate →</a>
          </div>
        </div>
      )}
    </main>
  )
}
