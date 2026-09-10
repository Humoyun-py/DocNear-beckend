import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVoiceSearchOptions {
  language?: string; // 'uz' | 'ru' | 'en'
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useVoiceSearch({
  language = 'uz',
  onTranscript,
  onError,
}: UseVoiceSearchOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Map app language code to BCP 47 language tag
  const getLanguageTag = (lang: string) => {
    switch (lang) {
      case 'uz':
        return 'uz-UZ';
      case 'ru':
        return 'ru-RU';
      case 'en':
      default:
        return 'en-US';
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignore stop errors
      }
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    setTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const msg = 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.';
      setErrorMessage(msg);
      onError?.(msg);
      return;
    }

    try {
      // Stop previous instance if running
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = getLanguageTag(language);
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        setTranscript(currentTranscript);
        onTranscript?.(currentTranscript, isFinal);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        let errorMsg = 'Voice recognition error.';
        if (event.error === 'not-allowed') {
          errorMsg = 'Microphone permission denied. Please allow microphone access in your browser.';
        } else if (event.error === 'no-speech') {
          errorMsg = 'No speech detected. Please speak into the microphone.';
        } else if (event.error === 'network') {
          errorMsg = 'Network error during speech recognition.';
        }
        setErrorMessage(errorMsg);
        setIsListening(false);
        onError?.(errorMsg);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      const msg = 'Failed to start microphone: ' + (err?.message || 'Unknown error');
      setErrorMessage(msg);
      setIsListening(false);
      onError?.(msg);
    }
  }, [language, onError, onTranscript]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
  };
}
