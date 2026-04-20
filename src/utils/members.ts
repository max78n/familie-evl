// src/utils/members.ts
import type { Member, MemberId } from '@/types'

export const MEMBERS: Member[] = [
  { id: 'juni',  name: 'Juni',  initials: 'J', color: '#4A90A4', lightColor: '#D4EEF5', textColor: '#1A4F5E' },
  { id: 'max',   name: 'Max',   initials: 'M', color: '#6B8E5E', lightColor: '#D8EBCE', textColor: '#2E4A25' },
  { id: 'finn',  name: 'Finn',  initials: 'F', color: '#C47B5A', lightColor: '#F5E0D5', textColor: '#6B3520' },
  { id: 'felix', name: 'Felix', initials: 'X', color: '#8B6BB1', lightColor: '#E8DCFF', textColor: '#3D2060' },
]

export const MEMBER_MAP = Object.fromEntries(MEMBERS.map((m) => [m.id, m])) as Record<MemberId, Member>

export const MEAL_LABELS: Record<string, string> = {
  frokost: 'Frokost',
  lunsj: 'Lunsj',
  middag: 'Middag',
  mellommåltid: 'Mellommåltid',
}

export const MEAL_ICONS: Record<string, string> = {
  frokost: '🌅',
  lunsj: '☀️',
  middag: '🍽️',
  mellommåltid: '🍎',
}

export const SOURCE_LABELS: Record<string, string> = {
  outlook: 'Outlook',
  vigilo: 'Vigilo',
  manuell: 'Google',
}

export const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  outlook: { bg: '#D4E8FF', text: '#0055A5' },
  vigilo:  { bg: '#FFE8D4', text: '#A03A00' },
  manuell: { bg: '#D4F0D4', text: '#1A6B1A' },
}

export const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  outlook: { bg: '#D4E8FF', text: '#0055A5' },
  vigilo:  { bg: '#FFE8D4', text: '#A03A00' },
  manuell: { bg: '#D4F0D4', text: '#1A6B1A' },
}

export const PRIORITY_COLORS: Record<string, string> = {
  høy: '#E8705A',
  middels: '#E8C547',
  lav: '#4CAF7C',
}

export const SHOP_CATEGORIES = ['Kjøtt', 'Fisk', 'Grønnsaker', 'Frukt', 'Meieri', 'Brød', 'Frokost', 'Tørrmat', 'Drikke', 'Annet']
