import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";
import EnkambaLogo from "@/components/enkamba-logo";


export default function MakutanoPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <header className="absolute top-0 left-0 w-full p-4">
        <div className="container mx-auto flex justify-between items-center">
            <EnkambaLogo />
            <Button variant="ghost" asChild>
                <Link href="/ecosystem">{'<'} Retour à l'écosystème</Link>
            </Button>
        </div>
      </header>
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary">
            Bienvenue sur Makutano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-lg mb-6">
            Connectez-vous, partagez et grandissez avec votre communauté.
          </p>
          <div className="flex justify-center gap-4">
             <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/login">Rejoindre une Tontine</Link>
             </Button>
             <Button asChild variant="outline">
                <Link href="/login">Explorer les Communautés</Link>
             </Button>
          </div>
           <p className="text-sm text-muted-foreground mt-8">
            La plateforme sociale Makutano est en construction. Préparez-vous à vous connecter comme jamais auparavant.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
