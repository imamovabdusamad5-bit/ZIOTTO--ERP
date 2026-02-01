import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Scissors, X, Check, RotateCw, ZoomIn, Layout, Square, Smartphone, Monitor } from 'lucide-react';

// Helper function to create centered crop
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

const ImageCropper = ({ image, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [aspect, setAspect] = useState(undefined); // undefined = Free
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const imgRef = useRef(null);

    // Load image and set initial crop
    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        const initialAspect = aspect || 16 / 9;

        // Agar erkin bo'lsa butun rasmni belgilaymiz
        if (!aspect) {
            setCrop({
                unit: '%',
                width: 80,
                height: 80,
                x: 10,
                y: 10
            });
        } else {
            setCrop(centerAspectCrop(width, height, initialAspect));
        }
    };

    // Handle aspect ratio change
    const handleAspectChange = (newAspect) => {
        setAspect(newAspect);
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            if (newAspect) {
                setCrop(centerAspectCrop(width, height, newAspect));
            } else {
                setCrop({
                    unit: '%',
                    width: 80,
                    height: 80,
                    x: 10,
                    y: 10
                });
            }
        }
    }

    // Generate output image
    const getCroppedImg = async () => {
        const image = imgRef.current;
        if (!image || !completedCrop) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const pixelRatio = window.devicePixelRatio;
        canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
        canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingQuality = 'high';

        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const rotateRads = rotate * Math.PI / 180;
        const centerX = image.naturalWidth / 2;
        const centerY = image.naturalHeight / 2;

        ctx.save();
        ctx.translate(-cropX, -cropY);
        ctx.translate(centerX, centerY);
        ctx.rotate(rotateRads);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);

        ctx.drawImage(
            image,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
        );

        ctx.restore();

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Canvas is empty');
                    return;
                }
                blob.name = 'cropped.jpg';
                const fileUrl = window.URL.createObjectURL(blob);
                resolve(fileUrl);
            }, 'image/jpeg');
        });
    };

    const handleConfirm = async () => {
        try {
            const croppedImageUrl = await getCroppedImg();
            onCropComplete(croppedImageUrl);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4">
            {/* Main Crop Area */}
            <div className="relative w-full max-w-4xl h-[60vh] flex items-center justify-center bg-[#1a1c2e] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    className="max-h-full"
                >
                    <img
                        ref={imgRef}
                        alt="Crop me"
                        src={image}
                        onLoad={onImageLoad}
                        style={{ transform: `scale(${scale}) rotate(${rotate}deg)`, maxHeight: '60vh', objectFit: 'contain' }}
                        className="max-w-full"
                    />
                </ReactCrop>
            </div>

            {/* Controls */}
            <div className="mt-6 w-full max-w-lg bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 space-y-6">

                {/* Aspect Ratio Selector */}
                <div className="flex gap-2 justify-center overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => handleAspectChange(undefined)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${!aspect ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                    >
                        <Layout size={14} />
                        Erkin
                    </button>
                    <button
                        onClick={() => handleAspectChange(1)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${aspect === 1 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                    >
                        <Square size={14} />
                        1:1
                    </button>
                    <button
                        onClick={() => handleAspectChange(4 / 3)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${aspect === 4 / 3 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                    >
                        <Monitor size={14} />
                        4:3
                    </button>
                    <button
                        onClick={() => handleAspectChange(16 / 9)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${aspect === 16 / 9 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                    >
                        <Smartphone className="rotate-90" size={14} />
                        16:9
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <ZoomIn size={20} className="text-white/50" />
                    <input
                        type="range"
                        value={scale}
                        min={0.1}
                        max={3}
                        step={0.1}
                        onChange={(e) => setScale(Number(e.target.value))}
                        className="flex-1 accent-indigo-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <RotateCw size={20} className="text-white/50" />
                    <input
                        type="range"
                        value={rotate}
                        min={0}
                        max={360}
                        step={1}
                        onChange={(e) => setRotate(Math.min(180, Math.max(-180, Number(e.target.value))))} // ReactCrop expects -180 to 180 usually, but lets try 0-360 standard
                        className="flex-1 accent-indigo-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                    />
                </div>

                <div className="flex gap-4 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 px-6 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                        <X size={18} /> Bekor qilish
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={18} /> Saqlash
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
