import React, { useState } from 'react';
import { 
  CreditCard, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowUpRight,
  FileCheck,
  Receipt
} from 'lucide-react';
import { UserProfile } from '../types';

interface BillingCardProps {
  user: UserProfile;
}

export const BillingCard: React.FC<BillingCardProps> = ({ user }) => {
  const [isRedirectingPortal, setIsRedirectingPortal] = useState(false);
  const [isRedirectingCheckout, setIsRedirectingCheckout] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const status = user.subscriptionStatus || 'active';

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Suscripción Activa (SLA Premium)
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            <AlertCircle className="w-3.5 h-3.5" />
            Pago Pendiente / Requiere Actualización
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
            Cancelada (Soporte Básico)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {s}
          </span>
        );
    }
  };

  const handleOpenStripePortal = async () => {
    setIsRedirectingPortal(true);
    setNotification(null);

    // Simula invocación a POST /api/v1/payments/portal
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      // En producción real:
      // const res = await fetch('/api/v1/payments/portal', { method: 'POST' });
      // const data = await res.json();
      // window.location.href = data.portal_url;
      setNotification('Sesión segura generada con Stripe Customer Portal. Redirigiendo a https://billing.stripe.com/p/session/...');
    } catch (err) {
      setNotification('Error al conectar con la pasarela de Stripe');
    } finally {
      setIsRedirectingPortal(false);
    }
  };

  const handleUpgradePlan = async () => {
    setIsRedirectingCheckout(true);
    setNotification(null);

    // Simula invocación a POST /api/v1/payments/checkout
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setNotification('Sesión de Stripe Checkout generada para plan "Enterprise SLA 24/7". Redirigiendo a Stripe Checkout...');
    } finally {
      setIsRedirectingCheckout(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            Facturación & Cuenta Stripe
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Plan y Métodos de Pago
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestiona tus tarjetas, facturas fiscales descargables y cancelaciones directamente en Stripe
          </p>
        </div>

        <div>{getStatusBadge(status)}</div>
      </div>

      {/* Alerta de notificación temporal */}
      {notification && (
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
            <span>{notification}</span>
          </div>
          <button 
            onClick={() => setNotification(null)} 
            className="text-xs underline ml-3 font-semibold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Plan Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Plan Contratado</div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
            StackTON Growth Tier
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            $249.00 USD / mes (Renovación mensual)
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">SLA & Cobertura</div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            Respuesta &lt; 1 hora
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Incluye soporte 24/7 y alertas críticas vía SMS
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Identificador Stripe</div>
          <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1.5 truncate">
            {user.stripeCustomerId || 'cus_stackton_demo_123'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Sincronizado vía Webhooks
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <button
          onClick={handleOpenStripePortal}
          disabled={isRedirectingPortal}
          className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-all shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isRedirectingPortal ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Conectando con Stripe...
            </>
          ) : (
            <>
              Gestionar Métodos de Pago y Facturas
              <ExternalLink className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        <button
          onClick={handleUpgradePlan}
          disabled={isRedirectingCheckout}
          className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
        >
          {isRedirectingCheckout ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              Generando Checkout...
            </>
          ) : (
            <>
              Actualizar Plan
              <ArrowUpRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Security & PCI DSS compliance reassurance */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong>Seguridad PCI-DSS Nivel 1:</strong> En Support-618 no almacenamos ni procesamos información de tarjetas de crédito o débito en nuestros servidores. Al hacer clic en gestionar, serás redirigido al portal oficial y encriptado de Stripe.
        </div>
      </div>
    </div>
  );
};
