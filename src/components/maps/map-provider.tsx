"use client";

import dynamic from "next/dynamic";

export const DynamicFarmMap = dynamic(() => import("./farm-map"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-muted rounded-md animate-pulse" />,
});
