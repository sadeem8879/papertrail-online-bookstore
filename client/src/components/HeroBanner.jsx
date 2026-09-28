import { ArrowRight } from 'lucide-react';

export default function HeroBanner({ books, onView }) {
  const picks = books.slice(0, 3);
  return <section className="hero-banner">
    <div className="hero-copy"><span className="section-kicker">YOUR NEIGHBOURHOOD BOOKSHOP, ONLINE</span><h1>Find a book<br/>you’ll love.</h1><p>Browse new reads, old favourites, and recommendations from our team.</p><a href="#discover" className="hero-cta">Shop all books <ArrowRight size={16}/></a></div>
    <div className="hero-picks"><div className="hero-picks-heading"><strong>Popular right now</strong><a href="#discover">See all</a></div><div className="hero-pick-list">{picks.map(book=><button key={book._id} onClick={()=>onView(book)}><img src={book.cover} alt={`Cover of ${book.title}`}/><span><strong>{book.title}</strong><small>{book.author}</small></span></button>)}</div></div>
  </section>;
}
