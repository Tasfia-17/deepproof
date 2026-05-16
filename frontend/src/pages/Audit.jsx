import { useState, useEffect } from 'react'
import { getHealth } from '../lib/api'
import api from '../lib/api'

export default function Audit() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runAudit = async () => {
    setLoading(true); setError(null); setStatus(null)
    try {
      const { data } = await api.get('/audit')
      setStatus(data)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { runAudit() }, [])

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px' }}>
      <div className="label" style={{ marginBottom: 12 }}>Omission Detection</div>
      <h1 className="subheading" style={{ marginBottom: 8 }}>XOR Completeness Audit</h1>
      <p style={{ color: 'var(--color-mid-gray-border)', marginBottom: 32 }}>
        DeepProof stores an XOR checksum of all evidence hashes on-chain. If evidence is deleted from 0G Storage, the on-chain XOR sum proves content is missing.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 12 }}>How It Works</div>
        <ol style={{ color: 'var(--color-mid-gray-border)', fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Every detection job uploads evidence to 0G Storage and XORs the root hash into ProvenanceRegistry on-chain.</li>
          <li>Anyone can recompute the XOR by fetching all evidence from 0G Storage.</li>
          <li>If recomputed ≠ on-chain, evidence has been deleted or tampered with.</li>
        </ol>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="label" style={{ color: 'var(--color-lime-interface)' }}>Live On-Chain Status</div>
          <button className="btn-ghost" onClick={runAudit} disabled={loading} style={{ fontSize: 11, padding: '6px 12px' }}>
            {loading ? 'Checking…' : 'Refresh'}
          </button>
        </div>

        {error && <div style={{ color: '#ff6b6b', fontFamily: 'var(--font-jetbrains)', fontSize: 12 }}>ERROR: {error}</div>}

        {status && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--color-dark-grid)' }}>
            {[
              { label: 'Total Records', value: status.totalRecords ?? '—' },
              { label: 'On-Chain XOR', value: status.onChainXor ? status.onChainXor.slice(0, 10) + '…' : '0x0' },
              { label: 'Status', value: status.intact ? 'INTACT' : 'VIOLATION', color: status.intact ? 'var(--color-lime-interface)' : '#ff6b6b' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--surface-dark-card)', padding: '16px 20px' }}>
                <div className="label" style={{ marginBottom: 8 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 13, color: color || 'var(--color-white-outlined-text)' }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {!status && !loading && !error && (
          <div style={{ color: 'var(--color-mid-gray-border)', fontSize: 13 }}>Connect API to view live data.</div>
        )}
      </div>

      <div className="card">
        <div className="label" style={{ marginBottom: 12 }}>Run Audit Locally</div>
        <pre style={{ background: '#000', padding: '14px 18px', border: '1px solid var(--color-dark-grid)', fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: 'var(--color-lime-interface)', overflowX: 'auto' }}>
{`npx deepproof audit --network mainnet

Fetching on-chain XOR sum...
Downloading all evidence from 0G Storage...
Recomputing XOR checksum...

✓ Integrity verified
  On-chain:   0x7a3f...9c2e
  Recomputed: 0x7a3f...9c2e
  Status:     INTACT`}
        </pre>
      </div>
    </main>
  )
}
