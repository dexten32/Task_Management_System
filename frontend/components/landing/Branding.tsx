import React from "react";
import { Shield, CheckCircle2, Sparkles, Hexagon } from "lucide-react";

interface Feature {
  icon: any;
  text: string;
}

const Branding = ({ features }: { features: Feature[] }) => {
  return (
    <div className="flex-1 text-center md:text-left mb-0 md:mb-0 shrink-0">
      {/* Mobile Logo */}
      <div className="md:hidden flex flex-col items-center justify-center min-h-[18vh]">
        <div className="relative mb-4">
          <div className="relative rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 shadow-lg">
            <Hexagon className="h-16 w-16 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">TaskSync</h1>
          <div className="text-xs text-muted-foreground tracking-widest font-medium">PLATFORM</div>
        </div>
      </div>

      {/* Desktop Branding */}
      <div className="hidden md:block select-none">
        <div className="flex items-center space-x-4 mb-6 justify-center md:justify-start group">
          <div className="relative">
            <div className="relative rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5 shadow-lg transform hover:scale-110 transition-all duration-300">
              <Hexagon className="h-20 w-20 text-white" />
            </div>
          </div>
          <div>
            <span className="text-5xl font-bold bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">TaskSync</span>
            <div className="text-xs text-muted-foreground tracking-widest font-medium">PLATFORM</div>
          </div>
        </div>

        <div className="max-w-xl mx-auto md:mx-0 mb-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            ORGANIZE.
                    <span className="block bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">PRIORITIZE. ACHIEVE.</span>
          </h2>
          <p className="text-lg text-muted-foreground">Smart solutions to manage what matters most.</p>
        </div>

        {/* Features */}
        <div className="space-y-4 max-w-xl">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 bg-background/60 backdrop-blur-sm p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="bg-linear-to-br from-blue-50/50 dark:from-blue-900/20 to-indigo-50/50 dark:to-indigo-900/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-foreground font-semibold">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Branding;
