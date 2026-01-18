import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Key, Terminal, ArrowRight } from "lucide-react";
import Logo from "@/components/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CodeBlock = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <pre className={`text-sm bg-card p-4 rounded-md overflow-x-auto border ${className}`}>
    <code className="font-code text-foreground">{children}</code>
  </pre>
);

export default function DocsPage() {
  const paymentRequestBody = `{
  "amount": 5000,
  "currency": "CDF",
  "recipient": "+243812345678",
  "description": "Paiement pour commande #123",
  "external_id": "YOUR_UNIQUE_ID_12345"
}`;

  const paymentResponseBody = `{
  "status": "success",
  "transaction_id": "txn_1a2b3c4d5e6f7g8h",
  "message": "Paiement initié avec succès."
}`;

  return (
    <div className="bg-background text-foreground min-h-screen">
       <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
          <Button variant="ghost" asChild>
          <Link href="/landing">{'<'} Retour à l'accueil</Link>
        </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl p-4 md:p-8 space-y-12">
        <section className="text-center animate-in fade-in duration-500">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                Documentation API Mbongo.io
            </h1>
            <p className="max-w-[600px] mx-auto mt-4 text-muted-foreground md:text-xl">
                Intégrez facilement nos services de paiement dans vos applications, sites web et plateformes.
            </p>
        </section>

        {/* Introduction & Auth */}
        <section className="space-y-6">
            <h2 className="font-headline text-3xl font-bold border-b pb-2 text-primary flex items-center gap-2">
                <Key className="w-6 h-6" />
                Authentification
            </h2>
            <Card>
                <CardHeader>
                    <CardTitle>Votre Clé d'API</CardTitle>
                    <CardDescription>
                        Toutes les requêtes API nécessitent une clé d'API. Vous pouvez générer et gérer vos clés depuis votre tableau de bord marchand.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">Votre clé d'API doit être incluse dans l'en-tête (header) de chaque requête, comme suit :</p>
                    <CodeBlock>
                        {'Authorization: Bearer VOTRE_CLE_API_SECRETE'}
                    </CodeBlock>
                    <p className="mt-4 text-sm text-destructive">
                        <span className="font-bold">Important :</span> Ne partagez jamais votre clé d'API secrète et ne l'exposez pas côté client (navigateur, application mobile).
                    </p>
                </CardContent>
            </Card>
        </section>

        {/* Endpoints */}
        <section className="space-y-6">
            <h2 className="font-headline text-3xl font-bold border-b pb-2 text-primary flex items-center gap-2">
                <Server className="w-6 h-6" />
                Endpoints de l'API
            </h2>

            {/* Create Payment */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                       <Badge variant="secondary" className="bg-green-100 text-green-800">POST</Badge>
                       <span>/v1/pay</span>
                    </CardTitle>
                    <CardDescription>
                        Initier un nouveau paiement vers un destinataire.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-headline font-semibold mb-2">Exemple de Requête (cURL)</h4>
                        <CodeBlock>
                            {`curl -X POST https://api.enkamba.io/v1/pay \\
-H "Authorization: Bearer VOTRE_CLE_API_SECRETE" \\
-H "Content-Type: application/json" \\
-d '${paymentRequestBody}'`}
                        </CodeBlock>
                    </div>
                    
                    <div>
                        <h4 className="font-headline font-semibold mb-2">Corps de la Requête (JSON)</h4>
                        <CodeBlock className="language-json">
                            {paymentRequestBody}
                        </CodeBlock>
                    </div>

                    <div>
                        <h4 className="font-headline font-semibold mb-2">Réponse en Cas de Succès (200 OK)</h4>
                        <CodeBlock className="language-json">
                            {paymentResponseBody}
                        </CodeBlock>
                    </div>
                </CardContent>
            </Card>
        </section>
        
        {/* Intégrations */}
        <section className="space-y-6">
            <h2 className="font-headline text-3xl font-bold border-b pb-2 text-primary flex items-center gap-2">
                <ArrowRight className="w-6 h-6" />
                Types d'Intégration
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>API REST (JSON)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">L'intégration standard pour la plupart des cas d'utilisation. Idéale pour les applications web et mobiles, elle offre une flexibilité maximale.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Webhooks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Recevez des notifications en temps réel sur l'état de vos transactions (ex: paiement confirmé, échec). Utile pour synchroniser votre base de données (PostgreSQL, MySQL, etc.).</p>
                    </CardContent>
                </Card>
            </div>
        </section>

      </main>

      <footer className="w-full border-t bg-background mt-12">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <Logo />
           <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Mbongo.io. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
