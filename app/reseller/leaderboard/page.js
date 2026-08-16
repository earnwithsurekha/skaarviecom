'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Trophy,
  TrendingUp,
  DollarSign,
  Award,
  Medal,
  Crown,
  User,
  Calendar,
  ShoppingCart,
  Eye,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeaderboardPage() {
  const router = useRouter();
  const user = useSelector(state => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // 'all' or 'monthly'
  const [leaderboard, setLeaderboard] = useState([]);
  const [topThree, setTopThree] = useState([]);
  const [currentUserPosition, setCurrentUserPosition] = useState(null);
  const [totalResellers, setTotalResellers] = useState(0);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/reseller/leaderboard?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const data = await response.json();
      
      if (data.status === 'success') {
        setLeaderboard(data.data.leaderboard || []);
        setTopThree(data.data.top_three || []);
        setCurrentUserPosition(data.data.current_user_position);
        setTotalResellers(data.data.total_resellers || 0);
      }

    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return {
        icon: Crown,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-300 dark:border-yellow-700',
        label: '1st Place'
      };
    }
    if (rank === 2) {
      return {
        icon: Medal,
        color: 'text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        borderColor: 'border-gray-300 dark:border-gray-700',
        label: '2nd Place'
      };
    }
    if (rank === 3) {
      return {
        icon: Award,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        borderColor: 'border-orange-300 dark:border-orange-700',
        label: '3rd Place'
      };
    }
    return {
      icon: Star,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      borderColor: 'border-blue-300 dark:border-blue-700',
      label: `${rank}th Place`
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leaderboard
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          See where you rank among top performing resellers
        </p>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700 w-fit">
        <button
          onClick={() => setPeriod('all')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all ${
            period === 'all'
              ? 'text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          style={period === 'all' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
        >
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            All-Time
          </div>
        </button>
        <button
          onClick={() => setPeriod('monthly')}
          className={`px-6 py-2.5 rounded-md font-medium transition-all ${
            period === 'monthly'
              ? 'text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          style={period === 'monthly' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Month
          </div>
        </button>
      </div>

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 2nd Place */}
          <div className="md:order-1 order-2">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border-2 border-gray-300 dark:border-gray-700 shadow-md">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-gray-300 dark:border-gray-600">
                    {topThree[1]?.profile_photo ? (
                      <img src={topThree[1].profile_photo} alt={topThree[1].full_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-full p-2">
                    <Medal className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                  {topThree[1]?.full_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Rank #2
                </p>
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sales:</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{topThree[1]?.total_sales.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Earnings:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">₹{topThree[1]?.total_earnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="md:order-2 order-1">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-6 border-2 border-yellow-300 dark:border-yellow-700 shadow-xl transform md:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center overflow-hidden border-4 border-yellow-400 dark:border-yellow-600">
                    {topThree[0]?.profile_photo ? (
                      <img src={topThree[0].profile_photo} alt={topThree[0].full_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-yellow-600" />
                    )}
                  </div>
                  <div className="absolute -top-3 -right-3 bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-400 dark:border-yellow-600 rounded-full p-2 shadow-lg">
                    <Crown className="h-7 w-7 text-yellow-500" />
                  </div>
                </div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                  {topThree[0]?.full_name}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 font-semibold mb-4">
                  🏆 Champion
                </p>
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sales:</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{topThree[0]?.total_sales.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Earnings:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">₹{topThree[0]?.total_earnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="md:order-3 order-3">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-6 border-2 border-orange-300 dark:border-orange-700 shadow-md">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center overflow-hidden border-4 border-orange-300 dark:border-orange-600">
                    {topThree[2]?.profile_photo ? (
                      <img src={topThree[2].profile_photo} alt={topThree[2].full_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-orange-600" />
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-orange-100 dark:bg-orange-900 border-2 border-orange-300 dark:border-orange-700 rounded-full p-2">
                    <Award className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                  {topThree[2]?.full_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Rank #3
                </p>
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sales:</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{topThree[2]?.total_sales.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Earnings:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">₹{topThree[2]?.total_earnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Your Position Card */}
      {currentUserPosition && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-900/30 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-16 h-16 rounded-full font-bold text-2xl ${
                getRankBadge(currentUserPosition.rank).bgColor
              } ${getRankBadge(currentUserPosition.rank).borderColor} border-2`}>
                #{currentUserPosition.rank}
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Your Position</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentUserPosition.full_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Out of {totalResellers} resellers</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Orders</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{currentUserPosition.total_orders}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sales</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{currentUserPosition.total_sales.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Earnings</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">₹{currentUserPosition.total_earnings.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {period === 'monthly' ? 'Monthly' : 'All-Time'} Rankings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Top {leaderboard.length} performing resellers
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-400">
                Live Rankings
              </span>
            </div>
          </div>
        </div>

        {leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reseller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clicks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg/Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaderboard.map((reseller) => {
                  const rankBadge = getRankBadge(reseller.rank);
                  const RankIcon = rankBadge.icon;
                  
                  return (
                    <tr 
                      key={reseller.id} 
                      className={`${
                        reseller.is_current_user 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {reseller.rank <= 3 ? (
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${rankBadge.bgColor} ${rankBadge.borderColor} border-2`}>
                              <RankIcon className={`h-5 w-5 ${rankBadge.color}`} />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 font-bold text-gray-900 dark:text-white">
                              #{reseller.rank}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {reseller.profile_photo ? (
                              <img src={reseller.profile_photo} alt={reseller.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {reseller.full_name}
                              {reseller.is_current_user && (
                                <span className="ml-2 text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{reseller.reseller_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {reseller.total_orders}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {reseller.total_clicks}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ₹{reseller.total_sales.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          ₹{reseller.total_earnings.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          ₹{reseller.avg_commission_per_order.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Trophy className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Rankings Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {period === 'monthly' 
                ? 'No sales recorded this month yet' 
                : 'Start making sales to appear on the leaderboard'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
