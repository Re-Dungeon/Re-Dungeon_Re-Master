import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmCena, updateRmCena } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import CenaForm from './CenaForm';
import { CENA_INITIAL_VALUES } from './cenaUtils';

const NovaCena = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canWrite, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const cenaParaEditar = location.state?.cena ?? null;
  const isEditing = Boolean(cenaParaEditar);

  const podeEscrever =
    !loadingCampanhas && campanhaAtiva && canWrite(campanhaAtiva.universoId);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever) navigate(ROUTE_PATHS.CENAS);
  }, [
    loadingPermissions,
    loadingCampanhas,
    campanhaAtiva,
    podeEscrever,
    navigate,
  ]);

  const editInitialValues = cenaParaEditar
    ? { ...CENA_INITIAL_VALUES, ...cenaParaEditar }
    : CENA_INITIAL_VALUES;

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmCena(cenaParaEditar.id, values);
    } else {
      await addRmCena({
        ...values,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.CENAS);
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
        titulo={isEditing ? 'Editar Cena' : 'Nova Cena'}
        subtitulo={
          isEditing
            ? `Editando "${cenaParaEditar.titulo}" em ${campanhaAtiva.nome}`
            : `Nova cena em ${campanhaAtiva.nome}`
        }
        onVoltar={() => navigate(ROUTE_PATHS.CENAS)}
      />

      <CenaForm
        initialValues={editInitialValues}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.CENAS)}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Cena'}
        idPrefix="nova-cena"
        campanhaId={campanhaAtiva.id}
        universoId={campanhaAtiva.universoId}
        mestreId={campanhaAtiva.mestreId}
      />
    </Box>
  );
};

export default NovaCena;
