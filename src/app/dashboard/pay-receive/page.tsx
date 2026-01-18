
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Store,
  Users,
  FileText,
  Clock,
  User,
  QrCode,
  Link as LinkIcon,
  HandCoins,
  PiggyBank,
  ArrowRightLeft
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const payOptions = [
    { icon: Store, title: "Payer un Marchand", description: "Scanner un QR code en boutique (CDF par défaut).", href: "/dashboard/scanner", color: "text-blue-500", bgColor: "bg-blue-50" },
    { icon: User, title: "Payer un Ami", description: "Via numéro de téléphone ou contact (CDF par défaut).", href: "/dashboard/send", color: "text-green-500", bgColor: "bg-green-50" },
    { icon: FileText, title: "Paiement de Factures", description: "Yango, Canal+, Regideso... (Choix de devise disponible).", href: "#", color: "text-yellow-500", bgColor: "bg-yellow-50" },
    { icon: Users, title: "Paiement en Masse", description: "Envoyez à plusieurs contacts à la fois (CDF par défaut).", href: "#", color: "text-purple-500", bgColor: "bg-purple-50" },
    { icon: Clock, title: "Paiement Programmé", description: "Planifiez vos transferts futurs (CDF par défaut).", href: "#", color: "text-red-500", bgColor: "bg-red-50" },
];

const receiveOptions = [
    { icon: QrCode, title: "Mon QR Code", description: "Partagez pour recevoir de l'argent.", href: "#", color: "text-green-500", bgColor: "bg-green-50" },
    { icon: LinkIcon, title: "Lien de Paiement", description: "Générez un lien avec un montant.", href: "#", color: "text-blue-500", bgColor: "bg-blue-50" },
    { icon: HandCoins, title: "Demander un Paiement", description: "Envoyez une requête à un contact.", href: "#", color: "text-orange-500", bgColor: "bg-orange-50" },
    { icon: PiggyBank, title: "Créer une Cagnotte", description: "Collectez des fonds pour un projet.", href: "#", color: "text-indigo-500", bgColor: "bg-indigo-50" },
];

const OptionCard = ({ icon: Icon, title, description, href, color, bgColor }: (typeof payOptions)[0]) => (
    <Link href={href} className="block hover:scale-[1.02] transition-transform duration-200">
        <Card className="h-full">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-3 rounded-lg", bgColor)}>
                    <Icon className={cn("h-6 w-6", color)} />
                </div>
                <div>
                    <p className="font-headline font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    </Link>
)

export default function PayReceivePage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/mbongo-dashboard">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-xl font-bold text-primary">Payer & Recevoir</h1>
        </div>
      </header>

      {/* Payer Section */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Payer</CardTitle>
          <CardDescription>Effectuez des paiements de manière simple et sécurisée. La devise principale est le CDF, mais vous pouvez choisir d'autres devises lors du paiement.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {payOptions.map((opt) => <OptionCard key={opt.title} {...opt} />)}
        </CardContent>
      </Card>

      {/* Recevoir Section */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Recevoir</CardTitle>
          <CardDescription>Plusieurs options pour recevoir de l'argent facilement.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {receiveOptions.map((opt) => <OptionCard key={opt.title} {...opt} />)}
        </CardContent>
      </Card>
    </div>
  );
}
