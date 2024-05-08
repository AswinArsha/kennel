import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import DatePicker from "react-datepicker"; // If you need a date picker component
import "react-datepicker/dist/react-datepicker.css"; // Import CSS for the date picker

const ReservationForm = () => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [availableKennels, setAvailableKennels] = useState([]);
  const [selectedKennels, setSelectedKennels] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Dialog control state

  // Fetch available kennels based on the start date
  const fetchAvailableKennels = async (start) => {
    const { data, error } = await supabase
      .from("kennels")
      .select("*")
      .eq("status", "available"); // Only fetch available kennels

    if (error) {
      console.error("Error fetching kennels:", error.message);
    } else {
      setAvailableKennels(data); // Update state with available kennels
    }
  };

  // Handle the creation of a reservation
  const createReservation = async () => {
    const { error } = await supabase.from("reservations").insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      customer_address: customerAddress,
      start_date: startDate,
      end_date: endDate,
      status: "pending", // Default status
      kennel_ids: selectedKennels.map((k) => k.id),
    });

    if (error) {
      console.error("Error creating reservation:", error.message);
    } else {
      // Update the kennels status in Supabase to 'reserved'
      await Promise.all(
        selectedKennels.map(async (kennel) => {
          await supabase
            .from("kennels")
            .update({ status: "reserved" })
            .eq("id", kennel.id);
        })
      );

      // Open the dialog box to confirm successful reservation
      setIsDialogOpen(true);
    }
  };

  // When the start date changes, fetch available kennels
  useEffect(() => {
    if (startDate) {
      fetchAvailableKennels(startDate);
    }
  }, [startDate]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Create Reservation</h2>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Customer Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Customer Phone</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Customer Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded-md"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Customer Address</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            className="w-full p-2 border rounded-md"
            dateFormat="yyyy/MM/dd"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            className="w-full p-2 border rounded-md"
            dateFormat="yyyy/MM/dd"
          />
        </div>

        {startDate && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Select Kennels</h3>
            <div className="grid grid-cols-10 gap-2">
              {availableKennels.map((kennel) => (
                <div
                  key={kennel.id}
                  className={`p-2 rounded-md text-center cursor-pointer transition-colors ${
                    selectedKennels.includes(kennel)
                      ? "bg-yellow-500"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => {
                    // Toggle selection of kennels
                    setSelectedKennels((prev) =>
                      prev.includes(kennel)
                        ? prev.filter((k) => k !== kennel)
                        : [...prev, kennel]
                    );
                  }}
                >
                  Kennel {kennel.kennel_number}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <button
            type="button"
            className="bg-blue-500 text-white p-2 rounded-md"
            onClick={createReservation}
          >
            Create Reservation
          </button>
        </div>
      </form>

      {/* Dialog box for confirmation */}
      <Transition
        show={isDialogOpen}
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
          onClose={() => setIsDialogOpen(false)} // Close dialog when user interacts
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            <Dialog.Panel className="rounded-lg bg-white p-8 shadow-2xl">
              <Dialog.Title className="text-lg font-bold">
                Reservation Created
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-gray-500">
                The reservation has been successfully created.
              </Dialog.Description>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="bg-gray-300 px-4 py-2 rounded-md"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default ReservationForm;
