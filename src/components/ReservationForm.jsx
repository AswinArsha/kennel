import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useForm, Controller } from "react-hook-form";
import { supabase } from "../supabase";
import { FaCalendarAlt } from "react-icons/fa";
import { Switch } from "@headlessui/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const petBreeds = [
  "Affenpinscher",
  "Šarplaninac",
];

const ReservationForm = () => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm();
  const [availableKennels, setAvailableKennels] = useState([]);
  const [selectedKennels, setSelectedKennels] = useState([]);
  const [pets, setPets] = useState([]);
  const [currentPet, setCurrentPet] = useState({
    name: "",
    breed: "",
    pickup: false,
    groom: false,
    drop: false,
  });
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false);
  const [currentKennel, setCurrentKennel] = useState(null);
  const [filteredBreeds, setFilteredBreeds] = useState([]);
  const [showBreedOptions, setShowBreedOptions] = useState(false);

  const startDate = watch("startDate");

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
    setValue("customerPhone", phone);

    if (phone.trim() !== "") {
      const customerData = await fetchCustomerDetails(phone);
      if (customerData) {
        setValue("customerName", customerData.customer_name);
        setValue("customerAddress", customerData.customer_address);
      } else {
        if (!watch("customerName").trim() && !watch("customerAddress").trim()) {
          setValue("customerName", "");
          setValue("customerAddress", "");
        }
      }
    } else {
      setValue("customerName", "");
      setValue("customerAddress", "");
    }
  };

  const fetchAvailableKennels = async () => {
    const { data, error } = await supabase
      .from("kennels")
      .select("*")
      .eq("status", "available")
      .neq("set_name", "Maintenance")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching kennels:", error.message);
    } else {
      setAvailableKennels(data);
    }
  };

  const createReservation = async (data) => {
    if (validateForm(data)) {
      let customerData;

      const { data: existingCustomers, error: fetchCustomerError } =
        await supabase
          .from("customers")
          .select("*")
          .eq("customer_phone", data.customerPhone);

      if (fetchCustomerError) {
        console.error("Error fetching customer:", fetchCustomerError.message);
        return;
      }

      if (existingCustomers.length > 0) {
        customerData = existingCustomers[0];
      } else {
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from("customers")
          .insert([
            {
              customer_name: data.customerName,
              customer_phone: data.customerPhone,
              customer_address: data.customerAddress,
            },
          ])
          .select();

        if (newCustomerError) {
          console.error("Error creating customer:", newCustomerError.message);
          return;
        }

        customerData = newCustomer[0];
      }

      const reservationStatus =
        data.endDate < new Date() ? "checked_out" : "pending";

      for (const pet of pets) {
        const { error: reservationError } = await supabase
          .from("reservations")
          .insert({
            customer_id: customerData.id,
            pet_name: pet.name,
            pet_breed: pet.breed,
            start_date: data.startDate,
            end_date: data.endDate,
            status: reservationStatus,
            kennel_ids: [pet.kennel.id],
            pickup: pet.pickup,
            groom: pet.groom,
            drop: pet.drop,
          });

        if (reservationError) {
          console.error(
            "Error creating reservation:",
            reservationError.message
          );
        } else {
          const kennelStatus =
            reservationStatus === "checked_out" ? "available" : "reserved";
          await supabase
            .from("kennels")
            .update({ status: kennelStatus })
            .eq("id", pet.kennel.id);
        }
      }

      toast.success("Reservation created successfully!");
      clearForm();
    }
  };

  const validateForm = (data) => {
    const newErrors = {};
    let isValid = true;

    if (!data.customerName) {
      newErrors.customerName = "Please enter the customer name";
      isValid = false;
    }

    if (!data.customerPhone) {
      newErrors.customerPhone = "Please enter the customer phone number";
      isValid = false;
    }

    if (!data.customerAddress) {
      newErrors.customerAddress = "Please enter the customer address";
      isValid = false;
    }

    if (!data.startDate) {
      newErrors.startDate = "Please select Check In date";
      isValid = false;
    }

    if (!data.endDate) {
      newErrors.endDate = "Please select Check Out date";
      isValid = false;
    }

    if (selectedKennels.length === 0) {
      newErrors.selectedKennels = "Please select at least one kennel";
      isValid = false;
    }

    setValue("errors", newErrors);
    return isValid;
  };

  const handleKennelSelection = (kennel) => {
    const existingPet = pets.find((pet) => pet.kennel.id === kennel.id);
    if (existingPet) {
      setCurrentPet(existingPet);
    } else {
      setCurrentPet({
        name: "",
        breed: "",
        pickup: false,
        groom: false,
        drop: false,
      });
    }
    setCurrentKennel(kennel);
    setIsPetDialogOpen(true);
  };

  const handlePetDialogSave = () => {
    if (currentPet.name && currentPet.breed) {
      const updatedPets = pets.filter(
        (pet) => pet.kennel.id !== currentKennel.id
      );
      setPets([...updatedPets, { ...currentPet, kennel: currentKennel }]);
      setSelectedKennels([...selectedKennels, currentKennel]);
      setIsPetDialogOpen(false);
    }
  };

  const handleBreedInputChange = (e) => {
    const breed = e.target.value;
    setCurrentPet({ ...currentPet, breed });

    if (breed.trim() !== "") {
      const filtered = petBreeds.filter((b) =>
        b.toLowerCase().includes(breed.toLowerCase())
      );
      setFilteredBreeds(filtered);
      setShowBreedOptions(true);
    } else {
      setFilteredBreeds([]);
      setShowBreedOptions(false);
    }
  };

  const handleBreedSelect = (breed) => {
    setCurrentPet({ ...currentPet, breed });
    setShowBreedOptions(false);
  };

  const clearForm = () => {
    reset();
    setSelectedKennels([]);
    setPets([]);
  };

  useEffect(() => {
    if (startDate) {
      fetchAvailableKennels();
    }
  }, [startDate]);

  return (
    <div className="max-w-screen-xl mx-auto p-6 bg-white">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
      <h2 className="text-2xl font-bold mb-6 text-center">
        Create Reservation
      </h2>
      <form onSubmit={handleSubmit(createReservation)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="mb-4">
              <label
                htmlFor="customerName"
                className="block text-sm font-medium text-gray-700"
              >
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customerName ? "border-red-500" : "border-gray-300"
                }`}
                {...register("customerName", {
                  required: "Please enter the customer name",
                })}
              />
              {errors.customerName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.customerName.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="customerPhone"
                className="block text-sm font-medium text-gray-700"
              >
                Customer Phone
              </label>
              <input
                type="text"
                id="customerPhone"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customerPhone ? "border-red-500" : "border-gray-300"
                }`}
                {...register("customerPhone", {
                  required: "Please enter the customer phone number",
                })}
                onChange={handleCustomerPhoneChange}
              />
              {errors.customerPhone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.customerPhone.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="customerAddress"
                className="block text-sm font-medium text-gray-700"
              >
                Customer Address
              </label>
              <input
                type="text"
                id="customerAddress"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customerAddress ? "border-red-500" : "border-gray-300"
                }`}
                {...register("customerAddress", {
                  required: "Please enter the customer address",
                })}
              />
              {errors.customerAddress && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.customerAddress.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Check In
              </label>
              <div className="relative">
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      id="startDate"
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      className={`w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.startDate ? "border-red-500" : "border-gray-300"
                      }`}
                      dateFormat="yyyy/MM/dd"
                      placeholderText="Select a start date"
                      minDate={new Date()}
                    />
                  )}
                />
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                Check Out
              </label>
              <div className="relative">
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePicker
                      id="endDate"
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      className={`w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.endDate ? "border-red-500" : "border-gray-300"
                      }`}
                      dateFormat="yyyy/MM/dd"
                      placeholderText="Select an end date"
                      minDate={startDate}
                    />
                  )}
                />
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {startDate && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Select Kennels</h3>
            {availableKennels.length === 0 && (
              <p className="text-gray-500">No kennels available</p>
            )}
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
                  <div key={set.name} className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">{set.name}</h4>
                    <div className="grid grid-cols-8 gap-6 ">
                      {set.kennels
                        .sort(
                          (a, b) => a.kennel_number - b.kennel_number
                        )
                        .map((kennel) => (
                          <div
                            key={kennel.id}
                            className={`p-4 text-center rounded-md cursor-pointer transition-all aspect-square ${
                              selectedKennels.includes(kennel)
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 hover:bg-gray-300"
                            }`}
                            onClick={() => handleKennelSelection(kennel)}
                          >
                            Kennel {kennel.kennel_number}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            {errors.selectedKennels && (
              <p className="text-red-500 text-sm mt-1">
                {errors.selectedKennels.message}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-center space-x-4 mt-8">
          <button
            type="button"
            className="px-6 py-3 rounded-md bg-gray-300 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
            onClick={clearForm}
          >
            Clear Form
          </button>

          <button
            type="submit"
            className="px-6 py-3 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Reservation
          </button>
        </div>
      </form>

      {isPetDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-6 w-2/6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4">Enter Pet Details</h3>
            <div className="mb-4">
              <label
                htmlFor="petName"
                className="block text-sm font-medium text-gray-700"
              >
                Pet Name
              </label>
              <input
                type="text"
                id="petName"
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={currentPet.name}
                onChange={(e) =>
                  setCurrentPet({ ...currentPet, name: e.target.value })
                }
              />
            </div>
            <div className="mb-4 relative">
              <label
                htmlFor="petBreed"
                className="block text-sm font-medium text-gray-700"
              >
                Pet Breed
              </label>
              <input
                type="text"
                id="petBreed"
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={currentPet.breed}
                onChange={handleBreedInputChange}
                onFocus={() => setShowBreedOptions(true)}
                onBlur={() => setTimeout(() => setShowBreedOptions(false), 200)}
              />
              {showBreedOptions && (
                <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md border-gray-300 shadow-lg">
                  {filteredBreeds.map((breed, index) => (
                    <li
                      key={index}
                      className="px-3 py-2 cursor-pointer text-sm hover:bg-gray-100"
                      onClick={() => handleBreedSelect(breed)}
                    >
                      {breed}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-4">
              <legend className="text-lg font-medium text-gray-900 mb-2">
                Services
              </legend>
              <div className="space-y-2">
                <Switch.Group>
                  <div className="flex items-center justify-between">
                    <Switch.Label className="mr-4">Pickup</Switch.Label>
                    <Switch
                      checked={currentPet.pickup}
                      onChange={(value) =>
                        setCurrentPet({ ...currentPet, pickup: value })
                      }
                      className={`${
                        currentPet.pickup ? "bg-blue-600" : "bg-gray-200"
                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                      <span
                        className={`${
                          currentPet.pickup ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform bg-white rounded-full transition`}
                      />
                    </Switch>
                  </div>
                </Switch.Group>
                <Switch.Group>
                  <div className="flex items-center justify-between">
                    <Switch.Label className="mr-4">Groom</Switch.Label>
                    <Switch
                      checked={currentPet.groom}
                      onChange={(value) =>
                        setCurrentPet({ ...currentPet, groom: value })
                      }
                      className={`${
                        currentPet.groom ? "bg-blue-600" : "bg-gray-200"
                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                      <span
                        className={`${
                          currentPet.groom ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform bg-white rounded-full transition`}
                      />
                    </Switch>
                  </div>
                </Switch.Group>
                <Switch.Group>
                  <div className="flex items-center justify-between">
                    <Switch.Label className="mr-4">Drop</Switch.Label>
                    <Switch
                      checked={currentPet.drop}
                      onChange={(value) =>
                        setCurrentPet({ ...currentPet, drop: value })
                      }
                      className={`${
                        currentPet.drop ? "bg-blue-600" : "bg-gray-200"
                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                      <span
                        className={`${
                          currentPet.drop ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform bg-white rounded-full transition`}
                      />
                    </Switch>
                  </div>
                </Switch.Group>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-gray-300 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                onClick={() => setIsPetDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handlePetDialogSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationForm;
