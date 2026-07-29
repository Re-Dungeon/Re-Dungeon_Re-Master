import { useState, useEffect, useCallback } from 'react';
import { getUserPermissions } from 'service/storage';

const usePermissions = currentUser => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [allowedUniversos, setAllowedUniversos] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    Promise.resolve().then(async () => {
      if (!currentUser) {
        setIsAdmin(false);
        setAllowedUniversos([]);
        setLoadingPermissions(false);
        return;
      }

      setLoadingPermissions(true);
      try {
        const { isAdmin: admin, universos } = await getUserPermissions(
          currentUser.uid,
        );
        setIsAdmin(admin);
        setAllowedUniversos(universos);
      } catch {
        setIsAdmin(false);
        setAllowedUniversos([]);
      } finally {
        setLoadingPermissions(false);
      }
    });
  }, [currentUser]);

  /**
   * Retorna true se o usuário pode criar/editar/deletar em pelo menos um universo.
   * Preparado para reutilização em Classes, NPCs e Mesas quando eles ganharem campo universo.
   */
  const canCreate = useCallback(
    () => isAdmin || allowedUniversos.length > 0,
    [isAdmin, allowedUniversos],
  );

  /**
   * Retorna true se o usuário pode escrever em um universo específico, ou,
   * caso um array seja passado (entidades que pertencem a mais de um
   * universo, ex.: Aptidões), se pode escrever em pelo menos um deles.
   * @param {string|string[]} universoId - ID (ou lista de ids) de documento(s) na coleção Universo
   */
  const canWrite = useCallback(
    universoId => {
      if (isAdmin) return true;
      if (Array.isArray(universoId)) {
        return universoId.some(id => allowedUniversos.includes(id));
      }
      return allowedUniversos.includes(universoId);
    },
    [isAdmin, allowedUniversos],
  );

  return { isAdmin, allowedUniversos, loadingPermissions, canCreate, canWrite };
};

export default usePermissions;
