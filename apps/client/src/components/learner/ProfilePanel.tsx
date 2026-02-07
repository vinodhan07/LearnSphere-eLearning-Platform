import { mockProfile, badges, getBadgeForPoints, getNextBadge } from "@/data/mockData";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, BookOpen, CheckCircle } from "lucide-react";

const ProfilePanel = () => {
  const profile = mockProfile;
  const currentBadge = getBadgeForPoints(profile.totalPoints);
  const nextBadge = getNextBadge(profile.totalPoints);
  const progressToNext = nextBadge
    ? ((profile.totalPoints - currentBadge.points) / (nextBadge.points - currentBadge.points)) * 100
    : 100;

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <img
          src={profile.avatar}
          alt={profile.name}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-accent/30"
        />
        <div>
          <h3 className="font-heading font-bold text-lg text-card-foreground">{profile.name}</h3>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      {/* Points */}
      <div className="bg-gradient-hero rounded-lg p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">Total Points</span>
          </div>
          <span className="text-2xl font-heading font-bold">{profile.totalPoints}</span>
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
          <span className="text-lg font-heading font-bold text-foreground">{profile.coursesCompleted}</span>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <BookOpen className="h-5 w-5 mx-auto mb-1 text-info" />
          <span className="text-lg font-heading font-bold text-foreground">{profile.coursesInProgress}</span>
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
              className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                profile.totalPoints >= badge.points
                  ? "bg-accent/10 text-foreground"
                  : "text-muted-foreground opacity-50"
              }`}
            >
              <span className="text-lg">{badge.icon}</span>
              <span className="font-medium flex-1">{badge.name}</span>
              <span className="text-xs">{badge.points} pts</span>
              {profile.totalPoints >= badge.points && (
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
