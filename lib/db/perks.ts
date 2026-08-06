import { createClient } from '@/lib/supabase/server'
import { StorePerk, PerkPayload } from '@/types'

type PerkLocation = StorePerk['location']

/**
 * Perks visibles de un lugar — es lo que ve el comprador.
 * Filtra por `visible` en la query: un bloque oculto no viaja al navegador.
 */
export async function getVisiblePerks(
  tenantId: string,
  location: PerkLocation
): Promise<StorePerk[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('store_perks')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('location', location)
    .eq('visible', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as StorePerk[]
}

/** Todos los perks del tenant, visibles y ocultos — vista del panel. */
export async function getAllPerks(tenantId: string): Promise<StorePerk[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('store_perks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('location', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as StorePerk[]
}

export async function createPerk(
  tenantId: string,
  data: PerkPayload & { location: PerkLocation; label: string }
): Promise<StorePerk> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('store_perks')
    .insert({ ...data, tenant_id: tenantId })
    .select()
    .single()

  if (error) throw error
  return row as StorePerk
}

export async function updatePerk(
  id: string,
  tenantId: string,
  data: PerkPayload
): Promise<StorePerk> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('store_perks')
    .update(data)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) throw error
  return row as StorePerk
}

/**
 * Los perks sí se borran de verdad, a diferencia de las categorías:
 * no hay nada colgando de ellos, así que no se pierde información
 * al eliminarlos. Para sacarlos de la vitrina sin perder el texto
 * está `visible = false`.
 */
export async function deletePerk(id: string, tenantId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('store_perks')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw error
}
