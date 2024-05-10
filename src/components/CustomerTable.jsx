import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import ReservationFilter from "./ReservationFilter"; // For search and filter functionalities

const CustomerTable = ({ onViewCustomer }) => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);

  const fetchCustomers = async () => {
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select(
        "id, customer_name, customer_phone, kennel_ids, start_date, end_date"
      );

    if (error) {
      console.error("Error fetching customers:", error.message);
    } else {
      // Fetch additional data from pet_information
      const enhancedReservations = await Promise.all(
        reservations.map(async (reservation) => {
          const { data: petInfo, error: petError } = await supabase
            .from("pet_information")
            .select("pet_name, breed")
            .eq("kennel_id", reservation.kennel_ids[0]) // Assuming a single kennel per reservation
            .single();

          if (petError) {
            console.error("Error fetching pet information:", petError.message);
          }

          const { data: kennels } = await supabase
            .from("kennels")
            .select("kennel_number")
            .in("id", reservation.kennel_ids || []); // Fetch kennel numbers

          return {
            ...reservation,
            kennel_numbers: kennels.map((k) => k.kennel_number), // Extract kennel numbers
            pet_name: petInfo?.pet_name || "Unknown", // Extract pet name
            breed: petInfo?.breed || "Unknown", // Extract breed name
          };
        })
      );

      setCustomers(enhancedReservations);
      setFilteredCustomers(enhancedReservations);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase();
    setFilteredCustomers(
      customers.filter(
        (customer) =>
          customer.customer_name.toLowerCase().includes(lowerQuery) ||
          customer.pet_name.toLowerCase().includes(lowerQuery) ||
          customer.breed.toLowerCase().includes(lowerQuery)
      )
    );
  };

  // Handle date filtering
  useEffect(() => {
    if (filterStartDate && filterEndDate) {
      setFilteredCustomers(
        customers.filter(
          (customer) =>
            new Date(customer.start_date) >= filterStartDate &&
            new Date(customer.end_date) <= filterEndDate
        )
      );
    } else {
      setFilteredCustomers(customers); // Reset if no filter is applied
    }
  }, [filterStartDate, filterEndDate, customers]);

  useEffect(() => {
    fetchCustomers(); // Fetch on component mount
  }, []);

  return (
    <div>
      <ReservationFilter
        searchQuery={searchQuery}
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        onSearchChange={handleSearch}
        onFilterStartDateChange={setFilterStartDate}
        onFilterEndDateChange={setFilterEndDate}
      />

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-3 text-left border">Customer Name</th>
            <th className="p-3 text-left border">Phone</th>
            <th className="p-3 text-left border">Kennel Number(s)</th>
            <th className="p-3 text-left border">Start Date</th>
            <th className="p-3 text-left border">End Date</th>
            <th className="p-3 text-left border">Pet Name</th>
            <th className="p-3 text-left border">Breed</th>
            <th className="p-3 text-left border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-100">
              <td className="p-3 border">{customer.customer_name}</td>
              <td className="p-3 border">{customer.customer_phone}</td>
              <td className="p-3 border">
                {customer.kennel_numbers.join(", ")}
              </td>
              <td className="p-3 border">
                {new Date(customer.start_date).toLocaleDateString()}
              </td>
              <td className="p-3 border">
                {new Date(customer.end_date).toLocaleDateString()}
              </td>
              <td className="p-3 border">{customer.pet_name}</td>
              <td className="p-3 border">{customer.breed}</td>
              <td className="p-3 border">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                  onClick={() => onViewCustomer(customer)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
