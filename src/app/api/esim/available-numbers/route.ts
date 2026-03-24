import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/esim/available-numbers
 * Retourne une liste de numéros eSIM disponibles
 */
export async function GET(request: NextRequest) {
  try {
    // Générer des numéros disponibles (format: +243 07XX XXX XXX)
    const availableNumbers: string[] = [];
    
    // Générer 10 numéros aléatoires disponibles
    for (let i = 0; i < 10; i++) {
      const prefix = '0700'; // Préfixe pour eSIM-eNkamba
      const suffix = Math.floor(100000 + Math.random() * 900000); // 6 chiffres aléatoires
      const number = `+243 ${prefix} ${suffix.toString().slice(0, 3)} ${suffix.toString().slice(3)}`;
      availableNumbers.push(number);
    }

    return NextResponse.json({
      success: true,
      numbers: availableNumbers,
    });
  } catch (error: any) {
    console.error('Erreur récupération numéros:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des numéros' },
      { status: 500 }
    );
  }
}
