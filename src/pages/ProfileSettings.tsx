import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Camera, 
  Mail, 
  Phone, 
  Building, 
  Bell, 
  MessageSquare, 
  ShieldCheck, 
  Check, 
  Sun, 
  Moon,
  Info
} from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ProfileSettingsProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  user, 
  onUpdateUser 
}) => {
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user.name);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '+52 55 1234 5678');
  const [companyName, setCompanyName] = useState(user.companyName || 'FintechNova Corp');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  // Preferencias de Notificación
  const [emailNotifications, setEmailNotifications] = useState(
    user.notificationPreferences?.emailNotifications ?? true
  );
  const [smsCriticalAlerts, setSmsCriticalAlerts] = useState(
    user.notificationPreferences?.smsCriticalAlerts ?? false
  );
  const [whatsappUpdates, setWhatsappUpdates] = useState(
    user.notificationPreferences?.whatsappUpdates ?? false
  );

  const [isSaved, setIsSaved] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fakeUrl = URL.createObjectURL(file);
      setAvatarUrl(fakeUrl);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name,
      phoneNumber,
      companyName,
      avatarUrl,
      notificationPreferences: {
        emailNotifications,
        smsCriticalAlerts,
        whatsappUpdates
      }
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Configuración de Perfil & Notificaciones
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Personaliza tus datos de contacto, avatar y canales de recepción de alertas críticas
        </p>
      </div>

      {isSaved && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>Preferencias actualizadas y sincronizadas correctamente en PostgreSQL.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tarjeta de Información Personal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Información de la Cuenta
          </div>

          {/* Avatar Upload */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xl border-2 border-indigo-200 dark:border-indigo-800">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{name.charAt(0)}</span>
                )}
              </div>
              <label className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">Foto de Perfil</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Pasa el mouse sobre el recuadro para subir una imagen (JPG o PNG, máx 2MB)
              </p>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico (No modificable)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono Móvil (Para Alertas SMS / SNS)
              </label>
              <input
                type="tel"
                placeholder="+52 55 1234 5678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Empresa u Organización
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Tarjeta de Preferencias de Notificación (AWS SES / SNS) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              Canales de Notificación (AWS Cloud)
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Controla exactamente cómo y cuándo te contactamos ante incidentes en tus servicios
            </p>
          </div>

          <div className="space-y-4">
            {/* Toggle Email SES */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5 pr-4">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Notificaciones por Correo Electrónico (AWS SES)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Acuse de recibo de nuevos tickets, respuestas de ingenieros y resúmenes de resolución.
                </div>
              </div>

              {/* Tailwind Toggle Switch */}
              <button
                type="button"
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  emailNotifications ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle SMS SNS */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5 pr-4">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  Alertas Críticas por SMS (AWS SNS)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Avisos instantáneos al teléfono móvil solo para tickets de prioridad <strong>Urgente</strong>.
                </div>
              </div>

              {/* Tailwind Toggle Switch */}
              <button
                type="button"
                onClick={() => setSmsCriticalAlerts(!smsCriticalAlerts)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  smsCriticalAlerts ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    smsCriticalAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Cuota / Rate Limit notice */}
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs text-indigo-700 dark:text-indigo-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Control Anti-Spam:</strong> Para proteger tu seguridad y optimizar el consumo de AWS SNS, los mensajes SMS tienen un límite estricto de hasta 3 alertas por cada 24 horas por cuenta.
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Preferencia de Tema */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Modo de Visualización
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tema actual: <span className="font-semibold capitalize text-indigo-600 dark:text-indigo-400">{theme}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                Cambiar a Modo Claro
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                Cambiar a Modo Oscuro
              </>
            )}
          </button>
        </div>

        {/* Guardar cambios button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
};
