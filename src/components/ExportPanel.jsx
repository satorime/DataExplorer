import { useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

function getSummaryStats(data, fields) {
  const stats = {}
  for (const f of fields) {
    const vals = data.map(r => r[f]).filter(v => v !== null && v !== undefined)
    const nums = vals.map(v => parseFloat(v)).filter(v => !isNaN(v))
    if (nums.length > vals.length * 0.5) {
      const sorted = [...nums].sort((a, b) => a - b)
      const sum = nums.reduce((s, v) => s + v, 0)
      stats[f] = {
        type: 'numeric',
        count: nums.length,
        min: Math.min(...nums),
        max: Math.max(...nums),
        mean: sum / nums.length,
        median: sorted[Math.floor(sorted.length / 2)],
        sum,
        nulls: data.length - vals.length
      }
    } else {
      const freq = {}
      for (const v of vals) { const k = String(v); freq[k] = (freq[k] || 0) + 1 }
      const topEntries = Object.entries(freq).sort((a, b) => b[1] - a[1])
      stats[f] = {
        type: 'categorical',
        count: vals.length,
        unique: Object.keys(freq).length,
        topValue: topEntries[0]?.[0],
        topCount: topEntries[0]?.[1],
        nulls: data.length - vals.length
      }
    }
  }
  return stats
}

export default function ExportPanel({ data, fields, fileName }) {
  const [exported, setExported] = useState('')
  const stats = getSummaryStats(data, fields)
  const fmt = (n) => typeof n === 'number' ? Math.round(n * 100) / 100 : n

  const exportCSV = () => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, fileName.replace(/\.[^.]+$/, '_export.csv'))
    setExported('csv')
    setTimeout(() => setExported(''), 2000)
  }

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')

    // Summary sheet
    const summaryRows = fields.map(f => {
      const s = stats[f]
      return s.type === 'numeric'
        ? { Field: f, Type: 'Numeric', Count: s.count, Min: fmt(s.min), Max: fmt(s.max), Mean: fmt(s.mean), Median: fmt(s.median), Nulls: s.nulls }
        : { Field: f, Type: 'Categorical', Count: s.count, Unique: s.unique, TopValue: s.topValue, TopCount: s.topCount, Nulls: s.nulls }
    })
    const ws2 = XLSX.utils.json_to_sheet(summaryRows)
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary')

    XLSX.writeFile(wb, fileName.replace(/\.[^.]+$/, '_export.xlsx'))
    setExported('xlsx')
    setTimeout(() => setExported(''), 2000)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    saveAs(blob, fileName.replace(/\.[^.]+$/, '_export.json'))
    setExported('json')
    setTimeout(() => setExported(''), 2000)
  }

  const exportInsights = () => {
    const lines = [
      `DATASET INSIGHTS`,
      `================`,
      `File: ${fileName}`,
      `Rows: ${data.length}`,
      `Columns: ${fields.length}`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `FIELD SUMMARY`,
      `=============`,
    ]
    for (const f of fields) {
      const s = stats[f]
      lines.push(``)
      lines.push(`Field: ${f}`)
      lines.push(`  Type: ${s.type}`)
      if (s.type === 'numeric') {
        lines.push(`  Count: ${s.count} (${s.nulls} nulls)`)
        lines.push(`  Range: ${fmt(s.min)} — ${fmt(s.max)}`)
        lines.push(`  Mean: ${fmt(s.mean)}`)
        lines.push(`  Median: ${fmt(s.median)}`)
        lines.push(`  Sum: ${fmt(s.sum)}`)
      } else {
        lines.push(`  Count: ${s.count} (${s.nulls} nulls)`)
        lines.push(`  Unique values: ${s.unique}`)
        lines.push(`  Most common: "${s.topValue}" (${s.topCount}x)`)
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    saveAs(blob, fileName.replace(/\.[^.]+$/, '_insights.txt'))
    setExported('insights')
    setTimeout(() => setExported(''), 2000)
  }

  return (
    <section id="export" className="border-b-4 border-black">
      {/* Header */}
      <div className="px-6 md:px-12 py-8 border-b-2 border-black">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em' }}
          className="uppercase text-[#525252] mb-1 flex items-center gap-3">
          <span className="w-6 h-px bg-[#525252]" /> 04 Export
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          className="text-2xl font-bold">Insights & Export</h2>
      </div>

      <div className="px-6 md:px-12 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Export buttons */}
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em' }}
            className="uppercase text-[#525252] mb-6">Download Dataset</div>

          <div className="flex flex-col gap-3">
            {[
              { key: 'csv', label: 'Export as CSV', sub: 'Comma-separated, all rows', fn: exportCSV },
              { key: 'xlsx', label: 'Export as XLSX', sub: 'Excel with summary sheet', fn: exportXLSX },
              { key: 'json', label: 'Export as JSON', sub: 'Structured JSON array', fn: exportJSON },
              { key: 'insights', label: 'Export Insights TXT', sub: 'Human-readable field summary', fn: exportInsights },
            ].map(({ key, label, sub, fn }) => (
              <button key={key} onClick={fn}
                className={`border-2 border-black px-6 py-4 flex items-center justify-between group transition-colors duration-100 ${exported === key ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}>
                <div className="text-left">
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.05em' }}
                    className="font-medium uppercase">
                    {exported === key ? '✓ Downloaded' : label}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}
                    className={`mt-0.5 ${exported === key ? 'opacity-70' : 'text-[#525252] group-hover:text-white'}`}>
                    {sub}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2v9M4 8l4 4 4-4M2 13h12" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em' }}
            className="uppercase text-[#525252] mb-6">Field Summary</div>

          <div className="border-2 border-black overflow-hidden max-h-96 overflow-y-auto">
            {fields.map((f, i) => {
              const s = stats[f]
              return (
                <div key={f}
                  className={`px-5 py-4 flex flex-col gap-1 ${i > 0 ? 'border-t border-[#E5E5E5]' : ''} hover:bg-[#F5F5F5] transition-colors duration-75`}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                      className="font-medium truncate max-w-48">{f}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em' }}
                      className={`uppercase px-2 py-0.5 border ${s.type === 'numeric' ? 'border-black bg-black text-white' : 'border-[#E5E5E5] text-[#525252]'}`}>
                      {s.type}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                    className="text-[#525252]">
                    {s.type === 'numeric' ? (
                      <>min {fmt(s.min)} · max {fmt(s.max)} · mean {fmt(s.mean)} · {s.nulls} nulls</>
                    ) : (
                      <>{s.unique} unique · top: "{String(s.topValue || '—').substring(0, 20)}" ({s.topCount}x) · {s.nulls} nulls</>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
