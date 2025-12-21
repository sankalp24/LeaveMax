import { Plus, Minus } from 'lucide-react';

interface LeaveConfigurationProps {
  earnedLeaves: number;
  casualLeaves: number;
  sickLeaves: number;
  onEarnedLeavesChange: (value: number) => void;
  onCasualLeavesChange: (value: number) => void;
  onSickLeavesChange: (value: number) => void;
}

export function LeaveConfiguration({
  earnedLeaves,
  casualLeaves,
  sickLeaves,
  onEarnedLeavesChange,
  onCasualLeavesChange,
  onSickLeavesChange,
}: LeaveConfigurationProps) {
  const LeaveCounter = ({
    label,
    value,
    onChange,
    description,
    color,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    description: string;
    color: string;
  }) => (
    <div className="bg-muted/30 rounded-xl p-4">
      <label className="block mb-2">{label}</label>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-lg bg-white border border-border hover:bg-muted transition-all hover:scale-105 flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className={`flex-1 text-center p-3 rounded-lg bg-white border-2 ${color}`}>
          <span className="text-2xl">{value}</span>
          <span className="text-sm text-muted-foreground ml-1">days</span>
        </div>
        <button
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-lg bg-white border border-border hover:bg-muted transition-all hover:scale-105 flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="mb-8">
        <h3>Leave Configuration</h3>
        <p className="text-sm text-muted-foreground">Configure your available leave balances</p>
      </div>

      <div className="space-y-4">
        <LeaveCounter
          label="Earned Leaves"
          value={earnedLeaves}
          onChange={onEarnedLeavesChange}
          description="Annual earned leave balance"
          color="border-primary"
        />
        <LeaveCounter
          label="Casual Leaves"
          value={casualLeaves}
          onChange={onCasualLeavesChange}
          description="Casual or personal leave days"
          color="border-secondary"
        />
        <LeaveCounter
          label="Sick Leaves"
          value={sickLeaves}
          onChange={onSickLeavesChange}
          description="Medical/sick leave allocation"
          color="border-accent"
        />
      </div>

      <div className="mt-6 p-4 bg-primary/5 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Available Leaves</span>
          <span className="text-2xl text-primary">
            {earnedLeaves + casualLeaves + sickLeaves}
          </span>
        </div>
      </div>
    </div>
  );
}