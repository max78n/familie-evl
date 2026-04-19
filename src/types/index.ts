// src/types/index.ts
export type MemberId = 'juni' | 'max' | 'finn' | 'felix'

export interface Member {
  id: MemberId
  name: string
  initials: string
  color: string
  lightColor: string
  textColor: string
}

export type EventSource = 'outlook' | 'vigilo' | 'manuell'

export interface CalEvent {
  id: string
  title: string
  date: string
  startTime?: string
  endTime?: string
  allDay?: boolean
  location?: string
  memberIds: MemberId[]
  source: EventSource
  vigiloFile?: string
}

export type TaskCat = 'husarbeid' | 'skole' | 'annet'
export type Priority = 'lav' | 'middels' | 'høy'

export interface Task {
  id: string
  title: string
  category: TaskCat
  assignedTo: MemberId[]
  dueDate?: string
  done: boolean
  priority: Priority
  createdAt: string
}

export type MealType = 'frokost' | 'lunsj' | 'middag' | 'mellommåltid'

export interface Meal {
  id: string
  date: string
  type: MealType
  name: string
  notes?: string
}

export interface ShoppingItem {
  id: string
  name: string
  category: string
  quantity?: string
  done: boolean
  addedBy?: MemberId
}

export interface VigiloDoc {
  id: string
  filename: string
  uploadedAt: string
  eventsFound: number
  tasksFound: number
}
