import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Building2, 
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { TicketPriority, TicketCategory } from '../types';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TicketCategory[];
  onSubmit: (ticketData: {
    title: string;
    description: string;
    categoryId: string;
    priority: TicketPriority;
    extraMetadata?: Record<string, any>;
    attachments?: Array<{ name: string; size: number }>;
  }) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [priority, setPriority] = useState<TicketPriority>('medium');

  // Campos condicionales para Facturación
  const [rfc, setRfc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [usoCfdi, setUsoCfdi] = useState('G03');

  // Archivos simulados
  const [attachments, setAttachments] = useState<Array<{ name: string; size: number }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isFacturacion = selectedCategory?.name.toLowerCase().includes('facturación') || 
                        selectedCategory?.name.toLowerCase().includes('facturacion');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAttachments((prev) => [...prev, { name: file.name, size: file.size }]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !categoryId) return;

    setIsSubmitting(true);

    const extraMetadata: Record<string, any> = {};
    if (isFacturacion) {
      extraMetadata.fiscal = {
        rfc: rfc.trim().toUpperCase(),
        razon_social: razonSocial.trim(),
        uso_cfdi: usoCfdi
      };
    }

    // Simulación de latencia de red y persistencia
    setTimeout(() => {
      onSubmit({
        title,
        description,
        categoryId,
        priority,
        extraMetadata: Object.keys(extraMetadata).length > 0 ? extraMetadata : undefined,
        attachments
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Crear Nuevo Ticket de Soporte
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Support-618 despachará tu incidente al equipo de especialistas de StackTON
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Título */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Título del Incidente *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Error 502 al conectar con microservicio de pagos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Categoría y Prioridad en 2 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Categoría *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Prioridad del Incidente *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              >
                <option value="low">Baja (Consultas generales)</option>
                <option value="medium">Media (Atención estándar)</option>
                <option value="high">Alta (Afectación parcial de servicio)</option>
                <option value="urgent">Urgente (Bloqueo crítico / Alerta SMS)</option>
              </select>
            </div>
          </div>

          {/* Nota preventiva si la prioridad es Urgente */}
          {priority === 'urgent' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Alerta Crítica:</strong> Los incidentes urgentes activan el envío inmediato de SMS mediante AWS SNS hacia el equipo de ingenieros en guardia y notifican al cliente si tiene habilitadas alertas SMS.
              </span>
            </div>
          )}

          {/* CAMPOS DINÁMICOS DE FACTURACIÓN (Si la categoría es Facturación) */}
          {isFacturacion && (
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-xl space-y-3.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                Datos Fiscales para Emisión de CFDI / Factura
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    RFC (Registro Federal de Contribuyentes) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="XAXX010101000"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Razón Social o Nombre Legal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: StackTON Soluciones S.A."
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Uso de CFDI
                </label>
                <select
                  value={usoCfdi}
                  onChange={(e) => setUsoCfdi(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                >
                  <option value="G03">G03 - Gastos en general</option>
                  <option value="G01">G01 - Adquisición de mercancías</option>
                  <option value="CP01">CP01 - Pagos</option>
                  <option value="S01">S01 - Sin efectos fiscales</option>
                </select>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Descripción Detallada *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe detalladamente los pasos para reproducir el fallo, logs o contexto de la solicitud..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Archivos Adjuntos (S3 Mock Upload) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Archivos Adjuntos (Capturas, Logs o PDFs)
            </label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
              <UploadCloud className="w-7 h-7 mx-auto text-slate-400 mb-1.5" />
              <label className="cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Haz clic para subir un archivo
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.txt,.log"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, PDF o LOG hasta 15MB</p>
            </div>

            {attachments.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-medium text-slate-900 dark:text-white truncate">
                        {att.name}
                      </span>
                      <span className="text-slate-400 shrink-0">
                        ({(att.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </>
              ) : (
                'Crear Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
