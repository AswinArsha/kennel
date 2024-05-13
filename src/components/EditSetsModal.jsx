import { useState } from "react";
import { supabase } from "../supabase"; // Import the Supabase client

const EditSetsModal = ({ isOpen, onClose, setToEdit }) => {
  const [editedSetName, setEditedSetName] = useState(setToEdit?.name || "");
  const [editedNumKennels, setEditedNumKennels] = useState(
    setToEdit?.number_of_kennels || 1
  );
  const [error, setError] = useState("");

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check if set name is not empty and number of kennels is greater than 0
    if (!editedSetName.trim()) {
      setError("Set name is required.");
      return;
    }

    if (editedNumKennels <= 0) {
      setError("Number of kennels must be greater than 0.");
      return;
    }

    try {
      // Update the set in the Supabase database
      const { data, error } = await supabase
        .from("sets")
        .update({ name: editedSetName, number_of_kennels: editedNumKennels })
        .eq("id", setToEdit.id);

      if (error) {
        throw error;
      }

      // Clear input fields and error message
      setEditedSetName("");
      setEditedNumKennels(1);
      setError("");

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error updating set:", error.message);
      setError("An error occurred while updating the set. Please try again.");
    }
  };

  return (
    <div
      className={`fixed inset-0 z-10 overflow-y-auto ${
        isOpen ? "block" : "hidden"
      }`}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div
            className="absolute inset-0 bg-gray-500 opacity-75"
            onClick={onClose}
          ></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
        &#8203;
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900 mb-4"
                    id="modal-headline"
                  >
                    Edit Set
                  </h3>
                  {/* Set Name */}
                  <div className="mb-4">
                    <label
                      htmlFor="set-name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Set Name
                    </label>
                    <input
                      type="text"
                      id="set-name"
                      className="mt-1 p-2 border rounded-md w-full"
                      value={editedSetName}
                      onChange={(e) => setEditedSetName(e.target.value)}
                    />
                  </div>
                  {/* Number of Kennels */}
                  <div className="mb-4">
                    <label
                      htmlFor="num-kennels"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Number of Kennels
                    </label>
                    <input
                      type="number"
                      id="num-kennels"
                      className="mt-1 p-2 border rounded-md w-full"
                      value={editedNumKennels}
                      onChange={(e) =>
                        setEditedNumKennels(parseInt(e.target.value))
                      }
                    />
                  </div>
                  {/* Error Message */}
                  {error && (
                    <p className="text-red-500 text-sm mb-4">{error}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSetsModal;
