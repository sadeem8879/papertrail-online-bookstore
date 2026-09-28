import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Plus, Minus, X, BookOpen, Check, Trash2, Pencil, PlusCircle } from 'lucide-react';
import SiteHeader from './components/SiteHeader.jsx';
import BrowseCategories from './components/BrowseCategories.jsx';
import BookCard from './components/BookCard.jsx';
import StaffPick from './components/StaffPick.jsx';
import BenefitsStrip from './components/BenefitsStrip.jsx';
import HeroBanner from './components/HeroBanner.jsx';

const seedBooks = [
  { _id: 'b1', title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', price: 399, quantity: 12, description: 'A shepherd travels from Spain to Egypt in search of treasure and discovers a story about listening to your heart along the way.', cover: 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg', color: 'sage', tag: 'Staff pick' },
  { _id: 'b2', title: 'Atomic Habits', author: 'James Clear', category: 'Self-help', price: 549, quantity: 8, description: 'A practical guide to building good habits, breaking bad ones, and making small changes that add up over time.', cover: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg', color: 'rose', tag: 'Bestseller' },
  { _id: 'b3', title: 'The Hobbit', author: 'J. R. R. Tolkien', category: 'Fantasy', price: 450, quantity: 15, description: 'Bilbo Baggins leaves his comfortable home and joins a company of dwarves on an unexpected journey to reclaim their mountain home.', cover: 'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg', color: 'moss', tag: '' },
  { _id: 'b4', title: 'Ikigai', author: 'Héctor García & Francesc Miralles', category: 'Wellbeing', price: 350, quantity: 20, description: 'A look at the habits and ideas that help people in Okinawa find purpose and stay active throughout their lives.', cover: 'https://covers.openlibrary.org/b/isbn/9780143130727-L.jpg', color: 'gold', tag: 'Popular' },
  { _id: 'b5', title: 'The Psychology of Money', author: 'Morgan Housel', category: 'Business', price: 499, quantity: 6, description: 'Short stories about the ways people think about money, risk, saving, and what it means to have enough.', cover: 'https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg', color: 'blue', tag: '' },
  { _id: 'b6', title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Classics', price: 299, quantity: 11, description: 'Elizabeth Bennet navigates family expectations, first impressions, and the complicated business of falling in love.', cover: 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg', color: 'sand', tag: 'A classic' },
  { _id: 'b7', title: 'Wings of Fire', author: 'A. P. J. Abdul Kalam', category: 'Biography', price: 299, quantity: 14, description: 'The former president of India reflects on his childhood, his education, and a career in aerospace and public service.', cover: 'https://covers.openlibrary.org/b/isbn/9788173711466-L.jpg', color: 'lilac', tag: '' },
  { _id: 'b8', title: 'The Blue Umbrella', author: 'Ruskin Bond', category: 'Fiction', price: 199, quantity: 9, description: 'In a Himalayan village, a young girl trades her lucky charm for a bright blue umbrella that catches everyone’s eye.', cover: 'https://covers.openlibrary.org/b/isbn/9780143333388-L.jpg', color: 'peach', tag: 'Under ₹200' },
];
const rupees = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const normalizeCategory = value => String(value || '').trim().toLocaleLowerCase();

function App() {
  const [books, setBooks] = useState(seedBooks);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All books');
  const [sortBy, setSortBy] = useState('featured');
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('papertrail-cart')) || {}; } catch { return {}; } });
  const [activeBook, setActiveBook] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderBusy, setOrderBusy] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [customCategory, setCustomCategory] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { fetch('/api/books').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => { if (Array.isArray(data) && data.length) setBooks(data.map((b, i) => ({ ...b, _id: b._id || `api-${i}`, cover: b.cover || seedBooks[i % seedBooks.length].cover, color: b.color || seedBooks[i % seedBooks.length].color, tag: b.tag || '' }))); }).catch(() => {}); }, []);
  useEffect(() => { localStorage.setItem('papertrail-cart', JSON.stringify(cart)); }, [cart]);
  const categories = useMemo(() => {
    const labelsByKey = new Map();
    books.forEach(book => {
      const label = String(book.category || '').trim();
      if (!label) return;
      const key = normalizeCategory(label);
      if (!labelsByKey.has(key)) labelsByKey.set(key, label.charAt(0).toLocaleUpperCase() + label.slice(1));
    });
    return ['All books', ...labelsByKey.values()];
  }, [books]);
  const visibleBooks = useMemo(() => {
    const searchText = query.trim().toLocaleLowerCase();
    const selectedCategory = normalizeCategory(category);
    const matches = books.filter(book => {
      const matchesSearch = `${book.title} ${book.author}`.toLocaleLowerCase().includes(searchText);
      const matchesCategory = selectedCategory === 'all books' || normalizeCategory(book.category) === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    if (sortBy === 'price-low') return matches.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') return matches.sort((a, b) => b.price - a.price);
    if (sortBy === 'title') return matches.sort((a, b) => a.title.localeCompare(b.title));
    return matches;
  }, [books, query, category, sortBy]);
  const selectCategory = nextCategory => {
    setCategory(nextCategory);
    setQuery('');
  };
  const cartItems = books.filter(b => cart[b._id] > 0).map(book => ({ ...book, cartQty: cart[book._id] }));
  const staffPick = books.find(book => book.title === 'The Alchemist') || seedBooks[0];
  const cartCount = Object.values(cart).reduce((a, n) => a + n, 0);
  const total = cartItems.reduce((sum, item) => sum + item.price * item.cartQty, 0);
  const notify = message => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const addToCart = book => {
    const current = cart[book._id] || 0;
    const available = Number(book.quantity) || 0;
    if (!available) return notify('This book is out of stock.');
    if (current >= available) return notify(`Only ${available} ${available === 1 ? 'copy is' : 'copies are'} in stock.`);
    setCart(c => ({ ...c, [book._id]: current + 1 }));
    notify('Added to your cart');
  };
  const changeQty = (id, amount) => setCart(c => {
    const book = books.find(item => item._id === id);
    const next = Math.min((c[id] || 0) + amount, Number(book?.quantity) || 0);
    if (next <= 0) { const copy = { ...c }; delete copy[id]; return copy; }
    return { ...c, [id]: next };
  });
  const placeDemoOrder = async () => {
    if (!cartItems.length || orderBusy) return;
    setOrderBusy(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems.map(item => ({ bookId: item._id, quantity: item.cartQty })) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || `Order failed (${response.status}).`);
      const updatedById = new Map((result.updatedBooks || []).map(book => [String(book._id), book]));
      setBooks(current => current.map(book => updatedById.has(String(book._id)) ? { ...book, ...updatedById.get(String(book._id)) } : book));
      setCart({});
      notify(result.message || 'Demo order recorded. No payment was processed.');
    } catch (error) {
      notify(error.message || 'Could not place the demo order. Make sure the server is running.');
    } finally {
      setOrderBusy(false);
    }
  };
  const saveBook = async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    if (payload.category === '__custom') payload.category = (payload.customCategory || '').trim();
    delete payload.customCategory;
    payload.category = payload.category.trim().charAt(0).toLocaleUpperCase() + payload.category.trim().slice(1);
    payload.price = Number(payload.price);
    payload.quantity = Number(payload.quantity);
    payload.cover = payload.cover.trim() || editing?.cover || seedBooks[0].cover;
    const isDatabaseBook = Boolean(editing?._id && /^[a-f\d]{24}$/i.test(String(editing._id)));
    const isUpdate = Boolean(editing?._id && isDatabaseBook);

    try {
      const response = await fetch(isUpdate ? `/api/books/${editing._id}` : '/api/books', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const saved = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(saved.message || `Save failed (${response.status}).`);

      const normalized = { ...payload, ...saved, _id: saved._id || `local-${Date.now()}`, cover: saved.cover || payload.cover, color: editing?.color || 'sage', tag: editing?.tag || '' };
      setBooks(prev => editing?._id
        ? prev.map(book => book._id === editing._id ? normalized : book)
        : [normalized, ...prev]);
      setCategory('All books');
      setQuery('');
      setEditing(null);
      setCustomCategory(false);
      notify(isUpdate ? 'Book updated and saved' : 'Book added and saved');
    } catch (error) {
      notify(error.message || 'Could not save the book. Check that the API and MongoDB are running.');
    }
  };
  const deleteBook = async book => {
    try {
      if (/^[a-f\d]{24}$/i.test(String(book._id))) {
        const response = await fetch(`/api/books/${book._id}`, { method: 'DELETE' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || `Delete failed (${response.status}).`);
      }
      setBooks(prev => prev.filter(item => item._id !== book._id));
      setCart(current => { const next = { ...current }; delete next[book._id]; return next; });
      notify('Book deleted');
    } catch (error) {
      notify(error.message || 'Could not delete the book. Check that the API is running.');
    }
  };

  return <div className="site-shell">
    <SiteHeader query={query} setQuery={setQuery} cartCount={cartCount} onOpenCart={()=>setCartOpen(true)} onOpenAdmin={()=>setAdminOpen(true)}/>
    <main id="top"><HeroBanner books={books} onView={setActiveBook}/>
      <StaffPick book={staffPick} onAdd={addToCart}/>
      <section className="catalog-layout" id="discover"><BrowseCategories categories={categories} selected={category} onSelect={selectCategory}/><div className="shelf-section"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> THE BOOKSHELF</div><h2>Books in stock</h2></div><p>{visibleBooks.length} titles</p></div><div className="filter-row"><div className="category-tabs">{categories.map(c => <button key={c} className={category === c ? 'category-tab selected' : 'category-tab'} onClick={() => selectCategory(c)}>{c}</button>)}</div><div className="shelf-tools"><label className="sort-box">Sort by<select value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="title">Title A–Z</option></select></label></div></div>
        <div className="results-caption"><span>{query ? `Search results for “${query}”` : category === 'All books' ? 'All books' : category} <span className="result-count">({visibleBooks.length})</span></span></div>
        {visibleBooks.length ? <div className="book-grid">{visibleBooks.map((book, i) => <BookCard key={book._id} book={book} index={i} quantity={cart[book._id]||0} onView={setActiveBook} onAdd={addToCart}/>)}</div> : <div className="empty-results"><h3>No books found</h3><p>Try a different title, author, or category.</p><button onClick={() => { setQuery(''); setCategory('All books'); }}>Show all books <ArrowRight size={14}/></button></div>}
      </div></section>
      <section className="little-note"><div className="note-flower">✳</div><div><div className="eyebrow">A NOTE FROM OUR SHELVES</div><p>“Between the pages of a book is a lovely place to be.”</p><span>Find a quiet corner. We'll keep the kettle on.</span></div><a href="#discover" aria-label="Return to bookshelf"><ArrowRight size={18}/></a></section>
      <BenefitsStrip/>
    </main><footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><BookOpen size={18}/></span><span>Papertrail<small>BOOKS & MORE</small></span></a><span>ONLINE BOOK STORE</span><span>© PAPERTRAIL BOOKS</span></footer>

    {cartOpen && <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setCartOpen(false)}><aside className="side-panel"><div className="panel-head"><div><div className="eyebrow">YOUR CART</div><h2>Shopping cart <span>({cartCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart"><X size={19}/></button></div>{cartItems.length ? <><div className="cart-list">{cartItems.map(item => <div className="cart-item" key={item._id}><img src={item.cover} alt=""/><div className="cart-item-copy"><h3>{item.title}</h3><p>{item.author}</p><strong>{rupees(item.price)}</strong><div className="quantity-control"><button onClick={() => changeQty(item._id, -1)} aria-label="Decrease quantity"><Minus size={12}/></button><span>{item.cartQty}</span><button onClick={() => changeQty(item._id, 1)} aria-label="Increase quantity" disabled={item.cartQty >= item.quantity}><Plus size={12}/></button><button className="remove-item" onClick={() => changeQty(item._id, -item.cartQty)}><Trash2 size={13}/> Remove</button></div><small className="cart-stock">{item.quantity} available</small></div></div>)}</div><div className="cart-bottom"><div className="cart-subtotal"><span>Total</span><strong>{rupees(total)}</strong></div><p>This is a demo order. No payment will be taken.</p><button className="checkout-button" onClick={placeDemoOrder} disabled={orderBusy}>{orderBusy ? 'Placing order…' : <>Place demo order · {rupees(total)} <ArrowRight size={16}/></>}</button><span className="secure-note">Stock is checked again when you place the order.</span></div></> : <div className="empty-bag"><span>🛒</span><h3>Your cart is empty</h3><p>Add a book to see it here.</p><button onClick={() => setCartOpen(false)}>Continue browsing <ArrowRight size={14}/></button></div>}</aside></div>}
    {activeBook && <div className="overlay modal-overlay" onMouseDown={e => e.target === e.currentTarget && setActiveBook(null)}><div className="detail-modal"><button className="icon-button modal-close" onClick={() => setActiveBook(null)} aria-label="Close details"><X size={19}/></button><img src={activeBook.cover} alt={`Cover artwork for ${activeBook.title}`}/><div className="detail-copy"><div className="eyebrow">{activeBook.category} · A PAPERTRAIL PICK</div><h2>{activeBook.title}</h2><div className="detail-author">Words by {activeBook.author}</div><p>{activeBook.description}</p><div className="detail-price">{rupees(activeBook.price)} <span>· taxes included</span></div><button className="checkout-button" onClick={() => addToCart(activeBook)}><Plus size={16}/> Add a copy to my bag</button><div className="detail-stock"><span className="stock-dot"/> {activeBook.quantity} copies ready for a new home</div></div></div></div>}
    {adminOpen && <div className="overlay modal-overlay" onMouseDown={e => e.target === e.currentTarget && setAdminOpen(false)}>
      <div className="admin-modal">
        <div className="panel-head"><div><div className="eyebrow">ADMIN</div><h2>Manage books</h2></div><button className="icon-button" onClick={() => { setAdminOpen(false); setEditing(null); setCustomCategory(false); }} aria-label="Close admin"><X size={19}/></button></div>
        <button className="new-book-button" onClick={() => { setEditing({}); setCustomCategory(false); }}><PlusCircle size={17}/> Add a new book</button>
        {editing && <form className="book-form" key={editing._id || 'new-book'} onSubmit={saveBook}>
          <label>Title<input name="title" defaultValue={editing.title} required placeholder="Book title"/></label>
          <label>Author<input name="author" defaultValue={editing.author} required placeholder="Author name"/></label>
          <div className="form-split">
            <label>Category<select name="category" defaultValue={editing.category || categories.find(item => item !== 'All books') || '__custom'} onChange={event => setCustomCategory(event.target.value === '__custom')} required>{categories.filter(item => item !== 'All books').map(item => <option key={item} value={item}>{item}</option>)}<option value="__custom">＋ Add a custom category</option></select></label>
            <label>Price (₹)<input name="price" type="number" min="0" step="0.01" defaultValue={editing.price} required placeholder="450"/></label>
          </div>
          {customCategory && <label>Custom category<input name="customCategory" required placeholder="Enter a category name"/></label>}
          <div className="form-split"><label>Quantity<input name="quantity" type="number" min="0" step="1" defaultValue={editing.quantity} required placeholder="10"/></label><label>Cover image URL<input name="cover" type="url" defaultValue={editing.cover} placeholder="https://..."/></label></div>
          <label>Description<textarea name="description" rows="3" defaultValue={editing.description} placeholder="Book description"/></label>
          <div className="form-actions"><button type="button" className="cancel-button" onClick={() => { setEditing(null); setCustomCategory(false); }}>Cancel</button><button className="save-button" type="submit">{editing._id ? 'Save changes' : 'Add book'}</button></div>
        </form>}
        <div className="admin-book-list">{books.map(book => <div className="admin-book" key={book._id}><img src={book.cover} alt=""/><div><strong>{book.title}</strong><span>{book.author} · {rupees(book.price)} · {book.quantity} in stock</span></div><button aria-label={`Edit ${book.title}`} onClick={() => { setEditing(book); setCustomCategory(false); }}><Pencil size={15}/></button><button className="delete-admin" aria-label={`Delete ${book.title}`} onClick={() => deleteBook(book)}><Trash2 size={15}/></button></div>)}</div>
      </div>
    </div>}
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
  </div>;
}

export default App;
