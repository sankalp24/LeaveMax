import { Calendar, Plane, Download } from 'lucide-react';
import { format, isWeekend, isSameDay, eachDayOfInterval, startOfDay } from 'date-fns';
import { OptimizationResult } from '../utils/optimizer';
import { motion, AnimatePresence } from 'motion/react';

interface SuggestionsPanelProps {
  result: OptimizationResult;
  onViewDetails: (id: number | null) => void;
  selectedRecommendationId: number | null;
}

export function SuggestionsPanel({ result, onViewDetails, selectedRecommendationId }: SuggestionsPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3>Detailed Recommendations</h3>
          <p className="text-sm text-muted-foreground">Optimized leave suggestions for maximum vacation time</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="space-y-6">
        {result.recommendations.map((rec, index) => {
          const isExpanded = selectedRecommendationId === index;
          const allDates = eachDayOfInterval({ 
            start: startOfDay(rec.startDate), 
            end: startOfDay(rec.endDate) 
          });
          const leaveDatesSet = new Set(
            rec.leaveDates.map(d => format(startOfDay(d), 'yyyy-MM-dd'))
          );

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl border border-border hover:border-primary/30 transition-all hover:shadow-md group"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                  <Calendar className="w-5 h-5 text-primary group-hover:text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="mb-1">Vacation #{index + 1}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(rec.startDate, 'MMM dd')} - {format(rec.endDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="bg-accent/20 px-3 py-1 rounded-full text-sm text-accent-foreground">
                      {rec.totalDays} days
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-secondary" />
                      <span className="text-muted-foreground">
                        {rec.leavesUsed} leave{rec.leavesUsed > 1 ? 's' : ''} required
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Plane className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {rec.totalDays - rec.leavesUsed} bonus days
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {rec.description}
                  </p>

                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">
                      Add to Calendar
                    </button>
                    <button 
                      onClick={() => onViewDetails(isExpanded ? null : index)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        isExpanded
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>

                  {/* Expanded Date Cards */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 overflow-hidden"
                      >
                        <div className="pt-6 border-t border-border">
                          <h5 className="text-sm font-medium mb-4">Vacation Breakdown</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {allDates.map((date, dateIndex) => {
                              const normalizedDate = startOfDay(date);
                              const isLeaveDay = leaveDatesSet.has(format(normalizedDate, 'yyyy-MM-dd'));
                              const isWeekendDay = isWeekend(normalizedDate);
                              
                              return (
                                <motion.div
                                  key={dateIndex}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: dateIndex * 0.02 }}
                                  className={`p-3 rounded-lg border text-center transition-all ${
                                    isLeaveDay
                                      ? 'bg-secondary/20 border-secondary'
                                      : isWeekendDay
                                      ? 'bg-muted/50 border-muted'
                                      : 'bg-primary/10 border-primary'
                                  }`}
                                >
                                  <div className="text-xs font-bold mb-1.5 text-foreground/90">
                                    {format(normalizedDate, 'EEE')}
                                  </div>
                                  <div className="text-2xl font-black mb-1.5 text-foreground">
                                    {format(normalizedDate, 'dd')}
                                  </div>
                                  <div className="text-xs font-bold text-foreground/80">
                                    {format(normalizedDate, 'MMM')}
                                  </div>
                                  {isLeaveDay && (
                                    <div className="mt-1.5 text-xs font-bold text-secondary-foreground">
                                      Leave
                                    </div>
                                  )}
                                  {isWeekendDay && !isLeaveDay && (
                                    <div className="mt-1.5 text-xs font-semibold text-foreground/70">
                                      Weekend
                                    </div>
                                  )}
                                  {!isLeaveDay && !isWeekendDay && (
                                    <div className="mt-1.5 text-xs font-semibold text-primary-foreground">
                                      Holiday
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}

        {result.recommendations.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No recommendations yet. Add company holidays and configure your leave balance to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}