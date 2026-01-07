
import React, { useRef } from 'react';
import { Upload, Camera, Images } from 'lucide-react';

interface PhotoUploaderProps {
  onPhotosSelected: (files: File[]) => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onPhotosSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onPhotosSelected(Array.from(e.target.files));
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          PanoTile Studio
        </h1>
        <p className="text-slate-400">Upload multiple tiles to create a seamless panorama</p>
      </div>

      <div 
        onClick={triggerUpload}
        className="w-full max-w-md aspect-square rounded-3xl border-4 border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 group"
      >
        <div className="p-6 bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
          <Upload className="w-12 h-12 text-blue-400" />
        </div>
        <div className="text-center">
          <p className="text-xl font-medium text-slate-200">Select Multiple Photos</p>
          <p className="text-sm text-slate-500">JPG, PNG supported</p>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <button 
          onClick={triggerUpload}
          className="flex items-center justify-center space-x-2 py-3 px-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <Camera className="w-5 h-5 text-emerald-400" />
          <span>Camera</span>
        </button>
        <button 
          onClick={triggerUpload}
          className="flex items-center justify-center space-x-2 py-3 px-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <Images className="w-5 h-5 text-purple-400" />
          <span>Gallery</span>
        </button>
      </div>
      
      <div className="mt-8 text-xs text-slate-600 max-w-xs text-center">
        Tip: Take overlapping photos horizontally to get the best panoramic result.
      </div>
    </div>
  );
};

export default PhotoUploader;
