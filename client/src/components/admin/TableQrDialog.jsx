import Modal from '../common/Modal';
import TableQRStandee from '../common/TableQRStandee';

// The printable standee card for one table.

const TableQrDialog = ({ table, onClose }) => {
  if (!table) return null;

  return (
  <Modal
    isOpen={!!table}
    onClose={() => onClose()}
    title={`Table Standee Card • ${table.displayName}`}
    maxWidth="max-w-md"
  >
    <div className="py-2">
      <TableQRStandee table={table} showActions={true} />
    </div>
  </Modal>

  );
};

export default TableQrDialog;
