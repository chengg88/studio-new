
import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-background py-4 text-center text-xs text-muted-foreground">
      <p>
        © {currentYear} Liteon Technology (OPS Factory). All rights reserved.
      </p>
    </footer>
  );
}
