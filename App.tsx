
import React, { useState, useEffect, useCallback } from 'react';
import { PanoTile, AppStep, SliceCount } from './types';
import { analyzePanoramaOrder } from './geminiService';
import PhotoUploader from './components/PhotoUploader';
import PanoramaViewer from './components/PanoramaViewer';
import { Loader2, Trash2, ArrowRight, Wand2, GripVertical, Plus, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [tiles, setTiles] = useState<PanoTile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stitchedImage, setStitchedImage] = useState<string | null>(null);
  const [sliceCount, setSliceCount] = useState<SliceCount>(3);

  const handlePhotosSelected = (files: File[]) => {
    const newTiles = files.map((file, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      file: file,
      order: tiles.length + index
    }));
    setTiles([...tiles, ...newTiles]);
    setStep(AppStep.ARRANGE);
  };

  const removeTile = (id: string) => {
    const updated = tiles.filter(t => t.id !== id);
    setTiles(updated);
    if (updated.length === 0) setStep(AppStep.UPLOAD);
  };

  const autoOrder = async () => {
    if (tiles.length < 2) return;
    setIsProcessing(true);
    try {
      const toBase64 = (file: File): Promise<string> => 
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const base64s = await Promise.all(tiles.map(t => toBase64(t.file)));
      const newIndices = await analyzePanoramaOrder(base64s);
      
      const sorted = [...tiles].sort((a, b) => {
        const idxA = tiles.indexOf(a);
        const idxB = tiles.indexOf(b);
        return newIndices.indexOf(idxA) - newIndices.indexOf(idxB);
      });
      
      setTiles(sorted.map((t, i) => ({
        id: t.id,
        url: t.url,
        file: t.file,
        order: i
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePanorama = async () => {
    // Now allowing 1 or more photos
    if (tiles.length < 1) return;
    setIsProcessing(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const loadedImages = await Promise.all(
        tiles.map(tile => new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = tile.url;
        }))
      );

      // Normalizing images to the same height
      const targetHeight = Math.max(...loadedImages.map(img => img.height));
      const totalWidth = loadedImages.reduce((sum, img) => {
        const scaledWidth = (img.width * targetHeight) / img.height;
        return sum + scaledWidth;
      }, 0);

      canvas.width = totalWidth;
      canvas.height = targetHeight;

      let currentX = 0;
      loadedImages.forEach(img => {
        const scaledWidth = (img.width * targetHeight) / img.height;
        ctx.drawImage(img, currentX, 0, scaledWidth, targetHeight);
        currentX += scaledWidth;
      });

      setStitchedImage(canvas.toDataURL('image/png', 0.95));
      setStep(AppStep.PREVIEW);
    } catch (error) {
      console.error("Stitching failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const moveTile = (fromIdx: number, toIdx: number) => {
    const tileToMove = tiles[fromIdx];
    if (!tileToMove) return;

    const remainingTiles = tiles.filter((_, idx) => idx !== fromIdx);
    const newTiles = [
      ...remainingTiles.slice(0, toIdx),
      tileToMove,
      ...remainingTiles.slice(toIdx)
    ];
    
    setTiles(newTiles.map((t, i) => ({
      id: t.id,
      url: t.url,
      file: t.file,
      order: i
    })));
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-slate-900 shadow-2xl overflow-hidden relative flex flex-col">
      {step === AppStep.UPLOAD && (
        <PhotoUploader onPhotosSelected={handlePhotosSelected} />
      )}

      {step === AppStep.ARRANGE && (
        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Project Setup</h2>
              <p className="text-slate-400 text-sm">{tiles.length} {tiles.length === 1 ? 'photo' : 'photos'} added</p>
            </div>
            {tiles.length >= 2 && (
              <button 
                onClick={autoOrder}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 rounded-full hover:bg-slate-700 text-emerald-400 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span className="text-sm font-medium">AI Order</span>
              </button>
            )}
          </header>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {tiles.map((tile, idx) => (
              <div 
                key={tile.id}
                className="flex items-center p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all"
              >
                <div className="mr-3 text-slate-500">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                  <img src={tile.url} className="w-full h-full object-cover" alt="Tile" />
                </div>
                <div className="ml-4 flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-slate-200 truncate">Part {idx + 1}</p>
                  <p className="text-xs text-slate-500 uppercase">{(tile.file.size / 1024).toFixed(0)} KB</p>
                </div>
                <div className="flex space-x-1">
                  {tiles.length > 1 && (
                    <>
                      <button 
                        onClick={() => idx > 0 && moveTile(idx, idx - 1)}
                        className="p-2 text-slate-400 hover:text-white"
                      >
                        ↑
                      </button>
                      <button 
                        onClick={() => idx < tiles.length - 1 && moveTile(idx, idx + 1)}
                        className="p-2 text-slate-400 hover:text-white"
                      >
                        ↓
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => removeTile(tile.id)}
                    className="p-2 text-red-400/60 hover:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            <button 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) handlePhotosSelected(Array.from(files));
                };
                input.click();
              }}
              className="w-full p-4 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center space-x-2 text-slate-500 hover:text-blue-400 hover:border-blue-500/50 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add more photos</span>
            </button>
          </div>

          {/* Slicer Config */}
          <div className="mt-6 p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div className="flex items-center space-x-2 mb-4 text-white">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-sm">Target Carousel Slides</span>
            </div>
            <div className="flex justify-between gap-2">
              {[2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => setSliceCount(count as SliceCount)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                    sliceCount === count 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-3 text-center uppercase tracking-widest">
              Slices your {tiles.length === 1 ? 'photo' : 'panorama'} into {sliceCount} seamless parts
            </p>
          </div>

          <div className="mt-6 pt-2">
            <button 
              onClick={generatePanorama}
              disabled={isProcessing || tiles.length < 1}
              className="w-full py-4 bg-blue-600 rounded-2xl font-bold text-white shadow-xl shadow-blue-900/40 hover:bg-blue-500 flex items-center justify-center space-x-3 disabled:opacity-50 transition-all transform active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <span>Create Carousel</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === AppStep.PREVIEW && stitchedImage && (
        <PanoramaViewer 
          stitchedImage={stitchedImage} 
          sliceCount={sliceCount}
          onBack={() => setStep(AppStep.ARRANGE)} 
        />
      )}
    </div>
  );
};

export default App;
