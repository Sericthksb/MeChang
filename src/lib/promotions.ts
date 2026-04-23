export type PromoSlug =
  | 'new-year-refresh'
  | 'festival-childcare'
  | 'moving-day'
  | 'rainy-season'

export interface PromoConfig {
  slug: PromoSlug
  id: string
  categoryTarget: string
  queryTarget?: string
}

export const PROMOTIONS: Record<PromoSlug, PromoConfig> = {
  'new-year-refresh': {
    slug: 'new-year-refresh',
    id: 'newYear',
    categoryTarget: 'Cleaning',
  },
  'festival-childcare': {
    slug: 'festival-childcare',
    id: 'festival',
    categoryTarget: 'Personal',
    queryTarget: 'sit',
  },
  'moving-day': {
    slug: 'moving-day',
    id: 'moving',
    categoryTarget: 'Personal',
    queryTarget: 'move',
  },
  'rainy-season': {
    slug: 'rainy-season',
    id: 'rainy',
    categoryTarget: 'Repair',
    queryTarget: 'roof',
  },
}

export function getPromoBySlug(slug: string): PromoConfig | undefined {
  return PROMOTIONS[slug as PromoSlug]
}
