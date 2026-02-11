import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface EStreamVideo {
  id: string;
  videoData?: string;
  url?: string;
  title: string;
  description?: string;
  creator: string;
  creatorId: string;
  creatorAvatar?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
  liked?: boolean;
}

export const useEStreamVideos = () => {
  const [videos, setVideos] = useState<EStreamVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const videosRef = collection(db, 'estream_videos');
      const q = query(
        videosRef,
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const videosData: EStreamVideo[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          videosData.push({
            id: doc.id,
            videoData: data.videoData,
            url: data.url,
            title: data.title,
            description: data.description,
            creator: data.creator,
            creatorId: data.creatorId,
            creatorAvatar: data.creatorAvatar,
            likes: data.likes || 0,
            comments: data.comments || 0,
            shares: data.shares || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            liked: false,
          });
        });
        setVideos(videosData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      setLoading(false);
    }
  }, []);

  return { videos, loading, error };
};
