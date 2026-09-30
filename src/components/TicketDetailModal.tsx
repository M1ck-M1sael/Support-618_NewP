import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Lock, 
  Eye, 
  FileText, 
  Clock, 
  User as UserIcon, 
  ShieldCheck, 
  Building2,
  Calendar,
  Paperclip,
  CheckCircle2
} from 'lucide-react';
import { Ticket, TicketMessage, TicketNote, UserRole, UserProfile } from '../types';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  currentUser: UserProfile;
  messages: TicketMessage[];
  notes: TicketNote[];
  onSendMessage: (ticketId: string, content: string) => void;
  onAddNote: (ticketId: string, content: string) => void;
  onResolveTicket: (ticketId: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  isOpen,
  onClose,
  ticket,
  currentUser,
  messages,
  notes,
  onSendMessage,
  onAddNote,
  onResolveTicket
}) => {
  const [activeTab, setActiveTab] = useState<'public' | 'notes'>('public');
  const [newContent, setNewContent] = useState('');

  if (!isOpen) return null;

  const canSeeInternalNotes = currentUser.role === 'SuperAdmin' || currentUser.role === 'Agent';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    if (activeTab === 'public') {
      onSendMessage(ticket.id, newContent.trim());
    } else {
      onAddNote(ticket.id, newContent.trim());
    }
    setNewContent('');
  };

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                {ticket.ticketNumber}
              </span>
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {ticket.categoryName || 'Soporte'}
              </span>
              <span className="text-xs text-slate-500 capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                Estado: {ticket.status.replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {ticket.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isResolved && canSeeInternalNotes && (
              <button
                onClick={() => onResolveTicket(ticket.id)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Marcar Resuelto
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadatos fiscales si existen en extraMetadata */}
        {ticket.extraMetadata?.fiscal && (
          <div className="px-6 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex flex-wrap items-center gap-4">
            <span className="font-semibold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              Datos Fiscales CFDI:
            </span>
            <span><strong>RFC:</strong> {ticket.extraMetadata.fiscal.rfc}</span>
            <span><strong>Razón:</strong> {ticket.extraMetadata.fiscal.razon_social}</span>
            <span><strong>Uso:</strong> {ticket.extraMetadata.fiscal.uso_cfdi}</span>
          </div>
        )}

        {/* Tab switcher: Comunicación pública vs Notas internas (RBAC) */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('public')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'public'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Conversación Pública ({messages.length})
          </button>

          {/* NOTAS INTERNAS: Exclusivas para SuperAdmin y Agent */}
          {canSeeInternalNotes && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'notes'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              Notas Internas Privadas ({notes.length})
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono">
                STAFF ONLY
              </span>
            </button>
          )}
        </div>

        {/* Mensajes / Contenido Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/30 dark:bg-slate-950/30">
          {/* Descripción inicial del ticket */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Apertura por {ticket.clientName}
              </span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {activeTab === 'public' ? (
            /* Hilo Público (Cliente + Soporte) */
            <div className="space-y-3 pt-2">
              {messages.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Aún no hay respuestas adicionales en este hilo.
                </div>
              ) : (
                messages.map((msg) => {
                  const isStaff = msg.senderRole === 'SuperAdmin' || msg.senderRole === 'Agent';
                  return (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl text-xs space-y-1 ${
                        isStaff
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 ml-4'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {msg.senderName}
                          {isStaff && (
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-bold">
                              {msg.senderRole}
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Notas Internas (Privado para Staff) */
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Aislamiento Estricto:</strong> Las notas escritas aquí se almacenan en la tabla `ticket_notes`. El cliente jamás recibe visibilidad ni notificaciones sobre este contenido.
                </span>
              </div>

              {notes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No hay notas internas registradas en este ticket.
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl text-xs space-y-1 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-amber-600" />
                        Nota de {note.authorName} ({note.authorRole})
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Input box para responder */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <textarea
              rows={2}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={
                activeTab === 'public'
                  ? 'Escribe un mensaje para responder al ticket...'
                  : 'Escribe una nota interna técnica para el equipo (privada)...'
              }
              className="w-full pl-3.5 pr-24 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={!newContent.trim()}
              className={`absolute right-2 bottom-2.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white transition-all flex items-center gap-1.5 disabled:opacity-40 ${
                activeTab === 'public'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xs'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Send className="w-3 h-3" />
              {activeTab === 'public' ? 'Enviar' : 'Guardar Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
