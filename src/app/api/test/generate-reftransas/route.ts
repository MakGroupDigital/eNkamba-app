import { NextRequest, NextResponse } from 'next/server';
import { generateRefTransa, clearRefTransaCache } from '@/lib/wonyapay';

/**
 * GET /api/test/generate-reftransas
 * Teste la génération de RefTransa pour vérifier l'unicité avec la nouvelle implémentation
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const count = parseInt(url.searchParams.get('count') || '10');
    const prefix = url.searchParams.get('prefix') || undefined;
    const clearCache = url.searchParams.get('clearCache') === 'true';
    
    if (clearCache) {
      clearRefTransaCache();
    }
    
    const refTransas = [];
    const generationTimes = [];
    
    // Générer les RefTransa avec mesure de performance
    for (let i = 0; i < Math.min(count, 50); i++) {
      const start = performance.now();
      const refTransa = generateRefTransa(prefix);
      const end = performance.now();
      
      const generationTime = end - start;
      generationTimes.push(generationTime);
      
      refTransas.push({
        index: i + 1,
        refTransa,
        timestamp: new Date().toISOString(),
        length: refTransa.length,
        generationTimeMs: parseFloat(generationTime.toFixed(4)),
        prefix: refTransa.substring(0, 3)
      });
      
      // Petit délai pour éviter les doublons temporels
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    
    // Analyser les résultats
    const refTransaValues = refTransas.map(r => r.refTransa);
    const unique = new Set(refTransaValues);
    const hasDuplicates = unique.size !== refTransas.length;
    const duplicates = refTransaValues.filter((ref, index) => 
      refTransaValues.indexOf(ref) !== index
    );
    
    // Analyser les préfixes
    const prefixes = refTransas.map(r => r.prefix);
    const prefixCounts = prefixes.reduce((acc, prefix) => {
      acc[prefix] = (acc[prefix] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      success: true,
      message: 'Génération de RefTransa testée avec nouvelle implémentation',
      config: {
        requested_count: count,
        prefix_used: prefix || 'auto',
        cache_cleared: clearCache,
        environment: process.env.NODE_ENV || 'development'
      },
      refTransas: refTransas.slice(0, 10), // Limiter l'affichage pour la lisibilité
      stats: {
        total_generated: refTransas.length,
        unique_count: unique.size,
        duplicate_count: refTransas.length - unique.size,
        hasDuplicates,
        duplicates: duplicates.length > 0 ? duplicates.slice(0, 5) : [],
        uniqueness_rate: `${((unique.size / refTransas.length) * 100).toFixed(2)}%`,
        allLength20: refTransas.every(r => r.length === 20),
        allAlphanumeric: refTransas.every(r => /^[A-Z0-9]{20}$/.test(r.refTransa))
      },
      performance: {
        avg_generation_time_ms: parseFloat((generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length).toFixed(4)),
        min_time_ms: Math.min(...generationTimes),
        max_time_ms: Math.max(...generationTimes),
        total_time_ms: generationTimes.reduce((a, b) => a + b, 0)
      },
      analysis: {
        prefix_distribution: prefixCounts,
        sample_first_3: refTransas.slice(0, 3).map(r => r.refTransa),
        sample_last_3: refTransas.slice(-3).map(r => r.refTransa)
      }
    });

  } catch (error) {
    console.error('Erreur test RefTransa:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la génération des RefTransa',
      details: (error as Error).message,
    }, { status: 500 });
  }
}