import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { useAuth } from 'context/AuthContext';
import { getRmCampanhas } from 'service/storage';

const CAMPANHA_ATIVA_STORAGE_KEY = 'remaster_campanha_ativa_id';

const CampanhaContext = createContext(null);

/**
 * Mantém a lista de Campanhas do mestre logado e qual delas está "ativa"
 * (selecionada para a sessão atual). Qual Campanha está ativa é estado
 * puramente client-side (persistido em localStorage), não um campo Firestore
 * — dispositivos diferentes podem legitimamente estar olhando para campanhas
 * diferentes.
 */
export const CampanhaProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [campanhas, setCampanhas] = useState([]);
  const [loadingCampanhas, setLoadingCampanhas] = useState(true);
  const [campanhaAtivaId, setCampanhaAtivaIdState] = useState(
    () => localStorage.getItem(CAMPANHA_ATIVA_STORAGE_KEY) || null,
  );

  const recarregarCampanhas = useCallback(async () => {
    if (authLoading) return;
    if (!currentUser) {
      setCampanhas([]);
      setLoadingCampanhas(false);
      return;
    }
    setLoadingCampanhas(true);
    try {
      const todas = await getRmCampanhas();
      setCampanhas(todas.filter(c => c.mestreId === currentUser.uid));
    } finally {
      setLoadingCampanhas(false);
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    // Envolvido em Promise.resolve().then() (mesmo padrão de
    // hooks/usePermissions.js) para que o corpo do efeito não chame setState
    // sincronamente — recarregarCampanhas seta estado antes do primeiro
    // await em alguns ramos (ex.: usuário deslogado).
    Promise.resolve().then(() => recarregarCampanhas());
  }, [recarregarCampanhas]);

  const setCampanhaAtiva = useCallback(id => {
    setCampanhaAtivaIdState(id);
    if (id) {
      localStorage.setItem(CAMPANHA_ATIVA_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(CAMPANHA_ATIVA_STORAGE_KEY);
    }
  }, []);

  const campanhaAtiva = useMemo(
    () => campanhas.find(c => c.id === campanhaAtivaId) ?? null,
    [campanhas, campanhaAtivaId],
  );

  // Se o id salvo não corresponde a nenhuma campanha carregada (removida, ou
  // de outro usuário), limpa a seleção em vez de manter um id "fantasma".
  useEffect(() => {
    if (!loadingCampanhas && campanhaAtivaId && !campanhaAtiva) {
      Promise.resolve().then(() => setCampanhaAtiva(null));
    }
  }, [loadingCampanhas, campanhaAtivaId, campanhaAtiva, setCampanhaAtiva]);

  const value = useMemo(
    () => ({
      campanhas,
      loadingCampanhas,
      campanhaAtivaId,
      campanhaAtiva,
      setCampanhaAtiva,
      recarregarCampanhas,
    }),
    [
      campanhas,
      loadingCampanhas,
      campanhaAtivaId,
      campanhaAtiva,
      setCampanhaAtiva,
      recarregarCampanhas,
    ],
  );

  return (
    <CampanhaContext.Provider value={value}>
      {children}
    </CampanhaContext.Provider>
  );
};

CampanhaProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useCampanha = () => useContext(CampanhaContext);
