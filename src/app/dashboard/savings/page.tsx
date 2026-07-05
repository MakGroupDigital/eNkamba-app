'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PiggyBank, Plus, Target, Trash2, Pause, Play, AlertCircle, CheckCircle2, ArrowRight, Zap, ShieldCheck, WalletCards } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSavingsGoals, SavingsFrequency, SavingsStatus } from "@/hooks/useSavingsGoals";
import { useAuth } from "@/hooks/useAuth";

const GOAL_ICONS = ['🎯', '🚗', '✈️', '🏠', '💍', '📚', '🎮', '🏖️', '💻', '🎸'];

const SavingsVaultIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <rect x="8" y="14" width="32" height="25" rx="8" fill="#25543A" />
    <path d="M14 20h20" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
    <circle cx="24" cy="28" r="6" fill="#25543A" opacity="0.9" />
    <circle cx="24" cy="28" r="2" fill="#FFB545" />
    <path d="M17 14v-2a7 7 0 0 1 14 0v2" stroke="#25543A" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
  </svg>
);

const GoalSeedIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <path d="M24 39V22" stroke="#25543A" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 24c-8 0-13-5-13-12 8 0 13 5 13 12Z" fill="#25543A" />
    <path d="M24 27c8 0 13-5 13-12-8 0-13 5-13 12Z" fill="#FFB545" />
    <rect x="13" y="37" width="22" height="4" rx="2" fill="#25543A" opacity="0.35" />
  </svg>
);

const AutoSaveIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <rect x="9" y="10" width="30" height="28" rx="8" fill="#25543A" />
    <path d="M16 25h13" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M26 18l7 7-7 7" stroke="#25543A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17" cy="18" r="3" fill="#FFB545" />
  </svg>
);

export default function SavingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    goals,
    loading,
    error,
    totalSavings,
    walletBalance,
    createGoal,
    addFunds,
    withdrawFunds,
    deleteGoal,
    toggleGoalStatus,
    getGoalProgress,
  } = useSavingsGoals();

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currency: 'CDF' as const,
    frequency: 'daily' as SavingsFrequency,
    frequencyAmount: '',
    icon: GOAL_ICONS[0],
    description: '',
  });

  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedGoal = selectedGoalId ? goals.find(g => g.id === selectedGoalId) : null;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateGoal = async () => {
    if (!formData.name || !formData.targetAmount || !formData.frequencyAmount) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await createGoal(
        formData.name,
        parseFloat(formData.targetAmount),
        formData.currency,
        formData.frequency,
        parseFloat(formData.frequencyAmount),
        formData.icon,
        formData.description
      );

      toast({
        title: "Objectif créé!",
        description: `L'objectif "${formData.name}" a été créé avec succès.`,
      });

      setShowCreateDialog(false);
      setFormData({
        name: '',
        targetAmount: '',
        currency: 'CDF',
        frequency: 'daily',
        frequencyAmount: '',
        icon: GOAL_ICONS[0],
        description: '',
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de créer l'objectif.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddFunds = async () => {
    if (!addAmount || isNaN(parseFloat(addAmount)) || parseFloat(addAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un montant valide.",
      });
      return;
    }

    if (!selectedGoalId) return;

    setIsProcessing(true);
    try {
      const amount = parseFloat(addAmount);

      if (walletBalance < amount) {
        toast({
          variant: "destructive",
          title: "Solde insuffisant",
          description: `Vous n'avez que ${formatCurrency(walletBalance, 'CDF')} dans votre portefeuille.`,
        });
        return;
      }

      await addFunds(selectedGoalId, amount);

      toast({
        title: "Fonds ajoutés!",
        description: `${formatCurrency(amount, selectedGoal?.currency || 'CDF')} ont été ajoutés à votre objectif.`,
      });

      setShowAddFundsDialog(false);
      setAddAmount('');
      setSelectedGoalId(null);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'ajouter les fonds.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un montant valide.",
      });
      return;
    }

    if (!selectedGoalId) return;

    setIsProcessing(true);
    try {
      const amount = parseFloat(withdrawAmount);

      if (selectedGoal && amount > selectedGoal.currentAmount) {
        toast({
          variant: "destructive",
          title: "Montant insuffisant",
          description: `Vous n'avez que ${formatCurrency(selectedGoal.currentAmount, selectedGoal.currency)} dans cet objectif.`,
        });
        return;
      }

      await withdrawFunds(selectedGoalId, amount);

      toast({
        title: "Retrait effectué!",
        description: `${formatCurrency(amount, selectedGoal?.currency || 'CDF')} ont été retirés de votre objectif.`,
      });

      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      setSelectedGoalId(null);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de retirer les fonds.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif?')) return;

    try {
      await deleteGoal(goalId);
      toast({
        title: "Objectif supprimé",
        description: "L'objectif a été supprimé avec succès.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de supprimer l'objectif.",
      });
    }
  };

  const handleToggleStatus = async (goalId: string, currentStatus: SavingsStatus) => {
    const newStatus: SavingsStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await toggleGoalStatus(goalId, newStatus);
      toast({
        title: newStatus === 'active' ? "Objectif repris" : "Objectif en pause",
        description: newStatus === 'active' 
          ? "Les contributions automatiques ont repris."
          : "Les contributions automatiques ont été mises en pause.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de mettre à jour l'objectif.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf8]">
      <div className="container mx-auto max-w-4xl p-4 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-2xl bg-muted"></div>
          <div className="h-64 rounded-2xl bg-muted"></div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf8]">
    <div className="container mx-auto max-w-4xl p-3 space-y-4 animate-in fade-in duration-500 sm:p-4">
      {/* Header */}
      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#25543A] to-[#25543A] p-4 text-white shadow-lg shadow-[#25543A]/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/16 ring-1 ring-white/25">
              <SavingsVaultIcon className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Épargne intelligente</p>
              <h1 className="font-headline text-xl font-black text-white sm:text-2xl">
                Mon Épargne
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-5 text-white/78 sm:text-sm">
                Créez des objectifs, alimentez-les depuis votre portefeuille et suivez votre progression.
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="h-10 shrink-0 rounded-xl bg-white px-3 text-xs font-bold text-[#25543A] hover:bg-white/90 sm:text-sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Nouvel Objectif
          </Button>
        </div>
      </header>

      {/* Total Savings Card */}
      <Card className="overflow-hidden border-0 bg-white shadow-sm">
        <CardHeader className="border-b border-[#25543A]/10 px-4 py-3">
          <CardTitle className="font-headline flex items-center gap-2 text-lg text-[#25543A]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25543A]/10">
              <PiggyBank className="h-5 w-5 text-[#25543A]" />
            </span>
            Épargne Totale
          </CardTitle>
          <CardDescription>
            Somme de tous vos objectifs d'épargne
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl bg-[#25543A] p-4 text-white shadow-sm shadow-[#25543A]/20">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">Total sécurisé</p>
            <p className="mt-2 text-3xl font-black tracking-tight">{formatCurrency(totalSavings, 'CDF')}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {goals.length} objectif{goals.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {goals.filter(g => g.status === 'completed').length} complété{goals.filter(g => g.status === 'completed').length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            <div className="rounded-2xl border border-[#25543A]/10 bg-[#f7faf8] p-3">
              <WalletCards className="mb-2 h-5 w-5 text-[#25543A]" />
              <p className="text-xs font-bold text-[#25543A]">Portefeuille lié</p>
              <p className="mt-1 text-sm font-black text-[#25543A]">{formatCurrency(walletBalance, 'CDF')}</p>
            </div>
            <div className="rounded-2xl border border-[#25543A]/10 bg-[#f7faf8] p-3">
              <ShieldCheck className="mb-2 h-5 w-5 text-[#FFB545]" />
              <p className="text-xs font-bold text-[#25543A]">Débits planifiés</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Selon vos fréquences.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* No Goals State */}
      {goals.length === 0 && (
        <Card className="border-2 border-dashed border-[#25543A]/30 bg-white">
          <CardContent className="space-y-4 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#25543A]/10">
              <GoalSeedIcon className="h-10 w-10" />
            </div>
            <div>
              <h3 className="font-headline mb-2 text-lg font-bold text-[#25543A]">Aucun objectif d'épargne</h3>
              <p className="mb-4 text-sm text-muted-foreground">Créez votre premier objectif d'épargne pour commencer à économiser.</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="rounded-xl bg-[#25543A] font-bold hover:bg-[#25543A]">
              <Plus className="mr-2 h-4 w-4" />
              Créer un Objectif
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {goals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg font-bold text-[#25543A]">Mes Objectifs</h2>
            <div className="rounded-full bg-[#25543A]/10 px-3 py-1 text-xs font-bold text-[#25543A]">
              <span>{goals.length} objectif{goals.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          {goals.map((goal) => {
            const progress = getGoalProgress(goal.id);
            const isCompleted = goal.status === 'completed';

            return (
              <Card key={goal.id} className={`overflow-hidden border-[#25543A]/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isCompleted ? 'border-[#25543A]/30 bg-[#25543A]/5' : ''}`}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex flex-1 items-start gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#25543A]/10 text-3xl ring-1 ring-[#25543A]/10">{goal.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-headline truncate font-bold text-[#25543A]">{goal.name}</h3>
                            {isCompleted && (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#25543A]" />
                            )}
                            {goal.status === 'paused' && (
                              <Pause className="h-5 w-5 shrink-0 text-yellow-600" />
                            )}
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 rounded-full bg-[#25543A]/10 px-2 py-1 font-semibold text-[#25543A]">
                              <Zap className="h-3.5 w-3.5" />
                              {goal.frequency === 'daily' ? 'Quotidien' : goal.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                            </span>
                            <span className="rounded-full bg-[#f7faf8] px-2 py-1 font-semibold text-[#25543A]">{formatCurrency(goal.frequencyAmount, goal.currency)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-[#25543A]">{progress.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">Atteint</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress value={progress} className="h-3 rounded-full bg-[#25543A]/10" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(goal.currentAmount, goal.currency)}</span>
                        <span>{formatCurrency(goal.targetAmount, goal.currency)}</span>
                      </div>
                    </div>

                    {/* Status Alert */}
                    {isCompleted && (
                      <Alert className="rounded-2xl border-[#25543A]/20 bg-[#25543A]/5">
                        <CheckCircle2 className="h-4 w-4 text-[#25543A]" />
                        <AlertTitle className="text-[#25543A]">Objectif atteint!</AlertTitle>
                        <AlertDescription className="text-[#25543A]">
                          Vous pouvez maintenant retirer vos fonds.
                        </AlertDescription>
                      </Alert>
                    )}

                    {goal.status === 'paused' && (
                      <Alert className="rounded-2xl border-yellow-200 bg-yellow-50">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-900">Objectif en pause</AlertTitle>
                        <AlertDescription className="text-yellow-800">
                          Les contributions automatiques sont mises en pause.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGoalId(goal.id);
                          setShowAddFundsDialog(true);
                        }}
                        className="h-9 flex-1 rounded-xl border-[#25543A]/20 text-[#25543A] hover:bg-[#25543A]/5"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>

                      {isCompleted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setShowWithdrawDialog(true);
                          }}
                          className="h-9 flex-1 rounded-xl border-[#25543A]/20 text-[#25543A] hover:bg-[#25543A]/5"
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Retirer
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(goal.id, goal.status)}
                        className="h-9 flex-1 rounded-xl border-[#25543A]/20 text-[#25543A] hover:bg-[#25543A]/5"
                      >
                        {goal.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Reprendre
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="h-9 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#25543A]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25543A]/10">
                <GoalSeedIcon className="h-6 w-6" />
              </span>
              Créer un nouvel objectif d'épargne
            </DialogTitle>
            <DialogDescription>
              Définissez votre objectif d'épargne et configurez les contributions automatiques.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="goal-name" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Nom de l'objectif</Label>
              <Input
                id="goal-name"
                placeholder="Ex: Voyage à Dubaï"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl border-[#25543A]/20 focus-visible:ring-[#25543A]"
              />
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Icône</Label>
              <div className="grid grid-cols-5 gap-2">
                {GOAL_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`rounded-xl border-2 p-2 text-2xl transition-all ${
                      formData.icon === icon
                        ? 'border-[#25543A] bg-[#25543A]/10'
                        : 'border-muted hover:border-[#25543A]/50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="goal-description" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Description (optionnel)</Label>
              <Input
                id="goal-description"
                placeholder="Détails sur votre objectif"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl border-[#25543A]/20 focus-visible:ring-[#25543A]"
              />
            </div>

            {/* Target Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target-amount" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Montant cible</Label>
                <Input
                  id="target-amount"
                  type="number"
                  placeholder="0"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="rounded-xl border-[#25543A]/20 focus-visible:ring-[#25543A]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Devise</Label>
                <Select value={formData.currency} onValueChange={(value: any) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger className="rounded-xl border-[#25543A]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDF">CDF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Frequency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Fréquence</Label>
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger className="rounded-xl border-[#25543A]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency-amount" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Montant par période</Label>
                <Input
                  id="frequency-amount"
                  type="number"
                  placeholder="0"
                  value={formData.frequencyAmount}
                  onChange={(e) => setFormData({ ...formData, frequencyAmount: e.target.value })}
                  className="rounded-xl border-[#25543A]/20 focus-visible:ring-[#25543A]"
                />
              </div>
            </div>

            <Alert className="rounded-2xl border-[#25543A]/20 bg-[#25543A]/5">
              <AutoSaveIcon className="h-4 w-4" />
              <AlertTitle className="text-[#25543A]">Contributions automatiques</AlertTitle>
              <AlertDescription>
                Le montant sera automatiquement débité de votre portefeuille selon la fréquence choisie.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateGoal} disabled={isProcessing} className="bg-[#25543A] hover:bg-[#25543A]">
              {isProcessing ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFundsDialog} onOpenChange={setShowAddFundsDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#25543A]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25543A]/10">
                <Plus className="h-5 w-5 text-[#25543A]" />
              </span>
              Ajouter des fonds
            </DialogTitle>
            <DialogDescription>
              Ajoutez de l'argent à "{selectedGoal?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2 rounded-2xl bg-[#f7faf8] p-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Solde portefeuille:</span>
                <span className="font-bold text-[#25543A]">{formatCurrency(walletBalance, 'CDF')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Solde objectif:</span>
                <span className="font-bold text-[#25543A]">{formatCurrency(selectedGoal?.currentAmount || 0, selectedGoal?.currency || 'CDF')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-amount" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Montant à ajouter</Label>
              <Input
                id="add-amount"
                type="number"
                placeholder="0"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="rounded-xl border-[#25543A]/20 text-lg font-bold focus-visible:ring-[#25543A]"
              />
              <p className="text-xs text-muted-foreground">
                Devise: {selectedGoal?.currency}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddFundsDialog(false);
              setAddAmount('');
            }}>
              Annuler
            </Button>
            <Button onClick={handleAddFunds} disabled={isProcessing} className="bg-[#25543A] hover:bg-[#25543A]">
              {isProcessing ? "Traitement..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#25543A]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25543A]/10">
                <ArrowRight className="h-5 w-5 text-[#25543A]" />
              </span>
              Retirer des fonds
            </DialogTitle>
            <DialogDescription>
              Retirez de l'argent de "{selectedGoal?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="rounded-2xl border-[#25543A]/20 bg-[#25543A]/5">
              <CheckCircle2 className="h-4 w-4 text-[#25543A]" />
              <AlertTitle className="text-[#25543A]">Objectif atteint!</AlertTitle>
              <AlertDescription className="text-[#25543A]">
                Vous pouvez retirer jusqu'à {formatCurrency(selectedGoal?.currentAmount || 0, selectedGoal?.currency || 'CDF')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Montant à retirer</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="rounded-xl border-[#25543A]/20 text-lg font-bold focus-visible:ring-[#25543A]"
              />
              <p className="text-xs text-muted-foreground">
                Devise: {selectedGoal?.currency}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowWithdrawDialog(false);
              setWithdrawAmount('');
            }}>
              Annuler
            </Button>
            <Button onClick={handleWithdraw} disabled={isProcessing} className="bg-[#25543A] hover:bg-[#25543A]">
              {isProcessing ? "Traitement..." : "Retirer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
