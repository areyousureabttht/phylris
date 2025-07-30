function compressImage(file, maxSizeKB = 300) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let width = img.width;
                let height = img.height;
                const maxWidth = 800;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.7;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);

                // Check size and adjust quality
                while (dataUrl.length / 1024 > maxSizeKB && quality > 0.1) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                if (dataUrl.length / 1024 > maxSizeKB) {
                    reject(new Error('Image is too large to compress to the required size.'));
                } else {
                    resolve(dataUrl);
                }
            };
        };
        reader.onerror = error => reject(error);
    });
}
