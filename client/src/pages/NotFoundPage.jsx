import { Link } from 'react-router-dom';
import { ArrowRight, Coffee } from 'lucide-react';

function NotFoundPage() {
  return (
    <main className="lw-not-found">
      <Link className="lw-brand" to="/" aria-label="Little Window Café home">
        <span className="lw-brand-symbol"><Coffee size={17} /></span>
        <span className="lw-brand-name">little window<span>CAFÉ & GARDEN</span></span>
      </Link>
      <div className="lw-not-found-content">
        <span>404 · NOT ON TODAY’S MENU</span>
        <h1>This page took<br /><em>a wrong turn.</em></h1>
        <p>Let’s get you back to the café.</p>
        <Link to="/">Return to the café <ArrowRight size={15} /></Link>
      </div>
      <span className="lw-not-found-foot">LITTLE WINDOW · GOOD THINGS, AT YOUR PACE</span>
    </main>
  );
}

export default NotFoundPage;
