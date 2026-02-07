"use client";

import { useEffect, useRef } from "react";

interface AdUnitProps {
  /**
   * The AdSense ad slot ID (found in AdSense dashboard after creating an ad unit)
   * Format: "1234567890"
   */
  slot: string;

  /**
   * Ad format - use "auto" for responsive ads (recommended)
   */
  format?: "auto" | "rectangle" | "horizontal" | "vertical";

  /**
   * Whether to show the "Advertisement" label above the ad
   */
  showLabel?: boolean;

  /**
   * Responsive ad behavior - "true" makes ads resize based on container
   */
  responsive?: boolean;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Google AdSense ad unit component styled to match the dark coffee theme.
 *
 * Usage:
 * 1. Get your AdSense publisher ID from AdSense dashboard
 * 2. Add it to .env.local as NEXT_PUBLIC_ADSENSE_PUBLISHER_ID
 * 3. Create ad units in AdSense dashboard and copy their slot IDs
 * 4. Use this component: <AdUnit slot="1234567890" />
 *
 * Note: Ads will only show after:
 * - AdSense account is approved
 * - Site is added to AdSense
 * - Ad units are created in dashboard
 * - Code is deployed to production domain
 */
export default function AdUnit({
  slot,
  format = "auto",
  showLabel = true,
  responsive = true,
  className = "",
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Only load ads if we have a publisher ID configured
    const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

    if (!publisherId) {
      console.warn("AdSense publisher ID not configured. Set NEXT_PUBLIC_ADSENSE_PUBLISHER_ID in .env.local");
      return;
    }

    try {
      // Push ad to AdSense queue (window.adsbygoogle is initialized by the script in layout.tsx)
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  // If no publisher ID is set, show a placeholder in development
  if (!publisherId) {
    return (
      <div className={`bg-coffee-dark border border-coffee-medium rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <p className="text-cream-dark text-sm opacity-50">
            Advertisement Placeholder
          </p>
          <p className="text-cream-dark text-xs mt-2 opacity-30">
            Configure NEXT_PUBLIC_ADSENSE_PUBLISHER_ID to enable ads
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-coffee-dark border border-coffee-medium rounded-xl p-4 ${className}`}>
      {showLabel && (
        <div className="text-cream-dark text-xs mb-3 text-center opacity-40 uppercase tracking-wider">
          Advertisement
        </div>
      )}

      <div className="flex items-center justify-center min-h-[100px]">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", textAlign: "center" }}
          data-ad-client={publisherId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      </div>
    </div>
  );
}
