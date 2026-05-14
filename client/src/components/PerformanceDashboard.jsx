import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { BsArrowRight, BsRobot } from 'react-icons/bs';
import { HiSparkles } from 'react-icons/hi';
import { FaTrophy } from 'react-icons/fa';
import axios from 'axios';
import { ServerUrl } from '../App';
import { useNavigate } from 'react-router-dom';

// Custom yellow tooltip for Recharts
const YellowTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-yellow-400/40 rounded-xl px-4 py-2 text-xs">
        <p className="text-gray-400">{label}</p>
        <p className="text-yellow-400 font-bold">{payload[0].value}/10</p>
      </div>
    );
  }
  return null;
};

function PerformanceDashboard({ userData }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) { setLoading(false); return; }
    const fetchInterviews = async () => {
      try {
        const res = await axios.get(ServerUrl + '/api/interview/get-interview', { withCredentials: true });
        setInterviews(res.data || []);
      } catch (err) {
        console.error('Failed to fetch interviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, [userData]);

  // ── Derived data ──────────────────────────────────────────────
  const completed = interviews.filter(i => i.status === 'completed');

  // Growth trend: last 6 completed sessions
  const trendData = completed.slice(0, 6).reverse().map((iv, idx) => ({
    name: new Date(iv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    score: Number(iv.finalScore ?? 0),
  }));

  // Avg technical accuracy (proxy: avg finalScore * 10)
  const avgScore = completed.length
    ? (completed.reduce((acc, i) => acc + (i.finalScore || 0), 0) / completed.length)
    : 0;
  const avgAccuracy = Math.round(avgScore * 10);

  // Skill radar — derive from most recent completed interview
  const recent = completed[0];
  const radarData = [
    { skill: 'Communication', value: recent?.communication ?? 0 },
    { skill: 'Confidence',    value: recent?.confidence    ?? 0 },
    { skill: 'Correctness',   value: recent?.correctness   ?? 0 },
    { skill: 'Logic',         value: recent ? Math.min(10, (recent.finalScore ?? 0) + 0.5) : 0 },
    { skill: 'Speed',         value: recent ? Math.max(0,  (recent.finalScore ?? 0) - 0.5) : 0 },
  ];

  // Gemini pro-tip: last feedback from the most recent interview's questions
  const lastFeedback = recent?.lastFeedback || null;
  const proTip = lastFeedback
    || (recent
        ? `Based on your last ${recent.role} interview, focus on improving your weakest areas to boost your score above ${Math.ceil(avgScore + 0.5)}/10.`
        : "Complete an interview to get your personalized AI coaching tip.");

  // Recent activity table (last 5)
  const recentActivity = completed.slice(0, 5);

  // ── Empty state ──────────────────────────────────────────────
  if (!userData) {
    return (
      <div className="border border-yellow-400/20 rounded-[32px] bg-black p-12 text-center">
        <BsRobot size={48} className="text-yellow-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Sign in to see your dashboard</h3>
        <p className="text-gray-400">Your performance data will appear here after you complete interviews.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-yellow-400/20 rounded-[32px] bg-black p-12 text-center">
        <div className="flex gap-2 justify-center items-center">
          {[0,1,2].map(i => (
            <motion.span key={i} className="w-3 h-3 bg-yellow-400 rounded-full block"
              animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }} />
          ))}
        </div>
        <p className="text-gray-500 mt-4 text-sm">Loading your performance data...</p>
      </div>
    );
  }

  if (completed.length === 0) {
    return (
      <div className="border border-yellow-400/20 rounded-[32px] bg-black p-12 text-center">
        <FaTrophy size={48} className="text-yellow-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">No interviews yet</h3>
        <p className="text-gray-400 mb-6">Complete your first interview to unlock your performance dashboard.</p>
        <button onClick={() => navigate('/interview')} className="bg-yellow-400 text-black px-8 py-3 rounded-2xl font-bold hover:bg-yellow-300 transition">
          Start Interview
        </button>
      </div>
    );
  }

  return (
    <div className="border border-yellow-400/20 rounded-[32px] bg-black p-6 sm:p-8">

      {/* Section Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <HiSparkles className="text-yellow-400" size={20} />
          <span className="text-yellow-400 text-sm font-semibold tracking-widest uppercase">Live Dashboard</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white">Your Interview <span className="text-yellow-400">Growth</span></h2>
        <p className="text-gray-400 mt-2">Track your progress and AI-driven insights from previous sessions.</p>
      </div>

      {/* 4-Tile Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Tile 1: Growth Trend */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="bg-[#0a0a0a] border border-white/10 rounded-[24px] p-6 hover:border-yellow-400/30 transition-all"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-bold text-lg">Growth Trend</h3>
            <span className="text-xs bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded-full font-semibold">
              Avg. Accuracy: {avgAccuracy}%
            </span>
          </div>
          <p className="text-gray-500 text-xs mb-5">Confidence score over sessions</p>
          {trendData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="yellowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ffff00" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ffff00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<YellowTooltip />} />
                <Area type="monotone" dataKey="score" stroke="#ffff00" strokeWidth={2.5} fill="url(#yellowGrad)" dot={{ fill: '#ffff00', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-gray-600 text-sm">Complete 2+ interviews to see trend</p>
            </div>
          )}
        </motion.div>

        {/* Tile 2: Skill Matrix (Radar) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#0a0a0a] border border-white/10 rounded-[24px] p-6 hover:border-yellow-400/30 transition-all"
        >
          <h3 className="text-white font-bold text-lg mb-1">Skill Matrix</h3>
          <p className="text-gray-500 text-xs mb-4">Based on your most recent session</p>
          <ResponsiveContainer width="100%" height={185}>
            <RadarChart data={radarData} outerRadius={70}>
              <PolarGrid stroke="#ffffff10" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
              <Radar name="Skills" dataKey="value" stroke="#ffff00" fill="#ffff00" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Tile 3: Recent Activity Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#0a0a0a] border border-white/10 rounded-[24px] p-6 hover:border-yellow-400/30 transition-all"
        >
          <h3 className="text-white font-bold text-lg mb-4">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-white/5">
                  <th className="text-left pb-3 font-medium">Role & Name</th>
                  <th className="text-left pb-3 font-medium">Sector</th>
                  <th className="text-left pb-3 font-medium">Enrollment Time</th>
                  <th className="text-center pb-3 font-medium">Score</th>
                  <th className="text-right pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentActivity.map((iv, idx) => (
                  <tr key={iv._id} className="hover:bg-white/5 transition">
                    <td className="py-3">
                      <p className="text-white font-medium truncate max-w-[110px]">{iv.role}</p>
                      <p className="text-gray-500 text-[10px] truncate max-w-[110px]">{userData?.name || 'User'}</p>
                    </td>
                    <td className="py-3 text-gray-400 text-xs capitalize">
                      {iv.mode || 'N/A'}
                    </td>
                    <td className="py-3 text-gray-400 text-xs">
                      {new Date(iv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      <span className="block text-gray-500 text-[10px] mt-0.5">
                        {new Date(iv.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full font-bold text-xs">
                        {iv.finalScore ?? 0}/10
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => navigate(`/report/${iv._id}`)}
                        className="text-yellow-400 hover:text-yellow-300 transition flex items-center gap-1 ml-auto text-xs font-semibold"
                      >
                        View <BsArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Tile 4: Gemini Pro-Tip (Frosted Glass) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[24px] p-6 text-black relative overflow-hidden"
        >
          {/* Yellow glow blob */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2 mb-4 relative z-10">
            <div className="bg-black text-yellow-400 p-2 rounded-xl">
              <BsRobot size={18} />
            </div>
            <div>
              <p className="font-bold text-black text-sm tracking-tight">XAnalysis Pro</p>
              <p className="text-black/50 text-xs">Personalized coaching</p>
            </div>
          </div>

          <blockquote className="text-black/80 text-sm leading-relaxed font-medium relative z-10 border-l-2 border-yellow-400 pl-4">
            {proTip}
          </blockquote>

          {recent && (
            <div className="mt-4 pt-4 border-t border-black/10 flex items-center gap-2 relative z-10">
              <span className="text-xs bg-black text-yellow-400 px-3 py-1 rounded-full font-semibold">
                {recent.role}
              </span>
              <span className="text-xs text-black/50">Last session score: {recent.finalScore}/10</span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default PerformanceDashboard;
