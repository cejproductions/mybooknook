import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import {
  ArrowRight,
  BookOpen,
  Check,
  Disc3,
  Globe2,
  LayoutDashboard,
  LibraryBig,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  ScanLine,
  Search,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import {
  request,
  type CollectionStatus,
  type Entry,
  type NewItem,
  type PublicEntry,
  type Rating,
  type ReadingStatus,
  type Review,
  type User,
  type Visibility,
} from './api';


type View = 'overview' | 'books' | 'vinyl' | 'public';

type SelectedEntry = Entry | PublicEntry;


const emptyItem: NewItem = {
  kind: 'book',
  title: '',
  creator: '',
  identifier: null,
  cover_url: null,
  year: null,
  description: '',
  edition: null,
  publisher_label: null,
  catalog_number: null,
  special_edition: false,
};


function visibilityIcon(visibility: Visibility) {
  if (visibility === 'public') {
    return <Globe2 size={12} />;
  }

  if (visibility === 'friends') {
    return <Users size={12} />;
  }

  return <LockKeyhole size={12} />;
}


function formatReadingStatus(status: ReadingStatus | null) {
  if (!status) {
    return 'Not set';
  }

  if (status === 'in_progress') {
    return 'In progress';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}


function App() {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('mbn_token'),
  );

  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [view, setView] = useState<View>('overview');

  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [item, setItem] = useState<NewItem>(emptyItem);

  const [status, setStatus] =
    useState<CollectionStatus>('owned');

  const [visibility, setVisibility] =
    useState<Visibility>('private');

  const [readingStatus, setReadingStatus] =
    useState<ReadingStatus | null>(null);

  const [personalNotes, setPersonalNotes] = useState('');
  const [acquiredAt, setAcquiredAt] = useState('');

  const [publicName, setPublicName] = useState('');
  const [publicEntries, setPublicEntries] =
    useState<PublicEntry[]>([]);

  const [mobileMenu, setMobileMenu] = useState(false);

  const [selected, setSelected] =
    useState<SelectedEntry | null>(null);

  const [selectedRating, setSelectedRating] =
    useState<number | null>(null);

  const [selectedReview, setSelectedReview] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);


  async function refresh(t: string) {
    const [me, collection] = await Promise.all([
      request<User>('/users/me', t),
      request<Entry[]>('/collection', t),
    ]);

    setUser(me);
    setEntries(collection);
  }


  useEffect(() => {
    if (!token) {
      return;
    }

    refresh(token).catch(() => {
      sessionStorage.removeItem('mbn_token');
      setToken(null);
      setUser(null);
    });
  }, [token]);


  function logout() {
    sessionStorage.removeItem('mbn_token');

    setToken(null);
    setUser(null);
    setEntries([]);
    setPublicEntries([]);
    setSelected(null);
    setView('overview');
  }


  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const correctView =
        view === 'overview' ||
        (view === 'books' && entry.item.kind === 'book') ||
        (view === 'vinyl' && entry.item.kind === 'vinyl');

      const haystack = [
        entry.item.title,
        entry.item.creator,
        entry.item.identifier ?? '',
        entry.item.edition ?? '',
        entry.item.publisher_label ?? '',
        entry.item.catalog_number ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return (
        correctView &&
        haystack.includes(search.trim().toLowerCase())
      );
    });
  }, [entries, search, view]);


  const books =
    entries.filter((entry) => entry.item.kind === 'book').length;

  const vinyl =
    entries.filter((entry) => entry.item.kind === 'vinyl').length;


  function resetAddForm(kind: 'book' | 'vinyl' = 'book') {
    setItem({
      ...emptyItem,
      kind,
    });

    setStatus('owned');
    setVisibility('private');
    setReadingStatus(null);
    setPersonalNotes('');
    setAcquiredAt('');
    setError('');
  }


  function openAdd(kind?: 'book' | 'vinyl') {
    const targetKind =
      kind ?? (view === 'vinyl' ? 'vinyl' : 'book');

    resetAddForm(targetKind);
    setAddOpen(true);
  }


  function duplicateExists(newItem: NewItem) {
    const identifier = newItem.identifier?.trim().toLowerCase();

    if (identifier) {
      return entries.some(
        (entry) =>
          entry.item.kind === newItem.kind &&
          entry.item.identifier?.trim().toLowerCase() === identifier,
      );
    }

    const title = newItem.title.trim().toLowerCase();
    const creator = newItem.creator.trim().toLowerCase();

    return entries.some(
      (entry) =>
        entry.item.kind === newItem.kind &&
        entry.item.title.trim().toLowerCase() === title &&
        entry.item.creator.trim().toLowerCase() === creator,
    );
  }


  async function addItem(event: FormEvent) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const normalizedItem: NewItem = {
      ...item,
      title: item.title.trim(),
      creator: item.creator.trim(),
      identifier: item.identifier?.trim() || null,
      cover_url: item.cover_url?.trim() || null,
      description: item.description.trim(),
      edition: item.edition?.trim() || null,
      publisher_label: item.publisher_label?.trim() || null,
      catalog_number: item.catalog_number?.trim() || null,
    };

    if (
      duplicateExists(normalizedItem) &&
      !window.confirm(
        'You already have this title in your collection. Add another copy?',
      )
    ) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      await request<Entry>('/collection', token, {
        method: 'POST',
        body: JSON.stringify({
          item: normalizedItem,
          status,
          visibility,
          reading_status:
            normalizedItem.kind === 'book'
              ? readingStatus
              : null,
          personal_notes: personalNotes.trim(),
          acquired_at: acquiredAt
            ? new Date(`${acquiredAt}T12:00:00`).toISOString()
            : null,
        }),
      });

      await refresh(token);

      setAddOpen(false);
      resetAddForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }



  async function removeEntry(id: string) {
    if (
      !token ||
      !window.confirm(
        'Remove this item from your collection?',
      )
    ) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      await request<void>(
        `/collection/${id}`,
        token,
        {
          method: 'DELETE',
        },
      );

      await refresh(token);
      setSelected(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }


  async function findPublic(event: FormEvent) {
    event.preventDefault();

    const username = publicName.trim();

    if (!username) {
      return;
    }

    setError('');

    try {
      const result = await request<PublicEntry[]>(
        `/users/${encodeURIComponent(username)}/collection`,
        null,
      );

      setPublicEntries(result);
    } catch (err) {
      setPublicEntries([]);
      setError((err as Error).message);
    }
  }


  async function openEntry(
    entry: SelectedEntry,
    isPublic: boolean,
  ) {
    setSelected(entry);
    setSelectedRating(null);
    setSelectedReview('');
    setError('');

    if (isPublic || !token) {
      return;
    }

    setDetailLoading(true);

    try {
      const [ratingResult, reviewResult] =
        await Promise.allSettled([
          request<Rating>(
            `/catalog/${entry.item.id}/rating`,
            token,
          ),
          request<Review>(
            `/catalog/${entry.item.id}/review`,
            token,
          ),
        ]);

      if (ratingResult.status === 'fulfilled') {
        setSelectedRating(ratingResult.value.stars);
      }

      if (reviewResult.status === 'fulfilled') {
        setSelectedReview(reviewResult.value.body);
      }
    } finally {
      setDetailLoading(false);
    }
  }


  async function saveRating() {
    if (!token || !selected || view === 'public') {
      return;
    }

    setBusy(true);
    setError('');

    try {
      if (selectedRating === null) {
        await request<void>(
          `/catalog/${selected.item.id}/rating`,
          token,
          {
            method: 'DELETE',
          },
        );
      } else {
        await request<Rating>(
          `/catalog/${selected.item.id}/rating`,
          token,
          {
            method: 'PUT',
            body: JSON.stringify({
              stars: selectedRating,
            }),
          },
        );
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setBusy(false);
    }
  }


  async function saveReview() {
    if (!token || !selected || view === 'public') {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const body = selectedReview.trim();

      if (!body) {
        await request<void>(
          `/catalog/${selected.item.id}/review`,
          token,
          {
            method: 'DELETE',
          },
        );

        setSelectedReview('');
      } else {
        const result = await request<Review>(
          `/catalog/${selected.item.id}/review`,
          token,
          {
            method: 'PUT',
            body: JSON.stringify({
              body,
            }),
          },
        );

        setSelectedReview(result.body);
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setBusy(false);
    }
  }


  async function saveSelected() {
    if (
      !selected ||
      view === 'public' ||
      !('personal_notes' in selected)
    ) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const acquiredAtValue = selected.acquired_at
        ? selected.acquired_at
        : null;

      await request<Entry>(
        `/collection/${selected.id}`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: selected.status,
            visibility: selected.visibility,
            reading_status:
              selected.item.kind === 'book'
                ? selected.reading_status
                : null,
            personal_notes: selected.personal_notes,
            acquired_at: acquiredAtValue,
          }),
        },
      );

      await saveRating();
      await saveReview();

      if (token) {
        await refresh(token);
      }

      setSelected(null);
    } catch {
      // Individual request functions already set the error message.
    } finally {
      setBusy(false);
    }
  }


  if (!token) {
    return (
      <Auth
        onLogin={(newToken) => {
          sessionStorage.setItem(
            'mbn_token',
            newToken,
          );

          setToken(newToken);
        }}
      />
    );
  }


  const cards: SelectedEntry[] =
    view === 'public'
      ? publicEntries
      : filtered;


  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${
          mobileMenu ? 'sidebar-open' : ''
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            <BookOpen size={21} />
          </div>

          <span>
            mybooknook
            <span className="brand-dot">.</span>
          </span>
        </div>

        <div className="nav-caption">
          YOUR SPACE
        </div>

        <nav>
          <button
            className={`nav-item ${
              view === 'overview' ? 'active' : ''
            }`}
            onClick={() => {
              setView('overview');
              setMobileMenu(false);
            }}
          >
            <LayoutDashboard size={19} />
            Overview
          </button>

          <button
            className={`nav-item ${
              view === 'books' ? 'active' : ''
            }`}
            onClick={() => {
              setView('books');
              setMobileMenu(false);
            }}
          >
            <BookOpen size={19} />
            My books
            <span className="nav-count">
              {books}
            </span>
          </button>

          <button
            className={`nav-item ${
              view === 'vinyl' ? 'active' : ''
            }`}
            onClick={() => {
              setView('vinyl');
              setMobileMenu(false);
            }}
          >
            <Disc3 size={19} />
            My vinyl
            <span className="nav-count">
              {vinyl}
            </span>
          </button>
        </nav>

        <div className="nav-caption discover-caption">
          DISCOVER
        </div>

        <nav>
          <button
            className={`nav-item ${
              view === 'public' ? 'active' : ''
            }`}
            onClick={() => {
              setView('public');
              setMobileMenu(false);
            }}
          >
            <Globe2 size={19} />
            Public collections
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="avatar">
            {user?.profile.display_name
              ?.slice(0, 1)
              .toUpperCase() ||
              user?.username
                .slice(0, 1)
                .toUpperCase() ||
              'U'}
          </div>

          <div className="account">
            <strong>
              {user?.profile.display_name ||
                user?.username}
            </strong>

            <span>@{user?.username}</span>
          </div>

          <button
            className="icon-button"
            title="Log out"
            onClick={logout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            aria-label="Toggle navigation"
            onClick={() =>
              setMobileMenu(!mobileMenu)
            }
          >
            <Menu />
          </button>

          <div className="breadcrumb">
            MyBookNook
            <span>/</span>
            {view === 'overview'
              ? 'Overview'
              : view === 'books'
                ? 'My books'
                : view === 'vinyl'
                  ? 'My vinyl'
                  : 'Public collections'}
          </div>

          <div className="top-actions">
            <span className="online-pill">
              <span />
              Your space, your NOOK
            </span>

            <div className="avatar avatar-small">
              {user?.profile.display_name
                ?.slice(0, 1)
                .toUpperCase() ||
                user?.username
                  .slice(0, 1)
                  .toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page">
          {view === 'overview' ? (
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  MYBOOKNOOK
                </div>

                <h1>
                  Your books and records,
                  <br />
                  <em>all in one place.</em>
                </h1>

                <p>
                  Keep track of what you own,
                  what you're reading or listening
                  to, and what you'd like to add
                  next.
                </p>

                <button
                  className="primary-btn hero-btn"
                  onClick={() => openAdd()}
                >
                  <Plus size={18} />
                  Add to collection
                  <ArrowRight size={17} />
                </button>
              </div>

              <div
                className="hero-art"
                aria-hidden="true"
              >
                <div className="art-circle" />
                <div className="art-book art-book-one" />
                <div className="art-book art-book-two" />
                <div className="art-book art-book-three" />

                <div className="art-vinyl">
                  <div />
                </div>

                <div className="art-spark">
                  ✦
                </div>
              </div>
            </section>
          ) : (
            <div className="section-intro">
              <div className="eyebrow">
                MYBOOKNOOK
              </div>

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

          {view === 'overview' && (
            <div className="stats">
              <div className="stat-card">
                <div className="stat-icon icon-book">
                  <BookOpen size={22} />
                </div>

                <div>
                  <span>Books collected</span>
                  <strong>{books}</strong>
                  <small>
                    Your personal bookshelf
                  </small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon icon-vinyl">
                  <Disc3 size={22} />
                </div>

                <div>
                  <span>Vinyl collected</span>
                  <strong>{vinyl}</strong>
                  <small>
                    Records in your rotation
                  </small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon icon-total">
                  <LibraryBig size={22} />
                </div>

                <div>
                  <span>Total treasures</span>
                  <strong>{entries.length}</strong>
                  <small>
                    Stories & sounds together
                  </small>
                </div>
              </div>
            </div>
          )}

          <section className="collection-section">
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  {view === 'public'
                    ? 'EXPLORE'
                    : 'YOUR LIBRARY'}
                </div>

                <h2>
                  {view === 'overview'
                    ? 'Your collection'
                    : view === 'books'
                      ? 'Books'
                      : view === 'vinyl'
                        ? 'Vinyl records'
                        : 'Shared shelves'}
                </h2>

                <p>
                  {view === 'public'
                    ? 'Only public items are visible here.'
                    : 'All your favorites, right where they belong.'}
                </p>
              </div>

              {view !== 'public' && (
                <button
                  className="outline-btn"
                  onClick={() =>
                    openAdd(
                      view === 'vinyl'
                        ? 'vinyl'
                        : 'book',
                    )
                  }
                >
                  <Plus size={17} />
                  Add item
                </button>
              )}
            </div>

            {view === 'public' ? (
              <form
                className="search-row"
                onSubmit={findPublic}
              >
                <div className="search-box">
                  <Search size={18} />

                  <input
                    placeholder="Enter a username to explore..."
                    value={publicName}
                    onChange={(event) =>
                      setPublicName(
                        event.target.value,
                      )
                    }
                  />
                </div>

                <button
                  className="primary-btn"
                  type="submit"
                >
                  Explore
                </button>
              </form>
            ) : (
              <div className="search-row">
                <div className="search-box">
                  <Search size={18} />

                  <input
                    placeholder="Search your collection..."
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />
                </div>

                <div className="item-total">
                  {filtered.length}{' '}
                  {filtered.length === 1
                    ? 'item'
                    : 'items'}
                </div>
              </div>
            )}

            {error && (
              <div
                className="error-banner"
                role="alert"
              >
                {error}
              </div>
            )}

            {cards.length ? (
              <div className="item-grid">
                {cards.map((entry) => (
                  <button
                    className="item-card"
                    key={entry.id}
                    onClick={() =>
                      openEntry(
                        entry,
                        view === 'public',
                      )
                    }
                  >
                    <div
                      className={`cover ${
                        entry.item.kind ===
                        'vinyl'
                          ? 'vinyl-cover'
                          : ''
                      }`}
                    >
                      {entry.item.cover_url ? (
                        <img
                          src={
                            entry.item.cover_url
                          }
                          alt=""
                          loading="lazy"
                        />
                      ) : entry.item.kind ===
                        'book' ? (
                        <BookOpen size={42} />
                      ) : (
                        <Disc3 size={50} />
                      )}

                      <span className="cover-kind">
                        {entry.item.kind}
                      </span>
                    </div>

                    <div className="item-meta">
                      <strong>
                        {entry.item.title}
                      </strong>

                      <span>
                        {entry.item.creator ||
                          'Unknown creator'}
                      </span>

                      <small>
                        {visibilityIcon(
                          entry.visibility,
                        )}
                        {entry.status}
                      </small>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  {view === 'vinyl' ? (
                    <Disc3 size={34} />
                  ) : (
                    <BookOpen size={34} />
                  )}
                </div>

                <h3>
                  {view === 'public'
                    ? 'No public items to show yet'
                    : search
                      ? 'Nothing matches your search'
                      : 'Your collection starts here'}
                </h3>

                <p>
                  {view === 'public'
                    ? 'Enter a username to view their shared collection.'
                    : search
                      ? 'Try a different title or creator.'
                      : 'Add your first book or vinyl record to make this space your own.'}
                </p>

                {view !== 'public' &&
                  !search && (
                    <button
                      className="primary-btn"
                      onClick={() =>
                        openAdd()
                      }
                    >
                      <Plus size={17} />
                      Add your first item
                    </button>
                  )}
              </div>
            )}
          </section>
        </div>
      </main>

      {addOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setAddOpen(false);
            }
          }}
        >
          <form
            className="modal"
            onSubmit={addItem}
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  GROW YOUR COLLECTION
                </div>

                <h2>Add an item</h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() =>
                  setAddOpen(false)
                }
              >
                <X />
              </button>
            </div>

            <div className="type-switch">
              <button
                type="button"
                className={
                  item.kind === 'book'
                    ? 'chosen'
                    : ''
                }
                onClick={() =>
                  setItem({
                    ...item,
                    kind: 'book',
                  })
                }
              >
                <BookOpen size={17} />
                Book
              </button>

              <button
                type="button"
                className={
                  item.kind === 'vinyl'
                    ? 'chosen'
                    : ''
                }
                onClick={() => {
                  setItem({
                    ...item,
                    kind: 'vinyl',
                  });

                  setReadingStatus(null);
                }}
              >
                <Disc3 size={17} />
                Vinyl
              </button>
            </div>

            <label>
              Title
              <input
                required
                maxLength={300}
                value={item.title}
                onChange={(event) =>
                  setItem({
                    ...item,
                    title:
                      event.target.value,
                  })
                }
                placeholder={
                  item.kind === 'book'
                    ? 'e.g. The Hobbit'
                    : 'e.g. Rumours'
                }
              />
            </label>

            <label>
              {item.kind === 'book'
                ? 'Author'
                : 'Artist'}

              <input
                value={item.creator}
                onChange={(event) =>
                  setItem({
                    ...item,
                    creator:
                      event.target.value,
                  })
                }
                placeholder={
                  item.kind === 'book'
                    ? 'e.g. J.R.R. Tolkien'
                    : 'e.g. Fleetwood Mac'
                }
              />
            </label>

            <div className="form-grid">
              <label>
                {item.kind === 'book'
                  ? 'ISBN'
                  : 'UPC / EAN'}

                <input
                  maxLength={64}
                  value={
                    item.identifier || ''
                  }
                  onChange={(event) =>
                    setItem({
                      ...item,
                      identifier:
                        event.target.value,
                    })
                  }
                  placeholder="Optional"
                />
              </label>

              <label>
                Year
                <input
                  type="number"
                  min="1400"
                  max="2200"
                  value={item.year ?? ''}
                  onChange={(event) =>
                    setItem({
                      ...item,
                      year: event.target.value
                        ? Number(
                            event.target
                              .value,
                          )
                        : null,
                    })
                  }
                  placeholder="Optional"
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Edition / release
                <input
                  value={
                    item.edition || ''
                  }
                  onChange={(event) =>
                    setItem({
                      ...item,
                      edition:
                        event.target.value,
                    })
                  }
                  placeholder={
                    item.kind === 'book'
                      ? 'e.g. Hardcover'
                      : 'e.g. 25th Anniversary'
                  }
                />
              </label>

              <label>
                {item.kind === 'book'
                  ? 'Publisher'
                  : 'Record label'}

                <input
                  value={
                    item.publisher_label ||
                    ''
                  }
                  onChange={(event) =>
                    setItem({
                      ...item,
                      publisher_label:
                        event.target.value,
                    })
                  }
                  placeholder="Optional"
                />
              </label>
            </div>

            <label>
              Catalog number
              <input
                value={
                  item.catalog_number || ''
                }
                onChange={(event) =>
                  setItem({
                    ...item,
                    catalog_number:
                      event.target.value,
                  })
                }
                placeholder="Optional"
              />
            </label>

            <label>
              Cover image URL
              <input
                type="url"
                value={
                  item.cover_url || ''
                }
                onChange={(event) =>
                  setItem({
                    ...item,
                    cover_url:
                      event.target.value ||
                      null,
                  })
                }
                placeholder="https://..."
              />
            </label>

            <label>
              Description
              <textarea
                rows={3}
                value={item.description}
                onChange={(event) =>
                  setItem({
                    ...item,
                    description:
                      event.target.value,
                  })
                }
                placeholder="Optional"
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={
                  item.special_edition
                }
                onChange={(event) =>
                  setItem({
                    ...item,
                    special_edition:
                      event.target.checked,
                  })
                }
              />

              <span>
                Special or collector's edition
              </span>
            </label>

            <div className="form-grid">
              <label>
                Collection status
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as CollectionStatus,
                    )
                  }
                >
                  <option value="owned">
                    Owned
                  </option>

                  <option value="wishlist">
                    Wishlist
                  </option>
                </select>
              </label>

              <label>
                Visibility
                <select
                  value={visibility}
                  onChange={(event) =>
                    setVisibility(
                      event.target
                        .value as Visibility,
                    )
                  }
                >
                  <option value="private">
                    Private
                  </option>

                  <option value="friends">
                    Friends
                  </option>

                  <option value="public">
                    Public
                  </option>
                </select>
              </label>
            </div>

            {item.kind === 'book' && (
              <label>
                Reading status
                <select
                  value={
                    readingStatus ?? ''
                  }
                  onChange={(event) =>
                    setReadingStatus(
                      event.target.value
                        ? (event.target
                            .value as ReadingStatus)
                        : null,
                    )
                  }
                >
                  <option value="">
                    Not set
                  </option>

                  <option value="unread">
                    Unread
                  </option>

                  <option value="in_progress">
                    In progress
                  </option>

                  <option value="finished">
                    Finished
                  </option>
                </select>
              </label>
            )}

            <label>
              Acquired date
              <input
                type="date"
                value={acquiredAt}
                onChange={(event) =>
                  setAcquiredAt(
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Personal notes
              <textarea
                rows={3}
                maxLength={5000}
                value={personalNotes}
                onChange={(event) =>
                  setPersonalNotes(
                    event.target.value,
                  )
                }
                placeholder="Notes for yourself. These are private."
              />
            </label>

            <div className="privacy-note">
              <LockKeyhole size={16} />
              Personal notes are always private,
              regardless of the item's visibility.
            </div>

            <div className="scanner-note">
              <ScanLine size={17} />
              Barcode scanning is planned for a
              later milestone. Enter an ISBN or
              UPC manually for now.
            </div>

            {error && (
              <div
                className="error-banner"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              className="primary-btn full-btn"
              disabled={busy}
              type="submit"
            >
              {busy
                ? 'Saving...'
                : 'Add to my collection'}

              <ArrowRight size={17} />
            </button>
          </form>
        </div>
      )}

      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelected(null);
            }
          }}
        >
          <div className="modal detail-modal">
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  {selected.item.kind.toUpperCase()}
                </div>

                <h2>
                  {selected.item.title}
                </h2>

                <p>
                  {selected.item.creator}
                </p>
              </div>

              <button
                className="icon-button"
                onClick={() =>
                  setSelected(null)
                }
              >
                <X />
              </button>
            </div>

            <div className="detail-top">
              <div className="detail-cover">
                {selected.item.cover_url ? (
                  <img
                    src={
                      selected.item.cover_url
                    }
                    alt=""
                  />
                ) : selected.item.kind ===
                  'book' ? (
                  <BookOpen size={42} />
                ) : (
                  <Disc3 size={42} />
                )}
              </div>

              <div className="detail-summary">
                <span>
                  Year:{' '}
                  {selected.item.year || '—'}
                </span>

                <span>
                  Identifier:{' '}
                  {selected.item.identifier ||
                    '—'}
                </span>

                <span>
                  Edition:{' '}
                  {selected.item.edition ||
                    '—'}
                </span>

                <span>
                  {selected.item.kind ===
                  'book'
                    ? 'Publisher'
                    : 'Label'}
                  :{' '}
                  {selected.item
                    .publisher_label || '—'}
                </span>

                {selected.item
                  .catalog_number && (
                  <span>
                    Catalog number:{' '}
                    {
                      selected.item
                        .catalog_number
                    }
                  </span>
                )}

                {selected.item
                  .special_edition && (
                  <span className="special-badge">
                    Special edition
                  </span>
                )}
              </div>
            </div>

            {selected.item.description && (
              <p className="item-description">
                {selected.item.description}
              </p>
            )}

            {view !== 'public' &&
              'personal_notes' in selected && (
                <>
                  <div className="detail-section">
                    <div className="detail-section-heading">
                      <h3>Your copy</h3>
                      <p>
                        Information about this
                        item in your collection.
                      </p>
                    </div>

                    <div className="form-grid">
                      <label>
                        Collection status
                        <select
                          value={
                            selected.status
                          }
                          onChange={(event) =>
                            setSelected({
                              ...selected,
                              status:
                                event.target
                                  .value as CollectionStatus,
                            })
                          }
                        >
                          <option value="owned">
                            Owned
                          </option>

                          <option value="wishlist">
                            Wishlist
                          </option>
                        </select>
                      </label>

                      <label>
                        Visibility
                        <select
                          value={
                            selected.visibility
                          }
                          onChange={(event) =>
                            setSelected({
                              ...selected,
                              visibility:
                                event.target
                                  .value as Visibility,
                            })
                          }
                        >
                          <option value="private">
                            Private
                          </option>

                          <option value="friends">
                            Friends
                          </option>

                          <option value="public">
                            Public
                          </option>
                        </select>
                      </label>
                    </div>

                    {selected.item.kind ===
                      'book' && (
                      <label>
                        Reading status
                        <select
                          value={
                            selected.reading_status ??
                            ''
                          }
                          onChange={(
                            event,
                          ) =>
                            setSelected({
                              ...selected,
                              reading_status:
                                event.target
                                  .value
                                  ? (event
                                      .target
                                      .value as ReadingStatus)
                                  : null,
                            })
                          }
                        >
                          <option value="">
                            Not set
                          </option>

                          <option value="unread">
                            Unread
                          </option>

                          <option value="in_progress">
                            In progress
                          </option>

                          <option value="finished">
                            Finished
                          </option>
                        </select>
                      </label>
                    )}

                    <label>
                      Acquired date
                      <input
                        type="date"
                        value={
                          selected.acquired_at
                            ? selected.acquired_at.slice(
                                0,
                                10,
                              )
                            : ''
                        }
                        onChange={(event) =>
                          setSelected({
                            ...selected,
                            acquired_at:
                              event.target
                                .value
                                ? new Date(
                                    `${event.target.value}T12:00:00`,
                                  ).toISOString()
                                : null,
                          })
                        }
                      />
                    </label>

                    <label>
                      Personal notes
                      <textarea
                        rows={3}
                        maxLength={5000}
                        value={
                          selected.personal_notes
                        }
                        onChange={(event) =>
                          setSelected({
                            ...selected,
                            personal_notes:
                              event.target
                                .value,
                          })
                        }
                        placeholder="Notes for yourself."
                      />
                    </label>

                    <div className="privacy-note">
                      <LockKeyhole
                        size={16}
                      />
                      Only you can see your
                      personal notes.
                    </div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-section-heading">
                      <h3>
                        Rating & review
                      </h3>

                      <p>
                        Your rating and review
                        belong to this title,
                        not a specific physical
                        copy.
                      </p>
                    </div>

                    {detailLoading ? (
                      <div className="detail-loading">
                        Loading your rating and
                        review...
                      </div>
                    ) : (
                      <>
                        <label>
                          Rating
                          <span className="rating-label">
                            <Star size={14} />
                            Half-star ratings
                            supported
                          </span>

                          <select
                            value={
                              selectedRating ??
                              ''
                            }
                            onChange={(
                              event,
                            ) =>
                              setSelectedRating(
                                event.target
                                  .value
                                  ? Number(
                                      event
                                        .target
                                        .value,
                                    )
                                  : null,
                              )
                            }
                          >
                            <option value="">
                              Not rated
                            </option>

                            {Array.from(
                              { length: 10 },
                              (_, index) =>
                                (index + 1) /
                                2,
                            ).map(
                              (rating) => (
                                <option
                                  key={
                                    rating
                                  }
                                  value={
                                    rating
                                  }
                                >
                                  {rating.toFixed(
                                    1,
                                  )}{' '}
                                  ★
                                </option>
                              ),
                            )}
                          </select>
                        </label>

                        <label>
                          Review
                          <textarea
                            rows={4}
                            maxLength={5000}
                            value={
                              selectedReview
                            }
                            onChange={(
                              event,
                            ) =>
                              setSelectedReview(
                                event.target
                                  .value,
                              )
                            }
                            placeholder="What did you think?"
                          />
                        </label>
                      </>
                    )}
                  </div>

                  {error && (
                    <div
                      className="error-banner"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}

                  <div className="detail-actions">
                    <button
                      className="delete-btn"
                      disabled={busy}
                      onClick={() =>
                        removeEntry(
                          selected.id,
                        )
                      }
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>

                    <button
                      className="primary-btn"
                      disabled={
                        busy ||
                        detailLoading
                      }
                      onClick={saveSelected}
                    >
                      <Check size={16} />
                      {busy
                        ? 'Saving...'
                        : 'Save changes'}
                    </button>
                  </div>
                </>
              )}

            {view === 'public' && (
              <div className="public-detail">
                <div className="detail-fields">
                  <span>
                    Status:{' '}
                    {selected.status}
                  </span>

                  {selected.item.kind ===
                    'book' && (
                    <span>
                      Reading:{' '}
                      {formatReadingStatus(
                        selected.reading_status,
                      )}
                    </span>
                  )}
                </div>

                <p className="public-review">
                  Ratings and public reviews
                  will appear here once the
                  public review API is added.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function Auth({
  onLogin,
}: {
  onLogin: (token: string) => void;
}) {
  const [register, setRegister] =
    useState(false);

  const [username, setUsername] =
    useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] =
    useState('');

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);


  async function submit(event: FormEvent) {
    event.preventDefault();

    setError('');
    setBusy(true);

    try {
      if (register) {
        await request<User>(
          '/auth/register',
          null,
          {
            method: 'POST',
            body: JSON.stringify({
              username,
              email,
              password,
            }),
          },
        );
      }

      const result = await request<{
        access_token: string;
      }>('/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      onLogin(result.access_token);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="brand auth-brand">
          <div className="brand-mark">
            <BookOpen size={21} />
          </div>

          <span>
            mybooknook
            <span className="brand-dot">
              .
            </span>
          </span>
        </div>

        <div className="auth-illustration">
          <div className="auth-book one" />
          <div className="auth-book two" />
          <div className="auth-book three" />

          <div className="auth-record">
            <div />
          </div>
        </div>

        <div className="auth-quote">
          Your books and records
          <br />
          all in one place.
        </div>

        <p>
          Sign in to manage your collection,
          keep track of what you’re reading and
          listening to, and see what other
          collectors are sharing.
        </p>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="eyebrow">
            WELCOME TO YOUR NOOK
          </div>

          <h1>
            {register
              ? 'Create your nook.'
              : 'Welcome back.'}
          </h1>

          <p>
            {register
              ? 'Build your library of your favorite books and records.'
              : 'Your personal library awaits.'}
          </p>

          <form onSubmit={submit}>
            {register && (
              <label>
                Username
                <input
                  required
                  minLength={3}
                  maxLength={40}
                  pattern="[a-zA-Z0-9_]+"
                  autoComplete="username"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value,
                    )
                  }
                  placeholder="Choose a username"
                />
              </label>
            )}

            <label>
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                required
                type="password"
                minLength={
                  register ? 10 : undefined
                }
                autoComplete={
                  register
                    ? 'new-password'
                    : 'current-password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Enter your password"
              />
            </label>

            {error && (
              <div
                className="error-banner"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              className="primary-btn full-btn"
              disabled={busy}
            >
              {busy
                ? 'One moment...'
                : register
                  ? 'Create account'
                  : 'Sign in'}

              <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-toggle">
            {register
              ? 'Already have an account?'
              : 'New to MyBookNook?'}

            {' '}

            <button
              onClick={() => {
                setRegister(!register);
                setError('');
              }}
            >
              {register
                ? 'Sign in'
                : 'Create an account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default App;