
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  LOANS = 'LOANS',
  ADD_ITEM = 'ADD_ITEM',
  ADD_BOX = 'ADD_BOX',
  EDIT_BOX = 'EDIT_BOX',
  ITEM_DETAILS = 'ITEM_DETAILS',
  EDIT_ITEM = 'EDIT_ITEM',
  BOX_DETAILS = 'BOX_DETAILS',
  LOCATIONS = 'LOCATIONS',
  ADD_LOCATION = 'ADD_LOCATION',
  LOCATION_DETAILS = 'LOCATION_DETAILS'
}

export type HistoryType = 'CREATE' | 'EDIT' | 'MOVE' | 'LOAN' | 'RETURN';

export interface HistoryEntry {
  date: number;
  type: HistoryType;
  details: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  address?: string;
  googleMapsUri?: string;
  photoUrl?: string;
}

export interface Box {
  id: string;
  locationId?: string; // Link to Location entity
  code: string; // e.g., "C-001"
  name: string;
  location: string; // Legacy / Fallback text
  description: string;
  photoUrl?: string;
  createdAt: number;
  history: HistoryEntry[];
}

export interface Loan {
  isLoaned: boolean;
  borrowerName?: string;
  loanDate?: number;
  expectedReturnDate?: number;
}

export interface Item {
  id: string;
  boxId: string;
  name: string;
  description: string;
  tags: string[];
  photoUrl?: string; // Deprecated
  photoUrls: string[]; 
  createdAt: number;
  dimensions?: string; // e.g. "20x10x5 cm"
  weight?: string; // e.g. "1.5 kg"
  loan: Loan;
  history: HistoryEntry[];
}

export interface AIAnalysisResult {
  name: string;
  description: string;
  tags: string[];
  dimensions?: string;
  weight?: string;
}