import React from "react";

export const Preview: React.FC<{ html: string }> = ({ html }) => {
  return (
    <iframe
      style={{ width: '100%', height: '100%', border: 'none' }} // Adjust styles as needed
      srcDoc={html}
      title="HTML Preview"
    />
  );
};
