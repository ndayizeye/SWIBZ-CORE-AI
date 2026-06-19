/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  Map as MapIcon,
  Truck,
  DollarSign,
  UserCheck,
  Navigation,
  Check,
  Settings,
  Route as RouteIcon,
  Activity,
  UserPlus,
  Plus,
  X,
  FileCode,
  Globe,
  Compass,
  Sparkles,
  Info
} from 'lucide-react';
import { Order, Rider } from '../types.js';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface DeliveryModuleProps {
  tenantId: string;
  orders: Order[];
  riders: Rider[];
  onRefresh: () => void;
}

// Subcomponent: Live Places Autocomplete Search Input
function LocationInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  onSelectCoords
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onSelectCoords: (lat: number, lng: number, address: string) => void;
}) {
  const placesLib = useMapsLibrary('places');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!placesLib || !value || value.length < 3) {
      setSuggestions([]);
      return;
    }

    const service = new google.maps.places.AutocompleteService();
    const timeout = setTimeout(() => {
      service.getPlacePredictions({ input: value, componentRestrictions: { country: 'ug' } }, (predictions) => {
        if (predictions) {
          setSuggestions(predictions);
        }
      });
    }, 200);

    return () => clearTimeout(timeout);
  }, [placesLib, value]);

  const handlePredictionSelect = (pred: any) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: pred.place_id }, (results) => {
      if (results && results[0]) {
        const loc = results[0].geometry.location;
        onSelectCoords(loc.lat(), loc.lng(), results[0].formatted_address);
        setIsOpen(false);
      }
    });
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-[9px] font-bold text-cyan-400 uppercase tracking-wider">{label}</label>
      </div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full px-3 py-2 text-xs border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-500 rounded-lg placeholder-white/30"
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-[100] left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
          {suggestions.map((p) => (
            <button
              type="button"
              key={p.place_id}
              onClick={() => handlePredictionSelect(p)}
              className="w-full text-left px-3 py-2 text-[11px] hover:bg-neutral-800 text-white border-b border-white/5 truncate block cursor-pointer transition-colors"
            >
              {p.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Subcomponent: Route display and computing coordinates
function RouteDisplay({
  origin,
  destination,
  waypoints,
  onRouteComputed
}: {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  waypoints: Array<{ lat: number; lng: number }>;
  onRouteComputed: (results: { distanceKm: number; durationMins: number; status: string }) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;

    // Clean old lines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const originLatLng = new google.maps.LatLng(origin.lat, origin.lng);
    const destinationLatLng = new google.maps.LatLng(destination.lat, destination.lng);
    
    const intermediatePoints = waypoints.map(wp => ({
      location: { lat: wp.lat, lng: wp.lng }
    }));

    routesLib.Route.computeRoutes({
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      intermediates: intermediatePoints.length > 0 ? (intermediatePoints as any[]) : undefined,
      travelMode: 'DRIVING',
      routingPreference: 'TRAFFIC_AWARE',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    })
      .then(({ routes }) => {
        if (routes && routes[0]) {
          const mainRoute = routes[0];
          
          // Draw polylines
          const polyOpts: google.maps.PolylineOptions = {
            strokeColor: '#22d3ee',
            strokeOpacity: 0.85,
            strokeWeight: 4,
          };
          const newPolylines = mainRoute.createPolylines();
          newPolylines.forEach((p) => {
            p.setOptions(polyOpts);
            p.setMap(map);
          });
          polylinesRef.current = newPolylines;

          // Adjust bounds
          if (mainRoute.viewport) {
            map.fitBounds(mainRoute.viewport);
          }

          // Calculate metrics
          const totalDistanceMeters = mainRoute.distanceMeters || 0;
          
          let totalDurationMillis = 0;
          if (mainRoute.durationMillis) {
            const raw = mainRoute.durationMillis.toString();
            totalDurationMillis = Number(raw.replace('s', '') || 0) * 1000;
          }
          
          const distanceKh = totalDistanceMeters / 1000;
          const durationMn = totalDurationMillis / 1000 / 60;

          onRouteComputed({
            distanceKm: distanceKh,
            durationMins: durationMn,
            status: 'Success'
          });
        }
      })
      .catch((err) => {
        console.error('Compute routes failed:', err);
        onRouteComputed({ distanceKm: 0, durationMins: 0, status: 'Error' });
      });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
    };
  }, [routesLib, map, origin, destination, waypoints, onRouteComputed]);

  return null;
}

export default function DeliveryModule({ tenantId, orders, riders, onRefresh }: DeliveryModuleProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  
  // Custom interactive pricing rules matching the jQuery constants
  const [startingPrice, setStartingPrice] = useState(1000); // base Starting fee
  const [pricePerKm, setPricePerKm] = useState(1100); // charge per KM
  const [minFareEnforced, setMinFareEnforced] = useState(5000); // 5000 UGX min fare

  // Toggle mode
  const [mapInterface, setMapInterface] = useState<'google' | 'simulated'>(hasValidKey ? 'google' : 'simulated');

  // Multi-stop estimations states (jQuery equivalents)
  const [locInputs, setLocInputs] = useState<Array<{ id: string; val: string; lat?: number; lng?: number }>>([
    { id: '1', val: 'Kampala Rd, Kampala', lat: 0.3136, lng: 32.5811 },
    { id: '2', val: 'Ntinda, Kampala', lat: 0.3533, lng: 32.6120 }
  ]);
  const [lastLocationTextBox, setLastLocationTextBox] = useState<string | null>(null);
  
  // Estimate calculations outputs
  const [distanceInKM, setDistanceInKM] = useState(0);
  const [calculatedDuration, setCalculatedDuration] = useState(0);
  const [travelPrice, setTravelPrice] = useState(0);
  const [totalFare, setTotalFare] = useState(0);
  const [priceCalculated, setPriceCalculated] = useState(false);
  const [tempRouteOutput, setTempRouteOutput] = useState<{ origin: any; destination: any; waypoints: any[] } | null>(null);

  // Active Dispatch simulations
  const [riderCoords, setRiderCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [transitPct, setTransitPct] = useState(0);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  // Tracker static configs
  const pickupCoords = selectedOrder ? lookupCoordinatesSim(selectedOrder.pickup_address) : { lat: 0.3533, lng: 32.6120 };
  const dropoffCoords = selectedOrder ? lookupCoordinatesSim(selectedOrder.dropoff_address) : { lat: 0.3341, lng: 32.5977 };

  function lookupCoordinatesSim(locName: string) {
    const loc = locName.toLowerCase();
    if (loc.includes('ntinda')) return { lat: 0.3533, lng: 32.6120 };
    if (loc.includes('kololo')) return { lat: 0.3341, lng: 32.5977 };
    if (loc.includes('nakasero')) return { lat: 0.3224, lng: 32.5833 };
    if (loc.includes('muyenga')) return { lat: 0.2980, lng: 32.6144 };
    if (loc.includes('mutungo')) return { lat: 0.3315, lng: 32.6410 };
    return { lat: 0.3136, lng: 32.5811 };
  }

  // Live order tracker simulation loop
  useEffect(() => {
    if (!selectedOrder || selectedOrder.status !== 'in_transit') {
      setRiderCoords(null);
      setTransitPct(0);
      return;
    }

    setRiderCoords(pickupCoords);
    setTransitPct(0);

    const interval = setInterval(() => {
      setTransitPct((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          triggerOrderStatusUpdate(selectedOrder.id, 'completed');
          return 100;
        }

        const nextPct = prev + 10;
        const interpolatedLat = pickupCoords.lat + (dropoffCoords.lat - pickupCoords.lat) * (nextPct / 100);
        const interpolatedLng = pickupCoords.lng + (dropoffCoords.lng - pickupCoords.lng) * (nextPct / 100);

        setRiderCoords({ lat: interpolatedLat, lng: interpolatedLng });
        return nextPct;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedOrderId, selectedOrder?.status]);

  const triggerOrderStatusUpdate = async (orderId: string, status: Order['status'], riderId?: string | null) => {
    try {
      const res = await fetch(`/api/order/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rider_id: riderId })
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRiderSim = async () => {
    const names = ['Emmanuel Odong', 'Sula Musoke', 'Farouk Ssekyanzi', 'Ismail Katende'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomPhone = `+25677${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const res = await fetch(`/api/tenant/${tenantId}/rider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: randomName, phone: randomPhone })
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Multiple Inputs logic
  const addLocationBox = () => {
    const nextId = (Math.max(...locInputs.map(l => parseInt(l.id) || 0)) + 1).toString();
    setLocInputs([...locInputs, { id: nextId, val: '' }]);
    setPriceCalculated(false);
  };

  const removeLocation = (id: string) => {
    if (locInputs.length <= 2) {
      alert("At least source and destination must exist.");
      return;
    }
    setLocInputs(locInputs.filter(l => l.id !== id));
    setPriceCalculated(false);
  };

  const handleClearDirections = () => {
    if (window.confirm("Are you sure you want to clear all locations?")) {
      setLocInputs([
        { id: '1', val: '', lat: undefined, lng: undefined },
        { id: '2', val: '', lat: undefined, lng: undefined }
      ]);
      setDistanceInKM(0);
      setCalculatedDuration(0);
      setTravelPrice(0);
      setTotalFare(0);
      setPriceCalculated(false);
      setTempRouteOutput(null);
    }
  };

  // Triggers real Route displays on the map
  const handleCalculateFare = () => {
    const empties = locInputs.some(item => !item.val.trim());
    if (empties) {
      alert("Please enter all locations.");
      return;
    }

    const missingCoords = locInputs.some(item => !item.lat || !item.lng);
    if (missingCoords) {
      alert("Please select predictions from the address dropdown lists to retrieve coordinates.");
      return;
    }

    // Set temporary route config to trigger RouteDisplay subcomponent
    const origin = { lat: locInputs[0].lat!, lng: locInputs[0].lng! };
    const destination = { lat: locInputs[locInputs.length - 1].lat!, lng: locInputs[locInputs.length - 1].lng! };
    const wpts = locInputs.slice(1, -1).map(item => ({ lat: item.lat!, lng: item.lng! }));

    setTempRouteOutput({ origin, destination, waypoints: wpts });
  };

  const handleRouteComputed = ({ distanceKm, durationMins, status }: { distanceKm: number; durationMins: number; status: string }) => {
    if (status === 'Error') {
      alert("Google Route computation failed. No results found for this search.");
      setPriceCalculated(false);
      return;
    }

    const calculatedTravelPrice = pricePerKm * distanceKm;
    let computedFare = startingPrice + calculatedTravelPrice;
    
    // Apply 5000 limit matching custom jQuery
    if (computedFare < minFareEnforced) {
      computedFare = minFareEnforced;
    }

    setDistanceInKM(distanceKm);
    setCalculatedDuration(durationMins);
    setTravelPrice(calculatedTravelPrice);
    setTotalFare(computedFare);
    setPriceCalculated(true);
  };

  const handleExportJSON = () => {
    if (!priceCalculated) {
      alert("Please calculate the fare first.");
      return;
    }
    const locations = locInputs.map((l, index) => ({
      index,
      address: l.val,
      lat: l.lat,
      lng: l.lng
    }));
    const data = {
      locations,
      distanceInKM,
      startingPrice,
      travelPrice,
      totalFare,
      durationInMinutes: calculatedDuration
    };
    alert(JSON.stringify(data, null, 2));
  };

  // Quick Dispatch directly from estimation result
  const handleDispatchEstimatedWay = async () => {
    if (!priceCalculated) return;
    try {
      const res = await fetch(`/api/tenant/${tenantId}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_address: locInputs[0].val,
          dropoff_address: locInputs[locInputs.length - 1].val,
          package_details: `Quick dispatch multi-stop (${locInputs.length} stops)`,
          fare_ugx: totalFare
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Order successfully created! Order Ref: ${data.order.id}`);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatHoursMins = (minutes: number) => {
    if (!minutes) return '0 mins';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    let out = '';
    if (hrs > 0) out += `${hrs} hour${hrs > 1 ? 's' : ''}, `;
    out += `${mins} minute${mins !== 1 ? 's' : ''}`;
    return out;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[#F0F0F0] font-sans">
      {/* Col 1 & 2: Active Maps, Rates configure and Orders queue */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Pricing Matrix Config */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-cyan-400" />
              Fare Rules Studio
            </h2>
            <p className="text-[10px] text-white/40 mt-0.5">Custom formula: Base Starting Fee + (Distance × UGX per KM). Minimum threshold enforced.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#F0F0F0]/50 font-semibold">Starting Base</span>
              <input
                type="number"
                value={startingPrice}
                onChange={(e) => setStartingPrice(Number(e.target.value))}
                className="w-20 px-2 py-1 text-xs border border-white/10 bg-black text-white font-bold rounded-lg focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#F0F0F0]/50 font-semibold">UGX / KM</span>
              <input
                type="number"
                value={pricePerKm}
                onChange={(e) => setPricePerKm(Number(e.target.value))}
                className="w-20 px-2 py-1 text-xs border border-white/10 bg-black text-white font-bold rounded-lg focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-purple-400 font-semibold">Min Fare</span>
              <input
                type="number"
                value={minFareEnforced}
                onChange={(e) => setMinFareEnforced(Number(e.target.value))}
                className="w-20 px-2 py-1 text-xs border border-purple-500/30 bg-black text-purple-300 font-bold rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Map Interface Tabs: Live Google Map vs Simulated SVG */}
        <div className="flex bg-[#050505] p-1 border border-white/10 rounded-xl gap-1">
          <button
            onClick={() => setMapInterface('google')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mapInterface === 'google' ? 'bg-cyan-500 text-black shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Live Google Map GIS (Estimate Routing & Autocomplete)
          </button>
          <button
            onClick={() => setMapInterface('simulated')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mapInterface === 'simulated' ? 'bg-[#151515] text-cyan-400 border border-cyan-500/25' : 'text-white/60 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Mock Street SVG Tracker Map
          </button>
        </div>

        {/* MAP VISUALIZER PANELS */}
        {mapInterface === 'google' ? (
          <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 overflow-hidden flex flex-col min-h-[500px]">
            {/* Google map keys checker */}
            {!hasValidKey ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-black rounded-lg border border-white/5">
                <Compass className="w-12 h-12 text-cyan-500/40 mb-3 animate-spin" />
                <h3 className="text-sm font-bold text-white mb-2">Google Maps Key Needed for Live GIS</h3>
                <p className="text-xs text-white/50 max-w-md leading-relaxed mb-4">
                  Provide your console credentials to load fully active spatial path calculations, live autocomplete suggestions, and routes.
                </p>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-left text-[11px] font-mono leading-relaxed text-white/70 max-w-md w-full">
                  <span className="text-cyan-400 block font-bold mb-1">To Add Your API Key:</span>
                  1. Get an API key from Google Cloud Console.<br />
                  2. Open <strong className="text-white">Settings</strong> (⚙️ gear icon, top-right panel)<br />
                  3. Go to <strong className="text-white">Secrets</strong> → Add <code className="text-pink-400 bg-pink-950/20 px-1 py-0.5 rounded">GOOGLE_MAPS_PLATFORM_KEY</code><br />
                  4. Paste your key and click Enter. The app updates dynamically!
                </div>
                <div className="mt-4 text-[10px] text-white/30 italic">
                  *Meanwhile, you can toggle back to the "Mock Street SVG Tracker Map" above to run client delivery operations!
                </div>
              </div>
            ) : (
              <APIProvider apiKey={API_KEY} version="weekly">
                <div className="flex flex-col md:flex-row gap-4 h-full flex-1">
                  
                  {/* Left Column: Dynamic Multi-stop Input Panel */}
                  <div className="w-full md:w-5/12 bg-black border border-white/5 p-4 rounded-xl flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">Stopovers Selector</span>
                        <div className="flex gap-1">
                          <button
                            onClick={addLocationBox}
                            className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg cursor-pointer flex items-center justify-center"
                            title="Add Location stop"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Stack of dynamic location boxes */}
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {locInputs.map((loc, idx) => (
                          <div key={loc.id} className="relative flex items-end gap-1 bg-[#050505] p-2 border border-white/5 rounded-lg">
                            <div className="flex-1">
                              <LocationInput
                                id={loc.id}
                                label={idx === 0 ? "1. Source (Origin)" : idx === locInputs.length - 1 ? `${idx + 1}. End (Destination)` : `${idx + 1}. Mid Point Waypoint`}
                                placeholder={idx === 0 ? "E.g. Kampala Central" : "Type location node..."}
                                value={loc.val}
                                onChange={(val) => {
                                  const updated = [...locInputs];
                                  updated[idx].val = val;
                                  setLocInputs(updated);
                                }}
                                onSelectCoords={(lat, lng, address) => {
                                  const updated = [...locInputs];
                                  updated[idx].lat = lat;
                                  updated[idx].lng = lng;
                                  updated[idx].val = address;
                                  setLocInputs(updated);
                                }}
                              />
                            </div>
                            {locInputs.length > 2 && (
                              <button
                                onClick={() => removeLocation(loc.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg cursor-pointer self-end"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Matrix outputs */}
                    <div className="space-y-3 pt-3 border-t border-white/5 font-mono">
                      {priceCalculated ? (
                        <div className="bg-cyan-950/20 border border-cyan-500/15 p-3 rounded-xl text-[11px] space-y-1 text-white/90">
                          <div className="flex justify-between">
                            <span className="text-white/40">Total Distance:</span>
                            <span className="text-cyan-400 font-bold">{distanceInKM.toFixed(2)} KM</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Transit Time:</span>
                            <span>{formatHoursMins(calculatedDuration)}</span>
                          </div>
                          <div className="flex justify-between border-t border-white/5 pt-1 mt-1 text-xs">
                            <span className="text-white/40 font-sans">Computed Fare:</span>
                            <span className="text-emerald-400 font-bold">UGX {totalFare.toLocaleString()}</span>
                          </div>
                          <p className="text-[8px] text-white/30 italic leading-relaxed pt-1 font-sans">
                            * Includes a starting Base Fee of UGX {startingPrice.toLocaleString()} plus variable UGX {pricePerKm.toLocaleString()}/KM distance charge. Minimum threshold applied.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center text-[10px] text-white/40 italic">
                          Define inputs and hit compute to evaluate price outcomes.
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={handleCalculateFare}
                          className="col-span-2 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg cursor-pointer transition font-sans flex items-center justify-center gap-1"
                        >
                          <RouteIcon className="w-3.5 h-3.5" />
                          Calculate Fare
                        </button>
                        <button
                          onClick={handleClearDirections}
                          className="py-2 bg-neutral-900 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer font-sans"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="flex gap-1.5 w-full">
                        <button
                          onClick={handleExportJSON}
                          disabled={!priceCalculated}
                          className={`flex-1 py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-cyan-400 hover:text-cyan-300 rounded border border-white/10 text-[10px] cursor-pointer font-sans flex items-center justify-center gap-1 ${!priceCalculated && 'opacity-40 cursor-not-allowed'}`}
                        >
                          <FileCode className="w-3 h-3" />
                          Export JSON
                        </button>
                        <button
                          onClick={handleDispatchEstimatedWay}
                          disabled={!priceCalculated}
                          className={`flex-1 py-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded text-[10px] font-bold cursor-pointer font-sans ${!priceCalculated && 'opacity-40 cursor-not-allowed'}`}
                        >
                          Dispatch Order
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Google Map view rendered dynamically */}
                  <div className="flex-1 h-[260px] md:h-auto rounded-xl overflow-hidden relative border border-white/5">
                    <GoogleMap
                      defaultCenter={{ lat: 0.34739, lng: 32.58214 }} // Kampala coord
                      defaultZoom={11}
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      style={{ width: '100%', height: '100%' }}
                    >
                      {/* Waypoint markers */}
                      {locInputs.map((node, index) => (
                        node.lat && node.lng && (
                          <AdvancedMarker
                            key={node.id}
                            position={{ lat: node.lat, lng: node.lng }}
                            title={node.val}
                          >
                            <Pin
                              background={index === 0 ? '#ef4444' : index === locInputs.length - 1 ? '#10b981' : '#f59e0b'}
                              glyphColor="#fff"
                              glyphText={(index + 1).toString()}
                            />
                          </AdvancedMarker>
                        )
                      ))}

                      {/* Route calculator component */}
                      {tempRouteOutput && (
                        <RouteDisplay
                          origin={tempRouteOutput.origin}
                          destination={tempRouteOutput.destination}
                          waypoints={tempRouteOutput.waypoints}
                          onRouteComputed={handleRouteComputed}
                        />
                      )}
                    </GoogleMap>
                  </div>
                </div>
              </APIProvider>
            )}
          </div>
        ) : (
          /* SVG SIMULATED REAL-TIME MAP */
          <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10 flex flex-col min-h-[350px] justify-between text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1.5px)] bg-[size:24px_24px]"></div>

            <div className="flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Kampala Real-time GIS Fleet Monitor</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-[9px] font-bold">
                Local GIS Sim
              </span>
            </div>

            {/* Interactive SVG Street grid mapping */}
            <div className="flex-1 my-4 flex items-center justify-center relative min-h-[220px]">
              <svg viewBox="0 0 500 300" className="w-full max-w-lg h-auto text-slate-800 select-none">
                {/* Roads */}
                <line x1="50" y1="50" x2="450" y2="250" stroke="#1f2937" strokeWidth="4" />
                <line x1="100" y1="250" x2="350" y2="50" stroke="#1f2937" strokeWidth="4" />
                <line x1="50" y1="150" x2="450" y2="150" stroke="#111827" strokeWidth="6" strokeDasharray="3 3" />
                <line x1="250" y1="30" x2="250" y2="270" stroke="#1f2937" strokeWidth="4" />

                {/* Road names */}
                <text x="55" y="40" fill="#4b5563" fontSize="10" className="font-sans font-bold">Kira Rd</text>
                <text x="210" y="25" fill="#4b5563" fontSize="10" className="font-sans font-bold">Jinja Rd</text>
                <text x="55" y="140" fill="#4b5563" fontSize="10" className="font-sans font-bold">Wampewo Ave</text>

                {/* Kampala Districts references */}
                <text x="45" y="80" fill="#9ca3af" fontSize="10" className="font-bold">Ntinda Hub</text>
                <circle cx="95" cy="85" r="4" fill="#06b6d4" />

                <text x="380" y="240" fill="#9ca3af" fontSize="10" className="font-bold">Kololo</text>
                <circle cx="370" cy="235" r="4" fill="#10b981" />

                <text x="260" y="70" fill="#4b5563" fontSize="8" className="font-sans">Nakasero</text>
                <text x="90" y="270" fill="#4b5563" fontSize="8" className="font-sans">Kabalagala</text>

                {/* SELECTED ORDER HOVER PATH */}
                {selectedOrder && (
                  <>
                    <line
                      x1="95"
                      y1="85"
                      x2="370"
                      y2="235"
                      stroke="#164e63"
                      strokeWidth="6"
                      className="opacity-40"
                    />
                    <line
                      x1="95"
                      y1="85"
                      x2="370"
                      y2="235"
                      stroke="#22d3ee"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />

                    {/* Pickup and Dropoff labels */}
                    <text x="105" y="100" fill="#22d3ee" fontSize="9" className="font-bold">Pickup: Ntinda</text>
                    <text x="260" y="215" fill="#34d399" fontSize="9" className="font-bold">Drop: Kololo</text>

                    {/* Dynamic animating rider coordinates */}
                    {riderCoords && (
                      <g transform={`translate(${95 + (370 - 95) * (transitPct / 100)}, ${85 + (235 - 85) * (transitPct / 100)})`}>
                        <circle cx="0" cy="0" r="10" fill="#06b6d4" className="animate-ping" stroke="#06b6d4" strokeWidth="2" />
                        <circle cx="0" cy="0" r="7" fill="#0891b2" stroke="#ffffff" strokeWidth="2" />
                        <text x="12" y="3" fill="#22d3ee" fontSize="9" className="font-bold">Courier</text>
                      </g>
                    )}
                  </>
                )}
              </svg>
            </div>

            <div className="z-10 flex justify-between text-[11px] text-[#F0F0F0]/50 bg-black p-2.5 rounded-lg border border-white/10 font-medium">
              {selectedOrder ? (
                <>
                  <span>Tracking Order: {selectedOrder.id}</span>
                  <span>Rider Location: {riderCoords ? `${riderCoords.lat.toFixed(5)}, ${riderCoords.lng.toFixed(5)}` : 'Idle'}</span>
                  <span>Progress: {transitPct}%</span>
                </>
              ) : (
                <span className="text-center w-full text-white/30">Select a dispatch item from the queue list below to trigger street transit simulator.</span>
              )}
            </div>
          </div>
        )}

        {/* Deliveries Table Queue */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Pending & Active Delivery Orders</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050505] border-b border-white/10 text-white/40 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Order Ref</th>
                  <th className="py-2.5 px-3">Pickup / Dropoff</th>
                  <th className="py-2.5 px-3 text-right">Fare</th>
                  <th className="py-2.5 px-3">Rider</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#F0F0F0]/85">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`hover:bg-white/5 transition-colors cursor-pointer ${
                      selectedOrderId === o.id ? 'bg-[#111] border-l-2 border-l-cyan-500' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div>
                        <span className="font-bold text-white">{o.id}</span>
                        <span className="block text-[10px] text-[#F0F0F0]/40 font-normal">{o.package_details}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="truncate max-w-[150px]">
                        <span className="block text-white font-bold text-[10px]">{o.pickup_address}</span>
                        <span className="block text-white/45 text-[10px]">{o.dropoff_address}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-cyan-400">
                      UGX {o.fare_ugx.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-white/60">
                      {o.rider_id ? (
                        <div className="flex items-center gap-1.5 font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                          {riders.find(r => r.id === o.rider_id)?.name}
                        </div>
                      ) : (
                        <span className="text-purple-400 italic font-normal text-[10px]">No Courier</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold inline-block border ${
                        o.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        o.status === 'in_transit' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 animate-pulse' :
                        o.status === 'assigned' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' :
                        'bg-white/5 text-white/50 border-white/10'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1.5 justify-center">
                        {o.status === 'pending' && riders.length > 0 && (
                          <button
                            onClick={() => triggerOrderStatusUpdate(o.id, 'assigned', riders[0].id)}
                            className="px-2.5 py-1 bg-cyan-500 text-black rounded-lg text-[9px] font-bold cursor-pointer hover:bg-cyan-400 transition"
                          >
                            Assign
                          </button>
                        )}
                        {o.status === 'assigned' && (
                          <button
                            onClick={() => triggerOrderStatusUpdate(o.id, 'in_transit')}
                            className="px-2.5 py-1 bg-cyan-500 text-black rounded-lg text-[9px] font-bold cursor-pointer hover:bg-cyan-400 transition"
                          >
                            Run
                          </button>
                        )}
                        {o.status === 'in_transit' && (
                          <button
                            onClick={() => triggerOrderStatusUpdate(o.id, 'completed')}
                            className="px-2.5 py-1 bg-green-500 text-black rounded-lg text-[9px] font-bold cursor-pointer hover:bg-green-400 transition"
                          >
                            Deliver
                          </button>
                        )}
                        {o.status === 'completed' && (
                          <span className="text-white/30 text-[10px] font-mono">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar: Rider Management Panel */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xs font-bold text-white">Registered Couriers</h2>
              <p className="text-[9px] text-[#F0F0F0]/45 mt-0.5">Active fleet tags.</p>
            </div>
            <button
              onClick={handleCreateRiderSim}
              className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg cursor-pointer transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {riders.map((r) => (
              <div key={r.id} className="p-3.5 border border-white/10 bg-black rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-white block">{r.name}</span>
                  <span className="text-[10px] text-cyan-400">{r.phone}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border ${
                    r.status === 'available' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    r.status === 'busy' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 animate-pulse' :
                    'bg-white/5 text-white/40 border-white/10'
                  }`}>
                    {r.status}
                  </span>
                  <span className="text-[8px] text-white/30 mt-0.5">
                    {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex items-center gap-2 text-[9px] text-cyan-400 font-bold mt-6">
          <Activity className="w-4 h-4 text-cyan-500 animate-pulse" />
          WebSockets Ingress: Active
        </div>
      </div>
    </div>
  );
}
