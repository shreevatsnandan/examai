import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Link 
        href="/Dashboard" 
        className="
          bg-green-600 
          hover:bg-green-700 
          text-white 
          font-medium 
          py-3 px-6 
          rounded-lg 
          shadow-md 
          transition-colors 
          duration-300
          text-center
        "
      >
        Create your first question paper
      </Link>
    </div>
  );
}