'use client'

import { useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface WordPin {
  word: string
  city: string | null
  country_code: string | null
  latitude: number
  longitude: number
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  word: string
  city: string | null
}

export default function WordMap({ pins }: { pins: WordPin[] }) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    word: '',
    city: null,
  })

  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="text-5xl mb-6">🌍</div>
        <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
          The map is waking up. Words will appear here as people post from around the world.
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-x-auto">
      {tooltip.visible && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 shadow-xl text-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <span className="text-purple-400 font-semibold">{tooltip.word}</span>
          {tooltip.city && (
            <span className="text-zinc-400 ml-1">· {tooltip.city}</span>
          )}
        </div>
      )}

      <div className="min-w-[600px]">
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 160 }}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#18181b"
                  stroke="#3f3f46"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {pins.map((pin, i) => (
            <Marker
              key={i}
              coordinates={[pin.longitude, pin.latitude]}
              onMouseEnter={(e) => {
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  word: pin.word,
                  city: pin.city,
                })
              }}
              onMouseMove={(e) => {
                setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }))
              }}
              onMouseLeave={() => {
                setTooltip((prev) => ({ ...prev, visible: false }))
              }}
            >
              <circle
                r={5}
                fill="rgba(168, 85, 247, 0.55)"
                stroke="rgba(192, 132, 252, 0.8)"
                strokeWidth={1}
                className="cursor-pointer hover:fill-purple-400 transition-colors"
              />
            </Marker>
          ))}
        </ComposableMap>
      </div>
    </div>
  )
}
