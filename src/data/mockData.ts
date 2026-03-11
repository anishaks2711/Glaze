export interface Freelancer {
  id: string;
  name: string;
  username: string;
  avatar: string;
  service: string;
  rating: number;
  reviewCount: number;
  location: string;
  bio: string;
  followers: number;
  following: number;
  postsCount: number;
  tags: string[];
  trending: boolean;
  reviews: Review[];
  portfolio: MediaItem[];
  clientPosts: MediaItem[];
}

export interface Review {
  id: string;
  clientName: string;
  clientAvatar: string;
  videoThumbnail: string;
  rating: number;
  text: string;
  date: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  thumbnail: string;
  url: string;
  caption: string;
}

const avatarColors = ['E8927C', 'F4A261', 'E76F51', 'DC5303', 'D4A373', 'CB997E'];

const generateAvatar = (name: string, idx: number) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=${avatarColors[idx % avatarColors.length]}`;

const generateThumbnail = (seed: string, idx: number) => {
  const colors = ['DC5303', 'E8927C', 'F4A261', 'CB997E', 'D4A373', 'E76F51'];
  return `https://placehold.co/400x400/${colors[idx % colors.length]}/fff?text=${encodeURIComponent(seed.charAt(0))}`;
};

export const services = [
  'All',
  'Photography',
  'Videography',
  'Makeup Artist',
  'Hair Stylist',
  'Nail Artist',
  'Tattoo Artist',
  'Personal Trainer',
  'Yoga Instructor',
  'Chef',
  'DJ',
  'Graphic Designer',
  'Interior Designer',
];

export const freelancers: Freelancer[] = [
  {
    id: '1',
    name: 'Aria Chen',
    username: 'ariashootsco',
    avatar: generateAvatar('Aria Chen', 0),
    service: 'Photography',
    rating: 4.9,
    reviewCount: 234,
    location: 'Los Angeles, CA',
    bio: 'Capturing moments that last forever ✨ Wedding & portrait specialist',
    followers: 12400,
    following: 340,
    postsCount: 487,
    tags: ['Wedding', 'Portrait', 'Editorial'],
    trending: true,
    reviews: Array.from({ length: 6 }, (_, i) => ({
      id: `r1-${i}`,
      clientName: ['Emma W.', 'Sarah L.', 'Mike T.', 'Jess P.', 'David K.', 'Nina R.'][i],
      clientAvatar: generateAvatar(['Emma', 'Sarah', 'Mike', 'Jess', 'David', 'Nina'][i], i),
      videoThumbnail: generateThumbnail('Review', i),
      rating: [5, 5, 4, 5, 5, 4][i],
      text: ['Amazing photographer!', 'Best wedding photos ever', 'So professional', 'Loved every shot', 'Highly recommend', 'Incredible talent'][i],
      date: '2024-01-15',
    })),
    portfolio: Array.from({ length: 9 }, (_, i) => ({
      id: `p1-${i}`,
      type: i % 3 === 0 ? 'video' : 'image',
      thumbnail: generateThumbnail('Portfolio', i),
      url: '',
      caption: `Portfolio piece ${i + 1}`,
    })),
    clientPosts: Array.from({ length: 6 }, (_, i) => ({
      id: `c1-${i}`,
      type: 'image',
      thumbnail: generateThumbnail('Client', i),
      url: '',
      caption: `Client share ${i + 1}`,
    })),
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    username: 'marcusbeats',
    avatar: generateAvatar('Marcus Johnson', 1),
    service: 'DJ',
    rating: 4.8,
    reviewCount: 189,
    location: 'Miami, FL',
    bio: 'Making your events unforgettable 🎵 House | Hip-Hop | Afrobeats',
    followers: 8900,
    following: 220,
    postsCount: 312,
    tags: ['Events', 'Weddings', 'Club'],
    trending: true,
    reviews: Array.from({ length: 4 }, (_, i) => ({
      id: `r2-${i}`,
      clientName: ['Tom H.', 'Lisa M.', 'Raj P.', 'Amy S.'][i],
      clientAvatar: generateAvatar(['Tom', 'Lisa', 'Raj', 'Amy'][i], i),
      videoThumbnail: generateThumbnail('DJ Review', i),
      rating: 5,
      text: ['Best DJ ever!', 'Party was incredible', 'Everyone danced all night', 'Booking again!'][i],
      date: '2024-02-10',
    })),
    portfolio: Array.from({ length: 8 }, (_, i) => ({
      id: `p2-${i}`,
      type: i % 2 === 0 ? 'video' : 'image',
      thumbnail: generateThumbnail('Beat', i),
      url: '',
      caption: `Set ${i + 1}`,
    })),
    clientPosts: Array.from({ length: 5 }, (_, i) => ({
      id: `c2-${i}`,
      type: 'image',
      thumbnail: generateThumbnail('Party', i),
      url: '',
      caption: `Event highlight ${i + 1}`,
    })),
  },
  {
    id: '3',
    name: 'Priya Sharma',
    username: 'priyaglam',
    avatar: generateAvatar('Priya Sharma', 2),
    service: 'Makeup Artist',
    rating: 4.9,
    reviewCount: 312,
    location: 'New York, NY',
    bio: 'Bridal & editorial MUA 💄 Making you feel your best',
    followers: 23100,
    following: 410,
    postsCount: 654,
    tags: ['Bridal', 'Editorial', 'SFX'],
    trending: true,
    reviews: Array.from({ length: 5 }, (_, i) => ({
      id: `r3-${i}`,
      clientName: ['Kate B.', 'Mia R.', 'Zoe L.', 'Ava T.', 'Lily N.'][i],
      clientAvatar: generateAvatar(['Kate', 'Mia', 'Zoe', 'Ava', 'Lily'][i], i),
      videoThumbnail: generateThumbnail('Glam', i),
      rating: 5,
      text: ['Stunning work!', 'Felt like a queen', 'Pure magic', 'So talented', 'The best in NYC'][i],
      date: '2024-03-05',
    })),
    portfolio: Array.from({ length: 12 }, (_, i) => ({
      id: `p3-${i}`,
      type: i % 4 === 0 ? 'video' : 'image',
      thumbnail: generateThumbnail('Makeup', i),
      url: '',
      caption: `Look ${i + 1}`,
    })),
    clientPosts: Array.from({ length: 8 }, (_, i) => ({
      id: `c3-${i}`,
      type: 'image',
      thumbnail: generateThumbnail('Bride', i),
      url: '',
      caption: `Client look ${i + 1}`,
    })),
  },
  {
    id: '4',
    name: 'Jake Rivera',
    username: 'jakeinkco',
    avatar: generateAvatar('Jake Rivera', 3),
    service: 'Tattoo Artist',
    rating: 4.7,
    reviewCount: 156,
    location: 'Austin, TX',
    bio: 'Fine line & blackwork specialist 🖋️ By appointment only',
    followers: 15600,
    following: 180,
    postsCount: 389,
    tags: ['Fine Line', 'Blackwork', 'Floral'],
    trending: true,
    reviews: Array.from({ length: 4 }, (_, i) => ({
      id: `r4-${i}`,
      clientName: ['Chris D.', 'Sam W.', 'Alex M.', 'Jordan K.'][i],
      clientAvatar: generateAvatar(['Chris', 'Sam', 'Alex', 'Jordan'][i], i),
      videoThumbnail: generateThumbnail('Ink', i),
      rating: [5, 4, 5, 5][i],
      text: ['Incredible detail', 'Love my new tattoo', 'So precise', 'True artist'][i],
      date: '2024-01-20',
    })),
    portfolio: Array.from({ length: 9 }, (_, i) => ({
      id: `p4-${i}`,
      type: 'image',
      thumbnail: generateThumbnail('Tattoo', i),
      url: '',
      caption: `Design ${i + 1}`,
    })),
    clientPosts: Array.from({ length: 6 }, (_, i) => ({
      id: `c4-${i}`,
      type: 'image',
      thumbnail: generateThumbnail('Healed', i),
      url: '',
      caption: `Healed tattoo ${i + 1}`,
    })),
  },
  {
    id: '5',
    name: 'Luna Park',
    username: 'lunastylez',
    avatar: generateAvatar('Luna Park', 4),
    service: 'Hair Stylist',
    rating: 4.8,
    reviewCount: 278,
    location: 'San Francisco, CA',
    bio: 'Color specialist 🌈 Transformations are my thing',
    followers: 19200,
    following: 305,
    postsCount: 521,
    tags: ['Color', 'Balayage', 'Bridal'],
    trending: true,
    reviews: Array.from({ length: 5 }, (_, i) => ({
      id: `r5-${i}`,
      clientName: ['Rachel G.', 'Tina F.', 'Kim L.', 'Beth A.', 'Chloe W.'][i],
      clientAvatar: generateAvatar(['Rachel', 'Tina', 'Kim', 'Beth', 'Chloe'][i], i),
      videoThumbnail: generateThumbnail('Hair', i),
      rating: 5,
      text: ['Love my new color!', 'Best stylist ever', 'Magic hands', 'So happy!', 'Absolutely stunning'][i],
      date: '2024-02-28',
    })),
    portfolio: Array.from({ length: 9 }, (_, i) => ({
      id: `p5-${i}`,
      type: i % 3 === 0 ? 'video' : 'image',
      thumbnail: generateThumbnail('Style', i),
      url: '',
      caption: `Transformation ${i + 1}`,
    })),
    clientPosts: Array.from({ length: 7 }, (_, i) => ({
      id: `c5-${i}`,
      type: 'image',
      thumbnail: generateThumbnail('Happy', i),
      url: '',
      caption: `Client result ${i + 1}`,
    })),
  },
  {
    id: '6',
    name: 'Omar Farouk',
    username: 'omarfilms',
    avatar: generateAvatar('Omar Farouk', 5),
    service: 'Videography',
    rating: 4.9,
    reviewCount: 145,
    location: 'Chicago, IL',
    bio: 'Cinematic storytelling 🎬 Wedding films & brand content',
    followers: 11300,
    following: 198,
    postsCount: 267,
    tags: ['Wedding Films', 'Brand', 'Documentary'],
    trending: false,
    reviews: Array.from({ length: 4 }, (_, i) => ({
      id: `r6-${i}`,
      clientName: ['Dan R.', 'Sophie M.', 'Ian C.', 'Yuki T.'][i],
      clientAvatar: generateAvatar(['Dan', 'Sophie', 'Ian', 'Yuki'][i], i),
      videoThumbnail: generateThumbnail('Film', i),
      rating: 5,
      text: ['Cinematic masterpiece', 'We cried watching', 'So beautiful', 'Oscar-worthy!'][i],
      date: '2024-03-10',
    })),
    portfolio: Array.from({ length: 6 }, (_, i) => ({
      id: `p6-${i}`,
      type: 'video',
      thumbnail: generateThumbnail('Cinema', i),
      url: '',
      caption: `Film ${i + 1}`,
    })),
    clientPosts: Array.from({ length: 4 }, (_, i) => ({
      id: `c6-${i}`,
      type: 'video',
      thumbnail: generateThumbnail('Wedding', i),
      url: '',
      caption: `Client film ${i + 1}`,
    })),
  },
  {
    id: '7',
    name: 'Nails by Gemma',
    username: 'gemmanails',
    avatar: generateAvatar('Gemma Nails', 0),
    service: 'Nail Artist',
    rating: 4.8,
    reviewCount: 198,
    location: 'London, UK',
    bio: 'Nail art is my canvas 💅 Press-ons & gel specialist',
    followers: 14700,
    following: 256,
    postsCount: 445,
    tags: ['Gel', 'Nail Art', 'Press-ons'],
    trending: false,
    reviews: Array.from({ length: 4 }, (_, i) => ({
      id: `r7-${i}`,
      clientName: ['Jade P.', 'Holly M.', 'Fiona K.', 'Grace L.'][i],
      clientAvatar: generateAvatar(['Jade', 'Holly', 'Fiona', 'Grace'][i], i),
      videoThumbnail: generateThumbnail('Nails', i),
      rating: [5, 5, 4, 5][i],
      text: ['Obsessed!', 'So creative', 'Best nails ever', 'Amazing detail'][i],
      date: '2024-02-14',
    })),
    portfolio: Array.from({ length: 9 }, (_, i) => ({
      id: `p7-${i}`,
      type: 'image',
      thumbnail: generateThumbnail('Nail', i),
      url: '',
      caption: `Design ${i + 1}`,
    })),
    clientPosts: Array.from({ length: 5 }, (_, i) => ({
      id: `c7-${i}`,
      type: 'image',
      thumbnail: generateThumbnail('Manicure', i),
      url: '',
      caption: `Client nails ${i + 1}`,
    })),
  },
  {
    id: '8',
    name: 'Chef Aiden',
    username: 'chefaiden',
    avatar: generateAvatar('Chef Aiden', 1),
    service: 'Chef',
    rating: 4.9,
    reviewCount: 89,
    location: 'Portland, OR',
    bio: 'Private dining experiences 🍽️ Farm-to-table specialist',
    followers: 6800,
    following: 145,
    postsCount: 198,
    tags: ['Private Dining', 'Farm-to-Table', 'Events'],
    trending: false,
    reviews: Array.from({ length: 3 }, (_, i) => ({
      id: `r8-${i}`,
      clientName: ['Paul S.', 'Maria G.', 'Ben L.'][i],
      clientAvatar: generateAvatar(['Paul', 'Maria', 'Ben'][i], i),
      videoThumbnail: generateThumbnail('Food', i),
      rating: 5,
      text: ['Incredible meal', 'Best dinner party', 'Mind-blowing flavors'][i],
      date: '2024-03-01',
    })),
    portfolio: Array.from({ length: 6 }, (_, i) => ({
      id: `p8-${i}`,
      type: 'image',
      thumbnail: generateThumbnail('Dish', i),
      url: '',
      caption: `Dish ${i + 1}`,
    })),
    clientPosts: Array.from({ length: 4 }, (_, i) => ({
      id: `c8-${i}`,
      type: 'image',
      thumbnail: generateThumbnail('Dinner', i),
      url: '',
      caption: `Client dinner ${i + 1}`,
    })),
  },
];
