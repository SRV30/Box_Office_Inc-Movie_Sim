import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { isRefreshSessionRejected, refreshAuthSession } from "../api/axios";
import { logout } from "../features/auth/authSlice";
import api from "../api/axios";
import ErrorBoundary from "../components/common/ErrorBoundary";

// Persists across route navigations (module stays loaded once per session)
let studioProfileFetched = false;

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { token } = useSelector((state) => state.auth);
  const [checkingSession, setCheckingSession] = useState(!token);
  const [sessionRecoveryError, setSessionRecoveryError] = useState(false);
  const [sessionRejected, setSessionRejected] = useState(false);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  // Guard: wait for studio data to load before rendering child routes
  const [studioLoading, setStudioLoading] = useState(!!token && !studioProfileFetched);
  const [studioLoaded, setStudioLoaded] = useState(false);

  // Reset studio profile fetch flag when token is cleared (logout)
  useEffect(() => {
    if (!token) {
      studioProfileFetched = false;
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const recoverSession = async () => {
      if (token) {
        setCheckingSession(false);
        setSessionRecoveryError(false);
        return;
      }

      try {
        setCheckingSession(true);
        setSessionRecoveryError(false);
        await refreshAuthSession();
      } catch (error) {
        console.error(error);

        if (isRefreshSessionRejected(error)) {
          dispatch(logout());
          setSessionRejected(true);
          return;
        }

        setSessionRecoveryError(true);
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    recoverSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch, recoveryAttempt, token]);

  // After session is confirmed, pre-fetch studio profile so child routes
  // don't flash with empty state on hard refresh.
  useEffect(() => {
    let isMounted = true;
    if (!token || studioProfileFetched) return;

    const loadStudioData = async () => {
      setStudioLoading(true);
      try {
        await api.get("/studios/profile");
        studioProfileFetched = true;
      } catch {
        // Non-fatal: if the studio fetch fails we still proceed.
        // The individual page will show its own error state.
      } finally {
        if (isMounted) {
          setStudioLoading(false);
          setStudioLoaded(true);
        }
      }
    };

    loadStudioData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-slate-300">
        Restoring session...
      </div>
    );
  }

  if (studioLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-slate-300">
        Loading your studio...
      </div>
    );
  }

  if (sessionRecoveryError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#020617] text-slate-300">
        <p>Unable to restore your session right now. Check your connection and try again.</p>
        <button
          onClick={() => {
            setSessionRecoveryError(false);
            setCheckingSession(true);
            setRecoveryAttempt((attempt) => attempt + 1);
          }}
          className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          Retry Session Restore
        </button>
      </div>
    );
  }

  if (sessionRejected || !localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ErrorBoundary fallbackTitle="Page crashed" key={location.pathname}>
      {children}
    </ErrorBoundary>
  );
};

export default ProtectedRoute;
