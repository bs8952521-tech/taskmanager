import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ListTodo } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin ? { email, password } : { email, password, name };
      const { data } = await axios.post(endpoint, payload);
      
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(JSON.stringify(err.response.data.error));
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-background text-foreground font-sans select-none">
      <div className="flex-1 flex flex-col justify-center w-full max-w-sm p-6 sm:p-8">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl mx-auto mb-4 flex items-center justify-center text-white shadow-sm">
            <ListTodo size={24} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">TaskManager</h1>
          <p className="text-muted text-sm">{isLogin ? 'Welcome back! Please login to your account.' : 'Create an account to get started.'}</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 text-rose-500 p-3 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Full Name</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className="block w-full bg-input rounded-lg border border-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-muted"
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Email Address</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full bg-input rounded-lg border border-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-muted"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-1">Password</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full bg-input rounded-lg border border-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-muted"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-all mt-6 shadow-sm"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm">
          <p className="text-muted">
             {isLogin ? "Don't have an account? " : "Already have an account? "}
             <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-emerald-500 font-medium hover:text-emerald-600 transition-colors"
                type="button"
             >
                {isLogin ? 'Sign up' : 'Sign in'}
             </button>
          </p>
        </div>
      </div>
      <footer className="w-full pb-6 pt-4 flex items-center justify-center text-xs text-muted shrink-0">
        <span>Designed & Developed by Insha Quamar</span>
        <a href="https://got-theme-portfolio11.onrender.com" target="_blank" rel="noopener noreferrer" className="ml-2 flex items-center justify-center w-5 h-5 bg-emerald-500 text-white rounded font-bold text-[10px] hover:bg-emerald-600 transition-colors" title="Insha Quamar's Portfolio">
          iq
        </a>
      </footer>
    </div>
  );
}
