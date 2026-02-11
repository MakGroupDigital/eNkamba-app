'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileIcon, X, AlertCircle } from 'lucide-react';

interface FileMessageProps {
  fileName: string;
  fileType: string;
  fileData: string;
  fileSize?: number;
  senderName?: string;
  timestamp?: Date;
}

export function FileMessage({
  fileName,
  fileType,
  fileData,
  fileSize,
  senderName,
  timestamp,
}: FileMessageProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Déterminer le type de fichier
  const isImage = fileType.startsWith('image/');
  const isPDF = fileType === 'application/pdf';
  const isText = fileType.startsWith('text/');
  const isVideo = fileType.startsWith('video/');
  const isAudio = fileType.startsWith('audio/');

  // Obtenir l'extension du fichier
  const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'FILE';

  // Formater la taille du fichier
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Télécharger le fichier
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = `data:${fileType};base64,${fileData}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  // Obtenir la couleur de l'icône selon le type
  const getIconColor = () => {
    if (isImage) return 'text-blue-600';
    if (isPDF) return 'text-red-600';
    if (isText) return 'text-gray-600';
    if (isVideo) return 'text-purple-600';
    if (isAudio) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <>
      <Card className="w-full max-w-sm overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-primary/20">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-primary via-primary to-green-700 text-white p-3 flex items-center gap-2">
          <FileIcon className="h-5 w-5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">Fichier partagé</p>
            {senderName && <p className="text-xs opacity-90">par {senderName}</p>}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4 space-y-3">
          {/* Icône et nom du fichier */}
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-white border-2 border-primary/20 flex items-center justify-center ${getIconColor()}`}>
              <span className="text-xs font-bold text-center px-1">{fileExtension}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{fileName}</p>
              <p className="text-xs text-gray-600 mt-1">{formatFileSize(fileSize)}</p>
            </div>
          </div>

          {/* Aperçu pour les images */}
          {isImage && showPreview && !previewError && (
            <div className="relative w-full bg-black rounded-lg overflow-hidden">
              <img
                src={`data:${fileType};base64,${fileData}`}
                alt={fileName}
                className="w-full h-auto max-h-64 object-contain"
                onError={() => setPreviewError(true)}
              />
            </div>
          )}

          {/* Aperçu pour les vidéos */}
          {isVideo && showPreview && !previewError && (
            <div className="relative w-full bg-black rounded-lg overflow-hidden">
              <video
                src={`data:${fileType};base64,${fileData}`}
                className="w-full h-auto max-h-64"
                controls
                onError={() => setPreviewError(true)}
              />
            </div>
          )}

          {/* Aperçu pour l'audio */}
          {isAudio && showPreview && !previewError && (
            <div className="w-full bg-white rounded-lg p-3 border border-primary/20">
              <audio
                src={`data:${fileType};base64,${fileData}`}
                className="w-full"
                controls
                onError={() => setPreviewError(true)}
              />
            </div>
          )}

          {/* Aperçu pour le texte */}
          {isText && showPreview && !previewError && (
            <div className="w-full bg-white rounded-lg p-3 border border-primary/20 max-h-48 overflow-y-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words font-mono">
                {atob(fileData).substring(0, 500)}
                {atob(fileData).length > 500 && '...'}
              </pre>
            </div>
          )}

          {/* Erreur d'aperçu */}
          {previewError && showPreview && (
            <div className="w-full bg-red-50 rounded-lg p-3 border border-red-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">Impossible d'afficher l'aperçu</p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2">
            {(isImage || isVideo || isAudio || isText) && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-2 border-primary text-primary hover:bg-primary/10"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Masquer' : 'Aperçu'}
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1 gap-2 bg-gradient-to-r from-primary to-green-700 hover:from-primary/90 hover:to-green-700/90 text-white"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
          </div>

          {/* Timestamp */}
          {timestamp && (
            <p className="text-xs text-gray-500 text-center">
              {new Date(timestamp).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </Card>
    </>
  );
}
