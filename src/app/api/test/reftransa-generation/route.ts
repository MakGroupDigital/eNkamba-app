import { NextRequest, NextResponse } from 'next/server';
import { generateRefTransa, clearRefTransaCache } from '@/lib/wonyapay';

/**
 * GET /api/test/reftransa-generation
 * Teste la génération de RefTransa et vérifie l'unicité
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
    
    const refTransas: string[] = [];
    const duplicates: string[] = [];
    const generation_times: number[] = [];
    
    // Générer plusieurs RefTransa et mesurer les performances
    for (let i = 0; i < Math.min(count, 100); i++) {
      const start = performance.now();
      const refTransa = generateRefTransa(prefix);
      const end = performance.now();
      
      generation_times.push(end - start);
      
      if (refTransas.includes(refTransa)) {
        duplicates.push(refTransa);
      }
      
      refTransas.push(refTransa);
    }
    
    // Analyser les résultats
    const uniqueCount = new Set(refTransas).size;
    const duplicateCount = refTransas.length - uniqueCount;
    const avgGenerationTime = generation_times.reduce((a, b) => a + b, 0) / generation_times.length;
    
    // Analyser les patterns
    const prefixes = refTransas.map(ref => ref.substring(0, 3));
    const prefixCounts = prefixes.reduce((acc, prefix) => {
      acc[prefix] = (acc[prefix] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      success: true,
      test_info: {
        requested_count: count,
        generated_count: refTransas.length,
        unique_count: uniqueCount,
        duplicate_count: duplicateCount,
        uniqueness_rate: `${((uniqueCount / refTransas.length) * 100).toFixed(2)}%`,
        avg_generation_time_ms: parseFloat(avgGenerationTime.toFixed(4)),
        environment: process.env.NODE_ENV || 'development'
      },
      samples: {
        first_5: refTransas.slice(0, 5),
        last_5: refTransas.slice(-5),
        ...(duplicates.length > 0 && { duplicates: duplicates.slice(0, 5) })
      },
      analysis: {
        prefix_distribution: prefixCounts,
        length_check: {
          all_20_chars: refTransas.every(ref => ref.length === 20),
          lengths: [...new Set(refTransas.map(ref => ref.length))],
        },
        character_check: {
          all_alphanumeric: refTransas.every(ref => /^[A-Z0-9]+$/.test(ref)),
          invalid_chars: refTransas.filter(ref => !/^[A-Z0-9]+$/.test(ref))
        }
      },
      performance: {
        min_time_ms: Math.min(...generation_times),
        max_time_ms: Math.max(...generation_times),
        total_time_ms: generation_times.reduce((a, b) => a + b, 0)
      }
    });
    
  } catch (error) {
    console.error('Erreur test RefTransa:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors du test de génération RefTransa',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test/reftransa-generation
 * Teste la génération avec des paramètres spécifiques
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      count = 10, 
      prefix, 
      clearCache = false,
      testDuplicates = false 
    } = body;
    
    if (clearCache) {
      clearRefTransaCache();
    }
    
    const results: Array<{
      refTransa: string;
      generationTime: number;
      attempt: number;
    }> = [];
    
    // Test de génération avec timing
    for (let i = 0; i < Math.min(count, 50); i++) {
      const start = performance.now();
      const refTransa = generateRefTransa(prefix);
      const end = performance.now();
      
      results.push({
        refTransa,
        generationTime: end - start,
        attempt: i + 1
      });
      
      // Si test de doublons, attendre un peu entre les générations
      if (testDuplicates && i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    // Analyser les doublons
    const refTransas = results.map(r => r.refTransa);
    const uniqueRefTransas = [...new Set(refTransas)];
    const duplicates = refTransas.filter((ref, index) => 
      refTransas.indexOf(ref) !== index
    );
    
    return NextResponse.json({
      success: true,
      test_config: {
        count,
        prefix: prefix || 'auto',
        clearCache,
        testDuplicates,
        environment: process.env.NODE_ENV || 'development'
      },
      results: {
        generated: results.length,
        unique: uniqueRefTransas.length,
        duplicates: duplicates.length,
        uniqueness_rate: `${((uniqueRefTransas.length / results.length) * 100).toFixed(2)}%`
      },
      samples: {
        all_generated: results.map(r => ({
          refTransa: r.refTransa,
          time_ms: parseFloat(r.generationTime.toFixed(4))
        })),
        duplicates: duplicates.length > 0 ? duplicates : null
      },
      performance: {
        avg_time_ms: parseFloat((results.reduce((sum, r) => sum + r.generationTime, 0) / results.length).toFixed(4)),
        min_time_ms: Math.min(...results.map(r => r.generationTime)),
        max_time_ms: Math.max(...results.map(r => r.generationTime))
      }
    });
    
  } catch (error) {
    console.error('Erreur test RefTransa POST:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors du test de génération RefTransa',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}