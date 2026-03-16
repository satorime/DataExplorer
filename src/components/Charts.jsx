import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler, Decimation
} from 'chart.js'
import { Bar, Line, Doughnut, Scatter } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler, Decimation
)

const MONOCHROME_COLORS = [
  '#000000', '#333333', '#555555', '#777777', '#999999',
  '#BBBBBB', '#222222', '#444444', '#666666', '#888888'
]

// Returns true if the majority of sample values look like date strings
function isDatetimeLike(sample) {
  const valid = sample.filter(v => {
    if (v == null || v === '') return false
    const s = String(v)
    if (!/[-/:]/.test(s)) return false   // must have separators
    const d = new Date(s)
    return !isNaN(d.getTime())
  })
  return valid.length > sample.length * 0.7
}

function inferFieldTypes(data, fields) {
  const types = {}
  for (const f of fields) {
    const sample = data.slice(0, 50).map(r => r[f]).filter(v => v !== null && v !== undefined && v !== '')
    const dateNameHint = /date|time|datetime|timestamp|_dt$|_at$/i.test(f)
    if (dateNameHint || isDatetimeLike(sample)) {
      types[f] = 'datetime'
      continue
    }
    const nums = sample.filter(v => typeof v === 'number' || (!isNaN(parseFloat(v)) && isFinite(v)))
    types[f] = nums.length > sample.length * 0.7 ? 'numeric' : 'categorical'
  }
  return types
}

const LINE_MAX_POINTS = 2000

function buildBarChart(data, catField, numField) {
  const freq = {}
  for (const row of data) {
    const key = String(row[catField] ?? 'Unknown').substring(0, 30)
    const val = parseFloat(row[numField]) || 0
    freq[key] = (freq[key] || 0) + val
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
  return {
    labels: sorted.map(([k]) => k),
    datasets: [{
      label: numField,
      data: sorted.map(([, v]) => Math.round(v * 100) / 100),
      backgroundColor: '#000',
      borderColor: '#000',
      borderWidth: 0,
    }]
  }
}

function buildFrequencyChart(data, field) {
  const freq = {}
  for (const row of data) {
    const key = String(row[field] ?? 'Unknown').substring(0, 30)
    freq[key] = (freq[key] || 0) + 1
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
  return {
    labels: sorted.map(([k]) => k),
    datasets: [{
      label: 'Count',
      data: sorted.map(([, v]) => v),
      backgroundColor: '#000',
      borderColor: '#000',
      borderWidth: 0,
    }]
  }
}

// Time series: sort rows by datetime field, downsample, then plot numerics
function buildTimeSeriesChart(data, dateField, numFields) {
  const sorted = [...data].sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]))
  const step = sorted.length > LINE_MAX_POINTS ? Math.ceil(sorted.length / LINE_MAX_POINTS) : 1
  const sampled = step > 1 ? sorted.filter((_, i) => i % step === 0) : sorted
  return {
    labels: sampled.map(r => {
      const d = new Date(r[dateField])
      return isNaN(d.getTime()) ? String(r[dateField]) : d.toLocaleDateString()
    }),
    datasets: numFields.slice(0, 3).map((f, i) => ({
      label: f,
      data: sampled.map(r => parseFloat(r[f]) || 0),
      borderColor: MONOCHROME_COLORS[i * 2],
      backgroundColor: 'transparent',
      borderWidth: i === 0 ? 2 : 1,
      pointRadius: 0,
      tension: 0.3,
    }))
  }
}

// Generic line chart (no datetime axis) — uniform downsample
function buildLineChart(data, numFields) {
  const step = data.length > LINE_MAX_POINTS ? Math.ceil(data.length / LINE_MAX_POINTS) : 1
  const sampled = step > 1 ? data.filter((_, i) => i % step === 0) : data
  return {
    labels: sampled.map((_, i) => i * step + 1),
    datasets: numFields.slice(0, 3).map((f, i) => ({
      label: f,
      data: sampled.map(r => parseFloat(r[f]) || 0),
      borderColor: MONOCHROME_COLORS[i * 2],
      backgroundColor: 'transparent',
      borderWidth: i === 0 ? 2 : 1,
      pointRadius: 0,
      tension: 0.3,
    }))
  }
}

function buildPieChart(data, field) {
  const freq = {}
  for (const row of data) {
    const key = String(row[field] ?? 'Unknown').substring(0, 25)
    freq[key] = (freq[key] || 0) + 1
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
  return {
    labels: sorted.map(([k]) => k),
    datasets: [{
      data: sorted.map(([, v]) => v),
      backgroundColor: sorted.map((_, i) => MONOCHROME_COLORS[i % MONOCHROME_COLORS.length]),
      borderColor: '#fff',
      borderWidth: 2,
    }]
  }
}

// Histogram: bins a numeric field into `bins` equal-width buckets
function buildHistogram(data, field, bins = 20) {
  const vals = data.map(r => parseFloat(r[field])).filter(v => !isNaN(v))
  if (!vals.length) return null
  const min = vals.reduce((a, b) => Math.min(a, b), Infinity)
  const max = vals.reduce((a, b) => Math.max(a, b), -Infinity)
  if (min === max) return null
  const binSize = (max - min) / bins
  const counts = new Array(bins).fill(0)
  for (const v of vals) {
    const idx = Math.min(Math.floor((v - min) / binSize), bins - 1)
    counts[idx]++
  }
  return {
    labels: Array.from({ length: bins }, (_, i) => {
      const lo = min + i * binSize
      const hi = lo + binSize
      return `${lo.toFixed(1)}–${hi.toFixed(1)}`
    }),
    datasets: [{
      label: `${field} distribution`,
      data: counts,
      backgroundColor: '#333',
      borderColor: '#000',
      borderWidth: 1,
    }]
  }
}

// Scatter: sample down for perf, plot x vs y numeric fields
function buildScatterChart(data, xField, yField) {
  const step = data.length > LINE_MAX_POINTS ? Math.ceil(data.length / LINE_MAX_POINTS) : 1
  const sampled = step > 1 ? data.filter((_, i) => i % step === 0) : data
  return {
    datasets: [{
      label: `${xField} vs ${yField}`,
      data: sampled
        .map(r => ({ x: parseFloat(r[xField]), y: parseFloat(r[yField]) }))
        .filter(p => !isNaN(p.x) && !isNaN(p.y)),
      backgroundColor: 'rgba(0,0,0,0.35)',
      pointRadius: sampled.length > 500 ? 2 : 4,
    }]
  }
}

const BASE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  animation: false,
  plugins: {
    legend: {
      labels: {
        font: { family: "'JetBrains Mono', monospace", size: 11 },
        color: '#000',
        boxWidth: 12,
        padding: 16
      }
    },
    tooltip: {
      titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
      bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
      backgroundColor: '#000',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 0,
    }
  },
  scales: {
    x: {
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 }, color: '#525252', maxRotation: 90, maxTicksLimit: 40 },
      grid: { color: '#E5E5E5', lineWidth: 1 },
      border: { color: '#000', width: 2 }
    },
    y: {
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 }, color: '#525252' },
      grid: { color: '#E5E5E5', lineWidth: 1 },
      border: { color: '#000', width: 2 }
    }
  }
}

const NO_LEGEND = { ...BASE_OPTIONS, plugins: { ...BASE_OPTIONS.plugins, legend: { display: false } } }

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="border-2 border-black p-6 group hover:bg-[#F5F5F5] transition-colors duration-100">
      <div className="mb-4">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em' }}
          className="uppercase text-[#525252] mb-1">{subtitle}</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          className="text-lg font-bold">{title}</div>
      </div>
      {children}
    </div>
  )
}

export default function Charts({ data, fields }) {
  const types = useMemo(() => inferFieldTypes(data, fields), [data, fields])
  const numFields    = fields.filter(f => types[f] === 'numeric')
  const catFields    = fields.filter(f => types[f] === 'categorical')
  const dateFields   = fields.filter(f => types[f] === 'datetime')

  const [selectedCat,   setSelectedCat]   = useState(catFields[0]  || '')
  const [selectedNum,   setSelectedNum]   = useState(numFields[0]  || '')
  const [selectedNum2,  setSelectedNum2]  = useState(numFields[1]  || numFields[0] || '')
  const [selectedDate,  setSelectedDate]  = useState(dateFields[0] || '')

  const charts = useMemo(() => {
    const result = []

    // 1. Time Series — datetime × numeric (sorted by date)
    if (dateFields.length && numFields.length) {
      result.push({
        id: 'timeseries',
        title: `${numFields.slice(0, 3).join(', ')} over ${selectedDate}`,
        subtitle: 'Time Series',
        chart: <Line
          data={buildTimeSeriesChart(data, selectedDate, numFields)}
          options={BASE_OPTIONS}
        />
      })
    }

    // 2. Bar: categorical × numeric
    if (catFields.length && numFields.length) {
      result.push({
        id: 'bar',
        title: `${selectedNum} by ${selectedCat}`,
        subtitle: 'Bar Chart',
        chart: <Bar
          data={buildBarChart(data, selectedCat, selectedNum)}
          options={NO_LEGEND}
        />
      })
    }

    // 3. Frequency distribution of a categorical field
    if (catFields.length) {
      result.push({
        id: 'freq',
        title: `${selectedCat} distribution`,
        subtitle: 'Frequency',
        chart: <Bar
          data={buildFrequencyChart(data, selectedCat)}
          options={NO_LEGEND}
        />
      })
    }

    // 4. Line chart over row index (only when no datetime available)
    if (!dateFields.length && numFields.length >= 1) {
      result.push({
        id: 'line',
        title: 'Numeric trends over records',
        subtitle: 'Line Chart',
        chart: <Line
          data={buildLineChart(data, numFields)}
          options={BASE_OPTIONS}
        />
      })
    }

    // 5. Histogram: distribution of a numeric field
    if (numFields.length >= 1) {
      const histData = buildHistogram(data, selectedNum)
      if (histData) {
        result.push({
          id: 'histogram',
          title: `${selectedNum} distribution`,
          subtitle: 'Histogram',
          chart: <Bar
            data={histData}
            options={NO_LEGEND}
          />
        })
      }
    }

    // 6. Scatter: relationship between two numeric fields
    if (numFields.length >= 2) {
      result.push({
        id: 'scatter',
        title: `${selectedNum} vs ${selectedNum2}`,
        subtitle: 'Scatter Plot',
        chart: <Scatter
          data={buildScatterChart(data, selectedNum, selectedNum2)}
          options={BASE_OPTIONS}
        />
      })
    }

    // 7. Doughnut for low-cardinality categoricals
    const pieField = catFields.find(f => {
      const uniq = new Set(data.map(r => r[f])).size
      return uniq >= 2 && uniq <= 12
    })
    if (pieField) {
      result.push({
        id: 'pie',
        title: `${pieField} proportion`,
        subtitle: 'Doughnut Chart',
        chart: <Doughnut
          data={buildPieChart(data, pieField)}
          options={{ responsive: true, maintainAspectRatio: true, animation: false, plugins: BASE_OPTIONS.plugins }}
        />
      })
    }

    return result
  }, [data, catFields, numFields, dateFields, selectedCat, selectedNum, selectedNum2, selectedDate])

  return (
    <section id="charts" className="border-b-4 border-black">
      {/* Header */}
      <div className="px-6 md:px-12 py-8 border-b-2 border-black flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em' }}
            className="uppercase text-[#525252] mb-1 flex items-center gap-3">
            <span className="w-6 h-px bg-[#525252]" /> 02 Charts
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-2xl font-bold">
            Auto-generated visualizations
          </h2>
        </div>

        {/* Field selectors */}
        <div className="flex flex-wrap gap-2">
          {dateFields.length > 0 && (
            <div className="flex flex-col gap-1">
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em' }}
                className="uppercase text-[#525252]">Date/Time</label>
              <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                className="border-2 border-black px-3 py-2 bg-white focus:outline-none">
                {dateFields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
          {catFields.length > 0 && (
            <div className="flex flex-col gap-1">
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em' }}
                className="uppercase text-[#525252]">Category</label>
              <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                className="border-2 border-black px-3 py-2 bg-white focus:outline-none">
                {catFields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
          {numFields.length > 0 && (
            <div className="flex flex-col gap-1">
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em' }}
                className="uppercase text-[#525252]">Numeric</label>
              <select value={selectedNum} onChange={e => setSelectedNum(e.target.value)}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                className="border-2 border-black px-3 py-2 bg-white focus:outline-none">
                {numFields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
          {numFields.length >= 2 && (
            <div className="flex flex-col gap-1">
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em' }}
                className="uppercase text-[#525252]">Numeric 2</label>
              <select value={selectedNum2} onChange={e => setSelectedNum2(e.target.value)}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                className="border-2 border-black px-3 py-2 bg-white focus:outline-none">
                {numFields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, #fff 1px, #fff 2px)',
          backgroundSize: '4px 100%',
          opacity: 0.03
        }} />
        <div className="px-6 md:px-12 py-6 relative grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Rows',      value: data.length.toLocaleString() },
            { label: 'Columns',         value: fields.length },
            { label: 'Numeric Fields',  value: numFields.length },
            { label: 'Datetime Fields', value: dateFields.length },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em' }}
                className="uppercase opacity-60 mb-1">{label}</div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-3xl font-bold">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts grid */}
      <div className="p-6 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map(({ id, title, subtitle, chart }) => (
          <ChartCard key={id} title={title} subtitle={subtitle}>
            {chart}
          </ChartCard>
        ))}
        {charts.length === 0 && (
          <div className="border-2 border-black p-12 text-center col-span-2">
            <p style={{ fontFamily: "'Source Serif 4', Georgia, serif" }} className="text-[#525252] text-lg italic">
              No chartable data detected. Ensure your dataset has numeric or categorical columns.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
