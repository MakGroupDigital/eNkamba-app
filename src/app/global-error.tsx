'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f5f5 0%, #009058 100%)',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            {/* Icône */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #009058 0%, #009058 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              color: 'white'
            }}>
              ⚠️
            </div>

            {/* Titre */}
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: '16px'
            }}>
              Erreur Critique
            </h1>

            {/* Message */}
            <p style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Une erreur critique s'est produite dans l'application eNkamba. 
              Nous nous excusons pour la gêne occasionnée.
            </p>

            {/* Détails de l'erreur */}
            <div style={{
              background: '#fff3f3',
              border: '1px solid #ffcdd2',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#c62828',
                margin: '0',
                wordBreak: 'break-word'
              }}>
                <strong>Erreur:</strong> {error.message || 'Erreur inconnue'}
              </p>
              {error.digest && (
                <p style={{
                  fontSize: '12px',
                  color: '#e53935',
                  margin: '8px 0 0 0',
                  fontFamily: 'monospace'
                }}>
                  ID: {error.digest}
                </p>
              )}
            </div>

            {/* Boutons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexDirection: 'column'
            }}>
              <button
                onClick={reset}
                style={{
                  background: 'linear-gradient(135deg, #009058 0%, #009058 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  width: '100%'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                🔄 Réessayer
              </button>

              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  background: 'white',
                  color: '#009058',
                  border: '2px solid #009058',
                  borderRadius: '8px',
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#009058';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#009058';
                }}
              >
                🏠 Retour au tableau de bord
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '14px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ↻ Actualiser la page
              </button>
            </div>

            {/* Message d'aide */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: '#009058',
              borderRadius: '8px',
              border: '1px solid #009058'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#009058',
                margin: '0',
                lineHeight: '1.5'
              }}>
                💡 Si le problème persiste, veuillez contacter le support eNkamba 
                en mentionnant l'ID d'erreur ci-dessus.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
