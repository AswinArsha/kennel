import  { useEffect, useState } from "react";
import { supabase } from "../supabase"; // Import the Supabase client
import CustomerDetailDialog from "./CustomerDetailDialog"; // Import the customer detail modal
import { Tooltip } from "@material-ui/core"; // Tooltip component for additional information

const KennelGrid = () => {
  const [kennels, setKennels] = useState([]);
  const [isCustomerDetailDialogOpen, setIsCustomerDetailDialogOpen] =
    useState(false);
  const [selectedCustomerKennel, setSelectedCustomerKennel] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // New search bar for finding kennels

  // Fetch kennel data
  useEffect(() => {
    const fetchKennels = async () => {
      const { data, error } = await supabase
        .from("kennels")
        .select("*")
        .order("kennel_number");

      if (error) {
        console.error("Error fetching kennels:", error.message);
      } else {
        setKennels(data);
      }
    };

    fetchKennels();
  }, []);

  // Open the modal with customer details
  const openModal = async (kennel) => {
    if (kennel.status !== "occupied") return;

    setSelectedCustomerKennel(kennel);
    setIsCustomerDetailDialogOpen(true);
  };

  // Filter kennels based on the search query
  const filteredKennels = searchQuery
    ? kennels.filter((kennel) =>
        kennel.kennel_number.toString().includes(searchQuery)
      )
    : kennels;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Kennel Status Overview</h2>

      {/* Search bar to find specific kennels */}
      <div className="mb-4">
        <input
          type="text"
          className="p-2 border rounded-md w-full"
          placeholder="Search by kennel number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
        {filteredKennels.map((kennel) => (
          <Tooltip
            key={kennel.id}
            title={`Kennel ${kennel.kennel_number}: ${kennel.status}`}
            placement="top" // Tooltip with additional information
            arrow
          >
            <div
              onClick={() => openModal(kennel)}
              className={`p-4 text-center rounded-md transition-colors cursor-pointer ${
                kennel.status === "available"
                  ? "bg-green-500 text-white"
                  : kennel.status === "reserved"
                  ? "bg-yellow-500 text-white"
                  : "bg-red-500 text-white"
              }`}
              style={{
                transition: "background-color 0.3s ease", // Smooth transition for background color
              }}
            >
              Kennel {kennel.kennel_number}
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Status legend */}
      <div className="mt-4">
        <div className="flex gap-4">
          <div className="flex items-center">
            <span className="block w-4 h-4 bg-green-500 mr-2"></span> Available
          </div>
          <div className="flex items-center">
            <span className="block w-4 h-4 bg-yellow-500 mr-2"></span> Reserved
          </div>
          <div className="flex items-center">
            <span className="block w-4 h-4 bg-red-500 mr-2"></span> Occupied
          </div>
        </div>
      </div>

      {isCustomerDetailDialogOpen && (
        <CustomerDetailDialog
          customer={selectedCustomerKennel}
          isOpen={isCustomerDetailDialogOpen}
          onClose={() => setIsCustomerDetailDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default KennelGrid;
