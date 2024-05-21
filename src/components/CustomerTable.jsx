import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import CustomerFilter from "./CustomerFilter";
import { FaCheck, FaTimes } from "react-icons/fa"; // Font Awesome icons for check and cross

const CustomerTable = ({
  onViewCustomer,
  onConfirm,
  onCancel,
  onEdit,
  onCheckout,
}) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  const fetchCustomers = async () => {
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select(
        "id, customer_name, customer_phone, customer_address, pet_name, pet_breed, start_date, end_date, status, created_at, kennel_ids, pickup, groom, drop"
      );

    if (error) {
      console.error("Error fetching customers:", error.message);
    } else {
      // Fetch additional data from pet_information and kennels
      const enhancedReservations = await Promise.all(
        reservations.map(async (reservation) => {
          const { data: kennels } = await supabase
            .from("kennels")
            .select("kennel_number")
            .in("id", reservation.kennel_ids || []);

          return {
            ...reservation,
            kennel_numbers: kennels.map((k) => k.kennel_number),
          };
        })
      );

      setCustomers(enhancedReservations);
      setFilteredCustomers(enhancedReservations);
    }
  };

  const handleSearch = (query) => {
    const lowerQuery = query.toLowerCase();
    const filtered = customers.filter(
      (customer) =>
        customer.customer_name.toLowerCase().includes(lowerQuery) ||
        customer.pet_name.toLowerCase().includes(lowerQuery) ||
        customer.pet_breed.toLowerCase().includes(lowerQuery)
    );
    setFilteredCustomers(filtered);
  };

  const handleDateFilter = (startDate, endDate, status) => {
    let filtered = customers;

    if (startDate && endDate) {
      filtered = filtered.filter(
        (customer) =>
          new Date(customer.start_date) >= startDate &&
          new Date(customer.end_date) <= endDate.setHours(23, 59, 59, 999) // Include end date
      );
    }

    if (status) {
      filtered = filtered.filter((customer) => customer.status === status);
    }

    setFilteredCustomers(filtered);
  };

  const handleStatusFilter = (startDate, endDate, status) => {
    handleDateFilter(startDate, endDate, status);
  };

  useEffect(() => {
    fetchCustomers(); // Fetch on component mount
  }, []);

  return (
    <div className="max-w-full mx-auto">
      <CustomerFilter
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onStatusFilter={handleStatusFilter}
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                Customer Name
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                Phone
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                Address
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                Check In
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                Check Out
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                Breed
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                Reservation Date
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="bg-white hover:bg-gray-100">
                <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  {customer.customer_name}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {customer.customer_phone}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {customer.customer_address}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {new Date(customer.start_date).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {new Date(customer.end_date).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {customer.pet_breed}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-800">
                  <span
                    className={`rounded py-1 px-3 text-xs font-bold ${
                      customer.status === "confirmed"
                        ? "bg-green-400"
                        : customer.status === "canceled"
                        ? "bg-red-400"
                        : customer.status === "checkout"
                        ? "bg-blue-400"
                        : "bg-yellow-400"
                    }`}
                  >
                    {customer.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerTable;
