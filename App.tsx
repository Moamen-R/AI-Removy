
import React, { useState, useCallback, useRef } from 'react';
import { removeBackground } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { UploadIcon, DownloadIcon, MagicWandIcon, ImageIcon } from './components/Icons';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('الرجاء اختيار ملف صورة صالح.');
        return;
      }
      setError(null);
      setResultImage(null);
      setImageFile(file);
      const base64 = await fileToBase64(file);
      setImageBase64(base64);
    }
  };
  
  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleSubmit = useCallback(async () => {
    if (!imageBase64 || !prompt) {
      setError('الرجاء تحميل صورة وكتابة وصف للعناصر المراد الاحتفاظ بها.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const { mimeType, data } = extractBase64Data(imageBase64);
      const finalPrompt = `مهمتك هي إزالة خلفية هذه الصورة بدقة متناهية. احتفظ فقط بـ: "${prompt}". يجب أن تكون النتيجة النهائية صورة بصيغة PNG بخلفية شفافة. لا تقم بتغيير أي تفاصيل في العنصر المحدد.`;
      
      const result = await removeBackground(data, mimeType, finalPrompt);
      setResultImage(`data:image/png;base64,${result}`);
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء معالجة الصورة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, [imageBase64, prompt]);

  const extractBase64Data = (base64String: string): { mimeType: string; data: string } => {
    const parts = base64String.split(',');
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const data = parts[1];
    return { mimeType, data };
  };
  
  const resetState = () => {
      setImageFile(null);
      setImageBase64(null);
      setPrompt('');
      setResultImage(null);
      setError(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            مزيل الخلفية الإحترافي
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            مدعوم بنموذج Gemini Nano Banana لإزالة الخلفية بدقة فائقة
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-2xl flex flex-col space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-200">1. إعدادات الصورة</h2>
            
            {/* Image Upload */}
            <div 
                className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-gray-800 transition-all duration-300"
                onClick={triggerFileSelect}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              {imageBase64 ? (
                 <img src={imageBase64} alt="Preview" className="mx-auto max-h-48 rounded-md object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                    <UploadIcon className="w-12 h-12" />
                    <p className="font-semibold">انقر لاختيار صورة</p>
                    <p className="text-sm">PNG, JPG, WEBP</p>
                </div>
              )}
            </div>
            {imageFile && <p className="text-center text-sm text-gray-400 break-all">{imageFile.name}</p>}
            
            {/* Prompt Input */}
            <div>
              <label htmlFor="prompt" className="block text-lg font-medium text-gray-300 mb-2">
                2. العناصر المراد الاحتفاظ بها
              </label>
              <textarea
                id="prompt"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مثال: الشخص الذي يرتدي قبعة حمراء، السيارة الزرقاء..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 placeholder-gray-500"
                disabled={!imageBase64}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                 <button
                    onClick={handleSubmit}
                    disabled={!imageBase64 || !prompt || isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-300 shadow-lg"
                 >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            جاري المعالجة...
                        </>
                    ) : (
                        <>
                            <MagicWandIcon className="w-5 h-5" />
                            إزالة الخلفية
                        </>
                    )}
                </button>
                <button
                    onClick={resetState}
                    className="w-full sm:w-auto bg-gray-700 text-gray-300 font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors duration-300"
                >
                    مسح
                </button>
            </div>
            {error && <p className="text-red-400 text-center">{error}</p>}
          </div>

          {/* Output Panel */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
             <h2 className="text-2xl font-bold text-center text-gray-200 mb-4">النتيجة النهائية</h2>
              <div className="w-full h-full flex-grow flex items-center justify-center rounded-lg bg-black/20" style={{backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='10' ry='10' stroke='%234B5563FF' stroke-width='2' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`}}>
              {isLoading ? (
                <div className="text-center text-gray-400">
                    <div className="animate-pulse">
                        <ImageIcon className="w-20 h-20 mx-auto text-gray-600"/>
                        <p className="mt-4 text-lg">يقوم الذكاء الاصطناعي بسحره...</p>
                        <p className="text-sm">قد تستغرق هذه العملية بضع لحظات</p>
                    </div>
                </div>
              ) : resultImage ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <img src={resultImage} alt="Result" className="max-w-full max-h-[400px] object-contain rounded-md" />
                  <a
                    href={resultImage}
                    download={`result_${imageFile?.name || 'image.png'}`}
                    className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    تحميل الصورة
                  </a>
                </div>
              ) : (
                 <div className="text-center text-gray-500">
                     <ImageIcon className="w-16 h-16 mx-auto"/>
                     <p className="mt-2">ستظهر صورتك النهائية هنا</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
