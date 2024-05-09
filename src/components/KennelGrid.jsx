import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase'; // Import Supabase client
import { Dialog, Transition } from '@headlessui/react'; // For modal dialogs
import { Fragment } from 'react'; // Fragment for React transitions

const KennelGrid = () => {
  const [kennels, setKennels] = useState([]); // Store the list of fetched kennels
  const [selectedKennel, setSelectedKennel] = useState(null); // Store the selected kennel for editing
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Control the modal dialog
  const [petInfo, setPetInfo] = useState({
    pet_name: '',
    dietary_requirements: '',
    special_care_instructions: '',
    medical_notes: '',
  }); // Default values for pet info

  // Fetch kennel data from Supabase
  useEffect(() => {
    const fetchKennels = async () => {
      const { data, error } = await supabase
        .from('kennels')
        .select('*')
        .order('kennel_number'); // Order by kennel number

      if (error) {
        console.error('Error fetching kennels:', error.message);
      } else {
        setKennels(data); // Store the list of fetched kennels
      }
    };

    fetchKennels(); // Fetch data on component mount
  }, []); // Empty dependency array to run only once on mount

  // Open the dialog to edit pet information for an occupied kennel
  const openDialog = async (kennel) => {
    if (kennel.status !== 'occupied') {
      return; // Only open dialog for occupied kennels
    }

    setSelectedKennel(kennel);

    // Fetch pet information from Supabase based on kennel_id
    const { data, error } = await supabase
      .from('pet_information')
      .select('*')
      .eq('kennel_id', kennel.id) // Fetch the pet info for the specific kennel
      .single();

    if (error) {
      console.error('Error fetching pet information:', error.message);
    }

    setPetInfo(data || {
      pet_name: '',
      dietary_requirements: '',
      special_care_instructions: '',
      medical_notes: ''
    }); // If no data, set default values

    setIsDialogOpen(true); // Open the dialog
  };

  const savePetInfo = async () => {
    const { pet_name, dietary_requirements, special_care_instructions, medical_notes } = petInfo;

    const { error } = await supabase
      .from('pet_information') // Correct table name
      .upsert({
        kennel_id: selectedKennel.id,
        pet_name,
        dietary_requirements,
        special_care_instructions,
        medical_notes,
      });

    if (error) {
      console.error('Error saving pet information:', error.message);
    }

    setIsDialogOpen(false); // Close the dialog after saving
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Kennel Status Overview</h2>
      <div className="grid grid-cols-10 gap-4">
        {kennels.map((kennel) => (
          <div
            key={kennel.id}
            onClick={() => openDialog(kennel)} // Open dialog if occupied
            className={`p-4 text-center rounded-md transition-colors cursor-pointer ${
              kennel.status === 'available'
                ? 'bg-green-500 text-white cursor-default' // Available kennels are not interactive
                : kennel.status === 'reserved'
                ? 'bg-yellow-500 text-white' // Reserved kennels show yellow
                : 'bg-red-500 text-white' // Occupied kennels are interactive
            }`}
          >
            Kennel {kennel.kennel_number}
          </div>
        ))}
      </div>

      {/* Modal dialog for editing pet information */}
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
          onClose={() => setIsDialogOpen(false)} // Close dialog
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            <Dialog.Panel className="rounded-lg bg-white p-8 shadow-xl">
              <Dialog.Title className="text-lg font-bold">Edit Pet Information</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-gray-500">
                Edit the details about the pet in this kennel.
              </Dialog.Description>

              <div className="mt-4">
                <label className="block font-semibold">Pet Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={petInfo.pet_name || ''}
                  onChange={(e) => setPetInfo({ ...petInfo, pet_name: e.target.value })}
                />
              </div>

              <div className="mt-4">
                <label className="block font-semibold">Dietary Requirements</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={petInfo.dietary_requirements}
                  onChange={(e) =>
                    setPetInfo({ ...petInfo, dietary_requirements: e.target.value })
                  }
                />
              </div>

              <div className="mt-4">
                <label className="block font-semibold">Special Care Instructions</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={petInfo.special_care_instructions}
                  onChange={(e) =>
                    setPetInfo({ ...petInfo, special_care_instructions: e.target.value })
                  }
                />
              </div>

              <div className="mt-4">
                <label className="block font-semibold">Medical Notes</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={petInfo.medical_notes || ''}
                  onChange={(e) =>
                    setPetInfo({ ...petInfo, medical_notes: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end mt-4">
                <button
                  className="bg-gray-300 px-4 py-2 rounded-md"
                  onClick={() => setIsDialogOpen(false)} // Close the dialog
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md ml-2"
                  onClick={savePetInfo} // Save the updated pet information
                >
                  Save
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default KennelGrid;
