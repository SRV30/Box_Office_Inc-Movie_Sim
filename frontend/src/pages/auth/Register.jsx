import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { GoogleLogin } from '@react-oauth/google';

import api, { persistAuthSession } from '../../api/axios';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFormValidation, required } from '../../hooks/useFormValidation';
import { useGoogleLoginMutation } from '../../features/auth/authApi';

import AuthLayout from '../../layouts/AuthLayout';
import AuthCard from '../../components/common/AuthCard';
import AuthInput from '../../components/common/AuthInput';

const rawGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const isGoogleAuthEnabled = Boolean(
  rawGoogleClientId &&
    rawGoogleClientId.trim() !== '' &&
    rawGoogleClientId !== 'placeholder-client-id' &&
    !rawGoogleClientId.includes('placeholder'),
);

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Async action state for form submission
  const { loading, error, execute } = useAsyncAction();

  // RTK Query hook for Google Auth
  const [googleLoginMutation, { isLoading }] = useGoogleLoginMutation();

  // Local state for the two-step Google sign-in workflow
  const [requiresStudio, setRequiresStudio] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [googleStudioName, setGoogleStudioName] = useState('');
  const [googleError, setGoogleError] = useState('');

  // Form validation setup
  const { values, errors, touched, setValue, validate } = useFormValidation(
    { username: '', email: '', password: '', studioName: '' },
    {
      username: (v) => {
        if (!v?.trim()) return 'Username is required';
        if (v.length < 3) return 'Username must be at least 3 characters';
        return '';
      },
      email: (v) => {
        if (!v?.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
          return 'Invalid email format';
        return '';
      },
      password: (v) => {
        if (!v) return 'Password is required';
        if (v.length < 6) return 'Password must be at least 6 characters';
        return '';
      },
      studioName: required('Studio name is required'),
    },
  );

  // Standard registration submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await execute(
        async () => {
          const res = await api.post('/auth/register', values);
          persistAuthSession({
            user: res.data.user,
            token: res.data.token,
            accessTokenExpiresAt: res.data.accessTokenExpiresAt,
          });
          navigate('/');
        },
        { errorMessage: 'Registration failed. Please try again.' },
      );
    } catch {
      // Error handled and surfaced via useAsyncAction error state
    }
  };

  // Google Sign-In initial callback handler
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleError('');
    try {
      const token = credentialResponse.credential;
      const res = await googleLoginMutation({ token }).unwrap();

      if (res.requiresStudio) {
        setPendingToken(token);
        setRequiresStudio(true);
      } else {
        persistAuthSession({
          user: res.user,
          token: res.token,
          accessTokenExpiresAt: res.accessTokenExpiresAt,
        });
        navigate('/');
      }
    } catch (err) {
      console.error('Google Auth Error:', err);
      setGoogleError('Google Registration Failed.');
    }
  };

  // Google Sign-In step 2: Studio creation handler
  const handleGoogleStudioSubmit = async (e) => {
    e.preventDefault();
    setGoogleError('');
    try {
      const res = await googleLoginMutation({
        token: pendingToken,
        studioName: googleStudioName,
      }).unwrap();

      persistAuthSession({
        user: res.user,
        token: res.token,
        accessTokenExpiresAt: res.accessTokenExpiresAt,
      });

      if (dispatch) {
        dispatch({ type: 'auth/setCredentials', payload: res });
      }

      navigate('/');
    } catch (err) {
      console.error('Failed to create studio:', err);
      setGoogleError('Failed to finish Google account creation.');
    }
  };

  return (
    <AuthLayout>
      <AuthCard title="Create Studio">
        {/* --- GOOGLE AUTH SECTION --- */}
        {isGoogleAuthEnabled && (
          <div className="mb-6 flex flex-col items-center">
            {!requiresStudio ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setGoogleError('Google Registration Failed')}
                theme="outline"
              />
            ) : (
              <form
                onSubmit={handleGoogleStudioSubmit}
                className="w-full flex flex-col gap-3 p-4 bg-slate-800 rounded-lg border border-violet-500"
              >
                <h3 className="text-white text-sm text-center">
                  Almost there! What should we call your studio?
                </h3>
                <input
                  type="text"
                  placeholder="e.g. DreamWorks"
                  value={googleStudioName}
                  onChange={(e) => setGoogleStudioName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-violet-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || !googleStudioName.trim()}
                  className="w-full bg-violet-600 hover:bg-violet-700 py-2 rounded-lg font-semibold text-white transition disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Finish Account'}
                </button>
              </form>
            )}

            {googleError && (
              <p className="text-red-400 text-xs mt-2 text-center">
                {googleError}
              </p>
            )}
          </div>
        )}

        {/* OR Divider */}
        {isGoogleAuthEnabled && !requiresStudio && (
          <div className="flex items-center mb-6">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="mx-4 text-slate-500 text-sm">OR</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>
        )}

        {/* Standard Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            label="Username"
            placeholder="Username"
            value={values.username}
            onChange={(e) => setValue('username', e.target.value)}
          />
          {touched.username && errors.username && (
            <p className="text-red-400 text-xs -mt-2">{errors.username}</p>
          )}

          <AuthInput
            label="Email"
            placeholder="Email"
            value={values.email}
            onChange={(e) => setValue('email', e.target.value)}
          />
          {touched.email && errors.email && (
            <p className="text-red-400 text-xs -mt-2">{errors.email}</p>
          )}

          <AuthInput
            label="Password"
            type="password"
            placeholder="Password"
            value={values.password}
            onChange={(e) => setValue('password', e.target.value)}
          />
          {touched.password && errors.password && (
            <p className="text-red-400 text-xs -mt-2">{errors.password}</p>
          )}

          <AuthInput
            label="Studio Name"
            placeholder="Studio Name"
            value={values.studioName}
            onChange={(e) => setValue('studioName', e.target.value)}
          />
          {touched.studioName && errors.studioName && (
            <p className="text-red-400 text-xs -mt-2">{errors.studioName}</p>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 py-3 rounded-xl font-semibold transition text-white"
          >
            {loading ? 'Creating...' : 'Create Studio'}
          </button>

          <p className="text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};

export default Register;
