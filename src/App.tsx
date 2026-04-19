// src/App.tsx
import React from 'react'
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
  const { activeTab, setActiveTab } = useStore()

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', maxWidth:480, margin:'0 auto', position:'relative' }}>
      {/* Screen */}
      <div className="scroll-area" style={{ flex:1, display:'flex', flexDirection:'column' }}>
        {activeTab === 'kalender' && <CalendarScreen />}
        {activeTab === 'oppgaver' && <TasksScreen />}
        {activeTab === 'mat'      && <FoodScreen />}
        {activeTab === 'koble'    && <ConnectScreen />}
      </div>

      {/* Tab bar */}
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
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
