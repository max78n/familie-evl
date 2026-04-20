import { create } from 'zustand'
import { format, addDays } from 'date-fns'
import { supabase } from '@/utils/supabase'
import type { CalEvent, Task, Meal, ShoppingItem, VigiloDoc, MemberId } from '@/types'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const d = (n: number) => format(addDays(new Date(), n), 'yyyy-MM-dd')
const uid = () => Math.random().toString(36).slice(2, 9)

interface Store {
  events: CalEvent[]
  tasks: Task[]
  meals: Meal[]
  shopping: ShoppingItem[]
  vigiloDocs: VigiloDoc[]
  selectedDate: string
  activeTab: string
  isLoading: boolean
  setSelectedDate: (d: string) => void
  setActiveTab: (t: string) => void
  loadAll: () => Promise<void>
  addEvent: (e: Omit<CalEvent, 'id'>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  addMeal: (m: Omit<Meal, 'id'>) => Promise<void>
  deleteMeal: (id: string) => Promise<void>
  addShoppingItem: (i: Omit<ShoppingItem, 'id'>) => Promise<void>
  toggleShoppingItem: (id: string) => Promise<void>
  deleteShoppingItem: (id: string) => Promise<void>
  clearBought: () => Promise<void>
  addVigiloDoc: (doc: VigiloDoc) => void
  addEventsFromVigilo: (evs: Omit<CalEvent, 'id'>[]) => Promise<void>
  addTasksFromVigilo: (tasks: Omit<Task, 'id' | 'createdAt'>[]) => Promise<void>
  subscribeToChanges: () => () => void
}

function rowToEvent(r: any): CalEvent {
  return { id: r.id, title: r.title, date: r.date, startTime: r.start_time, endTime: r.end_time, allDay: r.all_day, location: r.location, memberIds: r.member_ids || [], source: r.source, vigiloFile: r.vigilo_file }
}
function rowToTask(r: any): Task {
  return { id: r.id, title: r.title, category: r.category, assignedTo: r.assigned_to || [], dueDate: r.due_date, done: r.done, priority: r.priority, createdAt: r.created_at }
}
function rowToMeal(r: any): Meal {
  return { id: r.id, date: r.date, type: r.type, name: r.name, notes: r.notes }
}
function rowToShopping(r: any): ShoppingItem {
  return { id: r.id, name: r.name, category: r.category, quantity: r.quantity, done: r.done, addedBy: r.added_by }
}

export const useStore = create<Store>()((set, get) => ({
  events: [], tasks: [], meals: [], shopping: [], vigiloDocs: [],
  selectedDate: TODAY, activeTab: 'kalender', isLoading: true,

  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setActiveTab: (activeTab) => set({ activeTab }),

  loadAll: async () => {
    set({ isLoading: true })
    const [e, t, m, s] = await Promise.all([
      supabase.from('events').select('*').order('date'),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('meals').select('*').order('date'),
      supabase.from('shopping').select('*').order('created_at'),
    ])
    const events = (e.data || []).map(rowToEvent)
    const tasks = (t.data || []).map(rowToTask)
    const meals = (m.data || []).map(rowToMeal)
    const shopping = (s.data || []).map(rowToShopping)

    if (events.length === 0) await seedEvents()
    if (tasks.length === 0) await seedTasks()
    if (meals.length === 0) await seedMeals()
    if (shopping.length === 0) await seedShopping()

    const [e2, t2, m2, s2] = await Promise.all([
      supabase.from('events').select('*').order('date'),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('meals').select('*').order('date'),
      supabase.from('shopping').select('*').order('created_at'),
    ])
    set({
      events: (e2.data||[]).map(rowToEvent),
      tasks: (t2.data||[]).map(rowToTask),
      meals: (m2.data||[]).map(rowToMeal),
      shopping: (s2.data||[]).map(rowToShopping),
      isLoading: false
    })
  },

  subscribeToChanges: () => {
    const channel = supabase.channel('familie-evl-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, async () => {
        const { data } = await supabase.from('events').select('*').order('date')
        set({ events: (data||[]).map(rowToEvent) })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async () => {
        const { data } = await supabase.from('tasks').select('*').order('created_at')
        set({ tasks: (data||[]).map(rowToTask) })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, async () => {
        const { data } = await supabase.from('meals').select('*').order('date')
        set({ meals: (data||[]).map(rowToMeal) })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping' }, async () => {
        const { data } = await supabase.from('shopping').select('*').order('created_at')
        set({ shopping: (data||[]).map(rowToShopping) })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },

  addEvent: async (e) => {
    await supabase.from('events').insert({ id: uid(), title: e.title, date: e.date, start_time: e.startTime, end_time: e.endTime, all_day: e.allDay, location: e.location, member_ids: e.memberIds, source: e.source, vigilo_file: e.vigiloFile })
  },
  deleteEvent: async (id) => { await supabase.from('events').delete().eq('id', id) },

  addTask: async (t) => {
    await supabase.from('tasks').insert({ id: uid(), title: t.title, category: t.category, assigned_to: t.assignedTo, due_date: t.dueDate, done: false, priority: t.priority, created_at: TODAY })
  },
  toggleTask: async (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return
    await supabase.from('tasks').update({ done: !task.done }).eq('id', id)
  },
  deleteTask: async (id) => { await supabase.from('tasks').delete().eq('id', id) },

  addMeal: async (m) => {
    await supabase.from('meals').insert({ id: uid(), date: m.date, type: m.type, name: m.name, notes: m.notes })
  },
  deleteMeal: async (id) => { await supabase.from('meals').delete().eq('id', id) },

  addShoppingItem: async (i) => {
    await supabase.from('shopping').insert({ id: uid(), name: i.name, category: i.category, quantity: i.quantity, done: false, added_by: i.addedBy })
  },
  toggleShoppingItem: async (id) => {
    const item = get().shopping.find(i => i.id === id)
    if (!item) return
    await supabase.from('shopping').update({ done: !item.done }).eq('id', id)
  },
  deleteShoppingItem: async (id) => { await supabase.from('shopping').delete().eq('id', id) },
  clearBought: async () => { await supabase.from('shopping').delete().eq('done', true) },

  addVigiloDoc: (doc) => set(s => ({ vigiloDocs: [doc, ...s.vigiloDocs] })),
  addEventsFromVigilo: async (evs) => {
    const { data: existing } = await supabase.from('events').select('title, date')
    const existingKeys = new Set((existing || []).map((e: any) => `${e.title}_${e.date}`))
    const newEvs = evs.filter(e => !existingKeys.has(`${e.title}_${e.date}`))
    if (newEvs.length === 0) return
    await supabase.from('events').insert(newEvs.map(e => ({ id: uid(), title: e.title, date: e.date, start_time: e.startTime, end_time: e.endTime, all_day: e.allDay, location: e.location, member_ids: e.memberIds, source: 'vigilo', vigilo_file: e.vigiloFile })))
  },
  addTasksFromVigilo: async (tasks) => {
    const { data: existing } = await supabase.from('tasks').select('title')
    const existingTitles = new Set((existing || []).map((t: any) => t.title))
    const newTasks = tasks.filter(t => !existingTitles.has(t.title))
    if (newTasks.length === 0) return
    await supabase.from('tasks').insert(newTasks.map(t => ({ id: uid(), title: t.title, category: t.category, assigned_to: t.assignedTo, due_date: t.dueDate, done: false, priority: t.priority, created_at: TODAY })))
  },
}))

async function seedEvents() {
  await supabase.from('events').insert([
    { id: uid(), title: 'Fotballtrening – Finn', date: TODAY, start_time: '16:00', end_time: '17:30', member_ids: ['finn'], source: 'outlook', location: 'Idrettshallen', all_day: false },
    { id: uid(), title: 'Foreldremøte', date: TODAY, start_time: '18:30', end_time: '20:00', member_ids: ['juni', 'max'], source: 'vigilo', location: 'Barneskolen', all_day: false },
    { id: uid(), title: 'Tannlege – Felix', date: d(2), start_time: '10:00', member_ids: ['felix', 'juni'], source: 'outlook', location: 'Tannlegekontoret', all_day: false },
    { id: uid(), title: 'Middag hos bestemor', date: d(4), start_time: '17:00', member_ids: ['juni', 'max', 'finn', 'felix'], source: 'manuell', all_day: false },
  ])
}
async function seedTasks() {
  await supabase.from('tasks').insert([
    { id: uid(), title: 'Støvsuge stue og soverom', category: 'husarbeid', assigned_to: ['juni'], done: false, priority: 'middels', created_at: TODAY },
    { id: uid(), title: 'Handle inn matvarene', category: 'husarbeid', assigned_to: ['max'], done: false, priority: 'høy', created_at: TODAY },
    { id: uid(), title: 'Tømme oppvaskmaskinen', category: 'husarbeid', assigned_to: ['finn'], done: false, priority: 'lav', created_at: TODAY },
    { id: uid(), title: 'Ta ut søpla', category: 'husarbeid', assigned_to: ['max'], done: false, priority: 'middels', created_at: TODAY },
    { id: uid(), title: 'Levere samtykkeskjema – Finn', category: 'skole', assigned_to: ['juni'], done: false, priority: 'høy', created_at: TODAY, due_date: TODAY },
  ])
}
async function seedMeals() {
  await supabase.from('meals').insert([
    { id: uid(), date: TODAY, type: 'frokost', name: 'Havregrøt med bær' },
    { id: uid(), date: TODAY, type: 'middag', name: 'Kyllingsuppe', notes: 'Dobbel porsjon – frys rester' },
    { id: uid(), date: d(1), type: 'middag', name: 'Tacos' },
    { id: uid(), date: d(2), type: 'middag', name: 'Pasta Bolognese' },
    { id: uid(), date: d(3), type: 'middag', name: 'Laksfilet med grønnsaker' },
    { id: uid(), date: d(4), type: 'middag', name: 'Pølser og potetmos' },
  ])
}
async function seedShopping() {
  await supabase.from('shopping').insert([
    { id: uid(), name: 'Kyllingfilet 800g', category: 'Kjøtt', done: false, added_by: 'juni' },
    { id: uid(), name: 'Gulrøtter', category: 'Grønnsaker', done: false },
    { id: uid(), name: 'Melk 1.5l', category: 'Meieri', done: false },
    { id: uid(), name: 'Tortillalefser', category: 'Brød', done: false },
    { id: uid(), name: 'Kjøttdeig 500g', category: 'Kjøtt', done: false },
    { id: uid(), name: 'Spaghetti', category: 'Tørrmat', done: false },
  ])
}