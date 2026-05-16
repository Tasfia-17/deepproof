import { useState, useRef, useEffect } from 'react'
import { submitDetection, pollJob } from '../lib/api'

const STEPS = ['queued', 'detecting', 'uploading_evidence', 'anchoring', 'complete']
const STEP_LABELS = { queued: 'Job queued', detecting: 'TEE inference running', uploading_evidence: 'Uploading evidence to 0G Storage', anchoring: 'Anchoring on 0G Chain', complete: 'Complete', error: 'Error' }

export default function Detect() {
  const [file, setFile] = useState(null)
  const [address, setAddress] = useState('')
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef()
  const pollRef = useRef()

  const submit = async () => {
    if (!file) return
    setLoading(true); setError(null); setJob(null)
    try {
      const { data } = await submitDetection(file, address)
      setJob(data)
      pollRef.current = setInterval(async () => {
        const { data: status } = await pollJob(data.jobId)
        setJob(status)
        if (status.status === 'complete' || status.status === 'error') {
          clearInterval(pollRef.current)
          setLoading(false)
        }
      }, 2000)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
      setLoading(false)
    }
  }

  useEffect(() => () => clearInterval(pollRef.current), [])

  const stepIdx = job ? STEPS.indexOf(job.status) : -1
  const progress = job?.status === 'complete' ? 100 : stepIdx >= 0 ? Math.round((stepIdx / (STEPS.length - 1)) * 100) : 0

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px' }}>
      <div className="label" style={{ marginBottom: 12 }}>0G Compute · TEE Detection</div>
      <h1 className="subheading" style={{ marginBottom: 8 }}>Live Detection Dashboard</h1>
      <p style={{ color: 'var(--color-mid-gray-border)', marginBottom: 32 }}>Submit media for multi-modal deepfake detection inside a hardware-isolated TEE enclave.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className="dropzone" style={{ padding: 24 }} onClick={() => inputRef.current.click()}>
          <input ref={inputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
          {file ? <span style={{ color: 'var(--color-lime-interface)', fontFamily: 'var(--font-jetbrains)', fontSize: 12 }}>{file.name}</span> : <span style={{ color: 'var(--color-mid-gray-border)' }}>Click to select file</span>}
        </div>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>SPT Recipient Address (optional)</div>
          <input placeholder="0x..." value={address} onChange={(e) => setAddress(e.target.value)} style={{ marginBottom: 12 }} />
          <button className="btn-lime" onClick={submit} disabled={!file || loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Processing…' : 'Run Detection →'}
          </button>
        </div>
      </div>

      {error && <div style={{ padding: '12px 16px', border: '1px solid #7a2020', color: '#ff6b6b', fontFamily: 'var(--font-jetbrains)', fontSize: 12, marginBottom: 20 }}>ERROR: {error}</div>}

      {job && (
        <div style={{ marginTop: 28 }}>
          <div className="divider" style={{ marginBottom: 24 }} />
          <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, padding: '10px 14px', background: i <= stepIdx ? 'rgba(197,255,74,0.08)' : 'var(--surface-dark-card)', borderRight: i < STEPS.length - 1 ? '1px solid var(--color-dark-grid)' : 'none', border: i <= stepIdx ? '1px solid var(--color-glow-green)' : '1px solid var(--color-dark-grid)' }}>
                <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: i <= stepIdx ? 'var(--color-lime-interface)' : 'var(--color-faint-grid)', letterSpacing: '0.06em' }}>
                  {i < stepIdx ? '✓' : i === stepIdx ? '▶' : '○'} {STEP_LABELS[s]}
                </div>
              </div>
            ))}
          </div>
          <div className="progress-bar" style={{ marginBottom: 24 }}><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

          {job.result && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--color-dark-grid)' }}>
              <div className="card" style={{ background: 'var(--surface-dark-card)' }}>
                <div className="label" style={{ marginBottom: 12 }}>Verdict</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span className={`badge badge-${job.result.verdictLabel}`}>{job.result.verdictLabel?.toUpperCase()}</span>
                  <span style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 32, color: job.result.verdictLabel === 'authentic' ? 'var(--color-lime-interface)' : '#ff6b6b' }}>{job.result.confidence}%</span>
                </div>
                <div style={{ color: 'var(--color-mid-gray-border)', fontSize: 13 }}>{job.result.reasoning}</div>
              </div>
              <div className="card" style={{ background: 'var(--surface-dark-card)' }}>
                <div className="label" style={{ marginBottom: 12 }}>On-Chain Proof</div>
                {[['Job ID', job.jobId], ['SHA-256', job.sha256], ['Registry Tx', job.registryTx]].map(([k, v]) => v && (
                  <div key={k} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--color-dark-grid)' }}>
                    <span style={{ color: 'var(--color-mid-gray-border)', fontSize: 11, minWidth: 90 }}>{k}</span>
                    <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, wordBreak: 'break-all', color: 'var(--color-white-outlined-text)' }}>{v}</span>
                  </div>
                ))}
                {job.status === 'complete' && job.sha256 && <div style={{ marginTop: 14 }}><a href={`/verify/${job.sha256}`} className="btn-lime" style={{ fontSize: 12, padding: '8px 14px', textDecoration: 'none' }}>View Certificate →</a></div>}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
