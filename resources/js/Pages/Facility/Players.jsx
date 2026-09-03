import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Players({ auth, players, canManage }) {
    const handleToggleBan = (player) => {
        const action = player.status === 'BANNED' ? 'Unban' : 'Ban';
        if (confirm(`Are you sure you want to ${action.toLowerCase()} ${player.name}?`)) {
            router.post(route('facility.players.toggle-ban', player.id), {
                facility_id: player.facility_id,
            }, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-2xl font-bold leading-tight text-[#10221C]">Players</h2>}
        >
            <Head title="Players" />

            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-xl border border-gray-100">
                    <div className="p-6 text-gray-900">
                        
                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-[#10221C]">Registered Players</h3>
                                <p className="text-sm text-gray-500 mt-1">Manage the players who have joined your facilities.</p>
                            </div>
                        </div>

                        {players.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">No players yet</h3>
                                <p className="mt-1 text-sm text-gray-500">Share your facility link to get players to register.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">Player</th>
                                            <th scope="col" className="px-6 py-4">Facility Joined</th>
                                            <th scope="col" className="px-6 py-4">Joined Date</th>
                                            <th scope="col" className="px-6 py-4">Status</th>
                                            {canManage && <th scope="col" className="px-6 py-4 text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {players.map((player, index) => (
                                            <tr key={`${player.id}-${player.facility_id}`} className="bg-white border-b hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {player.avatar ? (
                                                            <img src={player.avatar} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-[#10221C] text-[#D6FF3F] flex items-center justify-center font-bold text-xs">
                                                                {player.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-[#10221C]">{player.name}</div>
                                                            <div className="text-gray-500">{player.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                                        {player.facility_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {new Date(player.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {player.status === 'BANNED' ? (
                                                        <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">Banned</span>
                                                    ) : (
                                                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Active</span>
                                                    )}
                                                </td>
                                                {canManage && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={() => handleToggleBan(player)}
                                                            className={`text-sm font-bold transition ${
                                                                player.status === 'BANNED'
                                                                    ? 'text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100'
                                                                    : 'text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100'
                                                            } px-3 py-1.5 rounded-md`}
                                                        >
                                                            {player.status === 'BANNED' ? 'Unban Player' : 'Ban Player'}
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
