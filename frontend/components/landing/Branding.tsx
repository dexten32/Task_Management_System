import React from "react";
import Image from "next/image";
import { Shield, CheckCircle2, Sparkles } from "lucide-react";

interface Feature {
  icon: any;
  text: string;
}

const Branding = ({ features }: { features: Feature[] }) => {
  return (
    <div className="flex-1 text-center md:text-left mb-0 md:mb-0 shrink-0">
      {/* Mobile Logo */}
      <div className="md:hidden flex flex-col items-center justify-center min-h-[18vh]">
        <div className="relative">
          <div className="relative rounded-2xl">
            <Image src="/cynox_logo.svg" alt="Cynox Logo" width={120} height={120} className="h-30 w-30 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">Cynox</h1>
          <div className="text-xs text-gray-500 tracking-widest font-medium">SECURITY</div>
        </div>
      </div>

      {/* Desktop Branding */}
      <div className="hidden md:block select-none">
        <div className="flex items-center space-x-2 mb-2 justify-center md:justify-start group">
          <div className="relative">
            <div className="relative rounded-2xl transform hover:scale-110 transition-all duration-300">
              <Image src="/cynox_logo.svg" alt="Cynox Logo" width={160} height={160} className="h-40 w-40 text-white" />
            </div>
          </div>
          <div>
            <span className="text-5xl font-bold bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">Cynox</span>
            <div className="text-xs text-gray-500 tracking-widest font-medium">SECURITY</div>
          </div>
        </div>

        <div className="max-w-xl mx-auto md:mx-0 mb-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            ORGANIZE.
                    <span className="block bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">PRIORITIZE. ACHIEVE.</span>
          </h2>
          <p className="text-lg text-gray-600">Smart solutions to manage what matters most.</p>
        </div>

        {/* Features */}
        <div className="space-y-4 max-w-xl">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-gray-700 font-semibold">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Branding;
