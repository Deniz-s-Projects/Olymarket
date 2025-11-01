import { Fragment, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

type PickupLocation = {
  id: string
  name: string
  description: string
  coordinates: [number, number]
  radius: number
}

const pickupLocations: PickupLocation[] = [
  {
    id: 'dhl-packstation',
    name: 'DHL-Packstation 135',
    description: 'DHL Packstation located at the southern entrance',
    coordinates: [48.1795, 11.5538],
    radius: 10,
  },
  {
    id: 'olydorf-marienplatz',
    name: 'Olydorf Marienplatz',
    description: 'Central plaza with visible presence and easy U-bahn access.',
    coordinates: [48.1792, 11.5520],
    radius: 10,
  },
  {
    id: 'die-bierstube',
    name: 'Die Bierstube',
    description: 'Community bar, disco & lounge.',
    coordinates: [48.1800, 11.5530],
    radius: 10,
  },
  {
    id: 'alte-mensa',
    name: 'Alte Mensa',
    description: 'Old cafeteria from the Olympic games. Used as a library and admin building today.',
    coordinates: [48.1802, 11.5527],
    radius: 10,
  },
]

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const fallbackList = (
  <ul className="mt-4 space-y-3 text-sm text-slate-600">
    {pickupLocations.map((location) => (
      <li key={location.id}>
        <p className="font-semibold text-slate-800">{location.name}</p>
        <p className="text-slate-600">{location.description}</p>
      </li>
    ))}
  </ul>
)

const PickupLocationsMap = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const mapCenter = useMemo<[number, number]>(() => {
    const average = pickupLocations.reduce(
      (acc, location) => {
        const [lat, lng] = location.coordinates
        return {
          lat: acc.lat + lat / pickupLocations.length,
          lng: acc.lng + lng / pickupLocations.length,
        }
      },
      { lat: 0, lng: 0 }
    )

    return [average.lat, average.lng]
  }, [])

  const bounds = useMemo(() => {
    const locations = pickupLocations.map((location) => location.coordinates)
    return L.latLngBounds(locations)
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Suggested meetup points</h2>
          <p className="text-sm text-slate-600">
            Choose one of these public gathering spots around the Olympic Village for safe, convenient pickups.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
        {isClient ? (
          <MapContainer
            center={mapCenter}
            bounds={bounds}
            scrollWheelZoom={false}
            className="h-72 w-full"
            style={{ minHeight: '18rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pickupLocations.map((location) => (
              <Fragment key={location.id}>
                <Circle
                  center={location.coordinates}
                  radius={location.radius}
                  pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }}
                />
                <Marker position={location.coordinates}>
                  <Popup>
                    <div>
                      <strong>{location.name}</strong>
                      <p className="mt-1 text-sm">{location.description}</p>
                    </div>
                  </Popup>
                </Marker>
              </Fragment>
            ))}
          </MapContainer>
        ) : (
          <div className="flex h-72 w-full items-center justify-center bg-slate-50 text-sm text-slate-500">
            Loading map…
          </div>
        )}
      </div>

      {fallbackList}
    </div>
  )
}

export default PickupLocationsMap
