import { NavLink } from 'react-router-dom'

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'h-16 flex items-center px-1 border-b-2 transition-colors',
    isActive
      ? 'text-primary border-primary'
      : 'text-on-surface-variant border-transparent hover:bg-surface-container-high',
  ].join(' ')

export function TopNav() {
  return (
    <header className="z-50 flex w-full shrink-0 flex-col border-b border-outline-variant/15 bg-surface-container text-sm tracking-tight text-primary">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-lg font-bold tracking-tighter font-headline text-primary sm:text-xl">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            ac_unit
          </span>
          <span className="truncate">GlacierGuard</span>
        </div>
        <nav className="mx-2 hidden min-w-0 flex-1 items-center justify-center gap-4 overflow-x-auto font-headline md:flex md:gap-6">
          <NavLink to="/" className={navClass} end>
            Dashboard
          </NavLink>
          <NavLink to="/inventory" className={navClass}>
            Lake inventory
          </NavLink>
          <NavLink to="/alerts" className={navClass}>
            Alert log
          </NavLink>
          <NavLink to="/replay" className={navClass}>
            Historical replay
          </NavLink>
          <NavLink to="/resources" className={navClass}>
            Context
          </NavLink>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="hidden text-right lg:block">
            <div className="font-medium leading-none text-primary">NDRF Operator</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">2 min ago</div>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <button
              type="button"
              className="rounded p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
              aria-label="Settings"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button
              type="button"
              className="rounded p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
              aria-label="Log out"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-outline-variant/10 px-2 py-1.5 font-headline text-[11px] md:hidden">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `shrink-0 rounded px-2 py-1 ${isActive ? 'bg-primary/20 text-primary' : 'text-on-surface-variant'}`
          }
          end
        >
          Dash
        </NavLink>
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `shrink-0 rounded px-2 py-1 ${isActive ? 'bg-primary/20 text-primary' : 'text-on-surface-variant'}`
          }
        >
          Lakes
        </NavLink>
        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            `shrink-0 rounded px-2 py-1 ${isActive ? 'bg-primary/20 text-primary' : 'text-on-surface-variant'}`
          }
        >
          Alerts
        </NavLink>
        <NavLink
          to="/replay"
          className={({ isActive }) =>
            `shrink-0 rounded px-2 py-1 ${isActive ? 'bg-primary/20 text-primary' : 'text-on-surface-variant'}`
          }
        >
          Replay
        </NavLink>
        <NavLink
          to="/resources"
          className={({ isActive }) =>
            `shrink-0 rounded px-2 py-1 ${isActive ? 'bg-primary/20 text-primary' : 'text-on-surface-variant'}`
          }
        >
          Context
        </NavLink>
      </nav>
    </header>
  )
}
