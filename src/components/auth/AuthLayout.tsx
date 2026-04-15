import loginBg from "@/assets/login-bg.svg";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="h-full flex bg-black">
      {/* Left — original Passwall background illustration, fills 50% */}
      <div className="relative w-1/2 shrink-0 overflow-hidden flex items-center justify-center">
        <img
          src={loginBg}
          alt=""
          className="w-full h-full object-contain"
        />
        {/* Right corner accent circle */}
        <svg
          className="absolute top-0 right-0 text-[#5707FF]"
          width="82"
          height="83"
          viewBox="0 0 82 83"
          fill="none"
        >
          <circle
            cx="82.2926"
            cy="0.29258"
            r="74.424"
            stroke="currentColor"
            strokeWidth="15.7372"
          />
        </svg>
      </div>

      {/* Right — form area */}
      <div className="w-1/2 flex flex-col items-center justify-center bg-black">
        <div className="w-full max-w-[350px] px-6">{children}</div>
      </div>
    </div>
  );
}
