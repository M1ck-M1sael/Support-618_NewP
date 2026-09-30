export type UserRole = 'SuperAdmin' | 'Agent' | 'Client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  companyName?: string;
  phoneNumber?: string;
  themePreference: 'light' | 'dark';
  notificationPreferences: {
    emailNotifications: boolean;
    smsCriticalAlerts: boolean;
    whatsappUpdates: boolean;
  };
  stripeCustomerId?: string;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'trialing';
  subscriptionId?: string;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed';

export interface TicketCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  messageId?: string;
  uploadedById: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  attachments?: TicketAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketNote {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: 'SuperAdmin' | 'Agent';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // ej: ST-618-1042
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  clientId: string;
  clientName: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  priority: TicketPriority;
  status: TicketStatus;
  extraMetadata?: Record<string, any>; // RFC, Razón Social, Stripe Invoice ID, etc.
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messagesCount?: number;
  notesCount?: number;
}
