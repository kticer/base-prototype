

import React from "react";

interface EmptyStateProps {
  title: string;
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
      <h2 className="text-lg font-medium">{title}</h2>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
};

export default EmptyState;