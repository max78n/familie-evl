// src/components/AddEventModal.tsx
import React, { useState } from 'react'
import { format } from 'date-fns'
import { useStore } from '@/store'
import { MEMBERS } from '@/utils/members'
import type { MemberId, EventSource } from '@/types'

export default function AddEventModal({ onClose }: { onClose: () => void }) {
  const { addEvent, selectedDate } = useStore()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(selectedDate)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [source, setSource] = useState<EventSource>('manuell')
  const [memberIds, setMemberIds] = useState<MemberId[]>(['juni', 'max'])

  const toggleMember = (id: MemberId) =>
    setMemberIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])

  const save = () => {
    if (!title.trim()) return
    addEvent({ title: title.trim(), date, startTime: startTime||undefined, endTime: endTime||undefined, location: location||undefined, memberIds, source })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-cancel" onClick={onClose}>Avbryt</span>
          <span className="modal-title">Ny hendelse</span>
          <span className="modal-save" onClick={save}>Lagre</span>
        </div>
        <div className="modal-body">
          <div className="field-label">Tittel</div>
          <input className="field-input" placeholder="Hva skjer?" value={title} onChange={e=>setTitle(e.target.value)} autoFocus />

          <div className="field-label">Dato</div>
          <input type="date" className="field-input" value={date} onChange={e=>setDate(e.target.value)} />

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div className="field-label">Fra</div>
              <input type="time" className="field-input" value={startTime} onChange={e=>setStartTime(e.target.value)} />
            </div>
            <div>
              <div className="field-label">Til</div>
              <input type="time" className="field-input" value={endTime} onChange={e=>setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="field-label">Sted (valgfri)</div>
          <input className="field-input" placeholder="F.eks. Idrettshallen" value={location} onChange={e=>setLocation(e.target.value)} />

          <div className="field-label">Hvem er med?</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', paddingBottom:4 }}>
            {MEMBERS.map(m => (
              <div key={m.id} onClick={() => toggleMember(m.id as MemberId)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer' }}>
                <div className={`avatar ${memberIds.includes(m.id as MemberId)?'selected':''}`} style={{ background:m.color }}>{m.initials}</div>
                <span style={{ fontSize:10, fontWeight:600, color: memberIds.includes(m.id as MemberId)?'var(--navy)':'var(--text-muted)' }}>{m.name}</span>
              </div>
            ))}
          </div>

          <div className="field-label">Kilde</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {(['manuell','outlook','vigilo'] as EventSource[]).map(s => (
              <div key={s} className={`chip ${source===s?'active':''}`} onClick={() => setSource(s)}>
                {s === 'manuell' ? '✏️ Manuell' : s === 'outlook' ? '📧 Outlook' : '🏫 Vigilo'}
              </div>
            ))}
          </div>
          <div style={{ height:16 }} />
        </div>
      </div>
    </div>
  )
}
