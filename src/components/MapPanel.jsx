import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const LAT_KEYS = ['lat', 'latitude', 'Latitude', 'LAT', 'y', 'Y', 'lat_deg']
const LON_KEYS = ['lon', 'lng', 'longitude', 'Longitude', 'LON', 'LNG', 'x', 'X', 'lon_deg']

function detectGeoFields(fields) {
  const lat = fields.find(f => LAT_KEYS.includes(f) || f.toLowerCase().includes('lat'))
  const lon = fields.find(f => LON_KEYS.includes(f) || f.toLowerCase().includes('lon') || f.toLowerCase().includes('lng'))
  return { lat, lon }
}

export default function MapPanel({ data, fields }) {
  const { lat: latField, lon: lonField } = useMemo(() => detectGeoFields(fields), [fields])
  const [colorField, setColorField] = useState('')
  const [sizeField, setSizeField] = useState('')
  const canvasRenderer = useMemo(() => L.canvas({ padding: 0.5 }), [])

  const numFields = useMemo(() => {
    return fields.filter(f => {
      const sample = data.slice(0, 20).map(r => r[f]).filter(v => v != null)
      return sample.filter(v => !isNaN(parseFloat(v))).length > sample.length * 0.7
    })
  }, [data, fields])

  const points = useMemo(() => {
    if (!latField || !lonField) return []
    return data
      .map((row, i) => ({
        lat: parseFloat(row[latField]),
        lon: parseFloat(row[lonField]),
        row,
        i
      }))
      .filter(p => !isNaN(p.lat) && !isNaN(p.lon) && p.lat >= -90 && p.lat <= 90 && p.lon >= -180 && p.lon <= 180)
  }, [data, latField, lonField])

  const center = useMemo(() => {
    if (!points.length) return [14.5995, 120.9842] // Manila default
    const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length
    const avgLon = points.reduce((s, p) => s + p.lon, 0) / points.length
    return [avgLat, avgLon]
  }, [points])

  // Size scale
  const sizeValues = useMemo(() => {
    if (!sizeField) return null
    const vals = points.map(p => parseFloat(p.row[sizeField]) || 0)
    const min = vals.reduce((a, b) => a < b ? a : b, Infinity)
    const max = vals.reduce((a, b) => a > b ? a : b, -Infinity)
    return { vals, min, max }
  }, [points, sizeField])

  const getRadius = (i) => {
    if (!sizeValues) return 6
    const v = sizeValues.vals[i]
    const norm = sizeValues.max > sizeValues.min
      ? (v - sizeValues.min) / (sizeValues.max - sizeValues.min)
      : 0.5
    return 4 + norm * 18
  }

  if (!latField || !lonField) {
    return (
      <section id="map" className="border-b-4 border-black">
        <div className="px-6 md:px-12 py-8 border-b-2 border-black">
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em' }}
            className="uppercase text-[#525252] mb-1 flex items-center gap-3">
            <span className="w-6 h-px bg-[#525252]" /> 03 Map
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-2xl font-bold">Geographic visualization</h2>
        </div>
        <div className="px-6 md:px-12 py-16 flex items-start gap-8">
          <div className="border-2 border-black p-8 max-w-lg">
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em' }}
              className="uppercase text-[#525252] mb-3">No geo fields detected</div>
            <p style={{ fontFamily: "'Source Serif 4', Georgia, serif" }} className="text-lg leading-relaxed mb-4">
              Map visualization requires latitude and longitude columns.
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }} className="text-[#525252]">
              Expected field names:<br />
              <strong>Lat:</strong> lat, latitude, y<br />
              <strong>Lon:</strong> lon, lng, longitude, x
            </p>
          </div>
          <div className="hidden md:block">
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.05em' }}
              className="uppercase text-[#525252] mb-3">Your columns</div>
            <div className="flex flex-wrap gap-2 max-w-md">
              {fields.map(f => (
                <span key={f} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                  className="border border-[#E5E5E5] px-2 py-1 text-[#525252]">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="map" className="border-b-4 border-black">
      {/* Header */}
      <div className="px-6 md:px-12 py-8 border-b-2 border-black flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em' }}
            className="uppercase text-[#525252] mb-1 flex items-center gap-3">
            <span className="w-6 h-px bg-[#525252]" /> 03 Map
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-2xl font-bold">
            {points.length.toLocaleString()} <span className="font-normal italic">points mapped</span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {numFields.length > 0 && (
            <div className="flex flex-col gap-1">
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em' }}
                className="uppercase text-[#525252]">Size by</label>
              <select value={sizeField} onChange={e => setSizeField(e.target.value)}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                className="border-2 border-black px-3 py-2 bg-white focus:outline-none">
                <option value="">Uniform</option>
                {numFields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="border-b-2 border-black" style={{ height: 520 }}>
        <MapContainer
          center={center}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p, i) => (
            <CircleMarker
              key={i}
              center={[p.lat, p.lon]}
              radius={getRadius(i)}
              renderer={canvasRenderer}
              pathOptions={{
                fillColor: '#000',
                fillOpacity: 0.7,
                color: '#000',
                weight: 1,
                opacity: 0.9
              }}
            >
              <Popup>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, minWidth: 160 }}>
                  {Object.entries(p.row).slice(0, 8).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-[#E5E5E5] py-1">
                      <span className="text-[#525252] uppercase text-[10px]">{k}</span>
                      <span className="font-medium truncate max-w-24">{String(v ?? '—')}</span>
                    </div>
                  ))}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Map stats */}
      <div className="px-6 md:px-12 py-4 flex flex-wrap gap-6">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
          className="text-[#525252]">
          Lat field: <strong className="text-black">{latField}</strong>
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
          className="text-[#525252]">
          Lon field: <strong className="text-black">{lonField}</strong>
        </span>
      </div>
    </section>
  )
}
