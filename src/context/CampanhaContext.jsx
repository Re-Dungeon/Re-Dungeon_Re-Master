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
import useAsyncEffect from 'hooks/useAsyncEffect';
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
  const [errorCampanhas, setErrorCampanhas] = useState(null);
  const [campanhaAtivaId, setCampanhaAtivaIdState] = useState(
    () => localStorage.getItem(CAMPANHA_ATIVA_STORAGE_KEY) || null,
  );

  const recarregarCampanhas = useCallback(async () => {
    if (authLoading) return;
    if (!currentUser) {
      setCampanhas([]);
      setLoadingCampanhas(false);
      setErrorCampanhas(null);
      return;
    }
    setLoadingCampanhas(true);
    setErrorCampanhas(null);
    try {
      const todas = await getRmCampanhas();
      setCampanhas(todas.filter(c => c.mestreId === currentUser.uid));
    } catch (err) {
      setErrorCampanhas(err);
    } finally {
      setLoadingCampanhas(false);
    }
  }, [currentUser, authLoading]);

  useAsyncEffect(recarregarCampanhas, [recarregarCampanhas]);

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
  // Pulado quando o carregamento falhou — um erro de rede não deve apagar a
  // seleção salva, só a ausência real da campanha na lista carregada.
  useEffect(() => {
    if (
      !loadingCampanhas &&
      !errorCampanhas &&
      campanhaAtivaId &&
      !campanhaAtiva
    ) {
      Promise.resolve().then(() => setCampanhaAtiva(null));
    }
  }, [
    loadingCampanhas,
    errorCampanhas,
    campanhaAtivaId,
    campanhaAtiva,
    setCampanhaAtiva,
  ]);

  const value = useMemo(
    () => ({
      campanhas,
      loadingCampanhas,
      errorCampanhas,
      campanhaAtivaId,
      campanhaAtiva,
      setCampanhaAtiva,
      recarregarCampanhas,
    }),
    [
      campanhas,
      loadingCampanhas,
      errorCampanhas,
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
