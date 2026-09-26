const STORAGE_KEY = "bank247.profileAvatar";
export const PROFILE_AVATAR_EVENT = "bank247:profile-avatar";

export function getProfileAvatar(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setProfileAvatar(dataUrl: string | null): void {
  try {
    if (dataUrl) localStorage.setItem(STORAGE_KEY, dataUrl);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // quota / private mode — ignore
  }
  window.dispatchEvent(new CustomEvent(PROFILE_AVATAR_EVENT, { detail: dataUrl }));
}

/** Read file as compressed JPEG data URL (keeps localStorage under quota). */
export function fileToAvatarDataUrl(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Image must be under 8 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process image."));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
