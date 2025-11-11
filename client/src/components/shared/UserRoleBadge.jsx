import React from "react";

const UserRoleBadge = ({ role, small }) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold uppercase tracking-wide rounded-full";
  const sizeStyles = small ? "text-[10px] px-2 py-0.5 leading-none" : "text-xs px-3 py-1";
  
  const badgeStyles = {
    Regular: `${baseStyles} ${sizeStyles} bg-gray-100 text-gray-600`,
    Premium: `${baseStyles} ${sizeStyles} bg-yellow-100 text-yellow-800`,
    Ultimate: `${baseStyles} ${sizeStyles} relative overflow-hidden
      bg-gradient-to-r from-purple-700 via-purple-500 to-purple-700
      text-white animate-pulse-gradient
      before:absolute before:inset-0 
      before:bg-gradient-to-r before:from-transparent before:via-purple-300/20 before:to-transparent
      before:animate-wave`
  };

  return (
    <span 
      className={badgeStyles[role] || badgeStyles.Regular}
      data-role={role}
    >
      {role}
    </span>
  );
};

export default UserRoleBadge;