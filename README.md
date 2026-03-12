# Dataset Explorer

A browser-based platform for exploring, visualizing, and exporting insights from any CSV or JSON dataset — no server required.

Built as a portfolio project demonstrating data engineering and visualization skills, with a focus on Philippine earthquake data and other public datasets.

---

## Features

### Upload
- Drag-and-drop or click-to-browse file upload
- Supports **CSV** and **JSON** formats
- Auto-parses column types (numeric vs. categorical) on load
- No file size limit — processing happens entirely in the browser

### Data Table
- Displays all rows with paginated navigation (20 rows per page)
- **Global search** across every column simultaneously
- **Per-column filtering** — select a specific field and filter by value
- **Sortable columns** — click any header to sort ascending/descending
- Null values shown explicitly for data quality awareness

### Charts (Auto-generated)
Charts are built automatically based on detected field types — no configuration needed.

| Chart type | When it appears |
|---|---|
| Bar chart | Categorical × numeric field combination |
| Line chart | Any numeric fields, plotted over row index |
| Frequency bar | Distribution of values in a categorical field |
| Doughnut chart | Categorical field with 2–12 unique values |

Field selectors let you pivot charts by choosing any categorical or numeric column.

A stats bar shows: total rows, column count, numeric field count, and categorical field count.

### Map Visualization
- Powered by **Leaflet** with OpenStreetMap tiles
- Auto-detects latitude/longitude columns by common field names (`lat`, `latitude`, `lon`, `lng`, `longitude`, `x`, `y`, etc.)
- Renders up to **2,000 points** as circle markers
- **Variable point size** — scale marker radius by any numeric field (e.g., magnitude, population)
- Click any marker for a popup showing all row values
- Falls back gracefully with a helpful message if no geo fields are found

### Export
| Format | Contents |
|---|---|
| CSV | Full dataset, comma-separated |
| XLSX | Full dataset + a Summary sheet with per-field statistics |
| JSON | Full dataset as a formatted JSON array |
| TXT Insights | Human-readable report: min, max, mean, median, sum for numeric fields; unique count, top value for categorical fields |

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool and dev server |
| Tailwind CSS | 4 | Utility-first styling |
| Chart.js + react-chartjs-2 | 4 / 5 | Bar, line, pie, doughnut charts |
| Leaflet + react-leaflet | 1.9 / 5 | Interactive map |
| PapaParse | 5 | CSV parsing (streaming, header detection, dynamic typing) |
| xlsx | 0.18 | Excel export with multiple sheets |
| file-saver | 2 | Cross-browser file download |
| react-dropzone | 15 | Drag-and-drop upload zone |

**Fonts:** Playfair Display · Source Serif 4 · JetBrains Mono (Google Fonts)

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install and run

```bash
# Clone or download the project
cd Datasearch

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static host (Netlify, Vercel, GitHub Pages, nginx, etc.).

```bash
# Preview the production build locally
npm run preview
```

---

## Supported Dataset Formats

### CSV
Any well-formed CSV with a header row.

```
date,magnitude,depth,latitude,longitude,location
2024-01-15,5.2,10,14.5995,120.9842,Manila
2024-01-16,4.8,25,7.0707,125.5858,Davao
```

### JSON
A JSON array of objects, all sharing the same keys.

```json
[
  { "date": "2024-01-15", "magnitude": 5.2, "depth": 10, "latitude": 14.5995, "longitude": 120.9842 },
  { "date": "2024-01-16", "magnitude": 4.8, "depth": 25, "latitude": 7.0707,  "longitude": 125.5858 }
]
```

---

## Map Auto-Detection

The map activates automatically when the dataset contains columns matching these names (case-sensitive):

**Latitude:** `lat`, `latitude`, `Latitude`, `LAT`, `y`, `Y`, `lat_deg`

**Longitude:** `lon`, `lng`, `longitude`, `Longitude`, `LON`, `LNG`, `x`, `X`, `lon_deg`

If your columns use different names, rename them before uploading.

---

## Project Structure

```
src/
├── components/
│   ├── Header.jsx        # App header, nav tabs, active dataset display
│   ├── UploadZone.jsx    # Drag-and-drop upload, CSV/JSON parsing
│   ├── DataTable.jsx     # Filterable, sortable, paginated data table
│   ├── Charts.jsx        # Auto-generated Chart.js visualizations
│   ├── MapPanel.jsx      # Leaflet map with auto geo-field detection
│   └── ExportPanel.jsx   # Field summary stats + multi-format export
├── App.jsx               # Root component, state management
├── index.css             # Global styles, Tailwind import, Google Fonts
└── main.jsx              # React entry point
```

---

## Design System

The UI follows a **Minimalist Monochrome** design language:

- **Palette:** Pure black (`#000`) and white (`#fff`) only — no accent colors
- **Typography:** Playfair Display (headlines) · Source Serif 4 (body) · JetBrains Mono (labels, data)
- **Borders:** Sharp 90° corners everywhere, no border-radius
- **Depth:** Created through color inversion and border weight — no shadows
- **Motion:** 100ms transitions maximum; hover states invert black/white
- **Textures:** Subtle repeating line patterns and grid overlays for depth

---

## Example Datasets to Try

Any public CSV works. Some suggestions:

- **PHIVOLCS earthquake catalog** — has latitude, longitude, magnitude, depth
- **PAGASA climate records** — temperature, rainfall by station
- **PSA population data** — regional/provincial breakdowns
- **World Bank open data** — country-level indicators (CSV export available)
- **Kaggle datasets** — search for any CSV under 50MB

---

## Browser Support

Chrome, Edge, Firefox, Safari — all modern versions. Requires JavaScript enabled. No backend, no cookies, no data leaves your machine.
