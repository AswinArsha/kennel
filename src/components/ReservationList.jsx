import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import ReservationFilter from "./ReservationFilter";
import ReservationTable from "./ReservationTable";
import ReservationEditModal from "./ReservationEditModal";
import BillGenerationModal from "./BillGenerationModal";

const ReservationList = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*, kennel_ids")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reservations:", error.message);
    } else {
      for (const reservation of data) {
        const kennelNumbers = await fetchKennelNumbers(reservation.kennel_ids);
        reservation.kennel_numbers = kennelNumbers.join(", ");
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

    return data.map((k) => k.kennel_number);
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
      fetchReservations();
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
      fetchReservations();
    }
  };

  const checkoutReservation = async (reservation) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "checkout" })
      .eq("id", reservation.id);

    if (!error) {
      fetchReservations();
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleFilterStartDateChange = (date) => {
    setFilterStartDate(date);
  };

  const handleFilterEndDateChange = (date) => {
    setFilterEndDate(date);
  };

  const handleDateFilter = (startDate, endDate) => {
    if (startDate && endDate) {
      setFilteredReservations(
        reservations.filter(
          (reservation) =>
            new Date(reservation.start_date) >= startDate &&
            new Date(reservation.end_date) <= endDate.setHours(23, 59, 59, 999)
        )
      );
    } else {
      setFilteredReservations(reservations);
    }
  };

  useEffect(() => {
    const filterReservations = () => {
      const filtered = reservations.filter(
        (reservation) => reservation.status !== "checkout"
      );
      setFilteredReservations(filtered);
    };

    filterReservations();
  }, [reservations]);

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
              filteredReservations.filter((reservation) =>
                reservation.customer_name.toLowerCase().includes(lowerQuery)
              )
            );
          } else {
            const filtered = reservations.filter(
              (reservation) => reservation.status !== "checkout"
            );
            setFilteredReservations(filtered);
          }
        }}
        onDateFilter={handleDateFilter}
        setFilterStartDate={setFilterStartDate}
        setFilterEndDate={setFilterEndDate}
      />
      <ReservationTable
        reservations={filteredReservations}
        onConfirm={confirmReservation}
        onCancel={cancelReservation}
        onEdit={(reservation) => {
          setSelectedReservation(reservation);
          setIsEditModalOpen(true);
        }}
        onCheckout={(reservation) => {
          setSelectedReservation(reservation);
          setIsCheckoutModalOpen(true);
        }}
        isCheckoutModalOpen={isCheckoutModalOpen}
        setIsCheckoutModalOpen={setIsCheckoutModalOpen}
        selectedReservation={selectedReservation}
        setSelectedReservation={setSelectedReservation}
      />
      {isEditModalOpen && (
        <ReservationEditModal
          selectedReservation={selectedReservation}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={fetchReservations}
        />
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

export default ReservationList;
