import { badges, getBadgeForPoints, getNextBadge } from "@/data/mockData";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, BookOpen, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const ProfilePanel = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({ completed: 0, inProgress: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !isAuthenticated) return;

    const fetchStats = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('Enrollment')
        .select('status, progress')
        .eq('userId', user.id);

      if (data) {
        let completed = 0;
        let inProgress = 0;
        data.forEach(e => {
          if (e.status === 'completed' || e.progress === 100) {
            completed++;
          } else {
            inProgress++;
          }
        });
        setStats({ completed, inProgress });
      }
      setIsLoading(false);
    };

    fetchStats();

    const channel = supabase.channel(`stats-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Enrollment', filter: `userId=eq.${user.id}` }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAuthenticated]);

  if (!user) return null;

  const currentBadge = getBadgeForPoints(user.totalPoints || 0);
  const nextBadge = getNextBadge(user.totalPoints || 0);
  const progressToNext = nextBadge
    ? (((user.totalPoints || 0) - currentBadge.points) / (nextBadge.points - currentBadge.points)) * 100
    : 100;

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <img
          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
          alt={user.name}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-accent/30"
        />
        <div>
          <h3 className="font-heading font-bold text-lg text-card-foreground">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Points */}
      <div className="bg-gradient-hero rounded-lg p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">Total Points</span>
          </div>
          <span className="text-2xl font-heading font-bold">{user.totalPoints || 0}</span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs opacity-80 mb-1.5">
            <span>{currentBadge.icon} {currentBadge.name}</span>
            {nextBadge && <span>{nextBadge.icon} {nextBadge.name}</span>}
          </div>
          <div className="w-full bg-primary-foreground/20 rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
          <span className="text-lg font-heading font-bold text-foreground">
            {isLoading ? "..." : stats.completed}
          </span>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <BookOpen className="h-5 w-5 mx-auto mb-1 text-info" />
          <span className="text-lg font-heading font-bold text-foreground">
            {isLoading ? "..." : stats.inProgress}
          </span>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h4 className="font-heading font-semibold text-sm text-card-foreground mb-3">Badge Levels</h4>
        <div className="space-y-2">
          {badges.map((badge) => (
            <div
              key={badge.name}
              className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${(user.totalPoints || 0) >= badge.points
                ? "bg-accent/10 text-foreground"
                : "text-muted-foreground opacity-50"
                }`}
            >
              <span className="text-lg">{badge.icon}</span>
              <span className="font-medium flex-1">{badge.name}</span>
              <span className="text-xs">{badge.points} pts</span>
              {(user.totalPoints || 0) >= badge.points && (
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePanel;
