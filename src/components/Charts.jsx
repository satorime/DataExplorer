import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler
)

const MONOCHROME_COLORS = [
  '#000000', '#333333', '#555555', '#777777', '#999999',
  '#BBBBBB', '#222222', '#444444', '#666666', '#888888'
]

function inferFieldTypes(data, fields) {
  const types = {}
  for (const f of fields) {
    const sample = data.slice(0, 50).map(r => r[f]).filter(v => v !== null && v !== undefined)
    const nums = sample.filter(v => typeof v === 'number' || (!isNaN(parseFloat(v)) && isFinite(v)))
    types[f] = nums.length > sample.length * 0.7 ? 'numeric' : 'categorical'
  }
  return types
}

function buildBarChart(data, catField, numField) {
  const freq = {}
  for (const row of data) {
    const key = String(row[catField] ?? 'Unknown').substring(0, 30)
    const val = parseFloat(row[numField]) || 0
    freq[key] = (freq[key] || 0) + val
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15)
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
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15)
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

function buildLineChart(data, numFields) {
  const limited = data.slice(0, 100)
  return {
    labels: limited.map((_, i) => i + 1),
    datasets: numFields.slice(0, 3).map((f, i) => ({
      label: f,
      data: limited.map(r => parseFloat(r[f]) || 0),
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
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8)
  return {
    labels: sorted.map(([k]) => k),
    datasets: [{
      data: sorted.map(([, v]) => v),
      backgroundColor: MONOCHROME_COLORS.slice(0, sorted.length),
      borderColor: '#fff',
      borderWidth: 2,
    }]
  }
}

const BASE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
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
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 }, color: '#525252', maxRotation: 45 },
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
  const numFields = fields.filter(f => types[f] === 'numeric')
  const catFields = fields.filter(f => types[f] === 'categorical')

  const [selectedCat, setSelectedCat] = useState(catFields[0] || '')
  const [selectedNum, setSelectedNum] = useState(numFields[0] || '')

  const charts = useMemo(() => {
    const result = []

    // Bar: categorical × numeric
    if (catFields.length && numFields.length) {
      result.push({
        id: 'bar',
        title: `${selectedNum} by ${selectedCat}`,
        subtitle: 'Bar Chart',
        chart: <Bar
          data={buildBarChart(data, selectedCat, selectedNum)}
          options={{ ...BASE_OPTIONS, plugins: { ...BASE_OPTIONS.plugins, legend: { display: false } } }}
        />
      })
    }

    // Line: numeric fields over index
    if (numFields.length >= 1) {
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

    // Frequency bar for first categorical
    if (catFields.length) {
      result.push({
        id: 'freq',
        title: `${selectedCat} distribution`,
        subtitle: 'Frequency',
        chart: <Bar
          data={buildFrequencyChart(data, selectedCat)}
          options={{ ...BASE_OPTIONS, plugins: { ...BASE_OPTIONS.plugins, legend: { display: false } } }}
        />
      })
    }

    // Pie for categorical (≤8 unique values)
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
          options={{ responsive: true, maintainAspectRatio: true, plugins: BASE_OPTIONS.plugins }}
        />
      })
    }

    return result
  }, [data, catFields, numFields, selectedCat, selectedNum])

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
            { label: 'Total Rows', value: data.length.toLocaleString() },
            { label: 'Columns', value: fields.length },
            { label: 'Numeric Fields', value: numFields.length },
            { label: 'Categorical', value: catFields.length },
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
