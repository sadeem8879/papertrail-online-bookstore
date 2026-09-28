import { ArrowRight } from 'lucide-react';

const rupees = value => `₹${Number(value||0).toLocaleString('en-IN')}`;
export default function StaffPick({ book, onAdd }) {
  if (!book) return null;
  return <section className="staff-pick" id="staff-pick"><img src={book.cover} alt={`Cover of ${book.title}`}/><div className="staff-pick-copy"><span className="section-kicker">RECOMMENDED BY OUR TEAM</span><h2>Staff pick: {book.title}</h2><p>{book.description}</p><button onClick={()=>onAdd(book)}>Add to cart · {rupees(book.price)} <ArrowRight size={15}/></button></div></section>;
}
