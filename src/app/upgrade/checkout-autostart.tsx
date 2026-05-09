"use client";

import { useEffect, useRef } from "react";

export function CheckoutAutostart({ plan }: { plan?: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!plan) return;
    formRef.current?.requestSubmit();
  }, [plan]);

  if (!plan) return null;

  return (
    <form ref={formRef} action="/api/billing/create-checkout-session" method="post" className="hidden">
      <input type="hidden" name="plan" value={plan} />
    </form>
  );
}
