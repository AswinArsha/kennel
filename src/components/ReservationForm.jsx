import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ReservationForm = () => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [availableKennels, setAvailableKennels] = useState([]);
  const [selectedKennels, setSelectedKennels] = useState([]);
  const [pickup, setPickup] = useState(false);
  const [groom, setGroom] = useState(false);
  const [drop, setDrop] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchAvailableKennels = async () => {
    const { data, error } = await supabase
      .from("kennels")
      .select("*")
      .eq("status", "available");

    if (error) {
      console.error("Error fetching kennels:", error.message);
    } else {
      setAvailableKennels(data);
    }
  };

  const createReservation = async () => {
    const { error } = await supabase.from("reservations").insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      pet_name: petName,
      pet_breed: petBreed,
      start_date: startDate,
      end_date: endDate,
      status: "pending",
      kennel_ids: selectedKennels.map((k) => k.id),
      pickup,
      groom,
      drop,
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
      setIsDialogOpen(true);
    }
  };

  useEffect(() => {
    if (startDate) {
      fetchAvailableKennels();
    }
  }, [startDate]);

  const clearForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setPetName("");
    setPetBreed("");
    setStartDate(null);
    setEndDate(null);
    setSelectedKennels([]);
    setPickup(false);
    setGroom(false);
    setDrop(false);
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
          <label className="block text-sm font-medium">Customer Address</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:border-blue-500"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Pet Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:border-blue-500"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Pet Breed</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:border-blue-500"
            value={petBreed}
            onChange={(e) => setPetBreed(e.target.value)}
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
            <h3 className="text-lg font-semibold pb-3">Select Kennels</h3>
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

<div className="flex gap-4 mt-4">
  <fieldset>
    <legend className="text-lg font-medium text-gray-900">Services</legend>

    <div className="mt-4 space-y-2">
      <label htmlFor="pickup" className="flex cursor-pointer items-start gap-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300"
            id="pickup"
            checked={pickup}
            onChange={() => setPickup(!pickup)}
          />
        </div>
        <div>Pickup</div>
      </label>

      <label htmlFor="groom" className="flex cursor-pointer items-start gap-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300"
            id="groom"
            checked={groom}
            onChange={() => setGroom(!groom)}
          />
        </div>
        <div>Groom</div>
      </label>

      <label htmlFor="drop" className="flex cursor-pointer items-start gap-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300"
            id="drop"
            checked={drop}
            onChange={() => setDrop(!drop)}
          />
        </div>
        <div>Drop</div>
      </label>
    </div>
  </fieldset>
</div>


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
            onClick={clearForm}
          >
            Clear Form
          </button>
        </div>
      </div>

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
              onClick={() => setIsDialogOpen(false)}
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
