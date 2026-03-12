import { useState, useMemo } from 'react'

export default function DataTable({ data, fields }) {
  const [search, setSearch] = useState('')
  const [filterField, setFilterField] = useState('all')
  const [filterValue, setFilterValue] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const filtered = useMemo(() => {
    let rows = [...data]

    // Search
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(row =>
        Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q))
      )
    }

    // Filter by field
    if (filterField !== 'all' && filterValue) {
      rows = rows.filter(row =>
        String(row[filterField] ?? '').toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    // Sort
    if (sortField) {
      rows.sort((a, b) => {
        const av = a[sortField], bv = b[sortField]
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av
        }
        return sortDir === 'asc'
          ? String(av ?? '').localeCompare(String(bv ?? ''))
          : String(bv ?? '').localeCompare(String(av ?? ''))
      })
    }

    return rows
  }, [data, search, filterField, filterValue, sortField, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSort = (f) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
    setPage(0)
  }

  return (
    <section id="table" className="border-b-4 border-black">
      {/* Section header */}
      <div className="px-6 md:px-12 py-8 border-b-2 border-black flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em' }}
            className="uppercase text-[#525252] mb-1 flex items-center gap-3">
            <span className="w-6 h-px bg-[#525252]" /> 01 Data Table
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-2xl font-bold">
            {filtered.length.toLocaleString()} <span className="font-normal italic">of</span> {data.length.toLocaleString()} rows
          </h2>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search all columns..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
            className="border-2 border-black px-3 py-2 bg-white placeholder:text-[#525252] w-48 focus:outline-none focus:border-[3px]"
          />
          <select
            value={filterField}
            onChange={e => { setFilterField(e.target.value); setPage(0) }}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
            className="border-2 border-black px-3 py-2 bg-white focus:outline-none">
            <option value="all">All columns</option>
            {fields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          {filterField !== 'all' && (
            <input
              type="text"
              placeholder={`Filter by ${filterField}...`}
              value={filterValue}
              onChange={e => { setFilterValue(e.target.value); setPage(0) }}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
              className="border-2 border-black px-3 py-2 bg-white placeholder:text-[#525252] w-40 focus:outline-none focus:border-[3px]"
            />
          )}
          {(search || filterValue) && (
            <button
              onClick={() => { setSearch(''); setFilterValue(''); setFilterField('all'); setPage(0) }}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em' }}
              className="border-2 border-black px-3 py-2 uppercase hover:bg-black hover:text-white transition-colors duration-100">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: fields.length * 140 }}>
          <thead>
            <tr>
              {fields.map(f => (
                <th key={f}
                  onClick={() => handleSort(f)}
                  className="cursor-pointer hover:bg-[#222] select-none"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: '#000',
                    color: '#fff',
                    padding: '12px 16px',
                    borderRight: '1px solid #333',
                    whiteSpace: 'nowrap',
                    textAlign: 'left'
                  }}>
                  {f}
                  {sortField === f && (
                    <span className="ml-2">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i} className="hover:bg-[#F5F5F5] transition-colors duration-75">
                {fields.map(f => (
                  <td key={f}
                    title={String(row[f] ?? '')}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      padding: '10px 16px',
                      borderBottom: '1px solid #E5E5E5',
                      borderRight: '1px solid #E5E5E5',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                    {row[f] === null || row[f] === undefined ? (
                      <span className="text-[#525252] italic">null</span>
                    ) : String(row[f])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 md:px-12 py-4 border-t-2 border-black flex items-center justify-between">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.05em' }}
            className="text-[#525252]">
            Page {page + 1} of {totalPages} &nbsp;·&nbsp; {PAGE_SIZE * page + 1}–{Math.min(PAGE_SIZE * (page + 1), filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
              className="border border-black px-3 py-1.5 disabled:opacity-30 hover:bg-black hover:text-white transition-colors duration-100">
              ««
            </button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
              className="border border-black px-3 py-1.5 disabled:opacity-30 hover:bg-black hover:text-white transition-colors duration-100">
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5))
              const p = start + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                  className={`border border-black px-3 py-1.5 transition-colors duration-100 ${p === page ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}>
                  {p + 1}
                </button>
              )
            })}
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
              className="border border-black px-3 py-1.5 disabled:opacity-30 hover:bg-black hover:text-white transition-colors duration-100">
              ›
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
              className="border border-black px-3 py-1.5 disabled:opacity-30 hover:bg-black hover:text-white transition-colors duration-100">
              »»
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
