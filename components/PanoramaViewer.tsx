
import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { SliceCount } from '../types';

interface PanoramaViewerProps {
  stitchedImage: string;
  sliceCount: SliceCount;
  onBack: () => void;
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ stitchedImage, sliceCount, onBack }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // We create "virtual tiles" by rendering the same stitched image N times 
  // and using CSS positioning to show only one segment per slide.
  const slices = Array.from({ length: sliceCount });

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, offsetWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / offsetWidth);
      if (index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  };

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * scrollRef.current.offsetWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleSaveFull = () => {
    const link = document.createElement('a');
    link.download = `panorama-full-${Date.now()}.png`;
    link.href = stitchedImage;
    link.click();
  };

  // Advanced: Export individual slices as separate images
  const handleSaveIndividual = async () => {
    const img = new Image();
    img.src = stitchedImage;
    await img.decode();

    const sliceWidth = img.width / sliceCount;
    const canvas = document.createElement('canvas');
    canvas.width = sliceWidth;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    for (let i = 0; i < sliceCount; i++) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        i * sliceWidth, 0, sliceWidth, img.height, // Source
        0, 0, sliceWidth, img.height // Destination
      );
      
      const link = document.createElement('a');
      link.download = `tile-${i + 1}-of-${sliceCount}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      // Small delay to prevent browser blocking multiple downloads
      await new Promise(r => setTimeout(r, 200));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black select-none touch-none">
      {/* App Bar */}
      <div className="flex items-center justify-between p-4 bg-black border-b border-slate-900 z-20">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-1">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-xl font-bold">Insta-Preview</h2>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={handleSaveFull}
            className="text-blue-500 font-semibold text-sm"
          >
            Save Full
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center bg-[#050505] overflow-hidden">
        {/* Instagram Post Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px]">
              <div className="w-full h-full rounded-full bg-black border border-black flex items-center justify-center text-[10px] font-bold">PT</div>
            </div>
            <span className="text-sm font-semibold">panotile_studio</span>
          </div>
          <MoreVertical className="w-5 h-5 text-slate-400" />
        </div>

        {/* Carousel Area */}
        <div className="relative w-full aspect-square bg-zinc-900 overflow-hidden group">
          {/* Index Indicator */}
          <div className="absolute top-3 right-3 z-10 bg-black/70 px-2.5 py-1 rounded-full text-[11px] font-bold text-white backdrop-blur-sm">
            {activeIndex + 1}/{sliceCount}
          </div>

          {/* Nav Arrows (Desktop) */}
          <button 
            onClick={() => scrollTo(activeIndex - 1)}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/10 backdrop-blur-md text-white transition-opacity ${activeIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scrollTo(activeIndex + 1)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/10 backdrop-blur-md text-white transition-opacity ${activeIndex === sliceCount - 1 ? 'opacity-0' : 'opacity-100'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {slices.map((_, i) => (
              <div key={i} className="min-w-full h-full snap-center relative overflow-hidden bg-zinc-900">
                {/* 
                  The magic: We show the stitched image, but shift it left 
                  based on which slice we are currently on. 
                */}
                <div 
                  className="absolute top-0 left-0 h-full"
                  style={{
                    width: `${sliceCount * 100}%`,
                    transform: `translateX(-${(i / sliceCount) * 100}%)`,
                    backgroundImage: `url(${stitchedImage})`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'left center',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Post Actions */}
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="text-white"><Share2 className="w-6 h-6" /></button>
            <div className="flex items-center space-x-1.5">
               {slices.map((_, i) => (
                 <div 
                   key={i} 
                   className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'bg-blue-500 scale-125' : 'bg-zinc-600'}`}
                 />
               ))}
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400">SEAMLESS TRANSITION</span>
        </div>

        {/* Caption Area */}
        <div className="px-3 pb-4">
          <p className="text-sm"><span className="font-bold mr-2">panotile_studio</span>Check out this seamless {sliceCount}-part carousel! 📸✨ #panorama #photography</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-zinc-950 border-t border-slate-900 grid grid-cols-2 gap-3">
        <button 
          onClick={handleSaveFull}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm"
        >
          <Download className="w-4 h-4" />
          <span>Full Pano</span>
        </button>
        <button 
          onClick={handleSaveIndividual}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm shadow-lg shadow-blue-900/20"
        >
          <Share2 className="w-4 h-4" />
          <span>Save {sliceCount} Tiles</span>
        </button>
      </div>
    </div>
  );
};

export default PanoramaViewer;
