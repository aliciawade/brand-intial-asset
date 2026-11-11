import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import { brand } from "@/lib/brand";
import { ensureSeed } from "@/lib/seed";
import { safeLog } from "@/lib/text";
import { getViewer } from "@/lib/viewer";
import "./globals.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: { default: brand.schoolName, template: `%s · ${brand.schoolName}` },
  description: brand.tagline,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let viewer = null;
  let ready = true;
  try {
    await ensureSeed();
    viewer = await getViewer();
  } catch (error) {
    console.error(safeLog(error));
    ready = false;
  }

  const style = {
    "--ink": brand.colors.ink,
    "--muted": brand.colors.muted,
    "--paper": brand.colors.paper,
    "--panel": brand.colors.panel,
    "--line": brand.colors.line,
    "--accent": brand.colors.accent,
    "--accent-ink": brand.colors.accentInk,
  } as CSSProperties;

  return (
    <html lang="en">
      <body style={style}>
        <Shell viewer={viewer}>
          {ready ? children : <p className="alert">The campus is temporarily unavailable.</p>}
        </Shell>
      </body>
    </html>
  );
}
