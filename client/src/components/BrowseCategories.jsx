import { ArrowRight } from 'lucide-react';

export default function BrowseCategories({ categories, selected, onSelect }) {
  return <aside className="category-sidebar"><h3>Browse categories</h3>{categories.map(category=><button key={category} className={selected===category?'side-category selected':'side-category'} onClick={()=>onSelect(category)}><span>{category}</span><ArrowRight size={14}/></button>)}</aside>;
}
