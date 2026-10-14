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
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
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
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(
    async (email, password, keepConnected = true) => {
      const persistence = keepConnected
        ? browserLocalPersistence
        : browserSessionPersistence;

      await setPersistence(auth, persistence);
      return signInWithEmailAndPassword(auth, email, password);
    },
    [],
  );

  const signup = useCallback(
    (email, password) => createUserWithEmailAndPassword(auth, email, password),
    [],
  );

  const resetPassword = useCallback(
    email => sendPasswordResetEmail(auth, email),
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
      resetPassword,
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
      resetPassword,
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
