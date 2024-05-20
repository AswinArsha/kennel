import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Modal from "react-modal";

const BillGenerationModal = ({ isOpen, onClose, selectedReservation }) => {
  const [perDayBill, setPerDayBill] = useState(400);
  const [totalBill, setTotalBill] = useState(0);
  const [daysStayed, setDaysStayed] = useState(0);

  useEffect(() => {
    if (selectedReservation) {
      const startDate = new Date(selectedReservation.start_date);
      const endDate = new Date(selectedReservation.end_date);
      const calculatedDaysStayed = Math.ceil(
        (endDate - startDate) / (1000 * 60 * 60 * 24) + 1
      );
      setDaysStayed(calculatedDaysStayed);
      setTotalBill(calculatedDaysStayed * perDayBill);
    }
  }, [selectedReservation, perDayBill]);

  const handlePerDayBillChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      setPerDayBill(value);
    }
  };

  const handleTotalBillChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      setTotalBill(value);
    }
  };

  const handleCheckout = async () => {
    try {
      // Insert a new row into the bills table
      const { data, error } = await supabase
        .from("bills")
        .insert([
          {
            reservation_id: selectedReservation.id,
            customer_name: selectedReservation.customer_name,
            pet_name: selectedReservation.pet_name,
            pet_breed: selectedReservation.pet_breed,
            check_in_date: selectedReservation.start_date,
            check_out_date: selectedReservation.end_date,
            per_day_bill: perDayBill,
            total_bill: totalBill,
          },
        ])
        .single();

      if (error) {
        throw error;
      }

      // Update the reservation status to 'checkout'
      await supabase
        .from("reservations")
        .update({ status: "checkout" })
        .eq("id", selectedReservation.id);

      // Update the kennel status to 'available' for the associated kennels
      await Promise.all(
        selectedReservation.kennel_ids.map((kennelId) =>
          supabase
            .from("kennels")
            .update({ status: "available" })
            .eq("id", kennelId)
        )
      );

      // Trigger a fetch to update the reservation list
      onClose();
    } catch (error) {
      console.error("Error during checkout:", error.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Bill Generation Modal"
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
          maxWidth: "600px",
          width: "90%",
        },
      }}
    >
      <div className="">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Bill Generation
        </h2>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Customer Details:
          </h3>
          <p className="text-gray-600">
            Name: {selectedReservation.customer_name}
          </p>
          <p className="text-gray-600">
            Pet Name: {selectedReservation.pet_name}
          </p>
          <p className="text-gray-600">
            Pet Breed: {selectedReservation.pet_breed}
          </p>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Reservation Details:
          </h3>
          <p className="text-gray-600">
            Check-in Date:{" "}
            {new Date(selectedReservation.start_date).toDateString()}
          </p>
          <p className="text-gray-600">
            Check-out Date:{" "}
            {new Date(selectedReservation.end_date).toDateString()}
          </p>
          <p className="text-gray-600">Number of Days: {daysStayed}</p>
        </div>
        <div className="mb-4">
          <label
            htmlFor="perDayBill"
            className="block text-gray-700 font-semibold mb-2"
          >
            Per Day Bill (in Rupees)
          </label>
          <input
            type="number"
            id="perDayBill"
            value={perDayBill}
            onChange={handlePerDayBillChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="totalBill"
            className="block text-gray-700 font-semibold mb-2"
          >
            Total Bill (in Rupees)
          </label>
          <input
            type="number"
            id="totalBill"
            value={totalBill}
            onChange={handleTotalBillChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleCheckout}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          Print Bill & Checkout
        </button>
      </div>
    </Modal>
  );
};

export default BillGenerationModal;
