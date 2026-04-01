import { isClerkClientConfigured, isClerkServerConfigured } from '@/lib/clerk/config'
import { isSupabaseAuthConfigured } from '@/lib/supabase/config'

export function isClerkCustomerAuthPrimaryClient() {
  return isClerkClientConfigured()
}

export function isClerkCustomerAuthPrimaryServer() {
  return isClerkServerConfigured()
}

export function isSupabaseCustomerAuthFallbackEnabledClient() {
  return isSupabaseAuthConfigured() && !isClerkCustomerAuthPrimaryClient()
}

export function isSupabaseCustomerAuthFallbackEnabledServer() {
  return isSupabaseAuthConfigured() && !isClerkCustomerAuthPrimaryServer()
}
