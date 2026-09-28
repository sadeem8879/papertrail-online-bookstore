import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';

const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const normalize = value => String(value || '').trim().toLocaleLowerCase();

export default function AdminDashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [customCategory, setCustomCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [adminAuth, setAdminAuth] = useState(() => { try { return JSON.parse(localStorage.getItem('papertrail-admin-auth')) || null; } catch { return null; } });
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const isDashboard = window.location.pathname.replace(/\/+$/, '') === '/admin/dashboard';

  const loadBooks = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/books');
      const result = await response.json().catch(() => []);
      if (!response.ok) throw new Error(result.message || 'Could not load books.');
      setBooks(result);
    } catch (error) {
      setLoadError(`${error.message} Check that the server and MongoDB are running.`);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!adminAuth?.token) {
      if (isDashboard) window.location.replace('/admin');
      return;
    }
    fetch('/api/auth/admin-me', { headers: { Authorization: `Bearer ${adminAuth.token}` } })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Admin session expired.');
        setAdminAuth(current => current?.token === adminAuth.token ? { ...current, user: data.user } : current);
        if (!isDashboard) window.location.replace('/admin/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('papertrail-admin-auth');
        setAdminAuth(null);
        if (isDashboard) window.location.replace('/admin');
      });
  }, [adminAuth?.token, isDashboard]);

  useEffect(() => { if (isDashboard && adminAuth?.token) loadBooks(); }, [isDashboard, adminAuth?.token]);

  const categories = useMemo(() => {
    const labels = new Map();
    books.forEach(book => {
      const value = String(book.category || '').trim();
      if (value && !labels.has(normalize(value))) labels.set(normalize(value), value[0].toLocaleUpperCase() + value.slice(1));
    });
    return [...labels.values()];
  }, [books]);
  const shownBooks = books.filter(book => `${book.title} ${book.author} ${book.category}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const totalCopies = books.reduce((sum, book) => sum + Number(book.quantity || 0), 0);
  const outOfStock = books.filter(book => Number(book.quantity) === 0).length;
  const notify = text => { setMessage(text); window.setTimeout(() => setMessage(''), 3000); };

  const adminLogin = async event => {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError('');
    const credentials = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch('/api/auth/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Admin sign-in failed.');
      localStorage.setItem('papertrail-admin-auth', JSON.stringify(result));
      setAdminAuth(result);
      window.location.assign('/admin/dashboard');
    } catch (error) { setLoginError(error.message); }
    finally { setLoginBusy(false); }
  };

  const adminLogout = () => {
    localStorage.removeItem('papertrail-admin-auth');
    setAdminAuth(null);
    window.location.assign('/admin');
  };

  const saveBook = async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (payload.category === '__custom') payload.category = (payload.customCategory || '').trim();
    delete payload.customCategory;
    payload.category = payload.category.trim().charAt(0).toLocaleUpperCase() + payload.category.trim().slice(1);
    payload.price = Number(payload.price);
    payload.quantity = Number(payload.quantity);
    setSaving(true);
    try {
      const isUpdate = Boolean(editing?._id);
      const response = await fetch(isUpdate ? `/api/books/${editing._id}` : '/api/books', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAuth.token}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || `Save failed (${response.status}).`);
      setEditing(null);
      setCustomCategory(false);
      notify(isUpdate ? 'Book updated.' : 'Book added.');
      await loadBooks();
    } catch (error) {
      notify(error.message || 'Could not save this book.');
    } finally { setSaving(false); }
  };

  const deleteBook = async book => {
    if (!window.confirm(`Delete “${book.title}” from the catalog?`)) return;
    try {
      const response = await fetch(`/api/books/${book._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminAuth.token}` } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || `Delete failed (${response.status}).`);
      setBooks(current => current.filter(item => item._id !== book._id));
      notify('Book deleted.');
    } catch (error) { notify(error.message || 'Could not delete this book.'); }
  };

  if (!isDashboard || !adminAuth?.token) return <div className="admin-page admin-login-page">
    <header className="admin-topbar"><a className="admin-brand" href="/"><span className="brand-mark"><BookOpen size={20}/></span><span>Papertrail<small>ADMIN ACCESS</small></span></a><a href="/" className="back-to-store"><ArrowLeft size={16}/> Back to storefront</a></header>
    <main className="admin-login-wrap"><section className="admin-login-card"><span className="admin-page-kicker">STAFF ONLY</span><h1>Admin sign in</h1><p>Enter your administrator credentials to manage the bookstore catalog.</p><form className="account-form" onSubmit={adminLogin}><label>Username<input name="username" autoComplete="username" required placeholder="Admin username"/></label><label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Admin password"/></label>{loginError&&<p className="form-error">{loginError}</p>}<button className="account-submit" type="submit" disabled={loginBusy}>{loginBusy?'Checking…':'Sign in as admin'} {!loginBusy&&<ArrowLeft size={16}/>}</button></form></section></main>
  </div>;

  return <div className="admin-page">
    <header className="admin-topbar"><a className="admin-brand" href="/"><span className="brand-mark"><BookOpen size={20}/></span><span>Papertrail<small>ADMIN DASHBOARD</small></span></a><div className="admin-top-actions"><a href="/" className="back-to-store"><ArrowLeft size={16}/> Back to storefront</a><button className="admin-logout" onClick={adminLogout}>Log out</button></div></header>
    <main className="admin-content">
      <div className="admin-page-heading"><div><span className="admin-page-kicker">CATALOG MANAGEMENT</span><h1>Books</h1><p>Add titles, update stock, and manage the bookstore catalog.</p></div><button className="admin-primary" onClick={()=>{setEditing({});setCustomCategory(categories.length===0);}}><Plus size={17}/> Add book</button></div>
      <section className="admin-stats"><div><span>Total titles</span><strong>{books.length}</strong></div><div><span>Copies in stock</span><strong>{totalCopies}</strong></div><div><span>Out of stock</span><strong>{outOfStock}</strong></div></section>
      <section className="inventory-panel"><div className="inventory-heading"><div><h2>Inventory</h2><span>{shownBooks.length} books</span></div><label className="inventory-search"><Search size={16}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search title, author, category"/></label><button className="inventory-refresh" onClick={loadBooks} aria-label="Refresh inventory"><RefreshCw size={16}/></button></div>
        {loadError && <div className="admin-load-error">{loadError}<button onClick={loadBooks}>Try again</button></div>}
        {loading ? <div className="admin-loading">Loading inventory…</div> : !loadError && shownBooks.length === 0 ? <div className="admin-loading">{books.length ? 'No books match your search.' : 'There are no books in the catalog yet. Add your first book.'}</div> : !loadError && <div className="inventory-table-wrap"><table className="inventory-table"><thead><tr><th>Book</th><th>Category</th><th>Price</th><th>Quantity</th><th>Actions</th></tr></thead><tbody>{shownBooks.map(book=><tr key={book._id}><td><div className="inventory-book"><img src={book.cover || 'https://placehold.co/52x68?text=Book'} alt=""/><span><strong>{book.title}</strong><small>{book.author}</small></span></div></td><td>{book.category}</td><td>{money(book.price)}</td><td><span className={book.quantity > 0 ? 'inventory-quantity' : 'inventory-quantity empty'}>{book.quantity} {book.quantity === 1 ? 'copy' : 'copies'}</span></td><td><div className="inventory-actions"><button onClick={()=>{setEditing(book);setCustomCategory(false);}} aria-label={`Edit ${book.title}`}><Pencil size={16}/> Edit</button><button className="inventory-delete" onClick={()=>deleteBook(book)} aria-label={`Delete ${book.title}`}><Trash2 size={16}/> Delete</button></div></td></tr>)}</tbody></table></div>}
      </section>
    </main>
    {editing && <div className="overlay modal-overlay" onMouseDown={event=>event.target===event.currentTarget&&setEditing(null)}><section className="admin-modal admin-form-modal"><div className="panel-head"><div><div className="eyebrow">{editing._id ? 'EDIT BOOK DETAILS' : 'NEW CATALOG ITEM'}</div><h2>{editing._id ? 'Update book' : 'Add a book'}</h2></div><button className="icon-button" onClick={()=>setEditing(null)} aria-label="Close form"><X size={20}/></button></div><form className="book-form" key={editing._id || 'new-admin-book'} onSubmit={saveBook}><label>Book title<input name="title" defaultValue={editing.title} required placeholder="Title"/></label><label>Author<input name="author" defaultValue={editing.author} required placeholder="Author name"/></label><div className="form-split"><label>Category<select name="category" defaultValue={editing.category || categories[0] || '__custom'} onChange={event=>setCustomCategory(event.target.value==='__custom')} required>{categories.map(value=><option key={value} value={value}>{value}</option>)}<option value="__custom">＋ Add a custom category</option></select></label><label>Price (₹)<input name="price" type="number" min="0" step="0.01" defaultValue={editing.price} required/></label></div>{customCategory&&<label>Custom category<input name="customCategory" required placeholder="Category name"/></label>}<div className="form-split"><label>Quantity<input name="quantity" type="number" min="0" step="1" defaultValue={editing.quantity} required/></label><label>Cover image URL<input name="cover" type="url" defaultValue={editing.cover} placeholder="https://..."/></label></div><label>Description<textarea name="description" rows="3" defaultValue={editing.description} placeholder="Book description"/></label><div className="form-actions"><button type="button" className="cancel-button" onClick={()=>setEditing(null)}>Cancel</button><button className="save-button" type="submit" disabled={saving}>{saving?'Saving…':editing._id?'Save changes':'Add book'}</button></div></form></section></div>}
    {message&&<div className="toast">{message}</div>}
  </div>;
}
