import React, { useState, useMemo, useEffect } from 'react'
import { useStore } from '@/store'
import { MEMBERS, MEMBER_MAP, PRIORITY_COLORS } from '@/utils/members'
import type { MemberId, TaskCat, Priority } from '@/types'
import AddTaskModal from '@/components/AddTaskModal'

const CATS: { key: TaskCat | 'alle'; label: string; icon: string }[] = [
  { key:'alle',      label:'Alle',      icon:'📋' },
  { key:'husarbeid', label:'Husarbeid', icon:'🏠' },
  { key:'skole',     label:'Skole',     icon:'🎒' },
  { key:'annet',     label:'Annet',     icon:'📌' },
]

export default function TasksScreen() {
  const { tasks, toggleTask, deleteTask } = useStore()
  const [selMember, setSelMember] = useState<MemberId|'alle'>('alle')
  const [selCat, setSelCat] = useState<TaskCat|'alle'>('alle')
  const [showAdd, setShowAdd] = useState(false)

  // Auto-slett fullførte oppgaver etter 3 sekunder
  useEffect(() => {
    const doneTasks = tasks.filter(t => t.done)
    if (doneTasks.length === 0) return
    const timer = setTimeout(() => {
      doneTasks.forEach(t => deleteTask(t.id))
    }, 3000)
    return () => clearTimeout(timer)
  }, [tasks])

  const filtered = useMemo(() => tasks.filter(t =>
    (selMember === 'alle' || t.assignedTo.includes(selMember)) &&
    (selCat === 'alle' || t.category === selCat)
  ), [tasks, selMember, selCat])

  const pending = filtered.filter(t => !t.done)
  const done    = filtered.filter(t =>  t.done)

  const stats = useMemo(() => {
    const total = tasks.length, comp = tasks.filter(t => t.done).length
    return { total, comp, pct: total > 0 ? Math.round(comp/total*100) : 0 }
  }, [tasks])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflowY:'auto' }}>
      {/* Header */}
      <div style={{ padding:'20px 20px 14px', flexShrink:0 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:900, color:'var(--navy)', letterSpacing:-1, marginBottom:14 }}>Oppgaver</div>

        {/* Progress */}
        <div className="card" style={{ padding:'12px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Ukens fremgang</span>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--navy)' }}>{stats.comp}/{stats.total} fullført</span>
          </div>
          <div style={{ height:6, background:'var(--border-light)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${stats.pct}%`, background:'var(--success)', borderRadius:3, transition:'width 0.4s' }} />
          </div>
        </div>
      </div>

      {/* Member filter */}
      <div className="pill-scroll" style={{ paddingBottom:8 }}>
        <div className={`chip ${selMember==='alle'?'active':''}`} onClick={() => setSelMember('alle')}>Alle</div>
        {MEMBERS.map(m => (
          <div key={m.id} onClick={() => setSelMember(selMember===m.id?'alle':m.id)}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer', flexShrink:0 }}>
            <div className={`avatar ${selMember===m.id?'selected':''}`} style={{ background:m.color }}>{m.initials}</div>
            <span style={{ fontSize:10, fontWeight:600, color: selMember===m.id ? 'var(--navy)':'var(--text-muted)' }}>{m.name}</span>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="pill-scroll" style={{ marginBottom:4 }}>
        {CATS.map(c => (
          <div key={c.key} className={`chip ${selCat===c.key?'active':''}`} onClick={() => setSelCat(c.key as any)}>
            {c.icon} {c.label}
          </div>
        ))}
      </div>

      {/* Task lists */}
      <div style={{ flex:1, padding:'0 20px' }}>
        {pending.length > 0 && (
          <>
            <div className="section-label">Gjenstående ({pending.length})</div>
            {pending.map((t, i) => {
              const m = MEMBER_MAP[t.assignedTo[0] as MemberId]
              return (
                <div key={t.id} className="card fade-in-up" style={{ display:'flex', marginBottom:10, animationDelay:`${i*0.04}s` }}>
                  <div style={{ width:4, background:PRIORITY_COLORS[t.priority], flexShrink:0 }} />
                  <div style={{ display:'flex', alignItems:'center', flex:1, padding:'12px 14px', gap:12 }}
                    onClick={() => toggleTask(t.id)}>
                    <div className={`checkbox ${t.done?'done':''}`} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:500, color:'var(--text-primary)', lineHeight:1.3 }}>{t.title}</div>
                      {t.dueDate && <div style={{ fontSize:12, color:'var(--coral)', marginTop:2 }}>Frist: {t.dueDate}</div>}
                    </div>
                    <div style={{ display:'flex', gap:-4 }}>
                      {t.assignedTo.slice(0,2).map(id => {
                        const mem = MEMBER_MAP[id as MemberId]
                        return mem ? <div key={id} style={{ width:28, height:28, borderRadius:14, background:mem.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', marginLeft:-4 }}>{mem.initials}</div> : null
                      })}
                    </div>
                  </div>
                  {/* Slett-knapp */}
                  <div onClick={() => deleteTask(t.id)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', width:44, borderLeft:'1px solid var(--border-light)', cursor:'pointer', color:'var(--text-muted)', fontSize:18, flexShrink:0 }}>
                    🗑️
                  </div>
                </div>
              )
            })}
          </>
        )}

        {done.length > 0 && (
          <>
            <div className="section-label">Fullført — slettes om 3 sek ({done.length})</div>
            {done.map(t => (
              <div key={t.id} className="card" style={{ display:'flex', marginBottom:10, opacity:0.65 }}>
                <div style={{ width:4, background:'var(--success)', flexShrink:0 }} />
                <div style={{ display:'flex', alignItems:'center', flex:1, padding:'12px 14px', gap:12 }}
                  onClick={() => toggleTask(t.id)}>
                  <div className="checkbox done" />
                  <span style={{ fontSize:15, color:'var(--text-muted)', textDecoration:'line-through', flex:1 }}>{t.title}</span>
                </div>
                <div onClick={() => deleteTask(t.id)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', width:44, borderLeft:'1px solid var(--border-light)', cursor:'pointer', color:'var(--text-muted)', fontSize:18, flexShrink:0 }}>
                  🗑️
                </div>
              </div>
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
            <div style={{ fontSize:15, fontWeight:600 }}>Ingen oppgaver her</div>
          </div>
        )}

        <button className="btn-ghost" onClick={() => setShowAdd(true)}>+ Ny oppgave</button>
        <div style={{ height:24 }} />
      </div>

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}