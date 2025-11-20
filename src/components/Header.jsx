import { School } from 'lucide-react'

function Header() {
  return (
    <header className="sticky top-0 z-10 bg-slate-900/70 backdrop-blur border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/20">
          <School className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-white font-semibold leading-tight">Class Attendance</h1>
          <p className="text-xs text-slate-400 -mt-0.5">Manage years, classes, students, and daily attendance</p>
        </div>
      </div>
    </header>
  )
}

export default Header
