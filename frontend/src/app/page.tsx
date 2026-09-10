import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Leaf, TrendingUp, Users, MessageSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600">
            <Leaf className="w-8 h-8" />
            <span className="text-xl font-bold text-emerald-900">AgriSetu</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-emerald-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Sell smarter. Earn more.
            </h1>
            <p className="text-xl text-emerald-100 mb-2">
              తెలంగాణ రైతులకు మార్కెట్ ఇంటెలిజెన్స్ (Market Intelligence for Telangana Farmers)
            </p>
            <p className="text-lg text-emerald-100 max-w-2xl mx-auto mb-8">
              Make data-driven decisions on when, where, and to whom to sell your produce using our AI-powered platform.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register?role=FARMER">
                <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold shadow-sm border border-emerald-100">
                  Join as Farmer
                </Button>
              </Link>
              <Link href="/register?role=BUYER">
                <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold shadow-sm border-2 border-emerald-300">
                  Join as Buyer
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How it helps you</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Market Intelligence</h3>
              <p className="text-gray-600">
                Compare APMC market prices, get sell/hold recommendations, and predict future prices to maximize your profits.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Buyer Matching</h3>
              <p className="text-gray-600">
                Skip middlemen. List your produce and receive direct offers from verified institutional buyers based on quality and location.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
              <p className="text-gray-600">
                Ask questions in Telugu about crop diseases, weather forecasts, or market trends using voice or text.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-300 py-8 text-center text-sm">
        <p>© 2026 AgriSetu - SIH Telangana Farmer Market Intelligence Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
