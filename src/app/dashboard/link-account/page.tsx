'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Smartphone, Landmark, ArrowRight, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function LinkAccountPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-2">
        <Link2 className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold text-primary">
          Lier un Compte Externe
        </h1>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Connectez vos comptes</CardTitle>
          <CardDescription>Facilitez vos dépôts et retraits en liant vos comptes bancaires ou mobile money de manière sécurisée.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Link href="#" className="block">
                 <Card className="hover:border-primary hover:shadow-lg transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                             <Smartphone className="h-8 w-8 text-primary"/>
                        </div>
                        <div className="flex-1">
                            <p className="font-headline font-semibold">Lier un compte Mobile Money</p>
                            <p className="text-xs text-muted-foreground">Connectez votre compte Airtel, M-Pesa, Orange, etc.</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground"/>
                    </CardContent>
                </Card>
            </Link>
             <Link href="#" className="block">
                 <Card className="hover:border-primary hover:shadow-lg transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                             <Landmark className="h-8 w-8 text-primary"/>
                        </div>
                        <div className="flex-1">
                            <p className="font-headline font-semibold">Lier un compte Bancaire</p>
                            <p className="text-xs text-muted-foreground">Connectez votre compte en banque local ou international.</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground"/>
                    </CardContent>
                </Card>
            </Link>
        </CardContent>
      </Card>

       <Alert variant="default" className="border-accent">
            <Info className="h-4 w-4 text-accent" />
            <AlertTitle className="font-headline text-accent">Sécurité et Confiance</AlertTitle>
            <AlertDescription>
                Mbongo.io utilise un cryptage de pointe pour protéger vos informations. La liaison de compte est sécurisée et vous permet de gérer vos fonds plus facilement.
            </AlertDescription>
        </Alert>
    </div>
  );
}
