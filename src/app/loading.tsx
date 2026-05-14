// app/loading.tsx
import React from "react";
import { Wallet } from "lucide-react";

const Loading = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="animate-bounce">
            <Wallet size={32} className="text-primary" />
          </div>
          <span className="text-4xl font-bold text-primary">
            Paynest
          </span>
        </div>

        <p className="text-muted-foreground mb-8">Loading your POS system...</p>

        {/* Animated Dots */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-2 w-2 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
