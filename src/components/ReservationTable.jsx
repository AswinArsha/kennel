// ReservationTable.jsx
import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import BillGenerationModal from "./BillGenerationModal";

const SkeletonLoader = () => (
  <tr>
    <td colSpan={15} className="p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded"></div>
      </div>
    </td>
  </tr>
);

const ReservationTable = ({
  reservations,
  loading,
  onConfirm,
  onCancel,
  onEdit,
  onCheckout,
  isCheckoutModalOpen,
  setIsCheckoutModalOpen,
  selectedReservation,
  setSelectedReservation,
  currentPage,
  reservationsPerPage,
  totalReservations,
  handlePageChange,
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const totalPages = Math.ceil(totalReservations / reservationsPerPage);

  return (
    <div className=" max-h-screen-60 rounded-lg border border-gray-200">
      <div className="overflow-auto">
      <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">No.</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Customer Name</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Phone Number</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Pet Name</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Pet Breed</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Reservation Date</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Kennel Numbers</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Check In</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Check Out</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Pickup</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Drop</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Groom</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Status</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Advanced Paid</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Payment Mode</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading ? (
            <SkeletonLoader />
          ) : reservations.length > 0 ? (
            reservations.map((reservation, index) => (
              <tr key={reservation.id} className="bg-white hover:bg-gray-100">
                <td className="whitespace-nowrap text-center px-4 py-2 font-medium text-gray-900">
                  {index + 1 + (currentPage - 1) * reservationsPerPage}
                </td>
                <td className="whitespace-nowrap px-4 text-center py-2 font-medium text-gray-900">
                  {reservation.customers.customer_name}
                </td>
                <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                  {reservation.customers.customer_phone}
                </td>
                <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                  {reservation.pet_name}
                </td>
                <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                  {reservation.pet_breed}
                </td>
                <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                  {formatDate(reservation.created_at)}
                </td>
                <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                  {reservation.kennel_numbers && reservation.kennel_numbers.length > 0
                    ? reservation.kennel_numbers.map((num) => `Kennel ${num}`).join(", ")
                    : "N/A"}
                </td>
                <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                  {formatDate(reservation.start_date)}
                </td>
                <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                  {formatDate(reservation.end_date)}
                </td>
                <td className="whitespace-nowrap pl-7 py-2 text-center">
                  {reservation.pickup ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-500" />}
                </td>
                <td className="whitespace-nowrap pl-6 py-2 text-center">
                  {reservation.drop ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-500" />}
                </td>
                <td className="whitespace-nowrap pl-8 py-2 text-center">
                  {reservation.groom ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-500" />}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-800">
                  <span
                    className={`rounded py-1 px-3 text-xs font-bold ${
                      reservation.status === "checkin"
                        ? "bg-green-400"
                        : reservation.status === "canceled"
                        ? "bg-red-400"
                        : reservation.status === "checkout"
                        ? "bg-blue-400"
                        : "bg-yellow-400"
                    }`}
                  >
                    {reservation.status === "checkin" ? "Check In" : reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
                  {reservation.advance_amount ? reservation.advance_amount.toFixed(0) : "0"}
                </td>
                <td className="whitespace-nowrap px-4 text-center py-2 text-gray-700">
          {reservation.payment_mode ? reservation.payment_mode : ""} {/* Display payment_mode */}
        </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-800">
                  {reservation.status === "reserved" && (
                    <>
                      <button
                        className="bg-green-500 text-white py-1 px-2 rounded-md hover:bg-green-600"
                        onClick={() => onConfirm(reservation)}
                      >
                        Check In
                      </button>
                      <button
                        className="bg-blue-500 text-white py-1 px-2 rounded-md hover:bg-blue-600 ml-2"
                        onClick={() => onEdit(reservation)}
                      >
                        Edit
                      </button>
                    </>
                  )}
                  {reservation.status === "reserved" && onCancel && (
                    <button
                      className="bg-red-500 text-white py-1 px-2 rounded-md hover:bg-red-600 ml-2"
                      onClick={() => onCancel(reservation)}
                    >
                      Cancel
                    </button>
                  )}
                  {reservation.status === "checkin" && (
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
                        Check Out
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            !loading && (
              <tr>
                <td colSpan={15} className="text-center py-4 text-gray-700">
                  No reservations found.
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
      </div>
      {/* Pagination Numbers */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2 ">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`py-1 px-3 mb-4 rounded-md ${
                currentPage === i + 1
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {isCheckoutModalOpen && (
        <BillGenerationModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          selectedReservation={selectedReservation}
        />
      )}
    </div>
  );
};

export default ReservationTable;
