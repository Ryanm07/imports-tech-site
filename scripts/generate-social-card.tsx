import React from "react";
import { ImageResponse } from "next/og";
import { writeFile } from "node:fs/promises";

// Static PNG shared by Next and Vinext. No remote assets or runtime image API.
const response = new ImageResponse(
  (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#07111f",
        color: "#f3f5f7",
        padding: "64px 76px",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30 }}
      >
        <div style={{ width: 12, height: 32, background: "#ffbe24" }} />
        IMPORTS TECH
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 80 }}>
        <div style={{ fontSize: 86, letterSpacing: "-4px", lineHeight: 1.05 }}>
          Entre no estúdio.
        </div>
        <div style={{ fontSize: 30, color: "#afbac9", marginTop: 28 }}>
          Equipamentos, bastidores e histórias.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid #27384a",
          marginTop: "auto",
          paddingTop: 26,
          fontSize: 22,
        }}
      >
        <div style={{ color: "#afbac9" }}>Um espaço para explorar em 3D</div>
        <div style={{ color: "#ffbe24" }}>Olhe ao redor. Descubra.</div>
      </div>
    </div>
  ),
  { width: 1200, height: 630 },
);
await writeFile(
  new URL("../public/og-studio.png", import.meta.url),
  Buffer.from(await response.arrayBuffer()),
);
