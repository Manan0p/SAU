"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ToastProvider";
type Message = {
  id: string;
  role: "user" | "model";
  content: string;
};

export default function AIChatbot() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      content: "Hi there! I'm UniWell AI. How can I help you with your health, medications, or booking a doctor today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          previousMessages: messages.filter(m => m.id !== "welcome").map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "model", content: data.reply },
      ]);
    } catch (error: any) {
      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-[360px] h-[500px] max-h-[80vh] bg-white border border-[#E6E8EA] rounded-2xl shadow-[0_12px_40px_rgba(25,28,30,0.12)] flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#00478D] to-[#005EB8] p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">UniWell AI</h3>
                  <p className="text-xs text-blue-100">Campus Health Assistant</p>
                </div>
              </div>
              <button 
                onClick={toggleChat}
                className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F7F9FB]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className={`p-1.5 rounded-full flex-shrink-0 ${
                    msg.role === "user" ? "bg-[#005EB8]/10 text-[#005EB8]" : "bg-[#005EB8]/10 text-[#005EB8]"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-sm max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#00478D] to-[#005EB8] text-white rounded-tr-sm"
                        : "bg-white text-[#191C1E] rounded-tl-sm shadow-[0_1px_4px_rgba(25,28,30,0.08)]"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-[#005EB8]/10 rounded-full text-[#005EB8]">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white text-[#424752] rounded-tl-sm shadow-[0_1px_4px_rgba(25,28,30,0.08)] flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#005EB8]" />
                    <span className="text-xs text-[#424752]">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-[#E6E8EA] bg-white">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about symptoms, doctors..."
                  className="bg-[#F7F9FB] border-[#E0E3E5] text-[#191C1E] text-sm focus-visible:ring-[#005EB8]"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  className="bg-gradient-to-r from-[#00478D] to-[#005EB8] text-white flex-shrink-0"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-br from-[#00478D] to-[#005EB8] text-white shadow-[0_4px_20px_rgba(0,94,184,0.4)] hover:shadow-[0_4px_28px_rgba(0,94,184,0.6)] transition-all z-50 flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </>
  );
}
