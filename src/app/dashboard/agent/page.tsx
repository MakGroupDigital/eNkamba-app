
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { Button } from '@/components/ui/button';

export default function AgentPage() {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <UserPlus className="h-6 w-6 text-primary" />
            Devenir Agent Mbongo.io
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Rejoignez notre réseau d'agents et commencez à gagner des commissions en aidant les autres à effectuer leurs dépôts et retraits.</p>
          <Button>Demander un compte agent</Button>
        </CardContent>
      </Card>
    </div>
  );
}
