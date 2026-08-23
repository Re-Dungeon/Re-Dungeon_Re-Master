import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import useUniversos from './useUniversos';

/**
 * Encapsula o padrão repetido em toda página `Nova*`/`Novo*`: buscar os
 * universos (via `useUniversos`, com cache de módulo), filtrar por
 * `allowedUniversos`/`isAdmin` e redirecionar para `routeOnDeny` caso o
 * usuário não tenha permissão de criar (item novo) ou editar (item
 * existente, avaliado contra `universoDoItem`).
 * `bypassUniversoPermission` (usado só pela Campanha) troca a checagem de
 * `allowedUniversos` por posse (`mestreId` do item === uid do usuário) e
 * mostra todos os universos no lugar de filtrar — qualquer usuário
 * autenticado pode criar/editar uma Campanha em qualquer universo.
 * @param {{ itemParaEditar: object|null, universoDoItem?: string|string[], routeOnDeny: string, bypassUniversoPermission?: boolean }} params
 */
const useEntityFormGuard = ({
  itemParaEditar,
  universoDoItem,
  routeOnDeny,
  bypassUniversoPermission = false,
}) => {
  const navigate = useNavigate();
  const {
    currentUser,
    canCreate,
    canWrite,
    isAdmin,
    allowedUniversos,
    loadingPermissions,
  } = useAuth();
  const { universos, loadingUniversos } = useUniversos();
  const isEditing = Boolean(itemParaEditar);

  useEffect(() => {
    if (loadingPermissions) return;
    const allowed = bypassUniversoPermission
      ? isAdmin || !isEditing || itemParaEditar?.mestreId === currentUser?.uid
      : isEditing
        ? canWrite(universoDoItem)
        : canCreate();
    if (!allowed) navigate(routeOnDeny);
  }, [
    loadingPermissions,
    isEditing,
    canWrite,
    canCreate,
    universoDoItem,
    navigate,
    routeOnDeny,
    bypassUniversoPermission,
    isAdmin,
    itemParaEditar,
    currentUser,
  ]);

  const universosFiltrados =
    bypassUniversoPermission || isAdmin
      ? universos
      : universos.filter(u => allowedUniversos.includes(u.id));

  return { universos: universosFiltrados, loadingUniversos, isEditing };
};

export default useEntityFormGuard;
