import { jsonResponse, plans, preflight, type Plan } from "../_shared/common.ts";

Deno.serve(async (request: Request) => {
  const earlyResponse = preflight(request);
  if (earlyResponse) return earlyResponse;

  try {
    const { plan } = await request.json();
    if (typeof plan !== "string" || !Object.hasOwn(plans, plan)) {
      return jsonResponse({ error: "Choose a valid publishing plan." }, 400, request);
    }

    const exchangeResponse = await fetch("https://open.er-api.com/v6/latest/USD");
    const exchangeData = await exchangeResponse.json();
    const exchangeRate = Number(exchangeData?.rates?.KES);
    if (!exchangeResponse.ok || exchangeData?.result !== "success" || !Number.isFinite(exchangeRate)) {
      throw new Error("The current USD/KES exchange rate is unavailable.");
    }

    const amountUsd = plans[plan as Plan].amountUsd;
    const amountKes = Math.round(amountUsd * exchangeRate);
    return jsonResponse({ amountUsd, amountKes, exchangeRate }, 200, request);
  } catch (error) {
    console.error("Could not quote M-Pesa amount:", error);
    const message = error instanceof Error ? error.message : "Could not calculate the M-Pesa price.";
    return jsonResponse({ error: message }, 502, request);
  }
});
