import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('CourtSync ErrorBoundary caught an unhandled error:', error, errorInfo);
    }

    handleReload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center p-6 text-[#10221C] font-sans">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#10221C]/10 shadow-xl text-center space-y-5">
                        <div className="w-14 h-14 rounded-2xl bg-[#FF5A36]/15 border border-[#FF5A36]/30 text-[#FF5A36] flex items-center justify-center mx-auto text-2xl font-black">
                            !
                        </div>
                        
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5A36] block mb-1">
                                Notice
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black text-[#10221C] tracking-tight">
                                Something went wrong
                            </h2>
                            <p className="text-xs text-[#10221C]/65 font-medium mt-2 leading-relaxed">
                                An unexpected issue occurred while rendering this view. Your reservation and account data remain completely safe.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={this.handleReload}
                                className="px-5 py-2.5 rounded-xl bg-[#10221C] hover:bg-[#18342b] text-[#D6FF3F] text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                            >
                                Reload Page
                            </button>
                            <button
                                type="button"
                                onClick={this.handleReset}
                                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#10221C] text-xs font-bold transition cursor-pointer active:scale-95"
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
