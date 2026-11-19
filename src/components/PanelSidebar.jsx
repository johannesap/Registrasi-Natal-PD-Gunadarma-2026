import React, { useState } from 'react';
import { KeyRound, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

// Icon over label in the phone top bar, icon beside label in the desktop sidebar
const itemClass =
  'flex flex-col md:flex-row items-center gap-1 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-[10px] md:text-[15px] font-medium text-center md:text-left transition-colors cursor-pointer';
const idle = 'text-gray-300 hover:bg-white/5 hover:text-white';

// Panitia sidebar: brand, the page's views (items: [{ id, label, icon }]), account actions at the bottom.
// On desktop it runs the full screen height and can shrink to icons; on phones it is a bar above the content.
export default function PanelSidebar({ items, current, onSelect, onChangePassword, onLogout }) {
  const [small, setSmall] = useState(false);

  const item = (key, Icon, text, onClick, active = false) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      title={small ? text : undefined}
      aria-current={active ? 'page' : undefined}
      className={`${itemClass} ${small ? 'md:justify-center' : ''} ${active ? 'bg-amber-400/15 text-amber-100' : idle}`}
    >
      <Icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
      <span className={small ? 'md:sr-only' : ''}>{text}</span>
    </button>
  );

  return (
    <aside
      className={`md:sticky md:top-0 md:h-screen md:shrink-0 flex flex-col bg-emerald-950/90 border-b md:border-b-0 md:border-r border-white/10 md:transition-[width] md:duration-200 ${
        small ? 'md:w-[4.5rem]' : 'md:w-64'
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3.5 md:py-6 ${small ? 'md:flex-col md:px-0' : 'md:px-5'}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center font-['Cinzel'] font-bold text-sm text-neutral-950 shrink-0">
          PD
        </div>
        <div className={`min-w-0 flex-1 ${small ? 'md:hidden' : ''}`}>
          <div className="font-['Cinzel'] font-bold text-white tracking-wide leading-tight">NATAL PD UG</div>
          <div className="text-xs text-emerald-300">Portal Panitia 2026</div>
        </div>
        <button
          type="button"
          onClick={() => setSmall((v) => !v)}
          aria-label={small ? 'Perbesar sidebar' : 'Perkecil sidebar'}
          title={small ? 'Perbesar sidebar' : 'Perkecil sidebar'}
          className="hidden md:flex p-1.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer"
        >
          {small ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      <nav className="grid grid-flow-col auto-cols-fr gap-1 px-2 pb-2 md:flex md:flex-col md:flex-1 md:px-3 md:pb-0">
        {items.map(({ id, label, icon }) => item(id, icon, label, () => onSelect(id), current === id))}
        <div className="contents md:flex md:flex-col md:gap-1 md:mt-auto md:-mx-3 md:px-3 md:py-3 md:border-t md:border-white/10">
          {item('password', KeyRound, 'Ganti Password', onChangePassword)}
          {item('logout', LogOut, 'Logout', onLogout)}
        </div>
      </nav>
    </aside>
  );
}
