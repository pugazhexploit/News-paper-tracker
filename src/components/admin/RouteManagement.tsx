import React, { useState } from 'react';
import { DeliveryRoute, Customer, DeliveryStaff } from '../../types';
import {
  Route as RouteIcon,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  Users,
  CheckCircle,
  AlertCircle,
  Navigation,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { openExternalGoogleMapsNavigation } from '../../services/locationService';

interface RouteManagementProps {
  routes: DeliveryRoute[];
  customers: Customer[];
  staffList: DeliveryStaff[];
  onSaveRoute: (route: DeliveryRoute) => void;
  lang: 'en' | 'ta';
}

export const RouteManagement: React.FC<RouteManagementProps> = ({
  routes,
  customers,
  staffList,
  onSaveRoute,
  lang
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [area, setArea] = useState('East Car Street');
  const [staffId, setStaffId] = useState(staffList[0]?.id || '');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [estimatedDurationMins, setEstimatedDurationMins] = useState(45);
  const [totalDistanceKm, setTotalDistanceKm] = useState(3.5);

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const assignedStaff = staffList.find((s) => s.id === activeRoute?.staffId);

  const getCustomer = (id: string) => customers.find((c) => c.id === id);

  const openNewRouteModal = () => {
    setName('Chidambaram - 4 Car Streets Circuit');
    setArea('East Car Street');
    setStaffId(staffList[0]?.id || '');
    setSelectedCustomerIds(customers.map((c) => c.id));
    setEstimatedDurationMins(45);
    setTotalDistanceKm(3.5);
    setIsModalOpen(true);
  };

  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const stops = selectedCustomerIds.map((cid, idx) => ({
      id: `stop-${cid}-${idx}`,
      customerId: cid,
      stopOrder: idx + 1,
      status: 'pending' as const,
    }));

    const newRoute: DeliveryRoute = {
      id: `route-${Date.now()}`,
      name: name.trim(),
      staffId: staffId || 'unassigned',
      routeDate: new Date().toISOString().split('T')[0],
      area,
      district: 'Cuddalore District',
      stops,
      totalDistanceKm: Number(totalDistanceKm) || 2.0,
      estimatedDurationMins: Number(estimatedDurationMins) || 30,
      status: 'pending',
    };

    onSaveRoute(newRoute);
    setSelectedRouteId(newRoute.id);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {lang === 'ta' ? 'விநியோக வழிகள் மேலாண்மை' : 'Delivery Route Management'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ta'
              ? 'சிதம்பரம் விநியோக வழிகளை உருவாக்குதல், ஊழியர் ஒதுக்கீடு மற்றும் தெரு வரிசை.'
              : 'Configure morning distribution circuits, staff assignments, and stop sequences for Chidambaram (608001).'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {routes.length > 0 && (
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-xs sm:max-w-md">
              {routes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    route.id === activeRoute?.id
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {route.name.split(' (')[0]}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={openNewRouteModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ta' ? 'புதிய வழி' : 'Add Route'}</span>
          </button>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4">
            <RouteIcon className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">No Delivery Routes Created Yet</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
            Fake routes have been removed. Create real morning routes for Chidambaram (e.g. 4 Car Streets, Kanagasabai Nagar, Annamalai Nagar) and assign your delivery partners.
          </p>
          <button
            onClick={openNewRouteModal}
            className="mt-6 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
          >
            + Create Chidambaram Route
          </button>
        </div>
      ) : activeRoute ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route Overview Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                  {activeRoute.area} Circuit
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Date: {activeRoute.routeDate}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-base mb-2">
                {activeRoute.name}
              </h3>

              <div className="space-y-3 mt-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Assigned Delivery Partner:</span>
                  <span className="font-bold text-slate-900">
                    {assignedStaff?.fullName || 'Not assigned'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Total Route Distance:</span>
                  <span className="font-bold text-slate-900">
                    {activeRoute.totalDistanceKm} km
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Estimated Delivery Time:</span>
                  <span className="font-bold text-slate-900">
                    ~{activeRoute.estimatedDurationMins} minutes
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Total Customer Stops:</span>
                  <span className="font-bold text-sky-600">
                    {activeRoute.stops.length} houses
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Pincode: 608001 (Chidambaram)
              </span>
              <span className="text-xs font-bold text-emerald-600">Active Circuit</span>
            </div>
          </div>

          {/* Ordered Stops List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {lang === 'ta' ? 'வரிசைப்படுத்தப்பட்ட நிறுத்தங்கள்' : 'Ordered Delivery Stop Sequence'}
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                {activeRoute.stops.length} Customer Drops
              </span>
            </div>

            {activeRoute.stops.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No customer stops assigned to this route yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                {activeRoute.stops.map((stop, index) => {
                  const customer = getCustomer(stop.customerId);
                  if (!customer) return null;
                  const isDelivered = stop.status === 'delivered';

                  return (
                    <div
                      key={stop.customerId}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-xl transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {customer.fullName}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">
                              (#{customer.houseNumber}, {customer.street})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {customer.subscriptions.map((s) => `Qty: ${s.quantity}`).join(', ')} • Landmark: {customer.landmark || 'Street Corner'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {isDelivered ? (
                          <div className="flex items-center space-x-1 text-emerald-700 text-xs font-bold bg-emerald-100 px-2 py-1 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Delivered {stop.completedAt || ''}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-sky-700 text-xs font-bold bg-sky-100 px-2 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </div>
                        )}

                        <button
                          onClick={() => openExternalGoogleMapsNavigation(customer.latitude, customer.longitude)}
                          className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                          title="Navigate on Google Maps"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Modal to Create New Route */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Create New Route (Chidambaram - 608001)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Route Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 4 Car Streets Morning Circuit"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Area
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="East Car Street">East Car Street</option>
                    <option value="West Car Street">West Car Street</option>
                    <option value="North Car Street">North Car Street</option>
                    <option value="South Car Street">South Car Street</option>
                    <option value="Kanagasabai Nagar">Kanagasabai Nagar</option>
                    <option value="Annamalai Nagar">Annamalai Nagar</option>
                    <option value="Vandigate">Vandigate</option>
                    <option value="Town Center">Town Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Staff
                  </label>
                  <select
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={estimatedDurationMins}
                    onChange={(e) => setEstimatedDurationMins(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={totalDistanceKm}
                    onChange={(e) => setTotalDistanceKm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Assign Customers */}
              {customers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Include Customers on this Route
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50 text-xs">
                    {customers.map((c) => {
                      const checked = selectedCustomerIds.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-white">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCustomerIds((prev) => [...prev, c.id]);
                              } else {
                                setSelectedCustomerIds((prev) => prev.filter((id) => id !== c.id));
                              }
                            }}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span className="font-semibold text-slate-800">{c.fullName}</span>
                          <span className="text-slate-500 text-[11px]">(#{c.houseNumber}, {c.street})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  Create Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
