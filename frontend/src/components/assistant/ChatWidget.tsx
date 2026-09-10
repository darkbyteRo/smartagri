'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Bot, Mic, MicOff, Volume2, VolumeX, 
  Languages, Loader2, Sparkles, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Stop any playing audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingAudioId(null);
  };

  // Play audio response using Sarvam AI TTS (with Web Speech fallback)
  const playAudioResponse = async (text: string, msgId: string) => {
    if (playingAudioId === msgId) {
      stopAudio();
      return;
    }

    stopAudio();
    setAudioLoadingId(msgId);

    try {
      const res = await api.post('/assistant/text-to-speech', {
        text,
        language: language
      });

      if (res.data?.audio_base64) {
        const audioUrl = `data:${res.data.mime_type || 'audio/wav'};base64,${res.data.audio_base64}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        setPlayingAudioId(msgId);

        audio.onended = () => {
          setPlayingAudioId(null);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setPlayingAudioId(null);
          audioRef.current = null;
        };

        await audio.play();
      } else {
        throw new Error('No audio returned');
      }
    } catch (err) {
      console.warn('Sarvam TTS failed, falling back to browser speech synthesis:', err);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const cleanText = text.replace(/[*#_]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
        setPlayingAudioId(msgId);
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        toast.error('Audio playback is not supported on this browser.');
      }
    } finally {
      setAudioLoadingId(null);
    }
  };

  // Start recording voice
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioInput(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Could not access microphone. Please allow microphone access in your browser.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send recorded audio to backend Speech-to-Text
  const processAudioInput = async (blob: Blob) => {
    setIsLoading(true);
    const toastId = toast.loading(language === 'te' ? 'వాయిస్ విశ్లేషిస్తోంది...' : 'Transcribing voice audio...');

    try {
      const formData = new FormData();
      formData.append('file', blob, 'voice.webm');
      formData.append('language', language);

      const res = await api.post('/assistant/speech-to-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.dismiss(toastId);
      const transcript = res.data?.transcript;
      if (transcript && transcript.trim()) {
        toast.success(language === 'te' ? 'వాయిస్ గుర్తించబడింది!' : 'Voice recognized!');
        await sendMessage(transcript.trim(), true);
      } else {
        toast.error(language === 'te' ? 'వాయిస్ స్పష్టంగా లేదు, దయచేసి మళ్ళీ చెప్పండి.' : 'No speech detected. Please speak closer to microphone.');
      }
    } catch (err) {
      toast.dismiss(toastId);
      console.error('STT error:', err);
      toast.error('Could not process speech. Please try again or type below.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send text message (and optionally auto-play response if sent via voice)
  const sendMessage = async (textToSend: string, isVoiceQuery: boolean = false) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
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

      // If user asked via voice, auto-play response
      if (isVoiceQuery) {
        setTimeout(() => {
          playAudioResponse(responseText, newMsgId);
        }, 300);
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
      {/* Floating Action Button */}
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

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 w-80 sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 z-50 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`} 
        style={{ height: '560px', maxHeight: 'calc(100vh - 48px)' }}
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
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                  Voice + Text
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 leading-tight">
                {language === 'te' ? 'తెలంగాణ వ్యవసాయ సహాయకుడు' : 'Telangana Market Intelligence'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle Button */}
            <button
              onClick={() => {
                const newLang = language === 'en' ? 'te' : 'en';
                setLanguage(newLang);
                toast.success(newLang === 'te' ? 'భాష: తెలుగు' : 'Language: English');
              }}
              className="px-2 py-1 bg-emerald-800 hover:bg-emerald-900 text-xs rounded-md font-medium text-emerald-100 flex items-center gap-1 transition-colors border border-emerald-600"
              title="Toggle Language (English / తెలుగు)"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>

            <button 
              onClick={() => {
                stopAudio();
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
              <div className={`max-w-[86%] p-3 rounded-2xl relative group ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-sm shadow-sm' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-gray-100/30">
                  <span className={`text-[10px] ${msg.role === 'user' ? 'text-emerald-100' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Speaker Button on Assistant Messages */}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => playAudioResponse(msg.content, msg.id)}
                      disabled={audioLoadingId === msg.id}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        playingAudioId === msg.id
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-50'
                      }`}
                      title={playingAudioId === msg.id ? "Stop listening" : "Listen in voice (Sarvam AI)"}
                    >
                      {audioLoadingId === msg.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : playingAudioId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-red-600" />
                          <span className="text-[10px] text-red-600 font-semibold">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px]">Listen</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing / Processing Loader */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>
                  {language === 'te' ? 'సమాధానం విశ్లేషిస్తోంది...' : 'Checking market intelligence...'}
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

        {/* Recording active overlay bar */}
        {isRecording && (
          <div className="bg-red-50 border-t border-red-200 px-4 py-2 flex items-center justify-between text-red-700 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
              <span className="text-xs font-semibold">
                {language === 'te' ? 'వాయిస్ రికార్డ్ అవుతోంది...' : 'Recording Voice...'} ({recordingSeconds}s)
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="px-2.5 py-0.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
            >
              Done / Send
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
          {/* Audio Microphone Record Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              isRecording
                ? 'bg-red-600 text-white shadow-lg shadow-red-200 animate-bounce'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
            }`}
            title={isRecording ? "Click to stop and send" : "Click to speak (Telugu / English)"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isRecording 
                ? (language === 'te' ? "వాయిస్ రికార్డ్ అవుతోంది..." : "Listening...") 
                : (language === 'te' ? "ధరలు, మార్కెట్ల గురించి అడగండి..." : "Ask prices, where to sell, etc...")
            }
            className="flex-1 px-3.5 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm disabled:bg-gray-50"
            disabled={isLoading || isRecording}
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
