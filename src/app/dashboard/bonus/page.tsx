'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { BadgePercent, Gift, Zap } from "lucide-react";

const bonuses = [
    {
        title: "Bonus de Bienvenue",
        description: "Terminez la vérification de votre compte et recevez 5 USD pour votre premier dépôt.",
        status: "Réclamé",
        icon: Gift,
        claimed: true,
    },
    {
        title: "Bonus de Transaction",
        description: "Effectuez 10 transactions ce mois-ci et recevez 2% de cashback.",
        status: "Actif",
        icon: Zap,
        claimed: false,
    }
]

export default function BonusPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-6 animate-in fade-in duration-500">
       <header className="flex items-center gap-2">
        <BadgePercent className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold text-primary">
          Mes Bonus et Récompenses
        </h1>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Bonus Disponibles</CardTitle>
          <CardDescription>Profitez des avantages exclusifs de l'écosystème eNkamba.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bonuses.map((bonus, index) => {
              const Icon = bonus.icon;
              return (
                 <Card key={index} className={`overflow-hidden ${bonus.claimed ? 'bg-muted/50' : 'bg-card'}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                       <div className={`p-3 rounded-lg ${bonus.claimed ? 'bg-muted' : 'bg-primary/10'}`}>
                            <Icon className={`h-6 w-6 ${bonus.claimed ? 'text-muted-foreground' : 'text-primary'}`}/>
                       </div>
                       <div className="flex-1">
                           <p className={`font-headline font-semibold ${bonus.claimed ? 'text-muted-foreground' : 'text-foreground'}`}>{bonus.title}</p>
                           <p className="text-xs text-muted-foreground">{bonus.description}</p>
                       </div>
                    </CardContent>
                    <CardFooter className={`p-2 bg-muted/50 text-xs font-medium justify-end ${bonus.claimed ? 'text-green-600' : 'text-blue-600'}`}>
                       {bonus.status}
                    </CardFooter>
                 </Card>
              )
          })}
        </CardContent>
      </Card>
    </div>
  );
}
