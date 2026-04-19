import React, { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isToday, addMonths, subMonths, parseISO } from 'date-fns'
import { nb } from 'date-fns/locale'
import { useStore } from '@/store'
import { MEMBER_MAP, SOURCE_COLORS, SOURCE_LABELS } from '@/utils/members'
import type { CalEvent, MemberId } from '@/types'
import AddEventModal from '@/components/AddEventModal'

const DAYS = ['Ma','Ti','On','To','Fr','Lø','Sø']

export default function CalendarScreen() {
  const { events, selectedDate, setSelectedDate } = useStore()
  const [viewMonth, setViewMonth] = useState(new Date())
  const [showAdd, setShowAdd] = useState(false)

  const calDays = useMemo(() => {
    const start = startOfMonth(viewMonth)
    const end = endOfMonth(viewMonth)
    const days = eachDayOfInterval({ start, end })
    const pad = (getDay(start) + 6) % 7
    return [...Array(pad).fill(null), ...days]
  }, [viewMonth])

  const byDate = useMemo(() => {
    const m: Record<string, CalEvent[]> = {}
    for (const e of events) { if (!m[e.date]) m[e.date]=[]; m[e.date].push(e) }
    return m
  }, [events])

  const selEvents = useMemo(() =>
    (byDate[selectedDate] || []).sort((a, b) => (a.startTime||'99').localeCompare(b.startTime||'99')),
    [byDate, selectedDate]
  )

  const selLabel = useMemo(() => {
    const d = parseISO(selectedDate)
    if (isToday(d)) return 'I dag'
    return format(d, 'd. MMMM', { locale: nb })
  }, [selectedDate])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflowY:'auto' }}>
      <div style={{ padding:'20px 20px 0', background:'var(--off-white)', flexShrink:0 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>Familiekalender</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:900, color:'var(--navy)', letterSpacing:-1, lineHeight:1 }}>Familie E-V-L</div>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 8px' }}>
        <button onClick={() => setViewMonth(m => subMonths(m,1))} style={{ width:36, height:36, borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--surface)', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--navy)' }}>‹</button>
        <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--navy)', textTransform:'capitalize' }}>
          {format(viewMonth, 'MMMM yyyy', { locale: nb })}
        </span>
        <button onClick={() => setViewMonth(m => addMonths(m,1))} style={{ width:36, height:36, borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--surface)', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--navy)' }}>›</button>
      </div>

      <div className="card" style={{ margin:'0 20px', borderRadius:'var(--radius-lg)' }}>
        <div style={{ display:'flex', flexWrap:'wrap' as const, padding:'8px 4px 4px' }}>
          {DAYS.map(d => (
            <div key={d} style={{ width:'14.28%', textAlign:'center', fontSize:11, fontWeight:700, color:'var(--text-muted)', paddingBottom:4 }}>{d}</div>
          ))}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap' as const, padding:'0 4px 8px' }}>
          {calDays.map((day, i) => {
            if (!day) return <div key={`p${i}`} style={{ width:'14.28%', aspectRatio:'0.85' }} />
            const ds = format(day, 'yyyy-MM-dd')
            const evs = byDate[ds] || []
            const isSel = ds === selectedDate
            const isTod = isToday(day)
            const memberColors = Array.from(new Set(evs.flatMap(e => e.memberIds))).slice(0,3).map(id => MEMBER_MAP[id as MemberId]?.color)
            return (
              <div key={ds} onClick={() => setSelectedDate(ds)}
                style={{
                  width:'14.28%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  aspectRatio:'0.85', borderRadius:8, cursor:'pointer', touchAction:'manipulation' as const,
                  background: isSel ? 'var(--navy)' : isTod ? 'var(--amber-light)' : 'transparent',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                <span style={{ fontSize:13, fontWeight: isSel||isTod ? 700 : 400, color: isSel ? '#fff' : isTod ? 'var(--navy)' : 'var(--text-primary)', lineHeight:1.2 }}>
                  {format(day,'d')}
                </span>
                {evs.length > 0 && (
                  <div style={{ display:'flex', gap:2, marginTop:2 }}>
                    {memberColors.map((c,ci) => (
                      <div key={ci} style={{ width:4, height:4, borderRadius:2, background: isSel ? '#ffffff80' : c }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'center', gap:16, padding:'10px 20px 4px' }}>
        {Object.values(MEMBER_MAP).map(m => (
          <div key={m.id} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:4, background:m.color }} />
            <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{m.name}</span>
          </div>
        ))}
      </div>

      <div style={{ padding:'4px 20px 0', flex:1 }}>
        <div className="section-label">{selLabel}</div>
        {selEvents.length === 0 ? (
          <div style={{ textAlign:'center', padding:'28px 0', color:'var(--text-muted)', fontSize:14 }}>Ingen hendelser denne dagen</div>
        ) : (
          selEvents.map((ev, i) => {
            const src = SOURCE_COLORS[ev.source]
            const stripeColor = ev.memberIds[0] ? MEMBER_MAP[ev.memberIds[0] as MemberId]?.color : 'var(--navy)'
            return (
              <div key={ev.id} className="card fade-in-up" style={{ display:'flex', marginBottom:10, animationDelay:`${i*0.05}s` }}>
                <div style={{ width:4, background:stripeColor, flexShrink:0 }} />
                <div style={{ flex:1, padding:'12px 12px 10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ flex:1, fontWeight:600, fontSize:15, color:'var(--text-primary)' }}>{ev.title}</span>
                    <span className="source-badge" style={{ background:src.bg, color:src.text }}>{SOURCE_LABELS[ev.source]}</span>
                  </div>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    {(ev.startTime || ev.allDay) && (
                      <span style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>
                        {ev.allDay ? 'Hele dagen' : ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                      </span>
                    )}
                    {ev.location && <span style={{ fontSize:13, color:'var(--text-muted)' }}>📍 {ev.location}</span>}
                  </div>
                  {ev.memberIds.length > 0 && (
                    <div style={{ display:'flex', gap:4, marginTop:8 }}>
                      {ev.memberIds.map(id => {
                        const m = MEMBER_MAP[id as MemberId]
                        return m ? (
                          <div key={id} style={{ width:24, height:24, borderRadius:12, background:m.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff' }}>{m.initials}</div>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}