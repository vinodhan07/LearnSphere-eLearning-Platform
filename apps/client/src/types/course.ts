export interface Course {
    id: string;
    title: string;
    description?: string;
    tags: string[];
    image?: string;
    published: boolean;
    website?: string;
    visibility: 'EVERYONE' | 'SIGNED_IN';
    accessRule: 'OPEN' | 'INVITE' | 'PAID';
    price?: number;
    currency?: string;
    responsibleAdminId: string;
    createdAt: string;
    updatedAt: string;
    viewsCount: number;
    responsibleAdmin?: {
        id: string;
        name: string;
        avatar?: string;
    };
    enrolledCount?: number;
    lessonsCount?: number;
    // Client-specific/Optional
    progress?: number;
    totalDuration?: number;
    duration?: string; // Client helper
    rating?: number; // Client helper
    reviewCount?: number; // Client helper
    canStart?: boolean;
    enrollmentStatus?: string;
}

export interface Attachment {
    id: string;
    lessonId: string;
    name: string;
    url: string;
    size?: number;
    type?: string;
    createdAt: string;
}

export interface Lesson {
    id: string;
    courseId: string;
    title: string;
    type: 'video' | 'document' | 'image' | 'quiz';
    content?: string;
    videoUrl?: string;
    duration?: number;
    order: number;
    published: boolean;
    preview: boolean;
    createdAt: string;
    updatedAt: string;
    completed?: boolean;
    attachments?: Attachment[];
}
