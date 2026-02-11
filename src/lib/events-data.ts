export type EventStatus = "upcoming" | "live" | "past";
export type EventCategory = "AMA" | "Quiz & Games" | "X Space" | "Workshop" | "Meetup" | "Builders Showcase" | "Educational";

export interface RialoEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  date: string; // ISO
  host: string;
  platform: string;
  joinLink?: string;
  shareLink?: string;
  recapSummary?: string;
  recordingLink?: string;
  rsvpCount: number;
}

export const CATEGORIES: EventCategory[] = [
  "AMA", "Quiz & Games", "X Space", "Workshop", "Meetup", "Builders Showcase", "Educational"
];

export const mockEvents: RialoEvent[] = [
  {
    id: "1",
    title: "Confidentiality in Africa's Finance",
    description: "Privacy meets utility, the future we want! From Oxfairblock's encrypted shields to RialoHQ's real world build, community vibes. Got questions on teams, testnets live, growth paths, milestones in mind?",
    category: "X Space",
    status: "upcoming",
    date: "2026-02-12T14:00:00Z",
    host: "RialoAfrica",
    platform: "Twitter Space",
    joinLink: "#",
    shareLink: "#",
    rsvpCount: 24,
  },
  {
    id: "2",
    title: "Rialo Builders Showcase #3",
    description: "Join the third edition of Rialo Builders Showcase where community devs present their latest projects built on the Rialo ecosystem. Live demos, Q&A, and feedback sessions.",
    category: "Builders Showcase",
    status: "live",
    date: "2026-02-11T10:00:00Z",
    host: "RialoHQ",
    platform: "Google Meet",
    joinLink: "#",
    rsvpCount: 56,
  },
  {
    id: "3",
    title: "Intro to Rialo Smart Contracts",
    description: "A beginner-friendly workshop covering the fundamentals of developing smart contracts within the Rialo ecosystem. Hands-on coding session included.",
    category: "Workshop",
    status: "upcoming",
    date: "2026-02-18T16:00:00Z",
    host: "MrNetwork",
    platform: "Discord Stage",
    joinLink: "#",
    rsvpCount: 38,
  },
  {
    id: "4",
    title: "Rialo Community Trivia Night",
    description: "Test your knowledge about the Rialo ecosystem! Prizes for top scorers. Fun, interactive, and educational.",
    category: "Quiz & Games",
    status: "past",
    date: "2026-02-05T19:00:00Z",
    host: "CommunityDAO",
    platform: "Twitter Space",
    recapSummary: "Over 120 participants joined! Top 3 winners received RIALO tokens. Questions covered tokenomics, roadmap milestones, and community governance.",
    recordingLink: "#",
    rsvpCount: 120,
  },
  {
    id: "5",
    title: "AMA with Rialo Core Team",
    description: "Ask the core team anything about Rialo's roadmap, partnerships, and upcoming features. Unfiltered, transparent, and community-first.",
    category: "AMA",
    status: "past",
    date: "2026-01-28T15:00:00Z",
    host: "RialoHQ",
    platform: "Twitter Space",
    recapSummary: "Key announcements: Testnet v2 launch confirmed for March, new partnership with African fintech incubator revealed.",
    recordingLink: "#",
    rsvpCount: 89,
  },
  {
    id: "6",
    title: "Lagos Web3 Community Meetup",
    description: "In-person meetup for Rialo community members in Lagos. Networking, talks, and workshops. Food and drinks provided.",
    category: "Meetup",
    status: "upcoming",
    date: "2026-03-01T13:00:00Z",
    host: "RialoAfrica",
    platform: "In-Person (Lagos)",
    joinLink: "#",
    rsvpCount: 42,
  },
  {
    id: "7",
    title: "DeFi Fundamentals for Africa",
    description: "Understanding decentralized finance and its impact on African economies. Practical examples and use cases from the Rialo ecosystem.",
    category: "Educational",
    status: "past",
    date: "2026-01-20T11:00:00Z",
    host: "RialoEdu",
    platform: "YouTube Live",
    recapSummary: "Comprehensive session covering DeFi basics, yield farming, and how Rialo integrates DeFi primitives for African markets.",
    recordingLink: "#",
    rsvpCount: 67,
  },
];
