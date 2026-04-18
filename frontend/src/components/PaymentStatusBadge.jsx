import React from 'react';

const PaymentStatusBadge = ({ status }) => {
  const config = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Paid' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Failed' },
    cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Cancelled' }
  };

  const { bg, text, label } = config[status] || config.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {label}
    </span>
  );
};

export default PaymentStatusBadge;
