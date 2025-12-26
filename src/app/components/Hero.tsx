import { Plane, Calendar, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-20 px-6 border-b border-border/50">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-accent/10 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
        </div>
        <h1 className="text-5xl mb-5 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          Turn Your Leaves into Long Vacations
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Plan smarter by combining holidays, weekends, and earned leaves. Maximize your time off with smart optimization.
        </p>
        
        {/* Visual Elements */}
        <div className="flex items-center justify-center gap-8 mt-12">
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-2xl shadow-lg mb-3">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Smart Calendar</p>
          </div>
          <div className="text-3xl text-muted-foreground">+</div>
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-2xl shadow-lg mb-3">
              <Sparkles className="w-8 h-8 text-secondary" />
            </div>
            <p className="text-sm text-muted-foreground">Optimization</p>
          </div>
          <div className="text-3xl text-muted-foreground">=</div>
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-2xl shadow-lg mb-3">
              <Plane className="w-8 h-8 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Long Vacations</p>
          </div>
        </div>
      </div>
    </div>
  );
}