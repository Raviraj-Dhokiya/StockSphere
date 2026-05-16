import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import communityService from '../services/communityService';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await communityService.getUserProfile(id);
        setProfileData(res);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-green"></div></div>;
  }

  if (!profileData || !profileData.user) {
    return <div className="card p-8 text-center text-gray-500">Profile not found.</div>;
  }

  const { user, posts, portfolio } = profileData;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="card p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-accent-purple/20 to-accent-blue/20"></div>
        
        <div className="w-24 h-24 rounded-full bg-accent-purple flex items-center justify-center text-white text-3xl font-display font-bold z-10 border-4 border-dark-700 shadow-xl">
          {user.name.charAt(0).toUpperCase()}
        </div>
        
        <div className="z-10 text-center sm:text-left pt-2">
          <h1 className="font-display font-bold text-3xl text-white">{user.name}</h1>
          <p className="text-gray-400 mt-1">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Portfolio Preview */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-display font-semibold text-xl text-white mb-4">Public Portfolio</h2>
            {portfolio ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Return</p>
                  <p className={`font-mono font-bold text-xl ${portfolio.totalPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {portfolio.totalPnL >= 0 ? '+' : ''}{portfolio.pnlPercent?.toFixed(2)}%
                  </p>
                </div>
                
                {portfolio.topHoldings && portfolio.topHoldings.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Top Holdings</p>
                    <div className="space-y-2">
                      {portfolio.topHoldings.map(h => (
                        <Link key={h.symbol} to={`/stock/${h.symbol}`} className="flex justify-between items-center p-2 rounded bg-dark-800 hover:bg-dark-900 transition-colors">
                          <span className="font-mono font-bold text-sm text-white">{h.symbol}</span>
                          <span className={`text-xs font-mono ${h.pnlPercent >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                            {h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent?.toFixed(2)}%
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Portfolio is private or empty.</p>
            )}
          </div>
        </div>

        {/* Right Column: User's Posts */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-display font-semibold text-xl text-white mb-4">Activity</h2>
          {posts.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">No posts yet.</div>
          ) : (
            posts.map(post => (
              <div key={post._id} className="card p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {post.tags.map(tag => (
                      <Link key={tag} to={`/stock/${tag}`} className="text-xs font-mono text-accent-blue hover:underline bg-accent-blue-dim px-2 py-1 rounded">
                        ${tag}
                      </Link>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-surface-border">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    {post.likes.length}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    {post.commentCount} Comments
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
