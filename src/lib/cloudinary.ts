export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
}

export async function uploadToCloudinary(
  file: File,
  folder: string = 'anyjob/work-images'
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  
  formData.append('file', file);
  formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'default');
  formData.append('folder', folder);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Upload failed: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', process.env.CLOUDINARY_API_KEY!);
    formData.append('timestamp', Math.floor(Date.now() / 1000).toString());
    formData.append('signature', generateSignature(publicId));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Delete failed: ${error.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

function generateSignature(publicId: string): string {
  const crypto = require('crypto');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  
  return crypto
    .createHmac('sha1', process.env.CLOUDINARY_API_SECRET!)
    .update(stringToSign)
    .digest('hex');
}
