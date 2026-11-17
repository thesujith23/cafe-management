import { useState } from 'react';
import { Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

// The menu catalog: every dish with its stock toggle, edit and delete.

const MenuTab = ({ menuItems, categories, onAdd, onEdit, onToggleAvailability, onDelete }) => {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visibleItems = needle
    ? menuItems.filter((item) => `${item.name} ${item.category?.name || ''}`.toLowerCase().includes(needle))
    : menuItems;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold font-tenez text-space_indigo-100">Menu Catalog</h3>
          <p className="text-xs text-thistle-400 font-aleo mt-0.5">
            {menuItems.length} active culinary offerings across {categories.length} categories
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-thistle-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a dish"
              aria-label="Search the menu catalog"
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-thistle-700 bg-white text-xs text-space_indigo font-aleo outline-none focus:border-dusty_mauve"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-thistle-400 hover:text-space_indigo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </label>

          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-space_indigo to-dusty_mauve hover:brightness-110 text-white font-bold text-xs shadow-md shadow-space_indigo/30 transition-all cursor-pointer font-aleo shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add item</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-thistle-700 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-lavender_blush-900/60 text-thistle-400 font-bold uppercase tracking-wider font-aleo border-b border-thistle-800">
              <tr>
                <th className="p-4">Dish</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">In Stock</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-thistle-800/40 font-futura">
              {visibleItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-thistle-400 font-aleo">
                    No dish matches “{query}”.
                  </td>
                </tr>
              )}
              {visibleItems.map((item) => (
                <tr key={item._id} className="hover:bg-lavender_blush-900/40 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-space_indigo-100 font-aleo text-sm">{item.name}</div>
                    <div className="text-[11px] text-thistle-400 line-clamp-1 font-aleo mt-0.5">
                      {item.description}
                    </div>
                  </td>
                  <td className="p-4 font-aleo">
                    <div className="flex items-center gap-2 text-space_indigo-200 font-medium">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`}
                        title={item.isVeg ? 'Vegetarian' : 'Contains meat'}
                      />
                      <span>{item.category?.name || 'General'}</span>
                    </div>
                    <div className="text-[11px] text-thistle-400 mt-0.5">{item.prepTime || 15} min to cook</div>
                  </td>
                  <td className="p-4 font-black text-space_indigo-100 font-futura">
                    {formatINR(item.price)}
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => onToggleAvailability(item._id)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer font-aleo ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-thistle-400 hover:text-space_indigo-100 hover:bg-thistle-800 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(item._id)}
                        className="p-2 text-thistle-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

  );
};

export default MenuTab;
