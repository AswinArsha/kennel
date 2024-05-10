import  { useState, useEffect } from "react";
import { supabase } from "../supabase";
import DatePicker from "react-datepicker"; // If needed
import "react-datepicker/dist/react-datepicker.css"; // Date picker CSS

const ReservationForm = () => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [availableKennels, setAvailableKennels] = useState([]);
  const [selectedKennels, setSelectedKennels] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchAvailableKennels = async () => {
    const { data, error } = await supabase
      .from("kennels")
      .select("*")
      .eq("status", "available");

    if (error) {
      console.error("Error fetching kennels:", error.message);
    } else {
      setAvailableKennels(data); // Update with available kennels
    }
  };

  const createReservation = async () => {
    const { error } = await supabase.from("reservations").insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      customer_address: customerAddress,
      start_date: startDate,
      end_date: endDate,
      status: "pending",
      kennel_ids: selectedKennels.map((k) => k.id),
    });

    if (error) {
      console.error("Error creating reservation:", error.message);
    } else {
      await Promise.all(
        selectedKennels.map(async (kennel) => {
          await supabase
            .from("kennels")
            .update({ status: "reserved" })
            .eq("id", kennel.id);
        })
      );
      setIsDialogOpen(true); // Open confirmation dialog
    }
  };

  useEffect(() => {
    if (startDate) {
      fetchAvailableKennels();
    }
  }, [startDate]);

  const clearForm = () => {
    // Reset all fields
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setStartDate(null);
    setEndDate(null);
    setSelectedKennels([]);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Reservation</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Customer Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:border-blue-500"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Customer Phone</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:border-blue-500"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Customer Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded-md focus:border-blue-500"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Customer Address</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:border-blue-500"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              className="w-full p-2 border rounded-md"
              dateFormat="yyyy/MM/dd"
              placeholderText="Select a start date"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              className="w-full p-2 border rounded-md"
              dateFormat="yyyy/MM/dd"
              placeholderText="Select an end date"
            />
          </div>
        </div>

        {startDate && (
          <div>
            <h3 className="text-lg font-semibold">Select Kennels</h3>
            <div className="grid grid-cols-5 gap-4">
              {availableKennels.map((kennel) => (
                <div
                  key={kennel.id}
                  className={`p-4 text-center rounded-md cursor-pointer transition-all ${
                    selectedKennels.includes(kennel)
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => {
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

        <div className="flex justify-between mt-6">
          <button
            type="button"
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={createReservation}
          >
            Create Reservation
          </button>

          <button
            type="button"
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
            onClick={clearForm} // Clear form fields
          >
            Clear Form
          </button>
        </div>
      </div>

      {/* Dialog box for confirmation */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold">Reservation Created</h3>
            <p className="text-sm text-gray-600 mt-2">
              The reservation has been successfully created.
            </p>
            <button
              type="button"
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md"
              onClick={() => setIsDialogOpen(false)} // Close the dialog
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationForm;
