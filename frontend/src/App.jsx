import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Landing from './pages/Landing'
import Upload from './pages/Upload'
import Detect from './pages/Detect'
import Verify from './pages/Verify'
import Certificate from './pages/Certificate'
import Nodes from './pages/Nodes'
import Audit from './pages/Audit'
import Lineage from './pages/Lineage'

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/"                    element={<Landing />} />
        <Route path="/upload"              element={<Upload />} />
        <Route path="/detect"              element={<Detect />} />
        <Route path="/verify"              element={<Verify />} />
        <Route path="/verify/:hash"        element={<Verify />} />
        <Route path="/certificate/:hash"   element={<Certificate />} />
        <Route path="/nodes"               element={<Nodes />} />
        <Route path="/audit"               element={<Audit />} />
        <Route path="/lineage/:hash"       element={<Lineage />} />
      </Routes>
    </BrowserRouter>
  )
}
