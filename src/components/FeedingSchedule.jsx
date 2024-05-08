import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // Import Supabase client
import DatePicker from 'react-datepicker'; // Date picker component
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS for date picker
import { Dialog, Transition } from '@headlessui/react'; // For modal dialog
import { Fragment } from 'react'; // Fragment for React transitions

// Utility function to convert Date to a string in the format 'yyyy-mm-dd'
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FeedingSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(null); // State for date selection
  const [feedingTime, setFeedingTime] = useState('morning'); // Default feeding time
  const [occupiedKennels, setOccupiedKennels] = useState([]); // Occupied kennels
  const [feedingStatus, setFeedingStatus] = useState({}); // Store feeding status by kennel ID
  const [isDialogOpen, setIsDialogOpen] = useState(false); // For dialog box after submission

  // Fetch occupied kennels based on the selected date
  const fetchOccupiedKennels = async (date) => {
    const { data, error } = await supabase
      .from('kennels')
      .select('*')
      .eq('status', 'occupied'); // Fetch only occupied kennels

    if (error) {
      console.error('Error fetching kennels:', error.message);
    } else {
      setOccupiedKennels(data); // Set the state with the list of occupied kennels
    }
  };

  // Handle submitting the feeding status
  const handleSubmit = async () => {
    // Loop through occupied kennels and create feeding records
    const feedingRecords = occupiedKennels.map((kennel) => ({
      kennel_id: kennel.id,
      feeding_date: formatDate(selectedDate), // Use the formatDate utility function
      feeding_time: feedingTime,
      fed: feedingStatus[kennel.id],
      eaten: feedingStatus[kennel.id],
    }));

    const { error } = await supabase.from('feeding_schedule').insert(feedingRecords);

    if (error) {
      console.error('Error inserting feeding status:', error.message);
    } else {
      setIsDialogOpen(true); // Open dialog to indicate successful submission
    }
  };

  // Fetch occupied kennels when the selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchOccupiedKennels(selectedDate);
    }
  }, [selectedDate]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Feeding Schedule Tracker</h2>

      {/* Date selection and feeding time */}
      <div className="flex items-center gap-4 mb-4">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          className="p-2 border rounded-md"
          dateFormat="yyyy/MM/dd"
          placeholderText="Select date"
        />
        
        <select
          className="p-2 border rounded-md"
          value={feedingTime}
          onChange={(e) => setFeedingTime(e.target.value)}
        >
          <option value="morning">Morning</option>
          <option value="noon">Noon</option>
          <option value="night">Night</option>
        </select>
      </div>

      {/* List of occupied kennels with checkboxes */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Occupied Kennels</h3>
          <div className="grid grid-cols-10 gap-2">
            {occupiedKennels.map((kennel) => (
              <div
                key={kennel.id}
                className={`p-3 rounded-md ${
                  feedingStatus[kennel.id] ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={feedingStatus[kennel.id] || false}
                    onChange={() => {
                      setFeedingStatus((prev) => ({
                        ...prev,
                        [kennel.id]: !prev[kennel.id],
                      }));
                    }}
                  />
                  Kennel {kennel.kennel_number}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit button */}
      <div className="mt-4">
        <button
          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>

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
              <Dialog.Title className="text-lg font-bold">Feeding Status Submitted</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-gray-500">
                The feeding status has been successfully submitted.
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

export default FeedingSchedule;