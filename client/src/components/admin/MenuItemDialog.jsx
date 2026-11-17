import Modal from '../common/Modal';

// Create or edit a dish: name, description, price, category, prep time, veg flag.

const MenuItemDialog = ({ open, editingItem, categories, form, onChange, onSave, onClose }) => {
  if (!open) return null;

  return (
  <Modal
    isOpen={open}
    onClose={onClose}
    title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
    maxWidth="max-w-md"
  >
    <form onSubmit={onSave} className="space-y-4 font-futura">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-space_indigo-100 font-aleo mb-1">
          Item Name
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-2xl border border-thistle-700 bg-lavender_blush-900/60 text-sm text-space_indigo-100 focus:outline-hidden focus:border-dusty_mauve focus:ring-2 focus:ring-dusty_mauve/30 transition-all placeholder:text-thistle-400"
          placeholder="e.g., Artisanal Sourdough Toast"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-space_indigo-100 font-aleo mb-1">
          Description
        </label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          className="w-full px-3.5 py-2 rounded-2xl border border-thistle-700 bg-lavender_blush-900/60 text-sm text-space_indigo-100 focus:outline-hidden focus:border-dusty_mauve focus:ring-2 focus:ring-dusty_mauve/30 transition-all placeholder:text-thistle-400"
          placeholder="Ingredients, preparation details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-space_indigo-100 font-aleo mb-1">
            Price (₹)
          </label>
          <input
            type="number"
            required
            min="1"
            value={form.price}
            onChange={(e) => onChange({ ...form, price: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-thistle-700 bg-lavender_blush-900/60 text-sm text-space_indigo-100 focus:outline-hidden focus:border-dusty_mauve focus:ring-2 focus:ring-dusty_mauve/30 transition-all"
            placeholder="249"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-space_indigo-100 font-aleo mb-1">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => onChange({ ...form, category: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-thistle-700 bg-lavender_blush-900/60 text-sm text-space_indigo-100 focus:outline-hidden focus:border-dusty_mauve focus:ring-2 focus:ring-dusty_mauve/30 transition-all"
          >
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-space_indigo-100 font-aleo mb-1">
            Prep Time (Mins)
          </label>
          <input
            type="number"
            min="1"
            value={form.prepTime}
            onChange={(e) => onChange({ ...form, prepTime: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-thistle-700 bg-lavender_blush-900/60 text-sm text-space_indigo-100 focus:outline-hidden focus:border-dusty_mauve focus:ring-2 focus:ring-dusty_mauve/30 transition-all"
          />
        </div>

        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-space_indigo-100 font-aleo">
            <input
              type="checkbox"
              checked={form.isVeg}
              onChange={(e) => onChange({ ...form, isVeg: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Vegetarian Dish</span>
          </label>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-space_indigo via-dusty_mauve to-space_indigo hover:brightness-110 active:scale-98 text-white font-bold text-xs uppercase tracking-wide shadow-md shadow-space_indigo/30 transition-all cursor-pointer font-aleo"
        >
          {editingItem ? 'Save Changes' : 'Create Menu Item'}
        </button>
      </div>
    </form>
  </Modal>
  );
};

export default MenuItemDialog;
