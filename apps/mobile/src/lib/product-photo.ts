import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/lib/api-client';

/** Product photos are shown at most ~400pt wide; 1080px keeps them crisp and small. */
const MAX_WIDTH = 1080;

export type PhotoSource = 'camera' | 'library';

/**
 * Let the user take or choose a square-ish product photo. Resolves the local,
 * compressed JPEG uri, or null if they cancel or deny permission.
 */
export async function pickProductPhoto(source: PhotoSource, maxWidth = MAX_WIDTH): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets?.[0];
  if (!asset) return null;

  // Phone cameras produce 3–8 MB files; shrink before it ever leaves the device.
  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > maxWidth) context.resize({ width: maxWidth });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  return saved.uri;
}

/** Upload a local photo through the API (stored on UploadThing); returns its URL. */
export async function uploadProductPhoto(uri: string): Promise<string> {
  const form = new FormData();
  // React Native's FormData accepts a { uri, name, type } file descriptor.
  form.append('file', { uri, name: 'product.jpg', type: 'image/jpeg' } as unknown as Blob);
  const { url } = await api<{ url: string }>('/uploads/product-image', { method: 'POST', body: form });
  return url;
}

/** Profile photos show at most ~100pt, so 512px is plenty. */
export const AVATAR_WIDTH = 512;

/** Upload a local photo as the signed-in user's profile picture; returns its URL. */
export async function uploadAvatarPhoto(uri: string): Promise<string> {
  const form = new FormData();
  form.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as unknown as Blob);
  const { url } = await api<{ url: string }>('/uploads/avatar', { method: 'POST', body: form });
  return url;
}

export async function removeAvatarPhoto(): Promise<void> {
  await api('/uploads/avatar', { method: 'DELETE' });
}
