
import React from 'react';
import Image from 'next/image'; // Import Image component

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    // Removed mt-auto, text-center. Added flex justify-center.
    <footer className="flex justify-center border-t bg-background py-4 text-xs text-muted-foreground">
      <div className="flex flex-col items-center gap-1">
         {/* LiteOn Logo Image */}
          <Image
            src="/liteon_logo.png" // Use the uploaded logo
            alt="LiteOn Technology Logo"
            width={150} // Adjust width for the new logo
            height={50}  // Adjust height for the new logo
            priority // Load the logo faster
          />
        <p>
          © {currentYear} Liteon Technology (OPS Factory). All rights reserved.
        </p>
      </div>
    </footer>
  );
}
