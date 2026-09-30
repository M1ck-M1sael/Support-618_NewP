import React, { useState } from 'react';
import { 
  ShieldCheck, 
  LifeBuoy, 
  CreditCard, 
  User as UserIcon, 
  Plus, 
  BellRing, 
  Sun, 
  Moon, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { TicketList } from './components/TicketList';
import { CreateTicketModal } from './components/CreateTicketModal';
import { BillingCard } from './components/BillingCard';
import { ProfileSettings } from './pages/ProfileSettings';
import { TicketDetailModal } from './components/TicketDetailModal';
import { 
  UserRole, 
  UserProfile, 
  Ticket, 
  TicketCategory, 
  TicketMessage, 
  TicketNote,
  TicketPriority 
} from './types';

// Categorías iniciales de StackTON
const INITIAL_CATEGORIES: TicketCategory[] = [
  {
    id: 'cat_tech',
    name: 'Soporte Técnico & Infraestructura',
    description: 'Fallas de despliegue, errores de conexión, microservicios y bases de datos.',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cat_billing',
    name: 'Facturación & Pagos CFDI',
    description: 'Emisión de facturas mexicanas con RFC, comprobantes de pago Stripe y aclaraciones.',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cat_cloud',
    name: 'Consultoría Cloud & Arquitectura',
    description: 'Asesoría en arquitectura AWS, Docker, Kubernetes y escalabilidad.',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cat_sla',
    name: 'Incidencia Crítica SLA 24/7',
    description: 'Caída de producción de alta severidad sujeta a penalización de SLA.',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Datos iniciales de demostración
const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tkt_01',
    ticketNumber: 'ST-618-1042',
    title: 'Error 504 Gateway Timeout en microservicio de pagos',
    description: 'Desde las 09:00 AM nuestros clientes en producción reportan timeouts al intentar procesar transacciones recurrentes contra el gateway.',
    categoryId: 'cat_tech',
    categoryName: 'Soporte Técnico & Infraestructura',
    clientId: 'usr_client_01',
    clientName: 'Sofia Valenzuela (FintechNova)',
    assignedAgentId: 'usr_agent_01',
    assignedAgentName: 'Carlos Mendez',
    priority: 'urgent',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'tkt_02',
    ticketNumber: 'ST-618-1043',
    title: 'Solicitud de Factura con RFC para suscripción anual',
    description: 'Requerimos la emisión del comprobante fiscal digital por Internet (CFDI) correspondiente al último pago procesado con Stripe.',
    categoryId: 'cat_billing',
    categoryName: 'Facturación & Pagos CFDI',
    clientId: 'usr_client_01',
    clientName: 'Sofia Valenzuela (FintechNova)',
    assignedAgentId: 'usr_agent_01',
    assignedAgentName: 'Carlos Mendez',
    priority: 'medium',
    status: 'open',
    extraMetadata: {
      fiscal: {
        rfc: 'FIN180425KP9',
        razon_social: 'FINTECHNOVA HOLDINGS S.A.P.I. DE C.V.',
        uso_cfdi: 'G03 - Gastos en general'
      }
    },
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'tkt_03',
    ticketNumber: 'ST-618-1039',
    title: 'Configuración de Rate Limiting en API Gateway',
    description: 'Solicitud resuelta: Se aplicó la directiva de sliding window para prevenir abusos en endpoints públicos.',
    categoryId: 'cat_cloud',
    categoryName: 'Consultoría Cloud & Arquitectura',
    clientId: 'usr_client_01',
    clientName: 'Sofia Valenzuela (FintechNova)',
    priority: 'low',
    status: 'resolved',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    resolvedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

const INITIAL_MESSAGES: TicketMessage[] = [
  {
    id: 'msg_01',
    ticketId: 'tkt_01',
    senderId: 'usr_agent_01',
    senderName: 'Carlos Mendez',
    senderRole: 'Agent',
    content: 'Hola Sofia, hemos identificado un cuello de botella en el pool de conexiones del contenedor de pagos. Estamos incrementando los workers.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

const INITIAL_NOTES: TicketNote[] = [
  {
    id: 'note_01',
    ticketId: 'tkt_01',
    authorId: 'usr_agent_01',
    authorName: 'Carlos Mendez',
    authorRole: 'Agent',
    content: 'NOTA INTERNA: Se alertó al equipo de infraestructura Cloud. El cluster de ECS estaba en 98% CPU. No notificar al cliente hasta que el deploy finalice con éxito.',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  }
];

function SupportPlatformContent() {
  const { theme, toggleTheme } = useTheme();

  // Gestión de Rol activo (para validar RBAC)
  const [activeRole, setActiveRole] = useState<UserRole>('Client');

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'tickets' | 'billing' | 'profile'>('tickets');

  // Estado del usuario actual
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'usr_client_01',
    name: 'Sofia Valenzuela',
    email: 'sofia@fintechnova.com',
    role: 'Client',
    companyName: 'FintechNova Corp',
    phoneNumber: '+52 55 4920 1832',
    themePreference: 'dark',
    stripeCustomerId: 'cus_stackton_demo_123',
    subscriptionStatus: 'active',
    subscriptionId: 'sub_1Oq892StackTON',
    notificationPreferences: {
      emailNotifications: true,
      smsCriticalAlerts: true,
      whatsappUpdates: false
    }
  });

  // Estado de Tickets y Mensajes
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [messages, setMessages] = useState<TicketMessage[]>(INITIAL_MESSAGES);
  const [notes, setNotes] = useState<TicketNote[]>(INITIAL_NOTES);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Sincronizar rol simulado
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setUserProfile((prev) => ({ ...prev, role }));
  };

  // Creación de ticket con BackgroundTasks y AWS triggers simulados
  const handleCreateTicket = (ticketData: {
    title: string;
    description: string;
    categoryId: string;
    priority: TicketPriority;
    extraMetadata?: Record<string, any>;
    attachments?: Array<{ name: string; size: number }>;
  }) => {
    const category = INITIAL_CATEGORIES.find((c) => c.id === ticketData.categoryId);
    const newTicketNumber = `ST-618-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: Ticket = {
      id: `tkt_${Date.now()}`,
      ticketNumber: newTicketNumber,
      title: ticketData.title,
      description: ticketData.description,
      categoryId: ticketData.categoryId,
      categoryName: category?.name,
      clientId: userProfile.id,
      clientName: `${userProfile.name} (${userProfile.companyName || 'Cliente'})`,
      priority: ticketData.priority,
      status: 'open',
      extraMetadata: ticketData.extraMetadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTickets([newTicket, ...tickets]);
  };

  const handleSendMessage = (ticketId: string, content: string) => {
    const newMsg: TicketMessage = {
      id: `msg_${Date.now()}`,
      ticketId,
      senderId: userProfile.id,
      senderName: userProfile.name,
      senderRole: activeRole,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, newMsg]);

    // Si respondió el cliente, actualizar estado a 'in_progress' o 'open'
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'in_progress', updatedAt: new Date().toISOString() } : t))
    );
  };

  const handleAddNote = (ticketId: string, content: string) => {
    const newNote: TicketNote = {
      id: `note_${Date.now()}`,
      ticketId,
      authorId: userProfile.id,
      authorName: userProfile.name,
      authorRole: activeRole as 'SuperAdmin' | 'Agent',
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes((prev) => [...prev, newNote]);
  };

  const handleResolveTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: 'resolved', resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : t
      )
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: 'resolved' } : null));
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    toggleTheme();
    setUserProfile((prev) => ({ ...prev, themePreference: nextTheme }));
  };

  const handleUpdateProfile = (updatedData: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/20">
              618
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-300 bg-clip-text text-transparent">
                  Support-618
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                  StackTON
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none hidden sm:block">
                Customer Portal & Helpdesk Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* RBAC Role Selector Simulator */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Rol:</span>
              </span>
              {(['Client', 'Agent', 'SuperAdmin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    activeRole === r
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={handleThemeToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Cambiar tema Claro/Oscuro"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Oscuro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <nav className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'tickets'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
              Gestión de Tickets ({tickets.length})
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'billing'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Facturación & Stripe Portal
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Perfil & Notificaciones AWS
            </button>
          </nav>

          {activeTab === 'tickets' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Abrir Nuevo Ticket
            </button>
          )}
        </div>

        {/* Tab Content Display */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <TicketList
              tickets={tickets}
              onSelectTicket={(t) => setSelectedTicket(t)}
              selectedTicketId={selectedTicket?.id}
            />
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <BillingCard user={userProfile} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <ProfileSettings
              user={userProfile}
              onUpdateUser={handleUpdateProfile}
            />
          </div>
        )}

      </div>

      {/* Modal para Crear Ticket (con soporte para campos fiscales dinámicos) */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        categories={INITIAL_CATEGORIES}
        onSubmit={handleCreateTicket}
      />

      {/* Modal de Detalle de Ticket (Hilo de conversación pública + Notas Internas RBAC) */}
      {selectedTicket && (
        <TicketDetailModal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          ticket={selectedTicket}
          currentUser={userProfile}
          messages={messages.filter((m) => m.ticketId === selectedTicket.id)}
          notes={notes.filter((n) => n.ticketId === selectedTicket.id)}
          onSendMessage={handleSendMessage}
          onAddNote={handleAddNote}
          onResolveTicket={handleResolveTicket}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
        Support-618 &bull; StackTON Systems &bull; Helpdesk & Customer Portal Platform
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider initialTheme="dark">
      <SupportPlatformContent />
    </ThemeProvider>
  );
}
