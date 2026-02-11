import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, MessageSquare, Minimize2, TriangleAlert } from 'lucide-react';
import { processUserMessage } from '../lib/ziyoAI';

const ZiyoChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('ziyo_chat_history');
        return saved ? JSON.parse(saved) : [
            { id: 1, text: "Assalomu alaykum! Men Ziyo - Ziotto tizimining aqlli yordamchisiman. Ombor holatini bilish uchun 'Omborda nima kam?' deb yozishingiz mumkin.", sender: 'bot', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasAlert, setHasAlert] = useState(false); // Global alert state
    const messagesEndRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('ziyo_chat_history', JSON.stringify(messages));
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newUserMsg = {
            id: Date.now(),
            text: input,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInput('');
        setIsTyping(true);

        // Process message with ZiyoAI
        try {
            const response = await processUserMessage(input);
            console.log("Ziyo response:", response); // Debug

            setTimeout(() => {
                const botResponse = {
                    id: Date.now() + 1,
                    text: response.text,
                    sender: 'bot',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, botResponse]);
                setHasAlert(response.hasAlert || false);
                setIsTyping(false);
            }, 1000); // Small delay for natural feel
        } catch (error) {
            console.error("Chat error:", error);
            setIsTyping(false);
        }
    };

    return (
        <div className={`fixed z-50 flex flex-col items-end pointer-events-none transition-all duration-300
            ${isOpen ? 'inset-0 bg-black/20 sm:bg-transparent sm:bottom-6 sm:right-6 sm:inset-auto' : 'bottom-4 right-4 sm:bottom-6 sm:right-6'}
        `}>
            {/* Chat Window */}
            <div
                className={`
                    pointer-events-auto
                    transition-all duration-300 ease-in-out transform origin-bottom-right
                    ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}
                    w-full h-[85vh] sm:w-[380px] sm:h-[500px]
                    fixed bottom-0 left-0 right-0 sm:static sm:mb-0
                    bg-white sm:bg-white/90 sm:backdrop-blur-xl border-t sm:border border-white/40
                    rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] sm:shadow-2xl overflow-hidden flex flex-col
                `}
            >
                {/* Header */}
                <div className={`
                    ${hasAlert ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'} 
                    p-4 flex items-center justify-between shrink-0 transition-colors duration-500
                    rounded-t-[2rem]
                `}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 relative">
                            <Bot className="text-white" size={24} />
                            {hasAlert && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg leading-none">Ziyo AI</h3>
                            <span className="text-indigo-100 text-xs flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${hasAlert ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
                                {hasAlert ? 'Diqqat Talab' : 'Online'}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white">
                            <Minimize2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent bg-gray-50/50 sm:bg-transparent">
                    {messages.map((msg) => {
                        const isUser = msg.sender === 'user';
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`
                                        max-w-[85%] p-3.5 rounded-2xl relative group
                                        ${isUser
                                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-lg shadow-indigo-500/20'
                                            : (hasAlert && msg.text.includes('kamchilik') ? 'bg-red-50 border border-red-100 text-red-900' : 'bg-white border border-gray-100 text-gray-900') + ' rounded-tl-none shadow-sm'
                                        }
                                    `}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                                    <span className={`text-[10px] absolute -bottom-4 ${isUser ? 'right-0 text-gray-400' : 'left-0 text-gray-400'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                        {msg.time}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-0"></span>
                                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-150"></span>
                                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-300"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 sm:bg-white/50 sm:backdrop-blur-sm shrink-0 pb-safe sm:pb-3">
                    <div className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Savolingizni yozing..."
                            style={{ color: '#000000' }}
                            className="w-full bg-gray-50 sm:bg-white border border-gray-200 pl-4 pr-12 py-3.5 sm:py-3 rounded-[1.25rem] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-base sm:text-sm font-black text-black placeholder:text-gray-500 shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="absolute right-1.5 p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </form>
            </div>

            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className={`
                        group pointer-events-auto relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 
                        ${hasAlert ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-600/30' : 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-indigo-600/30'}
                        rounded-2xl sm:rounded-[1.5rem] shadow-2xl hover:scale-110 hover:-translate-y-1 transition-all duration-300
                    `}
                >
                    <div className="absolute inset-0 rounded-[1.5rem] bg-white/20 blur-md group-hover:blur-lg transition-all opacity-0 group-hover:opacity-100"></div>
                    {hasAlert ? <TriangleAlert className="text-white relative z-10" size={28} /> : <Bot className="text-white relative z-10" size={28} />}

                    <span className="absolute -top-1 -right-1 flex h-3 w-3 sm:h-4 sm:w-4">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${hasAlert ? 'bg-yellow-400' : 'bg-red-400'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-full w-full ${hasAlert ? 'bg-yellow-500' : 'bg-red-500'} border-2 border-white`}></span>
                    </span>
                </button>
            )}
        </div>
    );
};

export default ZiyoChat;
