// ReservationList.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import ReservationFilter from "./ReservationFilter";
import ReservationTable from "./ReservationTable";
import ReservationEditModal from "./ReservationEditModal";
import BillGenerationModal from "./BillGenerationModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ReservationList = () => {
  const [allReservations, setAllReservations] = useState([]); // All fetched reservations
  const [filteredReservations, setFilteredReservations] = useState([]); // After filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const reservationsPerPage = 10; // Fixed per page
  const [loading, setLoading] = useState(false);

  // Fetch Reservations on Component Mount
  useEffect(() => {
    fetchReservations();
  }, []);

  // Fetch Reservations from Supabase
  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, customers:customer_id (customer_name, customer_phone), payment_mode")
        .order("created_at", { ascending: false });
  
      if (error) {
        throw new Error(`Error fetching reservations: ${error.message}`);
      }
  
      // Fetch kennel_numbers for all reservations
      const reservationsWithKennelNumbers = await Promise.all(
        data.map(async (reservation) => {
          const kennelNumbers = await fetchKennelNumbers(reservation.kennel_ids);
          return {
            ...reservation,
            kennel_numbers: kennelNumbers,
          };
        })
      );
  
      setAllReservations(reservationsWithKennelNumbers);
      setFilteredReservations(reservationsWithKennelNumbers);
      setCurrentPage(1); // Reset to first page after fetching
    } catch (error) {
      console.error(error.message);
      toast.error("Failed to fetch reservations.");
    } finally {
      setLoading(false);
    }
  };
  

  // Fetch Kennel Numbers Based on kennel_ids
  const fetchKennelNumbers = async (kennel_ids) => {
    if (!kennel_ids || kennel_ids.length === 0) return [];
    const { data, error } = await supabase
      .from("kennels")
      .select("kennel_number")
      .in("id", kennel_ids);

    if (error) {
      console.error(`Error fetching kennel numbers: ${error.message}`);
      return [];
    }

    return data.map((k) => k.kennel_number);
  };

  // Confirm Reservation (Check-in)
  const confirmReservation = async (reservation) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "checkin" })
        .eq("id", reservation.id);

      if (error) {
        throw new Error(`Error updating reservation status: ${error.message}`);
      }

      // Update kennel status to 'occupied'
      await Promise.all(
        reservation.kennel_ids.map((kennelId) =>
          supabase.from("kennels").update({ status: "occupied" }).eq("id", kennelId)
        )
      );

      toast.success("Reservation checked in successfully!");
      fetchReservations(); // Refresh data
    } catch (error) {
      console.error(error.message);
      toast.error("Failed to check in reservation.");
    }
  };

  // Cancel Reservation
  const cancelReservation = async (reservation) => {
    try {
      // Update kennel status to 'available'
      await Promise.all(
        reservation.kennel_ids.map(async (kennelId) => {
          const { error: kennelError } = await supabase
            .from("kennels")
            .update({ status: "available" })
            .eq("id", kennelId);

          if (kennelError) {
            throw new Error(`Failed to update kennel ${kennelId} status: ${kennelError.message}`);
          }
        })
      );

      // Move reservation to historical_reservations with status 'canceled'
      const { error: moveError } = await supabase.from("historical_reservations").insert({
        customer_id: reservation.customer_id,
        pet_name: reservation.pet_name,
        pet_breed: reservation.pet_breed,
        start_date: reservation.start_date,
        end_date: reservation.end_date,
        status: "canceled",
        kennel_ids: reservation.kennel_ids,
        pickup: reservation.pickup,
        groom: reservation.groom,
        drop: reservation.drop,
        created_at: reservation.created_at,
      });

      if (moveError) {
        throw new Error(`Failed to move reservation: ${moveError.message}`);
      }

      // Delete reservation from reservations table
      const { error: deleteError } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservation.id);

      if (deleteError) {
        throw new Error(`Failed to delete reservation: ${deleteError.message}`);
      }

      toast.success("Reservation canceled successfully!");
      fetchReservations(); // Refresh data
    } catch (error) {
      console.error(error.message);
      toast.error("Failed to cancel reservation.");
    }
  };

  // Handle Checkout (from ReservationTable)
  const handleCheckout = async (reservation) => {
    setSelectedReservation(reservation);
    setIsCheckoutModalOpen(true);

    try {
      await deleteFeedingInformation(reservation);
      fetchReservations(); // Refresh data after checkout
    } catch (error) {
      console.error("Error deleting feeding information:", error.message);
      toast.error("Failed to delete feeding information.");
    }
  };

  // Delete Feeding Information
  const deleteFeedingInformation = async (reservation) => {
    if (!reservation.kennel_ids || reservation.kennel_ids.length === 0) {
      return;
    }

    const kennelIds = reservation.kennel_ids;

    try {
      await Promise.all(
        kennelIds.map((kennelId) =>
          supabase.from("feeding_schedule").delete().eq("kennel_id", kennelId)
        )
      );
    } catch (error) {
      throw new Error(`Failed to delete feeding information: ${error.message}`);
    }
  };

  // Filtering Logic
  useEffect(() => {
    filterReservations();
    setCurrentPage(1); // Reset to first page after filtering
  }, [allReservations, searchQuery, filterStartDate, filterEndDate, filterStatus]);

  const filterReservations = () => {
    let filtered = [...allReservations];

    // Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (reservation) =>
          reservation.customers.customer_name.toLowerCase().includes(lowerQuery) ||
          reservation.pet_name.toLowerCase().includes(lowerQuery) ||
          reservation.pet_breed.toLowerCase().includes(lowerQuery) ||
          reservation.customers.customer_phone.toLowerCase().includes(lowerQuery)
      );
    }

    // Status Filter
    if (filterStatus) {
      filtered = filtered.filter((reservation) => reservation.status === filterStatus);
    }

    // Date Filters
    if (filterStartDate) {
      filtered = filtered.filter(
        (reservation) =>
          new Date(reservation.start_date).setHours(0, 0, 0, 0) ===
          filterStartDate.setHours(0, 0, 0, 0)
      );
    }

    if (filterEndDate) {
      filtered = filtered.filter(
        (reservation) =>
          new Date(reservation.end_date).setHours(0, 0, 0, 0) ===
          filterEndDate.setHours(0, 0, 0, 0)
      );
    }

    // Exclude canceled reservations
    filtered = filtered.filter((reservation) => reservation.status !== "canceled");

    setFilteredReservations(filtered);
  };

  // Pagination Logic
  const indexOfLastReservation = currentPage * reservationsPerPage;
  const indexOfFirstReservation = indexOfLastReservation - reservationsPerPage;
  const currentReservations = filteredReservations.slice(indexOfFirstReservation, indexOfLastReservation);
  const totalPages = Math.ceil(filteredReservations.length / reservationsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle Checkout Success (from BillGenerationModal)
  const handleCheckoutSuccess = () => {
    fetchReservations();
    toast.success("Bill printed and checked out successfully!");
  };

  // Handle Edit Modal Save
  const handleEditModalSave = () => {
    fetchReservations();
    setIsEditModalOpen(false);
    toast.success("Reservation updated successfully!");
  };

  return (
    <div>
      <ToastContainer position="bottom-center" autoClose={2000} hideProgressBar={false} />
      <h2 className="text-2xl font-bold mb-4">Reservation List</h2>
      <ReservationFilter
        searchQuery={searchQuery}
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        filterStatus={filterStatus}
        onSearchChange={setSearchQuery}
        onDateFilter={(start, end) => {
          setFilterStartDate(start);
          setFilterEndDate(end);
        }}
        onStatusFilterChange={setFilterStatus}
        handleClearFilters={() => {
          setSearchQuery("");
          setFilterStartDate(null);
          setFilterEndDate(null);
          setFilterStatus("");
        }}
      />

      <ReservationTable
        reservations={currentReservations}
        loading={loading}
        onConfirm={confirmReservation}
        onCancel={cancelReservation}
        onEdit={(reservation) => {
          setSelectedReservation(reservation);
          setIsEditModalOpen(true);
        }}
        onCheckout={handleCheckout}
        isCheckoutModalOpen={isCheckoutModalOpen}
        setIsCheckoutModalOpen={setIsCheckoutModalOpen}
        selectedReservation={selectedReservation}
        setSelectedReservation={setSelectedReservation}
        currentPage={currentPage}
        reservationsPerPage={reservationsPerPage}
        totalReservations={filteredReservations.length}
        handlePageChange={handlePageChange}
      />

      {isEditModalOpen && (
        <ReservationEditModal
          selectedReservation={selectedReservation}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditModalSave}
        />
      )}
      {isCheckoutModalOpen && (
        <BillGenerationModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          selectedReservation={selectedReservation}
          onCheckoutSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
};

export default ReservationList;
