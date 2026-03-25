import { useEffect, useState } from "react";
import logo from "../assets/logo.png";

export default function IntroAnimation({ onFinish }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            if (onFinish) onFinish();
        }, 7000); // 7 seconds total duration

        return () => clearTimeout(timer);
    }, [onFinish]);

    if (!visible) return null;

    const skipAnimation = () => {
        setVisible(false);
        if (onFinish) onFinish();
    };

    return (
        <>
            <style>{`
                @keyframes cardSequence {
                    0% { opacity: 0; transform: translateY(30px) scale(0.95); }
                    15% { opacity: 1; transform: translateY(0) scale(1); }
                    80% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-30px) scale(0.95); }
                }
                @keyframes scanMove {
                    0% { top: -5%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 105%; opacity: 0; }
                }
                @keyframes highlightText {
                    0% { background-color: #e5e7eb; box-shadow: none; }
                    40% { background-color: #00ffc8; box-shadow: 0 0 12px rgba(0, 255, 200, 0.5); }
                    100% { background-color: #e5e7eb; box-shadow: none; }
                }
                @keyframes logoReveal {
                    0% { opacity: 0; transform: scale(0.85); filter: drop-shadow(0 0 0px transparent); }
                    50% { opacity: 1; transform: scale(1.1); filter: drop-shadow(0 0 30px rgba(0, 255, 200, 0.7)); }
                    100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 15px rgba(0, 255, 200, 0.4)); }
                }
                @keyframes globalFadeOut {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .resume-card-wrapper {
                    animation: cardSequence 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                .scanner-line {
                    animation: scanMove 1.5s linear 0.4s both;
                }
            `}</style>

            <div
                className="fixed inset-0 bg-[#020202] flex items-center justify-center z-[9999] overflow-hidden"
                style={{ animation: 'globalFadeOut 0.4s ease-out 6.6s both' }}
            >
                {/* Resume Card Sequence */}
                <div className="resume-card-wrapper absolute flex items-center justify-center">
                    <div className="relative w-[280px] sm:w-[320px] h-[380px] sm:h-[420px] bg-white rounded-xl shadow-[0_0_40px_rgba(0,255,200,0.05),0_10px_30px_rgba(0,0,0,0.8)] p-6 sm:p-8 overflow-hidden flex flex-col">

                        {/* Scanner Line */}
                        <div
                            className="scanner-line absolute left-0 right-0 h-[3px] bg-[#00ffc8] z-20 pointer-events-none"
                            style={{ boxShadow: '0 0 15px #00ffc8, 0 0 30px #00ffc8, 0 -20px 25px rgba(0,255,200,0.2)' }}
                        />

                        {/* Card Content Skeleton */}
                        <div className="flex-1 w-full space-y-6 sm:space-y-8 mt-2">
                            {/* Header */}
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200" />
                                <div className="space-y-3 flex-1">
                                    <div className="h-3 w-3/4 rounded-full bg-gray-200" style={{ animation: 'highlightText 0.4s ease-in-out 0.5s both' }} />
                                    <div className="h-2 w-1/2 rounded-full bg-gray-200" style={{ animation: 'highlightText 0.4s ease-in-out 0.55s both' }} />
                                </div>
                            </div>

                            {/* Section 1 */}
                            <div className="space-y-3">
                                <div className="h-2 rounded-full bg-gray-200 w-full" style={{ animation: 'highlightText 0.4s ease-in-out 0.8s both' }} />
                                <div className="h-2 rounded-full bg-gray-200 w-5/6" style={{ animation: 'highlightText 0.4s ease-in-out 0.85s both' }} />
                                <div className="h-2 rounded-full bg-gray-200 w-4/6" style={{ animation: 'highlightText 0.4s ease-in-out 0.9s both' }} />
                                <div className="h-2 rounded-full bg-gray-200 w-11/12" style={{ animation: 'highlightText 0.4s ease-in-out 0.95s both' }} />
                            </div>

                            {/* Section 2 */}
                            <div className="space-y-3 mt-6">
                                <div className="h-2 rounded-full bg-gray-200 w-11/12" style={{ animation: 'highlightText 0.4s ease-in-out 1.2s both' }} />
                                <div className="h-2 rounded-full bg-gray-200 w-full" style={{ animation: 'highlightText 0.4s ease-in-out 1.25s both' }} />
                                <div className="h-2 rounded-full bg-gray-200 w-3/4" style={{ animation: 'highlightText 0.4s ease-in-out 1.3s both' }} />
                            </div>

                            {/* Section 3 */}
                            <div className="space-y-3 mt-6">
                                <div className="h-2 rounded-full bg-gray-200 w-full" style={{ animation: 'highlightText 0.4s ease-in-out 1.5s both' }} />
                                <div className="h-2 rounded-full bg-gray-200 w-2/3" style={{ animation: 'highlightText 0.4s ease-in-out 1.55s both' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logo Reveal */}
                <div
                    className="absolute flex items-center justify-center z-30 pointer-events-none w-full px-4"
                    style={{ animation: 'logoReveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 2.0s both' }}
                >
                    {/* The size is controlled by the 'w-11/12 max-w-4xl' classes below */}
                    <img src={logo} alt="Brand Logo" className="w-11/12 sm:w-4/5 max-w-5xl object-contain drop-shadow-2xl" />
                </div>

                {/* Skip Button */}
                <button
                    onClick={skipAnimation}
                    className="absolute bottom-8 right-8 text-gray-400 hover:text-white transition-colors duration-300 text-sm font-medium tracking-widest uppercase z-50 px-4 py-2"
                >
                    Skip &rarr;
                </button>
            </div>
        </>
    );
}