import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDashboard, getLicenses, getExpiring,
  getVendors, getDepartments, getEmployees,
  createLicense, updateLicense, deleteLicense
} from './services/api'
import './index.css'

// ── helpers ──────────────────────────────────────
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
    error: 'حدث خطأ', saved: 'تم الحفظ بنجاح',
    sw: 'برامج', saas: 'سحابي', hw: 'أجهزة',
    active: 'سارية', expiring_soon: 'تنتهي قريباً',
    needs_renewal: 'تحتاج تجديد', expired: 'منتهية',
    days: 'يوم', search: 'بحث...',
    noData: 'لا توجد بيانات',
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
    error: 'An error occurred', saved: 'Saved successfully',
    sw: 'Software', saas: 'Cloud', hw: 'Hardware',
    active: 'Active', expiring_soon: 'Expiring Soon',
    needs_renewal: 'Needs Renewal', expired: 'Expired',
    days: 'days', search: 'Search...',
    noData: 'No data available',
  }
}

const statusColor = {
  active: '#3B6D11', expiring_soon: '#A32D2D',
  needs_renewal: '#BA7517', expired: '#A32D2D'
}
const statusBg = {
  active: '#EAF3DE', expiring_soon: '#FCEBEB',
  needs_renewal: '#FAEEDA', expired: '#FCEBEB'
}
const typeBg = { sw: '#F3F0FF', saas: '#E6F1FB', hw: '#F1EFE8' }
const typeColor = { sw: '#534AB7', saas: '#185FA5', hw: '#5F5E5A' }

function badge(label, bg, color) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
      borderRadius: 8, fontSize: 9, fontWeight: 500, whiteSpace: 'nowrap',
      background: bg, color, border: `.5px solid ${color}22`
    }}>{label}</span>
  )
}

// ── Main App ─────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState('ar')
  const [view, setView] = useState('dashboard')
  const [panelOpen, setPanelOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const t = k => T[lang][k] || k
  const isRtl = lang === 'ar'
  const qc = useQueryClient()

  // Queries
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'], queryFn: getDashboard, refetchInterval: 60000
  })
  const { data: licenses = [], isLoading: licLoading } = useQuery({
    queryKey: ['licenses', filterType, search],
    queryFn: () => getLicenses({
      type: filterType !== 'all' ? filterType : undefined,
      search: search || undefined
    }),
    enabled: view === 'licenses'
  })
  const { data: expiring = [] } = useQuery({
    queryKey: ['expiring'], queryFn: () => getExpiring(90)
  })
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: getVendors })
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: getDepartments })
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: getEmployees })

  // Mutations
  const createMut = useMutation({
    mutationFn: createLicense,
    onSuccess: () => { qc.invalidateQueries(['licenses']); qc.invalidateQueries(['dashboard']); setPanelOpen(false) }
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateLicense(id, data),
    onSuccess: () => { qc.invalidateQueries(['licenses']); qc.invalidateQueries(['dashboard']); setPanelOpen(false); setEditingId(null) }
  })
  const deleteMut = useMutation({
    mutationFn: deleteLicense,
    onSuccess: () => { qc.invalidateQueries(['licenses']); qc.invalidateQueries(['dashboard']) }
  })

  const criticalLicenses = dashboard?.criticalLicenses || expiring.slice(0, 8)

  return (
    <div style={{ display: 'flex', height: '100vh', direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'system-ui, sans-serif', background: 'var(--color-background-tertiary, #f5f5f0)' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 210, flexShrink: 0, borderInlineEnd: '.5px solid #e0ddd4', background: '#faf9f5', display: 'flex', flexDirection: 'column', padding: '12px 0', overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '6px 12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#BA7517', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500 }}>{t('org')}</div>
            <div style={{ fontSize: 9, color: '#888' }}>{t('sys')}</div>
          </div>
        </div>

        {/* Lang toggle */}
        <div style={{ display: 'flex', margin: '0 8px 8px', background: '#ededea', borderRadius: 6, padding: 2, gap: 2 }}>
          {['ar', 'en'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 10, cursor: 'pointer',
              border: lang === l ? '.5px solid #ddd' : 'none',
              background: lang === l ? 'white' : 'transparent',
              color: lang === l ? '#BA7517' : '#888', fontWeight: lang === l ? 500 : 400
            }}>{l === 'ar' ? 'العربية' : 'English'}</button>
          ))}
        </div>

        <div style={{ height: .5, background: '#e0ddd4', margin: '0 10px 8px' }} />

        {/* Add button */}
        <div style={{ padding: '0 8px 8px' }}>
          <button onClick={() => { setPanelOpen(true); setEditingId(null) }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px',
            borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '.5px solid #FAC775',
            background: '#FAEEDA', color: '#BA7517', fontWeight: 500
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t('addlicense')}
          </button>
        </div>

        <div style={{ height: .5, background: '#e0ddd4', margin: '0 10px 8px' }} />

        {/* Nav */}
        {[
          { id: 'dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', label: t('dashboard') },
          { id: 'licenses', icon: 'M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z', label: t('registry'), badge: licenses.length || '' },
          { id: 'alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-4.99M9 17H4l1.405-1.405A2.032 2.032 0 006 14.158V11a6 6 0 016-6M12 21a1 1 0 100-2 1 1 0 000 2z', label: t('alerts'), badge: expiring.filter(l => l.daysRemaining < 30).length || '' },
          { id: 'compliance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: t('compliance') },
          { id: 'reports', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', label: t('reports') },
        ].map(nav => (
          <div key={nav.id} onClick={() => setView(nav.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', margin: '1px 6px',
            borderRadius: 6, cursor: 'pointer', fontSize: 11, transition: 'all .15s',
            background: view === nav.id ? '#FAEEDA' : 'transparent',
            color: view === nav.id ? '#BA7517' : '#666',
            fontWeight: view === nav.id ? 500 : 400
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={view === nav.id ? 1 : .65}><path d={nav.icon}/></svg>
            {nav.label}
            {nav.badge ? <span style={{ marginInlineStart: 'auto', background: '#FCEBEB', color: '#A32D2D', fontSize: 9, padding: '1px 5px', borderRadius: 8 }}>{nav.badge}</span> : null}
          </div>
        ))}

        <div style={{ marginTop: 'auto', padding: '10px 12px', borderTop: '.5px solid #e0ddd4', fontSize: 9, color: '#aaa' }}>
          {isRtl ? 'آخر مزامنة: الآن' : 'Last sync: Now'}
        </div>
      </aside>

      {/* ── Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ height: 46, borderBottom: '.5px solid #e0ddd4', display: 'flex', alignItems: 'center', padding: '0 16px', background: 'white' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {t(view === 'dashboard' ? 'dashboard' : view === 'licenses' ? 'registry' : view === 'alerts' ? 'alerts' : view === 'compliance' ? 'compliance' : 'reports')}
          </div>
          <div style={{ flex: 1 }} />
          {dashLoading && <span style={{ fontSize: 10, color: '#aaa' }}>{t('loading')}</span>}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

          {/* ── Dashboard ── */}
          {view === 'dashboard' && (
            <>
              {/* Alert bar */}
              {expiring.filter(l => l.daysRemaining < 30).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', background: '#FCEBEB', border: '.5px solid #F7C1C1', borderRadius: 6, marginBottom: 12, fontSize: 10, color: '#A32D2D' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{ flex: 1 }}>{expiring.filter(l => l.daysRemaining < 30).length} {isRtl ? 'رخص تنتهي خلال 30 يوماً' : 'licenses expiring within 30 days'}</span>
                  <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setView('alerts')}>{isRtl ? 'عرض التنبيهات' : 'View Alerts'}</span>
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginBottom: 14 }}>
                {[
                  { label: t('stat1'), value: dashboard?.totalLicenses || 0, sub: isRtl ? 'عبر الأقسام' : 'Across depts' },
                  { label: t('stat2'), value: (dashboard?.expiringCount || 0) + (dashboard?.expiredCount || 0), sub: isRtl ? 'تتطلب متابعة' : 'Needs attention', warn: true },
                  { label: t('stat3'), value: dashboard ? Math.round(dashboard.totalAnnualCost / 1000) + 'k' : '—', sub: 'SAR' },
                  { label: t('stat4'), value: (dashboard?.complianceRate || 0) + '%', sub: isRtl ? 'مستهدف: 100%' : 'Target: 100%', green: true },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'white', border: `.5px solid ${s.warn ? '#E24B4A' : '#e0ddd4'}`, borderInlineStart: s.warn ? '2.5px solid #E24B4A' : undefined, borderRadius: 8, padding: '11px 12px' }}>
                    <div style={{ fontSize: 9, color: '#aaa', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 19, fontWeight: 500, color: s.green ? '#3B6D11' : s.warn ? '#E24B4A' : '#1a1a1a' }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Critical licenses table */}
              <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 9 }}>
                {isRtl ? 'الرخص الحرجة' : 'Critical Licenses'}
                <span style={{ fontSize: 9, color: '#aaa', background: '#f1efe8', padding: '1px 6px', borderRadius: 8, marginInlineStart: 6 }}>{criticalLicenses.length}</span>
              </div>
              <LicenseTable licenses={criticalLicenses} lang={lang} t={t} isRtl={isRtl} onEdit={l => { setEditingId(l.id); setPanelOpen(true) }} onDelete={id => deleteMut.mutate(id)} compact />
            </>
          )}

          {/* ── Licenses ── */}
          {view === 'licenses' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 500 }}>{t('registry')}</div>
                <span style={{ fontSize: 9, color: '#aaa', background: '#f1efe8', padding: '1px 6px', borderRadius: 8 }}>{licenses.length}</span>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: 2, background: '#f1efe8', padding: 2, borderRadius: 5 }}>
                  {['all', 'sw', 'saas', 'hw'].map(tp => (
                    <button key={tp} onClick={() => setFilterType(tp)} style={{
                      padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                      border: filterType === tp ? '.5px solid #ddd' : 'none',
                      background: filterType === tp ? 'white' : 'transparent',
                      color: filterType === tp ? '#1a1a1a' : '#888', fontWeight: filterType === tp ? 500 : 400
                    }}>{tp === 'all' ? (isRtl ? 'الكل' : 'All') : t(tp)}</button>
                  ))}
                </div>
              </div>
              <div style={{ background: 'white', border: '.5px solid #e0ddd4', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ padding: '8px 11px', borderBottom: '.5px solid #e0ddd4', background: '#faf9f5' }}>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')} style={{ border: '.5px solid #e0ddd4', borderRadius: 4, padding: '4px 8px', fontSize: 10, background: 'white', outline: 'none', width: 220, direction: isRtl ? 'rtl' : 'ltr' }} />
                </div>
                {licLoading ? <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: '#aaa' }}>{t('loading')}</div> :
                  <LicenseTable licenses={licenses} lang={lang} t={t} isRtl={isRtl} onEdit={l => { setEditingId(l.id); setPanelOpen(true) }} onDelete={id => deleteMut.mutate(id)} />}
              </div>
            </>
          )}

          {/* ── Alerts ── */}
          {view === 'alerts' && (
            <>
              <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 10 }}>{t('alerts')}</div>
              {expiring.map(l => {
                const d = l.daysRemaining
                const [bg, bd, col] = d < 30 ? ['#FCEBEB', '#F7C1C1', '#A32D2D'] : ['#FAEEDA', '#FAC775', '#BA7517']
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 11px', background: bg, border: `.5px solid ${bd}`, borderRadius: 6, marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: col }}>{l.name}</div>
                      <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{l.vendor?.name} — {l.department?.nameAr || l.department?.nameEn}</div>
                      <div style={{ fontSize: 9, color: '#999', marginTop: 1 }}>{isRtl ? 'المسؤول:' : 'Owner:'} {l.owners?.[0]?.nameAr || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 52 }}>
                      <div style={{ fontSize: 16, fontWeight: 500, color: col }}>{d < 0 ? (isRtl ? 'منتهية' : 'Exp.') : d}</div>
                      {d >= 0 && <div style={{ fontSize: 8, color: '#aaa' }}>{t('days')}</div>}
                    </div>
                    <button onClick={() => { setEditingId(l.id); setPanelOpen(true) }} style={{ padding: '3px 8px', border: `.5px solid ${col}`, borderRadius: 4, background: 'transparent', fontSize: 9, cursor: 'pointer', color: col }}>{t('renew')}</button>
                  </div>
                )
              })}
              {expiring.length === 0 && <div style={{ textAlign: 'center', padding: 40, fontSize: 11, color: '#aaa' }}>{isRtl ? 'لا توجد تنبيهات' : 'No alerts'}</div>}
            </>
          )}

          {/* ── Compliance ── */}
          {view === 'compliance' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginBottom: 14 }}>
                {[
                  { label: isRtl ? 'نسبة الامتثال' : 'Compliance Rate', value: (dashboard?.complianceRate || 0) + '%', color: '#3B6D11' },
                  { label: isRtl ? 'غير ممتثلة' : 'Non-Compliant', value: dashboard ? dashboard.totalLicenses - Math.round(dashboard.totalLicenses * dashboard.complianceRate / 100) : 0, warn: true },
                  { label: isRtl ? 'إجمالي الرخص' : 'Total', value: dashboard?.totalLicenses || 0 },
                  { label: isRtl ? 'سارية' : 'Active', value: dashboard?.activeCount || 0, color: '#3B6D11' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'white', border: `.5px solid ${s.warn ? '#E24B4A' : '#e0ddd4'}`, borderInlineStart: s.warn ? '2.5px solid #E24B4A' : undefined, borderRadius: 8, padding: '11px 12px' }}>
                    <div style={{ fontSize: 9, color: '#aaa', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 19, fontWeight: 500, color: s.color || (s.warn ? '#E24B4A' : '#1a1a1a') }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <LicenseTable licenses={licenses.length ? licenses : criticalLicenses} lang={lang} t={t} isRtl={isRtl} onEdit={l => { setEditingId(l.id); setPanelOpen(true) }} onDelete={id => deleteMut.mutate(id)} showCompliance />
            </>
          )}

          {/* ── Reports ── */}
          {view === 'reports' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { title: isRtl ? 'تقرير انتهاء الرخص' : 'License Expiry', sub: isRtl ? 'الرخص المنتهية والقريبة من الانتهاء' : 'Expired and soon-to-expire licenses', bg: '#FCEBEB', ic: '#A32D2D' },
                  { title: isRtl ? 'تقرير التكاليف' : 'Cost Report', sub: isRtl ? 'توزيع التكاليف حسب القسم' : 'Cost breakdown by department', bg: '#FAEEDA', ic: '#BA7517' },
                  { title: isRtl ? 'تقرير الامتثال' : 'Compliance Report', sub: isRtl ? 'حالة الامتثال NCA-ECC / NDMO' : 'Compliance status NCA-ECC / NDMO', bg: '#EAF3DE', ic: '#3B6D11' },
                  { title: isRtl ? 'تقرير الموردين' : 'Vendor Report', sub: isRtl ? 'ملخص الموردين والعقود' : 'Vendor summary and contracts', bg: '#E6F1FB', ic: '#185FA5' },
                  { title: isRtl ? 'تقرير الاستخدام' : 'Usage Report', sub: isRtl ? 'ربط الرخص بالموظفين' : 'License assignments', bg: '#F1EFE8', ic: '#5F5E5A' },
                  { title: isRtl ? 'تقرير التدقيق' : 'Audit Report', sub: isRtl ? 'سجل كامل للتعديلات' : 'Complete audit trail', bg: '#F3F0FF', ic: '#534AB7' },
                ].map((r, i) => (
                  <div key={i} onClick={() => alert(isRtl ? 'جارٍ إنشاء التقرير...' : 'Generating report...')} style={{ background: 'white', border: '.5px solid #e0ddd4', borderRadius: 8, padding: 14, cursor: 'pointer', transition: 'border-color .15s' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.ic} strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77"/></svg>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 3 }}>{r.title}</div>
                    <div style={{ fontSize: 9, color: '#888', lineHeight: 1.4 }}>{r.sub}</div>
                    <div style={{ fontSize: 9, color: '#BA7517', marginTop: 7 }}>↗ {isRtl ? 'إنشاء التقرير' : 'Generate'}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', border: '.5px solid #e0ddd4', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 8 }}>{isRtl ? 'تصدير البيانات' : 'Export Data'}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Excel (.xlsx)', 'CSV', 'PDF', 'JSON (API)'].map(fmt => (
                    <button key={fmt} onClick={() => alert(`${isRtl ? 'جارٍ التصدير' : 'Exporting'}: ${fmt}`)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', border: '.5px solid #e0ddd4', borderRadius: 6, fontSize: 10, cursor: 'pointer', background: '#faf9f5', color: '#666' }}>
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ── Add / Edit Panel ── */}
      {panelOpen && (
        <AddLicensePanel
          lang={lang} isRtl={isRtl} t={t}
          vendors={vendors} departments={departments} employees={employees}
          onClose={() => { setPanelOpen(false); setEditingId(null) }}
          onSave={data => editingId ? updateMut.mutate({ id: editingId, data }) : createMut.mutate(data)}
          saving={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  )
}

// ── License Table Component ──────────────────────
function LicenseTable({ licenses, t, isRtl, onEdit, onDelete, compact, showCompliance }) {
  if (!licenses?.length) return <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: '#aaa' }}>{t('noData')}</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
        <thead>
          <tr style={{ borderBottom: '.5px solid #e0ddd4' }}>
            {[isRtl ? 'اسم الرخصة' : 'License', isRtl ? 'النوع' : 'Type', isRtl ? 'المورّد' : 'Vendor', isRtl ? 'الحالة' : 'Status', isRtl ? 'الانتهاء' : 'Expiry', isRtl ? 'المتبقي' : 'Remaining', ...(showCompliance ? [isRtl ? 'الامتثال' : 'Compliance'] : []), ''].map((h, i) => (
              <th key={i} style={{ padding: '6px 10px', textAlign: 'start', fontSize: 9, fontWeight: 500, color: '#aaa', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {licenses.map(l => {
            const d = l.daysRemaining
            const status = l.status || (d < 0 ? 'expired' : d <= 30 ? 'expiring_soon' : d <= 90 ? 'needs_renewal' : 'active')
            return (
              <tr key={l.id} style={{ borderBottom: '.5px solid #f1efe8' }}>
                <td style={{ padding: '8px 10px' }}>
                  <strong style={{ fontSize: 11 }}>{l.name}</strong>
                  {!compact && <div style={{ fontSize: 9, color: '#aaa' }}>{l.description}</div>}
                </td>
                <td style={{ padding: '8px 10px' }}>{badge(t(l.type), typeBg[l.type] || '#f1efe8', typeColor[l.type] || '#666')}</td>
                <td style={{ padding: '8px 10px', color: '#666' }}>{l.vendor?.name || '—'}</td>
                <td style={{ padding: '8px 10px' }}>{badge(t(status), statusBg[status] || '#f1efe8', statusColor[status] || '#666')}</td>
                <td style={{ padding: '8px 10px', fontSize: 10 }}>{l.expiryDate ? new Date(l.expiryDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                <td style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 44, height: 3, background: '#e0ddd4', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: Math.min(100, Math.max(0, (d / 365) * 100)) + '%', height: '100%', background: d > 90 ? '#639922' : d > 30 ? '#EF9F27' : '#E24B4A', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 9, color: d < 0 ? '#A32D2D' : d <= 30 ? '#EF9F27' : '#888' }}>
                      {d < 0 ? (isRtl ? 'منتهية' : 'Exp.') : d === 0 ? (isRtl ? 'اليوم' : 'Today') : d + ' ' + t('days')}
                    </span>
                  </div>
                </td>
                {showCompliance && <td style={{ padding: '8px 10px', fontSize: 9, color: '#666' }}>{l.complianceStandard || '—'}</td>}
                <td style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <button onClick={() => onEdit(l)} style={{ padding: '2px 6px', border: '.5px solid #e0ddd4', borderRadius: 3, background: 'transparent', fontSize: 9, cursor: 'pointer', color: '#666' }}>{t('edit')}</button>
                    <button onClick={() => onEdit(l)} style={{ padding: '2px 6px', border: '.5px solid #e0ddd4', borderRadius: 3, background: 'transparent', fontSize: 9, cursor: 'pointer', color: '#BA7517' }}>{t('renew')}</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Add License Panel (Wizard) ───────────────────
function AddLicensePanel({ lang, isRtl, t, vendors, departments, employees, onClose, onSave, saving }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', description: '', type: 'sw', licenseModel: 'Per User',
    seats: 1, annualCost: 0, complianceStandard: '', licenseKey: '', internalNotes: '',
    startDate: new Date().toISOString().split('T')[0], durationYears: 1, durationMonths: 0,
    renewalMode: 'Manual', alertDaysBefore: 30,
    vendorId: '', departmentId: '', employeeIds: []
  })
  const [assigned, setAssigned] = useState([])
  const STEPS = 5
  const labels = isRtl
    ? ['تفاصيل الرخصة', 'المدة والتواريخ', 'بيانات المورّد', 'الإدارة والمسؤول', 'المراجعة والحفظ']
    : ['License Details', 'Dates & Duration', 'Vendor Info', 'Dept. & Owner', 'Review & Save']

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const expiryDate = (() => {
    try {
      const d = new Date(form.startDate)
      d.setFullYear(d.getFullYear() + form.durationYears)
      d.setMonth(d.getMonth() + form.durationMonths)
      return d
    } catch { return null }
  })()
  const daysLeft = expiryDate ? Math.round((expiryDate - new Date()) / 864e5) : null

  const handleSave = () => {
    onSave({ ...form, employeeIds: assigned.map(e => e.id) })
  }

  const fi = (label, key, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 3 }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder} style={{ width: '100%', padding: '6px 8px', border: '.5px solid #e0ddd4', borderRadius: 5, fontSize: 11, outline: 'none', direction: isRtl ? 'rtl' : 'ltr' }} />
    </div>
  )
  const fsel = (label, key, opts) => (
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 3 }}>{label}</label>
      <select value={form[key]} onChange={e => set(key, e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '.5px solid #e0ddd4', borderRadius: 5, fontSize: 11, outline: 'none', background: 'white' }}>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div style={{ width: 360, flexShrink: 0, borderInlineStart: '.5px solid #e0ddd4', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Steps header */}
      <div style={{ padding: '11px 13px', borderBottom: '.5px solid #e0ddd4', background: '#faf9f5', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          {isRtl ? 'إضافة رخصة جديدة' : 'Add New License'}
          <button onClick={onClose} style={{ marginInlineStart: 'auto', width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#aaa' }}>×</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {labels.map((lbl, i) => (
            <>
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: i <= step ? 'pointer' : 'default' }} onClick={() => i <= step && setStep(i)}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, border: '.5px solid', zIndex: 2, position: 'relative',
                  background: i < step ? '#3B6D11' : i === step ? '#BA7517' : 'white',
                  borderColor: i < step ? '#3B6D11' : i === step ? '#BA7517' : '#ddd',
                  color: i <= step ? 'white' : '#aaa',
                  boxShadow: i === step ? '0 0 0 3px rgba(186,117,23,.15)' : 'none'
                }}>
                  {i < step ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
                </div>
                <div style={{ fontSize: 8, marginTop: 2, textAlign: 'center', color: i === step ? '#BA7517' : i < step ? '#3B6D11' : '#aaa', fontWeight: i === step ? 500 : 400 }}>{lbl}</div>
              </div>
              {i < STEPS - 1 && <div style={{ flex: 1, height: .5, background: i < step ? '#3B6D11' : '#ddd', position: 'relative', top: 12, zIndex: 1 }} />}
            </>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 13 }}>
        {step === 0 && <>
          <div style={{ fontSize: 9, color: '#aaa', marginBottom: 7, paddingBottom: 5, borderBottom: '.5px solid #f1efe8', fontWeight: 500, letterSpacing: .4 }}>{isRtl ? 'بيانات المنتج / الرخصة' : 'PRODUCT / LICENSE DETAILS'}</div>
          {fi(isRtl ? 'اسم المنتج *' : 'Product Name *', 'name', 'text', 'e.g. Microsoft 365')}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 3 }}>{isRtl ? 'وصف تفصيلي' : 'Description'}</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ width: '100%', padding: '6px 8px', border: '.5px solid #e0ddd4', borderRadius: 5, fontSize: 11, outline: 'none', resize: 'vertical', direction: isRtl ? 'rtl' : 'ltr' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {fsel(isRtl ? 'النوع *' : 'Type *', 'type', [{ value: 'sw', label: t('sw') }, { value: 'saas', label: t('saas') }, { value: 'hw', label: t('hw') }])}
            {fsel(isRtl ? 'نموذج الترخيص' : 'License Model', 'licenseModel', ['Per User', 'Per Device', 'Site License', 'Concurrent', 'Enterprise'].map(v => ({ value: v, label: v })))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {fi(isRtl ? 'عدد المقاعد' : 'Seats', 'seats', 'number')}
            {fi(isRtl ? 'التكلفة السنوية (ر.س)' : 'Annual Cost (SAR)', 'annualCost', 'number')}
          </div>
          {fsel(isRtl ? 'معيار الامتثال' : 'Compliance', 'complianceStandard', [{ value: '', label: '—' }, ...['NCA-ECC', 'ISO 27001', 'NDMO / نضيء', 'Digital Asset Mgmt.'].map(v => ({ value: v, label: v }))])}
          {fi(isRtl ? 'مفتاح التفعيل' : 'License Key', 'licenseKey', 'text', 'XXXX-XXXX-XXXX')}
        </>}

        {step === 1 && <>
          <div style={{ fontSize: 9, color: '#aaa', marginBottom: 7, paddingBottom: 5, borderBottom: '.5px solid #f1efe8', fontWeight: 500 }}>{isRtl ? 'المدة والتواريخ' : 'DURATION & DATES'}</div>
          {fi(isRtl ? 'تاريخ البداية *' : 'Start Date *', 'startDate', 'date')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {fsel(isRtl ? 'المدة — سنوات' : 'Duration — Years', 'durationYears', [0,1,2,3,4,5].map(v => ({ value: v, label: `${v} ${isRtl ? 'سنة' : 'yr'}` })))}
            {fsel(isRtl ? 'المدة — أشهر' : 'Duration — Months', 'durationMonths', Array.from({length:12},(_,i) => ({ value: i, label: `${i} ${isRtl ? 'شهر' : 'mo'}` })))}
          </div>
          {expiryDate && (
            <div style={{ background: daysLeft > 90 ? '#EAF3DE' : daysLeft >= 0 ? '#FAEEDA' : '#FCEBEB', border: `.5px solid ${daysLeft > 90 ? '#C0DD97' : daysLeft >= 0 ? '#FAC775' : '#F7C1C1'}`, borderRadius: 6, padding: '9px 11px', marginBottom: 9 }}>
              <div style={{ fontSize: 9, fontWeight: 500, color: daysLeft > 90 ? '#3B6D11' : daysLeft >= 0 ? '#BA7517' : '#A32D2D', marginBottom: 2 }}>{isRtl ? 'تاريخ الانتهاء المحسوب' : 'Calculated Expiry'}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: daysLeft > 90 ? '#3B6D11' : daysLeft >= 0 ? '#BA7517' : '#A32D2D' }}>{expiryDate.toLocaleDateString(isRtl ? 'ar-SA' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{form.durationYears * 12 + form.durationMonths} {isRtl ? 'شهر' : 'months'} — {daysLeft > 0 ? daysLeft + ' ' + t('days') + (isRtl ? ' متبقياً' : ' remaining') : isRtl ? 'منتهية' : 'expired'}</div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {fsel(isRtl ? 'نمط التجديد' : 'Renewal Mode', 'renewalMode', [['Manual', isRtl ? 'يدوي' : 'Manual'], ['Automatic', isRtl ? 'تلقائي' : 'Automatic'], ['Non-renewable', isRtl ? 'غير قابل للتجديد' : 'Non-renewable']].map(([v, l]) => ({ value: v, label: l })))}
            {fsel(isRtl ? 'تنبيه قبل (يوم)' : 'Alert Before (days)', 'alertDaysBefore', [30, 60, 90].map(v => ({ value: v, label: `${v} ${isRtl ? 'يوم' : 'days'}` })))}
          </div>
        </>}

        {step === 2 && <>
          <div style={{ fontSize: 9, color: '#aaa', marginBottom: 7, paddingBottom: 5, borderBottom: '.5px solid #f1efe8', fontWeight: 500 }}>{isRtl ? 'بيانات المورّد' : 'VENDOR INFO'}</div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 3 }}>{isRtl ? 'اختر مورّداً موجوداً' : 'Select Existing Vendor'}</label>
            <select value={form.vendorId} onChange={e => set('vendorId', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '.5px solid #e0ddd4', borderRadius: 5, fontSize: 11, outline: 'none', background: 'white' }}>
              <option value="">— {isRtl ? 'اختر' : 'Select'} —</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.country})</option>)}
            </select>
          </div>
          <div style={{ fontSize: 9, color: '#aaa', margin: '10px 0 7px', paddingBottom: 4, borderBottom: '.5px solid #f1efe8' }}>{isRtl ? 'أو أدخل مورّداً جديداً' : 'Or enter new vendor details'}</div>
          {fi(isRtl ? 'اسم الشركة' : 'Company Name', '_vendorName', 'text', 'Microsoft, Oracle...')}
          {fi('Email', '_vendorEmail', 'email', 'vendor@company.com')}
          {fi(isRtl ? 'الهاتف' : 'Phone', '_vendorPhone', 'text', '+966...')}
          {fi(isRtl ? 'رقم العقد' : 'Contract No.', '_vendorContract', 'text', 'VEND-2025-XXXX')}
        </>}

        {step === 3 && <>
          <div style={{ fontSize: 9, color: '#aaa', marginBottom: 7, paddingBottom: 5, borderBottom: '.5px solid #f1efe8', fontWeight: 500 }}>{isRtl ? 'الإدارة ومركز التكلفة' : 'DEPARTMENT & COST CENTER'}</div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 3 }}>{isRtl ? 'القسم المسؤول *' : 'Responsible Department *'}</label>
            <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '.5px solid #e0ddd4', borderRadius: 5, fontSize: 11, outline: 'none', background: 'white' }}>
              <option value="">—</option>
              {departments.map(d => <option key={d.id} value={d.id}>{isRtl ? d.nameAr : d.nameEn} ({d.costCenter})</option>)}
            </select>
          </div>
          <div style={{ fontSize: 9, color: '#aaa', margin: '10px 0 7px', paddingBottom: 4, borderBottom: '.5px solid #f1efe8', fontWeight: 500 }}>{isRtl ? 'ربط الرخصة بالموظفين' : 'ASSIGN EMPLOYEES'}</div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#888', marginBottom: 3 }}>{isRtl ? 'إضافة موظف مسؤول' : 'Add Responsible Employee'}</label>
            <select onChange={e => {
              const emp = employees.find(x => x.id === Number(e.target.value))
              if (emp && !assigned.find(a => a.id === emp.id)) setAssigned(p => [...p, emp])
              e.target.value = ''
            }} style={{ width: '100%', padding: '6px 8px', border: '.5px solid #e0ddd4', borderRadius: 5, fontSize: 11, outline: 'none', background: 'white' }}>
              <option value="">— {isRtl ? 'اختر موظفاً' : 'Select employee'} —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{isRtl ? e.nameAr : e.nameEn} — {isRtl ? e.roleAr : e.roleEn}</option>)}
            </select>
          </div>
          {assigned.map((emp, i) => (
            <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', background: '#faf9f5', border: '.5px solid #e0ddd4', borderRadius: 5, marginBottom: 5 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, color: '#BA7517' }}>
                {(isRtl ? emp.nameAr : emp.nameEn || emp.nameAr).split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10 }}>{isRtl ? emp.nameAr : emp.nameEn}</div>
                <div style={{ fontSize: 8, color: '#aaa' }}>{isRtl ? emp.roleAr : emp.roleEn}</div>
              </div>
              <button onClick={() => setAssigned(p => p.filter((_, j) => j !== i))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#aaa', fontSize: 13 }}>×</button>
            </div>
          ))}
          {!assigned.length && <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', padding: '10px 0' }}>{isRtl ? 'لم يُضف أي موظف' : 'No employees added'}</div>}
        </>}

        {step === 4 && <>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 11 }}>{isRtl ? 'مراجعة المعلومات قبل الحفظ' : 'Review all details before saving'}</div>
          {[
            { title: isRtl ? 'تفاصيل الرخصة' : 'LICENSE DETAILS', rows: [
              [isRtl ? 'المنتج' : 'Product', form.name],
              [isRtl ? 'النوع' : 'Type', t(form.type)],
              [isRtl ? 'المقاعد' : 'Seats', form.seats],
              [isRtl ? 'التكلفة/سنة' : 'Cost/yr', form.annualCost ? `${Number(form.annualCost).toLocaleString()} SAR` : '—'],
              [isRtl ? 'الامتثال' : 'Compliance', form.complianceStandard || '—'],
            ]},
            { title: isRtl ? 'التواريخ' : 'DATES', rows: [
              [isRtl ? 'البداية' : 'Start', form.startDate],
              [isRtl ? 'المدة' : 'Duration', `${form.durationYears} yr, ${form.durationMonths} mo`],
              [isRtl ? 'الانتهاء' : 'Expiry', expiryDate?.toLocaleDateString() || '—'],
            ]},
            { title: isRtl ? 'الإدارة' : 'DEPARTMENT', rows: [
              [isRtl ? 'القسم' : 'Dept', departments.find(d => d.id === Number(form.departmentId))?.[isRtl ? 'nameAr' : 'nameEn'] || '—'],
              [isRtl ? 'الموظفون' : 'Employees', assigned.map(e => isRtl ? e.nameAr : e.nameEn).join(', ') || '—'],
            ]},
          ].map(sec => (
            <div key={sec.title} style={{ background: '#faf9f5', border: '.5px solid #e0ddd4', borderRadius: 6, padding: '10px 11px', marginBottom: 9 }}>
              <div style={{ fontSize: 9, fontWeight: 500, color: '#BA7517', marginBottom: 5 }}>{sec.title}</div>
              {sec.rows.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '.5px solid #f1efe8', fontSize: 9 }}>
                  <span style={{ color: '#888' }}>{k}</span>
                  <span style={{ fontWeight: 500, textAlign: 'end' }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          ))}
        </>}
      </div>

      {/* Footer */}
      <div style={{ padding: '9px 13px', borderTop: '.5px solid #e0ddd4', display: 'flex', gap: 6, background: '#faf9f5', flexShrink: 0 }}>
        <button disabled={step === 0} onClick={() => setStep(s => s - 1)} style={{ padding: '7px 11px', border: '.5px solid #e0ddd4', borderRadius: 5, fontSize: 11, cursor: step === 0 ? 'default' : 'pointer', background: 'transparent', color: '#888', opacity: step === 0 ? .35 : 1 }}>
          {isRtl ? 'السابق' : 'Back'}
        </button>
        <button onClick={() => step < STEPS - 1 ? setStep(s => s + 1) : handleSave()} disabled={saving} style={{ flex: 1, padding: 7, background: saving ? '#ddd' : '#BA7517', color: 'white', border: 'none', borderRadius: 5, fontSize: 11, cursor: saving ? 'default' : 'pointer', fontWeight: 500 }}>
          {saving ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : step < STEPS - 1 ? (isRtl ? 'التالي' : 'Next') : (isRtl ? 'حفظ الرخصة' : 'Save License')}
        </button>
      </div>
    </div>
  )
}
