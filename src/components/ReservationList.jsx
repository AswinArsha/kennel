import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import DatePicker from "react-datepicker"; // Importing a date picker
import "react-datepicker/dist/react-datepicker.css";

const ReservationList = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]); // To store filtered reservations
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [filterStartDate, setFilterStartDate] = useState(null); // State for start date filter
  const [filterEndDate, setFilterEndDate] = useState(null); // State for end date filter

  // Fetch reservations from Supabase
  const fetchReservations = async () => {
    const { data, error } = await supabase.from("reservations").select("*"); // Select all reservations

    if (error) {
      console.error("Error fetching reservations:", error.message);
    } else {
      setReservations(data);
      setFilteredReservations(data); // Initialize filtered reservations
    }
  };

  // Handle confirming a reservation
  const confirmReservation = async (reservation) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "confirmed" }) // Set to 'confirmed'
      .eq("id", reservation.id);

    if (error) {
      console.error("Error confirming reservation:", error.message);
    } else {
      // Update kennel statuses to 'occupied'
      await Promise.all(
        reservation.kennel_ids.map(async (kennelId) => {
          await supabase
            .from("kennels")
            .update({ status: "occupied" })
            .eq("id", kennelId);
        })
      );

      fetchReservations(); // Refresh the list after update
    }
  };

  // Handle canceling a reservation
  const cancelReservation = async (reservation) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "canceled" }) // Set to 'canceled'
      .eq("id", reservation.id);

    if (error) {
      console.error("Error canceling reservation:", error.message);
    } else {
      // Update kennel statuses to 'available'
      await Promise.all(
        reservation.kennel_ids.map(async (kennelId) => {
          await supabase
            .from("kennels")
            .update({ status: "available" })
            .eq("id", kennelId);
        })
      );

      fetchReservations(); // Refresh the list after update
    }
  };

  // Search reservations by customer name
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const lowerQuery = query.toLowerCase();
      setFilteredReservations(
        reservations.filter((reservation) =>
          reservation.customer_name.toLowerCase().includes(lowerQuery)
        )
      );
    } else {
      setFilteredReservations(reservations);
    }
  };

  // Filter reservations by date range
  const handleDateFilter = () => {
    if (filterStartDate && filterEndDate) {
      setFilteredReservations(
        reservations.filter(
          (reservation) =>
            new Date(reservation.start_date) >= filterStartDate &&
            new Date(reservation.end_date) <= filterEndDate
        )
      );
    } else {
      setFilteredReservations(reservations); // Reset to all reservations
    }
  };

  useEffect(() => {
    fetchReservations(); // Fetch reservations on component mount
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Reservation List</h2>

      {/* Search and date filter section */}
      <div className="flex justify-between mb-4">
        {/* Search bar */}
        <input
          type="text"
          className="p-2 border rounded-md"
          placeholder="Search by customer name"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {/* Date range filter */}
        <div className="flex gap-4">
          <DatePicker
            selected={filterStartDate}
            onChange={(date) => setFilterStartDate(date)}
            className="p-2 border rounded-md"
            dateFormat="yyyy/MM/dd"
            placeholderText="Start date"
          />
          <DatePicker
            selected={filterEndDate}
            onChange={(date) => setFilterEndDate(date)}
            className="p-2 border rounded-md"
            dateFormat="yyyy/MM/dd"
            placeholderText="End date"
          />
          <button
            className="bg-blue-500 text-white p-2 rounded-md"
            onClick={handleDateFilter}
          >
            Filter
          </button>
        </div>
      </div>

      {/* Table with reservation data */}
      <table className="border-collapse w-full text-center">
        <thead>
          <tr>
            <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">
              Customer Name
            </th>
            <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">
              Start Date
            </th>
            <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">
              End Date
            </th>
            <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">
              Status
            </th>
            <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredReservations.map((reservation) => (
            <tr key={reservation.id} className="bg-white hover:bg-gray-100">
              <td className="p-3 text-gray-800 border">
                {reservation.customer_name}
              </td>
              <td className="p-3 text-gray-800 border">
                {new Date(reservation.start_date).toDateString()}
              </td>
              <td className="p-3 text-gray-800 border">
                {new Date(reservation.end_date).toDateString()}
              </td>
              <td className="p-3 text-gray-800 border">
                <span
                  className={`rounded py-1 px-3 text-xs font-bold ${
                    reservation.status === "confirmed"
                      ? "bg-green-400"
                      : reservation.status === "canceled"
                      ? "bg-red-400"
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
                    onClick={() => confirmReservation(reservation)}
                  >
                    Confirm
                  </button>
                )}
                {reservation.status !== "canceled" && (
                  <button
                    className="bg-red-500 text-white py-1 px-2 rounded-md hover:bg-red-600 ml-2"
                    onClick={() => cancelReservation(reservation)}
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReservationList;
