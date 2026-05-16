import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

const stats = [
  { value: '$0.05', label: 'Per verification' },
  { value: '94%+',  label: 'Detection accuracy' },
  { value: '0G TEE', label: 'Sealed inference' },
  { value: '<2s',   label: 'End-to-end latency' },
]

const features = [
  { tag: '0G COMPUTE', title: 'TEE-Sealed Inference', body: 'Detection models run inside Intel TDX enclaves. The node operator cannot see your content or bias the result. Every verdict is signed by enclave-born keys.' },
  { tag: '0G STORAGE', title: 'Permanent Evidence Layer', body: 'Content hashes, detection heatmaps, confidence scores, and TEE attestation reports stored permanently on 0G Storage at 2 GB/s throughput.' },
  { tag: '0G CHAIN',   title: 'Soulbound Provenance Token', body: 'Non-transferable ERC-721 minted per verified content. Perceptual hash anchored on-chain survives screenshots, compression, and social platform stripping.' },
  { tag: 'INNOVATION', title: 'Omission Detection', body: 'XOR completeness invariant stored on-chain. If a government forces deletion of evidence captures, the on-chain sum proves content is missing. No competitor offers this.' },
  { tag: 'INNOVATION', title: 'Derivative Lineage', body: 'Every edit, crop, and re-registration links child hash → parent hash on-chain. Deepfake injection attempts are flagged and stored in the immutable family tree.' },
  { tag: 'ECONOMICS',  title: 'Node Staking & Slashing', body: 'Detection nodes stake 0G tokens on verdicts. Nodes that deviate from consensus are slashed. Honest detection is economically enforced, not just policy.' },
]

const ticker = [
  '0G STORAGE', '·', 'TEE INFERENCE', '·', 'SOULBOUND TOKENS', '·',
  'PERCEPTUAL HASH', '·', 'XOR AUDIT', '·', 'DERIVATIVE LINEAGE', '·',
  'NODE STAKING', '·', 'DECENTRALIZED', '·', '0G COMPUTE', '·',
]

// Animated terminal lines in hero
const TERMINAL_LINES = [
  '> deepproof verify suspicious.mp4 --wait',
  '  uploading to 0G Storage...',
  '  running TEE inference...',
  '  anchoring on 0G Chain...',
  '  ✓ SYNTHETIC  confidence=91%',
  '  registry_tx=0xbe059f25...cd4b',
  '  spt_minted=0x8fcda8e8...bc4',
]

function Terminal() {
  const [lines, setLines] = useState([])
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    if (cursor >= TERMINAL_LINES.length) {
      const t = setTimeout(() => { setLines([]); setCursor(0) }, 3000)
      return () => clearTimeout(t)
    }
    const delay = cursor === 0 ? 600 : cursor < 2 ? 400 : 700
    const t = setTimeout(() => {
      setLines(l => [...l, TERMINAL_LINES[cursor]])
      setCursor(c => c + 1)
    }, delay)
    return () => clearTimeout(t)
  }, [cursor])

  return (
    <div style={{
      background: '#000', border: '1px solid var(--color-dark-grid)',
      padding: '16px 20px', fontFamily: 'var(--font-jetbrains)', fontSize: 11,
      lineHeight: 1.8, minHeight: 160, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ color: 'var(--color-faint-grid)', marginBottom: 8, fontSize: 10, letterSpacing: '0.1em' }}>
        DEEPPROOF NEXUS v1.0 · 0G TESTNET
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{
          color: l.startsWith('  ✓') ? 'var(--color-lime-interface)'
               : l.startsWith('  registry') || l.startsWith('  spt') ? 'var(--color-mid-gray-border)'
               : l.startsWith('>') ? '#fff' : 'var(--color-mid-gray-border)',
          animation: 'fade-up 0.2s ease forwards',
        }}>{l}</div>
      ))}
      {cursor < TERMINAL_LINES.length && (
        <span style={{ color: 'var(--color-lime-interface)', animation: 'blink 1s step-end infinite' }}>█</span>
      )}
    </div>
  )
}

// Canvas grid / particle background
function GridCanvas() {
  const ref = useRef()
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let raf
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight

    // Sparse grid dots
    const dots = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.2 + 0.3,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      // Grid lines
      ctx.strokeStyle = 'rgba(37,37,37,0.6)'
      ctx.lineWidth = 0.5
      for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

      // Dots + connections
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0 || d.x > W) d.vx *= -1
        if (d.y < 0 || d.y > H) d.vy *= -1
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(197,255,74,0.4)'
        ctx.fill()
      })
      dots.forEach((a, i) => dots.slice(i + 1).forEach(b => {
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        if (dist < 100) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(197,255,74,${0.08 * (1 - dist / 100)})`
          ctx.lineWidth = 0.5; ctx.stroke()
        }
      }))
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

export default function Landing() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
      {/* Scanline */}
      <div className="scanline" />

      {/* Hero */}
      <section style={{ padding: '80px 0 60px', borderBottom: '1px solid var(--color-dark-grid)', position: 'relative', overflow: 'hidden', minHeight: 480 }}>
        <GridCanvas />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <span className="label">Built on 0G · Decentralized AI Infrastructure</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 72, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em', maxWidth: 800, marginBottom: 24 }}>
            Deepfake detection<br />
            <span className="lime glitch">you can verify.</span>
          </h1>
          <p style={{ color: 'var(--color-white-outlined-text)', fontSize: 16, lineHeight: 1.6, maxWidth: 480, marginBottom: 36 }}>
            The first decentralized deepfake detection network where inference runs inside hardware-isolated TEEs, results are cryptographically signed, and perceptual hashes survive social platform stripping.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 40 }}>
            <Link to="/detect" className="btn-lime pulse">Verify Content →</Link>
            <Link to="/nodes" className="btn-ghost">Run a Node</Link>
          </div>
          <div style={{ maxWidth: 560 }}>
            <Terminal />
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, letterSpacing: '0.12em', color: t === '·' ? 'var(--color-faint-grid)' : 'var(--color-mid-gray-border)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--color-dark-grid)' }}>
        {stats.map(({ value, label }, i) => (
          <div key={i} className="fade-up" style={{ padding: '28px 22px', borderRight: i < 3 ? '1px solid var(--color-dark-grid)' : 'none' }}>
            <div style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 40, fontWeight: 400, color: 'var(--color-lime-interface)', lineHeight: 1 }}>{value}</div>
            <div className="label" style={{ marginTop: 8 }}>{label}</div>
          </div>
        ))}
      </section>

      {/* Comparison */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid var(--color-dark-grid)' }}>
        <div className="label" style={{ marginBottom: 16 }}>Why DeepProof Nexus</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--color-dark-grid)' }}>
          {[
            { metric: 'Cost per check',     us: '~$0.05',           them: '$0.50–$1.50+' },
            { metric: 'Privacy guarantee',  us: 'Hardware TEE',     them: 'Terms of service' },
            { metric: 'Metadata survival',  us: '~95% (pHash)',     them: '~5% (C2PA stripped)' },
            { metric: 'On-chain proof',      us: 'TEE-signed SBT',  them: 'API JSON response' },
            { metric: 'Omission detection', us: 'XOR invariant',    them: 'Not offered' },
            { metric: 'Decentralized',       us: 'Anyone can run',  them: 'Single company' },
          ].map(({ metric, us, them }, i) => (
            <div key={i} className="fade-up card-trace" style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignItems: 'center' }}>
              <span style={{ color: 'var(--color-mid-gray-border)', fontSize: 12 }}>{metric}</span>
              <span style={{ color: 'var(--color-lime-interface)', fontFamily: 'var(--font-jetbrains)', fontSize: 12 }}>{us}</span>
              <span style={{ color: 'var(--color-faint-grid)', fontFamily: 'var(--font-jetbrains)', fontSize: 12, textDecoration: 'line-through' }}>{them}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '40px 0 60px' }}>
        <div className="label" style={{ marginBottom: 28 }}>Core Architecture</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--color-dark-grid)' }}>
          {features.map(({ tag, title, body }, i) => (
            <div key={i} className="card card-trace fade-up">
              <div className="label" style={{ color: 'var(--color-lime-interface)', marginBottom: 12 }}>{tag}</div>
              <div style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 22, fontWeight: 400, lineHeight: 1.15, marginBottom: 12 }}>{title}</div>
              <div style={{ color: 'var(--color-mid-gray-border)', fontSize: 13, lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
