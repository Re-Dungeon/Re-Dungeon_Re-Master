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
 * @param {{ itemParaEditar: object|null, universoDoItem?: string|string[], routeOnDeny: string }} params
 */
const useEntityFormGuard = ({
  itemParaEditar,
  universoDoItem,
  routeOnDeny,
}) => {
  const navigate = useNavigate();
  const { canCreate, canWrite, isAdmin, allowedUniversos, loadingPermissions } =
    useAuth();
  const { universos, loadingUniversos } = useUniversos();
  const isEditing = Boolean(itemParaEditar);

  useEffect(() => {
    if (loadingPermissions) return;
    const allowed = isEditing ? canWrite(universoDoItem) : canCreate();
    if (!allowed) navigate(routeOnDeny);
  }, [
    loadingPermissions,
    isEditing,
    canWrite,
    canCreate,
    universoDoItem,
    navigate,
    routeOnDeny,
  ]);

  const universosFiltrados = isAdmin
    ? universos
    : universos.filter(u => allowedUniversos.includes(u.id));

  return { universos: universosFiltrados, loadingUniversos, isEditing };
};

export default useEntityFormGuard;
