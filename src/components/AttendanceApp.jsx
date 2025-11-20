import { useEffect, useMemo, useState } from 'react'
import { Calendar, Check, X, Clock, UserPlus, Plus, Save } from 'lucide-react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Section({ title, children, actions }) {
  return (
    <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-medium">{title}</h2>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {children}
    </section>
  )
}

function TextInput(props) {
  return (
    <input {...props} className={`w-full bg-slate-900/60 border border-slate-700 rounded px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 ${props.className||''}`} />
  )
}

function Select(props) {
  return (
    <select {...props} className={`w-full bg-slate-900/60 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 ${props.className||''}`} />
  )
}

function PrimaryButton({children, ...props}) {
  return <button {...props} className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded transition ${props.className||''}`}>{children}</button>
}

function SecondaryButton({children, ...props}) {
  return <button {...props} className={`inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white/90 px-3 py-2 rounded transition ${props.className||''}`}>{children}</button>
}

async function api(path, options={}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

function useFetch(path, deps=[]) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useEffect(() => {
    let active = true
    setLoading(true)
    api(path).then(d => { if(active){ setData(d); setLoading(false)} }).catch(e=>{ if(active){ setError(e); setLoading(false)} })
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { data, loading, error, refetch: ()=>api(path).then(setData) }
}

function YearManager({ onSelect }) {
  const { data: years, loading, refetch } = useFetch(`/api/years`, [])
  const [name, setName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const createYear = async () => {
    if(!name || !start || !end) return
    await api('/api/years', { method: 'POST', body: JSON.stringify({ name, start_date: start, end_date: end, is_active: true }) })
    setName(''); setStart(''); setEnd('');
    refetch()
  }

  return (
    <Section title="Academic Years" actions={
      <PrimaryButton onClick={createYear}><Plus className="w-4 h-4" />Add Year</PrimaryButton>
    }>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TextInput placeholder="e.g., 2024-2025" value={name} onChange={e=>setName(e.target.value)} />
        <TextInput type="date" value={start} onChange={e=>setStart(e.target.value)} />
        <TextInput type="date" value={end} onChange={e=>setEnd(e.target.value)} />
      </div>
      <div className="mt-4 grid gap-2">
        {loading ? <p className="text-slate-400 text-sm">Loading years...</p> : (
          (years||[]).map(y => (
            <button key={y._id} onClick={()=>onSelect(y)} className="w-full text-left bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded p-3 text-slate-200">
              <div className="font-medium">{y.name}</div>
              <div className="text-xs text-slate-400">{new Date(y.start_date).toLocaleDateString()} → {new Date(y.end_date).toLocaleDateString()}</div>
            </button>
          ))
        )}
      </div>
    </Section>
  )
}

function ClassManager({ year, onSelect }) {
  const { data: classes, loading, refetch } = useFetch(`/api/classes${year?`?year_id=${year._id}`:''}`, [year?._id])
  const [name, setName] = useState('')
  const [teacher, setTeacher] = useState('')

  const createClass = async () => {
    if(!year || !name) return
    await api('/api/classes', { method: 'POST', body: JSON.stringify({ name, teacher, year_id: String(year._id) }) })
    setName(''); setTeacher('');
    refetch()
  }

  return (
    <Section title="Classes / Sections" actions={<PrimaryButton onClick={createClass}><Plus className="w-4 h-4"/>Add Class</PrimaryButton>}>
      {!year ? (
        <p className="text-slate-400 text-sm">Select an academic year first.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextInput placeholder="e.g., Grade 10 A" value={name} onChange={e=>setName(e.target.value)} />
            <TextInput placeholder="Class teacher" value={teacher} onChange={e=>setTeacher(e.target.value)} />
          </div>
          <div className="mt-4 grid gap-2">
            {loading ? <p className="text-slate-400 text-sm">Loading classes...</p> : (
              (classes||[]).map(c => (
                <button key={c._id} onClick={()=>onSelect(c)} className="w-full text-left bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded p-3 text-slate-200">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-slate-400">Teacher: {c.teacher||'—'}</div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </Section>
  )
}

function StudentsManager({ year, classroom, onListReady }) {
  const { data: students, loading, refetch } = useFetch(`/api/students${classroom?`?class_id=${classroom._id}`: year?`?year_id=${year._id}`:''}`, [year?._id, classroom?._id])
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [roll, setRoll] = useState('')
  const addStudent = async () => {
    if(!year || !classroom || !first || !last || !roll) return
    await api('/api/students', { method: 'POST', body: JSON.stringify({ first_name:first, last_name:last, roll_number:roll, class_id:String(classroom._id), year_id:String(year._id) }) })
    setFirst(''); setLast(''); setRoll('');
    refetch()
  }

  useEffect(()=>{
    onListReady && onListReady(students||[])
  }, [students, onListReady])

  return (
    <Section title="Students" actions={<PrimaryButton onClick={addStudent}><UserPlus className="w-4 h-4"/>Add Student</PrimaryButton>}>
      {!year || !classroom ? (
        <p className="text-slate-400 text-sm">Select year and class first.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <TextInput placeholder="First name" value={first} onChange={e=>setFirst(e.target.value)} />
            <TextInput placeholder="Last name" value={last} onChange={e=>setLast(e.target.value)} />
            <TextInput placeholder="Roll number" value={roll} onChange={e=>setRoll(e.target.value)} />
          </div>
          <div className="mt-4 divide-y divide-slate-700">
            {(students||[]).map(s => (
              <div key={s._id} className="flex items-center justify-between py-2 text-slate-200">
                <div>
                  <div className="font-medium">{s.roll_number}. {s.first_name} {s.last_name}</div>
                  <div className="text-xs text-slate-400">ID: {s._id}</div>
                </div>
              </div>
            ))}
            {loading && <p className="text-slate-400 text-sm">Loading students...</p>}
          </div>
        </>
      )}
    </Section>
  )
}

function AttendanceSheet({ year, classroom, students }) {
  const [dateStr, setDateStr] = useState(()=> new Date().toISOString().slice(0,10))
  const [marks, setMarks] = useState({})
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const setStatus = (sid, status) => setMarks(m => ({ ...m, [sid]: status }))

  useEffect(()=>{
    if(!year || !classroom) return
    setLoaded(false)
    api(`/api/attendance?year_id=${year._id}&class_id=${classroom._id}&date=${dateStr}`)
      .then(data => {
        const map = {}
        if(data && data.entries){
          for(const e of data.entries){ map[e.student_id] = e.status }
        }
        setMarks(map)
        setLoaded(true)
      }).catch(()=> setLoaded(true))
  }, [year?._id, classroom?._id, dateStr])

  const save = async () => {
    if(!year || !classroom) return
    setSaving(true)
    const entries = Object.entries(marks).map(([student_id, status]) => ({ student_id, status }))
    await api('/api/attendance', { method: 'POST', body: JSON.stringify({ year_id:String(year._id), class_id:String(classroom._id), date: dateStr, entries }) })
    setSaving(false)
  }

  return (
    <Section title="Daily Attendance" actions={<PrimaryButton onClick={save} disabled={saving}><Save className="w-4 h-4"/>Save</PrimaryButton>}>
      {!year || !classroom ? <p className="text-slate-400 text-sm">Select year and class first.</p> : (
        <>
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-4 h-4 text-slate-300" />
            <input type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)} className="bg-slate-900/60 border border-slate-700 rounded px-3 py-2 text-slate-200" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-slate-300">
                  <th className="text-left py-2">Roll</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.map(s => (
                  <tr key={s._id} className="text-slate-200">
                    <td className="py-2">{s.roll_number}</td>
                    <td className="py-2">{s.first_name} {s.last_name}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {['present','absent','late','excused'].map(st => (
                          <button key={st} onClick={()=>setStatus(s._id, st)} className={`px-2 py-1 rounded border ${marks[s._id]===st? 'bg-blue-600 text-white border-blue-500':'bg-slate-900/50 border-slate-700 text-slate-300'}`}>{st}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loaded && <p className="text-slate-400 text-sm mt-2">Loading existing attendance...</p>}
        </>
      )}
    </Section>
  )
}

export default function AttendanceApp(){
  const [year, setYear] = useState(null)
  const [klass, setKlass] = useState(null)
  const [students, setStudents] = useState([])

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <YearManager onSelect={setYear} />
        <ClassManager year={year} onSelect={setKlass} />
      </div>
      <StudentsManager year={year} classroom={klass} onListReady={setStudents} />
      <AttendanceSheet year={year} classroom={klass} students={students} />
    </div>
  )
}
