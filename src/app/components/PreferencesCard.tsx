import { Info, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

interface PreferencesCardProps {
  sandwichRule: boolean;
  onSandwichRuleChange: (value: boolean) => void;
  preferLonger: boolean;
  onPreferLongerChange: (value: boolean) => void;
  maxContinuousLeaves: number;
  onMaxContinuousLeavesChange: (value: number) => void;
}

export function PreferencesCard({
  sandwichRule,
  onSandwichRuleChange,
  preferLonger,
  onPreferLongerChange,
  maxContinuousLeaves,
  onMaxContinuousLeavesChange,
}: PreferencesCardProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="mb-8">
        <h3>Rules & Preferences</h3>
        <p className="text-sm text-muted-foreground">Customize your leave optimization strategy</p>
      </div>

      <div className="space-y-4">
        {/* Sandwich Rule */}
        <div className="flex items-start justify-between p-4 bg-muted/30 rounded-xl">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <label>Apply Sandwich Leave Rule</label>
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip('sandwich')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showTooltip === 'sandwich' && (
                  <div className="absolute left-0 top-6 w-64 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border border-border z-10 text-sm">
                    If a working day falls between two holidays, it's treated as a holiday too. This maximizes consecutive days off.
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically mark working days between holidays as leave days
            </p>
          </div>
          <button
            onClick={() => onSandwichRuleChange(!sandwichRule)}
            className={`ml-4 relative w-12 h-6 rounded-full transition-all ${
              sandwichRule ? 'bg-primary' : 'bg-switch-background'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                sandwichRule ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Prefer Longer Vacations */}
        <div className="flex items-start justify-between p-4 bg-muted/30 rounded-xl">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <label>Prefer Longer Vacations</label>
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip('longer')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showTooltip === 'longer' && (
                  <div className="absolute left-0 top-6 w-64 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border border-border z-10 text-sm">
                    Optimize for fewer, longer vacation periods instead of many short breaks throughout the year.
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Optimize for extended breaks over frequent long weekends
            </p>
          </div>
          <button
            onClick={() => onPreferLongerChange(!preferLonger)}
            className={`ml-4 relative w-12 h-6 rounded-full transition-all ${
              preferLonger ? 'bg-primary' : 'bg-switch-background'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                preferLonger ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Max Continuous Leaves */}
        <div className="p-4 bg-muted/30 rounded-xl">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <label>Max Continuous Leaves</label>
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip('maxLeaves')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showTooltip === 'maxLeaves' && (
                  <div className="absolute left-0 top-6 w-64 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border border-border z-10 text-sm">
                    Maximum number of consecutive working days you can take as leave. This helps optimize recommendations based on your company policy.
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Maximum consecutive working-day leaves allowed
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onMaxContinuousLeavesChange(Math.max(1, maxContinuousLeaves - 1))}
                className="w-10 h-10 rounded-lg bg-white border border-border hover:bg-muted transition-all hover:scale-105 flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center p-3 rounded-lg bg-white border-2 border-primary">
                <span className="text-2xl">{maxContinuousLeaves}</span>
                <span className="text-sm text-muted-foreground ml-1">days</span>
              </div>
              <button
                onClick={() => onMaxContinuousLeavesChange(maxContinuousLeaves + 1)}
                className="w-10 h-10 rounded-lg bg-white border border-border hover:bg-muted transition-all hover:scale-105 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}