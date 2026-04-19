// src/components/AddTaskModal.tsx
import React, { useState } from 'react'
import { useStore } from '@/store'
import { MEMBERS } from '@/utils/members'
import type { MemberId, TaskCat, Priority } from '@/types'

export default function AddTaskModal({ onClose }: { onClose: () => void }) {
  const { addTask } = useStore()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<TaskCat>('husarbeid')
  const [priority, setPriority] = useState<Priority>('middels')
  const [assignedTo, setAssignedTo] = useState<MemberId[]>(['juni'])
  const [dueDate, setDueDate] = useState('')

  const toggleMember = (id: MemberId) =>
    setAssignedTo(ids => ids.includes(id) ? ids.filter(i=>i!==id) : [...ids, id])

  const save = () => {
    if (!title.trim() || assignedTo.length === 0) return
    addTask({ title: title.trim(), category, priority, assignedTo, dueDate: dueDate||undefined, done: false })
    onClose()
  }

  const PRIO_COLORS: Record<Priority, string> = { høy:'#E8705A', middels:'#E8C547', lav:'#4CAF7C' }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-cancel" onClick={onClose}>Avbryt</span>
          <span className="modal-title">Ny oppgave</span>
          <span className="modal-save" onClick={save}>Lagre</span>
        </div>
        <div className="modal-body">
          <div className="field-label">Oppgave</div>
          <input className="field-input" placeholder="Hva skal gjøres?" value={title} onChange={e=>setTitle(e.target.value)} autoFocus />

          <div className="field-label">Kategori</div>
          <div style={{ display:'flex', gap:8 }}>
            {(['husarbeid','skole','annet'] as TaskCat[]).map(c => (
              <div key={c} className={`chip ${category===c?'active':''}`} onClick={() => setCategory(c)}>
                {c==='husarbeid'?'🏠':c==='skole'?'🎒':'📌'} {c.charAt(0).toUpperCase()+c.slice(1)}
              </div>
            ))}
          </div>

          <div className="field-label">Prioritet</div>
          <div style={{ display:'flex', gap:8 }}>
            {(['lav','middels','høy'] as Priority[]).map(p => (
              <div key={p} onClick={() => setPriority(p)}
                style={{ padding:'6px 14px', borderRadius:'var(--radius-full)', border:'1.5px solid', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.15s',
                  borderColor: priority===p ? PRIO_COLORS[p] : 'var(--border)',
                  background: priority===p ? PRIO_COLORS[p] : 'var(--surface)',
                  color: priority===p ? '#fff' : 'var(--text-secondary)'
                }}>
                {p.charAt(0).toUpperCase()+p.slice(1)}
              </div>
            ))}
          </div>

          <div className="field-label">Tildel til</div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', paddingBottom:4 }}>
            {MEMBERS.map(m => (
              <div key={m.id} onClick={() => toggleMember(m.id as MemberId)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer' }}>
                <div className={`avatar ${assignedTo.includes(m.id as MemberId)?'selected':''}`} style={{ background:m.color }}>{m.initials}</div>
                <span style={{ fontSize:10, fontWeight:600, color: assignedTo.includes(m.id as MemberId)?'var(--navy)':'var(--text-muted)' }}>{m.name}</span>
              </div>
            ))}
          </div>

          <div className="field-label">Frist (valgfri)</div>
          <input type="date" className="field-input" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
          <div style={{ height:16 }} />
        </div>
      </div>
    </div>
  )
}
