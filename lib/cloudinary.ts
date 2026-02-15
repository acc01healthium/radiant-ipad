
/**
 * Cloudinary Unsigned Upload Helper
 * 支援環境變數: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 */
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  console.log('Starting Cloudinary upload...', { cloudName, uploadPreset });

  if (!cloudName || !uploadPreset) {
    const errorMsg = 'Cloudinary 環境變數遺失 (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME 或 NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const apiError = data.error?.message || '未知上傳錯誤';
      console.error('Cloudinary API Error:', data);
      throw new Error(`Cloudinary 上傳失敗: ${apiError} (請確認 Cloud Name 是否正確以及 Preset 是否設為 Unsigned)`);
    }

    console.log('Cloudinary upload success:', data.secure_url);
    return data.secure_url;
  } catch (error: any) {
    console.error('Cloudinary Network/Request Error:', error);
    throw error;
  }
};
