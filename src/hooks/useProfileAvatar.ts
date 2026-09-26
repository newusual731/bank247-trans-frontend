import { useEffect, useState } from "react";
import {
  PROFILE_AVATAR_EVENT,
  getProfileAvatar,
  setProfileAvatar,
  fileToAvatarDataUrl,
} from "../lib/profileAvatar";

export function useProfileAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => getProfileAvatar());

  useEffect(() => {
    const sync = () => setAvatarUrl(getProfileAvatar());
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<string | null>).detail;
      setAvatarUrl(detail ?? null);
    };
    window.addEventListener("storage", sync);
    window.addEventListener(PROFILE_AVATAR_EVENT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PROFILE_AVATAR_EVENT, onCustom as EventListener);
    };
  }, []);

  const upload = async (file: File) => {
    const dataUrl = await fileToAvatarDataUrl(file);
    setProfileAvatar(dataUrl);
    setAvatarUrl(dataUrl);
  };

  const clear = () => {
    setProfileAvatar(null);
    setAvatarUrl(null);
  };

  return { avatarUrl, upload, clear };
}
