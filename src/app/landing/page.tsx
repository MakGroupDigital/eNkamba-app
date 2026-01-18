import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  PiggyBank,
  Landmark,
  Repeat,
  ShieldCheck,
  Lock,
  Building,
  Users,
  Wallet,
  Gift,
  CircleDollarSign,
  UserCheck,
  UserPlus,
  Group,
  CreditCard,
  QrCode,
  Smartphone,
  Server,
  Hash,
  Store,
  BadgePercent,
  Handshake,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';

const heroImage = PlaceHolderImages.find((img) => img.id === 'landing-hero');

const features = [
  {
    icon: Wallet,
    title: 'Portefeuille Électronique',
    description: 'Stockez, payez, envoyez et recevez de l’argent en toute simplicité.',
  },
  {
    icon: PiggyBank,
    title: 'Épargne & Crédit',
    description: 'Faites fructifier votre argent et financez vos projets avec nos solutions flexibles.',
  },
  {
    icon: Repeat,
    title: 'Change Multidevises',
    description: 'Convertissez vos devises au meilleur taux, instantanément.',
  },
];

const solutions = [
  {
    icon: Wallet,
    title: 'Wallet (Portefeuille Électronique)',
    purpose: 'Stocker de l’argent, payer, envoyer, recevoir et consulter votre solde.',
    usage: 'Alimentez votre wallet via carte bancaire, virement ou dépôt cash chez un agent. Envoyez de l’argent, payez vos factures ou retirez chez un point partenaire. Transactions sécurisées par mot de passe, 2FA et notifications instantanées.'
  },
  {
    icon: Gift,
    title: 'Bonus Parrainage',
    purpose: 'Recevoir des récompenses pour inviter des amis.',
    usage: 'Partagez votre code ou lien unique. Votre filleul s’inscrit avec ce code. Dès sa première transaction, vous recevez un bonus (argent, points ou réduction).'
  },
  {
    icon: PiggyBank,
    title: 'Épargne Quotidienne',
    purpose: 'Mettre de côté automatiquement de petites sommes chaque jour.',
    usage: 'Fixez un objectif et un montant quotidien. Le système prélève automatiquement et sécurise votre épargne. Votre argent peut générer des intérêts.'
  },
  {
    icon: Users,
    title: 'Ristourne en Groupe',
    purpose: 'Faire des économies collectives et recevoir la cagnotte à tour de rôle.',
    usage: 'Créez ou rejoignez un groupe, définissez montant et fréquence. Chaque membre cotise, un membre reçoit la cagnotte selon l’ordre ou tirage au sort.'
  },
  {
    icon: UserCheck,
    title: 'Crédit Individuel',
    purpose: 'Obtenir un prêt adapté à votre profil financier.',
    usage: 'L’IA analyse vos transactions pour évaluer votre solvabilité. Recevez un montant, un taux et une durée personnalisés directement dans votre wallet.'
  },
  {
    icon: Group,
    title: 'Micro-Crédit en Groupe',
    purpose: 'Prêt collectif où les membres se garantissent mutuellement.',
    usage: 'Formez un groupe avec objectif commun. Chaque membre est responsable du remboursement collectif. L’application envoie des alertes en cas de retard.'
  },
  {
    icon: BadgePercent,
    title: 'Bonus sur Transactions Mensuelles',
    purpose: 'Recevoir des récompenses selon vos paiements et transferts.',
    usage: 'Chaque transaction rapporte des points ou cashback. Bonus crédité en fin de mois dans votre wallet.'
  },
  {
    icon: CircleDollarSign,
    title: 'Conversion Multidevises',
    purpose: 'Convertir votre argent entre différentes devises (CDF, USD, EUR, RMB).',
    usage: 'Choisissez la devise source et cible. Consultez le taux en temps réel, confirmez et recevez votre argent converti.'
  },
  {
    icon: QrCode,
    title: 'Paiement par QR Code',
    purpose: 'Payer ou recevoir de l’argent sans contact.',
    usage: 'Recevoir : générez votre QR code unique. Envoyer : scannez le QR code du bénéficiaire et validez le paiement.'
  },
  {
    icon: Smartphone,
    title: 'Lier le Wallet à un Numéro de Téléphone',
    purpose: 'Simplifier les transferts et notifications.',
    usage: 'Associez votre numéro lors de l’inscription. Transférez de l’argent directement via le numéro, sans RIB.'
  },
  {
    icon: CreditCard,
    title: 'Carte Visa / Mastercard',
    purpose: 'Payer en ligne ou retirer au distributeur.',
    usage: 'Commandez votre carte via l’application. Débit direct depuis le wallet. Gérez plafonds et blocages dans l’app.'
  },
  {
    icon: Handshake,
    title: 'Compte Agent Relais',
    purpose: 'Dépôts et retraits cash pour les utilisateurs.',
    usage: 'L’agent utilise son interface dédiée. Commission automatique sur les transactions.'
  },
  {
    icon: Store,
    title: 'Compte Marchand avec QR Code',
    purpose: 'Recevoir des paiements professionnels facilement.',
    usage: 'Créez un compte marchand. Génération de QR code fixe pour vos ventes. Suivi des paiements et facturation via l’app.'
  },
  {
    icon: Hash,
    title: 'Module USSD (*211422#)',
    purpose: 'Accéder aux services même sans internet.',
    usage: 'Composez *211422# depuis n’importe quel téléphone. Suivez les instructions pour envoyer de l’argent, consulter votre solde, etc.'
  }
];


const testimonials = [
  {
    name: 'Marie L.',
    role: 'Commerçante à Kinshasa',
    quote: "Mbongo.io a transformé la gestion de ma tontine. C'est simple, sécurisé et tout le monde est payé à temps. Fini les carnets et les oublis !",
    avatar: 'https://picsum.photos/seed/avatar1/100/100',
  },
  {
    name: 'Jean-Pierre K.',
    role: 'Étudiant à Paris',
    quote: "Envoyer de l'argent à ma famille au pays n'a jamais été aussi facile et abordable. Les frais sont bas et le transfert est instantané. Je recommande vivement.",
    avatar: 'https://picsum.photos/seed/avatar2/100/100',
  },
  {
    name: 'Fatou D.',
    role: 'Entrepreneure à Lubumbashi',
    quote: "J'ai obtenu un petit crédit pour lancer mon activité grâce à Mbongo.io. Le processus était rapide et transparent. C'est un vrai coup de pouce pour les jeunes entrepreneurs.",
    avatar: 'https://picsum.photos/seed/avatar3/100/100',
  },
]

const partners = [
    { name: 'CRDB BANK', icon: Building },
    { name: 'Satelcom', icon: Users },
    { name: 'AliPay', icon: Building },
    { name: 'Micro Financé Bisous Bisous', icon: Users },
    { name: 'BCC', icon: Building },
]


export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
                <Link href="/login">Se Connecter</Link>
            </Button>
            <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                <Link href="/login">Commencer</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-primary/5">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16">
              <div className="flex flex-col justify-center space-y-4 animate-in fade-in slide-in-from-left-10 duration-1000">
                <div className="space-y-2">
                  <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                    Votre Avenir Financier, Simplifié.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Mbongo.io est votre portefeuille tout-en-un pour les transactions, l'épargne, le crédit et le change en RDC et pour la diaspora.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 transition-transform duration-300 hover:scale-105">
                    <Link href="/login">Ouvrir un compte gratuit</Link>
                  </Button>
                </div>
              </div>
              {heroImage && (
                <div className="animate-in fade-in slide-in-from-right-10 duration-1000">
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    width={600}
                    height={400}
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover shadow-2xl sm:w-full lg:order-last"
                    data-ai-hint={heroImage.imageHint}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-card py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-medium text-primary">Fonctionnalités Clés</div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl text-primary">
                  Une plateforme, toutes les solutions.
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Gérez tous vos besoins financiers depuis une seule application sécurisée et intuitive.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 sm:grid-cols-2 md:grid-cols-3">
              {features.map((feature, i) => (
                <div key={feature.title} className="fade-in-up" style={{ animationDelay: `${'i * 150'}ms` }}>
                  <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-xl h-full">
                    <CardHeader className="flex flex-col items-center text-center">
                      <div className="mb-4 rounded-full bg-primary/10 p-4">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="font-headline">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="w-full py-12 md:py-24 lg:py-32 bg-primary/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-medium text-primary">Nos Solutions</div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl text-primary">
                  Un écosystème financier à votre service.
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Découvrez comment chaque fonctionnalité est conçue pour simplifier votre vie financière au quotidien.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
              {solutions.map((solution, i) => (
                <div key={solution.title} className="fade-in-up" style={{ animationDelay: `${'i * 100'}ms` }}>
                  <Card className="h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-xl flex flex-col">
                    <CardHeader className="items-center text-center">
                      <div className="mb-4 rounded-full bg-primary/10 p-3">
                        <solution.icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="font-headline text-lg">{solution.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow text-center">
                      <p className="font-semibold text-primary">À quoi ça sert :</p>
                      <p className="text-muted-foreground text-sm mb-4">{solution.purpose}</p>
                      <p className="font-semibold text-primary">Comment l’utiliser :</p>
                      <p className="text-muted-foreground text-sm flex-grow">{solution.usage}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-medium text-primary">Ceux qui nous font confiance</div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl text-primary">
                  L'avis de nos utilisateurs
                </h2>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
              {testimonials.map((testimonial, i) => (
                 <div key={testimonial.name} className="fade-in-up" style={{ animationDelay: `${'i * 150'}ms` }}>
                  <Card className="h-full flex flex-col justify-between">
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                    </CardContent>
                    <CardHeader className="flex-row items-center gap-4">
                      <Image src={testimonial.avatar} alt={testimonial.name} width={48} height={48} className="rounded-full" />
                      <div>
                        <CardTitle className="text-base font-bold">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.role}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Security Section */}
        <section id="security" className="w-full py-12 md:py-24 lg:py-32 bg-primary/5">
          <div className="container grid items-center gap-12 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
             <div className="space-y-4">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-medium text-primary">Sécurité</div>
              <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary">
                Sécurité de niveau bancaire,
                <br />
                confiance assurée.
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Vos données et votre argent sont protégés par les technologies les plus avancées, incluant la connexion biométrique et le cryptage de bout en bout.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="fade-in-up" style={{ animationDelay: '100ms' }}>
                <Card className="flex-1 text-center p-6 h-full">
                  <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="mt-4 font-headline text-xl font-bold">Protection Avancée</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Transactions sécurisées et surveillance 24/7.</p>
                </Card>
              </div>
               <div className="fade-in-up" style={{ animationDelay: '250ms' }}>
                <Card className="flex-1 text-center p-6 h-full">
                  <Lock className="mx-auto h-12 w-12 text-accent" />
                  <h3 className="mt-4 font-headline text-xl font-bold">Connexion Biométrique</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Accès rapide et sécurisé avec votre empreinte.</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* API Section */}
        <section id="api" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center gap-12 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
            <div className="flex justify-center animate-in fade-in-up duration-1000">
                <Card className="p-8 bg-muted w-full max-w-md">
                    <Server className="h-16 w-16 text-primary mx-auto mb-4" />
                    <pre className="text-sm bg-card p-4 rounded-md overflow-x-auto"><code className="font-code text-primary-foreground">{`fetch('https://api.enkamba.io/v1/pay', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 5000,
    currency: 'CDF',
    recipient: '+243812345678'
  })
});`}</code></pre>
                </Card>
            </div>
            <div className="space-y-4 animate-in fade-in-up duration-1000" style={{ animationDelay: '200ms' }}>
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-medium text-primary">Pour les développeurs</div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary">
                Intégrez la puissance de Mbongo.io
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Nos solutions sont également dotées d'APIs robustes, conçues pour vous offrir la meilleure expérience de paiement dans vos boutiques en ligne, sites web, applications et autres plateformes.
                </p>
                <Button variant="outline" asChild>
                    <Link href="/docs">Consulter la documentation API</Link>
                </Button>
            </div>
          </div>
        </section>


        {/* Partners Section */}
         <section id="partners" className="w-full bg-card py-12 md:py-24 lg:py-32 border-t border-b">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="font-headline text-2xl font-bold tracking-tighter text-primary">Nos Partenaires et Clients de confiance</h2>
              <p className="max-w-[600px] text-muted-foreground">
                Nous collaborons avec des leaders de l'industrie pour vous offrir les meilleurs services.
              </p>
            </div>
            <div className="mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 py-12 items-center">
              {partners.map((partner, i) => (
                <div key={partner.name} className="flex justify-center items-center gap-2 text-muted-foreground hover:text-foreground transition-colors fade-in-up" style={{ animationDelay: `${'i * 100'}ms` }}>
                  <partner.icon className="h-6 w-6" />
                  <span className="font-semibold text-center">{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ecosystem & CTA Section */}
        <section id="ecosystem" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container text-center">
            <div className="bg-gradient-to-r from-primary to-green-800 rounded-2xl p-8 md:p-12 lg:p-16 text-primary-foreground shadow-2xl">
              <div className="space-y-4 max-w-2xl mx-auto">
                  <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Rejoignez l'écosystème eNkamba</h2>
                  <p className="md:text-lg">
                    Un seul compte vous donne accès à un monde de services digitaux innovants. N'attendez plus pour prendre votre avenir financier en main.
                  </p>
                   <div className="pt-4">
                     <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 transition-transform duration-300 hover:scale-105">
                        <Link href="/login">Créer mon compte maintenant</Link>
                      </Button>
                  </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-background">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <Logo />
           <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Mbongo.io. Tous droits réservés.</p>
          <p className="text-sm text-muted-foreground">Un produit de Global solution et services sarl.</p>
        </div>
      </footer>
    </div>
  );
}
