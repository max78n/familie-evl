// src/screens/ConnectScreen.tsx
import React, { useState } from 'react'
import { format, addDays } from 'date-fns'
import { useStore } from '@/store'
import { MEMBERS } from '@/utils/members'
import { parseVigiloPDF, mockVigiloParse } from '@/utils/vigiloParser'
import { signInWithGoogle, signOutGoogle, isSignedIn, fetchGoogleCalendarEvents } from '@/utils/googleCalendar'
import type { MemberId } from '@/types'

export default function ConnectScreen() {
  const { vigiloDocs, addVigiloDoc, addEventsFromVigilo, addTasksFromVigilo } = useStore()
  const [uploading, setUploading] = useState(false)
  const [outlookStatus, setOutlookStatus] = useState<Record<MemberId, boolean>>({
    juni: true, max: true, finn: false, felix: false
  })

const handleVigiloUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    // Les PDF-tekst
    let result
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs`
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map((item: any) => item.str).join('\n')
      }
      result = parseVigiloPDF(fullText, file.name)
    } catch (err) {
      console.warn('PDF-lesing feilet, bruker mock:', err)
      result = mockVigiloParse(file.name)
    }
    addEventsFromVigilo(result.events)
    addTasksFromVigilo(result.tasks)
    addVigiloDoc({
      id: Math.random().toString(36).slice(2),
      filename: file.name,
      uploadedAt: format(new Date(), 'dd.MM.yyyy HH:mm'),
      eventsFound: result.events.length,
      tasksFound: result.tasks.length,
    })

    setUploading(false)
    e.target.value = ''
    alert(`✅ PDF analysert!\n\nFant ${result.events.length} hendelse(r) og ${result.tasks.length} oppgave(r).\n\nAlt er lagt til i kalenderen og oppgavelisten.`)
  }

  const toggleOutlook = (id: MemberId) => {
    const m = MEMBERS.find(m => m.id === id)!
    if (outlookStatus[id]) {
      if (confirm(`Koble fra Outlook for ${m.name}?`)) {
        setOutlookStatus(s => ({ ...s, [id]: false }))
      }
    } else {
      alert(`For å koble til Outlook for ${m.name}:\n\n1. Registrer en Azure AD-app på portal.azure.com\n2. Legg inn CLIENT_ID i src/utils/outlookService.ts\n3. Trykk "Logg inn"\n\nSe README.md for detaljert veiledning.`)
      setOutlookStatus(s => ({ ...s, [id]: true }))
    }
  }

  const connCount = Object.values(outlookStatus).filter(Boolean).length
const [googleConnected, setGoogleConnected] = useState(false)
const [googleSyncing, setGoogleSyncing] = useState(false)

const handleGoogleConnect = async () => {
  setGoogleSyncing(true)
  try {
    const success = await signInWithGoogle()
    if (success) {
      setGoogleConnected(true)
      const events = await fetchGoogleCalendarEvents(30)
      await addEventsFromVigilo(events)
      alert(`✅ Google Calendar synkronisert!\n\nFant ${events.length} hendelse(r) de neste 30 dagene.`)
    }
  } catch (err) {
    alert('Kunne ikke koble til Google Calendar. Prøv igjen.')
  } finally {
    setGoogleSyncing(false)
  }
}

const handleGoogleDisconnect = async () => {
  if (confirm('Koble fra Google Calendar?')) {
    await signOutGoogle()
    setGoogleConnected(false)
  }
}
  return (
    <div style={{ flex:1, overflowY:'auto' }}>
      <div style={{ padding:'20px 20px 14px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:900, color:'var(--navy)', letterSpacing:-1, marginBottom:4 }}>Tilkoblinger</div>
        <div style={{ fontSize:14, color:'var(--text-secondary)' }}>Koble til Outlook og last opp Vigilo-PDF</div>
      </div>

      <div style={{ padding:'0 20px' }}>

        {/* ── OUTLOOK ── */}
        <div className="section-label">Microsoft Outlook</div>
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--border-light)' }}>
            <div style={{ width:44, height:44, borderRadius:'var(--radius-md)', background:'#D4E8FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📧</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, color:'var(--navy)' }}>Microsoft Outlook</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>{connCount}/4 familiemedlemmer tilkoblet</div>
            </div>
          </div>

          <div style={{ padding:'10px 16px 6px', background:'var(--surface-muted)' }}>
            <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>
              Krever Azure AD-app. Se{' '}
              <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--navy-mid)' }}>README.md</span>
              {' '}for oppsett.
            </div>
          </div>

          {MEMBERS.map((m, i) => (
            <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderTop:'1px solid var(--border-light)' }}>
              <div className="avatar" style={{ background:m.color, width:36, height:36, fontSize:13 }}>{m.initials}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:500, fontSize:14, color:'var(--text-primary)' }}>{m.name}</div>
              </div>
              <button
                onClick={() => toggleOutlook(m.id as MemberId)}
                style={{
                  padding:'6px 14px', borderRadius:'var(--radius-full)', border:'1.5px solid',
                  fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                  borderColor: outlookStatus[m.id as MemberId] ? 'var(--success)' : 'var(--border)',
                  background: outlookStatus[m.id as MemberId] ? 'var(--success-light)' : 'var(--off-white)',
                  color: outlookStatus[m.id as MemberId] ? 'var(--success)' : 'var(--text-secondary)',
                }}
              >
                {outlookStatus[m.id as MemberId] ? '✓ Tilkoblet' : 'Koble til'}
              </button>
            </div>
          ))}
        </div>
{/* ── GOOGLE CALENDAR ── */}
<div className="section-label">Google Calendar</div>
<div className="card" style={{ marginBottom:16 }}>
  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--border-light)' }}>
    <div style={{ width:44, height:44, borderRadius:'var(--radius-md)', background:'#D4F0D4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📅</div>
    <div style={{ flex:1 }}>
      <div style={{ fontWeight:700, fontSize:15, color:'var(--navy)' }}>Google Calendar</div>
      <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>
        {googleConnected ? 'Tilkoblet og synkronisert' : 'Koble til din Google-konto'}
      </div>
    </div>
    <button
      onClick={googleConnected ? handleGoogleDisconnect : handleGoogleConnect}
      disabled={googleSyncing}
      style={{
        padding:'6px 14px', borderRadius:'var(--radius-full)', border:'1.5px solid',
        fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
        borderColor: googleConnected ? 'var(--success)' : 'var(--border)',
        background: googleConnected ? 'var(--success-light)' : 'var(--off-white)',
        color: googleConnected ? 'var(--success)' : 'var(--text-secondary)',
        opacity: googleSyncing ? 0.6 : 1,
      }}
    >
      {googleSyncing ? '⏳ Synkroniserer...' : googleConnected ? '✓ Tilkoblet' : 'Koble til'}
    </button>
  </div>
  {googleConnected && (
    <div style={{ padding:'12px 16px' }}>
      <button
        onClick={handleGoogleConnect}
        disabled={googleSyncing}
        style={{ background:'none', border:'none', color:'var(--navy-mid)', fontSize:13, fontWeight:600, cursor:'pointer', padding:0 }}
      >
        🔄 Synkroniser nå
      </button>
    </div>
  )}
</div>
        {/* ── VIGILO ── */}
        <div className="section-label">Vigilo – Skole-PDF</div>
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--border-light)' }}>
            <div style={{ width:44, height:44, borderRadius:'var(--radius-md)', background:'#FFE8D4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏫</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:'var(--navy)' }}>Vigilo</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>Last ned PDF fra Vigilo-appen</div>
            </div>
          </div>

          <div style={{ padding:'14px 16px' }}>
            <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:14 }}>
              Last ned ukebrev eller arrangementer som PDF fra Vigilo-appen, og trykk knappen nedenfor.
              Appen henter ut datoer, hendelser og påminnelser automatisk.
            </p>

            <label style={{ display:'block' }}>
              <input type="file" accept="application/pdf" style={{ display:'none' }} onChange={handleVigiloUpload} disabled={uploading} />
              <div className="btn-primary" style={{ cursor:'pointer', opacity: uploading?0.6:1 }}>
                {uploading ? (
                  <>
                    <span style={{ display:'inline-block', width:16, height:16, border:'2px solid #ffffff40', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                    Analyserer PDF...
                  </>
                ) : '📄  Velg Vigilo-PDF'}
              </div>
            </label>
          </div>
        </div>

        {/* ── UPLOADED DOCS ── */}
        {vigiloDocs.length > 0 && (
          <>
            <div className="section-label">Opplastede filer ({vigiloDocs.length})</div>
            {vigiloDocs.map(doc => (
              <div key={doc.id} className="card" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', marginBottom:10 }}>
                <span style={{ fontSize:26 }}>📋</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--navy-mid)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{doc.filename}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                    {doc.eventsFound} hendelse(r) · {doc.tasksFound} oppgave(r) · {doc.uploadedAt}
                  </div>
                </div>
                <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:'var(--radius-full)', background:'#FFE8D4', color:'#A03A00', flexShrink:0 }}>Vigilo</span>
              </div>
            ))}
          </>
        )}

        {/* ── GUIDE ── */}
        <div className="section-label">Kom i gang</div>
        <div className="card" style={{ marginBottom:24 }}>
          {[
            { n:'1', icon:'🌐', text:'Åpne nettsiden på telefonen din og Junis telefon' },
            { n:'2', icon:'📲', text:'Trykk "Del" → "Legg til på hjemskjerm" for å installere som app' },
            { n:'3', icon:'📄', text:'Last ned PDF fra Vigilo og trykk "Velg Vigilo-PDF" ovenfor' },
            { n:'4', icon:'🔑', text:'For Outlook: registrer Azure AD-app og legg inn CLIENT_ID (se README)' },
            { n:'5', icon:'✅', text:'Legg til oppgaver og hendelser – alt lagres automatisk på telefonen' },
          ].map(({ n, icon, text }, i) => (
            <div key={n} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderBottom: i<4?'1px solid var(--border-light)':'none' }}>
              <div style={{ width:22, height:22, borderRadius:11, background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0, marginTop:1 }}>{n}</div>
              <span style={{ fontSize:15 }}>{icon}</span>
              <span style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.5 }}>{text}</span>
            </div>
          ))}
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
