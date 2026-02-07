import { Link } from "react-router-dom";
import { Clock, Users, Star, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Course } from "@/data/mockData";
import { motion } from "framer-motion";

interface CourseCardProps {
  course: Course;
  showProgress?: boolean;
  index?: number;
}

const CourseCard = ({ course, showProgress = false, index = 0 }: CourseCardProps) => {
  const getActionButton = () => {
    if (course.progress === 100) {
      return <Button size="sm" variant="outline" className="font-semibold text-success border-success/30">Completed ✓</Button>;
    }
    if (course.progress > 0) {
      return <Button size="sm" className="bg-gradient-hero text-primary-foreground font-semibold">Continue</Button>;
    }
    if (course.access === "PAID" && course.price) {
      return <Button size="sm" className="bg-gradient-accent text-accent-foreground font-semibold">Buy ${course.price}</Button>;
    }
    return <Button size="sm" className="bg-gradient-hero text-primary-foreground font-semibold">Start Course</Button>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link to={`/course/${course.id}`} className="block group">
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
          {/* Image */}
          <div className="relative h-44 overflow-hidden">
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 flex gap-1.5">
              {course.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-card/90 backdrop-blur-sm text-xs font-medium"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            {course.price && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-gradient-accent text-accent-foreground font-bold text-sm px-2.5 py-0.5">
                  ${course.price}
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <h3 className="font-heading font-bold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.shortDescription}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {course.duration}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {course.totalLessons} lessons
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {course.enrolledCount}
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.floor(course.rating) ? "fill-accent text-accent" : "text-border"}`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-foreground">{course.rating}</span>
              <span className="text-xs text-muted-foreground">({course.reviewCount})</span>
            </div>

            {/* Progress */}
            {showProgress && course.progress > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <img
                  src={course.instructorAvatar}
                  alt={course.instructor}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span className="text-xs text-muted-foreground">{course.instructor}</span>
              </div>
              <div onClick={(e) => e.preventDefault()}>
                {getActionButton()}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CourseCard;
