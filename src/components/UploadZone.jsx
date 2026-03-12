import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'

export default function UploadZone({ onData }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const processFile = useCallback((file) => {
    setLoading(true)
    setError('')
    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          setLoading(false)
          if (results.data.length === 0) return setError('File appears to be empty.')
          onData(results.data, results.meta.fields, file.name)
        },
        error: () => { setLoading(false); setError('Failed to parse CSV.') }
      })
    } else if (ext === 'json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          let parsed = JSON.parse(e.target.result)
          if (!Array.isArray(parsed)) parsed = [parsed]
          const fields = Object.keys(parsed[0] || {})
          setLoading(false)
          onData(parsed, fields, file.name)
        } catch {
          setLoading(false)
          setError('Invalid JSON format.')
        }
      }
      reader.readAsText(file)
    } else {
      setLoading(false)
      setError('Only CSV and JSON files are supported.')
    }
  }, [onData])

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) processFile(accepted[0])
  }, [processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    multiple: false
  })

  return (
    <section className="px-6 md:px-12 py-16 md:py-24 border-b-4 border-black relative">
      {/* Line texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px)',
        backgroundSize: '100% 4px',
        opacity: 0.015
      }} />

      <div className="relative max-w-3xl">
        {/* Section label */}
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em' }}
          className="uppercase text-[#525252] mb-6 flex items-center gap-3">
          <span className="w-8 h-px bg-[#525252]" />
          Upload Dataset
        </div>

        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.02em' }}
          className="text-3xl md:text-4xl font-bold mb-8">
          Drop your data here.
        </h2>

        {/* Drop zone */}
        <div {...getRootProps()}
          className={`border-2 border-dashed border-black p-12 md:p-16 cursor-pointer text-center transition-colors duration-100 ${isDragActive ? 'bg-[#F5F5F5] border-solid border-[3px]' : 'hover:bg-[#F5F5F5]'}`}>
          <input {...getInputProps()} />

          <div className="mb-6">
            {/* Upload icon */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
              <rect x="4" y="4" width="40" height="40" />
              <path d="M24 32V16M16 24l8-8 8 8" />
            </svg>
          </div>

          {loading ? (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
              Parsing data...
            </p>
          ) : isDragActive ? (
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-xl font-bold italic">
              Release to upload
            </p>
          ) : (
            <>
              <p style={{ fontFamily: "'Source Serif 4', Georgia, serif" }} className="text-lg mb-3">
                Drag & drop a file, or click to browse
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em' }}
                className="uppercase text-[#525252]">
                CSV · JSON &nbsp;—&nbsp; Any size
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 border-2 border-black bg-black text-white px-6 py-4">
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{error}</p>
          </div>
        )}

        {/* Sample datasets note */}
        <div className="mt-8 flex flex-wrap gap-3">
          {['Philippine Earthquakes', 'Climate Records', 'Population Census'].map(name => (
            <span key={name}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.05em' }}
              className="border border-black px-3 py-1.5 text-[#525252] uppercase">
              {name}
            </span>
          ))}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
            className="px-3 py-1.5 text-[#525252] self-center">
            — try your own
          </span>
        </div>
      </div>
    </section>
  )
}
