import React, { useEffect, useState } from "react";
import PropTypes from "prop-types"; // Import PropTypes for prop validation
import { supabase } from "../supabase";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react"; // Fragment for transitions

const ReservationEditModal = ({
  selectedReservation,
  isOpen,
  onClose,
  onSave,
}) => {
  const [petInfo, setPetInfo] = useState({
    pet_name: "",
    dietary_requirements: "",
    special_care_instructions: "",
    medical_notes: "",
    breed: "", // New breed field
  });

  useEffect(() => {
    const fetchPetInfo = async () => {
      if (selectedReservation) {
        const { data, error } = await supabase
          .from("pet_information")
          .select("*")
          .eq("kennel_id", selectedReservation.kennel_ids[0])
          .single(); // Fetch information for the specific kennel

        if (!error && data) {
          setPetInfo(data); // Set the pet information
        } else {
          setPetInfo({
            pet_name: "",
            dietary_requirements: "",
            special_care_instructions: "",
            medical_notes: "",
            breed: "", // Initialize breed
          }); // Reset to initial values
        }
      }
    };

    fetchPetInfo();
  }, [selectedReservation]); // Fetch pet info when the selected reservation changes

  const savePetInformation = async () => {
    if (selectedReservation) {
      const { error } = await supabase.from("pet_information").upsert({
        reservation_id: selectedReservation.id,
        kennel_id: selectedReservation.kennel_ids[0], // Get kennel ID
        pet_name: petInfo.pet_name,
        dietary_requirements: petInfo.dietary_requirements,
        special_care_instructions: petInfo.special_care_instructions,
        medical_notes: petInfo.medical_notes,
        breed: petInfo.breed, // Save breed information
      });

      if (!error) {
        onClose(); // Close modal when saved
        onSave(); // Refresh reservation data
      }
    }
  };

  return (
    <Transition
      show={isOpen}
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
        onClose={onClose} // Close modal when user interacts
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          <Dialog.Panel className="rounded-lg bg-white p-8 shadow-xl">
            <Dialog.Title className="text-lg font-bold">
              Edit Pet Information
            </Dialog.Title>
            <div className="mt-4">
              <label className="block font-semibold">Pet Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={petInfo.pet_name}
                onChange={(e) =>
                  setPetInfo({ ...petInfo, pet_name: e.target.value })
                }
              />
            </div>
            <div className="mt-4">
              <label className="block font-semibold">Breed</label>{" "}
              {/* New breed input box */}
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={petInfo.breed}
                onChange={
                  (e) => setPetInfo({ ...petInfo, breed: e.target.value }) // Handle breed change
                }
              />
            </div>
            <div className="mt-4">
              <label className="block font-semibold">
                Dietary Requirements
              </label>
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
            <div className="mt-4">
              <label className="block font-semibold">
                Special Care Instructions
              </label>
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
            <div className="mt-4">
              <label className="block font-semibold">Medical Notes</label>
              <textarea
                className="w-full p-2 border rounded-md"
                value={petInfo.medical_notes}
                onChange={(e) =>
                  setPetInfo({ ...petInfo, medical_notes: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="button"
                className="bg-gray-300 px-4 py-2 rounded-md"
                onClick={onClose} // Close the modal
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                onClick={savePetInformation} // Save the updated information
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
