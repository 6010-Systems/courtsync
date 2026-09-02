import React, { memo } from 'react';
import { Plus, Calendar, ChevronRight } from 'lucide-react';
import { DASHBOARD_THEME, MOCK_NEXT_SESSIONS } from './constants';

/**
 * NextSessionsCard - List of live and upcoming court booking sessions with zero overflow
 *
 * @param {Array} [sessions=MOCK_NEXT_SESSIONS] - Array of session objects
 * @param {function} [onAddSession] - Add session callback
 * @param {function} [onSelectSession] - Session row click callback
 * @param {number} [maxVisible=4] - Max items visible
 * @param {boolean} [loading=false] - Skeleton loader state
 * @param {string} [className] - Custom classes
 */
function NextSessionsCardComponent({
  sessions = MOCK_NEXT_SESSIONS,
  onAddSession,
  onSelectSession,
  maxVisible = 4,
  loading = false,
  className = '',
}) {
  // Helper to extract clean 2-letter uppercase user initials
  const getInitials = (name, initials) => {
    if (initials) return initials.toUpperCase();
    if (!name) return 'CS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const visibleSessions = sessions.slice(0, maxVisible);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#10221C]/10 p-5 flex flex-col justify-between shadow-subtle h-full overflow-hidden ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-28 bg-stone-200 rounded animate-pulse" />
          <div className="h-6 w-6 bg-stone-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-3/4 bg-stone-200 rounded animate-pulse" />
                <div className="h-2 w-1/2 bg-stone-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-10 bg-stone-200 rounded animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // High-contrast, semantic status badges
  const getSourceBadge = (source) => {
    switch (source) {
      case 'Walk-in':
        return 'text-amber-900 bg-amber-50 border-amber-200/90 font-extrabold';
      case 'Staff':
        return 'text-purple-900 bg-purple-50 border-purple-200/90 font-extrabold';
      case 'Online':
      default:
        return 'text-emerald-900 bg-emerald-50 border-emerald-200/90 font-extrabold';
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-[#10221C]/12 p-5 flex flex-col justify-between shadow-subtle h-full overflow-hidden transition-all duration-200 hover:border-[#10221C]/25 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center shadow-xs">
            <Calendar size={14} strokeWidth={2.3} />
          </div>
          <h3 className="text-sm font-bold text-[#101F1A]">Next Sessions</h3>
        </div>

        <button
          type="button"
          onClick={onAddSession}
          title="Book new session"
          className="w-7 h-7 rounded-xl bg-[#101F1A]/[0.05] border border-[#101F1A]/10 flex items-center justify-center text-[#101F1A] hover:bg-[#D6FF3F] hover:text-[#101F1A] hover:border-[#D6FF3F] transition-all duration-150 active:scale-90 cursor-pointer shadow-xs"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Sessions List Container */}
      <div className="flex-1 min-h-0 flex flex-col justify-between gap-1.5 py-1">
        {visibleSessions.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-500 font-medium">
            No upcoming sessions booked for today.
          </div>
        ) : (
          visibleSessions.map((session) => (
            <div
              key={session.id || session.name}
              onClick={() => onSelectSession?.(session)}
              role={onSelectSession ? 'button' : undefined}
              className={`group flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-150 border border-transparent min-w-0 ${
                onSelectSession
                  ? 'cursor-pointer hover:bg-stone-100 hover:border-stone-200/60'
                  : 'hover:bg-stone-50'
              }`}
            >
              {/* Player Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-[#101F1A] shrink-0 transition-transform group-hover:scale-105 border border-[#101F1A]/20 shadow-xs tracking-tight"
                style={{ backgroundColor: DASHBOARD_THEME.LIME }}
              >
                {getInitials(session.name, session.initials)}
              </div>

              {/* Session Details */}
              <div className="min-w-0 flex-1 overflow-hidden leading-tight">
                <p className="text-xs font-bold text-[#101F1A] truncate group-hover:text-black">
                  {session.name}
                </p>
                <p className="text-[10.5px] text-stone-600 truncate font-medium mt-0.5">
                  {session.sport} · <span className="text-[#101F1A] font-bold">{session.court}</span>
                </p>
              </div>

              {/* Time & Source */}
              <div className="text-right shrink-0 flex flex-col items-end gap-0.5 pl-1">
                <span className="text-xs font-black text-[#101F1A] tabular-nums leading-none">
                  {session.time}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border leading-none ${getSourceBadge(
                    session.source
                  )}`}
                >
                  {session.source}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-[#10221C]/10 flex items-center justify-between shrink-0">
        <span className="text-[10.5px] text-stone-600 font-semibold">
          Next {visibleSessions.length} of {sessions.length} check-ins
        </span>
        <button
          type="button"
          onClick={() => onSelectSession?.({ type: 'view_all' })}
          className="text-xs font-extrabold text-[#101F1A] hover:text-[#FF5A36] flex items-center gap-0.5 transition-colors cursor-pointer"
        >
          <span>View all</span>
          <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export const NextSessionsCard = memo(NextSessionsCardComponent);
export default NextSessionsCard;
