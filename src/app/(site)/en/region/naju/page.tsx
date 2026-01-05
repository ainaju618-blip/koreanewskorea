'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Sun, Landmark, Vote, GraduationCap, Map, Navigation, UtensilsCrossed,
  Calendar, Newspaper as NewspaperIcon, ChevronRight, Star, Globe, Share2, Mail
} from 'lucide-react';

// City Hall News
const CITY_HALL_NEWS = [
  {
    id: 1,
    title: 'Mayor Yoon visits Innovation City site for inspection',
    date: '2023-10-27',
    category: 'Press Release',
  },
  {
    id: 2,
    title: 'Notice on changes to garbage collection schedule',
    date: '2023-10-26',
    category: 'Announcement',
  },
];

// Council News
const COUNCIL_NEWS = [
  { id: 1, title: '254th Regular Session Agenda Approved', time: 'Today' },
  { id: 2, title: 'Public Hearing on Budget Review', time: 'Yesterday' },
];

// Education News
const EDUCATION_NEWS = [
  { id: 1, title: 'High School Admission Guide 2024', isNew: true },
  { id: 2, title: 'Naju Science Festival Winners' },
];

// Travel Spots
const TRAVEL_SPOTS = [
  {
    id: 1,
    name: 'Yeongsan River',
    subtitle: 'Historical Waterway',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH965QHWXPT0qNlz731WP1TFrJsLdOAnEc-aS0FHct4jLXcLngbxVscj6H1sxhxTb3HknWk_giIv9mr2H-O92Gk7Q7oY8Amegohi2VQLVMKHPOnicUYd7eADyW5s60wriq7Xou9xXJm9A-0fjciocdkLUuFo9UNosu9K3V7gfdXG0dyqzD2iXRaq1e0Sduh02hVaMaqXUDY6XmROOduwo87qk57ocDfsIgErPE-RKF3YAUgmpvgWZ9zCFgKRdzS-VA3f9aURy-EDPM',
  },
  {
    id: 2,
    name: 'National Museum',
    subtitle: 'Ancient Bannam Tombs',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA98QEUEiJD5kyfLsNOzjIBrOTlpgX4g1PSOpJyffIh1NdV2xVGPMOT6xkZdtDbzgCNSPKMbnuHWSy85K99SUZPLRHQRGCuu8Gq1qGRTF_zOBYbaO14Kmo3HStx6DNWb9Bpez_1m0Ai54XREg8iEnmHTWeIPGwUqNlLAwHeKrqoWDFhLXZuICGNWFLbAE44L23CWJcWMPehc-W1KBPUeK4amZhFWI4J3h1GXWFUFQvzqmvb-EhxXHaxAnD2h_VamG_xHXXQOfmChSMH',
  },
];

// Food & Culture
const FOOD_CULTURE = [
  {
    id: 1,
    name: 'Naju Gomtang Street',
    description: 'Famous clear beef soup alley near Geumseonggwan.',
    rating: 4.8,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1ZFF6SqbsjlMwtfL2LH-YiMG5ccg7zN0jX8Gsnv4dkY45CMA_JHkLYB6kNiB4mPmpX6tmM01kB0b9infuvCTrQKCDMINSZ1G8LuGz4MlTaJGTRcI-QBBe3jsQOhLCTEobXbdOmJ2u9puKe6qxdf5-gUB2utijWdR3XfAFDVwSnTYW3yJHpkLdp6cg3-WdMy5WXVrtBbgPdYO5MG9HWZJvCQrW2Lc-cD9oiXYXh2bkQBjgLuONLk8YOW8qrKcAhd_snpEAcVG87BfQ',
  },
  {
    id: 2,
    name: 'Premium Naju Pears',
    description: 'Seasonal specials direct from local orchards.',
    rating: 4.9,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfrU7n6Dozki72nOvT4V-dtwMSvNsDwxxHBIEKMwS42FaQEJYtLkvUu7HYf5mNe40J65BUp-AguKmJl_eWB3KKSoiIyj1bPL70nqf_ctsdmlc07PX921iFrGXR956LxLuQG7kBqjCf2TUB4cXsqTR-vaeD1AbL-ki7F8KfSw3MlpcJRN40lzAvK21X595oFokxOz7uThqjT35ecJ58YkFk2tF8RAT6VC3sY5-XcNCNKL4Hq4KtjxAScScRAE_cqoxZKn3hdWNKshWe',
  },
  {
    id: 3,
    name: 'Geumseonggwan',
    description: 'Historic guest house from the Joseon Dynasty.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnY4BRpakoQia_oUvvrpT0oG_AxUswwa45n9b86TxH66bGHr8Xby0mxp8WzEe24CPaEj5jQ0lSPMqwfpmqiI7TGKJp3DE5Gx79VbyApCUbkG7XJ0b7oVvgHLMIXXSM1Lm7rw0VHaCmgKvy2o3CDeVYIW5SZao166kuDUSiUwDay0BbXWSOSFVtdoIiwWKGncxQoglwu6H4jpjMH7n3PCy33ORhmW1nHzWcf7ey4wyUQtsfAjbaJwZ-6VGx7qRneUDiLqGQMgAoOjtC',
  },
];

// Neighborhood News
const NEIGHBORHOOD_NEWS = [
  {
    id: 1,
    title: 'New community center opens in Bitgaram-dong with library and gym',
    time: '2 hours ago',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkiCcIVwLKs6JQSS_Z-1Jtwd1YIr-8MP-dFcMWbHrWRVQ6yvSUxc5oIJN-rcvfaSdsWq4hYKIGtwUONuDnS8wtjr_cG_v1uFUuRbWjyyhSTmSu4eZJRVOnOs8aKazoM5-Ogg4ap4zmr14LfZQ9oL5cVsrQrFbxz8eG0QPP9DIFuKkCLQkGBrPph7iBbDaLn-RvcS2bF3DHSa6bxPDCnt_tZ36GmwY3eNAYXYK4KLDtAYWaUfeMrjhxxE86IaXZIo2ApdWEF9AT1RfZ',
  },
  {
    id: 2,
    title: 'Local volunteers gather for weekend park cleanup drive',
    time: '5 hours ago',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLiOOlQtPHReLXVjqcR7NOIjlQyPOurFti1ZnZEmufm2d3-oebmg5QCQqmZYTkdw68Jl12vAAgtrv4Aq7ZFmf2gKYTA6gVDrVP25HQvsHXpPZZGwyBQ0Hqo8MMEdQsViYANMvzSFAFNQUUCF2UfsfVl5bkR1S80k339KwSVdIHlsw3oTpXivCdoFKl9n_u2q_0zkj21Zkf1Q8sz3R76a92p3I-ODD5SHIDps1QkZhM0uIz0wgrasBFH4-eDjBtIB07kgJpavBcsFuJ',
  },
];

// Events
const EVENTS = [
  {
    id: 1,
    month: 'Oct',
    day: 28,
    title: 'Naju Fall Flower Festival',
    location: 'Riverside Park',
    time: '10:00 AM',
    isHighlight: true,
  },
  {
    id: 2,
    month: 'Nov',
    day: 2,
    title: 'Traditional Music Concert',
    location: 'Culture Arts Center',
    time: '7:00 PM',
  },
];

// Quick Access Categories
const QUICK_ACCESS = [
  { id: 'city', label: 'City Hall', emoji: '🏛️' },
  { id: 'travel', label: 'Travel', emoji: '🗺️' },
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'events', label: 'Events', emoji: '📅' },
];

export default function NajuCityEnglishPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:px-4 lg:py-6">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Weather Widget */}
            <section className="p-4">
              <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium opacity-90">Bitgaram-dong, Naju</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <h2 className="text-4xl font-bold">24°</h2>
                      <span className="text-lg font-medium mb-1 opacity-90">Sunny</span>
                    </div>
                    <p className="text-xs mt-2 opacity-80">Air Quality: Good • Humidity: 45%</p>
                  </div>
                  <Sun className="w-16 h-16 opacity-90" />
                </div>
              </div>
            </section>

            {/* Quick Access Chips */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 pb-4">
              {QUICK_ACCESS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveCategory(activeCategory === item.id ? null : item.id)}
                  className={`shrink-0 px-4 py-2 bg-white border rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === item.id
                      ? 'border-cyan-500 text-cyan-600 bg-cyan-50'
                      : 'border-gray-200 hover:border-cyan-500 hover:text-cyan-600'
                  }`}
                >
                  {item.emoji} {item.label}
                </button>
              ))}
            </div>

            {/* Administrative News Section */}
            <div className="px-4 space-y-4">
              {/* City Hall News */}
              <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-cyan-500" />
                    <h3 className="font-bold text-lg">City Hall News</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <ul className="space-y-3">
                  {CITY_HALL_NEWS.map((news) => (
                    <li key={news.id} className="group cursor-pointer">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-cyan-600 transition-colors">
                        {news.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{news.date} | {news.category}</p>
                    </li>
                  ))}
                </ul>
              </article>

              {/* Council & Education Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Council */}
                <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                    <Vote className="w-5 h-5 text-cyan-500" />
                    <h3 className="font-bold">Council News</h3>
                  </div>
                  <ul className="space-y-3">
                    {COUNCIL_NEWS.map((news) => (
                      <li key={news.id} className="flex justify-between items-start gap-2">
                        <span className="text-sm line-clamp-2">{news.title}</span>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded">
                          {news.time}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>

                {/* Education */}
                <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                    <GraduationCap className="w-5 h-5 text-cyan-500" />
                    <h3 className="font-bold">Education</h3>
                  </div>
                  <ul className="space-y-3">
                    {EDUCATION_NEWS.map((news) => (
                      <li key={news.id} className="flex justify-between items-start gap-2">
                        <span className="text-sm line-clamp-2">{news.title}</span>
                        {news.isNew && (
                          <span className="text-[10px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded font-bold">
                            New
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>

            {/* Explore Naju Header */}
            <div className="flex items-center gap-2 mt-6 px-4">
              <span className="h-6 w-1 bg-cyan-500 rounded-full"></span>
              <h2 className="text-xl font-bold text-gray-900">Explore Naju</h2>
            </div>

            {/* Travel Section */}
            <section className="px-4 mt-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-cyan-500" />
                    <h3 className="font-bold text-lg">Travel Hotspots</h3>
                  </div>
                  <Link href="#" className="text-xs text-gray-500 hover:text-cyan-600">View All</Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {TRAVEL_SPOTS.map((spot) => (
                    <div key={spot.id} className="group relative flex flex-col gap-2">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                        <Image
                          src={spot.image}
                          alt={spot.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <button className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-cyan-600 shadow-sm hover:bg-white transition-colors">
                          <Navigation className="w-3 h-3" />
                          Guide
                        </button>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-tight">{spot.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{spot.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Food & Culture Horizontal Scroll */}
            <section className="mt-4">
              <div className="flex items-center justify-between mb-3 px-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-cyan-500" />
                  Local Tastes
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 px-4">
                {FOOD_CULTURE.map((item) => (
                  <div
                    key={item.id}
                    className="shrink-0 w-60 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                  >
                    <div className="h-32 relative">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold">{item.name}</h4>
                        {item.rating && (
                          <span className="text-xs font-bold text-yellow-500 flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-yellow-500" />
                            {item.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1 px-4 lg:px-0 mt-4 lg:mt-0">
            {/* Neighborhood News */}
            <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <NewspaperIcon className="w-5 h-5 text-cyan-500" />
                <h3 className="font-bold text-lg">Neighborhood News</h3>
              </div>
              <div className="space-y-3">
                {NEIGHBORHOOD_NEWS.map((news) => (
                  <div key={news.id} className="flex gap-3 items-start">
                    <div className="w-16 h-16 rounded bg-gray-200 shrink-0 relative overflow-hidden">
                      <Image
                        src={news.image}
                        alt={news.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium line-clamp-2 leading-snug">{news.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{news.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Events Calendar */}
            <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-cyan-500" />
                <h3 className="font-bold text-lg">Upcoming Events</h3>
              </div>
              <div className="space-y-2">
                {EVENTS.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className={`flex flex-col items-center justify-center rounded w-12 h-12 shrink-0 ${
                      event.isHighlight
                        ? 'bg-cyan-50 text-cyan-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className="text-[10px] font-bold uppercase">{event.month}</span>
                      <span className="text-lg font-bold leading-none">{event.day}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{event.title}</h4>
                      <p className="text-xs text-gray-500">{event.location} • {event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 py-2 text-xs font-bold text-cyan-600 border border-cyan-200 rounded hover:bg-cyan-50 transition-colors">
                View Full Calendar
              </button>
            </article>
          </div>
        </div>
      </main>

      {/* English Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6 text-center mt-8">
        <h2 className="text-lg font-bold mb-4 text-cyan-500">Korea NEWS Naju</h2>
        <div className="flex justify-center gap-4 mb-6">
          <a href="#" className="text-gray-400 hover:text-cyan-500 transition-colors">
            <Globe className="w-5 h-5" />
          </a>
          <a href="#" className="text-gray-400 hover:text-cyan-500 transition-colors">
            <Share2 className="w-5 h-5" />
          </a>
          <a href="#" className="text-gray-400 hover:text-cyan-500 transition-colors">
            <Mail className="w-5 h-5" />
          </a>
        </div>
        <div className="text-xs text-gray-500 space-y-2">
          <div className="flex justify-center gap-3">
            <a href="#" className="hover:underline">About Us</a>
            <span className="w-px h-3 bg-gray-300 inline-block"></span>
            <a href="#" className="hover:underline font-bold">Privacy Policy</a>
            <span className="w-px h-3 bg-gray-300 inline-block"></span>
            <a href="#" className="hover:underline">Terms</a>
          </div>
          <p className="mt-4 leading-relaxed opacity-70">
            Registration No: Jeonnam-A-00123<br />
            Publisher: Korea NEWS Naju Branch<br />
            Contact: 061-333-1234
          </p>
          <p className="mt-4 opacity-50">© 2024 Korea NEWS Naju. All rights reserved.</p>
        </div>
      </footer>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
