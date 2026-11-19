import { Link } from 'react-router-dom';
import { ArrowLeft, Coffee } from 'lucide-react';

// Plain, short, and honest about the three things this app actually stores.
const PrivacyPage = () => (
  <main className="lw-privacy">
    <header className="lw-privacy-head">
      <Link to="/" className="lw-privacy-brand" aria-label="Little Window Café, home">
        <span><Coffee size={16} /></span>
        Little Window Café
      </Link>
      <Link to="/" className="lw-privacy-back"><ArrowLeft size={15} /> Back to the café</Link>
    </header>

    <article>
      <p className="lw-privacy-eyebrow">The small print, kept small</p>
      <h1>Privacy &amp; terms</h1>

      <h2>What we keep</h2>
      <p>
        When you order at a table we store your first name, your phone number if you give it, the
        table you are sitting at, what you ordered and what you paid. Staff use it to cook and
        serve the right food to the right table.
      </p>

      <h2>How long</h2>
      <p>
        Orders stay in our sales records so the café can report takings and resolve a wrong bill.
        You can ask us to delete your name and phone number at any time by speaking to the counter.
      </p>

      <h2>On your device</h2>
      <p>
        Your cart is remembered in this browser so a refresh does not lose it. Your name and phone
        are kept for this visit only and are cleared when you close the tab. Nothing is used for
        advertising and we do not set tracking cookies.
      </p>

      <h2>Payments</h2>
      <p>
        Card and UPI payments are handled by Razorpay. We never see or store your card details; we
        only receive confirmation that a payment succeeded.
      </p>

      <h2>Ordering terms</h2>
      <p>
        Prices include the taxes shown at checkout. Online cancellation is possible for one minute
        after paying — after that the kitchen has started and the counter can help in person.
        Tables are held for thirty minutes past a reservation time.
      </p>

      <h2>Contact</h2>
      <p>Ask any team member at the counter, or write to the address printed on your bill.</p>
    </article>
  </main>
);

export default PrivacyPage;
