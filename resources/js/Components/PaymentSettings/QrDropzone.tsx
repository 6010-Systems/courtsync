import React, { useRef, useState } from 'react';
import { AlertCircle, Image as ImageIcon, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { QrDropzoneProps } from './types';
import { formatFileSize } from './utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export const QrDropzone: React.FC<QrDropzoneProps> = ({
    method,
    methodName,
    currentFile,
    currentPreviewUrl,
    error,
    onFileSelect,
    onFileRemove,
    disabled = false,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [clientError, setClientError] = useState<string | null>(null);

    const validateAndProcessFile = (file: File) => {
        setClientError(null);

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            setClientError('Please upload a PNG or JPG image.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setClientError(`Image exceeds 5MB limit (${formatFileSize(file.size)}).`);
            return;
        }

        onFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            validateAndProcessFile(droppedFile);
            e.dataTransfer.clearData();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndProcessFile(e.target.files[0]);
        }
    };

    const handleTriggerClick = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    const displayError = clientError || error;
    const hasPreview = Boolean(currentPreviewUrl);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label
                    htmlFor={`${method}-qr-input`}
                    className="block text-xs font-bold uppercase tracking-wider text-[#10221C]/70"
                >
                    QR Code Image
                </label>
                <span className="text-[11px] text-[#10221C]/50">
                    PNG, JPG up to 5MB
                </span>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                id={`${method}-qr-input`}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="sr-only"
                onChange={handleInputChange}
                disabled={disabled}
                aria-describedby={displayError ? `${method}-qr-error` : undefined}
            />

            {/* Preview State */}
            {hasPreview ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-[#10221C]/15 bg-white p-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-lg border border-[#10221C]/10 bg-[#F5F2EA] p-1 flex items-center justify-center">
                            {currentPreviewUrl ? (
                                <img
                                    src={currentPreviewUrl}
                                    alt={`${methodName} QR`}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <ImageIcon className="h-5 w-5 text-[#10221C]/40" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-[#10221C]">
                                {currentFile ? currentFile.name : `${methodName} QR Code`}
                            </p>
                            <p className="text-[11px] text-[#10221C]/50 mt-0.5">
                                {currentFile ? formatFileSize(currentFile.size) : 'Configured on facility'}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#10221C]/10 justify-end">
                        <button
                            type="button"
                            onClick={handleTriggerClick}
                            disabled={disabled}
                            className="flex-1 sm:flex-initial inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-[#10221C]/15 bg-white px-3 py-1.5 text-xs font-bold text-[#10221C] transition-colors hover:bg-[#10221C]/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10221C]"
                        >
                            <RefreshCw size={12} strokeWidth={2.4} />
                            <span>Replace</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setClientError(null);
                                onFileRemove();
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            disabled={disabled}
                            aria-label="Remove QR code"
                            className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#B8391D] hover:bg-[#FF5A36]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36]"
                        >
                            <Trash2 size={13} strokeWidth={2.4} />
                            <span>Remove</span>
                        </button>
                    </div>
                </div>
            ) : (
                /* Empty Dropzone */
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleTriggerClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleTriggerClick();
                        }
                    }}
                    className={`
                        group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
                        p-4 sm:p-5 text-center transition-all cursor-pointer select-none
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10221C]
                        ${
                            isDragging
                                ? 'border-[#10221C] bg-[#D6FF3F]/10'
                                : 'border-[#10221C]/20 bg-[#10221C]/[0.02] hover:border-[#10221C]/40 hover:bg-[#10221C]/[0.04]'
                        }
                    `}
                >
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#10221C]/[0.05] text-[#10221C] mb-1.5 sm:mb-2">
                        <UploadCloud size={18} strokeWidth={2} />
                    </div>

                    <p className="text-xs font-bold text-[#10221C]">
                        Upload {methodName} QR
                    </p>
                    <p className="text-[11px] text-[#10221C]/50 mt-0.5">
                        Drag and drop or click to browse
                    </p>
                </div>
            )}

            {/* Error Message */}
            {displayError && (
                <div
                    id={`${method}-qr-error`}
                    role="alert"
                    className="flex items-center gap-1.5 rounded-lg bg-[#FF5A36]/10 p-2 text-xs text-[#B8391D]"
                >
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{displayError}</span>
                </div>
            )}
        </div>
    );
};
