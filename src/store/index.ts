// src/store/index.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, addDays } from 'date-fns'
import type { CalEvent, Task, Meal, ShoppingItem, VigiloDoc, MemberId, TaskCat, Priority, MealType } from '@/types'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const d = (n: number) => format(addDays(new Date(), n), 'yyyy-MM-dd')

const uid = () => Math.random().toString(36).slice(2, 9)

const SEED_EVENTS: CalEvent[] = [
  { id: 'e1', title: 'Fotballtrening – Finn', date: TODAY, startTime: '16:00', endTime: '17:30', memberIds: ['finn'], source: 'outlook', location: 'Idrettshallen' },
  { id: 'e2', title: 'Foreldremøte', date: TODAY, startTime: '18:30', endTime: '20:00', memberIds: ['juni', 'max'], source: 'vigilo', location: 'Barneskolen' },
  { id: 'e3', title: 'Tannlege – Felix', date: d(2), startTime: '10:00', memberIds: ['felix', 'juni'], source: 'outlook', location: 'Tannlegekontoret' },
  { id: 'e4', title: 'Svømmetime – Finn', date: d(3), startTime: '15:30', memberIds: ['finn'], source: 'vigilo' },
  { id: 'e5', title: 'Middag hos bestemor', date: d(4), startTime: '17:00', memberIds: ['juni', 'max', 'finn', 'felix'], source: 'manuell' },
  { id: 'e6', title: 'Legesjekk – Juni', date: d(6), startTime: '09:15', memberIds: ['juni'], source: 'outlook' },
  { id: 'e7', title: 'Bursdagsselskap – Felix', date: d(8), startTime: '14:00', memberIds: ['felix'], source: 'manuell', location: 'Lekeparken' },
  { id: 'e8', title: 'Arbeidsmøte – Max', date: d(1), startTime: '09:00', endTime: '11:00', memberIds: ['max'], source: 'outlook' },
]

const SEED_TASKS: Task[] = [
  { id: 't1', title: 'Støvsuge stue og soverom', category: 'husarbeid', assignedTo: ['juni'], done: false, priority: 'middels', createdAt: TODAY },
  { id: 't2', title: 'Handle inn matvarene', category: 'husarbeid', assignedTo: ['max'], done: true, priority: 'høy', createdAt: TODAY },
  { id: 't3', title: 'Tømme oppvaskmaskinen', category: 'husarbeid', assignedTo: ['finn'], done: false, priority: 'lav', createdAt: TODAY },
  { id: 't4', title: 'Vaske klær (mørke)', category: 'husarbeid', assignedTo: ['felix'], done: false, priority: 'middels', createdAt: TODAY },
  { id: 't5', title: 'Rydde barnerom', category: 'husarbeid', assignedTo: ['finn', 'felix'], done: true, priority: 'lav', createdAt: TODAY },
  { id: 't6', title: 'Ta ut søpla', category: 'husarbeid', assignedTo: ['max'], done: false, priority: 'middels', createdAt: TODAY },
  { id: 't7', title: 'Levere samtykkeskjema – Finn', category: 'skole', assignedTo: ['juni'], done: false, priority: 'høy', createdAt: TODAY, dueDate: TODAY },
  { id: 't8', title: 'Kjøpe pennal til Felix', category: 'skole', assignedTo: ['max'], done: false, priority: 'middels', createdAt: TODAY },
  { id: 't9', title: 'Hente Finn sine gymklær', category: 'skole', assignedTo: ['juni'], done: true, priority: 'lav', createdAt: TODAY },
]

const SEED_MEALS: Meal[] = [
  { id: 'm1', date: TODAY, type: 'frokost', name: 'Havregrøt med bær' },
  { id: 'm2', date: TODAY, type: 'lunsj', name: 'Brødskive med pålegg' },
  { id: 'm3', date: TODAY, type: 'middag', name: 'Kyllingsuppe', notes: 'Dobbel porsjon – frys rester' },
  { id: 'm4', date: d(1), type: 'middag', name: 'Tacos' },
  { id: 'm5', date: d(2), type: 'middag', name: 'Pasta Bolognese' },
  { id: 'm6', date: d(3), type: 'middag', name: 'Laksfilet med grønnsaker' },
  { id: 'm7', date: d(4), type: 'middag', name: 'Pølser og potetmos' },
  { id: 'm8', date: d(5), type: 'middag', name: 'Hjemmelaget pizza' },
  { id: 'm9', date: d(6), type: 'middag', name: 'Karbonadedeig med ris' },
]

const SEED_SHOPPING: ShoppingItem[] = [
  { id: 's1', name: 'Kyllingfilet 800g', category: 'Kjøtt', done: false, addedBy: 'juni' },
  { id: 's2', name: 'Havregryn', category: 'Frokost', done: true, addedBy: 'max' },
  { id: 's3', name: 'Gulrøtter', category: 'Grønnsaker', done: false },
  { id: 's4', name: 'Melk 1.5l', category: 'Meieri', done: true },
  { id: 's5', name: 'Tortillalefser', category: 'Brød', done: false },
  { id: 's6', name: 'Kjøttdeig 500g', category: 'Kjøtt', done: false },
  { id: 's7', name: 'Spaghetti', category: 'Tørrmat', done: false },
  { id: 's8', name: 'Hermetiske tomater x2', category: 'Tørrmat', done: false },
  { id: 's9', name: 'Rømme', category: 'Meieri', done: false },
  { id: 's10', name: 'Laksefilet 600g', category: 'Fisk', done: false },
]

interface Store {
  events: CalEvent[]
  tasks: Task[]
  meals: Meal[]
  shopping: ShoppingItem[]
  vigiloDocs: VigiloDoc[]
  selectedDate: string
  activeTab: string

  setSelectedDate: (d: string) => void
  setActiveTab: (t: string) => void

  addEvent: (e: Omit<CalEvent, 'id'>) => void
  deleteEvent: (id: string) => void

  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void

  addMeal: (m: Omit<Meal, 'id'>) => void
  deleteMeal: (id: string) => void

  addShoppingItem: (i: Omit<ShoppingItem, 'id'>) => void
  toggleShoppingItem: (id: string) => void
  deleteShoppingItem: (id: string) => void
  clearBought: () => void

  addVigiloDoc: (doc: VigiloDoc) => void
  addEventsFromVigilo: (evs: Omit<CalEvent, 'id'>[]) => void
  addTasksFromVigilo: (tasks: Omit<Task, 'id' | 'createdAt'>[]) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      events: SEED_EVENTS,
      tasks: SEED_TASKS,
      meals: SEED_MEALS,
      shopping: SEED_SHOPPING,
      vigiloDocs: [],
      selectedDate: TODAY,
      activeTab: 'kalender',

      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setActiveTab: (activeTab) => set({ activeTab }),

      addEvent: (e) => set((s) => ({ events: [...s.events, { ...e, id: uid() }] })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid(), createdAt: TODAY }] })),
      toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addMeal: (m) => set((s) => ({ meals: [...s.meals, { ...m, id: uid() }] })),
      deleteMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),

      addShoppingItem: (i) => set((s) => ({ shopping: [...s.shopping, { ...i, id: uid() }] })),
      toggleShoppingItem: (id) => set((s) => ({ shopping: s.shopping.map((i) => i.id === id ? { ...i, done: !i.done } : i) })),
      deleteShoppingItem: (id) => set((s) => ({ shopping: s.shopping.filter((i) => i.id !== id) })),
      clearBought: () => set((s) => ({ shopping: s.shopping.filter((i) => !i.done) })),

      addVigiloDoc: (doc) => set((s) => ({ vigiloDocs: [doc, ...s.vigiloDocs] })),
      addEventsFromVigilo: (evs) => set((s) => ({ events: [...s.events, ...evs.map((e) => ({ ...e, id: uid() }))] })),
      addTasksFromVigilo: (tasks) => set((s) => ({ tasks: [...s.tasks, ...tasks.map((t) => ({ ...t, id: uid(), createdAt: TODAY }))] })),
    }),
    { name: 'familie-evl-v1' }
  )
)
