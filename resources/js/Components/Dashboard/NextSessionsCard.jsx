import React, { memo } from 'react';
import { Plus, Calendar, ChevronRight } from 'lucide-react';
import { DASHBOARD_THEME, MOCK_NEXT_SESSIONS, MOCK_COURT_STATUSES } from './constants';

/**
 * NextSessionsCard - Compact list of upcoming court sessions with divide-y rows
 *
 * @param {Array} [sessions=MOCK_NEXT_SESSIONS] - Session objects
 * @param {Array} [courtStatuses=MOCK_COURT_STATUSES] - Per-court status strip
 * @param {function} [onAddSession] - Add session callback
 * @param {function} [onSelectSession] - Row click callback
 * @param {number} [maxVisible=4] - Max session rows shown
 * @param {boolean} [loading=false] - Skeleton loader
 * @param {string} [className] - Custom classes
 */
function NextSessionsCardComponent({
  sessions = MOCK_NEXT_SESSIONS,
  courtStatuses = MOCK_COURT_STATUSES,
  onAddSession,
  onSelectSession,
  maxVisible = 4,
  loading = false,
  className = '',
}) {
  const getInitials = (name, initials) => {
    if (initials) return initials.toUpperCase();
    if (!name) return 'CS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const visibleSessions = sessions.slice(0, maxVisible);

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#10221C]/10 p-4 flex flex-col gap-3 shadow-subtle h-full ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 bg-stone-200 rounded animate-pulse" />
          <div className="h-6 w-6 bg-stone-200 rounded-lg animate-pulse" />
        </div>
        <div className="divide-y divide-stone-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2.5 py-2">
              <div className="w-7 h-7 rounded-full bg-stone-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-3/4 bg-stone-200 rounded animate-pulse" />
                <div className="h-2 w-1/2 bg-stone-200 rounded animate-pulse" />
              </div>
              <div className="h-3 w-10 bg-stone-200 rounded animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getSourceBadge = (source) => {
    switch (source) {
      case 'Walk-in': return 'text-amber-900 bg-amber-50 border-amber-200/90 font-extrabold';
      case 'Staff':   return 'text-purple-900 bg-purple-50 border-purple-200/90 font-extrabold';
      default:        return 'text-emerald-900 bg-emerald-50 border-emerald-200/90 font-extrabold';
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-[#10221C]/12 p-4 flex flex-col justify-between shadow-subtle h-full transition-all duration-200 hover:border-[#10221C]/25 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center shadow-xs">
            <Calendar size={14} strokeWidth={2.3} />
          </div>
          <h3 className="text-sm font-bold text-[#101F1A]">Next Sessions</h3>
        </div>
        <button
          type="button"
          onClick={onAddSession}
          title="Book new session"
          className="w-7 h-7 rounded-lg bg-[#101F1A]/[0.05] border border-[#101F1A]/10 flex items-center justify-center text-[#101F1A] hover:bg-[#D6FF3F] hover:border-[#D6FF3F] transition-all duration-150 active:scale-90 cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Session list — divide-y rows */}
      <div className="flex-1 min-h-0 divide-y divide-[#10221C]/[0.05]">
        {visibleSessions.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-500 font-medium">
            No upcoming sessions today.
          </div>
        ) : (
          visibleSessions.map((session) => (
            <div
              key={session.id || session.name}
              onClick={() => onSelectSession?.(session)}
              role={onSelectSession ? 'button' : undefined}
              className={`flex items-center gap-2 py-1.5 min-w-0 transition-colors ${
                onSelectSession ? 'cursor-pointer hover:bg-stone-50' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-[#101F1A] shrink-0 border border-[#101F1A]/15"
                style={{ backgroundColor: DASHBOARD_THEME.LIME }}
              >
                {getInitials(session.name, session.initials)}
              </div>

              {/* Name + sport/court */}
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[11.5px] font-bold text-[#101F1A] truncate leading-tight">
                  {session.name}
                </p>
                <p className="text-[10px] text-stone-500 truncate font-medium mt-0.5">
                  {session.sport} · <span className="font-bold text-[#101F1A]">{session.court}</span>
                </p>
              </div>

              {/* Time + amount + source */}
              <div className="text-right shrink-0 flex flex-col items-end gap-0.5 pl-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[11px] font-black text-[#101F1A] tabular-nums">{session.time}</span>
                  {session.amount && (
                    <span className="text-[10px] font-black text-[#101F1A]/60 tabular-nums">{session.amount}</span>
                  )}
                </div>
                <span className={`text-[8.5px] px-1 py-[2px] rounded border leading-none ${getSourceBadge(session.source)}`}>
                  {session.source}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Court-status pill strip */}
      {courtStatuses && courtStatuses.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#10221C]/[0.06] flex items-center gap-1.5 flex-wrap">
          {courtStatuses.map((c) => (
            <div
              key={c.name}
              title={c.occupied ? `${c.name}: ${c.currentSession}` : `${c.name}: Available`}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold border ${
                c.occupied
                  ? 'bg-[#101F1A]/[0.04] border-[#101F1A]/10 text-[#101F1A]'
                  : 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  c.occupied ? 'bg-[#D6FF3F] animate-pulse' : 'bg-emerald-500'
                }`}
              />
              {c.name.replace(/\s*\(.*\)/, '')}
            </div>
          ))}
          <button
            type="button"
            onClick={() => onSelectSession?.({ type: 'view_all' })}
            className="ml-auto text-[10px] font-extrabold text-stone-500 hover:text-[#FF5A36] flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            All <ChevronRight size={11} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

export const NextSessionsCard = memo(NextSessionsCardComponent);
export default NextSessionsCard;
