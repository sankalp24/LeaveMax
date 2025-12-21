import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HolidayInput } from './components/HolidayInput';
import { LeaveConfiguration } from './components/LeaveConfiguration';
import { PreferencesCard } from './components/PreferencesCard';
import { ResultsSection } from './components/ResultsSection';
import { SuggestionsPanel } from './components/SuggestionsPanel';
import { optimizeLeaves, OptimizationResult } from './utils/optimizer';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  
  // Initialize with some sample holidays for demo purposes
  const getSampleHolidays = () => {
    const year = new Date().getFullYear();
    return [
      new Date(year, 0, 1),   // New Year's Day
      new Date(year, 0, 26),  // Republic Day
      new Date(year, 2, 8),   // Holi
      new Date(year, 7, 15),  // Independence Day
      new Date(year, 9, 2),   // Gandhi Jayanti
      new Date(year, 10, 1),  // Diwali
      new Date(year, 11, 25), // Christmas
    ];
  };
  
  const [selectedHolidays, setSelectedHolidays] = useState<Date[]>(getSampleHolidays());
  const [earnedLeaves, setEarnedLeaves] = useState(15);
  const [casualLeaves, setCasualLeaves] = useState(7);
  const [sickLeaves, setSickLeaves] = useState(5);
  const [sandwichRule, setSandwichRule] = useState(true);
  const [preferLonger, setPreferLonger] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [resultMonth, setResultMonth] = useState(new Date());
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<number | null>(null);

  const handleOptimize = () => {
    setIsOptimizing(true);
    
    // Simulate optimization delay for better UX
    setTimeout(() => {
      // Only use earned + casual leaves for optimization (sick leaves are separate)
      const totalLeaves = earnedLeaves + casualLeaves;
      const result = optimizeLeaves(selectedHolidays, totalLeaves, sandwichRule, preferLonger);
      setOptimizationResult(result);
      setSelectedRecommendationId(null); // Reset selection on new optimization
      setIsOptimizing(false);
    }, 1000);
  };

  const handleResultMonthChange = (delta: number) => {
    const newMonth = new Date(resultMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setResultMonth(newMonth);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <Hero />

      <main className="max-w-7xl mx-auto px-6 py-16 space-y-20">
        {/* Input Section */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl mb-3">Configure Your Leave Plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Set up your holidays, leaves, and preferences to get personalized recommendations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <HolidayInput
              selectedHolidays={selectedHolidays}
              onHolidaysChange={setSelectedHolidays}
            />
            <div className="space-y-8">
              <LeaveConfiguration
                earnedLeaves={earnedLeaves}
                casualLeaves={casualLeaves}
                sickLeaves={sickLeaves}
                onEarnedLeavesChange={setEarnedLeaves}
                onCasualLeavesChange={setCasualLeaves}
                onSickLeavesChange={setSickLeaves}
              />
              <PreferencesCard
                sandwichRule={sandwichRule}
                onSandwichRuleChange={setSandwichRule}
                preferLonger={preferLonger}
                onPreferLongerChange={setPreferLonger}
              />
            </div>
          </div>

          {/* Optimize Button */}
          <div className="flex justify-center">
            <button
              onClick={handleOptimize}
              disabled={selectedHolidays.length === 0 || isOptimizing}
              className="group relative px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="flex items-center gap-3">
                <Sparkles className={`w-6 h-6 ${isOptimizing ? 'animate-spin' : ''}`} />
                <span className="text-lg">
                  {isOptimizing ? 'Optimizing Your Leaves...' : 'Optimize My Leaves'}
                </span>
              </div>
              {!isOptimizing && (
                <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              )}
            </button>
          </div>

          {selectedHolidays.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Please select at least one company holiday to get started
            </p>
          )}
        </div>

        {/* Results Section */}
        {optimizationResult && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full mb-4">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="text-sm text-secondary">Optimization Complete</span>
              </div>
              <h2 className="text-3xl mb-2">Your Optimized Leave Plan</h2>
              <p className="text-muted-foreground">
                We've analyzed your holidays and created the perfect vacation strategy
              </p>
            </div>

            <ResultsSection
              result={optimizationResult}
              holidays={selectedHolidays}
              currentMonth={resultMonth}
              onMonthChange={handleResultMonthChange}
              selectedRecommendationId={selectedRecommendationId}
            />

            <SuggestionsPanel 
              result={optimizationResult}
              onViewDetails={setSelectedRecommendationId}
              selectedRecommendationId={selectedRecommendationId}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 py-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="bg-gradient-to-br from-primary to-secondary p-1.5 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span>© 2024 LeaveMax. Smart leave planning for smarter vacations.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;