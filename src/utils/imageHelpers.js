/**
 * Сжимает изображение до заданных размеров и качества.
 * @param {File} file - Файл изображения.
 * @param {number} maxWidth - Максимальная ширина/высота (px).
 * @param {number} quality - Качество JPEG (0.0 - 1.0).
 * @returns {Promise<string>} - Promise с Base64 строкой.
 */
export const compressImage = (file, maxWidth = 1600, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Вычисляем новые размеры, сохраняя пропорции
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Конвертируем в Base64 JPEG с заданным качеством
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
};
