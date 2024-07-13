import React, { useState } from "react";
import CustomerTable from "./CustomerTable"; // Customer table component

const CustomerManagement = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailOpen(true);
  };

  return (
    <div className="flex flex-col">
      <div className="flex-1 p-4 ">
        <CustomerTable onViewCustomer={handleViewCustomer} />
      
      </div>
    </div>
  );
};

export default CustomerManagement;
