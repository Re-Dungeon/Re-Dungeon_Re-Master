import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import useUniversos from './useUniversos';

const isUniversoDisponivelParaNovaAssociacao = universo =>
  universo?.ativo !== false;

const toArray = valor =>
  Array.isArray(valor) ? valor.filter(Boolean) : [valor].filter(Boolean);

/**
 * Encapsula o padrão repetido em toda página `Nova*`/`Novo*`: buscar os
 * universos (via `useUniversos`, com cache de módulo), filtrar por
 * `allowedUniversos`/`isAdmin` e redirecionar para `routeOnDeny` caso o
 * usuário não tenha permissão de criar (item novo) ou editar (item
 * existente, avaliado contra `universoDoItem`).
 * `bypassUniversoPermission` (usado só pela Campanha) troca a checagem de
 * `allowedUniversos` por posse (`mestreId` do item === uid do usuário) e
 * permite que a campanha em edição mantenha seu universo atual mesmo quando
 * ele foi desativado; em criação, a regra de `ativo !== false` continua
 * aplicada para impedir novas associações a universos inativos.
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

  const idsDoItemEmEdicao = new Set(
    (isEditing ? toArray(universoDoItem ?? itemParaEditar?.universoId) : []).map(
      id => String(id),
    ),
  );

  const universosFiltrados = universos.filter(universo => {
    const isUniversoHistorico = idsDoItemEmEdicao.has(String(universo.id));
    const isNovaAssociacaoValida = isUniversoDisponivelParaNovaAssociacao(universo);

    if (isEditing) {
      if (isUniversoHistorico) return true;
      if (!isNovaAssociacaoValida) return false;
    } else if (!isNovaAssociacaoValida) {
      return false;
    }

    if (bypassUniversoPermission || isAdmin) {
      return true;
    }

    return allowedUniversos.includes(universo.id);
  });

  return { universos: universosFiltrados, loadingUniversos, isEditing };
};

export default useEntityFormGuard;
