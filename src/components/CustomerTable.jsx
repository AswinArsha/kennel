import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import CustomerFilter from "./CustomerFilter";

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
    const { data: historicalReservations, error } = await supabase
      .from("historical_reservations")
      .select(
        `
          id,
          customer_id,
          pet_name,
          pet_breed,
          start_date,
          end_date,
          status,
          created_at,
          kennel_ids,
          pickup,
          groom,
          drop,
          payment_mode
        `
      );

    if (error) {
      console.error("Error fetching customers:", error.message);
    } else {
      const customerIds = historicalReservations.map(
        (reservation) => reservation.customer_id
      );
      const { data: customersData, error: customerError } = await supabase
        .from("customers")
        .select("id, customer_name, customer_phone, customer_address")
        .in("id", customerIds);

      if (customerError) {
        console.error("Error fetching customers:", customerError.message);
        return;
      }

      // Fetch analytics data based on customer_id, pet_name, start_date, and end_date
      const { data: analyticsData, error: analyticsError } = await supabase
        .from("analytics")
        .select("customer_id, pet_name, start_date, end_date, days_stayed, total_bill")
        .in("customer_id", customerIds);

      if (analyticsError) {
        console.error("Error fetching analytics data:", analyticsError.message);
        return;
      }

      const enhancedReservations = historicalReservations.map((reservation) => {
        const customer = customersData.find(
          (c) => c.id === reservation.customer_id
        );
        const analytics = analyticsData.find(
          (a) =>
            a.customer_id === reservation.customer_id &&
            a.pet_name === reservation.pet_name &&
            new Date(a.start_date).toDateString() ===
              new Date(reservation.start_date).toDateString() &&
            new Date(a.end_date).toDateString() ===
              new Date(reservation.end_date).toDateString()
        );
        return {
          ...reservation,
          customer_name: customer.customer_name,
          customer_phone: customer.customer_phone,
          customer_address: customer.customer_address,
          days_stayed: analytics ? analytics.days_stayed : null,
          total_bill: analytics ? analytics.total_bill : null,
        };
      });

      // Sort reservations by created_at date
      enhancedReservations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setCustomers(enhancedReservations);
      setFilteredCustomers(enhancedReservations);
    }
  };

  const applyFilters = (query, startDate, endDate, status) => {
    let filtered = customers;

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.customer_name.toLowerCase().includes(lowerQuery) ||
          customer.pet_name.toLowerCase().includes(lowerQuery) ||
          customer.pet_breed.toLowerCase().includes(lowerQuery)
      );
    }

    if (startDate && endDate) {
      filtered = filtered.filter(
        (customer) =>
          new Date(customer.start_date) >= startDate &&
          new Date(customer.end_date) <= endDate.setHours(23, 59, 59, 999)
      );
    }

    if (status) {
      filtered = filtered.filter((customer) => customer.status === status);
    }

    setFilteredCustomers(filtered);
  };

  const handleSearch = (query, startDate, endDate, status) => {
    applyFilters(query, startDate, endDate, status);
  };

  const handleDateFilter = (query, startDate, endDate, status) => {
    applyFilters(query, startDate, endDate, status);
  };

  const handleStatusFilter = (query, startDate, endDate, status) => {
    applyFilters(query, startDate, endDate, status);
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
        <div className="max-h-[530px] overflow-y-auto">
          <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
            <thead className="bg-gray-50 sticky top-0 z-0">
              <tr>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  No.
                </th>
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
                  Days Stayed
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Total Bill 
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Payment Mode {/* Add payment mode header */}
                </th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer, index) => (
                <tr key={customer.id} className="bg-white hover:bg-gray-100">
                  <td className="whitespace-nowrap text-center px-4 py-2 font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="whitespace-nowrap text-center px-4 py-2 font-medium text-gray-900">
                    {customer.customer_name}
                  </td>
                  <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                    {customer.customer_phone}
                  </td>
                  <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                    {customer.customer_address}
                  </td>
                  <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                    {new Date(customer.start_date).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                    {new Date(customer.end_date).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                    {customer.pet_breed}
                  </td>
                  <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                    {customer.days_stayed !== null ? customer.days_stayed : "N/A"}
                  </td>
                  <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                    {customer.total_bill !== null ? customer.total_bill : "N/A"}
                  </td>
                  <td className="whitespace-nowrap text-center px-4 py-2 text-gray-700">
                    {customer.payment_mode ? customer.payment_mode : ""} {/* Show payment mode */}
                  </td>
                  <td className="whitespace-nowrap text-center px-4 py-2 text-gray-800">
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
    </div>
  );
};

export default CustomerTable;
