export default function Header({ dataLoaded, fileName }) {
  return (
    <header className="border-b-4 border-black">
      {/* Top bar */}
      <div className="border-b border-black/10 px-6 md:px-12 py-2 flex items-center justify-between">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em' }}
          className="text-[#525252] uppercase">
          Public Dataset Explorer
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em' }}
          className="text-[#525252] uppercase">
          v1.0
        </span>
      </div>

      {/* Main header */}
      <div className="px-6 md:px-12 py-10 md:py-16 relative overflow-hidden">
        {/* Grid texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(#00000008 1px, transparent 1px), linear-gradient(90deg, #00000008 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-4 h-4 border-2 border-black" />
              <div className="h-px flex-1 max-w-24 bg-black" />
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.03em', lineHeight: 1 }}
              className="text-5xl md:text-7xl font-black text-black">
              DATA
            </h1>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.03em', lineHeight: 1 }}
              className="text-5xl md:text-7xl font-black text-black italic">
              Explorer
            </h1>
          </div>

          <div className="md:text-right max-w-xs">
            {dataLoaded ? (
              <div className="border-2 border-black p-4">
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em' }}
                  className="uppercase text-[#525252] mb-1">Active Dataset</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
                  className="font-medium truncate max-w-48">{fileName}</div>
              </div>
            ) : (
              <p style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                className="text-[#525252] text-lg leading-relaxed">
                Upload any CSV or JSON dataset to explore, visualize, and export insights.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section tabs */}
      {dataLoaded && (
        <div className="px-6 md:px-12 flex gap-0 border-t-2 border-black overflow-x-auto">
          {['Table', 'Charts', 'Map', 'Export'].map((tab, i) => (
            <a key={tab} href={`#${tab.toLowerCase()}`}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.1em' }}
              className="uppercase px-6 py-3 border-r border-black hover:bg-black hover:text-white transition-colors duration-100 whitespace-nowrap">
              {String(i + 1).padStart(2, '0')} {tab}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
