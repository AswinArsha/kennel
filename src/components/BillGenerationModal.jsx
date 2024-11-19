// BillGenerationModal.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Modal from "react-modal";

// Set the app element
Modal.setAppElement("#root");

const BillGenerationModal = ({ isOpen, onClose, selectedReservation, onCheckoutSuccess }) => {
  const [perDayBill, setPerDayBill] = useState(400);
  const [totalBill, setTotalBill] = useState(0);
  const [daysStayed, setDaysStayed] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerDetails, setCustomerDetails] = useState({});
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState(""); // Add payment mode state
  const [errors, setErrors] = useState({}); // For validation errors

  useEffect(() => {
    if (selectedReservation) {
      const startDate = new Date(selectedReservation.start_date);
      const endDate = new Date(selectedReservation.end_date);
      const calculatedDaysStayed = Math.ceil(
        (endDate - startDate) / (1000 * 60 * 60 * 24) + 1
      );
      setDaysStayed(calculatedDaysStayed);

      // Fetch customer details and advance payment using customer_id from selectedReservation
      fetchCustomerDetails(selectedReservation.customer_id);
      const advance = selectedReservation.advance_amount || 0;
      setAdvanceAmount(advance);

      // Calculate the total bill by subtracting the advance amount
      setTotalBill(calculatedDaysStayed * perDayBill - advance);
    }
  }, [selectedReservation, perDayBill]);

  useEffect(() => {
    if (daysStayed && perDayBill) {
      setTotalBill(daysStayed * perDayBill - advanceAmount);
    }
  }, [daysStayed, perDayBill, advanceAmount]);

  const fetchCustomerDetails = async (customerId) => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("customer_name, customer_phone, customer_address")
        .eq("id", customerId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setCustomerDetails(data);
        setCustomerName(data.customer_name);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error.message);
    }
  };

  const handlePerDayBillChange = (event) => {
    const value = event.target.value === "" ? "" : parseInt(event.target.value, 10);
    if (value === "" || (!isNaN(value) && value >= 0)) { // Allow zero for cases where advance covers the total
      setPerDayBill(value);
    }
  };

  const handleTotalBillChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      setTotalBill(value);
    }
  };

  const handleDaysStayedChange = (event) => {
    const value = event.target.value === "" ? "" : parseInt(event.target.value, 10);
    
    // Validate that the input is a positive integer
    if (value === "" || (Number.isInteger(value) && value > 0)) {
      setDaysStayed(value);
    }
  };

  const handleCheckout = async () => {
    // Validate before proceeding
    const validationErrors = {};
    let isValid = true;
  
    if (!daysStayed || daysStayed < 1) {
      validationErrors.daysStayed = "Please enter a valid number of days (minimum 1)";
      isValid = false;
    }
  
    if (!paymentMode) {
      validationErrors.paymentMode = "Please select a payment mode";
      isValid = false;
    }
  
    setErrors(validationErrors);
  
    if (!isValid) {
      toast.error("Please fix the errors before proceeding.", { position: "bottom-center" });
      return;
    }
  
    try {
      // Fetch customer details based on customer_id
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("customer_name, customer_phone, customer_address")
        .eq("id", selectedReservation.customer_id)
        .single();
  
      if (customerError) {
        throw customerError;
      }
  
      // Calculate final total bill (Total Bill + Advance Pay)
      const finalTotalBill = totalBill + advanceAmount;
  
      // Insert into analytics table
      const { error: analyticsError } = await supabase
        .from("analytics")
        .insert([
          {
            customer_id: selectedReservation.customer_id,
            customer_name: customerData.customer_name,
            customer_phone: customerData.customer_phone,
            customer_address: customerData.customer_address,
            pet_name: selectedReservation.pet_name,
            pet_breed: selectedReservation.pet_breed,
            start_date: selectedReservation.start_date,
            end_date: selectedReservation.end_date,
            days_stayed: daysStayed,
            per_day_bill: perDayBill,
            total_bill: finalTotalBill, // Updated to use the final total bill
            pickup: selectedReservation.pickup,
            groom: selectedReservation.groom,
            drop: selectedReservation.drop,
            kennel_numbers: selectedReservation.kennel_ids,
          },
        ]);
  
      if (analyticsError) {
        throw analyticsError;
      }
  
      // Insert into historical reservations table, including payment_mode
      const { error: historicalError } = await supabase
        .from("historical_reservations")
        .insert([
          {
            customer_id: selectedReservation.customer_id,
            pet_name: selectedReservation.pet_name,
            pet_breed: selectedReservation.pet_breed,
            start_date: selectedReservation.start_date,
            end_date: selectedReservation.end_date,
            status: "checkout", // Adjust status as needed
            kennel_ids: selectedReservation.kennel_ids,
            pickup: selectedReservation.pickup,
            groom: selectedReservation.groom,
            drop: selectedReservation.drop,
            payment_mode: paymentMode, // Add payment mode here
          },
        ]);
  
      if (historicalError) {
        throw historicalError;
      }
  
      // Insert a new row into the bills table
      const { error: billError } = await supabase
        .from("bills")
        .insert([
          {
            customer_id: selectedReservation.customer_id,
            customer_name: customerData.customer_name,
            pet_name: selectedReservation.pet_name,
            pet_breed: selectedReservation.pet_breed,
            check_in_date: selectedReservation.start_date,
            check_out_date: selectedReservation.end_date,
            per_day_bill: perDayBill,
            total_bill: finalTotalBill, // Updated to store the final total bill
          },
        ])
        .single();
  
      if (billError) {
        throw billError;
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
  
      // Delete corresponding records from pet_information
      const { error: petInfoDeleteError } = await supabase
        .from("pet_information")
        .delete()
        .eq("reservation_id", selectedReservation.id);
  
      if (petInfoDeleteError) {
        throw petInfoDeleteError;
      }
  
      // Delete corresponding records from feeding_schedule
      const { error: feedingDeleteError } = await supabase
        .from("feeding_schedule")
        .delete()
        .in("kennel_id", selectedReservation.kennel_ids); // Changed from reservation_id to kennel_id
  
      if (feedingDeleteError) {
        throw feedingDeleteError;
      }
  
      // Delete the reservation record from reservations table
      const { error: deleteError } = await supabase
        .from("reservations")
        .delete()
        .eq("id", selectedReservation.id);
  
      if (deleteError) {
        throw deleteError;
      }
  
      // Close the modal and call the onCheckoutSuccess callback
      onClose();
      onCheckoutSuccess(); // Notify the parent component
    } catch (error) {
      console.error("Error during checkout:", error.message);
      toast.error(`Checkout failed: ${error.message}`, { position: "bottom-center" });
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
        <div className="flex space-x-36">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Customer Details:
            </h3>
            <p className="text-gray-600">Name: {customerName}</p>
            <p className="text-gray-600">
              Phone: {customerDetails.customer_phone}
            </p>
            <p className="text-gray-600">
              Address: {customerDetails.customer_address}
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
            <div className="text-gray-600 flex items-center">
              <span className="mr-2">Number of Days:</span>
              <input
                type="number"
                min="1"
                value={daysStayed}
                onChange={(e) => handleDaysStayedChange(e)}
                className={`w-20 p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.daysStayed ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.daysStayed && (
              <p className="text-red-500 text-sm mt-1">
                {errors.daysStayed}
              </p>
            )}
            <p className="text-gray-600">Advance Pay: ₹{advanceAmount}</p>
          </div>
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
        
        {/* Payment Mode Select */}
        <div className="mb-4">
          <label
            htmlFor="paymentMode"
            className="block text-gray-700 font-semibold mb-2"
          >
            Payment Mode
          </label>
          <select
            id="paymentMode"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.paymentMode ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select Payment Mode</option>
            <option value="gpay">GPay</option>
            <option value="cash">Cash</option>
            <option value="swipe">Swipe</option>
          </select>
          {errors.paymentMode && (
            <p className="text-red-500 text-sm mt-1">{errors.paymentMode}</p>
          )}
        </div>

        <button
          onClick={handleCheckout}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          Bill & Checkout
        </button>
      </div>
    </Modal>
  );
};

export default BillGenerationModal;
