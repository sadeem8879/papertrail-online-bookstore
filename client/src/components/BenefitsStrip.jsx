import { Search, Layers, ShoppingBag } from 'lucide-react';

const benefits = [
  { icon: Search, title: 'Search the catalog', copy: 'Find a title or author by name' },
  { icon: Layers, title: 'Browse by category', copy: 'Explore books by subject' },
  { icon: ShoppingBag, title: 'Keep track of your bag', copy: 'Update quantities and see the total' },
];
export default function BenefitsStrip() {
  return <section className="benefits-strip" id="help">{benefits.map(({icon:Icon,title,copy})=><div className="benefit" key={title}><Icon size={19}/><span><strong>{title}</strong><small>{copy}</small></span></div>)}</section>;
}
