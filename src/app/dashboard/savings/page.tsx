'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PiggyBank, Plus, Target, Calendar, TrendingUp, Trash2, Pause, Play, Lock, AlertCircle, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSavingsGoals, SavingsFrequency, SavingsStatus } from "@/hooks/useSavingsGoals";
import { useAuth } from "@/hooks/useAuth";

const GOAL_ICONS = ['🎯', '🚗', '✈️', '🏠', '💍', '📚', '🎮', '🏖️', '💻', '🎸'];

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
      <div className="container mx-auto max-w-4xl p-4 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-6 w-6 text-primary" />
          <h1 className="font-headline text-xl font-bold text-primary">
            Mon Épargne
          </h1>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Objectif
        </Button>
      </header>

      {/* Total Savings Card */}
      <Card className="bg-gradient-to-br from-primary via-green-800 to-green-900 text-primary-foreground shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <PiggyBank className="h-6 w-6" />
            Épargne Totale
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Somme de tous vos objectifs d'épargne
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight">{formatCurrency(totalSavings, 'CDF')}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-primary-foreground/80">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>{goals.length} objectif{goals.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>{goals.filter(g => g.status === 'completed').length} complété{goals.filter(g => g.status === 'completed').length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Goals State */}
      {goals.length === 0 && (
        <Card className="border-dashed border-2 border-primary/30">
          <CardContent className="p-12 text-center space-y-4">
            <PiggyBank className="h-16 w-16 text-muted-foreground mx-auto opacity-50" />
            <div>
              <h3 className="font-headline font-semibold text-lg mb-2">Aucun objectif d'épargne</h3>
              <p className="text-muted-foreground mb-4">Créez votre premier objectif d'épargne pour commencer à économiser.</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Créer un Objectif
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {goals.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-headline font-semibold text-lg">Mes Objectifs</h2>
          {goals.map((goal) => {
            const progress = getGoalProgress(goal.id);
            const isCompleted = goal.status === 'completed';

            return (
              <Card key={goal.id} className={`hover:shadow-md transition-shadow ${isCompleted ? 'border-green-200 bg-green-50/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-3xl bg-muted p-3 rounded-lg">{goal.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-headline font-semibold">{goal.name}</h3>
                            {isCompleted && (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                            {goal.status === 'paused' && (
                              <Pause className="h-5 w-5 text-yellow-600" />
                            )}
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              {goal.frequency === 'daily' ? 'Quotidien' : goal.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                            </span>
                            <span>{formatCurrency(goal.frequencyAmount, goal.currency)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{progress.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">Atteint</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress value={progress} className="h-3" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(goal.currentAmount, goal.currency)}</span>
                        <span>{formatCurrency(goal.targetAmount, goal.currency)}</span>
                      </div>
                    </div>

                    {/* Status Alert */}
                    {isCompleted && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-900">Objectif atteint!</AlertTitle>
                        <AlertDescription className="text-green-800">
                          Vous pouvez maintenant retirer vos fonds.
                        </AlertDescription>
                      </Alert>
                    )}

                    {goal.status === 'paused' && (
                      <Alert className="border-yellow-200 bg-yellow-50">
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
                        className="flex-1"
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
                          className="flex-1"
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Retirer
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(goal.id, goal.status)}
                        className="flex-1"
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouvel objectif d'épargne</DialogTitle>
            <DialogDescription>
              Définissez votre objectif d'épargne et configurez les contributions automatiques.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="goal-name">Nom de l'objectif</Label>
              <Input
                id="goal-name"
                placeholder="Ex: Voyage à Dubaï"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>Icône</Label>
              <div className="grid grid-cols-5 gap-2">
                {GOAL_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`p-2 text-2xl rounded-lg border-2 transition-all ${
                      formData.icon === icon
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="goal-description">Description (optionnel)</Label>
              <Input
                id="goal-description"
                placeholder="Détails sur votre objectif"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Target Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target-amount">Montant cible</Label>
                <Input
                  id="target-amount"
                  type="number"
                  placeholder="0"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select value={formData.currency} onValueChange={(value: any) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
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
                <Label htmlFor="frequency">Fréquence</Label>
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger>
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
                <Label htmlFor="frequency-amount">Montant par période</Label>
                <Input
                  id="frequency-amount"
                  type="number"
                  placeholder="0"
                  value={formData.frequencyAmount}
                  onChange={(e) => setFormData({ ...formData, frequencyAmount: e.target.value })}
                />
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Contributions automatiques</AlertTitle>
              <AlertDescription>
                Le montant sera automatiquement débité de votre portefeuille selon la fréquence choisie.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateGoal} disabled={isProcessing}>
              {isProcessing ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFundsDialog} onOpenChange={setShowAddFundsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des fonds</DialogTitle>
            <DialogDescription>
              Ajoutez de l'argent à "{selectedGoal?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Solde portefeuille:</span>
                <span className="font-semibold">{formatCurrency(walletBalance, 'CDF')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Solde objectif:</span>
                <span className="font-semibold">{formatCurrency(selectedGoal?.currentAmount || 0, selectedGoal?.currency || 'CDF')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-amount">Montant à ajouter</Label>
              <Input
                id="add-amount"
                type="number"
                placeholder="0"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="text-lg"
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
            <Button onClick={handleAddFunds} disabled={isProcessing}>
              {isProcessing ? "Traitement..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer des fonds</DialogTitle>
            <DialogDescription>
              Retirez de l'argent de "{selectedGoal?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Objectif atteint!</AlertTitle>
              <AlertDescription className="text-green-800">
                Vous pouvez retirer jusqu'à {formatCurrency(selectedGoal?.currentAmount || 0, selectedGoal?.currency || 'CDF')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Montant à retirer</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="text-lg"
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
            <Button onClick={handleWithdraw} disabled={isProcessing}>
              {isProcessing ? "Traitement..." : "Retirer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
