import { useState, useRef } from 'react'
import { uploadFile } from '../lib/api'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = (f) => { setFile(f); setResult(null); setError(null) }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const submit = async () => {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const { data } = await uploadFile(file)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 32px' }}>
      <div className="label" style={{ marginBottom: 12 }}>0G Storage Upload</div>
      <h1 className="subheading" style={{ marginBottom: 8 }}>Upload to 0G Storage</h1>
      <p style={{ color: 'var(--color-mid-gray-border)', marginBottom: 32 }}>
        Files are hashed client-side, then stored permanently on 0G's decentralized storage network.
      </p>

      <div
        className={`dropzone${dragging ? ' active' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
        {file ? (
          <div>
            <div style={{ color: 'var(--color-lime-interface)', fontFamily: 'var(--font-jetbrains)', fontSize: 13 }}>{file.name}</div>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 32, marginBottom: 12 }}>↑</div>
            <div style={{ color: 'var(--color-white-outlined-text)' }}>Drop image or video here, or click to browse</div>
            <div className="label" style={{ marginTop: 8 }}>JPEG · PNG · WEBP · MP4 · WEBM · MOV · max 500MB</div>
          </div>
        )}
      </div>

      {file && (
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <button className="btn-lime" onClick={submit} disabled={loading}>
            {loading ? 'Uploading to 0G Storage…' : 'Upload →'}
          </button>
          <button className="btn-ghost" onClick={() => { setFile(null); setResult(null) }}>Clear</button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 20, padding: '14px 18px', border: '1px solid #7a2020', background: 'rgba(122,32,32,0.1)', color: '#ff6b6b', fontFamily: 'var(--font-jetbrains)', fontSize: 12 }}>
          ERROR: {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 28 }}>
          <div className="divider" style={{ marginBottom: 24 }} />
          <div className="label" style={{ marginBottom: 16, color: 'var(--color-lime-interface)' }}>Upload Complete</div>
          {[
            ['SHA-256', result.sha256],
            ['0G Root Hash', result.rootHash],
            ['Tx Hash', result.txHash],
            ['MIME Type', result.mimeType],
            ['Size', `${(result.size / 1024 / 1024).toFixed(2)} MB`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--color-dark-grid)' }}>
              <span style={{ color: 'var(--color-mid-gray-border)', fontSize: 12, minWidth: 120 }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, wordBreak: 'break-all', color: 'var(--color-white-outlined-text)' }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <a href={result.storageUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-lime-interface)', fontFamily: 'var(--font-jetbrains)', fontSize: 12 }}>
              View on StorageScan →
            </a>
          </div>
        </div>
      )}
    </main>
  )
}
