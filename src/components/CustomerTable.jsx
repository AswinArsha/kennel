// CustomerTable.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import CustomerFilter from "./CustomerFilter";
import Modal from "react-modal";

// Set the app element for accessibility
Modal.setAppElement("#root");

const CustomerTable = ({
  onViewCustomer,
  onConfirm,
  onCancel,
  onEdit,
  onCheckout,
}) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state

  // State for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [editData, setEditData] = useState({
    check_in_date: "",
    check_out_date: "",
    days_stayed: 0,
    total_bill: 0,
    payment_mode: "",
  });
  const [editErrors, setEditErrors] = useState({});

  const fetchCustomers = async () => {
    setLoading(true); // Start loading
    const { data: historicalReservations, error } = await supabase
      .from("historical_reservations")
      .select(`
        id,
        customer_id,
        pet_name,
        pet_breed,
        start_date,
        end_date,
        status,
        created_at,
        kennel_ids,
        pickup,
        groom,
        drop,
        payment_mode
      `);

    if (error) {
      console.error("Error fetching historical reservations:", error.message);
      setLoading(false); // End loading on error
      return;
    }

    const customerIds = historicalReservations.map(
      (reservation) => reservation.customer_id
    );

    const { data: customersData, error: customerError } = await supabase
      .from("customers")
      .select("id, customer_name, customer_phone, customer_address")
      .in("id", customerIds);

    if (customerError) {
      console.error("Error fetching customers:", customerError.message);
      setLoading(false); // End loading on error
      return;
    }

    // Fetch analytics data based on customer_id, pet_name, start_date, and end_date
    const { data: analyticsData, error: analyticsError } = await supabase
      .from("analytics")
      .select("customer_id, pet_name, start_date, end_date, days_stayed, total_bill")
      .in("customer_id", customerIds);

    if (analyticsError) {
      console.error("Error fetching analytics data:", analyticsError.message);
      setLoading(false); // End loading on error
      return;
    }

    const enhancedReservations = historicalReservations.map((reservation) => {
      const customer = customersData.find(
        (c) => c.id === reservation.customer_id
      );
      const analytics = analyticsData.find(
        (a) =>
          a.customer_id === reservation.customer_id &&
          a.pet_name === reservation.pet_name &&
          new Date(a.start_date).toDateString() ===
            new Date(reservation.start_date).toDateString() &&
          new Date(a.end_date).toDateString() ===
            new Date(reservation.end_date).toDateString()
      );
      return {
        ...reservation,
        customer_name: customer ? customer.customer_name : "N/A",
        customer_phone: customer ? customer.customer_phone : "N/A",
        customer_address: customer ? customer.customer_address : "N/A",
        days_stayed: analytics ? analytics.days_stayed : null,
        total_bill: analytics ? analytics.total_bill : null,
      };
    });

    // Sort reservations by created_at date
    enhancedReservations.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    setCustomers(enhancedReservations);
    setFilteredCustomers(enhancedReservations);
    setLoading(false); // End loading after data is fetched
  };

  const applyFilters = (query, startDate, endDate, status) => {
    let filtered = customers;

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.customer_name.toLowerCase().includes(lowerQuery) ||
          customer.pet_name.toLowerCase().includes(lowerQuery) ||
          customer.pet_breed.toLowerCase().includes(lowerQuery)
      );
    }

    if (startDate && endDate) {
      filtered = filtered.filter(
        (customer) =>
          new Date(customer.start_date) >= startDate &&
          new Date(customer.end_date) <=
            new Date(endDate).setHours(23, 59, 59, 999)
      );
    }

    if (status) {
      filtered = filtered.filter((customer) => customer.status === status);
    }

    setFilteredCustomers(filtered);
  };

  const handleSearch = (query, startDate, endDate, status) => {
    applyFilters(query, startDate, endDate, status);
  };

  const handleDateFilter = (query, startDate, endDate, status) => {
    applyFilters(query, startDate, endDate, status);
  };

  const handleStatusFilter = (query, startDate, endDate, status) => {
    applyFilters(query, startDate, endDate, status);
  };

  useEffect(() => {
    fetchCustomers(); // Fetch on component mount
  }, []);

  // Handler to open Edit Modal
  const openEditModal = (reservation) => {
    setSelectedReservation(reservation);
    setEditData({
      check_in_date: reservation.start_date,
      check_out_date: reservation.end_date,
      days_stayed: reservation.days_stayed || 0,
      total_bill: reservation.total_bill || 0,
      payment_mode: reservation.payment_mode || "",
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  // Handler to close Edit Modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedReservation(null);
    setEditData({
      check_in_date: "",
      check_out_date: "",
      days_stayed: 0,
      total_bill: 0,
      payment_mode: "",
    });
    setEditErrors({});
  };

  // Handler for Edit Form Input Changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handler for Edit Form Submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    const validationErrors = {};
    let isValid = true;

    if (!editData.check_in_date) {
      validationErrors.check_in_date = "Check-in date is required.";
      isValid = false;
    }

    if (!editData.check_out_date) {
      validationErrors.check_out_date = "Check-out date is required.";
      isValid = false;
    }

    if (new Date(editData.check_out_date) < new Date(editData.check_in_date)) {
      validationErrors.check_out_date = "Check-out date cannot be before check-in date.";
      isValid = false;
    }

    if (!editData.days_stayed || editData.days_stayed < 1) {
      validationErrors.days_stayed = "Days stayed must be at least 1.";
      isValid = false;
    }

    if (editData.total_bill === "" || editData.total_bill < 0) {
      validationErrors.total_bill = "Total bill must be a positive number.";
      isValid = false;
    }

    if (!editData.payment_mode) {
      validationErrors.payment_mode = "Please select a payment mode.";
      isValid = false;
    }

    setEditErrors(validationErrors);

    if (!isValid) {
      console.error("Validation errors:", validationErrors);
      return;
    }

    // Close the modal and show loading skeleton
    closeEditModal();
    setLoading(true);

    try {
      // Update historical_reservations table
      const { error: updateReservationError } = await supabase
        .from("historical_reservations")
        .update({
          start_date: editData.check_in_date,
          end_date: editData.check_out_date,
          payment_mode: editData.payment_mode,
          status: "checkout", // Assuming status needs to be updated
        })
        .eq("id", selectedReservation.id);

      if (updateReservationError) {
        throw updateReservationError;
      }

      // Update analytics table
      // Find the corresponding analytics record
      const { data: analyticsRecord, error: fetchAnalyticsError } = await supabase
        .from("analytics")
        .select("*")
        .eq("customer_id", selectedReservation.customer_id)
        .eq("pet_name", selectedReservation.pet_name)
        .eq("start_date", selectedReservation.start_date)
        .eq("end_date", selectedReservation.end_date)
        .single();

      if (fetchAnalyticsError) {
        throw fetchAnalyticsError;
      }

      const { error: updateAnalyticsError } = await supabase
        .from("analytics")
        .update({
          days_stayed: editData.days_stayed,
          total_bill: editData.total_bill,
        })
        .eq("id", analyticsRecord.id);

      if (updateAnalyticsError) {
        throw updateAnalyticsError;
      }

      // Optionally, update the bills table if needed
      const { error: updateBillsError } = await supabase
        .from("bills")
        .update({
          total_bill: editData.total_bill,
        })
        .eq("customer_id", selectedReservation.customer_id)
        .eq("check_in_date", selectedReservation.start_date)
        .eq("check_out_date", selectedReservation.end_date);

      if (updateBillsError) {
        throw updateBillsError;
      }

      console.log("Reservation updated successfully!");

      // Refresh the customer data
      await fetchCustomers();

      // Hide loading skeleton
      setLoading(false);
    } catch (error) {
      console.error("Error updating reservation:", error.message);
      setLoading(false); // Hide loading even on error
    }
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => {
    const skeletonRows = Array.from({ length: 10 }, (_, index) => (
      <tr key={index} className="bg-white">
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-6"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-10"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </td>
        <td className="whitespace-nowrap px-4 py-2">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
      </tr>
    ));

    return <>{skeletonRows}</>;
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={closeEditModal}
        contentLabel="Edit Reservation"
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "500px",
            width: "90%",
          },
        }}
      >
        {selectedReservation && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Edit Reservation
            </h2>
            <form onSubmit={handleEditSubmit}>
              {/* Customer Name (Read-Only) */}
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={selectedReservation.customer_name}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100"
                />
              </div>

              {/* Check-In Date */}
              <div className="mb-4">
                <label
                  htmlFor="check_in_date"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Check-In Date
                </label>
                <input
                  type="date"
                  id="check_in_date"
                  name="check_in_date"
                  value={editData.check_in_date}
                  onChange={handleEditInputChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.check_in_date
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {editErrors.check_in_date && (
                  <p className="text-red-500 text-sm mt-1">
                    {editErrors.check_in_date}
                  </p>
                )}
              </div>

              {/* Check-Out Date */}
              <div className="mb-4">
                <label
                  htmlFor="check_out_date"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Check-Out Date
                </label>
                <input
                  type="date"
                  id="check_out_date"
                  name="check_out_date"
                  value={editData.check_out_date}
                  onChange={handleEditInputChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.check_out_date
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {editErrors.check_out_date && (
                  <p className="text-red-500 text-sm mt-1">
                    {editErrors.check_out_date}
                  </p>
                )}
              </div>

              {/* Days Stayed */}
              <div className="mb-4">
                <label
                  htmlFor="days_stayed"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Days Stayed
                </label>
                <input
                  type="number"
                  id="days_stayed"
                  name="days_stayed"
                  min="1"
                  value={editData.days_stayed}
                  onChange={handleEditInputChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.days_stayed
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {editErrors.days_stayed && (
                  <p className="text-red-500 text-sm mt-1">
                    {editErrors.days_stayed}
                  </p>
                )}
              </div>

              {/* Total Bill */}
              <div className="mb-4">
                <label
                  htmlFor="total_bill"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Total Bill (in Rupees)
                </label>
                <input
                  type="number"
                  id="total_bill"
                  name="total_bill"
                  min="0"
                  value={editData.total_bill}
                  onChange={handleEditInputChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.total_bill
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {editErrors.total_bill && (
                  <p className="text-red-500 text-sm mt-1">
                    {editErrors.total_bill}
                  </p>
                )}
              </div>

              {/* Payment Mode */}
              <div className="mb-4">
                <label
                  htmlFor="payment_mode"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Payment Mode
                </label>
                <select
                  id="payment_mode"
                  name="payment_mode"
                  value={editData.payment_mode}
                  onChange={handleEditInputChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.payment_mode
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select Payment Mode</option>
                  <option value="gpay">GPay</option>
                  <option value="cash">Cash</option>
                  <option value="swipe">Swipe</option>
                </select>
                {editErrors.payment_mode && (
                  <p className="text-red-500 text-sm mt-1">
                    {editErrors.payment_mode}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      <CustomerFilter
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onStatusFilter={handleStatusFilter}
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div className="max-h-[530px] overflow-y-auto">
          <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
            <thead className="bg-gray-50 sticky top-0 z-0">
              <tr>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  No.
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Customer Name
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Phone
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Address
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Check In
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Check Out
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Breed
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Days Stayed
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Total Bill
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Payment Mode
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Action
                </th> {/* New Action Column */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <SkeletonLoader />
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="bg-white hover:bg-gray-100">
                    <td className="whitespace-nowrap text-center px-4 py-2 font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="whitespace-nowrap text-center px-4 py-2 font-medium text-gray-900">
                      {customer.customer_name}
                    </td>
                    <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                      {customer.customer_phone}
                    </td>
                    <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                      {customer.customer_address}
                    </td>
                    <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                      {new Date(customer.start_date).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                      {new Date(customer.end_date).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                      {customer.pet_breed}
                    </td>
                    <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                      {customer.days_stayed !== null
                        ? customer.days_stayed
                        : "N/A"}
                    </td>
                    <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                      {customer.total_bill !== null
                        ? `₹${customer.total_bill}`
                        : "N/A"}
                    </td>
                    <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                      {customer.payment_mode
                        ? customer.payment_mode.toUpperCase()
                        : "N/A"}
                    </td>
                    <td className="whitespace-nowrap text-center px-4 py-2 text-gray-800">
                      <span
                        className={`rounded py-1 px-3 text-xs font-bold ${
                          customer.status === "confirmed"
                            ? "bg-green-400"
                            : customer.status === "canceled"
                            ? "bg-red-400"
                            : customer.status === "checkout"
                            ? "bg-blue-400"
                            : "bg-yellow-400"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    {/* Action Column */}
                    <td className="whitespace-nowrap text-center px-4 py-2 text-gray-800">
                      <button
                        onClick={() => openEditModal(customer)}
                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded transition duration-300 ease-in-out"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// SkeletonLoader Component
const SkeletonLoader = () => {
  const skeletonRows = Array.from({ length: 10 }, (_, index) => (
    <tr key={index} className="bg-white">
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-6 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
      </td>
      <td className="whitespace-nowrap px-4 py-2">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
      </td>
    </tr>
  ));

  return <>{skeletonRows}</>;
};

export default CustomerTable;
