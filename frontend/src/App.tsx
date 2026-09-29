import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BookOpen, Disc3, LayoutDashboard, Plus, Search, LogOut, LibraryBig, LockKeyhole, Globe2, X, ArrowRight, Star, Menu, Trash2, Check, ScanLine } from 'lucide-react';
import { request, type Entry, type Kind, type NewItem, type User } from './api';

type View = 'overview' | 'books' | 'vinyl' | 'public';
const emptyItem: NewItem = { kind: 'book', title: '', creator: '', identifier: null, cover_url: null, year: null, description: '' };
function App() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('mbn_token'));
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [view, setView] = useState<View>('overview');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [item, setItem] = useState<NewItem>(emptyItem);
  const [status, setStatus] = useState('owned');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [publicName, setPublicName] = useState('');
  const [publicEntries, setPublicEntries] = useState<Entry[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selected, setSelected] = useState<Entry | null>(null);

  async function refresh(t: string) {
    const [me, collection] = await Promise.all([request<User>('/users/me', t), request<Entry[]>('/collection', t)]);
    setUser(me); setEntries(collection);
  }
  useEffect(() => {
    if (!token) return;
    refresh(token).catch(() => { sessionStorage.removeItem('mbn_token'); setToken(null); setUser(null); });
  }, [token]);
  function logout() { sessionStorage.removeItem('mbn_token'); setToken(null); setUser(null); setEntries([]); setView('overview'); }
  const filtered = useMemo(() => entries.filter(e => (view === 'overview' || (view === 'books' ? e.item.kind === 'book' : e.item.kind === 'vinyl')) && `${e.item.title} ${e.item.creator}`.toLowerCase().includes(search.toLowerCase())), [entries, search, view]);
  const books = entries.filter(e => e.item.kind === 'book').length;
  const vinyl = entries.filter(e => e.item.kind === 'vinyl').length;
  async function addItem(e: FormEvent) {
    e.preventDefault(); if (!token) return; setBusy(true); setError('');
    try {
      await request<Entry>('/collection', token, { method: 'POST', body: JSON.stringify({ item: { ...item, identifier: item.identifier || null }, status, visibility }) });
      await refresh(token); setAddOpen(false); setItem(emptyItem); setStatus('owned');
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function updateEntry(id: string, changes: object) {
    if (!token) return;
    try { await request<Entry>(`/collection/${id}`, token, { method: 'PATCH', body: JSON.stringify(changes) }); await refresh(token); setSelected(null); }
    catch (err) { setError((err as Error).message); }
  }
  async function removeEntry(id: string) {
    if (!token || !window.confirm('Remove this item from your collection?')) return;
    try { await request<void>(`/collection/${id}`, token, { method: 'DELETE' }); await refresh(token); setSelected(null); }
    catch (err) { setError((err as Error).message); }
  }
  async function findPublic(e: FormEvent) {
    e.preventDefault(); setError('');
    try { setPublicEntries(await request<Entry[]>(`/users/${encodeURIComponent(publicName.trim())}/collection`, null)); }
    catch (err) { setPublicEntries([]); setError((err as Error).message); }
  }
  if (!token) return <Auth onLogin={t => { sessionStorage.setItem('mbn_token', t); setToken(t); }} />;
  const cards = view === 'public' ? publicEntries : filtered;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><BookOpen size={21}/></div><span>mybooknook<span className="brand-dot">.</span></span></div>
      <div className="nav-caption">YOUR SPACE</div>
      <nav>
        <button className={`nav-item ${view === 'overview' ? 'active' : ''}`} onClick={() => {setView('overview'); setMobileMenu(false);}}><LayoutDashboard size={19}/> Overview</button>
        <button className={`nav-item ${view === 'books' ? 'active' : ''}`} onClick={() => {setView('books'); setMobileMenu(false);}}><BookOpen size={19}/> My books <span className="nav-count">{books}</span></button>
        <button className={`nav-item ${view === 'vinyl' ? 'active' : ''}`} onClick={() => {setView('vinyl'); setMobileMenu(false);}}><Disc3 size={19}/> My vinyl <span className="nav-count">{vinyl}</span></button>
      </nav>
      <div className="nav-caption discover-caption">DISCOVER</div>
      <nav><button className={`nav-item ${view === 'public' ? 'active' : ''}`} onClick={() => {setView('public'); setMobileMenu(false);}}><Globe2 size={19}/> Public collections</button></nav>
      <div className="sidebar-bottom"><div className="avatar">{user?.username.slice(0, 1).toUpperCase() || 'U'}</div><div className="account"><strong>{user?.username}</strong><span>My collection</span></div><button className="icon-button" title="Log out" onClick={logout}><LogOut size={18}/></button></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="icon-button menu-button" aria-label="Toggle navigation" onClick={() => setMobileMenu(!mobileMenu)}><Menu/></button><div className="breadcrumb">MyBookNook <span>/</span> {view === 'overview' ? 'Overview' : view === 'books' ? 'My books' : view === 'vinyl' ? 'My vinyl' : 'Public collections'}</div><div className="top-actions"><span className="online-pill"><span/> Your space, your NOOK</span><div className="avatar avatar-small">{user?.username.slice(0, 1).toUpperCase()}</div></div></header>
      <div className="page">
{view === 'overview' ? (
  <section className="hero">
    <div className="hero-copy">
      <div className="eyebrow">MYBOOKNOOK</div>
      <h1>
        Your books and records,
        <br />
        <em>all in one place.</em>
      </h1>
      <p>
        Keep track of what you own, what you're reading or listening to,
        and what you'd like to add next.
      </p>
      <button
        className="primary-btn hero-btn"
        onClick={() => {
          setError('');
          setAddOpen(true);
        }}
      >
        <Plus size={18} />
        Add to collection
        <ArrowRight size={17} />
      </button>
    </div>

    <div className="hero-art" aria-hidden="true">
      <div className="art-circle" />
      <div className="art-book art-book-one" />
      <div className="art-book art-book-two" />
      <div className="art-book art-book-three" />
      <div className="art-vinyl">
        <div />
      </div>
      <div className="art-spark">✦</div>
    </div>
  </section>
) : (
  <div className="section-intro">
    <div className="eyebrow">MYBOOKNOOK</div>
    <h1>
      {view === 'books'
        ? 'Your books'
        : view === 'vinyl'
          ? 'Your records'
          : 'Public collections'}
    </h1>
    <p>
      {view === 'public'
        ? 'Browse books and records shared by other collectors.'
        : 'Browse, organize, and update your collection.'}
    </p>
  </div>
)}
{view === 'overview' && <div className="stats"><div className="stat-card"><div className="stat-icon icon-book"><BookOpen size={22}/></div><div><span>Books collected</span><strong>{books}</strong><small>Your personal bookshelf</small></div></div><div className="stat-card"><div className="stat-icon icon-vinyl"><Disc3 size={22}/></div><div><span>Vinyl collected</span><strong>{vinyl}</strong><small>Records in your rotation</small></div></div><div className="stat-card"><div className="stat-icon icon-total"><LibraryBig size={22}/></div><div><span>Total treasures</span><strong>{entries.length}</strong><small>Stories & sounds together</small></div></div></div>}
        <section className="collection-section"><div className="section-head"><div><div className="eyebrow">{view === 'public' ? 'EXPLORE' : 'YOUR LIBRARY'}</div><h2>{view === 'overview' ? 'Your collection' : view === 'books' ? 'Books' : view === 'vinyl' ? 'Vinyl records' : 'Shared shelves'}</h2><p>{view === 'public' ? 'Only public items are visible here.' : 'All your favorites, right where they belong.'}</p></div>{view !== 'public' && <button className="outline-btn" onClick={() => {setError(''); setItem({...emptyItem, kind: view === 'vinyl' ? 'vinyl' : 'book'}); setAddOpen(true);}}><Plus size={17}/> Add item</button>}</div>
          {view === 'public' ? <form className="search-row" onSubmit={findPublic}><div className="search-box"><Search size={18}/><input placeholder="Enter a username to explore..." value={publicName} onChange={e => setPublicName(e.target.value)}/></div><button className="primary-btn" type="submit">Explore</button></form> : <div className="search-row"><div className="search-box"><Search size={18}/><input placeholder="Search your collection..." value={search} onChange={e => setSearch(e.target.value)}/></div><div className="item-total">{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</div></div>}
          {error && <div className="error-banner" role="alert">{error}</div>}
          {cards.length ? <div className="item-grid">{cards.map(e => <button className="item-card" key={e.id} onClick={() => setSelected(e)}><div className={`cover ${e.item.kind === 'vinyl' ? 'vinyl-cover' : ''}`}>{e.item.cover_url ? <img src={e.item.cover_url} alt="" loading="lazy"/> : e.item.kind === 'book' ? <BookOpen size={42}/> : <Disc3 size={50}/>}<span className="cover-kind">{e.item.kind}</span></div><div className="item-meta"><strong>{e.item.title}</strong><span>{e.item.creator || 'Unknown creator'}</span><small>{e.visibility === 'public' ? <Globe2 size={12}/> : <LockKeyhole size={12}/>} {e.status}</small></div></button>)}</div> : <div className="empty-state"><div className="empty-icon">{view === 'vinyl' ? <Disc3 size={34}/> : <BookOpen size={34}/>}</div><h3>{view === 'public' ? 'No public items to show yet' : search ? 'Nothing matches your search' : 'Your collection starts here'}</h3><p>{view === 'public' ? 'Enter a username to view their shared collection.' : search ? 'Try a different title or creator.' : 'Add your first book or vinyl record to make this space your own.'}</p>{view !== 'public' && !search && <button className="primary-btn" onClick={() => {setError(''); setAddOpen(true);}}><Plus size={17}/> Add your first item</button>}</div>}
        </section>
      </div>
    </main>
    {addOpen && <div className="modal-backdrop" onMouseDown={e => {if(e.target === e.currentTarget) setAddOpen(false);}}><form className="modal" onSubmit={addItem}><div className="modal-header"><div><div className="eyebrow">GROW YOUR COLLECTION</div><h2>Add an item</h2></div><button type="button" className="icon-button" onClick={() => setAddOpen(false)}><X/></button></div><div className="type-switch"><button type="button" className={item.kind === 'book' ? 'chosen' : ''} onClick={() => setItem({...item, kind: 'book'})}><BookOpen size={17}/> Book</button><button type="button" className={item.kind === 'vinyl' ? 'chosen' : ''} onClick={() => setItem({...item, kind: 'vinyl'})}><Disc3 size={17}/> Vinyl</button></div><label>Title<input required maxLength={300} value={item.title} onChange={e => setItem({...item, title: e.target.value})} placeholder={item.kind === 'book' ? 'e.g. The Hobbit' : 'e.g. Rumours'}/></label><label>{item.kind === 'book' ? 'Author' : 'Artist'}<input value={item.creator} onChange={e => setItem({...item, creator: e.target.value})} placeholder={item.kind === 'book' ? 'e.g. J.R.R. Tolkien' : 'e.g. Fleetwood Mac'}/></label><div className="form-grid"><label>{item.kind === 'book' ? 'ISBN' : 'UPC / EAN'}<input value={item.identifier || ''} onChange={e => setItem({...item, identifier: e.target.value})} placeholder="Optional"/></label><label>Year<input type="number" min="1400" max="2200" value={item.year ?? ''} onChange={e => setItem({...item, year: e.target.value ? Number(e.target.value) : null})} placeholder="Optional"/></label></div><label>Cover image URL<input type="url" value={item.cover_url || ''} onChange={e => setItem({...item, cover_url: e.target.value || null})} placeholder="https://..."/></label><div className="form-grid"><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="owned">Owned</option><option value="wishlist">Wishlist</option>{item.kind === 'book' ? <><option value="reading">Reading</option><option value="finished">Finished</option></> : <option value="listening">Listening</option>}</select></label><label>Visibility<select value={visibility} onChange={e => setVisibility(e.target.value as 'private' | 'public')}><option value="private">Private</option><option value="public">Public</option></select></label></div><div className="scanner-note"><ScanLine size={17}/> Barcode scanning is planned for the next milestone. Enter an ISBN or UPC manually for now.</div>{error && <div className="error-banner" role="alert">{error}</div>}<button className="primary-btn full-btn" disabled={busy} type="submit">{busy ? 'Saving...' : 'Add to my collection'} <ArrowRight size={17}/></button></form></div>}
    {selected && <div className="modal-backdrop" onMouseDown={e => {if(e.target === e.currentTarget) setSelected(null);}}><div className="modal detail-modal"><div className="modal-header"><div><div className="eyebrow">{selected.item.kind.toUpperCase()}</div><h2>{selected.item.title}</h2><p>{selected.item.creator}</p></div><button className="icon-button" onClick={() => setSelected(null)}><X/></button></div><div className="detail-cover">{selected.item.cover_url ? <img src={selected.item.cover_url} alt=""/> : selected.item.kind === 'book' ? <BookOpen size={42}/> : <Disc3 size={42}/>}</div><div className="detail-fields"><span>Year: {selected.item.year || '—'}</span><span>Identifier: {selected.item.identifier || '—'}</span></div>{view !== 'public' && <><div className="form-grid"><label>Status<select value={selected.status} onChange={e => setSelected({...selected, status: e.target.value})}><option value="owned">Owned</option><option value="wishlist">Wishlist</option>{selected.item.kind === 'book' ? <><option value="reading">Reading</option><option value="finished">Finished</option></> : <option value="listening">Listening</option>}</select></label><label>Visibility<select value={selected.visibility} onChange={e => setSelected({...selected, visibility: e.target.value as 'private' | 'public'})}><option value="private">Private</option><option value="public">Public</option></select></label></div><label>Rating <span className="rating-label"><Star size={14}/> 1–5</span><select value={selected.rating ?? ''} onChange={e => setSelected({...selected, rating: e.target.value ? Number(e.target.value) : null})}><option value="">Not rated</option>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>)}</select></label><label>Review<textarea rows={3} maxLength={5000} value={selected.review} onChange={e => setSelected({...selected, review: e.target.value})} placeholder="What did you think?"/></label><div className="detail-actions"><button className="delete-btn" onClick={() => removeEntry(selected.id)}><Trash2 size={16}/> Remove</button><button className="primary-btn" onClick={() => updateEntry(selected.id, {status: selected.status, visibility: selected.visibility, rating: selected.rating, review: selected.review})}><Check size={16}/> Save changes</button></div></>}{view === 'public' && selected.review && <p className="public-review">{selected.review}</p>}</div></div>}
  </div>;
}
function Auth({onLogin}: {onLogin: (token: string) => void}) {
  const [register, setRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (register) await request<User>('/auth/register', null, {method: 'POST', body: JSON.stringify({username, email, password})});
      const result = await request<{access_token: string}>('/auth/login', null, {method: 'POST', body: JSON.stringify({email, password})});
      onLogin(result.access_token);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return <div className="auth-page"><div className="auth-visual"><div className="brand auth-brand"><div className="brand-mark"><BookOpen size={21}/></div><span>mybooknook<span className="brand-dot">.</span></span></div><div className="auth-illustration"><div className="auth-book one"/><div className="auth-book two"/><div className="auth-book three"/><div className="auth-record"><div/></div></div><div className="auth-quote">Your books and records<br/>all in one place.</div><p>Sign in to manage your collection, keep track of what you’re reading and listening to, and see what other collectors are sharing.</p></div><div className="auth-panel"><div className="auth-card"><div className="eyebrow">WELCOME TO YOUR NOOK</div><h1>{register ? 'Create your nook.' : 'Welcome back.'}</h1><p>{register ? 'Build your library of your favorite books and records.' : 'Your personal library awaits.'}</p><form onSubmit={submit}>{register && <label>Username<input required minLength={3} maxLength={40} pattern="[a-zA-Z0-9_]+" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username"/></label>}<label>Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input required type="password" minLength={register ? 10 : undefined} autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"/></label>{error && <div className="error-banner" role="alert">{error}</div>}<button className="primary-btn full-btn" disabled={busy}>{busy ? 'One moment...' : register ? 'Create account' : 'Sign in'} <ArrowRight size={18}/></button></form><div className="auth-toggle">{register ? 'Already have an account?' : 'New to MyBookNook?'} <button onClick={() => {setRegister(!register); setError('');}}>{register ? 'Sign in' : 'Create an account'}</button></div></div></div></div>;
}
export default App;
