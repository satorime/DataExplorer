import { useState } from 'react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import DataTable from './components/DataTable'
import Charts from './components/Charts'
import MapPanel from './components/MapPanel'
import ExportPanel from './components/ExportPanel'
import './index.css'

export default function App() {
  const [dataset, setDataset] = useState(null) // { data, fields, fileName }

  const handleData = (data, fields, fileName) => {
    setDataset({ data, fields, fileName })
    setTimeout(() => {
      document.getElementById('table')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleReset = () => setDataset(null)

  return (
    <div className="min-h-screen bg-white text-black" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Header dataLoaded={!!dataset} fileName={dataset?.fileName} />

      {!dataset ? (
        <>
          <UploadZone onData={handleData} />

          {/* Feature overview */}
          <section className="px-6 md:px-12 py-16 border-b-4 border-black bg-black text-white relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px)',
              backgroundSize: '4px 100%',
              opacity: 0.03
            }} />
            <div className="relative">
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em' }}
                className="uppercase opacity-50 mb-8 flex items-center gap-3">
                <span className="w-6 h-px bg-white opacity-50" /> What you can do
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
                {[
                  { n: '01', title: 'Explore', desc: 'Filter, sort, and search any column across thousands of rows instantly.' },
                  { n: '02', title: 'Visualize', desc: 'Auto-generated bar, line, pie and doughnut charts based on your data types.' },
                  { n: '03', title: 'Map', desc: 'Geographic scatter maps for any dataset with latitude/longitude fields.' },
                  { n: '04', title: 'Export', desc: 'Download as CSV, JSON, XLSX, or a plain-text insights summary.' },
                ].map(({ n, title, desc }) => (
                  <div key={n}
                    className="border-r border-white/10 last:border-r-0 p-8 group hover:bg-white hover:text-black transition-colors duration-100">
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em' }}
                      className="opacity-40 group-hover:opacity-100 mb-4">{n}</div>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      className="text-2xl font-bold mb-3">{title}</h3>
                    <p style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                      className="text-sm leading-relaxed opacity-70 group-hover:opacity-80">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Formats */}
          <section className="px-6 md:px-12 py-12 border-b-4 border-black relative">
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(#00000008 1px, transparent 1px), linear-gradient(90deg, #00000008 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
            <div className="relative flex flex-col md:flex-row md:items-center gap-8">
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-4xl font-black tracking-tight leading-none">
                Any<br /><em>data.</em>
              </div>
              <div className="w-px h-16 bg-black hidden md:block" />
              <div className="flex flex-wrap gap-4">
                {['CSV', 'JSON', 'Earthquakes', 'Climate', 'Population', 'Finance', 'Sensors', 'Geodata'].map(tag => (
                  <span key={tag}
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.08em' }}
                    className="border border-black px-3 py-1.5 uppercase hover:bg-black hover:text-white transition-colors duration-100 cursor-default">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Reset bar */}
          <div className="px-6 md:px-12 py-3 border-b-2 border-black flex items-center justify-between bg-[#F5F5F5]">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
              className="text-[#525252]">
              {dataset.data.length.toLocaleString()} rows · {dataset.fields.length} columns
            </span>
            <button onClick={handleReset}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.08em' }}
              className="border border-black px-4 py-1.5 uppercase hover:bg-black hover:text-white transition-colors duration-100">
              ← New dataset
            </button>
          </div>

          <DataTable data={dataset.data} fields={dataset.fields} />
          <Charts data={dataset.data} fields={dataset.fields} />
          <MapPanel data={dataset.data} fields={dataset.fields} />
          <ExportPanel data={dataset.data} fields={dataset.fields} fileName={dataset.fileName} />
        </>
      )}

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t-4 border-black flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          className="text-xl font-bold">
          Dataset <em>Explorer</em>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.05em' }}
          className="text-[#525252]">
          Built with React · Chart.js · Leaflet · Tailwind CSS
        </div>
      </footer>
    </div>
  )
}
