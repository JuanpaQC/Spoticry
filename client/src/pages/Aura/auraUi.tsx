const profileImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAYPjoxyS0xoFxk_Vsf-wAN8K4x7U-xuMydIS1R31GSgplUCOaJ1WgKHUcc0JM9OU99DBQXI7NRwcfho2Lg1DMpjfDNSPDkQSIzOsVTY3NkcWBrscuGPGYRmmtWWxTgMqY6YePnl7N0yMQa9gOjRHx9m06v5P6WIXY_uIf_hnI08TEiHS87r6ncx8YLKMfbDS1sHr9brHDn5YPSEMvhQHhLUFhReaFBERq435WtxKYBnbZkYI3g0gQjAhhDYHz8rQVmfpeFf_7H2wIr'

// Una sola fuente de verdad para la navegación principal de la app.
// Tanto la sidebar de desktop como la bottom nav de mobile leen de
// acá, así no hay forma de que las pantallas queden desincronizadas.
//
// Cada item:
//   key    → identificador único, también lo usa la pantalla activa
//            para resaltar el ítem correspondiente.
//   label  → texto visible.
//   icon   → nombre del Material Symbol.
//   screen → hash al que navega (lo que entiende parseHash en App.jsx).
const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: 'home', screen: 'menu' },
  { key: 'search', label: 'Search', icon: 'search', screen: 'search' },
  { key: 'library', label: 'Library', icon: 'library_music', screen: 'library' },
  { key: 'songs', label: 'Songs', icon: 'queue_music', screen: 'songs-admin' },
  { key: 'create', label: 'Create', icon: 'add_circle', screen: 'create-playlist' },
]

function Icon({ name, filled = false, className = '' }) {
  const style = filled
    ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
    : undefined

  return (
    <span className={`material-symbols-outlined ${className}`} style={style}>
      {name}
    </span>
  )
}

function ScreenLink({ screen, className = '', children, 'aria-label': ariaLabel }) {
  return (
    <a aria-label={ariaLabel} className={className} href={`#${screen}`}>
      {children}
    </a>
  )
}

// Sidebar de desktop. Recibe `activeKey` (ej: 'home', 'library', etc.)
// y resalta visualmente el item que coincide.
function AuraAppSidebar({ activeKey }) {
  return (
    <aside className="flex h-full w-64 flex-col gap-8 border-r border-white/10 bg-zinc-950/60 p-8 backdrop-blur-3xl">
      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => (
          <ScreenLink
            aria-label={`Go to ${item.label}`}
            className={`flex items-center gap-4 rounded-xl p-3 text-left text-sm font-medium tracking-wide transition-all ${
              activeKey === item.key
                ? 'bg-violet-500/10 text-violet-400'
                : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
            }`}
            key={item.key}
            screen={item.screen}
          >
            <Icon filled={activeKey === item.key} name={item.icon} />
            <span>{item.label}</span>
          </ScreenLink>
        ))}
      </nav>
    </aside>
  )
}

// Top bar de desktop. Antes tenía botones de notifications/settings sin
// función y un dropdown de perfil. Lo dejamos como un header simple
// con el logo a la izquierda y el avatar (decorativo) a la derecha.
function AuraDesktopTopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-white/10 bg-zinc-950/60 px-10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(139,92,246,0.05)]">
      <div className="text-2xl font-black uppercase tracking-[-0.06em] text-zinc-100">
        SPOTICRY
      </div>

      <div className="h-10 w-10 overflow-hidden rounded-full border border-violet-500/30">
        <img
          alt="User profile"
          className="h-full w-full object-cover"
          src={profileImage}
        />
      </div>
    </header>
  )
}

// Bottom nav de mobile. Mismo `NAV_ITEMS` que la sidebar.
// Recibe `active` con la key del item que está activo.
function AuraMobileBottomNav({ active }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-24 items-center justify-around border-t border-white/10 bg-zinc-950/80 px-8 backdrop-blur-xl shadow-[0_-10px_40px_rgba(139,92,246,0.1)]">
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === active
        return (
          <a
            aria-label={`Go to ${item.label}`}
            href={`#${item.screen}`}
            key={item.key}
            className={`flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-[0.22em] transition-all ${
              isActive
                ? 'scale-110 text-violet-500'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            <Icon className="mb-1" filled={isActive} name={item.icon} />
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}

export {
  AuraAppSidebar,
  AuraDesktopTopBar,
  AuraMobileBottomNav,
  Icon,
  ScreenLink,
  profileImage,
}
