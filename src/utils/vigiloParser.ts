// src/utils/vigiloParser.ts
import { format, addDays } from 'date-fns'
import type { CalEvent, Task } from '@/types'

const NO_MONTHS: Record<string, number> = {
  januar:0,februar:1,mars:2,april:3,mai:4,juni:5,
  juli:6,august:7,september:8,oktober:9,november:10,desember:11,
  jan:0,feb:1,mar:2,apr:3,jun:5,jul:6,aug:7,sep:8,okt:9,nov:10,des:11,
}

function parseNorDate(s: string): string | null {
  const m = s.toLowerCase().match(/(\d{1,2})\.?\s+([a-zæøå]+)\s*(\d{4})?/)
  if (m) {
    const day = parseInt(m[1]), month = NO_MONTHS[m[2]], year = m[3] ? parseInt(m[3]) : new Date().getFullYear()
    if (month !== undefined) {
      const d = new Date(year, month, day)
      if (!isNaN(d.getTime())) return format(d, 'yyyy-MM-dd')
    }
  }
  const n = s.match(/(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/)
  if (n) {
    const day = parseInt(n[1]), mon = parseInt(n[2]) - 1
    const yr = n[3] ? (n[3].length === 2 ? 2000 + parseInt(n[3]) : parseInt(n[3])) : new Date().getFullYear()
    const d = new Date(yr, mon, day)
    if (!isNaN(d.getTime())) return format(d, 'yyyy-MM-dd')
  }
  return null
}

function parseTime(s: string): string | undefined {
  const m = s.match(/(\d{1,2})[:.:](\d{2})/)
  return m ? `${m[1].padStart(2,'0')}:${m[2]}` : undefined
}

export interface ParseResult {
  events: Omit<CalEvent, 'id'>[]
  tasks: Omit<Task, 'id' | 'createdAt'>[]
}

export function parseVigiloText(text: string, filename: string): ParseResult {
  const events: Omit<CalEvent,'id'>[] = []
  const tasks: Omit<Task,'id'|'createdAt'>[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const EVENT_KW = ['arrangement','møte','trening','aktivitet','tur','konsert','forestilling','prøve','kl.','klokken']
  const TASK_KW = ['husk','ta med','lever','innlever','frist','deadline','påminnelse','viktig','NB!','obs!']

  for (const line of lines) {
    const lower = line.toLowerCase()
    const dateMatch = lower.match(/(\d{1,2}\.?\s+(?:januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|aug|sep|okt|nov|des)\s*(?:\d{4})?|\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?)/)
    if (!dateMatch) continue
    const date = parseNorDate(dateMatch[1])
    if (!date) continue
    const startTime = parseTime(line)
    const isTask = TASK_KW.some(k => lower.includes(k))
    const isEvent = EVENT_KW.some(k => lower.includes(k)) || !!startTime
    const title = line.replace(dateMatch[0], '').replace(/\d{1,2}[:.]\d{2}/,'').replace(/^\W+/,'').trim() || 'Vigilo-arrangement'

    if (isTask && !isEvent) {
      tasks.push({ title: title.slice(0,120), category:'skole', assignedTo:['juni','max'], dueDate:date, done:false, priority: lower.includes('viktig')||lower.includes('nb!')?'høy':'middels' })
    } else {
      events.push({ title: title.slice(0,120), date, startTime, memberIds:['finn','felix'], source:'vigilo', vigiloFile: filename })
    }
  }
  return { events, tasks }
}

// Mock result used when real text extraction isn't available in browser
export function mockVigiloParse(filename: string): ParseResult {
  return {
    events: [
      { title: 'Foreldremøte (Vigilo)', date: format(addDays(new Date(),1),'yyyy-MM-dd'), startTime:'18:30', memberIds:['juni','max'], source:'vigilo', vigiloFile:filename, location:'Skolen' },
      { title: 'Klassetur til museum', date: format(addDays(new Date(),7),'yyyy-MM-dd'), allDay:true, memberIds:['finn','felix'], source:'vigilo', vigiloFile:filename },
      { title: 'Avslutningsfest', date: format(addDays(new Date(),10),'yyyy-MM-dd'), startTime:'14:00', memberIds:['finn','felix'], source:'vigilo', vigiloFile:filename, location:'Gymsalen' },
    ],
    tasks: [
      { title:'Lever samtykkeskjema for tur', category:'skole', assignedTo:['juni'], dueDate: format(addDays(new Date(),2),'yyyy-MM-dd'), done:false, priority:'høy' },
    ]
  }
}
