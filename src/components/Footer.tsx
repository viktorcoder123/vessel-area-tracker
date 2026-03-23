import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-3">
          <p className="font-semibold">Powered by Data Docked</p>
          <p className="text-sm flex items-center gap-1 opacity-90">
            Built with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> for maritime professionals
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/about" className="hover:underline">
              About
            </Link>
            <span className="opacity-50">|</span>
            <Link to="/help" className="hover:underline">
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
