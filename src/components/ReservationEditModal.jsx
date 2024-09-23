import React, { useEffect, useState, Fragment } from "react";
import PropTypes from "prop-types";
import { supabase } from "../supabase";
import { Dialog, Transition, Switch } from "@headlessui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ReservationEditModal = ({ selectedReservation, isOpen, onClose, onSave }) => {
  const [reservationInfo, setReservationInfo] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    pet_name: "",
    pet_breed: "",
    start_date: "",
    end_date: "",
    status: "",
    kennel_ids: [],
    pickup: false,
    groom: false,
    drop: false,
    advance_amount: 0, // Added advance_amount field
  });

  const [petInfo, setPetInfo] = useState({
    dietary_requirements: "",
    special_care_instructions: "",
    medical_notes: "",
  });

  useEffect(() => {
    const fetchInfo = async () => {
      if (selectedReservation) {
        const { data: reservationData, error: reservationError } =
        await supabase
          .from("reservations")
          .select(
            `
          *,
          customers:customer_id (
            customer_name,
            customer_phone,
            customer_address
          ),
          payment_mode
        `
          )
          .eq("id", selectedReservation.id)
          .single();
      

        if (!reservationError && reservationData) {
          setReservationInfo({
            ...reservationData,
            customer_name: reservationData.customers.customer_name,
            customer_phone: reservationData.customers.customer_phone,
            customer_address: reservationData.customers.customer_address,
            start_date: new Date(reservationData.start_date),
            end_date: new Date(reservationData.end_date),
            advance_amount: reservationData.advance_amount || 0,
            payment_mode: reservationData.payment_mode || "", // Include payment_mode
          });
          
        } else {
          console.error("Error fetching reservation info:", reservationError);
        }

        const { data: petData, error: petError } = await supabase
          .from("pet_information")
          .select("*")
          .eq("reservation_id", selectedReservation.id)
          .single();

        if (!petError && petData) {
          setPetInfo(petData);
        } else {
          const { error: noDataError } = await supabase
            .from("pet_information")
            .select("*")
            .eq("reservation_id", selectedReservation.id)
            .single();

          if (noDataError && noDataError.code === "PGRST116") {
            setPetInfo({
              dietary_requirements: "",
              special_care_instructions: "",
              medical_notes: "",
            });
          } else {
            console.error("Error fetching pet info:", petError);
          }
        }
      }
    };

    fetchInfo();
  }, [selectedReservation]);

  const saveInformation = async () => {
    if (selectedReservation) {
      const { error: customerError } = await supabase
        .from("customers")
        .update({
          customer_name: reservationInfo.customer_name,
          customer_phone: reservationInfo.customer_phone,
          customer_address: reservationInfo.customer_address,
        })
        .eq("id", reservationInfo.customer_id);

     const { error: reservationError } = await supabase
  .from("reservations")
  .update({
    pet_name: reservationInfo.pet_name,
    pet_breed: reservationInfo.pet_breed,
    start_date: reservationInfo.start_date,
    end_date: reservationInfo.end_date,
    status: reservationInfo.status,
    kennel_ids: reservationInfo.kennel_ids,
    pickup: reservationInfo.pickup,
    groom: reservationInfo.groom,
    drop: reservationInfo.drop,
    advance_amount: reservationInfo.advance_amount, // Update advance_amount
    payment_mode: reservationInfo.payment_mode, // Include payment_mode
  })
  .eq("id", selectedReservation.id);


      let petError = null;
      if (petInfo.id) {
        const { error } = await supabase
          .from("pet_information")
          .update({
            dietary_requirements: petInfo.dietary_requirements,
            special_care_instructions: petInfo.special_care_instructions,
            medical_notes: petInfo.medical_notes,
          })
          .eq("id", petInfo.id);

        petError = error;
      } else {
        const { error } = await supabase.from("pet_information").insert({
          kennel_id: selectedReservation.kennel_ids[0],
          reservation_id: selectedReservation.id,
          dietary_requirements: petInfo.dietary_requirements,
          special_care_instructions: petInfo.special_care_instructions,
          medical_notes: petInfo.medical_notes,
        });

        petError = error;
      }

      if (!customerError && !reservationError && !petError) {
        onClose();
        onSave();
      } else {
        console.error(
          "Error saving information:",
          customerError,
          reservationError,
          petError
        );
      }
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-800 bg-opacity-50">
          <Dialog.Panel className="rounded-lg bg-white p-8 shadow-xl w-full max-w-4xl">
            <Dialog.Title className="text-lg font-bold">
              Edit Reservation and Pet Information
            </Dialog.Title>
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block font-semibold">Customer Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={reservationInfo.customer_name}
                  onChange={(e) =>
                    setReservationInfo({
                      ...reservationInfo,
                      customer_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-1">
                <label className="block font-semibold">Customer Phone</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={reservationInfo.customer_phone}
                  onChange={(e) =>
                    setReservationInfo({
                      ...reservationInfo,
                      customer_phone: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-1">
                <label className="block font-semibold">Customer Address</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={reservationInfo.customer_address}
                  onChange={(e) =>
                    setReservationInfo({
                      ...reservationInfo,
                      customer_address: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-1">
                <label className="block font-semibold">Pet Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={reservationInfo.pet_name}
                  onChange={(e) =>
                    setReservationInfo({
                      ...reservationInfo,
                      pet_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-1">
                <label className="block font-semibold">Pet Breed</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={reservationInfo.pet_breed}
                  onChange={(e) =>
                    setReservationInfo({
                      ...reservationInfo,
                      pet_breed: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-1">
                <label className="block font-semibold">Check In</label>
                <DatePicker
                  selected={reservationInfo.start_date}
                  onChange={(date) =>
                    setReservationInfo({ ...reservationInfo, start_date: date })
                  }
                  dateFormat="yyyy-MM-dd"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-1">
                <label className="block font-semibold">Check Out</label>
                <DatePicker
                  selected={reservationInfo.end_date}
                  onChange={(date) =>
                    setReservationInfo({ ...reservationInfo, end_date: date })
                  }
                  dateFormat="yyyy-MM-dd"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold">Advance Paid</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-md"
                  value={reservationInfo.advance_amount}
                  onChange={(e) =>
                    setReservationInfo({
                      ...reservationInfo,
                      advance_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="col-span-2">
  <label className="block font-semibold">Advance Payment Mode</label>
  <select
    className="w-full p-2 border rounded-md"
    value={reservationInfo.payment_mode}
    onChange={(e) =>
      setReservationInfo({
        ...reservationInfo,
        payment_mode: e.target.value,
      })
    }
  >
    <option value="">Select Payment Mode</option>
    <option value="gpay">GPay</option>
    <option value="cash">Cash</option>
    <option value="swipe">Swipe</option>
  </select>
</div>

              <div className="col-span-2">
                <label className="block font-semibold">Dietary Requirements</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={petInfo.dietary_requirements}
                  onChange={(e) =>
                    setPetInfo({
                      ...petInfo,
                      dietary_requirements: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold">Special Care Instructions</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={petInfo.special_care_instructions}
                  onChange={(e) =>
                    setPetInfo({
                      ...petInfo,
                      special_care_instructions: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold">Medical Notes</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={petInfo.medical_notes}
                  onChange={(e) =>
                    setPetInfo({ ...petInfo, medical_notes: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <legend className="text-lg font-medium text-gray-900 mb-2">
                  Services
                </legend>
                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={reservationInfo.pickup}
                      onChange={(value) => setReservationInfo({ ...reservationInfo, pickup: value })}
                      className={`${reservationInfo.pickup ? 'bg-blue-500' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11`}
                    >
                      <span
                        className={`${reservationInfo.pickup ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                      />
                    </Switch>
                    <span className="text-sm text-gray-700">Pickup</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={reservationInfo.groom}
                      onChange={(value) => setReservationInfo({ ...reservationInfo, groom: value })}
                      className={`${reservationInfo.groom ? 'bg-blue-500' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11`}
                    >
                      <span
                        className={`${reservationInfo.groom ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                      />
                    </Switch>
                    <span className="text-sm text-gray-700">Groom</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={reservationInfo.drop}
                      onChange={(value) => setReservationInfo({ ...reservationInfo, drop: value })}
                      className={`${reservationInfo.drop ? 'bg-blue-500' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11`}
                    >
                      <span
                        className={`${reservationInfo.drop ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                      />
                    </Switch>
                    <span className="text-sm text-gray-700">Drop</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-4">
              <button
                type="button"
                className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                onClick={saveInformation}
              >
                Save
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

ReservationEditModal.propTypes = {
  selectedReservation: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default ReservationEditModal;
