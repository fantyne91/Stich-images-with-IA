import React, { useRef } from 'react';
import { UploadedImage } from '../types.ts';
import { UploadIcon, XIcon } from './icons.tsx';

interface ImageUploaderProps {
  image: UploadedImage | null;
  onImageSelect: (image: UploadedImage | null) => void;
  label: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ image, onImageSelect, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onImageSelect({ file, previewUrl });
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
    }
    onImageSelect(null);
    if (inputRef.current) {
        inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div 
        onClick={() => inputRef.current?.click()}
        className="relative aspect-square w-full bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-sky-500 transition-colors duration-200 group overflow-hidden"
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        {image ? (
          <>
            <img src={image.previewUrl} alt="Preview" className="object-cover w-full h-full" />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Remove image"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="text-center text-slate-500">
            <UploadIcon className="w-12 h-12 mx-auto" />
            <p className="mt-2 text-sm">Click to upload image</p>
          </div>
        )}
      </div>
    </div>
  );
};