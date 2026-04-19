import { format, addDays, nextMonday, setDay } from 'date-fns'
import type { CalEvent, Task } from '@/types'
import type { MemberId } from '@/types'

export interface ParseResult {
  events: Omit<CalEvent, 'id'>[]
  tasks: Omit<Task, 'id' | 'createdAt'>[]
}

// Finn uke-start (mandag) basert på ukenummer
function getMondayOfWeek(weekNum: number, year: number): Date {
  const jan4 = new Date(year, 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  return new Date(startOfWeek1.getTime() + (weekNum - 1) * 7 * 86400000)
}

const WEEKDAY_OFFSET: Record<string, number> = {
  mandag: 0, tirsdag: 1, onsdag: 2, torsdag: 3, fredag: 4
}

// Finn hvilket barn basert på trinn
function getMemberFromText(text: string): MemberId {
  const lower = text.toLowerCase()
  if (lower.includes('2.trinn') || lower.includes('2. trinn') || lower.includes('2.trinn')) return 'felix'
  if (lower.includes('5.trinn') || lower.includes('5. trinn') || lower.includes('5.trinn')) return 'finn'
  return 'felix' // fallback
}

// Finn ukenummer og år fra tekst
function getWeekAndYear(text: string): { week: number; year: number } | null {
  const m = text.match(/uke\s*(\d{1,2})/i)
  const yearMatch = text.match(/20(\d{2})/)
  if (!m) return null
  return {
    week: parseInt(m[1]),
    year: yearMatch ? 2000 + parseInt(yearMatch[1]) : new Date().getFullYear()
  }
}

// Parser norsk dato direkte (f.eks. "20. til 24.april")
function parseDateRange(text: string, week: number, year: number): { monday: Date } {
  return { monday: getMondayOfWeek(week, year) }
}

const HUSK_KEYWORDS = [
  'husk', 'ta med', 'ikke glem', 'viktig', 'innlevering', 
  'lever', 'med seg', 'lekedag', 'eggekartonger', 'gymsko',
  'gym', 'svømming', 'tur', 'penger', 'mat', 'matpakke'
]

const LEKSE_KEYWORDS = [
  'leselekse', 'skrivelekse', 'mattelekse', 'lekse', 
  'hjemmearbeid', 'øv på', 'les', 'jobb med'
]

const INFO_KEYWORDS = [
  'vi fortsetter', 'vi minner', 'vi trenger', 'info:', 
  'beskjed', 'utviklingssamtale', 'planleggingsdag'
]

export function parseVigiloPDF(text: string, filename: string): ParseResult {
  const tasks: Omit<Task, 'id' | 'createdAt'>[] = []
  const events: Omit<CalEvent, 'id'>[] = []

  const member = getMemberFromText(text + filename)
  const weekInfo = getWeekAndYear(text + filename)
  
  const monday = weekInfo 
    ? getMondayOfWeek(weekInfo.week, weekInfo.year)
    : new Date()

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Track current day context
  let currentDayOffset = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lower = line.toLowerCase()

    // Detect weekday context
    for (const [day, offset] of Object.entries(WEEKDAY_OFFSET)) {
      if (lower.startsWith(day)) {
        currentDayOffset = offset
        break
      }
    }

    // ── HUSK-oppgaver ──────────────────────────────────
    if (HUSK_KEYWORDS.some(kw => lower.includes(kw))) {
      // Skip bare ukedagnavn
      if (Object.keys(WEEKDAY_OFFSET).includes(lower)) continue
      
      // Rens teksten
      let title = line
        .replace(/^husk\s*/i, '')
        .replace(/^ta med\s*/i, 'Ta med: ')
        .trim()

      if (title.length < 3) continue

      // Sett frist til riktig dag
      const dueDate = currentDayOffset >= 0
        ? format(addDays(monday, currentDayOffset), 'yyyy-MM-dd')
        : format(monday, 'yyyy-MM-dd')

      tasks.push({
        title: title.slice(0, 120),
        category: 'skole',
        assignedTo: [member],
        dueDate,
        done: false,
        priority: lower.includes('husk') || lower.includes('innlevering') ? 'høy' : 'middels'
      })
    }

    // ── Lekser ─────────────────────────────────────────
    else if (LEKSE_KEYWORDS.some(kw => lower.includes(kw))) {
      let title = line.trim()
      if (title.length < 5) continue

      // Lekser gjelder mandag-torsdag, frist er fredag
      const dueDate = format(addDays(monday, 3), 'yyyy-MM-dd') // torsdag

      tasks.push({
        title: `📚 ${title.slice(0, 120)}`,
        category: 'skole',
        assignedTo: [member],
        dueDate,
        done: false,
        priority: 'middels'
      })
    }

    // ── Info til foreldre ──────────────────────────────
    else if (INFO_KEYWORDS.some(kw => lower.includes(kw))) {
      let title = line.trim()
      if (title.length < 10) continue

      tasks.push({
        title: `ℹ️ ${title.slice(0, 120)}`,
        category: 'skole',
        assignedTo: ['juni', 'max'],
        dueDate: format(monday, 'yyyy-MM-dd'),
        done: false,
        priority: lower.includes('utviklingssamtale') || lower.includes('planlegging') ? 'høy' : 'lav'
      })
    }
  }
// Lag kalender-hendelser fra husk-oppgaver med dato

  // Fjern duplikater
  const unique = tasks.filter((t, i, arr) =>
    arr.findIndex(x => x.title === t.title) === i
  )
  for (const task of unique) {
    if (task.dueDate && task.priority !== 'lav') {
      events.push({
        title: task.title.replace('📚 ', '').replace('ℹ️ ', ''),
        date: task.dueDate,
        allDay: true,
        memberIds: task.assignedTo,
        source: 'vigilo',
        vigiloFile: filename,
      })
    }
  }
  return { events, tasks: unique }
}

// Mock for testing uten PDF-ekstraksjon
export function mockVigiloParse(filename: string): ParseResult {
  const lower = filename.toLowerCase()
  const member: MemberId = lower.includes('2') ? 'felix' : 'finn'
  const monday = nextMonday(new Date())

  return {
    events: [],
    tasks: [
      {
        title: 'Husk gymsko',
        category: 'skole',
        assignedTo: [member],
        dueDate: format(monday, 'yyyy-MM-dd'),
        done: false,
        priority: 'høy'
      },
      {
        title: 'Husk innlevering av leksemappe',
        category: 'skole',
        assignedTo: [member],
        dueDate: format(addDays(monday, 3), 'yyyy-MM-dd'),
        done: false,
        priority: 'høy'
      },
      {
        title: 'Lekedag: Ta med egen leke om du vil',
        category: 'skole',
        assignedTo: [member],
        dueDate: format(addDays(monday, 4), 'yyyy-MM-dd'),
        done: false,
        priority: 'middels'
      },
      {
        title: '📚 Leselekse: Fabel side 124-125',
        category: 'skole',
        assignedTo: [member],
        dueDate: format(addDays(monday, 3), 'yyyy-MM-dd'),
        done: false,
        priority: 'middels'
      },
      {
        title: '📚 Skrivelekse: Jobb med diftonger på Askiraski.no',
        category: 'skole',
        assignedTo: [member],
        dueDate: format(addDays(monday, 3), 'yyyy-MM-dd'),
        done: false,
        priority: 'middels'
      },
      {
        title: 'ℹ️ Vi trenger eggekartonger til prosjekt i engelsk',
        category: 'skole',
        assignedTo: ['juni', 'max'],
        dueDate: format(monday, 'yyyy-MM-dd'),
        done: false,
        priority: 'lav'
      },
      {
        title: 'ℹ️ Vi fortsetter med utviklingssamtaler',
        category: 'skole',
        assignedTo: ['juni', 'max'],
        dueDate: format(monday, 'yyyy-MM-dd'),
        done: false,
        priority: 'høy'
      }
    ]
  }
}