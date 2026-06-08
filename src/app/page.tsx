import type { Metadata } from "next";

import { ServerMaintenancePage } from "@/components/server-maintenance-page";

export const metadata: Metadata = {
  title: "Serveur inaccessible | eNkamba",
  description:
    "eNkamba rencontre actuellement un probleme serveur. Veuillez contacter le support client.",
};

export default function RootPage() {
  return <ServerMaintenancePage />;
}
