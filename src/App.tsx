import React, { useEffect } from 'react'
import { useStore } from '@/store'
import CalendarScreen from '@/screens/CalendarScreen'
import TasksScreen from '@/screens/TasksScreen'
import FoodScreen from '@/screens/FoodScreen'
import ConnectScreen from '@/screens/ConnectScreen'

const TABS = [
  { id: 'kalender', label: 'Kalender', icon: '📅' },
  { id: 'oppgaver', label: 'Oppgaver', icon: '✅' },
  { id: 'mat',      label: 'Mat',      icon: '🍽️' },
  { id: 'koble',    label: 'Koble til', icon: '🔗' },
]

export default function App() {
  const { activeTab, setActiveTab, loadAll, subscribeToChanges, isLoading } = useStore()

  useEffect(() => {
    loadAll()
    const unsubscribe = subscribeToChanges()
    return unsubscribe
  }, [])

  useEffect(() => {
    // Auto-sync Google Calendar hvis tidligere innlogget
    const autoSync = async () => {
      try {
        const { signInWithGoogle, fetchGoogleCalendarEvents } = await import('@/utils/googleCalendar')
        const success = await signInWithGoogle()
        if (success) {
          const events = await fetchGoogleCalendarEvents(30)
          if (events.length > 0) {
            await useStore.getState().addEventsFromVigilo(events)
          }
        }
      } catch {
        // Stille feil — bruker ikke innlogget
      }
    }
    autoSync()
  }, [])

  if (isLoading) {
    return (
      <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--off-white)', gap:16 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color:'var(--navy)' }}>Familie E-V-L</div>
        <div style={{ display:'flex', gap:6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:8, height:8, borderRadius:4, background:'var(--navy)', animation:`bounce 0.8s ease ${i*0.15}s infinite alternate` }} />
          ))}
        </div>
        <style>{`@keyframes bounce { from { transform: translateY(0); opacity:0.4; } to { transform: translateY(-8px); opacity:1; } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', maxWidth:480, margin:'0 auto', position:'relative' }}>
      <div className="scroll-area" style={{ flex:1, display:'flex', flexDirection:'column' }}>
        {activeTab === 'kalender' && <CalendarScreen />}
        {activeTab === 'oppgaver' && <TasksScreen />}
        {activeTab === 'mat'      && <FoodScreen />}
        {activeTab === 'koble'    && <ConnectScreen />}
      </div>

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <div key={tab.id} className={`tab-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <div className={activeTab === tab.id ? 'tab-icon-wrap' : ''}>
              <span className="tab-icon">{tab.icon}</span>
            </div>
            <span className="tab-label">{tab.label}</span>
          </div>
        ))}
      </nav>
    </div>
  )
}