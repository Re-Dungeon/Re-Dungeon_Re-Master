import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from 'service/firebase';
import usePermissions from 'hooks/usePermissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);
    const unsubscribe = onAuthStateChanged(auth, user => {
      clearTimeout(timeout);
      setCurrentUser(user);
      setLoading(false);
    });
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const login = useCallback(
    (email, password) => signInWithEmailAndPassword(auth, email, password),
    [],
  );

  const signup = useCallback(
    (email, password) => createUserWithEmailAndPassword(auth, email, password),
    [],
  );

  const loginWithGoogle = useCallback(
    () => signInWithPopup(auth, googleProvider),
    [],
  );

  const logout = useCallback(() => signOut(auth), []);

  const { isAdmin, allowedUniversos, loadingPermissions, canCreate, canWrite } =
    usePermissions(currentUser);

  const value = useMemo(
    () => ({
      currentUser,
      loading,
      login,
      signup,
      loginWithGoogle,
      logout,
      isAdmin,
      allowedUniversos,
      loadingPermissions,
      canCreate,
      canWrite,
    }),
    [
      currentUser,
      loading,
      login,
      signup,
      loginWithGoogle,
      logout,
      isAdmin,
      allowedUniversos,
      loadingPermissions,
      canCreate,
      canWrite,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
