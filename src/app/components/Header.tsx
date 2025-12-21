import { Calendar, Settings, User, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-primary/70 p-2.5 rounded-xl shadow-sm">
            <Calendar className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl tracking-tight">LeaveMax</h1>
            <p className="text-xs text-muted-foreground">Smart Leave Planning</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {['Dashboard', 'Calendar', 'Optimize Leaves', 'Settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-border overflow-hidden">
              <div className="p-3 border-b border-border">
                <p className="text-sm">John Doe</p>
                <p className="text-xs text-muted-foreground">john@company.com</p>
              </div>
              <button className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}