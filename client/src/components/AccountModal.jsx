import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, LogOut, X } from 'lucide-react';

const money = amount => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export default function AccountModal({ auth, onClose, onAuthenticated, onLogout }) {
  const [mode, setMode] = useState(auth ? 'orders' : 'login');
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth?.token || mode !== 'orders') return;
    setOrdersError('');
    fetch('/api/orders/mine', { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Could not load your orders.');
        setOrders(data);
      })
      .catch(error => setOrdersError(error.message));
  }, [auth, mode]);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setFormError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch(`/api/auth/${mode === 'signup' ? 'signup' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not sign in. Please try again.');
      onAuthenticated(data);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return <div className="overlay modal-overlay account-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="account-modal" aria-labelledby="account-title">
      <button className="icon-button account-close" onClick={onClose} aria-label="Close account dialog"><X size={20}/></button>
      <div className="account-heading"><span className="brand-mark"><BookOpen size={20}/></span><div><span className="section-kicker">PAPERTRAIL BOOKS</span><h2 id="account-title">{auth ? 'Your account' : mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2></div></div>
      {auth ? <>
        <div className="account-welcome"><strong>{auth.user.name}</strong><span>{auth.user.email}</span></div>
        <div className="orders-heading"><h3>Your orders</h3><button className="logout-button" onClick={onLogout}><LogOut size={15}/> Sign out</button></div>
        {ordersError && <p className="form-error">{ordersError}</p>}
        {!ordersError && orders.length === 0 ? <div className="orders-empty"><BookOpen size={24}/><p>No orders yet. Your demo orders will appear here.</p></div> : <div className="order-history">{orders.map(order=><article className="order-history-card" key={order._id}><div className="order-history-top"><strong>Order {String(order._id).slice(-7).toUpperCase()}</strong><span>{new Date(order.createdAt).toLocaleDateString()}</span></div><ul>{order.items.map(item=><li key={String(item.book)}><span>{item.title} × {item.quantity}</span><span>{money(item.unitPrice * item.quantity)}</span></li>)}</ul><div className="order-history-total"><span>Total · {order.paymentStatus === 'not_processed' ? 'No payment taken' : order.paymentStatus}</span><strong>{money(order.total)}</strong></div></article>)}</div>}
      </> : <>
        <p className="account-description">Sign in to place demo orders and keep a record of your purchases.</p>
        <form className="account-form" onSubmit={submit}>
          {mode === 'signup' && <label>Your name<input name="name" autoComplete="name" minLength="2" required placeholder="Full name"/></label>}
          <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></label>
          <label>Password<input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} required placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}/></label>
          {formError && <p className="form-error">{formError}</p>}
          <button className="account-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'} {!busy&&<ArrowRight size={16}/>}</button>
        </form>
        <p className="account-switch">{mode === 'signup' ? 'Already have an account?' : 'New to Papertrail?'} <button onClick={()=>{setMode(mode === 'signup' ? 'login' : 'signup');setFormError('');}}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>
      </>}
      <p className="account-payment-note">Demo orders update stock. No payment is processed.</p>
    </section>
  </div>;
}
