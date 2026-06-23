import React from 'react';

export const UrgentIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <path d="M3 12h4l3 5 4-10 3 5h4" />
  </svg>
);

export const ProjectIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4m-1.5-2.5h3" />
    <path d="M12 6L9 11h6L12 6z" />
    <path d="M6 14l6-4.5L18 14" />
    <path d="M6 14v8h12v-8" />
    <path d="M10 22v-3a2 2 0 0 1 4 0v3" />
    <circle cx="12" cy="14" r="1.5" />
    <path d="M4 22h16" />
  </svg>
);

export const PrayerIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 21l2.5-6v-3c0-2 1-3 2.5-3" />
    <path d="M17 21l-2.5-6v-3c0-2-1-3-2.5-3" />
    <path d="M12 9V3" />
    <path d="M12 9l-2 2" />
  </svg>
);
