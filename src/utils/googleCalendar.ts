import { format, parseISO } from 'date-fns'
import type { CalEvent } from '@/types'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

let accessToken: string | null = null

export function signInWithGoogle(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) {
          console.error('Google auth error:', response.error)
          reject(new Error(response.error))
          return
        }
        accessToken = response.access_token
        resolve(true)
      },
    })
    client.requestAccessToken()
  })
}

export function signOutGoogle() {
  if (accessToken) {
    (window as any).google.accounts.oauth2.revoke(accessToken)
    accessToken = null
  }
}

export function isSignedIn(): boolean {
  return !!accessToken
}

export async function fetchGoogleCalendarEvents(
  daysAhead = 30
): Promise<Omit<CalEvent, 'id'>[]> {
  if (!accessToken) throw new Error('Ikke innlogget')

  const now = new Date()
  const future = new Date(Date.now() + daysAhead * 86400000)

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${encodeURIComponent(now.toISOString())}&` +
    `timeMax=${encodeURIComponent(future.toISOString())}&` +
    `singleEvents=true&orderBy=startTime&maxResults=100&showDeleted=false`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    throw new Error(`Google Calendar API feil: ${response.status}`)
  }

  const data = await response.json()
  const items = data.items || []

  return items.map((item: any): Omit<CalEvent, 'id'> => {
    const isAllDay = !!item.start.date
    const startDate = isAllDay
      ? item.start.date
      : format(parseISO(item.start.dateTime), 'yyyy-MM-dd')
    const startTime = isAllDay
      ? undefined
      : format(parseISO(item.start.dateTime), 'HH:mm')
    const endTime = isAllDay || !item.end?.dateTime
      ? undefined
      : format(parseISO(item.end.dateTime), 'HH:mm')

    return {
      title: item.summary || 'Ingen tittel',
      date: startDate,
      startTime,
      endTime,
      allDay: isAllDay,
      location: item.location,
      memberIds: ['max'],
      source: 'outlook',
    }
  })
}