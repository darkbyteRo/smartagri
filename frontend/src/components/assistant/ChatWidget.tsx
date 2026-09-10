'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Bot, Mic, MicOff, Volume2, VolumeX, 
  Languages, Loader2, Sparkles, Check, AlertCircle, Pause, Play, Square 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// 16kHz mono WAV encoder for clean Sarvam AI STT ingestion
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat PCM
  view.setUint16(22, 1, true); // NumChannels 1 (mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'te'>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm SmartAgri AI. Ask me about mandi prices, where to sell, or whether to hold your produce. 🌾\n\nనమస్కారం! నేను స్మార్ట్ అగ్రి AI. మార్కెట్ ధరలు మరియు సలహాల కోసం నన్ను అడగండి.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);
  const activeSpeechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedSamplesRef = useRef<Float32Array[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const quickPrompts = language === 'te' ? [
    "హైదరాబాద్‌లో వరి ధర ఎంత?",
    "వరంగల్‌లో టమాటా రేట్ ఎంత?",
    "పత్తి ఇప్పుడు అమ్మాలా లేదా ఆగాలా?",
    "ఉల్లిపాయ కొనుగోలుదారులు ఎక్కడ ఉన్నారు?"
  ] : [
    "how are the market prices for paddy in hyderabad",
    "What is the tomato price in Warangal today?",
    "Should I sell or hold cotton?",
    "Find verified buyers for onion"
  ];

  // Completely stop any playing audio and abort in-flight requests
  const stopAudio = () => {
    // Abort pending TTS network fetch immediately
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
    }

    // Stop audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }

    // Cancel browser speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      activeSpeechUtteranceRef.current = null;
    }

    setPlayingAudioId(null);
    setAudioLoadingId(null);
    setIsPaused(false);
  };

  // Toggle Pause / Resume for audio playback
  const togglePauseAudio = () => {
    if (!playingAudioId && !audioRef.current) return;

    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setIsPaused(false);
        }).catch((err) => {
          console.warn('Could not resume audio:', err);
        });
      } else {
        audioRef.current.pause();
        setIsPaused(true);
      }
      return;
    }

    // Web Speech API fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  // Play audio response using Sarvam AI TTS (with Web Speech fallback)
  const playAudioResponse = async (text: string, msgId: string) => {
    if (playingAudioId === msgId) {
      togglePauseAudio();
      return;
    }

    stopAudio();

    const controller = new AbortController();
    ttsAbortControllerRef.current = controller;
    setAudioLoadingId(msgId);

    try {
      const res = await api.post('/assistant/text-to-speech', {
        text,
        language: language
      }, {
        signal: controller.signal
      });

      if (controller.signal.aborted) return;

      if (res.data?.audio_base64) {
        const audioUrl = `data:${res.data.mime_type || 'audio/wav'};base64,${res.data.audio_base64}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        setPlayingAudioId(msgId);
        setIsPaused(false);

        audio.onended = () => {
          setPlayingAudioId(null);
          setIsPaused(false);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setPlayingAudioId(null);
          setIsPaused(false);
          audioRef.current = null;
        };

        await audio.play();
      } else {
        throw new Error('No audio returned');
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      console.warn('Sarvam TTS failed, falling back to browser speech synthesis:', err);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const cleanText = text.replace(/[*#_]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
        activeSpeechUtteranceRef.current = utterance;
        setPlayingAudioId(msgId);
        setIsPaused(false);
        utterance.onend = () => {
          setPlayingAudioId(null);
          setIsPaused(false);
          activeSpeechUtteranceRef.current = null;
        };
        utterance.onerror = () => {
          setPlayingAudioId(null);
          setIsPaused(false);
          activeSpeechUtteranceRef.current = null;
        };
        window.speechSynthesis.speak(utterance);
      } else {
        toast.error('Audio playback is not supported on this browser.');
      }
    } finally {
      if (ttsAbortControllerRef.current === controller) {
        setAudioLoadingId(null);
      }
    }
  };

  // Start dual-engine voice recording
  const startRecording = async () => {
    setLiveTranscript('');
    stopAudio();

    // Check if Web Speech API is supported
    const SpeechRecognition = typeof window !== 'undefined' && 
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    let recognitionStarted = false;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + ' ';
            } else {
              interim += transcript;
            }
          }
          const spoken = (final + interim).trim();
          setLiveTranscript(spoken);
          setInput(spoken);
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
        };

        recognition.start();
        recognitionStarted = true;
      } catch (e) {
        console.warn('Web Speech API failed to start:', e);
      }
    }

    // Also start AudioContext WAV capture for high-fidelity Sarvam STT fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          channelCount: 1, 
          sampleRate: 16000, 
          echoCancellation: true, 
          noiseSuppression: true 
        } 
      });
      mediaStreamRef.current = stream;
      recordedSamplesRef.current = [];

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        recordedSamplesRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsRecording(true);
      toast.success(
        language === 'te' 
          ? 'వినడం ప్రారంభమైంది... మాట్లాడండి (తెలుగు)' 
          : 'Listening... speak into your microphone (English)',
        { duration: 2500 }
      );
    } catch (err) {
      console.error('Error accessing microphone:', err);
      if (!recognitionStarted) {
        toast.error('Could not access microphone. Please allow microphone permissions in your browser.');
        setIsRecording(false);
      } else {
        setIsRecording(true);
      }
    }
  };

  // Stop recording and process
  const stopRecording = async () => {
    setIsRecording(false);

    // Stop Web Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    // Stop MediaStream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    // If browser Web Speech API already captured text, prioritize it!
    if (liveTranscript.trim() || input.trim()) {
      const recognized = (liveTranscript || input).trim();
      setInput(recognized);
      toast.success(language === 'te' ? 'వాయిస్ గుర్తించబడింది!' : 'Voice recognized!');
      return;
    }

    // Otherwise, encode the captured 16kHz audio to WAV and send to Sarvam AI STT
    if (recordedSamplesRef.current.length > 0) {
      setIsLoading(true);
      const toastId = toast.loading(language === 'te' ? 'Sarvam AI వాయిస్ విశ్లేషిస్తోంది...' : 'Transcribing voice with Sarvam AI...');

      try {
        // Flatten audio samples
        let totalLength = 0;
        for (const chunk of recordedSamplesRef.current) {
          totalLength += chunk.length;
        }
        const merged = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of recordedSamplesRef.current) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }

        const wavBlob = encodeWAV(merged, 16000);
        const formData = new FormData();
        formData.append('file', wavBlob, 'voice.wav');
        formData.append('language', language === 'te' ? 'te' : 'en');

        const res = await api.post('/assistant/speech-to-text', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        toast.dismiss(toastId);
        const transcript = res.data?.transcript;
        if (transcript && transcript.trim()) {
          setInput(transcript.trim());
          toast.success(language === 'te' ? 'వాయిస్ గుర్తించబడింది!' : 'Voice recognized!');
        } else {
          toast.error(language === 'te' ? 'వాయిస్ స్పష్టంగా లేదు, దయచేసి మళ్ళీ చెప్పండి.' : 'No clear speech detected. Please speak closer to microphone.');
        }
      } catch (err) {
        toast.dismiss(toastId);
        console.error('STT error:', err);
        toast.error('Could not process speech. Please type your message.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Send message
  const sendMessage = async (textToSend: string, isVoiceQuery: boolean = false) => {
    if (!textToSend.trim() || isLoading) return;

    // Immediately stop any playing audio when user sends a new query
    stopAudio();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLiveTranscript('');
    setIsLoading(true);

    try {
      const response = await api.post('/assistant/chat', { 
        message: textToSend,
        language: language 
      });

      const responseText = response.data?.response || response.data?.content || "I could not find the information for that.";
      const newMsgId = (Date.now() + 1).toString();

      const assistantMessage: ChatMessage = {
        id: newMsgId,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If requested via voice, automatically play speech response
      if (isVoiceQuery) {
        setTimeout(() => {
          playAudioResponse(responseText, newMsgId);
        }, 400);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'te' 
          ? "క్షమించండి, సర్వర్‌ను సంప్రదించడంలో సమస్య ఏర్పడింది. దయచేసి కాసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి."
          : "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input, false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-xl hover:bg-emerald-700 transition-all z-50 flex items-center gap-2 group ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-semibold">
          AI & Voice Chat
        </span>
      </button>

      {/* Chat Container */}
      <div 
        className={`fixed bottom-6 right-6 w-80 sm:w-[430px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 z-50 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`} 
        style={{ height: '580px', maxHeight: 'calc(100vh - 40px)' }}
      >
        {/* Header */}
        <div className="bg-emerald-700 p-3.5 text-white flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-800 rounded-lg">
              <Bot className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm leading-tight">SmartAgri AI</h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                  Voice + Text
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 leading-tight">
                {language === 'te' ? 'తెలంగాణ వ్యవసాయ మార్కెట్ మిత్ర' : 'Telangana Market Intelligence'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Switcher Tabs */}
            <div className="bg-emerald-900/60 p-0.5 rounded-lg flex border border-emerald-600/60">
              <button
                onClick={() => {
                  setLanguage('en');
                  stopAudio();
                  toast.success('Voice mode set to English');
                }}
                className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                  language === 'en' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => {
                  setLanguage('te');
                  stopAudio();
                  toast.success('వాయిస్ మోడ్: తెలుగు');
                }}
                className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                  language === 'te' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                తెలుగు
              </button>
            </div>

            <button 
              onClick={() => {
                stopAudio();
                if (isRecording) stopRecording();
                setIsOpen(false);
              }} 
              className="text-emerald-200 hover:text-white p-1 rounded-md hover:bg-emerald-800 transition-colors"
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[88%] p-3 rounded-2xl relative group ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-sm shadow-sm' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-gray-100/30">
                  <span className={`text-[10px] ${msg.role === 'user' ? 'text-emerald-100' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Speaker / Pause / Stop Buttons on Assistant Messages */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5">
                      {playingAudioId === msg.id ? (
                        <>
                          {/* Pause / Resume Button */}
                          <button
                            type="button"
                            onClick={togglePauseAudio}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                              isPaused
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 animate-pulse'
                            }`}
                            title={isPaused ? "Resume playback" : "Pause playback"}
                          >
                            {isPaused ? (
                              <>
                                <Play className="w-3 h-3 fill-current text-amber-700" />
                                <span className="text-[10px] font-semibold text-amber-800">Resume</span>
                              </>
                            ) : (
                              <>
                                <Pause className="w-3 h-3 fill-current text-emerald-700" />
                                <span className="text-[10px] font-semibold text-emerald-800">Pause</span>
                              </>
                            )}
                          </button>

                          {/* Stop Button */}
                          <button
                            type="button"
                            onClick={stopAudio}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            title="Stop speaking"
                          >
                            <Square className="w-3 h-3 fill-current text-red-600" />
                            <span className="text-[10px] font-semibold text-red-700">Stop</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => playAudioResponse(msg.content, msg.id)}
                          disabled={audioLoadingId === msg.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Listen in voice (Sarvam AI)"
                        >
                          {audioLoadingId === msg.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                              <span className="text-[10px]">Loading...</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px]">Listen 🔊</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Loader */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 text-xs text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>
                  {language === 'te' ? 'సమాధానం విశ్లేషిస్తోంది...' : 'Checking mandi intelligence...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(prompt, false)}
              disabled={isLoading || isRecording}
              className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Active Audio Playback / Loading Control Bar */}
        {(playingAudioId || audioLoadingId) && !isRecording && (
          <div className="bg-emerald-950 text-white px-3.5 py-2 flex items-center justify-between border-t border-emerald-800 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-800 flex items-center justify-center flex-shrink-0">
                {audioLoadingId ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                ) : isPaused ? (
                  <Pause className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight truncate">
                  {audioLoadingId 
                    ? (language === 'te' ? 'వాయిస్ సిద్ధం చేస్తోంది...' : 'Preparing voice response...')
                    : isPaused 
                    ? (language === 'te' ? 'వాయిస్ పాజ్ చేయబడింది' : 'Assistant Voice Paused')
                    : (language === 'te' ? 'వాయిస్ మాట్లాడుతోంది...' : 'Assistant is Speaking...')}
                </p>
                <p className="text-[10px] text-emerald-300 leading-tight truncate">
                  {language === 'te' ? 'మైక్ నొక్కితే వెంటనే ఆగిపోతుంది' : 'Tap Mic or Stop to pause speaking'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {playingAudioId && (
                <button
                  type="button"
                  onClick={togglePauseAudio}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-medium rounded-full transition-colors border border-emerald-600"
                  title={isPaused ? "Resume voice" : "Pause voice"}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3 h-3 fill-current text-amber-300" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 fill-current text-white" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={stopAudio}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-full transition-colors shadow-sm"
                title="Stop speaking"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Recording Overlay Bar */}
        {isRecording && (
          <div className="bg-red-50 border-t border-red-200 px-3.5 py-2.5 flex items-center justify-between text-red-700 animate-pulse">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-ping flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight truncate">
                  {language === 'te' ? 'వినడం జరుగుతోంది...' : 'Listening to your voice...'} ({recordingSeconds}s)
                </p>
                <p className="text-[10px] text-red-600 leading-tight">
                  {language === 'te' ? 'స్పష్టంగా మాట్లాడండి (తెలుగు)' : `Language: ${language === 'en' ? 'English (Indian accent)' : 'Telugu'}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={stopRecording}
                className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700 shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              isRecording
                ? 'bg-red-600 text-white shadow-lg shadow-red-200 animate-bounce'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
            }`}
            title={
              isRecording 
                ? "Click to finish speaking" 
                : (language === 'te' ? "వాయిస్ మాట్లాడండి (తెలుగు)" : "Speak your question (English)")
            }
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isRecording 
                ? (language === 'te' ? "మీరు మాట్లాడుతున్నది వింటున్నాం..." : "Speak now... words will appear here") 
                : (language === 'te' ? "ధరలు లేదా మార్కెట్ల గురించి అడగండి..." : "Ask prices, where to sell, etc...")
            }
            className={`flex-1 px-3.5 py-2 border rounded-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm disabled:bg-gray-50 transition-colors ${
              isRecording ? 'border-red-300 bg-red-50/40' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />

          <Button 
            type="submit" 
            size="sm" 
            className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0 bg-emerald-600 hover:bg-emerald-700"
            disabled={!input.trim() || isLoading || isRecording}
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </form>
      </div>
    </>
  );
}
