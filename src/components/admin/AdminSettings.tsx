import React, { useState } from 'react';
import { AppSettings, storageService } from '../../services/storageService';
import { Sliders, Bell, Compass, Shield, Save, Check } from 'lucide-react';

interface AdminSettingsProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  lang: 'en' | 'ta';
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onSaveSettings,
  lang
}) => {
  const [geofenceRadius, setGeofenceRadius] = useState(settings.geofenceRadiusMeters);
  const [soundAlerts, setSoundAlerts] = useState(settings.soundAlertsEnabled);
  const [vibrationAlerts, setVibrationAlerts] = useState(settings.vibrationAlertsEnabled);
  const [cooldown, setCooldown] = useState(settings.autoCooldownSeconds);
  const [allowPhoto, setAllowPhoto] = useState(settings.allowPhotoUploadProof);
  const [requireGps, setRequireGps] = useState(settings.requireStaffGpsForDelivery);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      geofenceRadiusMeters: Number(geofenceRadius),
      soundAlertsEnabled: soundAlerts,
      vibrationAlertsEnabled: vibrationAlerts,
      autoCooldownSeconds: Number(cooldown),
      allowPhotoUploadProof: allowPhoto,
      requireStaffGpsForDelivery: requireGps,
      adminNotificationAlerts: true,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-xs space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {lang === 'ta' ? 'அமைப்பு மற்றும் புவிவேலி அமைப்புகள்' : 'Geofence & Dispatch Settings'}
        </h2>
        <p className="text-slate-500 mt-0.5">
          Configure automated nearby-house detection thresholds, audio alert cues, and GPS accuracy rules.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Geofence radius slider */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm block">
                Geofence Proximity Radius
              </span>
              <span className="text-slate-500 text-[11px]">
                Trigger nearby delivery alert when staff enters this distance from customer house
              </span>
            </div>
            <span className="text-base font-black text-sky-600 px-3 py-1 bg-sky-100 rounded-xl">
              {geofenceRadius} meters
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="150"
            step="5"
            value={geofenceRadius}
            onChange={(e) => setGeofenceRadius(parseInt(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>20m (Tight gate)</span>
            <span>50m (Standard Default)</span>
            <span>150m (Wide apartment complex)</span>
          </div>
        </div>

        {/* Cooldown duration */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-800 text-sm block">
              Duplicate Alert Cooldown
            </span>
            <span className="text-slate-500 text-[11px]">
              Prevent duplicate notifications for the same house within this duration
            </span>
          </div>
          <select
            value={cooldown}
            onChange={(e) => setCooldown(parseInt(e.target.value))}
            className="font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl cursor-pointer"
          >
            <option value={60}>60 seconds</option>
            <option value={120}>120 seconds (2 mins)</option>
            <option value={300}>300 seconds (5 mins)</option>
          </select>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 block">Sound Alert Cues</span>
              <span className="text-slate-500 text-[11px]">
                Play audible notification tone on phone when entering customer geofence
              </span>
            </div>
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={(e) => setSoundAlerts(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 block">Vibration Alerts</span>
              <span className="text-slate-500 text-[11px]">
                Vibrate delivery partner device on nearby-house detection
              </span>
            </div>
            <input
              type="checkbox"
              checked={vibrationAlerts}
              onChange={(e) => setVibrationAlerts(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 block">Delivery Proof Photo</span>
              <span className="text-slate-500 text-[11px]">
                Allow optional photo capture at customer gate for delivery confirmation
              </span>
            </div>
            <input
              type="checkbox"
              checked={allowPhoto}
              onChange={(e) => setAllowPhoto(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {saved ? (
            <span className="flex items-center space-x-1.5 text-emerald-600 font-bold">
              <Check className="w-4 h-4" />
              <span>Settings Saved Successfully!</span>
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow cursor-pointer transition flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
