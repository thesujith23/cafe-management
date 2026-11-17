import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Clock3, Users, X } from 'lucide-react';
import { tableApi } from '../../api/apiServices';
import '../../styles/cafe-world.css';

const toLocalDateTime = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const getInitialTime = () => {
  const date = new Date();
  date.setHours(date.getHours() + 2, 0, 0, 0);
  return toLocalDateTime(date);
};

const BookingModal = ({ onClose, onBooked }) => {
  const [minimumTime] = useState(() => toLocalDateTime(new Date(Date.now() + 60 * 60 * 1000)));
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', guests: '2', startsAt: getInitialTime(), tableId: '', notes: '' });

  useEffect(() => {
    let active = true;
    tableApi.getTables().then((response) => {
      if (!active) return;
      const list = Array.isArray(response?.data) ? response.data : (response?.tables || []);
      setTables(list);
    }).catch(() => {
      if (active) setError('Tables are unavailable right now. Please try again in a moment.');
    }).finally(() => { if (active) setLoadingTables(false); });
    return () => { active = false; };
  }, []);

  const availableTables = useMemo(() => tables.filter((table) =>
    table.status === 'available' && Number(table.capacity || 4) >= Number(form.guests)), [tables, form.guests]);

  const selectedTableId = availableTables.some((table) => table.tableId === form.tableId)
    ? form.tableId
    : (availableTables[0]?.tableId || '');

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submitBooking = async (event) => {
    event.preventDefault();
    if (!selectedTableId) {
      setError('There are no available tables for that group size.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await tableApi.createReservation(selectedTableId, {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        guests: Number(form.guests),
        startsAt: new Date(form.startsAt).toISOString(),
        notes: form.notes,
      });
      if (!response?.success) throw new Error(response?.message || 'The table could not be reserved.');
      const reservedTable = response.data;
      const booked = { ...reservedTable, reservation: reservedTable.reservation || response.data?.reservation };
      setConfirmation({ table: reservedTable.displayName || reservedTable.tableId, startsAt: form.startsAt, guests: form.guests, name: form.customerName });
      onBooked?.(booked);
    } catch (bookingError) {
      setError(bookingError.message || 'The table could not be reserved. Please choose another time or table.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <header className="booking-header">
          <div><span className="booking-kicker">Little Window Café</span><h2 id="booking-title">{confirmation ? 'Your table is waiting' : 'Book a table'}</h2></div>
          <button type="button" className="booking-close" aria-label="Close booking form" onClick={onClose}><X size={19} /></button>
        </header>

        {!confirmation && <div className="booking-scene"><span><b>A little room for a good meal.</b><small>Choose your time. We’ll set the table.</small></span></div>}

        {confirmation ? (
          <div className="booking-confirmation" role="status">
            <span className="booking-confirmation-mark"><Check size={22} /></span>
            <h3>We’ve saved you a seat, {confirmation.name.split(' ')[0]}.</h3>
            <p>{confirmation.table} · {confirmation.guests} guests</p>
            <p>{new Date(confirmation.startsAt).toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
            <button type="button" className="booking-submit" onClick={onClose}>Back to the café</button>
          </div>
        ) : (
          <form className="booking-form" onSubmit={submitBooking}>
            <p className="booking-intro">Choose a time and we’ll hold an available table for your visit.</p>
            <div className="booking-field-row">
              <label className="booking-field"><span>Your name</span><input autoComplete="name" name="customerName" value={form.customerName} onChange={updateForm} minLength="2" maxLength="80" required placeholder="Name for the booking" /></label>
              <label className="booking-field"><span>Phone number</span><input autoComplete="tel" name="customerPhone" type="tel" value={form.customerPhone} onChange={updateForm} minLength="7" maxLength="20" required placeholder="For booking updates" /></label>
            </div>
            <div className="booking-field-row booking-select-row">
              <label className="booking-field booking-field-icon"><span>Date and time</span><i><CalendarDays size={15} /><input name="startsAt" type="datetime-local" value={form.startsAt} onChange={updateForm} min={minimumTime} required /></i></label>
              <label className="booking-field booking-field-icon"><span>Guests</span><i><Users size={15} /><select name="guests" value={form.guests} onChange={updateForm}>{Array.from({ length: 8 }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1} {index === 0 ? 'guest' : 'guests'}</option>)}</select><ChevronDown size={14} /></i></label>
            </div>
            <div className="booking-field-row booking-select-row">
              <label className="booking-field booking-field-icon"><span>Available table</span><i><span className="booking-table-dot" /><select name="tableId" value={selectedTableId} onChange={updateForm} disabled={loadingTables || !availableTables.length} required>
                {loadingTables && <option value="">Checking tables…</option>}
                {!loadingTables && !availableTables.length && <option value="">No tables for this group</option>}
                {availableTables.map((table) => <option value={table.tableId} key={table.tableId}>{table.displayName || table.tableId} · up to {table.capacity || 4}</option>)}
              </select><ChevronDown size={14} /></i></label>
              <label className="booking-field booking-field-icon"><span>Anything we should know?</span><i><Clock3 size={15} /><input name="notes" value={form.notes} onChange={updateForm} maxLength="300" placeholder="Optional note" /></i></label>
            </div>
            {error && <p className="booking-error" role="alert">{error}</p>}
            <button className="booking-submit" type="submit" disabled={submitting || loadingTables || !availableTables.length}>{submitting ? 'Saving your table…' : 'Reserve this table'}</button>
            <small className="booking-footnote">Reservations are held against live table availability for the next 90 days.</small>
          </form>
        )}
      </section>
    </div>
  );
};

export default BookingModal;
