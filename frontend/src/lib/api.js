import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  headers: { 'x-api-key': import.meta.env.VITE_API_KEY || 'dev' },
})

export const uploadFile = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/upload', fd)
}

export const submitDetection = (file, recipientAddress) => {
  const fd = new FormData()
  fd.append('file', file)
  if (recipientAddress) fd.append('recipientAddress', recipientAddress)
  return api.post('/detect', fd)
}

export const pollJob = (jobId) => api.get(`/detect/${jobId}`)

export const verifyHash = (hash) => api.get(`/verify/${hash}`)

export const getNodes = () => api.get('/nodes')

export const getLineage = (hash) => api.get(`/lineage/${hash}`)

export const getHealth = () => api.get('/health')

export const certificateUrl = (hash) =>
  `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/certificate/${hash}`

export default api
