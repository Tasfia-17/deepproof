import { useParams } from 'react-router-dom'
import { certificateUrl } from '../lib/api'

export default function Certificate() {
  const { hash } = useParams()
  const url = certificateUrl(hash)
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 32px' }}>
      <div className="label" style={{ marginBottom: 12 }}>PDF Certificate</div>
      <h1 className="subheading" style={{ marginBottom: 24 }}>Authenticity Certificate</h1>
      <p style={{ color: 'var(--color-mid-gray-border)', marginBottom: 32 }}>
        TEE-attested provenance certificate for <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12 }}>{hash}</span>
      </p>
      <a href={url} className="btn-lime" style={{ textDecoration: 'none' }}>Download PDF →</a>
    </main>
  )
}
