import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Tag, 
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Ticket, TicketStatus, TicketPriority } from '../types';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket?: (ticket: Ticket) => void;
  selectedTicketId?: string;
}

export const TicketList: React.FC<TicketListProps> = ({ 
  tickets, 
  onSelectTicket, 
  selectedTicketId 
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado de tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = 
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.categoryName && t.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') {
      return t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_client';
    }
    if (statusFilter === 'resolved') {
      return t.status === 'resolved' || t.status === 'closed';
    }
    return true;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Abierto
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            En Proceso
          </span>
        );
      case 'waiting_client':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Esperando Respuesta
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Resuelto
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            Cerrado
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
            <AlertTriangle className="w-3 h-3" /> Urgente (SMS)
          </span>
        );
      case 'high':
        return (
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
            Alta
          </span>
        );
      case 'medium':
        return (
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            Media
          </span>
        );
      case 'low':
        return (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded">
            Baja
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
      {/* Controles de búsqueda y filtros rápidos */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, título o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Todos ({tickets.length})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusFilter === 'open'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Abiertos ({tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusFilter === 'resolved'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Resueltos ({tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length})
          </button>
        </div>
      </div>

      {/* Lista / Tabla Responsiva */}
      {filteredTickets.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No se encontraron tickets</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            No hay incidentes que coincidan con los filtros seleccionados o tu búsqueda actual.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredTickets.map((ticket) => {
            const isSelected = selectedTicketId === ticket.id;
            return (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket && onSelectTicket(ticket)}
                className={`p-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-l-4 border-indigo-600' : ''
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50">
                      {ticket.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {ticket.categoryName || 'Soporte'}
                    </span>
                    {getPriorityBadge(ticket.priority)}
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {ticket.title}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {ticket.description}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0">
                  <div className="text-right">
                    <div className="mb-1">{getStatusBadge(ticket.status)}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 sm:justify-end">
                      <Calendar className="w-3 h-3" />
                      {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 hidden sm:block" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
