import { format, parseISO } from 'date-fns'
import type { CalEvent } from '@/types'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

export function loadGoogleAPI(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).gapi) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      (window as any).gapi.load('client:auth2', async () => {
        await (window as any).gapi.client.init({
          clientId: CLIENT_ID,
          scope: SCOPES,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        })
        resolve()
      })
    }
    document.body.appendChild(script)
  })
}

export async function signInWithGoogle(): Promise<boolean> {
  await loadGoogleAPI()
  const authInstance = (window as any).gapi.auth2.getAuthInstance()
  if (authInstance.isSignedIn.get()) return true
  try {
    await authInstance.signIn()
    return true
  } catch {
    return false
  }
}

export async function signOutGoogle() {
  await loadGoogleAPI()
  const authInstance = (window as any).gapi.auth2.getAuthInstance()
  if (authInstance.isSignedIn.get()) await authInstance.signOut()
}

export async function isSignedIn(): Promise<boolean> {
  await loadGoogleAPI()
  return (window as any).gapi.auth2.getAuthInstance().isSignedIn.get()
}

export async function fetchGoogleCalendarEvents(
  daysAhead = 30
): Promise<Omit<CalEvent, 'id'>[]> {
  await loadGoogleAPI()
  const now = new Date()
  const future = new Date(Date.now() + daysAhead * 86400000)

  const response = await (window as any).gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 100,
    orderBy: 'startTime',
  })

  const items = response.result.items || []

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