import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(standalone);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`)
        .catch((caught: unknown) => {
          setMessage(caught instanceof Error ? `Không thể chuẩn bị cài đặt ứng dụng: ${caught.message}` : 'Không thể chuẩn bị cài đặt ứng dụng.');
        });
    } else {
      setMessage('Trình duyệt này chưa hỗ trợ cài đặt ứng dụng web.');
    }

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setMessage('Đã cài ứng dụng. Bạn có thể ghim Teamflow vào thanh tác vụ từ menu ứng dụng của hệ điều hành.');
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) {
      setMessage('Mở menu trình duyệt và chọn “Cài đặt trang web dưới dạng ứng dụng”. Sau khi cài, bạn có thể ghim Teamflow vào thanh tác vụ.');
      return;
    }

    const prompt = installPrompt;
    setInstallPrompt(null);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setMessage('Đã cài ứng dụng. Bạn có thể ghim Teamflow vào thanh tác vụ từ menu ứng dụng của hệ điều hành.');
      }
    } catch (caught) {
      setMessage(caught instanceof Error ? `Không thể cài ứng dụng: ${caught.message}` : 'Không thể cài ứng dụng.');
    }
  }

  return { canInstall: installPrompt !== null, isInstalled, message, installApp };
}
