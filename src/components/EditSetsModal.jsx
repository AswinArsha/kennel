import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import AddKennelsToSetModal from "./AddKennelsToSetModal";
import { MdAdd, MdClose } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const EditSetsModal = ({ isOpen, onClose, setToEdit }) => {
  const [editedSetName, setEditedSetName] = useState("");
  const [editedKennels, setEditedKennels] = useState([]);
  const [initialKennels, setInitialKennels] = useState([]);
  const [error, setError] = useState("");
  const [isAddKennelsModalOpen, setIsAddKennelsModalOpen] = useState(false);

  useEffect(() => {
    if (setToEdit) {
      setEditedSetName(setToEdit.name);
      // Fetch the kennels for the set
      const fetchKennels = async () => {
        const { data, error } = await supabase
          .from("kennels")
          .select("*")
          .eq("set_name", setToEdit.name);

        if (error) {
          console.error("Error fetching kennels:", error);
        } else {
          setEditedKennels(data);
          setInitialKennels(data); // Store initial kennels to compare later
        }
      };

      fetchKennels();
    }
  }, [setToEdit]);

  const handleAddKennel = () => {
    setIsAddKennelsModalOpen(true);
  };

  const handleRemoveKennel = (kennel_id) => {
    setEditedKennels(editedKennels.filter((kennel) => kennel.id !== kennel_id));
  };

  const handleAddKennelsToSet = (addedKennels) => {
    setEditedKennels((prevKennels) => [...prevKennels, ...addedKennels]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editedSetName.trim()) {
      setError("Set name is required.");
      return;
    }

    if (editedKennels.length === 0) {
      setError("At least one kennel is required.");
      return;
    }

    try {
      const updates = editedKennels.map((kennel) => ({
        ...kennel,
        set_name: editedSetName,
      }));

      const { error: updateError } = await supabase
        .from("kennels")
        .upsert(updates, { onConflict: "id" });

      if (updateError) {
        throw updateError;
      }

      // Update kennels removed from the set
      const removedKennels = initialKennels.filter(
        (initialKennel) => !editedKennels.some((editedKennel) => editedKennel.id === initialKennel.id)
      );

      if (removedKennels.length > 0) {
        const { error: removeError } = await supabase
          .from("kennels")
          .update({ set_name: "Maintenance" })
          .in("id", removedKennels.map((kennel) => kennel.id));

        if (removeError) {
          throw removeError;
        }
      }

      setEditedSetName("");
      setEditedKennels([]);
      setError("");
      onClose();
      toast.success("Set updated successfully!"); // Trigger success toast
    } catch (error) {
      console.error("Error updating set:", error.message);
      setError("An error occurred while updating the set. Please try again.");
    }
  };

  return (
    <div
      className={`fixed inset-0 z-10 overflow-y-auto ${isOpen ? "block" : "hidden"}`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                    Edit Set
                  </h3>
                  <div className="mb-4">
                    <label htmlFor="set-name" className="block text-sm font-medium text-gray-700">
                      Set Name
                    </label>
                    <input
                      type="text"
                      id="set-name"
                      className="mt-1 p-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter set name"
                      value={editedSetName}
                      onChange={(e) => setEditedSetName(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                  <div className="grid grid-cols-3 gap-4">
                    {editedKennels.map((kennel) => (
                      <div key={kennel.id} className="relative border p-4 rounded-md bg-gray-100">
                        <span
                          className="absolute top-0 right-0 p-1 text-red-600 cursor-pointer"
                          onClick={() => handleRemoveKennel(kennel.id)}
                          title="Remove kennel"
                        >
                          <MdClose />
                        </span>
                        <p className="text-center">Kennel {kennel.kennel_number}</p>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="border-dashed border-2 border-gray-300 text-gray-400 flex items-center justify-center p-4 rounded-md"
                      onClick={handleAddKennel}
                      title="Add kennels"
                    >
                      <MdAdd className="text-2xl" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
      {isAddKennelsModalOpen && (
        <AddKennelsToSetModal
          isOpen={isAddKennelsModalOpen}
          onClose={() => setIsAddKennelsModalOpen(false)}
          setName={editedSetName}
          onKennelsAdded={handleAddKennelsToSet}
        />
      )}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
};

export default EditSetsModal;
