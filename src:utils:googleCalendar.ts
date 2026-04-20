// src/utils/googleCalendar.ts
import { format, parseISO } from 'date-fns'
import type { CalEvent } from '@/types'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

// Last inn Google API
export function loadGoogleAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.gapi) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      window.gapi.load('client:auth2', async () => {
        await window.gapi.client.init({
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

// Logg inn med Google
export async function signInWithGoogle(): Promise<boolean> {
  await loadGoogleAPI()
  const authInstance = window.gapi.auth2.getAuthInstance()
  if (authInstance.isSignedIn.get()) return true
  try {
    await authInstance.signIn()
    return true
  } catch {
    return false
  }
}

// Logg ut
export async function signOutGoogle() {
  await loadGoogleAPI()
  const authInstance = window.gapi.auth2.getAuthInstance()
  if (authInstance.isSignedIn.get()) await authInstance.signOut()
}

export async function isSignedIn(): Promise<boolean> {
  await loadGoogleAPI()
  return window.gapi.auth2.getAuthInstance().isSignedIn.get()
}

// Hent hendelser fra Google Calendar
export async function fetchGoogleCalendarEvents(
  daysAhead = 30
): Promise<Omit<CalEvent, 'id'>[]> {
  await loadGoogleAPI()
  const now = new Date()
  const future = new Date(Date.now() + daysAhead * 86400000)

  const response = await window.gapi.client.calendar.events.list({
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
    const endTime = isAllDay || !item.end.dateTime
      ? undefined
      : format(parseISO(item.end.dateTime), 'HH:mm')

    return {
      title: item.summary || 'Ingen tittel',
      date: startDate,
      startTime,
      endTime,
      allDay: isAllDay,
      location: item.location,
      description: item.description,
      memberIds: ['max'],
      source: 'outlook', // viser som Outlook i appen
    }
  })
}

// Legg til global type for gapi
declare global {
  interface Window { gapi: any }
}