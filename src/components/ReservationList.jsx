import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import DatePicker from "react-datepicker";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import "react-datepicker/dist/react-datepicker.css"; // Importing CSS for date picker

const ReservationList = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]); // To store filtered reservations
  const [selectedReservation, setSelectedReservation] = useState(null); // For editing
  const [petInfo, setPetInfo] = useState({
    pet_name: "",
    dietary_requirements: "",
    special_care_instructions: "",
    medical_notes: "",
  }); // Default pet info
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // For controlling edit modal
  const [searchQuery, setSearchQuery] = useState(""); // For search query
  const [filterStartDate, setFilterStartDate] = useState(null); // For start date filter
  const [filterEndDate, setFilterEndDate] = useState(null); // For end date filter

  // Fetch reservations from Supabase
  const fetchReservations = async () => {
    const { data, error } = await supabase.from("reservations").select("*");

    if (error) {
      console.error("Error fetching reservations:", error.message);
    } else {
      setReservations(data);
      setFilteredReservations(data); // Initialize filtered reservations
    }
  };

  // Fetch pet information for the selected reservation
  // Fetch pet information for the selected kennel
  const fetchPetInformation = async (kennelId) => {
    const { data, error } = await supabase
      .from("pet_information") // Corrected table name
      .select("*")
      .eq("kennel_id", kennelId); // Ensure you're filtering by the correct ID

    if (error) {
      console.error("Error fetching pet information:", error.message);
    } else if (data.length > 0) {
      setPetInfo(data[0]); // Set the fetched data
    } else {
      setPetInfo({
        pet_name: "",
        dietary_requirements: "",
        special_care_instructions: "",
        medical_notes: "",
      }); // Reset if no data is found
    }
  };

  // Save updated pet information to Supabase
  const savePetInformation = async () => {
    const { error } = await supabase.from("pet_information").upsert({
      reservation_id: selectedReservation.id,
      kennel_id: selectedReservation.kennel_ids[0], // Assuming one kennel for simplicity
      pet_name: petInfo.pet_name,
      dietary_requirements: petInfo.dietary_requirements,
      special_care_instructions: petInfo.special_care_instructions,
      medical_notes: petInfo.medical_notes,
    }); // Upsert to insert or update

    if (error) {
      console.error("Error saving pet information:", error.message);
    } else {
      setIsEditModalOpen(false); // Close the modal after saving
      fetchReservations(); // Refresh the reservations list
    }
  };

  // Confirm a reservation
  const confirmReservation = async (reservation) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "confirmed" })
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

  // Cancel a reservation
  const cancelReservation = async (reservation) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "canceled" })
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
    setSearchQuery(query); // Store the query in the state
    if (query) {
      const lowerQuery = query.toLowerCase(); // Convert the query to lowercase for case-insensitive matching
      setFilteredReservations(
        reservations.filter(
          (reservation) =>
            reservation.customer_name.toLowerCase().includes(lowerQuery) // Filter reservations by name
        )
      );
    } else {
      setFilteredReservations(reservations); // Reset to all reservations if query is empty
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

  // Open edit modal for a reservation
  const openEditModal = (reservation) => {
    setSelectedReservation(reservation); // Set the selected reservation
    fetchPetInformation(reservation.id); // Fetch associated pet information
    setIsEditModalOpen(true); // Open the modal
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
                {reservation.status === "confirmed" && (
                  <button
                    className="bg-blue-500 text-white py-1 px-2 rounded-md hover:bg-blue-600 ml-2"
                    onClick={() => openEditModal(reservation)}
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit modal for pet information */}
      <Transition
        show={isEditModalOpen}
        as={Fragment}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            <Dialog.Panel className="rounded-lg bg-white p-8 shadow-xl">
              <Dialog.Title className="text-lg font-bold">
                Edit Pet Information
              </Dialog.Title>

              <div className="mt-4">
                <label className="block font-semibold">Pet Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={petInfo.pet_name}
                  onChange={(e) =>
                    setPetInfo({ ...petInfo, pet_name: e.target.value })
                  }
                />
              </div>

              <div className="mt-4">
                <label className="block font-semibold">
                  Dietary Requirements
                </label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={petInfo.dietary_requirements}
                  onChange={(e) =>
                    setPetInfo({
                      ...petInfo,
                      dietary_requirements: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mt-4">
                <label className="block font-semibold">
                  Special Care Instructions
                </label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={petInfo.special_care_instructions}
                  onChange={(e) =>
                    setPetInfo({
                      ...petInfo,
                      special_care_instructions: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mt-4">
                <label className="block font-semibold">Medical Notes</label>
                <textarea
                  className="w-full p-2 border rounded-md" // Corrected element type and class
                  value={petInfo.medical_notes} // Correct data binding
                  onChange={(e) =>
                    setPetInfo({ ...petInfo, medical_notes: e.target.value })
                  } // Update the state with the new value
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                  onClick={savePetInformation}
                >
                  Save
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default ReservationList;
