import React from 'react';
import { ArrowRight, Calendar } from 'lucide-react';
import { BLOG_POSTS } from '../data/clinicData';
import { BlogPostItem } from '../types';

interface InsightsBlogProps {
  onSelectArticle: (post: BlogPostItem) => void;
}

export const InsightsBlog: React.FC<InsightsBlogProps> = ({ onSelectArticle }) => {
  return (
    <section className="py-20 md:py-28 bg-[#F4F1EB] border-t border-[#D7D2C9]/60">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-[1px] w-6 bg-[#6F6B65]"></span>
              <span className="font-sans text-xs tracking-[0.2em] uppercase font-semibold text-[#6F6B65]">
                LATEST INSIGHTS
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#171717] leading-[1.1] tracking-tight">
              Dental Care Tips, <br />
              <span className="italic font-light">Stories & Updates</span>
            </h2>
          </div>

          <button
            onClick={() => onSelectArticle(BLOG_POSTS[0])}
            className="inline-flex items-center gap-2.5 bg-transparent hover:bg-[#171717] hover:text-[#F4F1EB] text-[#171717] px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider border border-[#D7D2C9] hover:border-[#171717] transition-all duration-300 group shrink-0"
          >
            <span>View All Articles</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        {/* 3 Editorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectArticle(post)}
              className="group bg-white rounded-2xl overflow-hidden border border-[#D7D2C9] shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col justify-between"
            >
              {/* Featured Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#E9E4DC]">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full font-sans text-[11px] font-semibold uppercase tracking-wider text-[#171717] border border-[#D7D2C9]">
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#171717] group-hover:text-[#6F6B65] transition-colors leading-snug mb-3">
                    {post.title}
                  </h3>
                  <p className="font-sans text-xs text-[#6F6B65] leading-relaxed line-clamp-2 mb-6">
                    {post.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#F4F1EB] text-xs text-[#6F6B65]">
                  <div className="flex items-center gap-1.5 font-sans">
                    <Calendar className="w-3.5 h-3.5 text-[#B9B1A5]" />
                    <span>{post.date}</span>
                  </div>
                  <span className="font-sans font-semibold text-[#171717] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Read article ➔
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};
