'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronUp, Loader2, SmilePlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MakutanoCommentIcon, MakutanoShareIcon } from '@/components/icons/service-icons';
import { PostComments, type CommentActor } from '@/components/makutano/PostComments';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  REACTIONS, loadMyReaction, loadReactors, reactionMeta, setPostReaction, type ReactionType, type Reactor,
} from '@/lib/makutano-reactions';

export type PostBodyPost = {
  id: string;
  text: string;
  authorName: string;
  authorId?: string;
  likes: number;
  comments: number;
  reactionCounts?: Partial<Record<ReactionType, number>>;
};

export type PostSignal = 'like' | 'unlike' | 'comment' | 'share';

const EXPANDED_KEY = 'makutano-expanded-posts';

function readExpanded(postId: string) {
  try { return JSON.parse(sessionStorage.getItem(EXPANDED_KEY) || '[]').includes(postId); } catch { return false; }
}

function writeExpanded(postId: string, expanded: boolean) {
  try {
    const ids = new Set<string>(JSON.parse(sessionStorage.getItem(EXPANDED_KEY) || '[]'));
    if (expanded) ids.add(postId); else ids.delete(postId);
    sessionStorage.setItem(EXPANDED_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    // Session storage unavailable: the toggle still works for this view.
  }
}

// ENK-003: line-based clamp (never cuts bytes, emojis or words) with "Voir plus / Voir moins" kept on return.
function PostText({ postId, authorName, text }: { postId: string; authorName: string; text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => setExpanded(readExpanded(postId)), [postId]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || expanded) return;
    const measure = () => setIsClamped(element.scrollHeight - element.clientHeight > 2);
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [expanded, text]);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    writeExpanded(postId, next);
  };

  return (
    <div>
      <p ref={ref} id={`post-text-${postId}`} className={cn('whitespace-pre-wrap break-words text-sm leading-5 text-foreground', !expanded && 'line-clamp-4')}>
        <span className="font-semibold">{authorName}</span>{' '}
        {text}
      </p>
      {(isClamped || expanded) && (
        <button type="button" onClick={toggle} aria-expanded={expanded} aria-controls={`post-text-${postId}`} className="mt-1 min-h-8 text-xs font-bold text-[#073B9A] hover:underline">
          {expanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}

function topReactions(counts: Partial<Record<ReactionType, number>> | undefined, fallbackTotal: number) {
  const entries = REACTIONS.map((item) => ({ ...item, count: Number(counts?.[item.type] || 0) })).filter((item) => item.count > 0);
  if (!entries.length && fallbackTotal > 0) return [REACTIONS[0]];
  return entries.sort((a, b) => b.count - a.count).slice(0, 3);
}

// ENK-005: who reacted, grouped by reaction.
function ReactorsDialog({ postId, open, onOpenChange, onOpenProfile }: { postId: string; open: boolean; onOpenChange: (open: boolean) => void; onOpenProfile?: (uid: string) => void }) {
  const [reactors, setReactors] = useState<Reactor[] | null>(null);
  const [filter, setFilter] = useState<ReactionType | 'all'>('all');

  useEffect(() => {
    if (!open) return;
    setReactors(null);
    loadReactors(postId).then(setReactors).catch(() => setReactors([]));
  }, [open, postId]);

  const visible = (reactors || []).filter((item) => filter === 'all' || item.reaction === filter);
  const available = REACTIONS.filter((item) => (reactors || []).some((reactor) => reactor.reaction === item.type));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader><DialogTitle>Réactions</DialogTitle></DialogHeader>
        <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Filtrer par réaction">
          <button type="button" role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')} className={cn('min-h-9 shrink-0 rounded-full px-3 text-xs font-bold', filter === 'all' ? 'bg-[#073B9A] text-white' : 'bg-primary/5 text-[#073B9A]')}>
            Toutes {reactors ? `· ${reactors.length}` : ''}
          </button>
          {available.map((item) => (
            <button key={item.type} type="button" role="tab" aria-selected={filter === item.type} aria-label={item.label} onClick={() => setFilter(item.type)} className={cn('min-h-9 shrink-0 rounded-full px-3 text-sm', filter === item.type ? 'bg-[#073B9A] text-white' : 'bg-primary/5')}>
              {item.emoji} {(reactors || []).filter((reactor) => reactor.reaction === item.type).length}
            </button>
          ))}
        </div>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {reactors === null ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
          ) : visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune réaction pour le moment.</p>
          ) : visible.map((reactor) => (
            <button key={reactor.userId} type="button" onClick={() => { onOpenChange(false); onOpenProfile?.(reactor.userId); }} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-primary/5">
              <span className="relative">
                <Avatar className="h-10 w-10"><AvatarImage src={reactor.avatar} alt="" /><AvatarFallback>{reactor.name.charAt(0)}</AvatarFallback></Avatar>
                <span className="absolute -bottom-1 -right-1 text-sm" aria-label={reactionMeta(reactor.reaction).label}>{reactionMeta(reactor.reaction).emoji}</span>
              </span>
              <span className="truncate text-sm font-semibold">{reactor.name}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Text, reactions, comments and share for one Makutano post.
 * Shared by the feed and the profile so a post looks and behaves the same everywhere (ENK-011).
 */
export function MakutanoPostBody({
  post,
  actor,
  onOpenProfile,
  onShare,
  onSignal,
}: {
  post: PostBodyPost;
  actor: CommentActor;
  onOpenProfile?: (uid: string) => void;
  onShare?: () => void;
  onSignal?: (signal: PostSignal) => void;
}) {
  const { toast } = useToast();
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null);
  const [total, setTotal] = useState(post.likes);
  const [counts, setCounts] = useState(post.reactionCounts || {});
  const [commentCount, setCommentCount] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [showReactors, setShowReactors] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { setTotal(post.likes); setCounts(post.reactionCounts || {}); setCommentCount(post.comments); }, [post.likes, post.reactionCounts, post.comments]);

  useEffect(() => {
    let cancelled = false;
    if (!actor?.uid) { setMyReaction(null); return; }
    loadMyReaction(post.id, actor.uid).then((reaction) => { if (!cancelled) setMyReaction(reaction); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [actor?.uid, post.id]);

  const react = async (next: ReactionType | null) => {
    if (!actor) {
      toast({ variant: 'destructive', title: 'Connexion requise', description: 'Connectez-vous pour réagir.' });
      return;
    }
    if (isSaving) return;
    const previous = myReaction;
    const previousTotal = total;
    const previousCounts = counts;
    const nextCounts = { ...counts };
    if (previous) nextCounts[previous] = Math.max(0, Number(nextCounts[previous] || 0) - 1);
    if (next) nextCounts[next] = Number(nextCounts[next] || 0) + 1;

    setMyReaction(next);
    setCounts(nextCounts);
    setTotal(Math.max(0, total + (next && !previous ? 1 : !next && previous ? -1 : 0)));
    setPickerOpen(false);
    onSignal?.(next ? 'like' : 'unlike');
    setIsSaving(true);
    try {
      await setPostReaction(post.id, actor, next);
    } catch (error) {
      console.error('Erreur réaction Makutano:', error);
      setMyReaction(previous); setCounts(previousCounts); setTotal(previousTotal);
      toast({ variant: 'destructive', title: 'Réaction non enregistrée', description: 'Réessayez dans un instant.' });
    } finally {
      setIsSaving(false);
    }
  };

  const current = myReaction ? reactionMeta(myReaction) : null;
  const summary = topReactions(counts, total);

  return (
    <>
      <div className="flex-shrink-0 space-y-2 px-3.5 py-3">
        {post.text && <PostText postId={post.id} authorName={post.authorName} text={post.text} />}

        {(total > 0 || commentCount > 0) && (
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            {total > 0 ? (
              <button type="button" onClick={() => setShowReactors(true)} className="flex min-h-8 items-center gap-1 hover:underline" aria-label={`Voir les ${total} réactions`}>
                <span aria-hidden="true">{summary.map((item) => item.emoji).join('')}</span>
                <span>{total.toLocaleString('fr-FR')}</span>
              </button>
            ) : <span />}
            {commentCount > 0 && (
              <button type="button" onClick={() => setShowComments(true)} className="min-h-8 hover:underline">
                {commentCount.toLocaleString('fr-FR')} commentaire{commentCount > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#DCE6F8] pt-2">
          <div className="flex items-center gap-2">
            <div className={cn('flex h-9 items-center overflow-hidden rounded-full text-sm font-semibold', current ? 'bg-[#073B9A] text-white' : 'bg-primary/5 text-muted-foreground')}>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); void react(current ? null : 'like'); }}
                aria-pressed={Boolean(current)}
                aria-label={current ? `Retirer ma réaction ${current.label}` : "J'aime"}
                className="flex h-full items-center gap-1.5 pl-3 pr-2 touch-manipulation"
              >
                <span aria-hidden="true">{current ? current.emoji : '👍'}</span>
                <span>{current ? current.label : "J'aime"}</span>
              </button>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <button type="button" onClick={(event) => event.stopPropagation()} aria-label="Choisir une réaction" className="flex h-full items-center border-l border-current/15 px-2">
                    <SmilePlus className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto rounded-full p-1.5">
                  <div className="flex gap-1" role="menu" aria-label="Réactions">
                    {REACTIONS.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        role="menuitemradio"
                        aria-checked={myReaction === item.type}
                        aria-label={item.label}
                        title={item.label}
                        onClick={() => void react(myReaction === item.type ? null : item.type)}
                        className={cn('grid h-11 w-11 place-items-center rounded-full text-2xl transition hover:scale-110', myReaction === item.type && 'bg-primary/10')}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (!showComments) onSignal?.('comment');
                setShowComments((value) => !value);
              }}
              aria-expanded={showComments}
              className="touch-manipulation flex h-9 items-center gap-2 rounded-full bg-primary/5 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-[#073B9A]"
            >
              {showComments ? <ChevronUp className="h-4 w-4" /> : <MakutanoCommentIcon size={18} />}
              <span>Commenter</span>
            </button>
          </div>

          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onSignal?.('share'); onShare?.(); }}
            className="touch-manipulation flex h-9 w-9 items-center justify-center rounded-full bg-primary/5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-[#073B9A]"
            aria-label="Partager"
          >
            <MakutanoShareIcon size={18} />
          </button>
        </div>
      </div>

      {showComments && (
        <PostComments
          postId={post.id}
          postAuthor={post.authorId ? { uid: post.authorId, name: post.authorName } : undefined}
          actor={actor}
          onCountChange={(delta) => setCommentCount((value) => Math.max(0, value + delta))}
          onOpenProfile={onOpenProfile}
        />
      )}

      <ReactorsDialog postId={post.id} open={showReactors} onOpenChange={setShowReactors} onOpenProfile={onOpenProfile} />
    </>
  );
}
