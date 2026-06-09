'use client'

import { Bell, HelpCircle, Search } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  placeholder?: string
}

export function Header({ placeholder = 'Buscar pacientes, exames ou médicos...' }: HeaderProps) {
  const [query, setQuery] = useState('')

  return (
    <header className="h-[60px] bg-white border-b border-[#E5E7EB] flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2 text-[13px] border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-[#9CA3AF]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button className="relative w-9 h-9 rounded-lg hover:bg-[#F0F2FF] flex items-center justify-center text-[#444654] transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>
        <button className="w-9 h-9 rounded-lg hover:bg-[#F0F2FF] flex items-center justify-center text-[#444654] transition-colors">
          <HelpCircle size={18} />
        </button>
        <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#444654]">
          <Search size={16} />
        </div>
      </div>
    </header>
  )
}
