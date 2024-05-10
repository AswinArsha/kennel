

const ReservationTable = ({ reservations, onConfirm, onEdit, onCheckout, onCancel }) => { // Ensure onCancel is included in props
  return (
    <table className="border-collapse w-full text-center">
      <thead>
        <tr>
          <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Customer Name</th>
          <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Kennel Numbers</th>
          <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Start Date</th>
          <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">End Date</th>
          <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Status</th>
          <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        {reservations.map((reservation) => (
          <tr key={reservation.id} className="bg-white hover:bg-gray-100">
            <td className="p-3 text-gray-800 border">{reservation.customer_name}</td>
            <td className="p-3 text-gray-800 border">{reservation.kennel_numbers}</td>
            <td className="p-3 text-gray-800 border">{new Date(reservation.start_date).toDateString()}</td>
            <td className="p-3 text-gray-800 border">{new Date(reservation.end_date).toDateString()}</td>
            <td className="p-3 text-gray-800 border">
              <span
                className={`rounded py-1 px-3 text-xs font-bold ${
                  reservation.status === "confirmed"
                    ? "bg-green-400"
                    : reservation.status === "canceled"
                    ? "bg-red-400"
                    : reservation.status === "checkout"
                    ? "bg-blue-400"
                    : "bg-yellow-400"
                }`}
              >
                {reservation.status}
              </span>
            </td>
            <td className="p-3 text-gray-800 border">
              {reservation.status === "pending" && (
                <button
                  className="bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600"
                  onClick={() => onConfirm(reservation)}
                >
                  Confirm
                </button>
              )}
              {reservation.status === "pending" && onCancel && ( // Check if onCancel is defined
                <button
                  className="bg-red-500 text-white py-1 px-2 rounded-md hover:bg-red-600 ml-2"
                  onClick={() => onCancel(reservation)}
                >
                  Cancel
                </button>
              )}
              {reservation.status === "confirmed" && (
                <>
                  <button
                    className="bg-blue-500 text-white py-1 px-2 rounded-md hover:bg-blue-600 ml-2"
                    onClick={() => onEdit(reservation)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-indigo-500 text-white py-1 px-2 rounded-md hover:bg-indigo-600 ml-2"
                    onClick={() => onCheckout(reservation)}
                  >
                    Checkout
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ReservationTable;
