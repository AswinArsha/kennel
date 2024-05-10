import  { useState } from 'react';

import CustomerTable from './CustomerTable'; // Customer table component
import CustomerDetailDialog from './CustomerDetailDialog'; // Customer detail dialog

const CustomerManagement = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailOpen(true);
  };

  return (
    <div className="flex h-screen">
    
      <div className="flex-1 p-4">
        <CustomerTable onViewCustomer={handleViewCustomer} />
        
        {/* Customer detail modal */}
        <CustomerDetailDialog
          customer={selectedCustomer}
          isOpen={isCustomerDetailOpen}
          onClose={() => setIsCustomerDetailOpen(false)}
        />
      </div>
    </div>
  );
};

export default CustomerManagement;
