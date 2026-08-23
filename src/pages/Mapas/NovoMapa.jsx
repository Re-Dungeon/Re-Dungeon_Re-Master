import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmMapa, updateRmMapa } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import MapaForm from './MapaForm';
import { MAPA_INITIAL_VALUES } from './mapaUtils';

const NovoMapa = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const mapaParaEditar = location.state?.mapa ?? null;
  const isEditing = Boolean(mapaParaEditar);

  const podeEscrever =
    !loadingCampanhas &&
    campanhaAtiva &&
    (isAdmin || campanhaAtiva.mestreId === currentUser.uid);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever) navigate(ROUTE_PATHS.MAPAS);
  }, [
    loadingPermissions,
    loadingCampanhas,
    campanhaAtiva,
    podeEscrever,
    navigate,
  ]);

  const editInitialValues = mapaParaEditar
    ? { ...MAPA_INITIAL_VALUES, ...mapaParaEditar }
    : MAPA_INITIAL_VALUES;

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmMapa(mapaParaEditar.id, values);
    } else {
      await addRmMapa({
        ...values,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.MAPAS);
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
        titulo={isEditing ? 'Editar Mapa' : 'Novo Mapa'}
        subtitulo={
          isEditing
            ? `Editando "${mapaParaEditar.nome}" em ${campanhaAtiva.nome}`
            : `Novo mapa em ${campanhaAtiva.nome}`
        }
        onVoltar={() => navigate(ROUTE_PATHS.MAPAS)}
      />

      <MapaForm
        initialValues={editInitialValues}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.MAPAS)}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Mapa'}
        idPrefix="novo-mapa"
      />
    </Box>
  );
};

export default NovoMapa;
