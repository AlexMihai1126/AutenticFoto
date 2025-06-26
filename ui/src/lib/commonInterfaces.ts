import { ReactNode } from "react";

export interface DelegatedResultPayload {
  schemaUid: string;
  recipientWallet: string;
  attesterWallet: string;
  encData: string;
  refUid: string;
  backendSignatureR: string;
  backendSignatureS: string;
  backendSignatureV: number;
  deadline: string;
}

export interface DelegatedBuyResultPayload extends DelegatedResultPayload {
  ethValue: string;
}

export interface DelegatedRevocationPayload
  extends Omit<DelegatedResultPayload, "encData" | "refUid"> {
  revokeUid: string;
}

export interface PhotoData {
  _id: string;
  title: string;
  description: string;
  previewUrl: string;
  highResPreviewUrl?: string;
  ethPriceStr: string;
  createdAt: string;
  blurhashStr?: string;
  location?: string;
  category?: { _id: string; title: string } | null;
  tags?: { _id: string; title: string }[] | null;
}

export interface UserProfileCardPhotoData {
  _id?: string;
  title: string;
  previewUrl: string;
  description?: string;
  blurhashStr: string;
  ethPriceStr: string;
  category?: { title: string } | null;
  tags?: { _id: string; title: string }[] | null;
}

export interface UserPagePhotoData extends PhotoData {
  attestationUID?: string;
  isRevoked?: boolean;
}

export interface CarouselPhotoData extends PhotoData {
  username: string;
}

export interface UserProfileData {
  username: string;
  walletAddress?: string;
  role: string;
  type: string;
}

export interface UserPageDetails {
  userData: {
    username: string;
    createdAt: string;
    attestationUID: string;
  };
  userPhotos?: {
    title: string;
    category?: { _id: string; title: string } | null;
    tags?: { _id: string; title: string }[] | null;
    createdAt: string;
    ethPriceStr: string;
    previewUrl: string;
    blurhashStr: string;
  }[];
}

export interface FaqItem {
  question: string;
  answer: ReactNode;
}

// INTERFETE GALERIE

export interface FilterCategory {
  _id: string;
  title: string;
}

export interface FilterTag {
  _id: string;
  title: string;
}

export interface PhotoPageData {
  totalResults: number;
  currentPage: number;
  documentLimit: number;
  totalPages: number;
}

export interface FilterCategoryOption {
  value: string;
  label: string;
}
export interface FilterTagOption {
  value: string;
  label: string;
}
export interface PhotosPerPageLimitOption {
  value: number;
  label: string;
}

// INTERFETE PAGINA TRANZACTII

export interface TransactionCardData {
  id: string;
  title: string;
  previewUrl: string;
  blurhashStr?: string;
  attestationUID: string;
  txHash: string;
  createdAt: string;
}

// INTERFETE ADMIN

export interface AdminEditableTableEntry {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  order?: number;
}
