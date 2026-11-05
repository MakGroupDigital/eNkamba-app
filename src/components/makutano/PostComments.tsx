'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, limit, orderBy, query, runTransaction, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { Flag, Heart, Loader2, Reply, Send, Trash2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export type CommentActor = { uid: string; name: string; avatar: string } | null;

type Mention = { uid: string; name: string };

type PostComment = {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  parentId: string | null;
  mentions: Mention[];
  likes: number;
  likedByMe: boolean;
  createdAt: number;
  pending?: boolean;
};

const MAX_COMMENTS = 100;

function toMillis(value: any) {
  if (!value) return Date.now();
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return Date.now();
}

function timeAgo(ms: number) {
  const minutes = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} j`;
}

function renderWithMentions(text: string, mentions: Mention[], onOpenProfile?: (uid: string) => void): ReactNode {
  if (!mentions.length) return text;
  const names = mentions.map((mention) => mention.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length);
  const parts = text.split(new RegExp(`(@(?:${names.join('|')}))`, 'g'));
  return parts.map((part, index) => {
    const mention = part.startsWith('@') ? mentions.find((item) => `@${item.name}` === part) : undefined;
    if (!mention) return <Fragment key={index}>{part}</Fragment>;
    return (
      <button key={index} type="button" onClick={() => onOpenProfile?.(mention.uid)} className="font-bold text-[#073B9A] hover:underline">
        {part}
      </button>
    );
  });
}

// ENK-004: avatars, replies, reactions, @mentions, delete own / report others, optimistic with rollback.
export function PostComments({
  postId,
  postAuthor,
  actor,
  onCountChange,
  onOpenProfile,
}: {
  postId: string;
  postAuthor?: Mention;
  actor: CommentActor;
  onCountChange?: (delta: number) => void;
  onOpenProfile?: (uid: string) => void;
}) {
  const { toast } = useToast();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'makutano_posts', postId, 'comments'), orderBy('createdAt', 'desc'), limit(MAX_COMMENTS)));
      const loaded = snapshot.docs.map((commentDoc) => {
        const data = commentDoc.data() as any;
        return {
          id: commentDoc.id,
          text: data.text || '',
          authorId: data.authorId || '',
          authorName: data.author?.name || 'Utilisateur',
          authorAvatar: data.author?.avatar || '',
          parentId: data.parentId || null,
          mentions: Array.isArray(data.mentions) ? data.mentions.filter((item: any) => item?.uid && item?.name) : [],
          likes: Number(data.likes || 0),
          likedByMe: false,
          createdAt: toMillis(data.createdAt),
        } as PostComment;
      });

      if (actor?.uid && loaded.length) {
        const liked = await Promise.all(
          loaded.map((comment) => getDoc(doc(db, 'makutano_posts', postId, 'comments', comment.id, 'likes', actor.uid)).then((snap) => snap.exists()).catch(() => false))
        );
        loaded.forEach((comment, index) => { comment.likedByMe = liked[index]; });
      }
      setComments(loaded);
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
      toast({ variant: 'destructive', title: 'Commentaires indisponibles', description: 'Vérifiez votre connexion puis réessayez.' });
    } finally {
      setIsLoading(false);
    }
  }, [actor?.uid, postId, toast]);

  useEffect(() => { void load(); }, [load]);

  const threads = useMemo(() => {
    const topLevel = comments.filter((comment) => !comment.parentId || !comments.some((item) => item.id === comment.parentId))
      .sort((a, b) => b.createdAt - a.createdAt);
    const replies = (parentId: string) => comments.filter((comment) => comment.parentId === parentId).sort((a, b) => a.createdAt - b.createdAt);
    return topLevel.map((comment) => ({ comment, replies: replies(comment.id) }));
  }, [comments]);

  const participants = useMemo(() => {
    const byId = new Map<string, Mention>();
    if (postAuthor?.uid) byId.set(postAuthor.uid, postAuthor);
    comments.forEach((comment) => { if (comment.authorId) byId.set(comment.authorId, { uid: comment.authorId, name: comment.authorName }); });
    if (actor?.uid) byId.delete(actor.uid);
    return [...byId.values()];
  }, [actor?.uid, comments, postAuthor]);

  const mentionQuery = useMemo(() => {
    const match = text.match(/@([^\s@]{0,30})$/);
    return match ? match[1].toLocaleLowerCase('fr') : null;
  }, [text]);
  const mentionSuggestions = mentionQuery === null ? [] : participants.filter((item) => item.name.toLocaleLowerCase('fr').includes(mentionQuery)).slice(0, 5);

  const insertMention = (mention: Mention) => {
    setText((current) => current.replace(/@([^\s@]{0,30})$/, `@${mention.name} `));
    setMentions((current) => (current.some((item) => item.uid === mention.uid) ? current : [...current, mention]));
    inputRef.current?.focus();
  };

  const startReply = (comment: PostComment) => {
    setReplyTo(comment);
    if (comment.authorId && comment.authorId !== actor?.uid) {
      insertMention({ uid: comment.authorId, name: comment.authorName });
      setText(`@${comment.authorName} `);
    }
    inputRef.current?.focus();
  };

  const requireActor = () => {
    if (actor) return true;
    toast({ variant: 'destructive', title: 'Connexion requise', description: 'Connectez-vous pour interagir.' });
    return false;
  };

  const submit = async () => {
    const value = text.trim();
    if (!value || isSending || !requireActor() || !actor) return;
    const usedMentions = mentions.filter((mention) => value.includes(`@${mention.name}`));
    const parentId = replyTo ? replyTo.parentId || replyTo.id : null;
    const tempId = `pending-${Date.now()}`;
    const optimistic: PostComment = {
      id: tempId, text: value, authorId: actor.uid, authorName: actor.name, authorAvatar: actor.avatar,
      parentId, mentions: usedMentions, likes: 0, likedByMe: false, createdAt: Date.now(), pending: true,
    };

    setComments((current) => [optimistic, ...current]);
    setText(''); setMentions([]); setReplyTo(null); setIsSending(true);
    onCountChange?.(1);
    try {
      const ref = await addDoc(collection(db, 'makutano_posts', postId, 'comments'), {
        text: value,
        authorId: actor.uid,
        author: { name: actor.name, avatar: actor.avatar },
        parentId,
        mentions: usedMentions,
        likes: 0,
        createdAt: serverTimestamp(),
      });
      setComments((current) => current.map((comment) => (comment.id === tempId ? { ...comment, id: ref.id, pending: false } : comment)));
      updateDoc(doc(db, 'makutano_posts', postId), { comments: increment(1) }).catch(() => undefined);
      // ENK-004: notify each mentioned person once (never the author themself).
      const notified = new Set<string>([actor.uid]);
      usedMentions.forEach((mention) => {
        if (notified.has(mention.uid)) return;
        notified.add(mention.uid);
        addDoc(collection(db, 'users', mention.uid, 'notifications'), {
          type: 'makutano_mention',
          title: 'Vous avez été mentionné',
          message: `${actor.name} vous a mentionné dans un commentaire`,
          actionUrl: '/dashboard/makutano',
          read: false,
          senderId: actor.uid,
          senderName: actor.name,
          postId,
          commentId: ref.id,
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
        }).catch((error) => console.error('Notification de mention non envoyée:', error));
      });
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      setComments((current) => current.filter((comment) => comment.id !== tempId));
      setText(value);
      onCountChange?.(-1);
      toast({ variant: 'destructive', title: 'Commentaire non envoyé', description: 'Votre texte a été conservé, réessayez.' });
    } finally {
      setIsSending(false);
    }
  };

  const toggleLike = async (comment: PostComment) => {
    if (comment.pending || !requireActor() || !actor) return;
    const nextLiked = !comment.likedByMe;
    const patch = (liked: boolean, delta: number) => setComments((current) => current.map((item) => (
      item.id === comment.id ? { ...item, likedByMe: liked, likes: Math.max(0, item.likes + delta) } : item
    )));
    patch(nextLiked, nextLiked ? 1 : -1);
    try {
      const commentRef = doc(db, 'makutano_posts', postId, 'comments', comment.id);
      const likeRef = doc(commentRef, 'likes', actor.uid);
      await runTransaction(db, async (transaction) => {
        const existing = await transaction.get(likeRef);
        if (existing.exists() === nextLiked) return;
        if (nextLiked) transaction.set(likeRef, { userId: actor.uid, createdAt: serverTimestamp() });
        else transaction.delete(likeRef);
        transaction.update(commentRef, { likes: increment(nextLiked ? 1 : -1) });
      });
    } catch {
      patch(!nextLiked, nextLiked ? -1 : 1);
      toast({ variant: 'destructive', title: 'Action impossible', description: 'La réaction n’a pas été enregistrée.' });
    }
  };

  const remove = async (comment: PostComment) => {
    if (!actor || comment.authorId !== actor.uid || comment.pending) return;
    const removed = comments.filter((item) => item.id === comment.id || item.parentId === comment.id);
    setComments((current) => current.filter((item) => !removed.some((gone) => gone.id === item.id)));
    onCountChange?.(-removed.length);
    try {
      await Promise.all(removed.map((item) => deleteDoc(doc(db, 'makutano_posts', postId, 'comments', item.id))));
      updateDoc(doc(db, 'makutano_posts', postId), { comments: increment(-removed.length) }).catch(() => undefined);
    } catch {
      setComments((current) => [...removed, ...current]);
      onCountChange?.(removed.length);
      toast({ variant: 'destructive', title: 'Suppression impossible', description: 'Réessayez dans un instant.' });
    }
  };

  const report = async (comment: PostComment) => {
    if (!requireActor() || !actor) return;
    try {
      await addDoc(collection(db, 'makutano_reports'), {
        type: 'comment', postId, commentId: comment.id, authorId: comment.authorId, reporterId: actor.uid,
        reason: 'Signalement utilisateur', status: 'open', preview: comment.text.slice(0, 280), createdAt: serverTimestamp(),
      });
      toast({ title: 'Signalement envoyé', description: 'Notre équipe va examiner ce commentaire.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d’envoyer le signalement.' });
    }
  };

  const renderComment = (comment: PostComment, isReply = false) => (
    <div key={comment.id} className={cn('flex gap-2', isReply && 'ml-9', comment.pending && 'opacity-60')}>
      <button type="button" onClick={() => comment.authorId && onOpenProfile?.(comment.authorId)} aria-label={`Profil de ${comment.authorName}`} className="shrink-0">
        <Avatar className={isReply ? 'h-7 w-7' : 'h-8 w-8'}>
          <AvatarImage src={comment.authorAvatar} alt="" />
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-[#073B9A]">{comment.authorName.charAt(0)}</AvatarFallback>
        </Avatar>
      </button>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-[#DCE6F8]">
          <button type="button" onClick={() => comment.authorId && onOpenProfile?.(comment.authorId)} className="text-xs font-bold text-foreground hover:text-[#073B9A]">
            {comment.authorName}
          </button>
          <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">{renderWithMentions(comment.text, comment.mentions, onOpenProfile)}</p>
        </div>
        <div className="mt-1 flex items-center gap-3 px-2 text-[11px] font-semibold text-muted-foreground">
          <span>{comment.pending ? 'Envoi…' : timeAgo(comment.createdAt)}</span>
          <button type="button" onClick={() => void toggleLike(comment)} aria-pressed={comment.likedByMe} className={cn('flex min-h-8 items-center gap-1 hover:text-[#073B9A]', comment.likedByMe && 'text-[#F51B2B]')}>
            <Heart className={cn('h-3.5 w-3.5', comment.likedByMe && 'fill-current')} />
            {comment.likes > 0 ? comment.likes : "J'aime"}
          </button>
          <button type="button" onClick={() => startReply(comment)} className="flex min-h-8 items-center gap-1 hover:text-[#073B9A]">
            <Reply className="h-3.5 w-3.5" /> Répondre
          </button>
          {actor?.uid === comment.authorId ? (
            <button type="button" onClick={() => void remove(comment)} className="flex min-h-8 items-center gap-1 hover:text-red-600" aria-label="Supprimer mon commentaire">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button type="button" onClick={() => void report(comment)} className="flex min-h-8 items-center gap-1 hover:text-red-600" aria-label="Signaler ce commentaire">
              <Flag className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="border-t border-[#DCE6F8] bg-[#F8FAFF] p-3.5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commentaires</p>
      <div className="mb-3 max-h-80 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Chargement…</p>
        ) : threads.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun commentaire. Soyez le premier à réagir.</p>
        ) : (
          threads.map(({ comment, replies }) => (
            <div key={comment.id} className="space-y-2">
              {renderComment(comment)}
              {replies.map((reply) => renderComment(reply, true))}
            </div>
          ))
        )}
      </div>

      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-[#073B9A]">
          <span className="truncate">Réponse à {replyTo.authorName}</span>
          <button type="button" onClick={() => { setReplyTo(null); setText(''); setMentions([]); }} aria-label="Annuler la réponse" className="grid h-7 w-7 place-items-center">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="relative">
        {mentionSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-12 mb-2 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-[#DCE6F8]" role="listbox" aria-label="Mentionner">
            {mentionSuggestions.map((mention) => (
              <button key={mention.uid} type="button" role="option" aria-selected={false} onClick={() => insertMention(mention)} className="block w-full px-3 py-2 text-left text-xs font-semibold hover:bg-primary/5">
                @{mention.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={actor ? 'Ajouter un commentaire… (@ pour mentionner)' : 'Connectez-vous pour commenter'}
            aria-label="Votre commentaire"
            className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-[#073B9A] bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#073B9A]"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!text.trim() || isSending}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#073B9A] text-white disabled:opacity-50"
            aria-label="Publier le commentaire"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
