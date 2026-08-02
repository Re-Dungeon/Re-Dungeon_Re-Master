import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmMissao, updateRmMissao } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import MissaoForm from './MissaoForm';
import { MISSAO_INITIAL_VALUES } from './missaoUtils';

const NovaMissao = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canWrite, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const missaoParaEditar = location.state?.missao ?? null;
  const isEditing = Boolean(missaoParaEditar);

  const podeEscrever =
    !loadingCampanhas && campanhaAtiva && canWrite(campanhaAtiva.universoId);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever) navigate(ROUTE_PATHS.MISSOES);
  }, [
    loadingPermissions,
    loadingCampanhas,
    campanhaAtiva,
    podeEscrever,
    navigate,
  ]);

  const editInitialValues = missaoParaEditar
    ? { ...MISSAO_INITIAL_VALUES, ...missaoParaEditar }
    : MISSAO_INITIAL_VALUES;

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmMissao(missaoParaEditar.id, values);
    } else {
      await addRmMissao({
        ...values,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.MISSOES);
  };

  if (
    loadingCampanhas ||
    loadingPermissions ||
    !campanhaAtiva ||
    !podeEscrever
  ) {
    return null;
  }

  return (
    <Box className="page-container">
      <FormPageHeader
        titulo={isEditing ? 'Editar Missão' : 'Nova Missão'}
        subtitulo={
          isEditing
            ? `Editando "${missaoParaEditar.titulo}" em ${campanhaAtiva.nome}`
            : `Nova missão em ${campanhaAtiva.nome}`
        }
        onVoltar={() => navigate(ROUTE_PATHS.MISSOES)}
      />

      <MissaoForm
        initialValues={editInitialValues}
        campanhaId={campanhaAtiva.id}
        universoId={campanhaAtiva.universoId}
        mestreId={campanhaAtiva.mestreId}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.MISSOES)}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Missão'}
        idPrefix="nova-missao"
      />
    </Box>
  );
};

export default NovaMissao;
