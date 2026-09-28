import { Check, Plus } from 'lucide-react';

const rupees = value => `₹${Number(value||0).toLocaleString('en-IN')}`;
export default function BookCard({ book, index, quantity, onView, onAdd }) {
  return <article className="book-card">
    <button className="cover-button" onClick={()=>onView(book)} aria-label={`View ${book.title}`}>
      <div className="cover-frame"><img src={book.cover} alt={`Cover of ${book.title}`} loading="lazy"/><span className="cover-number">{String(index+1).padStart(2,'0')}</span></div>
    </button>
    <div className="book-meta"><div className="book-meta-main"><span className="book-category">{book.category}</span><h3>{book.title}</h3><p>{book.author}</p></div><strong className="book-price">{rupees(book.price)}</strong></div>
    <div className="card-actions"><span className={book.quantity>0?'stock-note':'stock-note sold-out'}>{book.quantity>0?'In stock':'Out of stock'}</span><button className={quantity?'add-button added':'add-button'} onClick={()=>onAdd(book)} disabled={book.quantity<=0}>{quantity?<><Check size={14}/> Added</>:<><Plus size={14}/> Add</>}</button></div>
  </article>;
}
