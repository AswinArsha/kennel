import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import AddSetsModal from "./AddSetsModal";
import EditSetsModal from "./EditSetsModal";
import { MdEdit } from "react-icons/md";

const KennelGrid = () => {
  const [kennels, setKennels] = useState([]);
  const [isAddSetsModalOpen, setIsAddSetsModalOpen] = useState(false);
  const [isEditSetsModalOpen, setIsEditSetsModalOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);

  // Fetch kennels data
  useEffect(() => {
    const fetchKennels = async () => {
      try {
        const { data, error } = await supabase
          .from("kennels")
          .select("*")
          .order("set_name", { ascending: true })
          .order("kennel_number", { ascending: true });

        if (error) {
          throw error;
        } else {
          setKennels(data);
        }
      } catch (error) {
        console.error("Error fetching kennels:", error.message);
      }
    };

    fetchKennels();
  }, []);

  // Open the add sets modal
  const openAddSetsModal = () => {
    setIsAddSetsModalOpen(true);
  };

  // Open the edit sets modal
  const openEditSetsModal = (set) => {
    setSelectedSet(set);
    setIsEditSetsModalOpen(true);
  };

  // Group kennels by set names
  const groupedKennels = kennels.reduce((acc, kennel) => {
    const setName = kennel.set_name;
    if (!acc[setName]) {
      acc[setName] = [];
    }
    acc[setName].push(kennel);
    return acc;
  }, {});

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Kennel Status Overview</h2>

      {/* Add Sets Button */}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4"
        onClick={openAddSetsModal}
      >
        Add Sets
      </button>

      {/* Display Kennels */}
      {Object.entries(groupedKennels).map(
        ([setName, kennelsForSet], index, array) => (
          <div key={index}>
            {/* Set Name */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{setName}</h3>
              <button
                onClick={() => openEditSetsModal({ name: setName })}
                className="text-gray-500 hover:text-gray-700"
              >
                <MdEdit />
              </button>
            </div>

            {/* Kennels in the Set */}
            <div className="grid grid-cols-5 md:grid-cols-10 gap-4 mb-4">
              {kennelsForSet.map((kennel) => (
                <div
                  key={kennel.id}
                  className={`p-4 text-center rounded-md transition-colors cursor-pointer ${
                    kennel.status === "available"
                      ? "bg-green-500 text-white"
                      : kennel.status === "reserved"
                      ? "bg-yellow-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                  style={{
                    transition: "background-color 0.3s ease",
                  }}
                >
                  Kennel {kennel.kennel_number}
                </div>
              ))}
            </div>

            {/* Horizontal Line */}
            {index !== array.length - 1 && <hr className="my-4" />}
          </div>
        )
      )}

      {/* Add Sets Modal */}
      {isAddSetsModalOpen && (
        <AddSetsModal
          isOpen={isAddSetsModalOpen}
          onClose={() => setIsAddSetsModalOpen(false)}
        />
      )}

      {/* Edit Sets Modal */}
      {isEditSetsModalOpen && (
        <EditSetsModal
          isOpen={isEditSetsModalOpen}
          onClose={() => setIsEditSetsModalOpen(false)}
          setToEdit={selectedSet}
        />
        
      )}
    </div>
  );
};

export default KennelGrid;
