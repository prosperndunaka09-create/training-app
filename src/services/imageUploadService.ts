import { supabase } from '@/lib/supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Image Upload Service
 * Handles uploading product images to Supabase Storage
 */
export class ImageUploadService {
  /**
   * Upload an image to the product-images bucket
   * @param file - The image file to upload
   * @param productName - Product name for generating filename
   * @returns Upload result with public URL
   */
  static async uploadImage(file: File, productName: string = 'product'): Promise<UploadResult> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.'
        };
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File too large. Maximum size is 10MB.'
        };
      }

      // Generate file name: product-name-timestamp.extension
      const timestamp = Date.now();
      const sanitizedProductName = productName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${sanitizedProductName}-${timestamp}.${fileExtension}`;

      console.log('[ImageUploadService] Uploading image:', fileName);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[ImageUploadService] Upload error:', uploadError);
        return {
          success: false,
          error: uploadError.message || 'Failed to upload image'
        };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      console.log('[ImageUploadService] Upload successful:', publicUrlData.publicUrl);

      return {
        success: true,
        url: publicUrlData.publicUrl
      };
    } catch (error: any) {
      console.error('[ImageUploadService] Exception:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  }

  /**
   * Delete an image from the product-images bucket
   * @param imageUrl - Public URL of the image to delete
   * @returns Deletion result
   */
  static async deleteImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/product-images/');
      if (pathParts.length < 2) {
        return {
          success: false,
          error: 'Invalid image URL'
        };
      }

      const fileName = pathParts[1];
      console.log('[ImageUploadService] Deleting image:', fileName);

      const { error: deleteError } = await supabase.storage
        .from('product-images')
        .remove([fileName]);

      if (deleteError) {
        console.error('[ImageUploadService] Delete error:', deleteError);
        return {
          success: false,
          error: deleteError.message || 'Failed to delete image'
        };
      }

      console.log('[ImageUploadService] Delete successful');
      return { success: true };
    } catch (error: any) {
      console.error('[ImageUploadService] Exception:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  }

  /**
   * Replace an existing image with a new one
   * @param oldImageUrl - URL of the old image to delete
   * @param newFile - New image file to upload
   * @param productName - Product name for generating filename
   * @returns Upload result with new public URL
   */
  static async replaceImage(
    oldImageUrl: string | undefined,
    newFile: File,
    productName: string = 'product'
  ): Promise<UploadResult> {
    try {
      // Delete old image if it exists
      if (oldImageUrl) {
        await this.deleteImage(oldImageUrl);
      }

      // Upload new image
      return await this.uploadImage(newFile, productName);
    } catch (error: any) {
      console.error('[ImageUploadService] Replace error:', error);
      return {
        success: false,
        error: error.message || 'Failed to replace image'
      };
    }
  }

  /**
   * Validate an image file before upload
   * @param file - The file to validate
   * @returns Validation result
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Maximum size is 10MB.'
      };
    }

    return { valid: true };
  }
}
