import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface BuyerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImageUrl?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country: string;
  preferredLanguage: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  newsletterSubscribed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImageUrl?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  birthDate: string;
  serviceCategory: string;
  experienceLevel?: string;
  description?: string;
  siret?: string;
  insuranceStatus?: string;
  insuranceDocumentUrl?: string;
  idDocumentUrl?: string;
  hourlyRate?: number;
  availability?: any;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  termsAccepted: boolean;
  newsletterSubscribed: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  backgroundCheckStatus: string;
  rating: number;
  totalJobs: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, full_name, avatar_url, is_active')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: profile.role as UserRole,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      isActive: profile.is_active
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get buyer profile for the current user
 */
export async function getBuyerProfile(userId: string): Promise<BuyerProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      profileImageUrl: data.profile_image_url,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      country: data.country,
      preferredLanguage: data.preferred_language,
      emailVerified: data.email_verified,
      phoneVerified: data.phone_verified,
      newsletterSubscribed: data.newsletter_subscribed,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error getting buyer profile:', error);
    return null;
  }
}

/**
 * Get seller profile for the current user
 */
export async function getSellerProfile(userId: string): Promise<SellerProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      profileImageUrl: data.profile_image_url,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      country: data.country,
      birthDate: data.birth_date,
      serviceCategory: data.service_category,
      experienceLevel: data.experience_level,
      description: data.description,
      siret: data.siret,
      insuranceStatus: data.insurance_status,
      insuranceDocumentUrl: data.insurance_document_url,
      idDocumentUrl: data.id_document_url,
      hourlyRate: data.hourly_rate,
      availability: data.availability,
      status: data.status,
      approvedAt: data.approved_at,
      approvedBy: data.approved_by,
      rejectionReason: data.rejection_reason,
      termsAccepted: data.terms_accepted,
      newsletterSubscribed: data.newsletter_subscribed,
      emailVerified: data.email_verified,
      phoneVerified: data.phone_verified,
      backgroundCheckStatus: data.background_check_status,
      rating: data.rating,
      totalJobs: data.total_jobs,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error getting seller profile:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null && user.isActive;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null && user.role === role;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (!user.isActive) {
    throw new Error('Account is inactive');
  }
  
  return user;
}

/**
 * Require specific role - throws error if user doesn't have the role
 */
export async function requireRole(role: UserRole): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (user.role !== role) {
    throw new Error(`${role} role required`);
  }
  
  return user;
}
