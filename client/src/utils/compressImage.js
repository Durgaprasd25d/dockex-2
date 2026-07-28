/**
 * Compresses and resizes image files in the browser using HTML Canvas
 * before uploading to serverless backend endpoints.
 * Reduces 10MB+ mobile camera photos to ~200KB-400KB in milliseconds.
 */
export const compressImage = async (file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) => {
    if (!file || !file.type.startsWith("image/")) return file;
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return resolve(file);
                        const compressedFile = new File(
                            [blob], 
                            file.name.replace(/\.[^/.]+$/, "") + ".jpg", 
                            { type: "image/jpeg", lastModified: Date.now() }
                        );
                        resolve(compressedFile);
                    },
                    "image/jpeg",
                    quality
                );
            };
            img.onerror = () => resolve(file);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
};
