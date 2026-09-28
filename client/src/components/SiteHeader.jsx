import { BookOpen, Search, ShoppingBag } from 'lucide-react';

export default function SiteHeader({ query, setQuery, cartCount, onOpenCart, onOpenAdmin }) {
  return <>
    <div className="announcement">Browse fiction, biographies, classics and more <span>·</span> Search by title or author</div>
    <header className="topbar" id="top">
      <a className="brand" href="#top"><span className="brand-mark"><BookOpen size={20}/></span><span>Papertrail<small>BOOKS & MORE</small></span></a>
      <label className="header-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by title or author"/><kbd>⌕</kbd></label>
      <div className="header-actions"><button className="admin-link" onClick={onOpenAdmin}>Manage books</button><button className="bag-button" onClick={onOpenCart}><ShoppingBag size={18}/><span>Cart</span>{cartCount>0&&<b>{cartCount}</b>}</button></div>
    </header>
    <nav className="simple-nav"><a href="#discover">All books</a><a href="#discover">Browse categories</a><a href="#staff-pick">Staff pick</a><a href="#help">Shopping help</a></nav>
  </>;
}
