import { Head, Link } from '@inertiajs/react';
import React from 'react';
import { Lottie } from 'lottie-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F5F2EA] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
            <Head title="Page Not Found" />

            <div className="max-w-lg w-full space-y-6 text-center flex flex-col items-center">
                
                {/* Lottie Animation */}
                <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
                    <Lottie src="/assets/404errorpagewithcat.json" loop autoplay />
                </div>

                {/* Explanation */}
                <div>
                    <p className="mt-4 text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
                        Page not found
                    </p>
                    <p className="mt-4 text-base text-gray-600">
                        Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or perhaps you typed the address incorrectly.
                    </p>
                </div>
                
                {/* Back Home Button */}
                <div className="mt-4 flex justify-center gap-4">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-[#10221C] bg-[#D6FF3F] hover:bg-[#c4ec39] transition duration-150 shadow-sm shadow-[#c4ec39]/50 hover:scale-105"
                    >
                        Go back home
                    </Link>
                </div>
                
                {/* CourtSync Logo */}
                <div className="mt-12 text-2xl">
                    <span className="font-display tracking-tight font-bold text-gray-700">
                        Court<span className="text-[#A8DC1C]">Sync</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
