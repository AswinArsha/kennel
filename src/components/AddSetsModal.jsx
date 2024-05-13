import { useState } from "react";
import { supabase } from "../supabase";

const AddSetsModal = ({ isOpen, onClose }) => {
  const [setName, setSetName] = useState("");
  const [numKennels, setNumKennels] = useState(1);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation checks...
    if (!setName.trim()) {
      setError("Set name is required.");
      return;
    }

    if (numKennels <= 0) {
      setError("Number of kennels must be greater than 0.");
      return;
    }

    try {
      // Check if the set name already exists
      const { data: existingSets, error: fetchError } = await supabase
        .from("kennels")
        .select("set_name")
        .eq("set_name", setName);

      if (fetchError) {
        console.error("Error checking existing sets:", fetchError);
        throw fetchError;
      }

      if (existingSets.length > 0) {
        setError(
          "The set name already exists. Please choose a different name."
        );
        return;
      }

      // Determine the starting kennel number for the set
      let startingKennelNumber = 1;
      const { data: latestKennelInSet, error: latestError } = await supabase
        .from("kennels")
        .select("kennel_number")
        .eq("set_name", setName)
        .order("kennel_number", { ascending: false })
        .limit(1);

      if (latestError) {
        console.error("Error fetching latest kennel number:", latestError);
        throw latestError;
      }

      if (latestKennelInSet.length > 0) {
        startingKennelNumber = latestKennelInSet[0].kennel_number + 1;
      }

      // Insert new kennels into the "kennels" table
      const newKennels = Array.from({ length: numKennels }, (_, index) => ({
        kennel_number: startingKennelNumber + index,
        status: "available",
        set_name: setName,
      }));

      const { error: insertKennelsError } = await supabase
        .from("kennels")
        .insert(newKennels);

      if (insertKennelsError) {
        console.error("Error inserting kennels:", insertKennelsError);
        throw insertKennelsError;
      }

      // Clear input fields and error message
      setSetName("");
      setNumKennels(1);
      setError("");

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error adding kennels:", error.message);
      setError("An error occurred while adding the kennels. Please try again.");
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
                    Add New Set
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
                      value={setName}
                      onChange={(e) => setSetName(e.target.value)}
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
                      value={numKennels}
                      onChange={(e) => setNumKennels(parseInt(e.target.value))}
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
                Add Set
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

export default AddSetsModal;
