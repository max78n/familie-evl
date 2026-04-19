// src/screens/FoodScreen.tsx
import React, { useState, useMemo } from 'react'
import { format, addDays, isToday } from 'date-fns'
import { nb } from 'date-fns/locale'
import { useStore } from '@/store'
import { MEAL_ICONS, MEAL_LABELS, SHOP_CATEGORIES } from '@/utils/members'
import type { MealType } from '@/types'

const MEAL_ORDER: MealType[] = ['frokost','lunsj','middag','mellommåltid']

export default function FoodScreen() {
  const { meals, shopping, addMeal, addShoppingItem, toggleShoppingItem, clearBought } = useStore()
  const [tab, setTab] = useState<'måltid'|'handel'>('måltid')
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [showAddShop, setShowAddShop] = useState(false)

  // Meal state
  const [mealName, setMealName] = useState('')
  const [mealType, setMealType] = useState<MealType>('middag')
  const [mealDate, setMealDate] = useState(format(new Date(),'yyyy-MM-dd'))

  // Shop state
  const [shopName, setShopName] = useState('')
  const [shopCat, setShopCat] = useState('Annet')
  const [shopQty, setShopQty] = useState('')

  const weekDays = useMemo(() => Array.from({length:7},(_,i) => addDays(new Date(),i)), [])
  const mealsByDate = useMemo(() => {
    const m: Record<string,typeof meals> = {}
    for (const meal of meals) { if (!m[meal.date]) m[meal.date]=[]; m[meal.date].push(meal) }
    return m
  }, [meals])

  const shopByCat = useMemo(() => {
    const m: Record<string, typeof shopping> = {}
    for (const i of shopping) { if (!m[i.category]) m[i.category]=[]; m[i.category].push(i) }
    return m
  }, [shopping])

  const boughtCount = shopping.filter(i=>i.done).length

  const saveMeal = () => {
    if (!mealName.trim()) return
    addMeal({ date:mealDate, type:mealType, name:mealName.trim() })
    setMealName(''); setShowAddMeal(false)
  }

  const saveShop = () => {
    if (!shopName.trim()) return
    addShoppingItem({ name:shopName.trim(), category:shopCat, quantity:shopQty||undefined, done:false })
    setShopName(''); setShopQty(''); setShowAddShop(false)
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflowY:'auto' }}>
      {/* Header */}
      <div style={{ padding:'20px 20px 14px', flexShrink:0 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:900, color:'var(--navy)', letterSpacing:-1, marginBottom:14 }}>Mat & Handel</div>

        {/* Tab switcher */}
        <div style={{ display:'flex', background:'var(--surface)', borderRadius:'var(--radius-md)', padding:3, boxShadow:'var(--shadow-sm)' }}>
          {(['måltid','handel'] as const).map(t => (
            <div key={t} onClick={() => setTab(t)}
              style={{ flex:1, textAlign:'center', padding:'9px 8px', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:14, fontWeight:600, background: tab===t?'var(--navy)':'transparent', color: tab===t?'#fff':'var(--text-secondary)', transition:'all 0.15s' }}>
              {t === 'måltid' ? '🍽️ Måltidsplan' : `🛒 Handleliste${boughtCount>0?` (${boughtCount}/${shopping.length})`:` (${shopping.length})`}`}
            </div>
          ))}
        </div>
      </div>

      {/* ── MEAL PLAN ── */}
      {tab === 'måltid' && (
        <div style={{ flex:1, padding:'0 20px' }}>
          {weekDays.map(day => {
            const ds = format(day,'yyyy-MM-dd')
            const dayMeals = (mealsByDate[ds]||[]).sort((a,b) => MEAL_ORDER.indexOf(a.type)-MEAL_ORDER.indexOf(b.type))
            const label = isToday(day) ? 'I dag' : format(day,'EEEE d. MMM',{locale:nb})
            return (
              <div key={ds} className="card fade-in-up" style={{ marginBottom:12, overflow:'visible' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 14px 10px', borderBottom:'1px solid var(--border-light)' }}>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--navy)', textTransform:'capitalize', flex:1 }}>{label}</span>
                  {isToday(day) && <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:'var(--radius-full)', background:'var(--amber-light)', color:'var(--amber-dark)' }}>I dag</span>}
                </div>
                {MEAL_ORDER.map(mt => {
                  const meal = dayMeals.find(m => m.type === mt)
                  return (
                    <div key={mt} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', borderBottom:'1px solid var(--border-light)' }}>
                      <span style={{ fontSize:15, width:22, textAlign:'center' }}>{MEAL_ICONS[mt]}</span>
                      <span style={{ fontSize:13, color:'var(--text-muted)', width:88, flexShrink:0 }}>{MEAL_LABELS[mt]}</span>
                      {meal ? (
                        <div style={{ flex:1 }}>
                          <span style={{ fontSize:14, fontWeight:500, color:'var(--text-primary)' }}>{meal.name}</span>
                          {meal.notes && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>{meal.notes}</div>}
                        </div>
                      ) : (
                        <span style={{ fontSize:13, color:'var(--border)', flex:1 }}>—</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
          <button className="btn-ghost" onClick={() => setShowAddMeal(true)}>+ Legg til måltid</button>
          <div style={{ height:24 }} />
        </div>
      )}

      {/* ── SHOPPING ── */}
      {tab === 'handel' && (
        <div style={{ flex:1, padding:'0 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{shopping.length-boughtCount} varer gjenstår</span>
            {boughtCount > 0 && (
              <button onClick={clearBought} style={{ fontSize:13, fontWeight:600, color:'var(--coral)', background:'none', border:'none', cursor:'pointer', padding:'4px 8px' }}>
                Fjern kjøpte
              </button>
            )}
          </div>

          {Object.entries(shopByCat).map(([cat, items]) => (
            <div key={cat}>
              <div className="section-label">{cat}</div>
              <div className="card" style={{ marginBottom:8 }}>
                {items.map((item, idx) => (
                  <div key={item.id} onClick={() => toggleShoppingItem(item.id)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderBottom: idx<items.length-1?'1px solid var(--border-light)':'none', cursor:'pointer' }}>
                    <div className={`sq-check ${item.done?'done':''}`} />
                    <span style={{ flex:1, fontSize:15, color: item.done?'var(--text-muted)':'var(--text-primary)', textDecoration: item.done?'line-through':'none' }}>{item.name}</span>
                    {item.quantity && <span style={{ fontSize:13, color:'var(--text-muted)' }}>{item.quantity}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {shopping.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🛒</div>
              <div style={{ fontSize:15, fontWeight:600 }}>Handlelisten er tom</div>
            </div>
          )}

          <button className="btn-ghost" onClick={() => setShowAddShop(true)}>+ Legg til vare</button>
          <div style={{ height:24 }} />
        </div>
      )}

      {/* ── ADD MEAL MODAL ── */}
      {showAddMeal && (
        <div className="modal-overlay" onClick={() => setShowAddMeal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-cancel" onClick={() => setShowAddMeal(false)}>Avbryt</span>
              <span className="modal-title">Nytt måltid</span>
              <span className="modal-save" onClick={saveMeal}>Lagre</span>
            </div>
            <div className="modal-body">
              <div className="field-label">Navn</div>
              <input className="field-input" placeholder="F.eks. Kyllingsuppe" value={mealName} onChange={e=>setMealName(e.target.value)} autoFocus />
              <div className="field-label">Type</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {MEAL_ORDER.map(mt => (
                  <div key={mt} className={`chip ${mealType===mt?'active':''}`} onClick={() => setMealType(mt)}>
                    {MEAL_ICONS[mt]} {MEAL_LABELS[mt]}
                  </div>
                ))}
              </div>
              <div className="field-label">Dato</div>
              <input type="date" className="field-input" value={mealDate} onChange={e=>setMealDate(e.target.value)} />
              <div style={{ height:16 }} />
            </div>
          </div>
        </div>
      )}

      {/* ── ADD SHOP MODAL ── */}
      {showAddShop && (
        <div className="modal-overlay" onClick={() => setShowAddShop(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-cancel" onClick={() => setShowAddShop(false)}>Avbryt</span>
              <span className="modal-title">Ny vare</span>
              <span className="modal-save" onClick={saveShop}>Legg til</span>
            </div>
            <div className="modal-body">
              <div className="field-label">Varenavn</div>
              <input className="field-input" placeholder="F.eks. Melk 1.5l" value={shopName} onChange={e=>setShopName(e.target.value)} autoFocus />
              <div className="field-label">Mengde (valgfri)</div>
              <input className="field-input" placeholder="F.eks. 2 stk" value={shopQty} onChange={e=>setShopQty(e.target.value)} />
              <div className="field-label">Kategori</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {SHOP_CATEGORIES.map(c => (
                  <div key={c} className={`chip ${shopCat===c?'active':''}`} onClick={() => setShopCat(c)}>{c}</div>
                ))}
              </div>
              <div style={{ height:16 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
