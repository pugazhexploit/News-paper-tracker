import React from 'react';
import { AppNotification } from '../../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  MapPin,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  StopCircle,
  Clock
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  lang: 'en' | 'ta';
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  lang
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'geofence_arrival':
        return <MapPin className="w-4 h-4 text-sky-500" />;
      case 'delivery_completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'delivery_missed':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'shift_started':
        return <PlayCircle className="w-4 h-4 text-emerald-500" />;
      case 'shift_stopped':
        return <StopCircle className="w-4 h-4 text-slate-500" />;
      default:
        return <Bell className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-sm">
                {lang === 'ta' ? 'அறிவிப்புகள்' : 'Smart Notifications'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onMarkAllRead}
                className="text-xs text-sky-300 hover:text-white cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                onClick={onClearAll}
                className="text-xs text-slate-400 hover:text-rose-400 cursor-pointer"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No notifications logged yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => onMarkRead(notif.id)}
                  className={`py-3 px-2 rounded-xl transition cursor-pointer flex items-start space-x-3 ${
                    notif.isRead ? 'opacity-70 hover:opacity-100' : 'bg-sky-50/60 font-medium'
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0">
                    {getIcon(notif.notificationType)}
                  </div>

                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">
                        {lang === 'ta' && notif.titleTamil ? notif.titleTamil : notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-slate-600 mt-1 leading-snug">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
