import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import AddKennelsModal from "./AddKennelsModal";
import EditSetsModal from "./EditSetsModal";
import ManageKennelsModal from "./ManageKennelsModal";
import CustomerDetailDialog from "./CustomerDetailDialog";
import { MdEdit } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  updateKennelStatus,
  updatePetInformation,
  updateReservation,
  updateFeedingSchedule,
} from "./kennelUtils";

const KennelGrid = () => {
  const [kennels, setKennels] = useState([]);
  const [isAddKennelsModalOpen, setIsAddKennelsModalOpen] = useState(false);
  const [isManageKennelsModalOpen, setIsManageKennelsModalOpen] = useState(false);
  const [isEditSetsModalOpen, setIsEditSetsModalOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);
  const [selectedKennel, setSelectedKennel] = useState(null);
  const [isCustomerDetailDialogOpen, setIsCustomerDetailDialogOpen] = useState(false);

  // Fetch kennels data
  const fetchKennels = async () => {
    try {
      const { data, error } = await supabase
        .from("kennels")
        .select("*")
        .order("created_at", { ascending: true })
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

  useEffect(() => {
    fetchKennels();

    const subscription = supabase
      .channel("public:kennels")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kennels" },
        () => {
          fetchKennels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Open the add kennels modal
  const openAddKennelsModal = () => {
    setIsAddKennelsModalOpen(true);
  };

  // Open the manage kennels modal
  const openManageKennelsModal = () => {
    setIsManageKennelsModalOpen(true);
  };

  // Open the edit sets modal
  const openEditSetsModal = (set) => {
    setSelectedSet(set);
    setIsEditSetsModalOpen(true);
  };

  // Handle kennel click
  const handleKennelClick = (kennel) => {
    if (kennel.status === "occupied" || kennel.status === "reserved") {
      setSelectedKennel(kennel);
      setIsCustomerDetailDialogOpen(true);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const sourceId = parseInt(result.source.droppableId);
    const destinationId = parseInt(result.destination.droppableId);

    if (sourceId === destinationId) {
      return;
    }

    const sourceKennel = kennels.find((kennel) => kennel.id === sourceId);
    const destinationKennel = kennels.find(
      (kennel) => kennel.id === destinationId
    );

    if (
      sourceKennel.status === "available" ||
      destinationKennel.status !== "available"
    ) {
      return;
    }

    try {
      await updateKennelStatus(sourceId, destinationId);
      await updatePetInformation(sourceId, destinationId);
      await updateReservation(sourceId, destinationId);
      await updateFeedingSchedule(sourceId, destinationId);

      fetchKennels();
      toast.success(
        `Kennel ${destinationKennel.kennel_number} status changed to ${sourceKennel.status}`
      );
    } catch (error) {
      console.error("Error updating kennel status:", error.message);
      toast.error("Error updating kennel status. Please try again.");
    }
  };

  // Group kennels by set names and sort them
  const groupedKennels = kennels.reduce((acc, kennel) => {
    const setName = kennel.set_name;
    if (!acc[setName]) {
      acc[setName] = [];
    }
    acc[setName].push(kennel);
    return acc;
  }, {});

  // Sort sets by creation order and kennels within each set by number
  const sortedSets = Object.keys(groupedKennels).sort((a, b) => {
    const setA = kennels.find((kennel) => kennel.set_name === a);
    const setB = kennels.find((kennel) => kennel.set_name === b);
    return new Date(setA.created_at) - new Date(setB.created_at);
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-4">
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
        />
        <h2 className="text-2xl font-semibold mb-4">Kennel Status Overview</h2>
       
        {/* Add Kennels and Manage Kennels Buttons */}
        <div className="flex gap-4 mb-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={openAddKennelsModal}
            title="Click to add new kennels"
          >
            Add Kennels
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={openManageKennelsModal}
            title="Click to manage existing kennels"
          >
            Manage Kennels
          </button>
        </div>

        {/* Display Kennels */}
        {sortedSets.map((setName, index) => (
          <div key={index} className="border-b-2 border-gray-200 mb-4 ">
            {/* Set Name */}
            <div className="flex items-center mb-2">
              <h3 className="text-lg mr-1 font-semibold">{setName}</h3>
              {setName !== "Maintenance" && (
                <button
                  onClick={() => openEditSetsModal({ name: setName })}
                  className="text-gray-500 hover:text-gray-700"
                  title="Edit set"
                >
                  <MdEdit />
                </button>
              )}
            </div>

            {/* Kennels in the Set */}
            <div className="grid grid-cols-5 md:grid-cols-10 gap-4 mb-4">
              {groupedKennels[setName].map((kennel) => (
                <Droppable
                  key={kennel.id}
                  droppableId={kennel.id.toString()}
                  isDropDisabled={kennel.status !== "available" || setName === "Maintenance"}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 text-center rounded-md transition-colors ${
                        snapshot.isDraggingOver
                          ? "bg-blue-200"
                          : setName === "Maintenance"
                          ? "bg-gray-400 text-white"
                          : kennel.status === "available"
                          ? "bg-green-500 text-white"
                          : kennel.status === "reserved"
                          ? "bg-yellow-500 text-white cursor-pointer"
                          : kennel.status === "occupied"
                          ? "bg-red-500 text-white cursor-pointer"
                          : "bg-gray-400 text-white"
                      }`}
                      style={{
                        transition: "background-color 0.3s ease",
                        cursor:
                          kennel.status === "reserved" ||
                          kennel.status === "occupied"
                            ? "pointer"
                            : "default",
                      }}
                      onClick={() =>
                        (kennel.status === "reserved" ||
                          kennel.status === "occupied") &&
                        handleKennelClick(kennel)
                      }
                    >
                      <Draggable
                        draggableId={kennel.id.toString()}
                        index={kennel.kennel_number}
                        isDragDisabled={kennel.status === "available" || setName === "Maintenance"}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              cursor:
                                kennel.status === "available" ||
                                setName === "Maintenance"
                                  ? "default"
                                  : "grab",
                              background: snapshot.isDragging
                                ? "rgba(0,0,0,0.1)"
                                : "inherit",
                              borderRadius: "8px",
                              padding: "8px",
                              boxShadow: snapshot.isDragging
                                ? "0 4px 8px rgba(0, 0, 0, 0.2)"
                                : "none",
                            }}
                          >
                            {kennel.status !== "available" ? (
                              <div>Kennel {kennel.kennel_number}</div>
                            ) : (
                              `Kennel ${kennel.kennel_number}`
                            )}
                          </div>
                        )}
                      </Draggable>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        ))}

        {/* Add Kennels Modal */}
        {isAddKennelsModalOpen && (
          <AddKennelsModal
            isOpen={isAddKennelsModalOpen}
            onClose={() => setIsAddKennelsModalOpen(false)}
          />
        )}

        {/* Manage Kennels Modal */}
        {isManageKennelsModalOpen && (
          <ManageKennelsModal
            isOpen={isManageKennelsModalOpen}
            onClose={() => setIsManageKennelsModalOpen(false)}
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

        {/* Customer Detail Dialog */}
        {isCustomerDetailDialogOpen && (
          <CustomerDetailDialog
            isOpen={isCustomerDetailDialogOpen}
            onClose={() => setIsCustomerDetailDialogOpen(false)}
            customer={selectedKennel}
          />
        )}
         {/* Legend */}
         <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span>Maintenance</span>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default KennelGrid;
