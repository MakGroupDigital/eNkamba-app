'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PiggyBank, Plus, Target, Calendar, TrendingUp, Settings2, Clock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Currency = 'CDF' | 'USD' | 'EUR';

interface SavingsGoal {
  id: string;
  title: string;
  current: number;
  goal: number;
  currency: Currency;
  icon: string;
}

const mockSavingsGoals: SavingsGoal[] = [
  {
    id: '1',
    title: "Acheter une voiture",
    current: 11250000,
    goal: 37500000,
    currency: 'CDF',
    icon: "🚗"
  },
  {
    id: '2',
    title: "Voyage à Dubaï",
    current: 3000000,
    goal: 12500000,
    currency: 'CDF',
    icon: "✈️"
  },
  {
    id: '3',
    title: "Fonds d'urgence",
    current: 6250000,
    goal: 25000000,
    currency: 'CDF',
    icon: "🛡️"
  }
];

export default function SavingsPage() {
  const { toast } = useToast();
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(mockSavingsGoals);
  const [dailySavingsEnabled, setDailySavingsEnabled] = useState(true);
  const [dailyAmount, setDailyAmount] = useState('5000');
  const [dailyCurrency, setDailyCurrency] = useState<Currency>('CDF');
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  
  // Form states
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalCurrency, setNewGoalCurrency] = useState<Currency>('CDF');
  
  // Dialog states
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const totalSavings = savingsGoals.reduce((acc, goal) => {
    if (goal.currency === 'CDF') return acc + goal.current;
    return acc + (goal.current * (goal.currency === 'USD' ? 2500 : 3000));
  }, 0);

  const formatCurrency = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateGoal = () => {
    if (!newGoalTitle || !newGoalAmount || isNaN(parseFloat(newGoalAmount))) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs correctement.",
      });
      return;
    }

    const newGoal: SavingsGoal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      current: 0,
      goal: parseFloat(newGoalAmount),
      currency: newGoalCurrency,
      icon: "💰"
    };

    setSavingsGoals([...savingsGoals, newGoal]);
    setShowNewGoalForm(false);
    setNewGoalTitle('');
    setNewGoalAmount('');
    setNewGoalCurrency('CDF');

    toast({
      title: "Objectif créé !",
      description: `L'objectif "${newGoalTitle}" a été créé avec succès.`,
    });
  };

  const handleAddFunds = () => {
    if (!addAmount || isNaN(parseFloat(addAmount)) || parseFloat(addAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un montant valide.",
      });
      return;
    }

    if (!selectedGoalId) return;

    setSavingsGoals(savingsGoals.map(goal => {
      if (goal.id === selectedGoalId) {
        return { ...goal, current: goal.current + parseFloat(addAmount) };
      }
      return goal;
    }));

    setShowAddFundsDialog(false);
    setAddAmount('');
    setSelectedGoalId(null);

    toast({
      title: "Fonds ajoutés !",
      description: `${formatCurrency(parseFloat(addAmount), savingsGoals.find(g => g.id === selectedGoalId)?.currency || 'CDF')} ont été ajoutés à votre objectif.`,
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un montant valide.",
      });
      return;
    }

    if (!selectedGoalId) return;

    const goal = savingsGoals.find(g => g.id === selectedGoalId);
    if (!goal) return;

    if (parseFloat(withdrawAmount) > goal.current) {
      toast({
        variant: "destructive",
        title: "Solde insuffisant",
        description: "Le montant à retirer dépasse le solde disponible.",
      });
      return;
    }

    setSavingsGoals(savingsGoals.map(goal => {
      if (goal.id === selectedGoalId) {
        return { ...goal, current: goal.current - parseFloat(withdrawAmount) };
      }
      return goal;
    }));

    setShowWithdrawDialog(false);
    setWithdrawAmount('');
    setSelectedGoalId(null);

    toast({
      title: "Retrait effectué !",
      description: `${formatCurrency(parseFloat(withdrawAmount), goal.currency)} ont été retirés de votre objectif.`,
    });
  };

  const selectedGoal = selectedGoalId ? savingsGoals.find(g => g.id === selectedGoalId) : null;

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary via-green-800 to-green-900 text-primary-foreground shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <PiggyBank className="h-6 w-6" />
            Mon Épargne Totale
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            La somme de tous vos objectifs d'épargne
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight">{formatCurrency(totalSavings, 'CDF')}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-primary-foreground/80">
            <TrendingUp className="h-4 w-4" />
            <span>{dailySavingsEnabled ? 'Épargne automatique active' : 'Épargne automatique inactive'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Daily Savings Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Épargne Automatique Quotidienne
          </CardTitle>
          <CardDescription>
            Configurez une épargne automatique qui sera débitée chaque jour.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Épargne automatique quotidienne</p>
                <p className="text-sm text-muted-foreground">
                  {dailySavingsEnabled 
                    ? `${formatCurrency(parseFloat(dailyAmount) || 0, dailyCurrency)} seront automatiquement épargnés chaque jour`
                    : "Activer pour épargner automatiquement chaque jour"}
                </p>
              </div>
            </div>
            <Switch 
              checked={dailySavingsEnabled} 
              onCheckedChange={(checked) => {
                setDailySavingsEnabled(checked);
                toast({
                  title: checked ? "Épargne automatique activée" : "Épargne automatique désactivée",
                  description: checked 
                    ? `Vous épargnerez ${formatCurrency(parseFloat(dailyAmount) || 0, dailyCurrency)} chaque jour.`
                    : "L'épargne automatique a été désactivée.",
                });
              }}
            />
          </div>

          {dailySavingsEnabled && (
            <div className="space-y-4 p-4 border rounded-lg bg-card animate-in fade-in-up">
              <div className="space-y-2">
                <Label htmlFor="daily-amount">Montant quotidien</Label>
                <div className="flex gap-2">
                  <Input
                    id="daily-amount"
                    type="number"
                    placeholder="0"
                    value={dailyAmount}
                    onChange={(e) => setDailyAmount(e.target.value)}
                    className="h-12 text-lg font-semibold"
                  />
                  <Select value={dailyCurrency} onValueChange={(value) => setDailyCurrency(value as Currency)}>
                    <SelectTrigger className="w-[100px] h-12 font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDF">CDF</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {dailyCurrency !== 'CDF' && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {formatCurrency((parseFloat(dailyAmount) || 0) * (dailyCurrency === 'USD' ? 2500 : 3000), 'CDF')} CDF
                  </p>
                )}
              </div>

              <Alert variant="default" className="border-primary/20 bg-primary/5">
                <Settings2 className="h-4 w-4 text-primary" />
                <AlertTitle className="text-sm font-semibold text-primary">Comment ça marche ?</AlertTitle>
                <AlertDescription className="text-xs">
                  Le montant sera automatiquement débité de votre portefeuille principal chaque jour à minuit.
                  Vous pouvez répartir cet argent entre vos objectifs d'épargne ou le laisser s'accumuler.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Savings Goals */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Mes Objectifs d'Épargne
            </CardTitle>
            <Button onClick={() => setShowNewGoalForm(!showNewGoalForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel Objectif
            </Button>
          </div>
          <CardDescription>Planifiez, suivez et atteignez vos rêves financiers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {savingsGoals.map((goal) => {
            const progressPercentage = (goal.current / goal.goal) * 100;
            return (
              <Card key={goal.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl bg-muted p-3 rounded-lg">{goal.icon}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <p className="font-headline font-semibold text-foreground">{goal.title}</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          <span className="font-bold text-primary">{progressPercentage.toFixed(0)}%</span> atteint
                        </p>
                      </div>

                      <Progress value={progressPercentage} className="h-3"/>
                      
                      <p className="text-sm text-muted-foreground text-right">
                        {formatCurrency(goal.current, goal.currency)} / {formatCurrency(goal.goal, goal.currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedGoalId(goal.id);
                      setShowAddFundsDialog(true);
                    }}
                  >
                    Ajouter des fonds
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedGoalId(goal.id);
                      setShowWithdrawDialog(true);
                    }}
                  >
                    Retirer
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          {showNewGoalForm && (
            <Card className="border-primary/50 bg-primary/5 animate-in fade-in-up">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-title">Titre de l'objectif</Label>
                  <Input 
                    id="goal-title" 
                    placeholder="Ex: Voyage en Europe" 
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-amount">Montant cible</Label>
                    <Input 
                      id="goal-amount" 
                      type="number" 
                      placeholder="0" 
                      value={newGoalAmount}
                      onChange={(e) => setNewGoalAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-currency">Devise</Label>
                    <Select value={newGoalCurrency} onValueChange={(value) => setNewGoalCurrency(value as Currency)}>
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

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleCreateGoal}>
                    Créer l'objectif
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setShowNewGoalForm(false);
                    setNewGoalTitle('');
                    setNewGoalAmount('');
                    setNewGoalCurrency('CDF');
                  }}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFundsDialog} onOpenChange={setShowAddFundsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des fonds</DialogTitle>
            <DialogDescription>
              Ajoutez de l'argent à votre objectif "{selectedGoal?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                Devise : {selectedGoal?.currency}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddFundsDialog(false);
              setAddAmount('');
              setSelectedGoalId(null);
            }}>
              Annuler
            </Button>
            <Button onClick={handleAddFunds}>
              Confirmer <ArrowRight className="ml-2 h-4 w-4" />
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
              Retirez de l'argent de votre objectif "{selectedGoal?.title}".
              Solde disponible : {selectedGoal ? formatCurrency(selectedGoal.current, selectedGoal.currency) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                Devise : {selectedGoal?.currency}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowWithdrawDialog(false);
              setWithdrawAmount('');
              setSelectedGoalId(null);
            }}>
              Annuler
            </Button>
            <Button onClick={handleWithdraw}>
              Confirmer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
