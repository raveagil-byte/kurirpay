
export enum Role {
  ADMIN = 'ADMIN',
  COURIER = 'COURIER'
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING_REQUEST = 'PENDING_REQUEST',
  PAID = 'PAID'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Delivery {
  id: string;
  courierId: string;
  date: string; // ISO format
  itemCount: number;
  ratePerItem: number;
  totalAmount: number;
  status: DeliveryStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // Target user (usually admin)
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'PAYOUT_REQUEST' | 'SYSTEM' | 'DELIVERY_ALERT';
}

export interface AppSettings {
  appName: string;
  deliveryRate: number;
  currencySymbol: string;
  allowCourierSelfRegister: boolean;
}
