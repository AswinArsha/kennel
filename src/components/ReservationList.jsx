import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import ReservationFilter from "./ReservationFilter";
import ReservationTable from "./ReservationTable";
import ReservationEditModal from "./ReservationEditModal";

const ReservationList = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*, kennel_ids") // Fetching kennel IDs
      .order("created_at", { ascending: false }); // Optional ordering

    if (error) {
      console.error("Error fetching reservations:", error.message);
    } else {
      // Fetch kennel numbers for each reservation's kennel_ids
      for (const reservation of data) {
        const kennelNumbers = await fetchKennelNumbers(reservation.kennel_ids);
        reservation.kennel_numbers = kennelNumbers.join(", "); // Adding a new field with joined kennel numbers
      }

      setReservations(data);
      setFilteredReservations(data);
    }
  };

  const fetchKennelNumbers = async (kennel_ids) => {
    if (!kennel_ids) return [];
    const { data, error } = await supabase
      .from("kennels")
      .select("kennel_number")
      .in("id", kennel_ids);

    if (error) {
      console.error("Error fetching kennel numbers:", error.message);
      return [];
    }

    return data.map((k) => k.kennel_number); // Return the kennel numbers
  };

  const confirmReservation = async (reservation) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "confirmed" })
      .eq("id", reservation.id);

    if (!error) {
      await Promise.all(
        reservation.kennel_ids.map((kennelId) =>
          supabase
            .from("kennels")
            .update({ status: "occupied" })
            .eq("id", kennelId)
        )
      );

      fetchReservations(); // Refresh the list after update
    }
  };

  const cancelReservation = async (reservation) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "canceled" })
      .eq("id", reservation.id);

    if (!error) {
      await Promise.all(
        reservation.kennel_ids.map((kennelId) =>
          supabase
            .from("kennels")
            .update({ status: "available" })
            .eq("id", kennelId)
        )
      );

      fetchReservations(); // Refresh the list after update
    }
  };

  const checkoutReservation = async (reservation) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "checkout" })
      .eq("id", reservation.id);

    if (!error) {
      fetchReservations(); // Refresh the list after update
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Reservation List</h2>
      <ReservationFilter
        searchQuery={searchQuery}
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        onSearchChange={(query) => {
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
        }}
        onDateFilter={() => {
          if (filterStartDate && filterEndDate) {
            setFilteredReservations(
              reservations.filter(
                (reservation) =>
                  new Date(reservation.start_date) >= filterStartDate &&
                  new Date(reservation.end_date) <= filterEndDate
              )
            );
          } else {
            setFilteredReservations(reservations);
          }
        }}
      />
      <ReservationTable
        reservations={filteredReservations}
        onConfirm={confirmReservation}
        onCancel={cancelReservation}
        onEdit={(reservation) => {
          setSelectedReservation(reservation);
          setIsEditModalOpen(true);
        }}
        onCheckout={checkoutReservation}
      />
      {isEditModalOpen && (
        <ReservationEditModal
          selectedReservation={selectedReservation}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={fetchReservations} // Refresh on save
        />
      )}
    </div>
  );
};

export default ReservationList;
