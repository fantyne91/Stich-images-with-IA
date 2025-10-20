import React, { useState } from 'react';
import { UploadedImage } from './types';
import { ImageUploader } from './components/ImageUploader';
import { LoadingSpinner, SparklesIcon, XIcon } from './components/icons';
import { stitchImages } from './services/geminiService';

const App: React.FC = () => {
  const [image1, setImage1] = useState<UploadedImage | null>(null);
  const [image2, setImage2] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [stitchedImage, setStitchedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canStitch = image1 && image2 && prompt.trim().length > 0 && !isLoading;

  const handleStitch = async () => {
    if (!canStitch) return;

    setIsLoading(true);
    setError(null);
    setStitchedImage(null);

    try {
      if(image1 && image2){
        const resultUrl = await stitchImages(image1.file, image2.file, prompt);
        setStitchedImage(resultUrl);
      } else {
        throw new Error("Source images not found.");
      }
    } catch (e) {
      const err = e as Error;
      if (err.message.includes("Failed to fetch")) {
        setError("Could not connect to the server. The Netlify function may not be deployed correctly. Check the browser console for more details.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setImage1(null);
    setImage2(null);
    setPrompt('');
    setStitchedImage(null);
    setError(null);
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 inline-flex items-center gap-3">
            <SparklesIcon className="w-10 h-10" />
            Image Stitcher AI
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Combine two images with a prompt and let AI create something new.
          </p>
        </header>

        <div className="bg-slate-800/50 p-6 rounded-xl shadow-2xl border border-slate-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ImageUploader image={image1} onImageSelect={setImage1} label="Image 1 (Primary)" />
            <ImageUploader image={image2} onImageSelect={setImage2} label="Image 2 (Secondary)" />
          </div>

          <div className="mt-6">
            <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">
              Stitching Instruction
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Place the cat from Image 1 onto the sofa in Image 2.'"
              className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-200 resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStitch}
              disabled={!canStitch}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-sky-600 text-white font-semibold rounded-md shadow-lg hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="w-5 h-5" />
                  Stitching...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Stitch Images
                </>
              )}
            </button>
             <button
              onClick={resetAll}
              className="w-full sm:w-auto px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-md hover:bg-slate-600 transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        </div>
        
        {error && (
            <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        {stitchedImage && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-center mb-4 text-slate-200">Your Stitched Creation</h2>
            <div className="relative group bg-slate-800/50 p-2 rounded-xl shadow-2xl border border-slate-700">
                <img 
                    src={stitchedImage} 
                    alt="AI stitched result" 
                    className="w-full max-w-2xl mx-auto rounded-lg" 
                />
                 <a
                    href={stitchedImage}
                    download="stitched-image.png"
                    className="absolute bottom-4 right-4 bg-sky-600 text-white font-semibold py-2 px-4 rounded-md shadow-lg hover:bg-sky-500 transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                    Download
                </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;