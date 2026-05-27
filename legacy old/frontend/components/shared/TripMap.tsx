"use client"

import { useMemo } from "react"
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api"
import { centerOfMarkers, zoomForMarkers, type GeoPoint } from "@/lib/geoHelper"

interface TripMapProps {
  markers: GeoPoint[]
  height?: string
  showRoute?: boolean
  interactive?: boolean
  satellite?: boolean
  className?: string
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

const MARKER_COLORS = ["#5B4FE8", "#00D4C8", "#EF4444", "#F59E0B", "#1A8A4A", "#8B5CF6"]

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", stylers: [{ color: "#b3d9f5" }] },
  { featureType: "landscape.natural", stylers: [{ color: "#e8f0e8" }] },
  { featureType: "landscape.man_made", stylers: [{ color: "#f0f4f8" }] },
  { featureType: "road", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#a0aec0" }, { weight: 1 }],
  },
]

export default function TripMap({
  markers,
  height = "100%",
  showRoute = true,
  interactive = true,
  satellite = false,
  className,
}: TripMapProps) {
  const center = useMemo(() => centerOfMarkers(markers), [markers])
  const zoom = useMemo(() => zoomForMarkers(markers.length), [markers.length])
  const path = useMemo(() => markers.map((m) => ({ lat: m.lat, lng: m.lng })), [markers])

  const { isLoaded } = useJsApiLoader({
    id: "totem-google-maps",
    googleMapsApiKey: API_KEY,
  })

  if (!API_KEY) {
    return (
      <div
        style={{ height }}
        className={`bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center rounded-xl ${className ?? ""}`}
      >
        <p className="text-xs text-gray-400 text-center px-4">
          Mapa no disponible — configura{" "}
          <code className="font-mono bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div
        style={{ height }}
        className={`bg-gray-100 animate-pulse ${className ?? ""}`}
        aria-label="Cargando mapa…"
      />
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height }}
      mapContainerClassName={className}
      center={center}
      zoom={zoom}
      options={{
        mapTypeId: satellite ? "satellite" : "roadmap",
        styles: satellite ? [] : MAP_STYLES,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        scrollwheel: interactive,
        gestureHandling: interactive ? "cooperative" : "none",
        clickableIcons: false,
      }}
    >
      {showRoute && markers.length > 1 && (
        <Polyline
          path={path}
          options={{
            strokeColor: "#5B4FE8",
            strokeOpacity: satellite ? 1 : 0.65,
            strokeWeight: 3,
            geodesic: true,
          }}
        />
      )}

      {markers.map((marker, i) => (
        <Marker
          key={`${marker.lat}-${marker.lng}-${i}`}
          position={{ lat: marker.lat, lng: marker.lng }}
          title={marker.label}
          label={{
            text: String(i + 1),
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "11px",
          }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: MARKER_COLORS[i % MARKER_COLORS.length],
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 10,
            labelOrigin: new google.maps.Point(0, 0),
          }}
        />
      ))}
    </GoogleMap>
  )
}
