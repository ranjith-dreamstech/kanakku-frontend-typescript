// LoginPage.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux'; // Import Redux hooks
import { loginUser } from '../../../store/auth/authSlice';
import type {RootState, AppDispatch}  from '../../../store';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('admin@dreamstechnologies.com');
  const [password, setPassword] = useState<string>('Demo123$');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true); // Consider using this with Redux Persist later
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Use useSelector to get state from Redux store
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);
  // Use useDispatch to dispatch actions
  const dispatch: AppDispatch = useDispatch(); 
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard'); // Redirect on successful login
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    // Dispatch the loginUser async thunk
    const resultAction = await dispatch(loginUser({ email, password }));

    // Check if the login was successful (fulfilled action)
    if (loginUser.fulfilled.match(resultAction)) {
      navigate('/'); // Redirect on successful login
    }
    // Error handling is managed by the Redux state (error field)
  };

  const handleCopy = (): void => {
    const credentials = `Email: admin@dreamstechnologies.com, Password: Demo123$`;
    const textArea = document.createElement("textarea");
    textArea.value = credentials;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white font-sans">
      <div className="w-full max-w-lg p-8 md:p-12 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="flex justify-center mb-4">
            <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-2xl font-bold ml-2 text-gray-800 self-center">Kanakku</span>
        </div>
        
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Login</h1>
            <p className="text-gray-500 mt-2">Access to our dashboard</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-lg" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 mt-1 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 mt-1 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-purple-600 hover:text-purple-500">
                Forgot Password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 text-lg font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="font-semibold text-gray-800 mb-2">Login Info:</p>
            <div className="flex justify-between items-center text-sm text-gray-600">
                <div>
                    <p><span className="font-medium">Email:</span> admin@dreamstechnologies.com</p>
                    <p><span className="font-medium">Password:</span> Demo123$</p>
                </div>
                <button onClick={handleCopy} className="p-2 text-gray-500 hover:text-purple-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {isCopied ? <Check className="text-green-500" size={20} /> : <Copy size={20} />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;