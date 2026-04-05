import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDashboard, getLicenses, getExpiring,
  getVendors, getDepartments, getEmployees,
  createLicense, updateLicense, deleteLicense
} from './services/api'
import './index.css'

// Font injection
const fontStyle = document.createElement('link')
fontStyle.rel = 'stylesheet'
fontStyle.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Amiri:wght@400;700&display=swap'
document.head.appendChild(fontStyle)


/* ─── TOKENS ────────────────────────────────────────────────── */
const C = {
  ink:      '#1A3A2A',
  ink2:     '#254D38',
  ink3:     '#2F6045',
  muted:    '#6B7280',
  subtle:   '#9CA3AF',
  border:   '#D6CCBE',
  borderL:  '#EDE7DC',
  surface:  '#FAF6F0',
  surfaceL: '#F3EDE4',
  gold:     '#BA7517',
  goldL:    '#F5E6C8',
  goldD:    '#8A5710',
  green:    '#059669',
  greenL:   '#D1FAE5',
  red:      '#DC2626',
  redL:     '#FEE2E2',
  amber:    '#D97706',
  amberL:   '#FEF3C7',
  blue:     '#1D4ED8',
  blueL:    '#DBEAFE',
}

const font = `'Amiri', 'Scheherazade New', 'Times New Roman', serif`
const mono = `'Courier New', monospace`
const sans = `'Tajawal', 'Segoe UI', Tahoma, sans-serif`

/* ─── TRANSLATIONS ───────────────────────────────────────────── */
const T = {
  ar: {
    org: 'دارة الملك عبدالعزيز', sys: 'نظام إدارة الرخص',
    addlicense: 'إضافة رخصة', dashboard: 'لوحة التحكم',
    registry: 'سجل الرخص', alerts: 'التنبيهات',
    compliance: 'الامتثال', reports: 'التقارير والتصدير',
    stat1: 'إجمالي الرخص', stat2: 'تنتهي قريباً',
    stat3: 'التكاليف السنوية', stat4: 'نسبة الامتثال',
    renew: 'تجديد', edit: 'تعديل', delete: 'حذف',
    save: 'حفظ', cancel: 'إلغاء', loading: 'جارٍ التحميل...',
    sw: 'برامج', saas: 'سحابي', hw: 'أجهزة',
    active: 'سارية', expiring_soon: 'تنتهي قريباً',
    needs_renewal: 'تحتاج تجديد', expired: 'منتهية',
    days: 'يوم', search: 'بحث...',
    noData: 'لا توجد بيانات',
    Security: 'أمن', Software: 'برامج', Maintenance: 'صيانة',
    Cloud: 'سحابي', Domain: 'نطاقات', Service: 'خدمات',
  },
  en: {
    org: 'King Abdulaziz Foundation', sys: 'License Management System',
    addlicense: 'Add License', dashboard: 'Dashboard',
    registry: 'License Registry', alerts: 'Alerts',
    compliance: 'Compliance', reports: 'Reports & Export',
    stat1: 'Total Licenses', stat2: 'Expiring Soon',
    stat3: 'Annual Cost', stat4: 'Compliance Rate',
    renew: 'Renew', edit: 'Edit', delete: 'Delete',
    save: 'Save', cancel: 'Cancel', loading: 'Loading...',
    sw: 'Software', saas: 'Cloud', hw: 'Hardware',
    active: 'Active', expiring_soon: 'Expiring Soon',
    needs_renewal: 'Needs Renewal', expired: 'Expired',
    days: 'days', search: 'Search...',
    noData: 'No data available',
    Security: 'Security', Software: 'Software', Maintenance: 'Maintenance',
    Cloud: 'Cloud', Domain: 'Domain', Service: 'Service',
  }
}

/* ─── STATUS CONFIG ─────────────────────────────────────────── */
const STATUS = {
  active:        { label: { ar: 'سارية',        en: 'Active'        }, dot: C.green, bg: C.greenL, text: C.green },
  expiring_soon: { label: { ar: 'تنتهي قريباً', en: 'Expiring Soon' }, dot: C.red,   bg: C.redL,   text: C.red   },
  needs_renewal: { label: { ar: 'تجديد مطلوب', en: 'Needs Renewal' }, dot: C.amber, bg: C.amberL, text: C.amber },
  expired:       { label: { ar: 'منتهية',       en: 'Expired'       }, dot: C.red,   bg: C.redL,   text: C.red   },
}

function getStatus(d) {
  if (d < 0) return 'expired'
  if (d <= 30) return 'expiring_soon'
  if (d <= 90) return 'needs_renewal'
  return 'active'
}

/* ─── TINY COMPONENTS ───────────────────────────────────────── */
function StatusPill({ status, lang }) {
  const s = STATUS[status] || STATUS.active
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 2,
      background: s.bg, color: s.text,
      fontSize: 10, fontWeight: 600, fontFamily: sans, letterSpacing: .3,
      textTransform: 'uppercase'
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label[lang]}
    </span>
  )
}

function KpiCard({ label, value, sub, trend, accent, icon }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderTop: `3px solid ${accent || C.gold}`,
      padding: '20px 22px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
          <div style={{ fontSize: 32, fontFamily: font, fontWeight: 400, color: C.ink, lineHeight: 1, marginBottom: 4 }}>{value}</div>
          <div style={{ fontSize: 11, fontFamily: sans, color: C.subtle }}>{sub}</div>
        </div>
        <div style={{ opacity: .08, fontSize: 48 }}>{icon}</div>
      </div>
      {trend !== undefined && (
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.borderL}`,
          fontSize: 10, fontFamily: sans, fontWeight: 600,
          color: trend > 0 ? C.green : trend < 0 ? C.red : C.muted
        }}>
          {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {Math.abs(trend)}% vs last period
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, count, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 10 }}>
      <div style={{ width: 3, height: 16, background: C.gold, borderRadius: 1.5, flexShrink: 0 }} />
      <div style={{ fontSize: 11, fontFamily: sans, fontWeight: 700, letterSpacing: 1.2, color: C.ink, textTransform: 'uppercase' }}>{title}</div>
      {count !== undefined && (
        <div style={{ fontSize: 10, fontFamily: mono, color: C.muted, background: C.surfaceL, border: `1px solid ${C.border}`, padding: '1px 6px', borderRadius: 2 }}>{count}</div>
      )}
      <div style={{ flex: 1 }} />
      {action && <button onClick={onAction} style={{ fontSize: 10, fontFamily: sans, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: .5, textTransform: 'uppercase' }}>{action} →</button>}
    </div>
  )
}

/* ─── MINI BAR CHART ────────────────────────────────────────── */
function MiniBarChart({ data, lang }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 9, fontFamily: mono, color: C.muted }}>{d.value}</div>
          <div style={{ width: '100%', height: Math.max(4, (d.value / max) * 60), background: d.color || C.gold, borderRadius: '1px 1px 0 0', transition: 'height .4s ease' }} />
          <div style={{ fontSize: 8, fontFamily: sans, color: C.subtle, textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{d.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── RISK GAUGE ─────────────────────────────────────────────── */
function RiskGauge({ value }) {
  const pct = Math.min(100, Math.max(0, value))
  const color = pct >= 80 ? C.green : pct >= 50 ? C.amber : C.red
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (pct / 100) * circumference
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path d="M10 55 A40 40 0 0 1 90 55" fill="none" stroke={C.borderL} strokeWidth="8" strokeLinecap="round" />
        <path d="M10 55 A40 40 0 0 1 90 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 125.6} 125.6`} style={{ transition: 'stroke-dasharray .6s ease' }} />
        <text x="50" y="52" textAnchor="middle" fontFamily={font} fontSize="18" fill={C.ink} fontWeight="400">{pct}%</text>
      </svg>
      <div style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: 'uppercase' }}>Compliance Score</div>
    </div>
  )
}

const DarahLogo = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="280 95 440 210" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
    <path fill="#AD7300" d="M596.6,180.6c-34.7-5.1-67.8,7.7-97.5,24.7c-33.4-19.2-59.2-30.1-98-24.7c32.7-2,62.9,12.8,90.1,29.5 c-10.1,6.4-19.9,13.5-29.2,21.1c-0.7-1-5-4-6-4.6c-1.9-0.9-4.8-0.9-5.7-0.6c-1.5,0.6-3.2,2.1-2.6,3.5c1,1.8,4.2,1.5,5,2.1 c2.9,1.7,3.4,1.7,5.1,3.5c-0.2,0.3-12.2,9-12.3,9c-0.7,0-1.8-1.4-4.1-1.7c-6.6-0.8-12.2,3.7-6,9.7c2.6,2.4,11,2.8,18.9-1.7 c4.2-2.4,7.8-5.7,11.4-8.9c2.3,1.5,4.6,3.4,7.2,4.4c1.8,0.5,4.7,0.6,6.2,0c1.6-0.6,2.5-2.4,1.9-3.6c-0.6-1.3-3.4-0.9-4.5-0.9 c-1.5-0.1-4.8-2.6-6.2-3.6c5.5-4.9,22.8-19,28.9-22.4c9.2,6.3,18.8,13.7,28.6,22.4c-1.3,1-4.7,3.5-6.2,3.6c-1,0-4-0.4-4.5,0.9 c-0.4,1.2,0.4,3,2.1,3.6c1.5,0.6,4.2,0.5,6,0c2.5-0.8,5.3-3,7.3-4.4c3.8,3.3,6.9,6.2,11.3,8.9c7.9,4.5,16.3,4.1,18.9,1.7 c6.3-5.9,0.7-10.4-6-9.7c-2.3,0.3-3.2,1.7-4,1.7c-0.2,0-12.2-8.9-12.3-9c1.8-1.8,2.1-1.8,5.1-3.5c0.7-0.5,4-0.3,4.8-2.1 c0.7-1.4-1-2.8-2.6-3.5c-0.7-0.3-3.7-0.3-5.6,0.6c-1,0.6-5.4,3.6-6.2,4.6c-9.4-7.9-19-14.8-29.2-21.1 C533.8,193.5,564.2,178.6,596.6,180.6"/>
    <path fill="#AD7300" d="M373.6,438.7c-6.2,0-11.1,4.4-11.1,9.9c0,5.4,5,9.8,11.1,9.8c6.3,0,11.3-4.4,11.3-9.8 C384.9,443.1,379.9,438.7,373.6,438.7 M373.6,480.4c6.3,0,11.3-4.4,11.3-9.8c0-5.5-5-9.9-11.3-9.9c-6.2,0-11.1,4.4-11.1,9.9 C362.5,479.4,373.6,481,373.6,480.4 M309.1,434.7v63c4.2-7.3,11.6-12.1,22.4-14v-47.5c0-100,27.2-166.8,102.1-235.9 C340.5,256.2,310.2,330.3,309.1,434.7 M361.7,492.8v162.9h-28.4V538.8C333.3,510.7,331.7,492.8,361.7,492.8 M385,674.7V487.5 c-12.6,0-25.1,0.1-37.7,0.1c-35.8,1.8-38.1,18.3-38.1,51.1v136H385z M486.4,347.3v284.9l23.9,0v-286c0-40.3,2.3-69-11.6-96.2 C482.9,278.4,486.4,315.6,486.4,347.3 M482,487.6c-43.3,24.1-76.4,61.2-76.3,112.7v69.4c0,28.6-21.1,33.3-44.4,38.2 c31.1,5.9,68.6,0.7,68.6-38l0-90C432.4,541.5,453.1,511.4,482,487.6 M571.4,267c27.4,41.3,40.4,112,39.1,160.5l0.1,228.2h-21.4 v-60.8c0-49-35.6-84.1-75.6-107.3c32.4,26.4,52.5,59.8,52.5,100.1v68h-109v19.1h177V421.8C634.1,361.5,612.8,310.3,571.4,267 M564.1,200.2c76.2,70.2,100.7,134.1,100.7,235.3v239.3h23.9V434.7C687.6,330.3,657.4,256.2,564.1,200.2 M423.7,266.8 c-49.5,52.2-62,100.2-62,169.9c6-6.3,17.3-6.7,23.2,0C384.9,381.8,392.2,313,423.7,266.8"/>
    <path fill="#005E30" d="M499,98.8c0.9,1.1,3,12.8,3.5,15.3c0-1.3,4.4-12.6,18.3-12.9c-7,3.3-12.5,10.4-12.3,14 c2.3-5.9,15.1-12.6,28.3-7.7c-9.2,0.4-18.5,3.2-23.6,9.9c4-4.3,19.3-9.3,33.4-0.1c-9.4-2.1-21.5-3.3-29.2,3.3 c9.7-4,24.6-2.2,35.5,9.4c-12.6-6.3-23-8.9-33.3-5c9.2-1.2,24.2,1,31.7,15.7c-8.6-8.8-23.9-12.5-31.2-10.7 c2.9-0.9,23.4,3.9,27.1,21.5c-1.8-4.8-15.2-16.5-30.2-16.5c6.2,0.4,19.9,9.8,18.2,26c-4.7-16.7-16-20.2-23.6-21.5 c6,5.4,11.7,20.1,6.4,31.3c-0.4-13-8.2-27.7-14.4-28.5c-0.6-0.5-1.3,9.1-1,13.7l1.9-0.4l-1.9,11.6h1.9l-1.6,11.8l1.5-0.5 l-1.6,9.3l2.1-0.4c-1,1.7-1.8,7.5-2.9,7.2c-0.3,0,2.1,0.9,3.4,1.7c-4-0.4-8.2-0.4-12.9,0c1.3-0.6,3.7-1.7,3.5-1.7 c-1.2,0.1-2.1-5.5-2.9-7.2l1.9,0.4l-1.5-9.3l1.5,0.5l-1.6-11.8h1.9l-1.9-11.6l1.9,0.4c0.1-4.5-0.6-14.2-1.2-13.7 c-6.2,0.8-13.8,15.5-14.4,28.5c-5.3-11.2,0.4-26,6.4-31.4c-7.6,1.2-18.9,4.9-23.4,21.6c-1.8-16.2,11.9-25.6,18.2-26 c-15,0-28.4,11.7-30.3,16.5c3.8-17.6,24.2-22.4,27.1-21.5c-7.3-1.8-22.7,1.9-31.2,10.7c7.3-14.7,22.4-16.9,31.7-15.7 c-10.1-3.9-20.7-1.8-33.3,4.4c10.8-11.5,26.1-12.7,35.8-8.8c-7.6-6.7-20.1-5.4-29.3-3.3c13.9-9.1,29.5-4.1,33.4,0.1 c-5.1-6.7-14.5-9.5-23.6-9.9c13.2-4.9,25.8,1.8,28.1,7.7c0.3-3.6-5.1-10.7-12.3-14c14.1,0.3,18.5,11.6,18.3,12.9 C495.8,111.4,497.9,100.3,499,98.8"/>
  </svg>
)

/* ─── MAIN APP ───────────────────────────────────────────────── */
export default function App() {
  const [lang, setLang] = useState('ar')
  const [view, setView] = useState('dashboard')
  const [panelOpen, setPanelOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [renewingLicense, setRenewingLicense] = useState(null)
  const [editingLicense, setEditingLicense] = useState(null)
  const t = k => T[lang][k] || k
  const isRtl = lang === 'ar'
  const qc = useQueryClient()

  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard, refetchInterval: 60000 })
  const { data: licenses = [], isLoading: licLoading } = useQuery({
    queryKey: ['licenses', filterType, search],
    queryFn: () => getLicenses({ type: filterType !== 'all' ? filterType : undefined, search: search || undefined }),
    enabled: view === 'licenses' || view === 'dashboard'
  })
  const { data: expiring = [] } = useQuery({ queryKey: ['expiring'], queryFn: () => getExpiring(90) })
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: getVendors })
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: getDepartments })
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: getEmployees })

  const createMut = useMutation({ mutationFn: createLicense, onSuccess: () => { qc.invalidateQueries(['licenses']); qc.invalidateQueries(['dashboard']); setPanelOpen(false); setRenewingLicense(null) } })
  const updateMut = useMutation({ mutationFn: ({ id, data }) => updateLicense(id, data), onSuccess: () => { qc.invalidateQueries(['licenses']); qc.invalidateQueries(['dashboard']); setPanelOpen(false); setEditingId(null); setRenewingLicense(null) } })
  const deleteMut = useMutation({ mutationFn: deleteLicense, onSuccess: () => { qc.invalidateQueries(['licenses']); qc.invalidateQueries(['dashboard']) } })

  const handleEdit = async (l) => {
    setEditingId(l.id)
    setRenewingLicense(null)
    setEditingLicense(null)
    // جلب البيانات الكاملة للرخصة
    try {
      const { getLicense } = await import('./services/api')
      const full = await getLicense(l.id)
      setEditingLicense(full)
    } catch {
      setEditingLicense(l)
    }
    setPanelOpen(true)
  }
  const handleRenew = (l) => { setEditingId(null); setRenewingLicense(l); setPanelOpen(true) }

  const critical = (dashboard?.criticalLicenses || expiring).slice(0, 6)
  const totalLic = dashboard?.totalLicenses || 0
  const expiringCount = (dashboard?.expiringCount || 0) + (dashboard?.expiredCount || 0)
  const annualCost = dashboard?.totalAnnualCost || 0
  const compliance = dashboard?.complianceRate || 0

  // type distribution for bar chart
  const typeDist = [
    { label: isRtl ? 'أمن' : 'Security',   value: licenses.filter(l => l.type === 'Security').length,    color: '#1D4ED8' },
    { label: isRtl ? 'برامج' : 'Software',  value: licenses.filter(l => l.type === 'Software').length,    color: C.gold   },
    { label: isRtl ? 'صيانة' : 'Maint.',    value: licenses.filter(l => l.type === 'Maintenance').length, color: C.green  },
    { label: isRtl ? 'سحابي' : 'Cloud',     value: licenses.filter(l => l.type === 'Cloud').length,       color: C.amber  },
    { label: isRtl ? 'نطاق' : 'Domain',     value: licenses.filter(l => l.type === 'Domain').length,      color: C.muted  },
  ].filter(d => d.value > 0)

  const navItems = [
    { id: 'dashboard', label: isRtl ? 'لوحة التحكم' : 'Dashboard' },
    { id: 'licenses',  label: isRtl ? 'سجل الرخص' : 'Registry'   },
    { id: 'alerts',    label: isRtl ? 'التنبيهات' : 'Alerts', badge: expiring.filter(l => l.daysRemaining < 30).length },
    { id: 'compliance',label: isRtl ? 'الامتثال' : 'Compliance'  },
    { id: 'reports',   label: isRtl ? 'التقارير' : 'Reports'      },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', direction: isRtl ? 'rtl' : 'ltr', fontFamily: sans, background: '#EDE7DC', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 220, flexShrink: 0, background: C.ink, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Brand */}
        <div style={{ padding: '18px 16px 16px', borderBottom: `1px solid ${C.ink3}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DarahLogo size={44} />
            <div>
              <div style={{ fontSize: 11, fontFamily: font, fontWeight: 700, color: '#FAF6F0', lineHeight: 1.4 }}>{t('org')}</div>
              <div style={{ fontSize: 8, color: '#8BAF97', letterSpacing: 1, marginTop: 2, fontFamily: sans, textTransform: 'uppercase' }}>نظام إدارة الرخص</div>
            </div>
          </div>
        </div>

        {/* Lang */}
        <div style={{ padding: '10px 16px' }}>
          <div style={{ display: 'flex', background: C.ink2, borderRadius: 2, overflow: 'hidden' }}>
            {['ar', 'en'].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                flex: 1, padding: '5px 0', fontSize: 10, fontFamily: sans, fontWeight: 700,
                letterSpacing: .5, cursor: 'pointer', border: 'none', textTransform: 'uppercase',
                background: lang === l ? C.gold : 'transparent',
                color: lang === l ? '#fff' : C.muted, transition: 'all .2s'
              }}>{l === 'ar' ? 'ع' : 'e'}</button>
            ))}
          </div>
        </div>

        {/* Add Button */}
        <div style={{ padding: '4px 16px 12px' }}>
          <button onClick={() => { setPanelOpen(true); setEditingId(null); setRenewingLicense(null) }} style={{
            width: '100%', padding: '9px 0', background: C.gold, border: 'none', cursor: 'pointer',
            fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: 1, color: '#fff',
            textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> {t('addlicense')}
          </button>
        </div>

        <div style={{ height: 1, background: C.ink3, margin: '0 16px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {navItems.map(nav => (
            <div key={nav.id} onClick={() => setView(nav.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
              cursor: 'pointer', position: 'relative', transition: 'background .15s',
              background: view === nav.id ? C.ink2 : 'transparent',
            }}>
              {view === nav.id && <div style={{ position: 'absolute', insetInlineStart: 0, top: 0, bottom: 0, width: 3, background: C.gold }} />}
              <div style={{ fontSize: 11, fontFamily: sans, fontWeight: view === nav.id ? 700 : 400, color: view === nav.id ? '#FAF6F0' : '#B8D4C0', flex: 1, letterSpacing: .3 }}>{nav.label}</div>
              {nav.badge > 0 && <span style={{ background: C.red, color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 2, fontFamily: mono }}>{nav.badge}</span>}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.ink3}` }}>
          <div style={{ fontSize: 9, fontFamily: mono, color: C.ink3 }}>LMS v2.0 · {new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-GB')}</div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{ height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontFamily: sans, fontWeight: 700, letterSpacing: 1.5, color: C.muted, textTransform: 'uppercase' }}>
            {navItems.find(n => n.id === view)?.label}
          </div>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <div style={{ fontSize: 10, fontFamily: mono, color: C.subtle }}>
            {isRtl ? 'دارة الملك عبدالعزيز — إدارة التحول الرقمي' : 'King Abdulaziz Foundation — Digital Transformation'}
          </div>
          <div style={{ flex: 1 }} />
          {view === 'licenses' && (
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRtl ? 'بحث في الرخص...' : 'Search licenses...'} style={{
              padding: '6px 12px', border: `1px solid ${C.border}`, borderRadius: 2, fontSize: 11,
              fontFamily: sans, outline: 'none', width: 200, background: C.surfaceL, color: C.ink
            }} />
          )}
          <div style={{ fontSize: 10, fontFamily: mono, color: C.subtle, background: C.surfaceL, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: 2 }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* ══ DASHBOARD ══ */}
          {view === 'dashboard' && (
            <>
              {/* Critical Alert Banner */}
              {expiringCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#FEF2F2', border: `1px solid #FECACA`, borderInlineStart: `4px solid ${C.red}`, marginBottom: 20 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span style={{ fontSize: 11, fontFamily: sans, fontWeight: 600, color: C.red }}>
                    {isRtl ? `تحذير: ${expiringCount} رخصة تتطلب اتخاذ إجراء فوري` : `ALERT: ${expiringCount} licenses require immediate attention`}
                  </span>
                  <button onClick={() => setView('alerts')} style={{ marginInlineStart: 'auto', fontSize: 10, fontFamily: sans, fontWeight: 700, color: C.red, background: 'none', border: `1px solid ${C.red}`, padding: '3px 10px', cursor: 'pointer', letterSpacing: .5, textTransform: 'uppercase' }}>
                    {isRtl ? 'عرض التفاصيل' : 'View Details'}
                  </button>
                </div>
              )}

              {/* KPI Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
                <KpiCard label={isRtl ? 'إجمالي الرخص' : 'Total Licenses'} value={totalLic} sub={isRtl ? 'عبر جميع الأقسام' : 'Across all departments'} accent={C.ink} icon="📋" />
                <KpiCard label={isRtl ? 'تتطلب اتخاذ إجراء' : 'Require Action'} value={expiringCount} sub={isRtl ? 'منتهية أو تنتهي قريباً' : 'Expired or expiring soon'} accent={C.red} icon="⚠" />
                <KpiCard label={isRtl ? 'التكلفة السنوية' : 'Annual Spend'} value={annualCost ? `${(annualCost / 1000).toFixed(0)}K` : '—'} sub="SAR" accent={C.gold} icon="＄" />
                <KpiCard label={isRtl ? 'نسبة الامتثال' : 'Compliance Rate'} value={`${compliance}%`} sub={isRtl ? 'مستهدف: 100%' : 'Target: 100%'} accent={compliance >= 80 ? C.green : C.amber} icon="✓" />
              </div>

              {/* Middle Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>

                {/* Critical Licenses Table */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 14, background: C.red, borderRadius: 1 }} />
                    <div style={{ fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: 1.2, color: C.ink, textTransform: 'uppercase' }}>{isRtl ? 'الرخص الحرجة' : 'Critical Licenses'}</div>
                    <div style={{ fontSize: 9, fontFamily: mono, color: C.muted, background: C.surfaceL, border: `1px solid ${C.border}`, padding: '1px 6px', borderRadius: 2 }}>{critical.length}</div>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => setView('alerts')} style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: .5, textTransform: 'uppercase' }}>{isRtl ? 'عرض الكل' : 'View All'} →</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: C.surfaceL }}>
                        {[isRtl ? 'الرخصة' : 'License', isRtl ? 'المورّد' : 'Vendor', isRtl ? 'الحالة' : 'Status', isRtl ? 'المتبقي' : 'Days Left', ''].map((h, i) => (
                          <th key={i} style={{ padding: '8px 14px', textAlign: 'start', fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {critical.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', fontSize: 11, color: C.subtle, fontFamily: sans }}>{isRtl ? 'لا توجد رخص حرجة' : 'No critical licenses'}</td></tr>
                      ) : critical.map((l, i) => {
                        const d = l.daysRemaining
                        const st = getStatus(d)
                        return (
                          <tr key={l.id} style={{ borderBottom: `1px solid ${C.borderL}`, background: i % 2 === 0 ? C.surface : '#F5F0E8' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ fontSize: 12, fontFamily: sans, fontWeight: 600, color: C.ink }}>{l.name}</div>
                              <div style={{ fontSize: 9, fontFamily: mono, color: C.subtle, marginTop: 2 }}>{l.type || '—'}</div>
                            </td>
                            <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: sans, color: C.muted }}>{l.vendor?.name || '—'}</td>
                            <td style={{ padding: '10px 14px' }}><StatusPill status={st} lang={lang} /></td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontSize: 14, fontFamily: mono, fontWeight: 700, color: d < 0 ? C.red : d <= 30 ? C.red : d <= 90 ? C.amber : C.green }}>
                                {d < 0 ? (isRtl ? 'منتهية' : 'Exp.') : d}
                              </span>
                              {d >= 0 && <span style={{ fontSize: 9, fontFamily: sans, color: C.subtle, marginInlineStart: 4 }}>{t('days')}</span>}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => handleEdit(l)} style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, color: C.muted, background: 'none', border: `1px solid ${C.border}`, padding: '3px 8px', cursor: 'pointer', letterSpacing: .3 }}>{t('edit')}</button>
                                <button onClick={() => handleRenew(l)} style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, color: C.gold, background: C.goldL, border: `1px solid ${C.gold}`, padding: '3px 8px', cursor: 'pointer', letterSpacing: .3 }}>{t('renew')}</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Compliance Gauge */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase', marginBottom: 16 }}>{isRtl ? 'مستوى الامتثال' : 'Compliance Level'}</div>
                    <RiskGauge value={compliance} />
                    <div style={{ marginTop: 12, width: '100%' }}>
                      {[
                        { label: 'NCA-ECC', val: compliance, color: C.green },
                        { label: 'ISO 27001', val: Math.round(compliance * 0.9), color: C.blue },
                        { label: 'NDMO', val: Math.round(compliance * 0.85), color: C.amber },
                      ].map(item => (
                        <div key={item.label} style={{ marginBottom: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 9, fontFamily: mono, color: C.muted }}>{item.label}</span>
                            <span style={{ fontSize: 9, fontFamily: mono, color: C.ink, fontWeight: 700 }}>{item.val}%</span>
                          </div>
                          <div style={{ height: 3, background: C.borderL, borderRadius: 1 }}>
                            <div style={{ width: `${item.val}%`, height: '100%', background: item.color, borderRadius: 1, transition: 'width .5s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Type Distribution */}
                  {typeDist.length > 0 && (
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '16px 20px' }}>
                      <div style={{ fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase', marginBottom: 14 }}>{isRtl ? 'توزيع الأنواع' : 'Type Distribution'}</div>
                      <MiniBarChart data={typeDist} lang={lang} />
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div style={{ background: C.ink, padding: '16px 20px' }}>
                    <div style={{ fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>{isRtl ? 'ملخص تنفيذي' : 'Executive Summary'}</div>
                    {[
                      { label: isRtl ? 'سارية' : 'Active', val: dashboard?.activeCount || 0, color: C.green },
                      { label: isRtl ? 'تنتهي خلال 30 يوم' : 'Exp. in 30d', val: dashboard?.expiringCount || 0, color: C.red },
                      { label: isRtl ? 'تحتاج تجديد' : 'Needs Renewal', val: (expiringCount - (dashboard?.expiringCount || 0)), color: C.amber },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.ink3}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                          <span style={{ fontSize: 10, fontFamily: sans, color: C.muted }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: 14, fontFamily: mono, fontWeight: 700, color: '#fff' }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Department Cost Table */}
              {dashboard?.costByDepartment?.length > 0 && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 14, background: C.gold, borderRadius: 1 }} />
                    <div style={{ fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: 1.2, color: C.ink, textTransform: 'uppercase' }}>{isRtl ? 'التكاليف حسب القسم' : 'Cost by Department'}</div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: C.surfaceL }}>
                        {[isRtl ? 'القسم' : 'Department', isRtl ? 'التكلفة السنوية' : 'Annual Cost', isRtl ? 'النسبة' : 'Share'].map((h, i) => (
                          <th key={i} style={{ padding: '8px 16px', textAlign: 'start', fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.costByDepartment.map((d, i) => {
                        const total = dashboard.costByDepartment.reduce((a, b) => a + b.totalCost, 0)
                        const pct = total ? Math.round((d.totalCost / total) * 100) : 0
                        return (
                          <tr key={i} style={{ borderBottom: `1px solid ${C.borderL}` }}>
                            <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: sans, fontWeight: 600, color: C.ink }}>{isRtl ? d.departmentAr : d.departmentEn}</td>
                            <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: mono, fontWeight: 700, color: C.ink }}>{d.totalCost.toLocaleString()} SAR</td>
                            <td style={{ padding: '10px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 4, background: C.borderL, borderRadius: 2 }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: C.gold, borderRadius: 2, transition: 'width .4s ease' }} />
                                </div>
                                <span style={{ fontSize: 10, fontFamily: mono, color: C.muted, minWidth: 28 }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ══ LICENSES ══ */}
          {view === 'licenses' && (
            <>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: 'uppercase', marginInlineEnd: 4 }}>{isRtl ? 'تصفية:' : 'Filter:'}</div>
                {['all', 'Security', 'Software', 'Maintenance', 'Cloud', 'Domain'].map(tp => (
                  <button key={tp} onClick={() => setFilterType(tp)} style={{
                    padding: '5px 12px', fontSize: 10, fontFamily: sans, fontWeight: 700,
                    letterSpacing: .5, cursor: 'pointer', textTransform: 'uppercase',
                    border: `1px solid ${filterType === tp ? C.gold : C.border}`,
                    background: filterType === tp ? C.gold : C.surface,
                    color: filterType === tp ? '#fff' : C.muted, borderRadius: 2, transition: 'all .15s'
                  }}>{tp === 'all' ? (isRtl ? 'الكل' : 'All') : (isRtl ? T.ar[tp] || tp : tp)}</button>
                ))}
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 11, fontFamily: mono, color: C.muted }}>{licenses.length} {isRtl ? 'رخصة' : 'licenses'}</div>
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                {licLoading ? (
                  <div style={{ padding: 40, textAlign: 'center', fontSize: 11, fontFamily: sans, color: C.subtle }}>Loading...</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: C.ink }}>
                        {[isRtl?'الرخصة':'License', isRtl?'النوع':'Type', isRtl?'المورّد':'Vendor', isRtl?'القسم':'Dept', isRtl?'الحالة':'Status', isRtl?'تاريخ الانتهاء':'Expiry', isRtl?'المتبقي':'Remaining', isRtl?'التكلفة':'Cost', ''].map((h, i) => (
                          <th key={i} style={{ padding: '10px 14px', textAlign: 'start', fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {licenses.length === 0 ? (
                        <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', fontSize: 11, color: C.subtle, fontFamily: sans }}>{t('noData')}</td></tr>
                      ) : licenses.map((l, i) => {
                        const d = l.daysRemaining
                        const st = getStatus(d)
                        return (
                          <tr key={l.id} style={{ borderBottom: `1px solid ${C.borderL}`, background: i % 2 === 0 ? C.surface : '#F5F0E8' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ fontSize: 12, fontFamily: sans, fontWeight: 600, color: C.ink }}>{l.name}</div>
                              <div style={{ fontSize: 9, fontFamily: mono, color: C.subtle, marginTop: 1 }}>{l.seats} {isRtl ? 'مقعد' : 'seats'}</div>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .5, color: C.blue, background: C.blueL, padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase' }}>{isRtl ? T.ar[l.type] || l.type : l.type}</span>
                            </td>
                            <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: sans, color: C.muted }}>{l.vendor?.name || '—'}</td>
                            <td style={{ padding: '10px 14px', fontSize: 10, fontFamily: sans, color: C.muted }}>{isRtl ? l.department?.nameAr : l.department?.nameEn || '—'}</td>
                            <td style={{ padding: '10px 14px' }}><StatusPill status={st} lang={lang} /></td>
                            <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: mono, color: C.muted }}>{l.expiryDate ? new Date(l.expiryDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-GB') : '—'}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontSize: 14, fontFamily: mono, fontWeight: 700, color: d < 0 ? C.red : d <= 30 ? C.red : d <= 90 ? C.amber : C.green }}>
                                {d < 0 ? '—' : d}
                              </span>
                              {d >= 0 && <span style={{ fontSize: 9, fontFamily: sans, color: C.subtle, marginInlineStart: 3 }}>{t('days')}</span>}
                            </td>
                            <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: mono, color: C.ink, fontWeight: 600 }}>
                              {l.annualCost ? `${l.annualCost.toLocaleString()}` : '—'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button onClick={() => handleEdit(l)} style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, color: C.muted, background: 'none', border: `1px solid ${C.border}`, padding: '3px 7px', cursor: 'pointer' }}>{t('edit')}</button>
                                <button onClick={() => handleRenew(l)} style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, color: C.gold, background: C.goldL, border: `1px solid ${C.gold}`, padding: '3px 7px', cursor: 'pointer' }}>{t('renew')}</button>
                                <button onClick={() => { if (window.confirm(isRtl ? 'تأكيد الحذف؟' : 'Confirm delete?')) deleteMut.mutate(l.id) }} style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, color: C.red, background: 'none', border: `1px solid ${C.border}`, padding: '3px 7px', cursor: 'pointer' }}>×</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ══ ALERTS ══ */}
          {view === 'alerts' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
                {[
                  { label: isRtl ? 'منتهية' : 'Expired', count: expiring.filter(l => l.daysRemaining < 0).length, color: C.red },
                  { label: isRtl ? 'تنتهي خلال 30 يوم' : 'Exp. in 30 days', count: expiring.filter(l => l.daysRemaining >= 0 && l.daysRemaining < 30).length, color: C.amber },
                  { label: isRtl ? 'تنتهي خلال 90 يوم' : 'Exp. in 90 days', count: expiring.filter(l => l.daysRemaining >= 30 && l.daysRemaining < 90).length, color: C.gold },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${s.color}`, padding: '16px 20px' }}>
                    <div style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontSize: 36, fontFamily: font, color: s.color }}>{s.count}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, background: C.surfaceL }}>
                  <div style={{ fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' }}>{isRtl ? 'قائمة التنبيهات' : 'Alert Register'}</div>
                </div>
                {expiring.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', fontSize: 11, color: C.subtle, fontFamily: sans }}>{isRtl ? 'لا توجد تنبيهات' : 'No alerts'}</div>
                ) : expiring.map((l, i) => {
                  const d = l.daysRemaining
                  const st = getStatus(d)
                  const borderCol = d < 0 ? C.red : d < 30 ? C.red : d < 90 ? C.amber : C.gold
                  return (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: `1px solid ${C.borderL}`, borderInlineStart: `4px solid ${borderCol}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontFamily: sans, fontWeight: 600, color: C.ink }}>{l.name}</div>
                        <div style={{ fontSize: 10, fontFamily: sans, color: C.muted, marginTop: 2 }}>{l.vendor?.name} · {isRtl ? l.department?.nameAr : l.department?.nameEn}</div>
                      </div>
                      <StatusPill status={st} lang={lang} />
                      <div style={{ textAlign: 'center', minWidth: 64 }}>
                        <div style={{ fontSize: 20, fontFamily: mono, fontWeight: 700, color: borderCol }}>{d < 0 ? (isRtl ? 'منتهية' : 'EXP') : d}</div>
                        {d >= 0 && <div style={{ fontSize: 8, fontFamily: sans, color: C.subtle, textTransform: 'uppercase', letterSpacing: .5 }}>{t('days')}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleEdit(l)} style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, color: C.muted, background: 'none', border: `1px solid ${C.border}`, padding: '5px 10px', cursor: 'pointer', letterSpacing: .3 }}>{t('edit')}</button>
                        <button onClick={() => handleRenew(l)} style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, color: '#fff', background: C.gold, border: `1px solid ${C.gold}`, padding: '5px 10px', cursor: 'pointer', letterSpacing: .3 }}>{t('renew')}</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ══ COMPLIANCE ══ */}
          {view === 'compliance' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
                <KpiCard label={isRtl ? 'نسبة الامتثال' : 'Compliance Rate'} value={`${compliance}%`} sub="NCA-ECC · ISO 27001 · NDMO" accent={compliance >= 80 ? C.green : C.amber} icon="✓" />
                <KpiCard label={isRtl ? 'ممتثلة' : 'Compliant'} value={Math.round(totalLic * compliance / 100)} sub={isRtl ? 'رخصة ممتثلة' : 'compliant licenses'} accent={C.green} icon="✓" />
                <KpiCard label={isRtl ? 'غير ممتثلة' : 'Non-Compliant'} value={totalLic - Math.round(totalLic * compliance / 100)} sub={isRtl ? 'تحتاج مراجعة' : 'require review'} accent={C.red} icon="✗" />
                <KpiCard label={isRtl ? 'إجمالي' : 'Total'} value={totalLic} sub={isRtl ? 'رخصة' : 'licenses'} accent={C.ink} icon="≡" />
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20 }}>
                <SectionHeader title={isRtl ? 'مستوى الامتثال حسب المعيار' : 'Compliance by Standard'} />
                {[
                  { std: 'NCA-ECC',   pct: compliance,                    color: C.green },
                  { std: 'ISO 27001', pct: Math.round(compliance * 0.9),  color: C.blue  },
                  { std: 'NDMO / نضيء', pct: Math.round(compliance * 0.85), color: C.amber },
                  { std: 'CSCC',      pct: Math.round(compliance * 0.75), color: C.gold  },
                ].map(item => (
                  <div key={item.std} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontFamily: sans, fontWeight: 600, color: C.ink }}>{item.std}</span>
                      <span style={{ fontSize: 13, fontFamily: mono, fontWeight: 700, color: item.color }}>{item.pct}%</span>
                    </div>
                    <div style={{ height: 6, background: C.borderL, borderRadius: 1 }}>
                      <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 1, transition: 'width .5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, background: C.surfaceL }}>
                  <div style={{ fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' }}>{isRtl ? 'تفاصيل الامتثال' : 'Compliance Detail'}</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.surfaceL }}>
                      {[isRtl?'الرخصة':'License', isRtl?'معيار الامتثال':'Standard', isRtl?'الحالة':'Status', isRtl?'المتبقي':'Days Left'].map((h,i) => (
                        <th key={i} style={{ padding: '8px 16px', textAlign: 'start', fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(licenses.length ? licenses : critical).slice(0, 15).map((l, i) => {
                      const d = l.daysRemaining
                      const st = getStatus(d)
                      return (
                        <tr key={l.id} style={{ borderBottom: `1px solid ${C.borderL}`, background: i % 2 === 0 ? C.surface : '#F5F0E8' }}>
                          <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: sans, fontWeight: 600, color: C.ink }}>{l.name}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ fontSize: 9, fontFamily: mono, color: C.muted, background: C.surfaceL, border: `1px solid ${C.border}`, padding: '2px 6px', borderRadius: 2 }}>{l.complianceStandard || 'N/A'}</span>
                          </td>
                          <td style={{ padding: '10px 16px' }}><StatusPill status={st} lang={lang} /></td>
                          <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: mono, fontWeight: 700, color: d < 0 ? C.red : d <= 30 ? C.red : d <= 90 ? C.amber : C.green }}>
                            {d < 0 ? (isRtl ? 'منتهية' : 'Expired') : `${d} ${t('days')}`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ══ REPORTS ══ */}
          {view === 'reports' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { title: isRtl ? 'تقرير انتهاء الرخص' : 'License Expiry Report', sub: isRtl ? 'الرخص المنتهية والقريبة من الانتهاء' : 'Expired and soon-to-expire licenses', color: C.red },
                  { title: isRtl ? 'تقرير التكاليف' : 'Cost Analysis Report', sub: isRtl ? 'توزيع التكاليف حسب القسم والنوع' : 'Cost breakdown by department and type', color: C.gold },
                  { title: isRtl ? 'تقرير الامتثال' : 'Compliance Status Report', sub: isRtl ? 'حالة الامتثال NCA-ECC / ISO / NDMO' : 'Compliance against NCA-ECC / ISO / NDMO', color: C.green },
                  { title: isRtl ? 'تقرير الموردين' : 'Vendor Portfolio Report', sub: isRtl ? 'ملخص الموردين والعقود والتكاليف' : 'Vendor summary, contracts, and costs', color: C.blue },
                  { title: isRtl ? 'تقرير الاستخدام' : 'License Utilization Report', sub: isRtl ? 'ربط الرخص بالموظفين والأقسام' : 'License-to-employee and department mapping', color: C.muted },
                  { title: isRtl ? 'تقرير التدقيق' : 'Audit Trail Report', sub: isRtl ? 'سجل كامل لجميع التعديلات والعمليات' : 'Complete audit log of all operations', color: C.ink },
                ].map((r, i) => (
                  <div key={i} onClick={() => alert(isRtl ? 'جارٍ إنشاء التقرير...' : 'Generating report...')} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${r.color}`, padding: '20px', cursor: 'pointer', transition: 'box-shadow .15s' }}>
                    <div style={{ fontSize: 12, fontFamily: sans, fontWeight: 700, color: C.ink, marginBottom: 8 }}>{r.title}</div>
                    <div style={{ fontSize: 11, fontFamily: sans, color: C.muted, lineHeight: 1.5, marginBottom: 14 }}>{r.sub}</div>
                    <div style={{ fontSize: 10, fontFamily: sans, fontWeight: 700, color: r.color, letterSpacing: .5, textTransform: 'uppercase' }}>{isRtl ? 'إنشاء التقرير ←' : 'Generate Report →'}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '20px 24px' }}>
                <SectionHeader title={isRtl ? 'تصدير البيانات' : 'Export Data'} />
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { fmt: 'Excel (.xlsx)', color: C.green },
                    { fmt: 'CSV', color: C.blue },
                    { fmt: 'PDF', color: C.red },
                    { fmt: 'JSON', color: C.muted },
                  ].map(({ fmt, color }) => (
                    <button key={fmt} onClick={() => alert(`Exporting: ${fmt}`)} style={{
                      padding: '10px 20px', border: `1px solid ${C.border}`, borderTop: `2px solid ${color}`,
                      background: C.surface, fontSize: 11, fontFamily: sans, fontWeight: 700,
                      color: C.ink, cursor: 'pointer', letterSpacing: .3
                    }}>{fmt}</button>
                  ))}
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* ── PANEL ── */}
      {panelOpen && (
        <AddLicensePanel
          lang={lang} isRtl={isRtl} t={t}
          vendors={vendors} departments={departments} employees={employees}
          editingId={editingId} renewingLicense={renewingLicense} editingLicense={editingLicense}
          onClose={() => { setPanelOpen(false); setEditingId(null); setRenewingLicense(null); setEditingLicense(null) }}
          onSave={data => editingId ? updateMut.mutate({ id: editingId, data }) : createMut.mutate(data)}
          saving={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  )
}

/* ─── ADD LICENSE PANEL ──────────────────────────────────────── */
function AddLicensePanel({ lang, isRtl, t, vendors, departments, employees, editingId, renewingLicense, onClose, onSave, saving, editingLicense }) {
  const isRenewing = !!renewingLicense
  const isEditing = !!editingId

  const emptyForm = {
    name: '', description: '', type: 'Software', licenseModel: 'Per User',
    seats: 1, annualCost: 0, complianceStandard: '', licenseKey: '', internalNotes: '',
    startDate: new Date().toISOString().split('T')[0], durationYears: 1, durationMonths: 0,
    renewalMode: 'Manual', alertDaysBefore: 30, vendorId: '', departmentId: '', employeeIds: []
  }

  const [step, setStep] = useState(0)
  const [form, setForm] = useState(() => {
    if (isRenewing) {
      return {
        name: renewingLicense.name, description: renewingLicense.description || '',
        type: renewingLicense.type || 'Software', licenseModel: renewingLicense.licenseModel || 'Per User',
        seats: renewingLicense.seats || 1, annualCost: renewingLicense.annualCost || 0,
        complianceStandard: renewingLicense.complianceStandard || '', licenseKey: '',
        internalNotes: renewingLicense.internalNotes || '',
        startDate: new Date().toISOString().split('T')[0],
        durationYears: 1, durationMonths: 0,
        renewalMode: renewingLicense.renewalMode || 'Manual', alertDaysBefore: renewingLicense.alertDaysBefore || 30,
        vendorId: renewingLicense.vendor?.id ? String(renewingLicense.vendor.id) : '',
        departmentId: renewingLicense.department?.id ? String(renewingLicense.department.id) : '',
        employeeIds: []
      }
    }
    if (editingLicense) {
      const exp = editingLicense.expiryDate ? new Date(editingLicense.expiryDate) : null
      const start = editingLicense.startDate ? new Date(editingLicense.startDate) : new Date()
      let durationYears = 1, durationMonths = 0
      if (exp && start) {
        const diffMs = exp - start
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        durationYears = Math.floor(diffDays / 365)
        durationMonths = Math.round((diffDays % 365) / 30)
      }
      return {
        name: editingLicense.name || '',
        description: editingLicense.description || '',
        type: editingLicense.type || 'Software',
        licenseModel: editingLicense.licenseModel || 'Per User',
        seats: editingLicense.seats || 1,
        annualCost: editingLicense.annualCost || 0,
        complianceStandard: editingLicense.complianceStandard || '',
        licenseKey: editingLicense.licenseKey || '',
        internalNotes: editingLicense.internalNotes || '',
        startDate: editingLicense.startDate ? editingLicense.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
        durationYears,
        durationMonths,
        renewalMode: editingLicense.renewalMode || 'Manual',
        alertDaysBefore: editingLicense.alertDaysBefore || 30,
        vendorId: editingLicense.vendor?.id ? String(editingLicense.vendor.id) : '',
        departmentId: editingLicense.department?.id ? String(editingLicense.department.id) : '',
        employeeIds: editingLicense.owners?.map(o => o.id) || []
      }
    }
    return emptyForm
  })
  const [assigned, setAssigned] = useState(
    isRenewing && renewingLicense.owners ? renewingLicense.owners :
    editingLicense?.owners ? editingLicense.owners : []
  )

  const STEPS = 5
  const labels = isRtl
    ? ['التفاصيل', 'التواريخ', 'المورّد', 'الإدارة', 'مراجعة']
    : ['Details', 'Dates', 'Vendor', 'Dept', 'Review']

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const expiryDate = (() => {
    try {
      const d = new Date(form.startDate)
      d.setFullYear(d.getFullYear() + Number(form.durationYears))
      d.setMonth(d.getMonth() + Number(form.durationMonths))
      return d
    } catch { return null }
  })()
  const daysLeft = expiryDate ? Math.round((expiryDate - new Date()) / 864e5) : null

  const fi = (label, key, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 2, fontSize: 12, fontFamily: sans, outline: 'none', background: C.surfaceL, direction: isRtl ? 'rtl' : 'ltr', color: C.ink, boxSizing: 'border-box' }} />
    </div>
  )
  const fsel = (label, key, opts) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>{label}</label>
      <select value={form[key]} onChange={e => set(key, e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 2, fontSize: 12, fontFamily: sans, outline: 'none', background: C.surface, color: C.ink }}>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div style={{ width: 380, flexShrink: 0, borderInlineStart: `1px solid ${C.border}`, background: C.surface, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: isRenewing ? C.goldL : C.ink, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontFamily: sans, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', flex: 1, color: isRenewing ? C.goldD : '#fff' }}>
            {isRenewing ? (isRtl ? 'تجديد رخصة' : 'License Renewal') : editingId ? (isRtl ? 'تعديل رخصة' : 'Edit License') : (isRtl ? 'إضافة رخصة جديدة' : 'New License')}
          </div>
          <button onClick={onClose} style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: isRenewing ? C.goldD : C.muted }}>×</button>
        </div>
        {isRenewing && (
          <div style={{ fontSize: 10, fontFamily: sans, color: C.goldD, marginBottom: 12, padding: '6px 8px', background: '#FEF3C7', border: `1px solid ${C.gold}`, borderRadius: 2 }}>
            {isRtl ? `⟳ تجديد: ${renewingLicense.name}` : `⟳ Renewing: ${renewingLicense.name}`}
          </div>
        )}
        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 4 }}>
          {labels.map((lbl, i) => (
            <div key={i} onClick={() => i <= step && setStep(i)} style={{ flex: 1, cursor: i <= step ? 'pointer' : 'default' }}>
              <div style={{ height: 3, background: i <= step ? C.gold : isRenewing ? '#FDE68A' : C.ink2, borderRadius: 1, marginBottom: 4, transition: 'background .2s' }} />
              <div style={{ fontSize: 8, fontFamily: sans, fontWeight: 700, letterSpacing: .5, color: i === step ? (isRenewing ? C.goldD : C.gold) : (isRenewing ? C.goldD : C.muted), textTransform: 'uppercase', textAlign: 'center' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {step === 0 && <>
          {fi(isRtl ? 'اسم المنتج *' : 'Product Name *', 'name')}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>{isRtl ? 'الوصف' : 'Description'}</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 2, fontSize: 12, fontFamily: sans, outline: 'none', resize: 'vertical', background: C.surfaceL, color: C.ink, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fsel(isRtl?'النوع':'Type', 'type', ['Security','Software','Maintenance','Cloud','Domain','Service'].map(v=>({value:v,label:v})))}
            {fsel(isRtl?'النموذج':'Model', 'licenseModel', ['Per User','Per Device','Site License','Concurrent','Enterprise'].map(v=>({value:v,label:v})))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fi(isRtl?'المقاعد':'Seats', 'seats', 'number')}
            {fi(isRtl?'التكلفة السنوية (ر.س)':'Annual Cost (SAR)', 'annualCost', 'number')}
          </div>
          {fsel(isRtl?'الامتثال':'Compliance', 'complianceStandard', [{value:'',label:'—'},...['NCA-ECC','ISO 27001','NDMO / نضيء','CSCC'].map(v=>({value:v,label:v}))])}
          {fi(isRtl?'مفتاح التفعيل':'License Key', 'licenseKey', 'text', 'XXXX-XXXX-XXXX')}
        </>}

        {step === 1 && <>
          {fi(isRtl?'تاريخ البداية *':'Start Date *', 'startDate', 'date')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fsel(isRtl?'السنوات':'Years', 'durationYears', [0,1,2,3,4,5].map(v=>({value:v,label:`${v} ${isRtl?'سنة':'yr'}`})))}
            {fsel(isRtl?'الأشهر':'Months', 'durationMonths', Array.from({length:12},(_,i)=>({value:i,label:`${i} ${isRtl?'شهر':'mo'}`})))}
          </div>
          {expiryDate && (
            <div style={{ padding: '12px 14px', border: `1px solid ${daysLeft > 90 ? '#A7F3D0' : daysLeft >= 0 ? '#FDE68A' : '#FECACA'}`, borderInlineStart: `4px solid ${daysLeft > 90 ? C.green : daysLeft >= 0 ? C.amber : C.red}`, marginBottom: 12, background: daysLeft > 90 ? '#F0FDF4' : daysLeft >= 0 ? '#FFFBEB' : '#FEF2F2' }}>
              <div style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>{isRtl?'تاريخ الانتهاء':'Calculated Expiry'}</div>
              <div style={{ fontSize: 18, fontFamily: mono, fontWeight: 700, color: daysLeft > 90 ? C.green : daysLeft >= 0 ? C.amber : C.red }}>{expiryDate.toLocaleDateString(isRtl?'ar-SA':'en-GB',{year:'numeric',month:'long',day:'numeric'})}</div>
              <div style={{ fontSize: 10, fontFamily: sans, color: C.muted, marginTop: 4 }}>{daysLeft > 0 ? `${daysLeft} ${t('days')}` : isRtl ? 'منتهية' : 'Expired'}</div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fsel(isRtl?'التجديد':'Renewal', 'renewalMode', [['Manual',isRtl?'يدوي':'Manual'],['Automatic',isRtl?'تلقائي':'Automatic'],['Non-renewable',isRtl?'غير قابل':'Non-renewable']].map(([v,l])=>({value:v,label:l})))}
            {fsel(isRtl?'تنبيه قبل':'Alert Before', 'alertDaysBefore', [30,60,90].map(v=>({value:v,label:`${v} ${isRtl?'يوم':'days'}`})))}
          </div>
        </>}

        {step === 2 && <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>{isRtl?'اختر مورّداً':'Select Vendor'}</label>
            <select value={form.vendorId} onChange={e => set('vendorId', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 2, fontSize: 12, fontFamily: sans, outline: 'none', background: C.surface, color: C.ink }}>
              <option value="">—</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.country})</option>)}
            </select>
          </div>
          <div style={{ height: 1, background: C.borderL, margin: '16px 0' }} />
          <div style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>{isRtl?'أو أدخل مورّداً جديداً':'Or enter new vendor'}</div>
          {fi(isRtl?'اسم الشركة':'Company Name', '_vendorName')}
          {fi('Email', '_vendorEmail', 'email')}
          {fi(isRtl?'رقم العقد':'Contract No.', '_vendorContract')}
        </>}

        {step === 3 && <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>{isRtl?'القسم المسؤول *':'Department *'}</label>
            <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 2, fontSize: 12, fontFamily: sans, outline: 'none', background: C.surface, color: C.ink }}>
              <option value="">—</option>
              {departments.map(d => <option key={d.id} value={d.id}>{isRtl ? d.nameAr : d.nameEn} ({d.costCenter})</option>)}
            </select>
          </div>
          <div style={{ height: 1, background: C.borderL, margin: '16px 0' }} />
          <div style={{ fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: .8, color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>{isRtl?'الموظفون المسؤولون':'Assigned Employees'}</div>
          <select onChange={e => {
            const emp = employees.find(x => x.id === Number(e.target.value))
            if (emp && !assigned.find(a => a.id === emp.id)) setAssigned(p => [...p, emp])
            e.target.value = ''
          }} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 2, fontSize: 12, fontFamily: sans, outline: 'none', background: C.surface, color: C.ink, marginBottom: 10 }}>
            <option value="">— {isRtl?'إضافة موظف':'Add employee'} —</option>
            {employees.map(e => <option key={e.id} value={e.id}>{isRtl ? e.nameAr : e.nameEn}</option>)}
          </select>
          {assigned.map((emp, i) => (
            <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: `1px solid ${C.border}`, marginBottom: 6, background: C.surfaceL }}>
              <div style={{ width: 28, height: 28, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: sans }}>
                {(isRtl ? emp.nameAr : emp.nameEn || emp.nameAr).split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontFamily: sans, fontWeight: 600, color: C.ink }}>{isRtl ? emp.nameAr : emp.nameEn}</div>
                <div style={{ fontSize: 9, fontFamily: sans, color: C.muted }}>{isRtl ? emp.roleAr : emp.roleEn}</div>
              </div>
              <button onClick={() => setAssigned(p => p.filter((_,j) => j !== i))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.muted, fontSize: 16 }}>×</button>
            </div>
          ))}
        </>}

        {step === 4 && <>
          <div style={{ fontSize: 10, fontFamily: sans, color: C.muted, marginBottom: 16 }}>{isRtl?'مراجعة البيانات قبل الحفظ':'Review before saving'}</div>
          {[
            { title: isRtl?'تفاصيل الرخصة':'LICENSE', rows: [
              [isRtl?'المنتج':'Product', form.name],
              [isRtl?'النوع':'Type', form.type],
              [isRtl?'المقاعد':'Seats', form.seats],
              [isRtl?'التكلفة/سنة':'Cost/yr', form.annualCost ? `${Number(form.annualCost).toLocaleString()} SAR` : '—'],
              [isRtl?'الامتثال':'Compliance', form.complianceStandard || '—'],
            ]},
            { title: isRtl?'التواريخ':'DATES', rows: [
              [isRtl?'البداية':'Start', form.startDate],
              [isRtl?'الانتهاء':'Expiry', expiryDate?.toLocaleDateString() || '—'],
            ]},
            { title: isRtl?'الإدارة':'DEPT', rows: [
              [isRtl?'القسم':'Dept', departments.find(d => d.id === Number(form.departmentId))?.[isRtl ? 'nameAr' : 'nameEn'] || '—'],
              [isRtl?'الموظفون':'Employees', assigned.map(e => isRtl ? e.nameAr : e.nameEn).join(', ') || '—'],
            ]},
          ].map(sec => (
            <div key={sec.title} style={{ marginBottom: 12, border: `1px solid ${C.border}` }}>
              <div style={{ padding: '6px 12px', background: C.ink, fontSize: 9, fontFamily: sans, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: 'uppercase' }}>{sec.title}</div>
              {sec.rows.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: `1px solid ${C.borderL}` }}>
                  <span style={{ fontSize: 10, fontFamily: sans, color: C.muted }}>{k}</span>
                  <span style={{ fontSize: 11, fontFamily: mono, fontWeight: 700, color: C.ink }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          ))}
        </>}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, background: C.surfaceL, flexShrink: 0 }}>
        <button disabled={step === 0} onClick={() => setStep(s => s - 1)} style={{ padding: '9px 16px', border: `1px solid ${C.border}`, fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: .5, cursor: step === 0 ? 'default' : 'pointer', background: 'transparent', color: C.muted, opacity: step === 0 ? .3 : 1, textTransform: 'uppercase' }}>
          {isRtl ? 'السابق' : 'Back'}
        </button>
        <button onClick={() => step < STEPS - 1 ? setStep(s => s + 1) : onSave({ ...form, employeeIds: assigned.map(e => e.id) })} disabled={saving} style={{
          flex: 1, padding: 9, background: saving ? C.border : C.gold, color: '#fff', border: 'none',
          fontSize: 10, fontFamily: sans, fontWeight: 700, letterSpacing: .8, cursor: saving ? 'default' : 'pointer', textTransform: 'uppercase'
        }}>
          {saving ? (isRtl?'جارٍ الحفظ...':'Saving...') : step < STEPS - 1 ? (isRtl?'التالي →':'Next →') : isRenewing ? (isRtl?'تأكيد التجديد':'Confirm Renewal') : (isRtl?'حفظ الرخصة':'Save License')}
        </button>
      </div>
    </div>
  )
}
