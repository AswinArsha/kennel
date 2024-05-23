import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from "../supabase";

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
  const [errors, setErrors] = useState({});
  const [breedOptions, setBreedOptions] = useState([]);
  const [breedLoading, setBreedLoading] = useState(false);

  const validationRules = {
    customerName: { required: true, message: "Please enter the customer name" },
    customerPhone: {
      required: true,
      message: "Please enter the customer phone number",
    },
    customerAddress: {
      required: true,
      message: "Please enter the customer address",
    },
    petName: { required: true, message: "Please enter the pet name" },
    petBreed: { required: true, message: "Please enter the pet breed" },
    startDate: { required: true, message: "Please select Check In date" },
    endDate: { required: true, message: "Please select Check Out date" },
    selectedKennels: {
      required: true,
      message: "Please select at least one kennel",
    },
  };

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    for (const [field, rule] of Object.entries(validationRules)) {
      if (rule.required) {
        if (field === "selectedKennels") {
          if (selectedKennels.length === 0) {
            errors[field] = rule.message;
            isValid = false;
          }
        } else {
          const value = eval(field);
          if (!value) {
            errors[field] = rule.message;
            isValid = false;
          }
        }
      }
    }

    setErrors(errors);
    return isValid;
  };

  const fetchCustomerDetails = async (phone) => {
    const { data, error } = await supabase
      .from("customers")
      .select("customer_name, customer_address")
      .eq("customer_phone", phone)
      .single();

    if (error) {
      console.error("Error fetching customer details:", error.message);
      return null;
    }

    return data;
  };

  const handleCustomerPhoneChange = async (e) => {
    const phone = e.target.value;
    setCustomerPhone(phone);
  
    if (phone.trim() !== "") {
      const customerData = await fetchCustomerDetails(phone);
      if (customerData) {
        setCustomerName(customerData.customer_name);
        setCustomerAddress(customerData.customer_address);
      } else {
        // Check if the customer name and address are already filled by user
        // and preserve them if customerData is null (customer doesn't exist)
        if (!customerName.trim() && !customerAddress.trim()) {
          setCustomerName("");
          setCustomerAddress("");
        }
      }
    } else {
      setCustomerName("");
      setCustomerAddress("");
    }
  };
  

  const fetchAvailableKennels = async () => {
    const { data, error } = await supabase
      .from("kennels")
      .select("*")
      .eq("status", "available")
      .neq("set_name", "Maintenance");

    if (error) {
      console.error("Error fetching kennels:", error.message);
    } else {
      setAvailableKennels(data);
    }
  };

  const createReservation = async () => {
    if (validateForm()) {
      let customerData;
      let customerError;

      // Check if customer already exists
      const { data: existingCustomers, error: fetchCustomerError } =
        await supabase
          .from("customers")
          .select("*")
          .eq("customer_phone", customerPhone);

      if (fetchCustomerError) {
        console.error("Error fetching customer:", fetchCustomerError.message);
        return;
      }

      

      if (existingCustomers.length > 0) {
        // Customer exists, use existing customer data
        customerData = existingCustomers[0];
      } else {
        // Customer doesn't exist, create a new one
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from("customers")
          .insert([
            {
              customer_name: customerName,
              customer_phone: customerPhone,
              customer_address: customerAddress,
            },
          ])
          .select();

        if (newCustomerError) {
          console.error("Error creating customer:", newCustomerError.message);
          return;
        }

        customerData = newCustomer[0];
      }

      const { error: reservationError } = await supabase
        .from("reservations")
        .insert({
          customer_id: customerData.id,
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

      if (reservationError) {
        console.error("Error creating reservation:", reservationError.message);
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
    }
  };

  useEffect(() => {
    if (startDate) {
      fetchAvailableKennels();
    }
  }, [startDate]);

  useEffect(() => {
    const fetchBreedOptions = async () => {
      if (petBreed.trim() !== "") {
        setBreedLoading(true);
        try {
          const response = await fetch(
            `https://api.thedogapi.com/v1/breeds/search?q=${petBreed}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch breed options");
          }
          const data = await response.json();
          setBreedOptions(data.map((breed) => breed.name));
        } catch (error) {
          console.error("Error fetching breed options:", error);
        } finally {
          setBreedLoading(false);
        }
      } else {
        setBreedOptions([]);
      }
    };

    fetchBreedOptions();
  }, [petBreed]);

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
    setErrors({});
    setBreedOptions([]);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Reservation</h2>

      <div className="space-y-4">

     

        <div>
          <label htmlFor="customerName" className="block text-sm font-medium">
            Customer Name
          </label>
          <input
            type="text"
            id="customerName"
            className={`w-full p-2 border rounded-md focus:border-blue-500 ${
              errors.customerName ? "border-red-500" : ""
            }`}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          {errors.customerName && (
            <p className="text-red-500 text-sm">{errors.customerName}</p>
          )}
        </div>

        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium">
            Customer Phone
          </label>
          <input
            type="text"
            id="customerPhone"
            className={`w-full p-2 border rounded-md focus:border-blue-500 ${
              errors.customerPhone ? "border-red-500" : ""
            }`}
            value={customerPhone}
            onChange={handleCustomerPhoneChange} // Updated to use handleCustomerPhoneChange
          />
          {errors.customerPhone && (
            <p className="text-red-500 text-sm">{errors.customerPhone}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="customerAddress"
            className="block text-sm font-medium"
          >
            Customer Address
          </label>
          <input
            type="text"
            id="customerAddress"
            className={`w-full p-2 border rounded-md focus:border-blue-500 ${
              errors.customerAddress ? "border-red-500" : ""
            }`}
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
          {errors.customerAddress && (
            <p className="text-red-500 text-sm">{errors.customerAddress}</p>
          )}
        </div>
        <div>
          <label htmlFor="petName" className="block text-sm font-medium">
            Pet Name
          </label>
          <input
            type="text"
            id="petName"
            className={`w-full p-2 border rounded-md focus:border-blue-500 ${
              errors.petName ? "border-red-500" : ""
            }`}
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
          />
          {errors.petName && (
            <p className="text-red-500 text-sm">{errors.petName}</p>
          )}
        </div>

        <div>
          <label htmlFor="petBreed" className="block text-sm font-medium">
            Pet Breed
          </label>
          <input
            type="text"
            id="petBreed"
            className={`w-full p-2 border rounded-md focus:border-blue-500 ${
              errors.petBreed ? "border-red-500" : ""
            }`}
            value={petBreed}
            onChange={(e) => setPetBreed(e.target.value)}
          />
          {breedOptions.length > 0 && (
            <ul className="mt-1 border rounded-md border-gray-300 bg-white">
              {breedOptions.map((breed, index) => (
                <li
                  key={index}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => setPetBreed(breed)}
                >
                  {breed}
                </li>
              ))}
            </ul>
          )}
          {breedLoading && (
            <p className="mt-1 text-sm text-gray-500">Loading...</p>
          )}
          {errors.petBreed && (
            <p className="text-red-500 text-sm">{errors.petBreed}</p>
          )}
        </div>

        <div className="flex gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium">
              Check In
            </label>
            <DatePicker
              id="startDate"
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              className={`w-full p-2 border rounded-md ${
                errors.startDate ? "border-red-500" : ""
              }`}
              dateFormat="yyyy/MM/dd"
              placeholderText="Select a start date"
              minDate={new Date()} // Minimum date to be today or any logic you want
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium">
              Check Out
            </label>
            <DatePicker
              id="endDate"
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              className={`w-full p-2 border rounded-md ${
                errors.endDate ? "border-red-500" : ""
              }`}
              dateFormat="yyyy/MM/dd"
              placeholderText="Select an end date"
              minDate={startDate} // Minimum date is the selected start date
            />
            {errors.endDate && (
              <p className="text-red-500 text-sm">{errors.endDate}</p>
            )}
          </div>
        </div>

        {startDate && (
          <div>
            <h3 className="text-lg font-semibold pb-3">Select Kennels</h3>
            <div className="space-y-2">
              {availableKennels.length === 0 && <p>No kennels available</p>}
              {availableKennels.length > 0 &&
                availableKennels
                  .reduce((acc, kennel) => {
                    const setIndex = acc.findIndex(
                      (item) => item.name === kennel.set_name
                    );
                    if (setIndex === -1) {
                      acc.push({ name: kennel.set_name, kennels: [kennel] });
                    } else {
                      acc[setIndex].kennels.push(kennel);
                    }
                    return acc;
                  }, [])
                  .map((set) => (
                    <div key={set.name}>
                      <h4 className="text-lg font-semibold mt-4">{set.name}</h4>
                      <div className="grid grid-cols-5 gap-4">
                        {set.kennels.map((kennel) => (
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
                  ))}
            </div>
            {errors.selectedKennels && (
              <p className="text-red-500 text-sm">{errors.selectedKennels}</p>
            )}
          </div>
        )}

        <div className="flex gap-4 mt-4">
          <fieldset>
            <legend className="text-lg font-medium text-gray-900">
              Services
            </legend>
            <div className="mt-4 flex space-x-6 mb-3 ">
              <label
                htmlFor="pickup"
                className="flex cursor-pointer items-start gap-2"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pickup"
                    className="size-4 rounded border-gray-300"
                    checked={pickup}
                    onChange={() => setPickup(!pickup)}
                  />
                </div>
                <div className="-mt-1">Pickup</div>
              </label>

              <label
                htmlFor="groom"
                className="flex cursor-pointer items-start gap-2"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="groom"
                    className="size-4 rounded border-gray-300"
                    checked={groom}
                    onChange={() => setGroom(!groom)}
                  />
                </div>
                <div className="-mt-1">Groom</div>
              </label>

              <label
                htmlFor="drop"
                className="flex cursor-pointer items-start gap-2"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="drop"
                    className="size-4 rounded border-gray-300"
                    checked={drop}
                    onChange={() => setDrop(!drop)}
                  />
                </div>
                <div className="-mt-1">Drop</div>
              </label>
            </div>
          </fieldset>
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 focus:outline-none"
            onClick={createReservation}
          >
            Create Reservation
          </button>

          <button
            type="button"
            className="bg-gray-300 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-400 focus:outline-none"
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
              className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 focus:outline-none"
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
