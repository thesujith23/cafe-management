import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/common/Navbar';
import ShinyText from '../components/animations/ShinyText';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { orderApi, tableApi, menuApi } from '../api/apiServices';
import { BarChart3, LayoutDashboard, QrCode, RefreshCw, ShoppingBag, UtensilsCrossed } from 'lucide-react';
// Tabs and dialogs, one file each in components/admin.
import OverviewTab from '../components/admin/OverviewTab';
import OrdersTab from '../components/admin/OrdersTab';
import TablesTab from '../components/admin/TablesTab';
import MenuTab from '../components/admin/MenuTab';
import ReportsTab from '../components/admin/ReportsTab';
import OrderInspectorDialog from '../components/admin/OrderInspectorDialog';
import TableQrDialog from '../components/admin/TableQrDialog';
import MenuItemDialog from '../components/admin/MenuItemDialog';
import ActionDialog from '../components/admin/ActionDialog';

// Everything the counter still has to do something about.
const ACTIVE_STATUSES = ['waiting_payment', 'new', 'confirmed', 'accepted', 'preparing', 'ready'];

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const { socket, joinRoom } = useSocket();
  // Sales figures belong to the owner; the API already refuses them for counter staff.
  const canSeeReports = user?.role === 'owner';

  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, menu, tables, reports, settings
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters & Selected Modals
  const [orderStatusFilter, setOrderStatusFilter] = useState('active');
  // One small in-app dialog replaces the native prompt/confirm calls.
  const [askDialog, setAskDialog] = useState(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [orderTimeline, setOrderTimeline] = useState(null);
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);

  // New Menu Item Form state
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isVeg: true,
    prepTime: 15,
    discountPercent: 0,
  });

  // Load initial data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, tablesRes, menuRes, catRes] = await Promise.all([
        orderApi.getStats('today').catch(() => ({ success: false })),
        orderApi.getOrders({ limit: 50 }).catch(() => ({ success: false })),
        tableApi.getTablesManage().catch(() => ({ success: false })),
        menuApi.getMenuItems().catch(() => ({ success: false })),
        menuApi.getCategories().catch(() => ({ success: false })),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (ordersRes.success) setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.orders || []));
      if (tablesRes.success) setTables(Array.isArray(tablesRes.data) ? tablesRes.data : (tablesRes.data?.tables || tablesRes.tables || []));
      if (menuRes.success) setMenuItems(Array.isArray(menuRes.data?.items) ? menuRes.data.items : (Array.isArray(menuRes.data) ? menuRes.data : []));
      if (catRes.success) setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data?.categories || []));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Socket updates for live orders & tables
  useEffect(() => {
    if (!socket) return;
    joinRoom('admin');

    const handleNewOrder = (newOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === newOrder._id);
        if (exists) return prev.map((o) => (o._id === newOrder._id ? newOrder : o));
        return [newOrder, ...prev];
      });
      // Refresh stats
      orderApi.getStats('today').then((res) => {
        if (res.success) setStats(res.data);
      });
    };

    const handleStatusChanged = (data) => {
      const orderId = data.orderId || data._id;
      const status = data.preparationStatus;
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? {
                ...o,
                preparationStatus: status,
                cancelReason: data.cancelReason || o.cancelReason,
                progress: data.order?.progress || data.progress || o.progress,
              }
            : o
        )
      );
    };

    const handleTableUpdate = (updatedTable) => {
      setTables((prev) =>
        prev.map((t) =>
          t._id === updatedTable._id || t.tableId === updatedTable.tableId
            ? { ...t, ...updatedTable }
            : t
        )
      );
    };

    // A dish was ticked off: the event carries the whole ticket, progress included.
    const handleItemsUpdate = (updatedOrder) => {
      if (!updatedOrder?._id) return;
      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
      setSelectedOrderForModal((prev) => (prev && prev._id === updatedOrder._id ? updatedOrder : prev));
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:status:changed', handleStatusChanged);
    socket.on('order:statusUpdate', handleStatusChanged);
    socket.on('order:cancelled', handleStatusChanged);
    socket.on('order:items:update', handleItemsUpdate);
    socket.on('table:statusUpdate', handleTableUpdate);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:status:changed', handleStatusChanged);
      socket.off('order:statusUpdate', handleStatusChanged);
      socket.off('order:cancelled', handleStatusChanged);
      socket.off('order:items:update', handleItemsUpdate);
      socket.off('table:statusUpdate', handleTableUpdate);
    };
  }, [socket, joinRoom]);

  // The percent inside a stage is time-based, so nudge the rows along between events.
  useEffect(() => {
    const timer = setInterval(() => {
      orderApi.getOrders({ limit: 50 })
        .then((res) => {
          if (res?.success && Array.isArray(res.data)) setOrders(res.data);
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Load the recorded transitions whenever the inspector opens.
  useEffect(() => {
    const orderId = selectedOrderForModal?._id;
    if (!orderId) {
      setOrderTimeline(null);
      return undefined;
    }
    let cancelled = false;
    setOrderTimeline(null);
    orderApi.getOrderTimeline(orderId)
      .then((res) => { if (!cancelled) setOrderTimeline(res?.data?.timeline || []); })
      .catch(() => { if (!cancelled) setOrderTimeline([]); });
    return () => { cancelled = true; };
  }, [selectedOrderForModal?._id]);

  // Order status update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, preparationStatus: newStatus } : o))
      );
      if (selectedOrderForModal && selectedOrderForModal._id === orderId) {
        setSelectedOrderForModal((prev) => ({ ...prev, preparationStatus: newStatus }));
      }
      await orderApi.updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error(err);
      loadDashboardData();
    }
  };

  // Put the server's fresh copy of an order into both the table and the open inspector.
  const applyUpdatedOrder = (updated) => {
    if (!updated?._id) return;
    setOrders((prev) => prev.map((row) => (row._id === updated._id ? updated : row)));
    setSelectedOrderForModal((prev) => (prev && prev._id === updated._id ? updated : prev));
  };

  // Ring the guest again that their order is waiting at the counter.
  const handleNotifyGuest = async (order) => {
    try {
      const response = await orderApi.notifyGuest(order._id);
      if (!response?.success) throw new Error(response?.message || 'The guest could not be notified.');
      applyUpdatedOrder(response.data?.order);
      toast.success(`Guest notified for ${order.orderNumber}`);
    } catch (err) {
      // 429 (the cooldown) is already announced by the axios interceptor.
      if (err.response?.status !== 429) {
        toast.error(err.response?.data?.message || err.message || 'The guest could not be notified.');
      }
    }
  };

  // Tick one dish off the ticket, or put it back in the pan.
  const handleToggleItem = async (order, item) => {
    try {
      const response = await orderApi.toggleOrderItem(order._id, item._id, !item.isDone);
      if (!response?.success) throw new Error(response?.message || 'That dish could not be updated.');
      applyUpdatedOrder(response.data);
    } catch (err) {
      console.error(err);
      loadDashboardData();
    }
  };

  // Send a bumped ticket back to the kitchen.
  const handleRecallOrder = async (orderId) => {
    try {
      const response = await orderApi.updateOrderStatus(orderId, 'preparing');
      if (!response?.success) throw new Error(response?.message || 'That ticket could not be recalled.');
      applyUpdatedOrder(response.data);
    } catch (err) {
      console.error(err);
      loadDashboardData();
    }
  };

  const openAsk = (config) => setAskDialog(config);
  const closeAsk = () => setAskDialog(null);

  // Clear / Dismiss order from live view and table
  const handleClearOrder = (orderId) => {
    openAsk({
      title: 'Clear this order?',
      message: 'It leaves the live board and the active records.',
      confirmLabel: 'Clear order',
      onConfirm: async () => {
        try {
          setOrders((prev) => prev.filter((o) => o._id !== orderId));
          if (selectedOrderForModal?._id === orderId) setSelectedOrderForModal(null);
          await orderApi.clearOrder(orderId);
        } catch (err) {
          console.error(err);
          loadDashboardData();
        }
      },
    });
  };

  // Staff Cancel Order Override with reason
  const handleCancelOrderStaff = (orderId) => {
    const target = orders.find((o) => o._id === orderId);
    openAsk({
      title: 'Cancel this order?',
      message: `${target?.orderNumber || 'This order'} will show as cancelled on the guest's tracker, with the reason below.`,
      confirmLabel: 'Cancel order',
      fields: [
        { key: 'reason', label: 'Reason (the guest sees this)', defaultValue: 'Cancelled by counter staff', required: true },
      ],
      onConfirm: async ({ reason }) => {
        const trimmed = reason.trim();
        try {
          setOrders((prev) =>
            prev.map((o) =>
              o._id === orderId
                ? { ...o, preparationStatus: 'cancelled', cancelReason: trimmed }
                : o
            )
          );
          await orderApi.cancelOrder(orderId, trimmed);
        } catch (err) {
          console.error(err);
          loadDashboardData();
        }
      },
    });
  };

  // Admin / Counter table status update
  const handleUpdateTableStatus = async (tableId, newStatus, customerData = {}) => {
    try {
      setTables((prev) =>
        prev.map((t) =>
          t._id === tableId || t.tableId === tableId
            ? {
                ...t,
                status: newStatus,
                currentCustomer:
                  newStatus === 'available'
                    ? { name: '', phone: '', guests: 1 }
                    : customerData.customerName
                    ? { name: customerData.customerName, phone: customerData.customerPhone || '', guests: customerData.guests || 1 }
                    : t.currentCustomer,
              }
            : t
        )
      );
      await tableApi.updateStatus(tableId, newStatus, customerData);
    } catch (err) {
      console.error(err);
      loadDashboardData();
    }
  };

  // Freeing a table throws away the guest on it, so it asks first.
  const handleFreeTable = (table) => {
    openAsk({
      title: `Free ${table.displayName}?`,
      message: 'The guest’s name is cleared and the table shows as available. Past orders stay in your records.',
      confirmLabel: 'Free table',
      cancelLabel: 'Keep guest',
      onConfirm: () => handleClearTable(table._id),
    });
  };

  // Clear table (sets available and frees table)
  const handleClearTable = async (tableId) => {
    try {
      setTables((prev) =>
        prev.map((t) =>
          t._id === tableId || t.tableId === tableId
            ? { ...t, status: 'available', currentCustomer: { name: '', phone: '', guests: 1 }, activeOrders: [] }
            : t
        )
      );
      await tableApi.clearTable(tableId);
    } catch (err) {
      console.error(err);
      loadDashboardData();
    }
  };

  // Toggle Menu Item stock availability
  const handleToggleMenuAvailability = async (itemId) => {
    try {
      setMenuItems((prev) =>
        prev.map((i) => (i._id === itemId ? { ...i, isAvailable: !i.isAvailable } : i))
      );
      await menuApi.toggleAvailability(itemId);
    } catch (err) {
      console.error(err);
      loadDashboardData();
    }
  };

  // Seat a walk-in table: one dialog, two fields.
  const handleSeatTable = (table) => {
    openAsk({
      title: `Seat guests at ${table.displayName}`,
      confirmLabel: 'Seat table',
      fields: [
        { key: 'name', label: 'Guest name', defaultValue: 'Walk-in Guest' },
        { key: 'guests', label: 'Guests', type: 'number', defaultValue: '2' },
      ],
      onConfirm: ({ name, guests }) => handleUpdateTableStatus(table._id, 'occupied', {
        customerName: (name || 'Walk-in Guest').trim(),
        guests: parseInt(guests, 10) || 1,
      }),
    });
  };

  // Open the menu-item form for a new dish.
  const handleStartAddItem = () => {
    setEditingMenuItem(null);
    setItemForm({
      name: '',
      description: '',
      price: '',
      category: categories[0]?._id || '',
      isVeg: true,
      prepTime: 15,
      discountPercent: 0,
    });
    setIsAddItemModalOpen(true);
  };

  // Save / Create Menu Item
  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemForm,
        price: Number(itemForm.price),
        prepTime: Number(itemForm.prepTime),
        discountPercent: Number(itemForm.discountPercent),
        category: itemForm.category || categories[0]?._id,
      };

      if (editingMenuItem) {
        await menuApi.updateMenuItem(editingMenuItem._id, payload);
      } else {
        await menuApi.createMenuItem(payload);
      }

      setIsAddItemModalOpen(false);
      setEditingMenuItem(null);
      setItemForm({
        name: '',
        description: '',
        price: '',
        category: '',
        isVeg: true,
        prepTime: 15,
        discountPercent: 0,
      });

      // Reload menu
      const res = await menuApi.getMenuItems();
      if (res.success) setMenuItems(res.data?.items || []);
    } catch (err) {
      toast.error(err.message || 'That dish could not be saved.');
    }
  };

  // Open Edit Item modal
  const handleEditItem = (item) => {
    setEditingMenuItem(item);
    setItemForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category?._id || item.category,
      isVeg: item.isVeg,
      prepTime: item.prepTime || 15,
      discountPercent: item.discountPercent || 0,
    });
    setIsAddItemModalOpen(true);
  };

  // Delete Menu Item
  const handleDeleteItem = (itemId) => {
    openAsk({
      title: 'Delete this menu item?',
      message: 'It disappears from every table menu. Past orders keep their own copy.',
      confirmLabel: 'Delete item',
      onConfirm: async () => {
        try {
          setMenuItems((prev) => prev.filter((i) => i._id !== itemId));
          await menuApi.deleteMenuItem(itemId);
        } catch (err) {
          console.error(err);
          loadDashboardData();
        }
      },
    });
  };

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.preparationStatus));

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'active') return ACTIVE_STATUSES.includes(o.preparationStatus);
    if (orderStatusFilter === 'all') return true;
    if (orderStatusFilter === 'served' || orderStatusFilter === 'completed') {
      return o.preparationStatus === 'served' || o.preparationStatus === 'completed';
    }
    return o.preparationStatus === orderStatusFilter;
  });

  return (
    <div className="pixel-screen pixel-admin-screen min-h-screen bg-lavender_blush-900 flex flex-col font-futura text-space_indigo selection:bg-dusty_mauve selection:text-white">
      <Navbar />

      {/* Admin Dashboard Sub-Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-thistle-700 px-4 sm:px-6 lg:px-8 py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-tenez text-space_indigo tracking-tight m-0">
                <ShinyText text="Café Management Console" color="#2f4a3a" shineColor="#ff7a5c" speed={3} />
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-thistle-900 border border-thistle-700 text-space_indigo uppercase tracking-wider font-aleo">
                {user?.role || 'Staff Mode'}
              </span>
            </div>
            <p className="text-xs text-space_indigo-400 mt-1 font-aleo">
              Live orders, 6-table QR management, menu catalog, and revenue reports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-thistle-700 bg-white hover:bg-thistle-900 text-xs font-semibold font-aleo text-space_indigo transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-dusty_mauve' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pt-3.5 border-t border-thistle-700 mt-3.5">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'orders', label: 'Live Orders', icon: ShoppingBag, count: activeOrders.length },
            { id: 'tables', label: 'Tables & QR Codes', icon: QrCode, count: 6 },
            { id: 'menu', label: 'Menu Catalog', icon: UtensilsCrossed, count: menuItems.length },
            ...(canSeeReports ? [{ id: 'reports', label: 'Sales Reports', icon: BarChart3 }] : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold font-aleo transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-space_indigo text-white shadow-sm'
                    : 'text-space_indigo-400 hover:text-space_indigo hover:bg-thistle-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.2 rounded-md text-[10px] font-bold font-futura ${
                      isActive ? 'bg-space_indigo-400 text-white' : 'bg-thistle-900 text-space_indigo'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            orders={orders}
            tables={tables}
            onOpenTab={setActiveTab}
            onInspectTable={setSelectedTableForQR}
            onInspectOrder={setSelectedOrderForModal}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersTab
            orders={filteredOrders}
            filter={orderStatusFilter}
            onFilterChange={setOrderStatusFilter}
            onAdvanceStatus={handleUpdateOrderStatus}
            onInspect={setSelectedOrderForModal}
            onNotifyGuest={handleNotifyGuest}
          />
        )}

        {activeTab === 'tables' && (
          <TablesTab
            tables={tables}
            onFreeTable={handleFreeTable}
            onSeatTable={handleSeatTable}
            onShowStandee={setSelectedTableForQR}
          />
        )}

        {activeTab === 'menu' && (
          <MenuTab
            menuItems={menuItems}
            categories={categories}
            onAdd={handleStartAddItem}
            onEdit={handleEditItem}
            onToggleAvailability={handleToggleMenuAvailability}
            onDelete={handleDeleteItem}
          />
        )}

        {activeTab === 'reports' && <ReportsTab stats={stats} orders={orders} />}
      </main>

      {askDialog && (
        <ActionDialog
          key={askDialog.title}
          dialog={askDialog}
          onClose={closeAsk}
          onConfirm={(values) => {
            const handler = askDialog.onConfirm;
            closeAsk();
            handler?.(values);
          }}
        />
      )}

      <OrderInspectorDialog
        order={selectedOrderForModal}
        timeline={orderTimeline}
        onClose={() => setSelectedOrderForModal(null)}
        onAdvanceStatus={handleUpdateOrderStatus}
        onToggleItem={handleToggleItem}
        onCancelOrder={handleCancelOrderStaff}
        onClearOrder={handleClearOrder}
        onRecall={handleRecallOrder}
      />
      <TableQrDialog table={selectedTableForQR} onClose={() => setSelectedTableForQR(null)} />
      <MenuItemDialog
        open={isAddItemModalOpen}
        editingItem={editingMenuItem}
        categories={categories}
        form={itemForm}
        onChange={setItemForm}
        onSave={handleSaveMenuItem}
        onClose={() => setIsAddItemModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboardPage;
