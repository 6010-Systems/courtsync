import React, { useState, memo } from 'react';
import {
  QrCode,
  Download,
  Check,
  Copy,
  ExternalLink,
  Printer,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { DASHBOARD_THEME } from './constants';

/**
 * ShareQrCard - Compact facility booking link & QR sharing card with streamlined text hierarchy
 *
 * @param {string} [facilityName='Bogo Sports Center'] - Venue name
 * @param {string} [bookingUrl='https://courtsync.app/bogo-sports'] - Direct link
 * @param {number} [scanCount=342] - Monthly scan count
 * @param {function} [onDownload] - Download QR callback
 * @param {string} [className] - Custom classes
 */
function ShareQrCardComponent({
  facilityName = 'Bogo Sports Center',
  bookingUrl = 'https://courtsync.app/bogo-sports',
  scanCount = 342,
  onDownload,
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLink = () => {
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 bg-[#101F1A] text-[#F5F2EA] border border-white/10 shadow-card relative overflow-hidden ${className}`}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
        {/* Left: Compact QR Preview Frame */}
        <div className="flex items-center gap-3.5 w-full md:w-auto shrink-0">
          <div className="p-2.5 bg-white rounded-xl shadow-md border border-white/20 shrink-0">
            {/* Clean SVG Vector QR */}
            <svg
              className="w-16 h-16 text-[#101F1A]"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {/* Corner 1 */}
              <rect x="5" y="5" width="28" height="28" rx="3" fill="#101F1A" />
              <rect x="11" y="11" width="16" height="16" rx="1.5" fill="white" />
              <rect x="15" y="15" width="8" height="8" rx="1" fill="#101F1A" />

              {/* Corner 2 */}
              <rect x="67" y="5" width="28" height="28" rx="3" fill="#101F1A" />
              <rect x="73" y="11" width="16" height="16" rx="1.5" fill="white" />
              <rect x="77" y="15" width="8" height="8" rx="1" fill="#101F1A" />

              {/* Corner 3 */}
              <rect x="5" y="67" width="28" height="28" rx="3" fill="#101F1A" />
              <rect x="11" y="73" width="16" height="16" rx="1.5" fill="white" />
              <rect x="15" y="77" width="8" height="8" rx="1" fill="#101F1A" />

              {/* Data Blocks */}
              <rect x="38" y="8" width="6" height="6" rx="1" />
              <rect x="48" y="14" width="6" height="10" rx="1" />
              <rect x="38" y="24" width="10" height="6" rx="1" />
              <rect x="8" y="38" width="8" height="6" rx="1" />
              <rect x="20" y="44" width="6" height="14" rx="1" />
              <rect x="8" y="52" width="6" height="8" rx="1" />

              {/* Center Emblem */}
              <circle cx="50" cy="50" r="11" fill="#D6FF3F" />
              <text
                x="50"
                y="54"
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                fill="#101F1A"
                fontFamily="sans-serif"
              >
                C
              </text>

              <rect x="42" y="68" width="8" height="6" rx="1" />
              <rect x="54" y="68" width="6" height="12" rx="1" />
              <rect x="42" y="80" width="12" height="6" rx="1" />
              <rect x="68" y="42" width="8" height="6" rx="1" />
              <rect x="80" y="44" width="12" height="6" rx="1" />
              <rect x="70" y="56" width="6" height="8" rx="1" />
              <rect x="82" y="58" width="8" height="12" rx="1" />
              <rect x="70" y="78" width="14" height="6" rx="1" />
              <rect x="88" y="74" width="6" height="14" rx="1" />
            </svg>
          </div>

          {/* Grouped Information: Category, Title, Subtitle */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D6FF3F] uppercase tracking-wider mb-0.5">
              <Sparkles size={11} />
              <span>Public Booking Page</span>
              <span className="text-white/30">•</span>
              <span className="text-[#F5F2EA]/60 font-semibold lowercase">
                {scanCount} scans this month
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug truncate">
              {facilityName}
            </h4>

            <p className="text-[11.5px] text-[#F5F2EA]/65 mt-0.5 leading-snug line-clamp-1">
              Share link or print counter QR code for instant player bookings.
            </p>
          </div>
        </div>

        {/* Right: Streamlined Interactive Link & Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap shrink-0">
          {/* URL Pill with Copy */}
          <div className="flex items-center bg-black/40 rounded-xl border border-white/10 p-1 pl-3 gap-2">
            <span className="text-xs font-mono text-[#F5F2EA]/85 truncate max-w-[170px] sm:max-w-[200px]">
              {bookingUrl}
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-[#D6FF3F] text-[#101F1A] hover:bg-[#C2EA2E] transition-colors cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check size={12} strokeWidth={3} className="text-[#101F1A]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} strokeWidth={2.2} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Print Poster Button */}
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-1 text-xs font-semibold rounded-xl px-3 py-1.5 bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10 cursor-pointer"
          >
            <Printer size={13} strokeWidth={2} />
            <span className="hidden sm:inline">Print Poster</span>
          </button>

          {/* Download QR Button */}
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-1.5 text-xs font-bold rounded-xl px-3.5 py-1.5 bg-white/15 text-white hover:bg-white/25 transition-colors border border-white/15 cursor-pointer"
          >
            <Download size={13} strokeWidth={2.2} />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export const ShareQrCard = memo(ShareQrCardComponent);
export default ShareQrCard;
