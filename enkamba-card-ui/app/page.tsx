import LeopardCard from '@/components/EnkambaCard';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-8">
      <LeopardCard 
        cardNumber="[ICI LE NUMERO DE CARTE]"
        cardSuffix="[SUFFIXE]"
        expiryDate="[MOIS/ANNEE]"
        cardHolderName="[ICI LE NOM DE L'UTILISATEUR]"
        qrCodeUrl="[ICI LE LIEN DU QR CODE]"
        backgroundImageUrl="https://images.unsplash.com/photo-1561731216-c3a4d99437d5?q=80&w=1000&auto=format&fit=crop"
      />
    </main>
  );
}
