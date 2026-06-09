import { createAdminClient } from './supabase/server'
import type { Clinica } from '@/types'

export async function resolveClinicaBySubdominio(subdominio: string): Promise<Clinica | null> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('clinicas')
    .select('*')
    .eq('subdominio', subdominio)
    .eq('status', 'ativo')
    .single()
  return data
}

export async function resolveClinicaById(id: string): Promise<Clinica | null> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('clinicas')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export function extrairSubdominio(host: string, appDomain: string): string | null {
  const hostSemPorta = host.split(':')[0]
  if (hostSemPorta === appDomain || hostSemPorta === `www.${appDomain}`) return null
  if (hostSemPorta.endsWith(`.${appDomain}`)) {
    return hostSemPorta.replace(`.${appDomain}`, '')
  }
  // localhost dev: clinica.localhost
  if (hostSemPorta.endsWith('.localhost')) {
    return hostSemPorta.replace('.localhost', '')
  }
  return null
}
